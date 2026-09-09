from fastapi import FastAPI, Depends
from datetime import datetime
from collections import defaultdict
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from apscheduler.schedulers.background import BackgroundScheduler
from contextlib import asynccontextmanager

import models, database, fetcher, math_engine
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

scheduler = BackgroundScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(fetcher.fetch_and_store_results, 'interval', seconds=5)
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
        pending_dict = {
            "issue": pending.issue,
            "bsPred": pending.bs_pred,
            "rgPred": pending.rg_pred,
            "bsLayer": pending.bs_layer,
            "rgLayer": pending.rg_layer,
            "bsQuality": pending.bs_quality,
            "rgQuality": pending.rg_quality
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
