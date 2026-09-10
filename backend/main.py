import asyncio
from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect
from datetime import datetime
from collections import defaultdict
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from apscheduler.schedulers.background import BackgroundScheduler
from contextlib import asynccontextmanager

import models, database, fetcher, math_engine
from database import engine, get_db
from ws_manager import manager as ws_manager

models.Base.metadata.create_all(bind=engine)

scheduler = BackgroundScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Give the WS manager access to the running event loop so the
    # synchronous fetcher thread can schedule async broadcasts.
    ws_manager.set_loop(asyncio.get_running_loop())
    scheduler.add_job(fetcher.fetch_and_store_results, 'interval', seconds=2)
    scheduler.start()
    yield
    scheduler.shutdown()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_loss_streak_stats(logs, type_str, window_size):
    ev = [x for x in logs if getattr(x, f"{type_str}_status") in ('WIN', 'LOSS')][:window_size]
    runs = []
    r = 0
    for x in reversed(ev):
        st = getattr(x, f"{type_str}_status")
        if st == 'LOSS':
            r += 1
        elif st == 'WIN':
            if r > 0:
                runs.append(r)
                r = 0
    if r > 0:
        runs.append(r)
    
    counts = {}
    for n in runs:
        counts[n] = counts.get(n, 0) + 1
        
    return {
        "n": len(ev),
        "losses": sum(1 for x in ev if getattr(x, f"{type_str}_status") == 'LOSS'),
        "runs": runs,
        "counts": counts,
        "max": max(runs) if runs else 0
    }

@app.post("/api/reset")
def reset_engine(timer: str = "30S"):
    db = next(get_db())
    
    # Reset EngineState
    state = db.query(models.EngineState).filter(models.EngineState.timer_type == timer).first()
    if state:
        state.bs_level = 1
        state.rg_level = 1
        state.bs_shield_cooldown = 0
        state.rg_shield_cooldown = 0
        state.bs_shield_armed = True
        state.rg_shield_armed = True
        state.bs_shield_recovery = False
        state.rg_shield_recovery = False
        state.gaps = 0
        state.missed_rounds = 0
        state.last_issue = None
        state.fresh_baseline_issue = None
        
    # Delete prediction logs and pending prediction for this timer
    db.query(models.PredictionLog).filter(models.PredictionLog.timer_type == timer).delete()
    db.query(models.PendingPrediction).filter(models.PendingPrediction.timer_type == timer).delete()
    
    db.commit()
    return {"status": "success", "message": "Engine reset successfully. History preserved."}

@app.websocket("/api/ws")
async def websocket_endpoint(ws: WebSocket, timer: str = "30S"):
    await ws_manager.connect(ws, timer)
    try:
        while True:
            # Keep the connection alive; client can send pings / we just read
            await ws.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(ws, timer)
    except Exception:
        ws_manager.disconnect(ws, timer)

@app.get("/api/state")
def get_engine_state(timer: str = "30S", db: Session = Depends(get_db)):
    results = db.query(models.WinGoResult).filter(models.WinGoResult.timer_type == timer).order_by(models.WinGoResult.issue.desc()).limit(1000).all()
    results_list = [{"issue": r.issue, "num": r.num, "sourceTime": r.source_time} for r in reversed(results)]
    
    state = db.query(models.EngineState).filter(models.EngineState.timer_type == timer).first()
    state_dict = {}
    if state:
        state_dict = {
            "bsLevel": state.bs_level,
            "rgLevel": state.rg_level,
            "bsShieldCooldown": state.bs_shield_cooldown,
            "rgShieldCooldown": state.rg_shield_cooldown,
            "gaps": state.gaps,
            "missedRounds": state.missed_rounds
        }
        
    pending = db.query(models.PendingPrediction).filter(models.PendingPrediction.timer_type == timer).order_by(models.PendingPrediction.created_at.desc()).first()
    pending_dict = None
    if pending:
        all_nums = [r.num for r in reversed(results)]
        h_slice = all_nums[-300:] if all_nums else []
        bs_base_res = math_engine.bs_base(h_slice)
        rg_base_res = math_engine.rg_base(h_slice)
        bs_reg = math_engine.bs_regime(h_slice)
        rg_reg = math_engine.rg_regime(h_slice)
        
        pending_dict = {
            "issue": pending.issue,
            "bsPred": pending.bs_pred,
            "rgPred": pending.rg_pred,
            "bsLayer": pending.bs_layer,
            "rgLayer": pending.rg_layer,
            "bsQuality": pending.bs_quality,
            "rgQuality": pending.rg_quality,
            "bsRegime": bs_reg,
            "rgRegime": rg_reg,
            "bsScoreB": round(bs_base_res.get("B", 0), 1),
            "bsScoreS": round(bs_base_res.get("S", 0), 1),
            "rgScoreR": round(rg_base_res.get("scores", [0,0,0])[0], 1),
            "rgScoreG": round(rg_base_res.get("scores", [0,0,0])[1], 1),
            "rgScoreV": round(rg_base_res.get("scores", [0,0,0])[2], 1)
        }
        
    logs = db.query(models.PredictionLog).filter(models.PredictionLog.timer_type == timer).order_by(models.PredictionLog.id.desc()).limit(1000).all()
    
    windows = [100, 200, 300, 500, 1000, 999999]
    loss_stats = {
        "bs": [get_loss_streak_stats(logs, "bs", w) for w in windows],
        "rg": [get_loss_streak_stats(logs, "rg", w) for w in windows]
    }
    
    # Compute accuracy & regimes
    all_nums = [r.num for r in reversed(results)]
    bs_regime = math_engine.bs_regime(all_nums[-300:]) if all_nums else "BUILDING"
    rg_regime = math_engine.rg_regime(all_nums[-300:]) if all_nums else "BUILDING"
    
    bs_wfa = math_engine.bs_wfa(all_nums[-300:])
    rg_wfa = math_engine.rg_wfa(all_nums[-300:])
    
    bs_logs = [x for x in logs if x.bs_status in ('WIN', 'LOSS')]
    rg_logs = [x for x in logs if x.rg_status in ('WIN', 'LOSS')]
    both_logs = [x for x in logs if x.bs_status in ('WIN', 'LOSS') and x.rg_status in ('WIN', 'LOSS')]
    
    bs_acc = (sum(1 for x in bs_logs if x.bs_status == 'WIN') / len(bs_logs)) if bs_logs else 0
    rg_acc = (sum(1 for x in rg_logs if x.rg_status == 'WIN') / len(rg_logs)) if rg_logs else 0
    dual_acc = (sum(1 for x in both_logs if x.bs_status == 'WIN' and x.rg_status == 'WIN') / len(both_logs)) if both_logs else 0
    
    monitor_stats = {
        "totalVerified": len(results_list),
        "bsAcc": bs_acc,
        "rgAcc": rg_acc,
        "dualAcc": dual_acc,
        "bsRegime": bs_regime,
        "rgRegime": rg_regime,
        "gaps": state.gaps if state else 0,
        "missedRounds": state.missed_rounds if state else 0,
        "bsWfa": bs_wfa,
        "rgWfa": rg_wfa
    }
    
    logs_list = [{
        "period": l.period,
        "prediction": l.prediction,
        "bsPred": l.bs_pred,
        "rgPred": l.rg_pred,
        "actualSide": l.actual_side,
        "actualColour": l.actual_colour,
        "num": l.num,
        "bsStatus": l.bs_status,
        "rgStatus": l.rg_status,
        "bsLayer": l.bs_layer,
        "rgLayer": l.rg_layer,
        "bsQuality": l.bs_quality,
        "rgQuality": l.rg_quality,
        "time": l.time,
        "feedTime": l.feed_time
    } for l in logs[:180]]
    
    return {
        "results": results_list,
        "state": state_dict,
        "pending": pending_dict,
        "logs": logs_list,
        "lossStats": loss_stats,
        "monitorStats": monitor_stats
    }

@app.get("/api/history")
def get_history(timer: str = "30S", page: int = 1, limit: int = 50, db: Session = Depends(get_db)):
    offset = (page - 1) * limit
    total = db.query(models.PredictionLog).filter(models.PredictionLog.timer_type == timer).count()
    logs = db.query(models.PredictionLog).filter(models.PredictionLog.timer_type == timer).order_by(models.PredictionLog.id.desc()).offset(offset).limit(limit).all()
    
    logs_list = [{
        "period": l.period,
        "prediction": l.prediction,
        "bsPred": l.bs_pred,
        "rgPred": l.rg_pred,
        "actualSide": l.actual_side,
        "actualColour": l.actual_colour,
        "num": l.num,
        "bsStatus": l.bs_status,
        "rgStatus": l.rg_status,
        "bsLayer": l.bs_layer,
        "rgLayer": l.rg_layer,
        "bsQuality": l.bs_quality,
        "rgQuality": l.rg_quality,
        "time": l.time,
        "feedTime": l.feed_time
    } for l in logs]
    
    return {
        "data": logs_list,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": (total + limit - 1) // limit
    }

def calc_stats(logs):
    bs_wins = sum(1 for l in logs if l.bs_status == 'WIN')
    bs_losses = sum(1 for l in logs if l.bs_status == 'LOSS')
    rg_wins = sum(1 for l in logs if l.rg_status == 'WIN')
    rg_losses = sum(1 for l in logs if l.rg_status == 'LOSS')
    
    total_bs = bs_wins + bs_losses
    total_rg = rg_wins + rg_losses
    
    bs_win_rate = (bs_wins / total_bs * 100) if total_bs > 0 else 0
    rg_win_rate = (rg_wins / total_rg * 100) if total_rg > 0 else 0
    
    bs_profit = 0
    rg_profit = 0
    bs_current_level = 1
    rg_current_level = 1
    
    for l in reversed(logs):
        if l.bs_status in ['WIN', 'LOSS']:
            amt = 2 ** (bs_current_level - 1)
            if l.bs_status == 'WIN':
                bs_profit += amt
                bs_current_level = 1
            elif l.bs_status == 'LOSS':
                bs_profit -= amt
                bs_current_level = min(12, bs_current_level + 1)
                
        if l.rg_status in ['WIN', 'LOSS']:
            amt = 2 ** (rg_current_level - 1)
            if l.rg_status == 'WIN':
                rg_profit += amt
                rg_current_level = 1
            elif l.rg_status == 'LOSS':
                rg_profit -= amt
                rg_current_level = min(12, rg_current_level + 1)
                
    return {
        "bsWinRate": bs_win_rate,
        "rgWinRate": rg_win_rate,
        "bsProfit": bs_profit,
        "rgProfit": rg_profit,
        "totalProfit": bs_profit + rg_profit,
        "totalAnalyzed": len(logs)
    }

@app.get("/api/analytics")
def get_analytics(timer: str = "30S", db: Session = Depends(get_db)):
    base_logs = db.query(models.PredictionLog).filter(models.PredictionLog.timer_type == timer).order_by(models.PredictionLog.id.desc()).all()
    
    base_summary = calc_stats(base_logs)
    
    bs_layers = {}
    for l in base_logs:
        if l.bs_layer:
            if l.bs_layer not in bs_layers:
                bs_layers[l.bs_layer] = {'wins': 0, 'losses': 0}
            if l.bs_status == 'WIN': bs_layers[l.bs_layer]['wins'] += 1
            elif l.bs_status == 'LOSS': bs_layers[l.bs_layer]['losses'] += 1

    rg_layers = {}
    for l in base_logs:
        if l.rg_layer:
            if l.rg_layer not in rg_layers:
                rg_layers[l.rg_layer] = {'wins': 0, 'losses': 0}
            if l.rg_status == 'WIN': rg_layers[l.rg_layer]['wins'] += 1
            elif l.rg_status == 'LOSS': rg_layers[l.rg_layer]['losses'] += 1
            
    return {
        "summary": base_summary,
        "bsLayers": bs_layers,
        "rgLayers": rg_layers
    }

@app.get("/api/hourly-accuracy")
def get_hourly_accuracy(timer: str = "30S", db: Session = Depends(get_db)):
    base_logs = db.query(models.PredictionLog).filter(models.PredictionLog.timer_type == timer).all()
    
    hours_data = defaultdict(lambda: {
        "baseBsWins": 0, "baseBsTotal": 0,
        "baseRgWins": 0, "baseRgTotal": 0
    })
    
    for l in base_logs:
        if not l.time: continue
        hour = datetime.fromtimestamp(l.time / 1000).hour
        if l.bs_status in ['WIN', 'LOSS']:
            hours_data[hour]["baseBsTotal"] += 1
            if l.bs_status == 'WIN': hours_data[hour]["baseBsWins"] += 1
        if l.rg_status in ['WIN', 'LOSS']:
            hours_data[hour]["baseRgTotal"] += 1
            if l.rg_status == 'WIN': hours_data[hour]["baseRgWins"] += 1

    result = []
    for h in range(24):
        d = hours_data[h]
        result.append({
            "hour": f"{h:02d}:00",
            "baseBsWinRate": (d["baseBsWins"] / d["baseBsTotal"] * 100) if d["baseBsTotal"] > 0 else 0,
            "baseRgWinRate": (d["baseRgWins"] / d["baseRgTotal"] * 100) if d["baseRgTotal"] > 0 else 0,
            "baseSamples": max(d["baseBsTotal"], d["baseRgTotal"])
        })
        
    return result

@app.get("/api/hourly-pnl")
def get_hourly_pnl(timer: str = "30S", db: Session = Depends(get_db)):
    base_logs = db.query(models.PredictionLog).filter(models.PredictionLog.timer_type == timer).order_by(models.PredictionLog.id.desc()).all()
    
    hours_logs = defaultdict(list)
    for l in base_logs:
        if not l.time: continue
        hour = datetime.fromtimestamp(l.time / 1000).hour
        hours_logs[hour].append(l)
    
    result = []
    for h in range(24):
        logs_for_hour = hours_logs.get(h, [])
        stats = calc_stats(logs_for_hour)
        result.append({
            "hour": f"{h:02d}:00",
            "bsWins": sum(1 for l in logs_for_hour if l.bs_status == 'WIN'),
            "bsLosses": sum(1 for l in logs_for_hour if l.bs_status == 'LOSS'),
            "rgWins": sum(1 for l in logs_for_hour if l.rg_status == 'WIN'),
            "rgLosses": sum(1 for l in logs_for_hour if l.rg_status == 'LOSS'),
            "bsProfit": stats["bsProfit"],
            "rgProfit": stats["rgProfit"],
            "totalProfit": stats["totalProfit"],
            "samples": len(logs_for_hour)
        })
        
    return result

@app.get("/api/earning-history")
def get_earning_history(timer: str = "30S", page: int = 1, limit: int = 50, db: Session = Depends(get_db)):
    offset = (page - 1) * limit
    total = db.query(models.PredictionLog).filter(models.PredictionLog.timer_type == timer).count()
    
    # Fetch all logs ascending to compute running total accurately
    all_logs = db.query(models.PredictionLog).filter(models.PredictionLog.timer_type == timer).order_by(models.PredictionLog.id.asc()).all()
    
    bs_current_level = 1
    rg_current_level = 1
    running_total = 0
    
    bs_wins = 0
    rg_wins = 0
    
    enriched_logs = []
    for l in all_logs:
        bs_bet = 0
        bs_pnl = 0
        if l.bs_status in ['WIN', 'LOSS']:
            bs_bet = 2 ** (bs_current_level - 1)
            if l.bs_status == 'WIN':
                bs_pnl = bs_bet
                bs_current_level = 1
                bs_wins += 1
            elif l.bs_status == 'LOSS':
                bs_pnl = -bs_bet
                bs_current_level = min(12, bs_current_level + 1)
                
        rg_bet = 0
        rg_pnl = 0
        if l.rg_status in ['WIN', 'LOSS']:
            rg_bet = 2 ** (rg_current_level - 1)
            if l.rg_status == 'WIN':
                rg_pnl = rg_bet
                rg_current_level = 1
                rg_wins += 1
            elif l.rg_status == 'LOSS':
                rg_pnl = -rg_bet
                rg_current_level = min(12, rg_current_level + 1)
                
        game_pnl = bs_pnl + rg_pnl
        running_total += game_pnl
        
        enriched_logs.append({
            "period": l.period,
            "time": l.time,
            "bsPred": l.bs_pred,
            "rgPred": l.rg_pred,
            "bsStatus": l.bs_status,
            "rgStatus": l.rg_status,
            "bsBet": bs_bet,
            "rgBet": rg_bet,
            "bsPnl": bs_pnl,
            "rgPnl": rg_pnl,
            "gamePnl": game_pnl,
            "runningTotal": running_total,
            "num": l.num,
            "actualColour": l.actual_colour,
            "bsLayer": l.bs_layer,
            "rgLayer": l.rg_layer,
        })
        
    enriched_logs.reverse()
    paginated_logs = enriched_logs[offset:offset + limit]
    
    total_played_bs = sum(1 for x in all_logs if x.bs_status in ['WIN', 'LOSS'])
    total_played_rg = sum(1 for x in all_logs if x.rg_status in ['WIN', 'LOSS'])
    
    bs_win_rate = (bs_wins / total_played_bs * 100) if total_played_bs > 0 else 0
    rg_win_rate = (rg_wins / total_played_rg * 100) if total_played_rg > 0 else 0
    
    return {
        "data": paginated_logs,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": (total + limit - 1) // limit,
        "summary": {
            "runningTotal": running_total,
            "totalGames": total,
            "bsWinRate": bs_win_rate,
            "rgWinRate": rg_win_rate
        }
    }
