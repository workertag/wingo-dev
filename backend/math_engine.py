import math

def side(n):
    return "BIG" if int(n) >= 5 else "SMALL"

def bit(n):
    return 1 if int(n) >= 5 else 0

def colour_of(n):
    n = int(n)
    if n == 0 or n == 5:
        return "VIOLET"
    return "RED" if n % 2 == 0 else "GREEN"

def colour_for_settlement(n):
    n = int(n)
    if n == 0:
        return "RED MIXED"
    if n == 5:
        return "GREEN MIXED"
    return "RED" if n % 2 == 0 else "GREEN"

def run_length(a):
    if not a:
        return 0
    r = 1
    for i in range(len(a) - 2, -1, -1):
        if a[i] == a[-1]:
            r += 1
        else:
            break
    return r

def wilson_lower(w, n, z=1.645):
    if not n:
        return 0
    p = w / n
    den = 1 + z * z / n
    ctr = p + z * z / (2 * n)
    adj = z * math.sqrt((p * (1 - p) + z * z / (4 * n)) / n)
    return (ctr - adj) / den

# --- BS Engine ---
def bs_base(h):
    if len(h) < 10:
        return {"B": 0, "S": 0, "pred": None, "signal": 0, "reason": "Need 10 verified results."}
    B = 0
    S = 0
    last = h[-1]
    prev = h[-2]
    recent = h[-12:]
    rb = sum(1 for x in recent if x >= 5)
    rs = len(recent) - rb
    if rb > rs:
        B += 8
    elif rs > rb:
        S += 8
        
    same = []
    for i in range(len(h) - 1):
        if side(h[i]) == side(last):
            same.append(side(h[i+1]))
    if len(same) >= 4:
        b = sum(1 for x in same if x == "BIG")
        s = len(same) - b
        if b > s:
            B += 18
        elif s > b:
            S += 18
            
    if len(h) >= 3:
        a = side(h[-3])
        bside = side(h[-2])
        tb = 0
        ts = 0
        for i in range(len(h) - 2):
            if side(h[i]) == a and side(h[i+1]) == bside:
                if side(h[i+2]) == "BIG":
                    tb += 1
                else:
                    ts += 1
        if tb + ts >= 4:
            if tb > ts:
                B += 16
            elif ts > tb:
                S += 16
                
    hs = [side(x) for x in h]
    ar = run_length(hs)
    if ar >= 6:
        n = "SMALL" if hs[-1] == "BIG" else "BIG"
        if n == "BIG":
            B += 14
        else:
            S += 14
            
    if side(last) == "BIG":
        B += 5
    else:
        S += 5
        
    if (last + prev) % 2 == 0:
        B += 3
    else:
        S += 3
        
    if B == S:
        return {"B": B, "S": S, "pred": None, "signal": 50, "reason": "Conflicting evidence"}
        
    pred = "BIG" if B > S else "SMALL"
    signal = round(max(B, S) / (B + S) * 100)
    return {"B": B, "S": S, "pred": pred, "signal": signal, "reason": "Original V7 fallback"}

def bs_run(h, k):
    if len(h) < 12: return None
    s = [bit(x) for x in h]
    r = run_length(s)
    return 1 - s[-1] if r >= k else s[-1]

def bs_pair(h):
    if len(h) < 12: return None
    s = [bit(x) for x in h]
    pair = s[-2:]
    v = []
    for i in range(len(s) - 2):
        if s[i] == pair[0] and s[i+1] == pair[1]:
            v.append(s[i+2])
    if len(v) >= 5:
        return 1 if sum(v) / len(v) >= 0.5 else 0
    return None

def bs_freq(h, w=30):
    if len(h) < 12: return None
    s = [bit(x) for x in h[-w:]]
    return 1 if sum(s) / len(s) >= 0.5 else 0

def bs_persist(h):
    return bit(h[-1]) if len(h) >= 12 else None

def bs_alt(h):
    if len(h) < 12: return None
    s = [bit(x) for x in h]
    a = 1
    for i in range(len(s) - 1, 0, -1):
        if s[i] != s[i-1]:
            a += 1
        else:
            break
    return 1 - s[-1] if a >= 6 else s[-1]

def bs_markov(h, o=2):
    if len(h) < o + 12: return None
    s = [bit(x) for x in h]
    k = "".join(map(str, s[-o:]))
    v = []
    for i in range(len(s) - o):
        if "".join(map(str, s[i:i+o])) == k:
            v.append(s[i+o])
    if len(v) >= 5:
        return 1 if sum(v) / len(v) >= 0.5 else 0
    return None

def bs_ewma(h):
    if len(h) < 12: return None
    z = 0.5
    for x in [bit(x) for x in h[-40:]]:
        z = 0.18 * x + 0.82 * z
    return 1 if z >= 0.5 else 0

def bs_balance(h):
    if len(h) < 12: return None
    s = [bit(x) for x in h[-60:]]
    m = sum(s) / len(s)
    if m >= 0.55: return 1
    if m <= 0.45: return 0
    return None

def bs_ensemble(h):
    v = [f for f in [bs_run(h,3), bs_run(h,4), bs_pair(h), bs_freq(h), bs_persist(h), bs_alt(h), bs_markov(h,2), bs_ewma(h), bs_balance(h)] if f is not None]
    if len(v) < 4: return None
    z = sum(v)
    if z > len(v) / 2: return 1
    if z < len(v) / 2: return 0
    return None

def bs_digit_transition(h, w=150, min_count=4):
    if len(h) < 20: return None
    v = h[-w:]
    last = h[-1]
    following = []
    for i in range(len(v) - 1):
        if v[i] == last:
            following.append(v[i+1])
    if len(following) < min_count: return None
    b = sum(1 for n in following if n >= 5)
    if b > len(following) - b: return 1
    if b < len(following) - b: return 0
    return None

def bs_cold_digit(h, w=100):
    if len(h) < w: return None
    c = [0] * 10
    for n in h[-w:]:
        c[n] += 1
    cold = c.index(min(c))
    return 1 if cold >= 5 else 0

BS_LAYERS = [
    ("RUN-3", lambda h: bs_run(h, 3)),
    ("RUN-4", lambda h: bs_run(h, 4)),
    ("PAIR-2", bs_pair),
    ("FREQ-30", bs_freq),
    ("FREQ-50", lambda h: bs_freq(h, 50)),
    ("PERSIST", bs_persist),
    ("ALT-6", bs_alt),
    ("ENSEMBLE", bs_ensemble),
    ("DIGIT-TRANS-100", lambda h: bs_digit_transition(h, 100, 4)),
    ("DIGIT-TRANS-150", lambda h: bs_digit_transition(h, 150, 4)),
    ("DIGIT-TRANS-300", lambda h: bs_digit_transition(h, 300, 4)),
    ("COLD-DIGIT-100", lambda h: bs_cold_digit(h, 100)),
    ("MARKOV-2", lambda h: bs_markov(h, 2)),
    ("MARKOV-3", lambda h: bs_markov(h, 3)),
    ("EWMA", bs_ewma),
    ("BALANCE-60", bs_balance)
]

def bs_regime(h):
    s = [bit(x) for x in h[-30:]]
    if len(s) < 12: return "BUILDING"
    ch = sum(1 for i in range(1, len(s)) if s[i] != s[i-1])
    alt = ch / (len(s) - 1)
    m = sum(s) / len(s)
    r = run_length(s)
    if alt >= 0.72: return "ALTERNATING"
    if r >= 5: return "STREAK"
    if abs(m - 0.5) >= 0.2: return "TREND"
    return "CHOP" if alt <= 0.35 else "MIXED"

def bs_candidate_score(fn, arr, start, end):
    hits = []
    for i in range(start, end):
        p = fn(arr[:i])
        if p is not None:
            hits.append(p == bit(arr[i]))
    if len(hits) >= 12:
        acc = sum(hits) / len(hits)
        return {"acc": acc, "n": len(hits), "lower": wilson_lower(sum(hits), len(hits))}
    return None

def bs_wfa(all_results):
    if len(all_results) < 120: return {"ready": False}
    best = None
    for name, fn in BS_LAYERS:
        q = bs_candidate_score(fn, all_results, 30, len(all_results))
        if q and (not best or q["lower"] > best["lower"]):
            best = {"name": name, **q}
    
    base = []
    for i in range(30, len(all_results)):
        p = bs_base(all_results[:i]).get("pred")
        if p:
            base.append(p == side(all_results[i]))
    ba = sum(base) / len(base) if base else 0
    gate = bool(best and best["acc"] >= 0.54 and best["acc"] >= ba + 0.025 and best["lower"] >= 0.50)
    return {"ready": True, "best": best, "baseAcc": ba, "gate": gate}

# --- RG Engine ---
def rg_settle(c, n):
    n = int(n)
    if c == "RED": return n in [0, 2, 4, 6, 8]
    if c == "GREEN": return n in [1, 3, 5, 7, 9]
    return n == 0 or n == 5

def rg_series(h):
    return [2 if n in (0, 5) else (0 if n % 2 == 0 else 1) for n in h]

def rg_arg_max(a, h=None):
    m = max(a)
    t = [i for i, x in enumerate(a) if x == m]
    if len(t) == 1: return t[0]
    
    if not h: h = []
    recent = rg_series(h[-8:])
    cnt = [0, 0, 0]
    for i in recent: cnt[i] += 1
    t.sort(key=lambda i: cnt[i], reverse=True)
    return t[0] if t else 0

def rg_base(h):
    if len(h) < 10:
        return {"scores": [0,0,0], "pred": None, "signal": 0, "reason": "Need 10 verified results."}
    raw = h[-12:]
    s = [0.0, 0.0, 0.0]
    prior = [0.475, 0.475, 0.05]
    for i in range(3):
        c_name = ["RED", "GREEN", "VIOLET"][i]
        s[i] += 10 * sum(1 for n in raw if rg_settle(c_name, n)) / len(raw) + 5 * prior[i]
        
    seq = rg_series(h)
    last = seq[-1]
    next_vals = []
    for i in range(len(h) - 1):
        if seq[i] == last:
            next_vals.append(h[i+1])
    if len(next_vals) >= 4:
        for i in range(3):
            c_name = ["RED", "GREEN", "VIOLET"][i]
            s[i] += 18 * sum(1 for n in next_vals if rg_settle(c_name, n)) / len(next_vals)
            
    if len(seq) >= 3:
        a = seq[-2]
        b = seq[-1]
        v = []
        for i in range(len(seq) - 2):
            if seq[i] == a and seq[i+1] == b:
                v.append(h[i+2])
        if len(v) >= 4:
            for i in range(3):
                c_name = ["RED", "GREEN", "VIOLET"][i]
                s[i] += 16 * sum(1 for n in v if rg_settle(c_name, n)) / len(v)
                
    r = run_length(seq)
    if r >= 4:
        for i in range(3):
            if i == last:
                s[i] -= 8
            elif i < 2:
                s[i] += 4
    if last < 2:
        s[last] += 3
        
    vr = sum(1 for n in raw if rg_settle("VIOLET", n))
    if vr == 0: s[2] += 1.5
    if vr >= 3: s[2] -= 1.5
    
    p = rg_arg_max(s, h)
    s_sum = sum(s)
    signal = round(s[p] / max(0.001, s_sum) * 100)
    return {"scores": s, "pred": p, "signal": signal, "reason": "Market-aware colour fallback."}

def rg_run(h, k):
    if len(h) < 12: return None
    s = rg_series(h)
    r = run_length(s)
    if r < k: return None
    return 1 if s[-1] == 0 else 0

def rg_pair(h):
    if len(h) < 12: return None
    s = rg_series(h)
    p = s[-2:]
    v = []
    for i in range(len(s) - 2):
        if s[i] == p[0] and s[i+1] == p[1]:
            v.append(h[i+2])
    if len(v) < 5: return None
    c = [0, 0, 0]
    for n in v:
        for i in range(3):
            if rg_settle(["RED", "GREEN", "VIOLET"][i], n):
                c[i] += 1
    return rg_arg_max(c, h)

def rg_freq(h, w=30):
    if len(h) < 12: return None
    c = [0, 0, 0]
    for n in h[-w:]:
        for i in range(3):
            if rg_settle(["RED", "GREEN", "VIOLET"][i], n):
                c[i] += 1
    return rg_arg_max(c, h)

def rg_persist(h):
    if len(h) < 12: return None
    n = h[-1]
    return 0 if n == 0 else (1 if n == 5 else (0 if n % 2 == 0 else 1))

def rg_alt(h):
    if len(h) < 12: return None
    s = rg_series(h)
    a = 1
    for i in range(len(s) - 1, 0, -1):
        if s[i] != s[i-1]:
            a += 1
        else:
            break
    if a >= 5:
        return 1 if s[-1] == 0 else 0
    return s[-1]

def rg_markov(h, o=2):
    if len(h) < o + 12: return None
    s = rg_series(h)
    k = "".join(map(str, s[-o:]))
    v = []
    for i in range(len(s) - o):
        if "".join(map(str, s[i:i+o])) == k:
            v.append(h[i+o])
    if len(v) < 5: return None
    c = [0, 0, 0]
    for n in v:
        for i in range(3):
            if rg_settle(["RED", "GREEN", "VIOLET"][i], n):
                c[i] += 1
    return rg_arg_max(c, h)

def rg_ewma(h):
    if len(h) < 12: return None
    z = [1/3, 1/3, 1/3]
    for n in h[-40:]:
        for i in range(3):
            val = 1 if rg_settle(["RED", "GREEN", "VIOLET"][i], n) else 0
            z[i] = 0.18 * val + 0.82 * z[i]
    return rg_arg_max(z, h)

def rg_balance(h):
    if len(h) < 12: return None
    c = [0, 0, 0]
    for n in h[-60:]:
        for i in range(3):
            if rg_settle(["RED", "GREEN", "VIOLET"][i], n):
                c[i] += 1
    m = max(c)
    if m / max(1, min(60, len(h))) >= 0.45:
        return rg_arg_max(c, h)
    return None

def rg_ensemble(h):
    v = [f for f in [rg_run(h,3), rg_run(h,4), rg_pair(h), rg_freq(h), rg_persist(h), rg_alt(h), rg_markov(h,2), rg_ewma(h), rg_balance(h)] if f is not None]
    if len(v) < 4: return None
    c = [0, 0, 0]
    for x in v: c[x] += 1
    return rg_arg_max(c, h)

def rg_digit_transition(h, w=150, min_count=4):
    if len(h) < 20: return None
    v = h[-w:]
    last = h[-1]
    following = []
    for i in range(len(v) - 1):
        if v[i] == last:
            following.append(v[i+1])
    if len(following) < min_count: return None
    c = [0, 0, 0]
    for n in following:
        for i in range(3):
            if rg_settle(["RED", "GREEN", "VIOLET"][i], n):
                c[i] += 1
    return rg_arg_max(c, h)

def rg_cold_digit(h, w=100):
    if len(h) < w: return None
    c = [0] * 10
    for n in h[-w:]:
        c[n] += 1
    cold = c.index(min(c))
    return 0 if cold == 0 else (1 if cold == 5 else (0 if cold % 2 == 0 else 1))

def rg_violet_gap(h, threshold=10):
    if len(h) < 30: return None
    gap = 0
    for i in range(len(h) - 1, -1, -1):
        if h[i] == 0 or h[i] == 5:
            break
        gap += 1
    if gap >= threshold: return 2
    return None

RG_LAYERS = [
    ("RUN-3", lambda h: rg_run(h, 3)),
    ("RUN-4", lambda h: rg_run(h, 4)),
    ("PAIR-2", rg_pair),
    ("FREQ-30", rg_freq),
    ("FREQ-50", lambda h: rg_freq(h, 50)),
    ("PERSIST", rg_persist),
    ("ALT-5", rg_alt),
    ("ENSEMBLE", rg_ensemble),
    ("DIGIT-TRANS-100", lambda h: rg_digit_transition(h, 100, 4)),
    ("DIGIT-TRANS-150", lambda h: rg_digit_transition(h, 150, 4)),
    ("DIGIT-TRANS-300", lambda h: rg_digit_transition(h, 300, 4)),
    ("COLD-DIGIT-100", lambda h: rg_cold_digit(h, 100)),
    ("MARKOV-2", lambda h: rg_markov(h, 2)),
    ("MARKOV-3", lambda h: rg_markov(h, 3)),
    ("EWMA", rg_ewma),
    ("BALANCE-60", rg_balance),
    ("VIOLET-GAP-10", lambda h: rg_violet_gap(h, 10))
]

def rg_regime(h):
    s = rg_series(h)[-30:]
    if len(s) < 12: return "BUILDING"
    ch = sum(1 for i in range(1, len(s)) if s[i] != s[i-1])
    alt = ch / (len(s) - 1)
    c = [0, 0, 0]
    for x in s: c[x] += 1
    share = max(c) / len(s)
    r = run_length(s)
    if r >= 5: return "STREAK"
    if alt >= 0.72: return "ALTERNATING"
    if share >= 0.60: return "TREND"
    if alt <= 0.35: return "CHOP"
    return "MIXED"

def rg_candidate_score(fn, arr, start, end):
    hits = []
    for i in range(start, end):
        p = fn(arr[:i])
        if p is not None:
            hits.append(rg_settle(["RED", "GREEN", "VIOLET"][p], arr[i]))
    if len(hits) >= 12:
        acc = sum(hits) / len(hits)
        return {"acc": acc, "n": len(hits), "lower": wilson_lower(sum(hits), len(hits))}
    return None

def rg_wfa(all_results):
    if len(all_results) < 120: return {"ready": False}
    best = None
    for name, fn in RG_LAYERS:
        q = rg_candidate_score(fn, all_results, 30, len(all_results))
        if q and (not best or q["lower"] > best["lower"]):
            best = {"name": name, **q}
            
    base = []
    for i in range(30, len(all_results)):
        p = rg_base(all_results[:i]).get("pred")
        if p is not None:
            base.append(rg_settle(["RED", "GREEN", "VIOLET"][p], all_results[i]))
    ba = sum(base) / len(base) if base else 0
    gate = bool(best and best["acc"] >= 0.40 and best["acc"] >= ba + 0.025 and best["lower"] >= 0.36)
    return {"ready": True, "best": best, "baseAcc": ba, "gate": gate}

def recent_accuracy(logs, type_str, n=20):
    a = [x for x in logs if getattr(x, f"{type_str}_status") in ("WIN", "LOSS")][:n]
    if len(a) >= 12:
        return sum(1 for x in a if getattr(x, f"{type_str}_status") == "WIN") / len(a)
    return None

def current_loss_streak(logs, type_str):
    r = 0
    for x in logs:
        st = getattr(x, f"{type_str}_status")
        if st == "LOSS":
            r += 1
        elif st == "WIN":
            break
    return r

def drawdown_shield(state_obj, logs, type_str):
    cd = getattr(state_obj, f"{type_str}_shield_cooldown", 0)
    if cd > 0: return True
    r = current_loss_streak(logs, type_str)
    a = recent_accuracy(logs, type_str, 20)
    
    if getattr(state_obj, f"{type_str}_shield_recovery"):
        if r < 6 or (a is not None and a >= 0.45):
            setattr(state_obj, f"{type_str}_shield_recovery", False)
            setattr(state_obj, f"{type_str}_shield_armed", True)
        else:
            return False
            
    armed = getattr(state_obj, f"{type_str}_shield_armed", True)
    if armed and r >= 6 and a is not None and a < 0.45:
        setattr(state_obj, f"{type_str}_shield_cooldown", 3)
        setattr(state_obj, f"{type_str}_shield_armed", False)
        setattr(state_obj, f"{type_str}_shield_recovery", True)
        return True
    return False

def bs_decision(h, state_obj, logs):
    base = bs_base(h)
    lab = bs_wfa(h)
    pred = base.get("pred")
    layer = "FALLBACK"
    quality = "B"
    if lab.get("ready") and lab.get("gate") and lab.get("best"):
        fn = next(f for n, f in BS_LAYERS if n == lab["best"]["name"])
        p = fn(h)
        if p is not None:
            pred = "BIG" if p else "SMALL"
            layer = lab["best"]["name"]
            quality = "A"
    
    if drawdown_shield(state_obj, logs, "bs"):
        pred = None
        layer = "DRAWDOWN-SHIELD"
        quality = "HOLD"
        
    return {"base": base, "lab": lab, "pred": pred, "layer": layer, "quality": quality, "regime": bs_regime(h)}

def rg_decision(h, state_obj, logs):
    base = rg_base(h)
    lab = rg_wfa(h)
    pred = base.get("pred")
    layer = "FALLBACK"
    quality = "B"
    if lab.get("ready") and lab.get("gate") and lab.get("best"):
        fn = next(f for n, f in RG_LAYERS if n == lab["best"]["name"])
        p = fn(h)
        if p is not None:
            pred = p
            layer = lab["best"]["name"]
            quality = "A"
            
    if drawdown_shield(state_obj, logs, "rg"):
        pred = None
        layer = "DRAWDOWN-SHIELD"
        quality = "HOLD"
        
    rg_str = None if pred is None else ["RED", "GREEN", "VIOLET"][pred]
    return {"base": base, "lab": lab, "pred": rg_str, "layer": layer, "quality": quality, "regime": rg_regime(h)}

def bs_smart_decision(h, state_obj, logs):
    base = bs_base(h)
    lab = bs_wfa(h)
    
    votes = {"BIG": 0, "SMALL": 0}
    total_votes = 0
    for name, fn in BS_LAYERS:
        p = fn(h)
        if p is not None:
            total_votes += 1
            if p == 1: votes["BIG"] += 1
            else: votes["SMALL"] += 1
            
    consensus = max(votes.values()) / total_votes if total_votes > 0 else 0
    consensus_pred = "BIG" if votes["BIG"] > votes["SMALL"] else "SMALL"
    
    pred = None
    layer = "SKIP"
    quality = "SKIP"
    
    if consensus >= 0.60:
        pred = consensus_pred
        layer = "CONSENSUS"
        quality = "A"
    
    wfa_ready = lab.get("ready", False)
    wfa_best = lab.get("best", None)
    
    if wfa_ready and wfa_best and wfa_best["acc"] >= 0.58 and wfa_best["lower"] >= 0.52:
        fn = next(f for n, f in BS_LAYERS if n == wfa_best["name"])
        p = fn(h)
        if p is not None:
            pred = "BIG" if p else "SMALL"
            layer = wfa_best["name"]
            quality = "A+"
            
    base_signal = base.get("signal", 0)
    if base_signal < 55 and quality != "A+":
        pred = None
        layer = "WEAK-SIGNAL"
        quality = "SKIP"

    if drawdown_shield(state_obj, logs, "bs"):
        pred = None
        layer = "DRAWDOWN-SHIELD"
        quality = "HOLD"
        
    return {"base": base, "lab": lab, "pred": pred, "layer": layer, "quality": quality, "regime": bs_regime(h)}

def rg_smart_decision(h, state_obj, logs):
    base = rg_base(h)
    lab = rg_wfa(h)
    
    votes = [0, 0, 0]
    total_votes = 0
    for name, fn in RG_LAYERS:
        p = fn(h)
        if p is not None:
            votes[p] += 1
            total_votes += 1
            
    consensus = max(votes) / total_votes if total_votes > 0 else 0
    consensus_pred = rg_arg_max(votes, h)
    
    pred = None
    layer = "SKIP"
    quality = "SKIP"
    
    if consensus >= 0.55:
        pred = consensus_pred
        layer = "CONSENSUS"
        quality = "A"
        
    wfa_ready = lab.get("ready", False)
    wfa_best = lab.get("best", None)
    
    if wfa_ready and wfa_best and wfa_best["acc"] >= 0.45 and wfa_best["lower"] >= 0.40:
        fn = next(f for n, f in RG_LAYERS if n == wfa_best["name"])
        p = fn(h)
        if p is not None:
            pred = p
            layer = wfa_best["name"]
            quality = "A+"
            
    base_signal = base.get("signal", 0)
    if base_signal < 45 and quality != "A+":
        pred = None
        layer = "WEAK-SIGNAL"
        quality = "SKIP"
        
    if drawdown_shield(state_obj, logs, "rg"):
        pred = None
        layer = "DRAWDOWN-SHIELD"
        quality = "HOLD"
        
    rg_str = None if pred is None else ["RED", "GREEN", "VIOLET"][pred]
    return {"base": base, "lab": lab, "pred": rg_str, "layer": layer, "quality": quality, "regime": rg_regime(h)}
