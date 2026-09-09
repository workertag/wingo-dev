import time
import requests
import logging
from sqlalchemy.orm import Session
from database import SessionLocal
from models import WinGoResult, EngineState, PredictionLog, PendingPrediction, SmartEngineState, SmartPredictionLog, SmartPendingPrediction
import re
import math_engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

URLS = {
    "30S": "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json",
    "1M": "https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json"
}

def get_or_create_state(db: Session, timer_type: str):
    state = db.query(EngineState).filter(EngineState.timer_type == timer_type).first()
    if not state:
        state = EngineState(timer_type=timer_type)
        db.add(state)
        db.commit()
    return state

def get_or_create_smart_state(db: Session, timer_type: str):
    state = db.query(SmartEngineState).filter(SmartEngineState.timer_type == timer_type).first()
    if not state:
        state = SmartEngineState(timer_type=timer_type)
        db.add(state)
        db.commit()
    return state

def next_expected_issue(v):
    if not v: return None
    try:
        date_part = v[:-5]
        round_part = int(v[-5:])
        if round_part >= 99999: return None
        return f"{date_part}{str(round_part + 1).zfill(5)}"
    except:
        return None

def fetch_and_store_results():
    db = SessionLocal()
    try:
        for timer_type, url in URLS.items():
            target_url = f"{url}?ts={int(time.time()*1000)}"
            headers = {"Accept": "application/json,text/plain,*/*"}
            response = requests.get(target_url, headers=headers, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                rows = data.get("data", {}).get("list", [])
                state = get_or_create_state(db, timer_type)
                
                # Sort rows by issue ascending
                rows.sort(key=lambda x: str(x.get("issue") or x.get("issueNumber")))
                
                new_results_added = False
                
                for x in rows:
                    issue = str(x.get("issue") or x.get("issueNumber") or x.get("issueNo"))
                    raw = x.get("code") or x.get("number") or x.get("winNumber")
                    if issue and issue != 'None' and raw and raw != 'None':
                        digits = re.search(r'\d', str(raw))
                        if digits:
                            num = int(digits.group(0))
                            existing = db.query(WinGoResult).filter(
                                WinGoResult.timer_type == timer_type, 
                                WinGoResult.issue == issue
                            ).first()
                            
                            if not existing:
                                new_results_added = True
                                # Settle pending prediction
                                pending = db.query(PendingPrediction).filter(
                                    PendingPrediction.timer_type == timer_type,
                                    PendingPrediction.issue == issue
                                ).first()
                                
                                if pending:
                                    bs_actual = math_engine.side(num)
                                    rg_actual = math_engine.colour_of(num)
                                    
                                    bs_win = None if not pending.bs_pred else pending.bs_pred == bs_actual
                                    rg_win = None if not pending.rg_pred else math_engine.rg_settle(pending.rg_pred, num)
                                    
                                    bs_status = "NO BET" if bs_win is None else ("WIN" if bs_win else "LOSS")
                                    rg_status = "NO BET" if rg_win is None else ("WIN" if rg_win else "LOSS")
                                    
                                    log = PredictionLog(
                                        timer_type=timer_type,
                                        period=issue,
                                        prediction=f"{pending.bs_pred or 'NO SIGNAL'}-{pending.rg_pred or 'NO SIGNAL'}",
                                        bs_pred=pending.bs_pred,
                                        rg_pred=pending.rg_pred,
                                        actual_side=bs_actual,
                                        actual_colour=math_engine.colour_for_settlement(num),
                                        num=num,
                                        bs_status=bs_status,
                                        rg_status=rg_status,
                                        bs_layer=pending.bs_layer,
                                        rg_layer=pending.rg_layer,
                                        bs_quality=pending.bs_quality,
                                        rg_quality=pending.rg_quality,
                                        time=int(time.time()*1000),
                                        feed_time=None
                                    )
                                    db.add(log)
                                    db.delete(pending)
                                    
                                    if bs_win is not None:
                                        state.bs_level = 1 if bs_win else min(12, state.bs_level + 1)
                                    if rg_win is not None:
                                        state.rg_level = 1 if rg_win else min(12, state.rg_level + 1)
                                    
                                    if bs_win is True:
                                        state.bs_shield_armed = True
                                        state.bs_shield_recovery = False
                                    if rg_win is True:
                                        state.rg_shield_armed = True
                                        state.rg_shield_recovery = False
                                        
                                smart_state = get_or_create_smart_state(db, timer_type)
                                smart_pending = db.query(SmartPendingPrediction).filter(
                                    SmartPendingPrediction.timer_type == timer_type,
                                    SmartPendingPrediction.issue == issue
                                ).first()
                                
                                if smart_pending:
                                    bs_actual = math_engine.side(num)
                                    rg_actual = math_engine.colour_of(num)
                                    
                                    bs_win = None if not smart_pending.bs_pred else smart_pending.bs_pred == bs_actual
                                    rg_win = None if not smart_pending.rg_pred else math_engine.rg_settle(smart_pending.rg_pred, num)
                                    
                                    bs_status = "NO BET" if bs_win is None else ("WIN" if bs_win else "LOSS")
                                    rg_status = "NO BET" if rg_win is None else ("WIN" if rg_win else "LOSS")
                                    
                                    smart_log = SmartPredictionLog(
                                        timer_type=timer_type,
                                        period=issue,
                                        prediction=f"{smart_pending.bs_pred or 'NO SIGNAL'}-{smart_pending.rg_pred or 'NO SIGNAL'}",
                                        bs_pred=smart_pending.bs_pred,
                                        rg_pred=smart_pending.rg_pred,
                                        actual_side=bs_actual,
                                        actual_colour=math_engine.colour_for_settlement(num),
                                        num=num,
                                        bs_status=bs_status,
                                        rg_status=rg_status,
                                        bs_layer=smart_pending.bs_layer,
                                        rg_layer=smart_pending.rg_layer,
                                        bs_quality=smart_pending.bs_quality,
                                        rg_quality=smart_pending.rg_quality,
                                        time=int(time.time()*1000),
                                        feed_time=None
                                    )
                                    db.add(smart_log)
                                    db.delete(smart_pending)
                                    
                                    if bs_win is not None:
                                        smart_state.bs_level = 1 if bs_win else min(12, smart_state.bs_level + 1)
                                    if rg_win is not None:
                                        smart_state.rg_level = 1 if rg_win else min(12, smart_state.rg_level + 1)
                                    
                                    if bs_win is True:
                                        smart_state.bs_shield_armed = True
                                        smart_state.bs_shield_recovery = False
                                    if rg_win is True:
                                        smart_state.rg_shield_armed = True
                                        smart_state.rg_shield_recovery = False
                                    
                                new_result = WinGoResult(
                                    timer_type=timer_type, 
                                    issue=issue, 
                                    num=num, 
                                    source_time=int(time.time()*1000)
                                )
                                db.add(new_result)
                                state.last_issue = issue
                                
                                # Advance cooldowns
                                if state.bs_shield_cooldown > 0: state.bs_shield_cooldown -= 1
                                if state.rg_shield_cooldown > 0: state.rg_shield_cooldown -= 1
                                
                                if smart_state.bs_shield_cooldown > 0: smart_state.bs_shield_cooldown -= 1
                                if smart_state.rg_shield_cooldown > 0: smart_state.rg_shield_cooldown -= 1
                                
                                db.commit()
                
                if new_results_added and state.last_issue:
                    # Calculate next prediction
                    all_results_objs = db.query(WinGoResult).filter(
                        WinGoResult.timer_type == timer_type
                    ).order_by(WinGoResult.issue.asc()).all()
                    
                    all_results = [r.num for r in all_results_objs]
                    
                    if len(all_results) > 0:
                        logs = db.query(PredictionLog).filter(
                            PredictionLog.timer_type == timer_type
                        ).order_by(PredictionLog.id.desc()).all()
                        
                        b_decision = math_engine.bs_decision(all_results[-300:], state, logs)
                        r_decision = math_engine.rg_decision(all_results[-300:], state, logs)
                        
                        smart_logs = db.query(SmartPredictionLog).filter(
                            SmartPredictionLog.timer_type == timer_type
                        ).order_by(SmartPredictionLog.id.desc()).all()
                        smart_state = get_or_create_smart_state(db, timer_type)
                        b_smart = math_engine.bs_smart_decision(all_results[-300:], smart_state, smart_logs)
                        r_smart = math_engine.rg_smart_decision(all_results[-300:], smart_state, smart_logs)
                        
                        next_issue = next_expected_issue(state.last_issue)
                        if next_issue:
                            existing_pending = db.query(PendingPrediction).filter(
                                PendingPrediction.timer_type == timer_type,
                                PendingPrediction.issue == next_issue
                            ).first()
                            
                            if not existing_pending:
                                new_pending = PendingPrediction(
                                    timer_type=timer_type,
                                    issue=next_issue,
                                    source_issue=state.last_issue,
                                    bs_pred=b_decision["pred"],
                                    rg_pred=r_decision["pred"],
                                    bs_layer=b_decision["layer"],
                                    rg_layer=r_decision["layer"],
                                    bs_quality=b_decision["quality"],
                                    rg_quality=r_decision["quality"],
                                    created_at=int(time.time()*1000)
                                )
                                db.add(new_pending)
                            
                            existing_smart = db.query(SmartPendingPrediction).filter(
                                SmartPendingPrediction.timer_type == timer_type,
                                SmartPendingPrediction.issue == next_issue
                            ).first()
                            
                            if not existing_smart:
                                new_smart = SmartPendingPrediction(
                                    timer_type=timer_type,
                                    issue=next_issue,
                                    source_issue=smart_state.last_issue,
                                    bs_pred=b_smart["pred"],
                                    rg_pred=r_smart["pred"],
                                    bs_layer=b_smart["layer"],
                                    rg_layer=r_smart["layer"],
                                    bs_quality=b_smart["quality"],
                                    rg_quality=r_smart["quality"],
                                    created_at=int(time.time()*1000)
                                )
                                db.add(new_smart)
                                
                            db.commit()

    except Exception as e:
        logger.error(f"Error fetching results: {e}")
    finally:
        db.close()
