import threading
from collections import defaultdict
from database import SessionLocal
import models
from datetime import datetime
import pytz

_advanced_cache = {"30S": {}, "1M": {}}
_analytics_lock = threading.Lock()

def calculate_heatmap(logs):
    # Returns matrix of win/loss per YYYY-MM-DD per hour
    # 0-23 hours
    heatmap_bs = defaultdict(lambda: defaultdict(lambda: {"wins": 0, "losses": 0}))
    heatmap_rg = defaultdict(lambda: defaultdict(lambda: {"wins": 0, "losses": 0}))
    
    tz = pytz.timezone("Asia/Kolkata")
    
    for log in logs:
        if not log.time:
            continue
            
        dt = datetime.fromtimestamp(log.time / 1000.0, tz)
        day = dt.strftime("%Y-%m-%d")
        hour = str(dt.hour)
        
        if log.bs_status in ('WIN', 'LOSS'):
            if log.bs_status == 'WIN':
                heatmap_bs[day][hour]["wins"] += 1
            else:
                heatmap_bs[day][hour]["losses"] += 1
                
        if log.rg_status in ('WIN', 'LOSS'):
            if log.rg_status == 'WIN':
                heatmap_rg[day][hour]["wins"] += 1
            else:
                heatmap_rg[day][hour]["losses"] += 1
                
    return {"bs": heatmap_bs, "rg": heatmap_rg}

def calculate_sequences(logs):
    # Looks for sequences in actual_side and actual_colour before a prediction
    # Since logs are descending (newest first), if we reverse them, we get chronological.
    
    # Let's track up to length 7.
    seq_bs_stats = defaultdict(lambda: {"wins": 0, "losses": 0})
    seq_rg_stats = defaultdict(lambda: {"wins": 0, "losses": 0})
    
    current_side = None
    side_streak = 0
    current_colour = None
    colour_streak = 0
    
    for log in reversed(logs):
        # We evaluate the AI's prediction on this game, knowing the trend BEFORE this game
        if log.bs_status in ('WIN', 'LOSS') and side_streak >= 2:
            key = f"{side_streak}_{current_side}"
            if log.bs_status == 'WIN':
                seq_bs_stats[key]["wins"] += 1
            else:
                seq_bs_stats[key]["losses"] += 1
                
        if log.rg_status in ('WIN', 'LOSS') and colour_streak >= 2:
            key = f"{colour_streak}_{current_colour}"
            if log.rg_status == 'WIN':
                seq_rg_stats[key]["wins"] += 1
            else:
                seq_rg_stats[key]["losses"] += 1
                
        # Now update trend for next game
        if log.actual_side:
            if log.actual_side == current_side:
                side_streak += 1
            else:
                current_side = log.actual_side
                side_streak = 1
                
        if log.actual_colour:
            # handle violet logic or simple R/G sequence
            col = "GREEN" if "GREEN" in log.actual_colour else "RED" if "RED" in log.actual_colour else log.actual_colour
            if col == current_colour:
                colour_streak += 1
            else:
                current_colour = col
                colour_streak = 1
                
    return {"bs": dict(seq_bs_stats), "rg": dict(seq_rg_stats)}

def calculate_recovery(logs):
    # What is the win rate immediately following a loss vs a win?
    # Again, chronological evaluation
    bs_post_loss = {"wins": 0, "losses": 0}
    bs_post_win = {"wins": 0, "losses": 0}
    
    rg_post_loss = {"wins": 0, "losses": 0}
    rg_post_win = {"wins": 0, "losses": 0}
    
    last_bs_status = None
    last_rg_status = None
    
    for log in reversed(logs):
        if log.bs_status in ('WIN', 'LOSS'):
            if last_bs_status == 'LOSS':
                if log.bs_status == 'WIN':
                    bs_post_loss["wins"] += 1
                else:
                    bs_post_loss["losses"] += 1
            elif last_bs_status == 'WIN':
                if log.bs_status == 'WIN':
                    bs_post_win["wins"] += 1
                else:
                    bs_post_win["losses"] += 1
            last_bs_status = log.bs_status
            
        if log.rg_status in ('WIN', 'LOSS'):
            if last_rg_status == 'LOSS':
                if log.rg_status == 'WIN':
                    rg_post_loss["wins"] += 1
                else:
                    rg_post_loss["losses"] += 1
            elif last_rg_status == 'WIN':
                if log.rg_status == 'WIN':
                    rg_post_win["wins"] += 1
                else:
                    rg_post_win["losses"] += 1
            last_rg_status = log.rg_status
            
    return {
        "bs": {"post_loss": bs_post_loss, "post_win": bs_post_win},
        "rg": {"post_loss": rg_post_loss, "post_win": rg_post_win}
    }

def calculate_hot_cold(logs):
    # Just tally num occurrences
    counts = {i: 0 for i in range(10)}
    for log in logs:
        if log.num is not None:
            counts[log.num] += 1
    return counts

def calculate_win_streaks(logs, type_str: str, window_size: int = 100):
    ev = [x for x in logs if getattr(x, f"{type_str}_status") in ('WIN', 'LOSS')][:window_size]
    runs = []
    times = defaultdict(list)
    r = 0
    last_win_time = None
    
    for x in reversed(ev):
        status = getattr(x, f"{type_str}_status")
        if status == 'WIN':
            r += 1
            last_win_time = getattr(x, 'time', None)
        else:
            if r > 0:
                runs.append(r)
                if last_win_time:
                    times[r].append(last_win_time)
                r = 0
    if r > 0:
        runs.append(r)
        if last_win_time:
            times[r].append(last_win_time)
            
    counts = defaultdict(int)
    for r in runs: counts[r] += 1
    
    return {
        "n": len(ev),
        "wins": sum(1 for x in ev if getattr(x, f"{type_str}_status") == 'WIN'),
        "runs": runs,
        "counts": dict(counts),
        "times": dict(times),
        "max": max(runs) if runs else 0
    }

def refresh_advanced_cache():
    db = SessionLocal()
    try:
        for timer in ["30S", "1M"]:
            # We don't fetch all, but 10000 is more than enough for deep patterns
            logs = db.query(models.PredictionLog).filter(models.PredictionLog.timer_type == timer).order_by(models.PredictionLog.id.desc()).limit(10000).all()
            
            heatmap = calculate_heatmap(logs)
            sequences = calculate_sequences(logs)
            recovery = calculate_recovery(logs)
            hot_cold_100 = calculate_hot_cold(logs[:100])
            hot_cold_500 = calculate_hot_cold(logs[:500])
            hot_cold_all = calculate_hot_cold(logs)
            
            windows = [100, 200, 300, 500, 1000, 2000, 3000, 5000, 999999]
            win_streaks = {
                "bs": {w: calculate_win_streaks(logs, "bs", w) for w in windows},
                "rg": {w: calculate_win_streaks(logs, "rg", w) for w in windows},
            }
            
            with _analytics_lock:
                _advanced_cache[timer] = {
                    "heatmap": heatmap,
                    "sequences": sequences,
                    "recovery": recovery,
                    "hot_cold": {
                        "100": hot_cold_100,
                        "500": hot_cold_500,
                        "ALL": hot_cold_all,
                    },
                    "win_streaks": win_streaks
                }
    finally:
        db.close()
