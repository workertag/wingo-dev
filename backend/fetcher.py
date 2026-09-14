import time
import requests
import urllib.parse
import json
import queue
import concurrent.futures
import logging
from sqlalchemy.orm import Session
from database import SessionLocal
from models import WinGoResult, EngineState, PredictionLog, PendingPrediction
import re
import math_engine
from ws_manager import manager as ws_manager

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



def next_expected_issue(v):
    if not v: return None
    try:
        date_part = v[:-5]
        round_part = int(v[-5:])
        if round_part >= 99999: return None
        return f"{date_part}{str(round_part + 1).zfill(5)}"
    except:
        return None

_session = requests.Session()
_session.headers.update({
    "Accept": "application/json,text/plain,*/*",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
})

def fetch_fastest(target_url):
    """Fast direct fetch with cache-busting. Proxies don't work server-side."""
    try:
        # Add extra cache-busting params
        sep = "&" if "?" in target_url else "?"
        url = f"{target_url}{sep}_={int(time.time()*1000)}&rand={id(object())}"
        res = _session.get(url, timeout=2)
        if res.status_code == 200:
            return res.json()
    except Exception:
        pass
    return None

def fetch_and_store_results():
    db = SessionLocal()
    try:
        def fetch_for_timer(timer_type, url):
            target_url = f"{url}?ts={int(time.time()*1000)}"
            data = fetch_fastest(target_url)
            
            if data:
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
                        
                        window = state.window_size if getattr(state, 'window_size', None) else 300
                        b_decision = math_engine.bs_decision(all_results[-window:], state, logs)
                        r_decision = math_engine.rg_decision(all_results[-window:], state, logs)
                        

                        
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
                            
                            db.commit()

                    # Notify all connected WS clients for this timer immediately
                    ws_manager.notify(timer_type, state.last_issue)

        # Fetch for each timer sequentially (direct fetch is ~0.1s, no need for threads)
        for timer_type, url in URLS.items():
            fetch_for_timer(timer_type, url)
    except Exception as e:
        logger.error(f"Error fetching results: {e}")
    finally:
        db.close()
