import math_engine

def run_window_simulation(history_cache, num_test_games=300):
    """
    Runs a backtest simulation over the last `num_test_games` results,
    using different historical window sizes for the prediction logic.
    """
    # Windows to test (number of historical games passed to the engine)
    window_sizes = [50, 100, 200, 300, 500]
    
    # We need enough history for the largest window + num_test_games
    max_needed = max(window_sizes) + num_test_games
    if len(history_cache) < max_needed:
        # If we don't have 800 games yet, scale down num_test_games
        num_test_games = max(50, len(history_cache) - max(window_sizes))
        
    results = {
        "bs": {str(w): {"wins": 0, "losses": 0, "max_streak": 0, "max_loss_streak": 0, "current_win": 0, "current_loss": 0} for w in window_sizes},
        "rg": {str(w): {"wins": 0, "losses": 0, "max_streak": 0, "max_loss_streak": 0, "current_win": 0, "current_loss": 0} for w in window_sizes},
        "meta": {"test_games": num_test_games}
    }
    
    # Slice the relevant history
    # We want to test the last `num_test_games`
    start_idx = len(history_cache) - num_test_games
    
    for i in range(start_idx, len(history_cache)):
        actual_num = history_cache[i]
        actual_bs = math_engine.side(actual_num)
        
        # Test each window size
        for w in window_sizes:
            # Sliced history leading up to THIS game
            h_slice = history_cache[i-w:i]
            
            # --- BS Simulation ---
            bs_pred = math_engine.bs_base(h_slice).get("pred")
            if bs_pred:
                bs_stats = results["bs"][str(w)]
                if bs_pred == actual_bs:
                    bs_stats["wins"] += 1
                    bs_stats["current_win"] += 1
                    bs_stats["current_loss"] = 0
                    if bs_stats["current_win"] > bs_stats["max_streak"]:
                        bs_stats["max_streak"] = bs_stats["current_win"]
                else:
                    bs_stats["losses"] += 1
                    bs_stats["current_loss"] += 1
                    bs_stats["current_win"] = 0
                    if bs_stats["current_loss"] > bs_stats["max_loss_streak"]:
                        bs_stats["max_loss_streak"] = bs_stats["current_loss"]
            
            # --- RG Simulation ---
            rg_pred = math_engine.rg_base(h_slice).get("pred")
            if rg_pred is not None:
                rg_str = ["RED", "GREEN", "VIOLET"][rg_pred]
                is_win = math_engine.rg_settle(rg_str, actual_num)
                
                rg_stats = results["rg"][str(w)]
                if is_win:
                    rg_stats["wins"] += 1
                    rg_stats["current_win"] += 1
                    rg_stats["current_loss"] = 0
                    if rg_stats["current_win"] > rg_stats["max_streak"]:
                        rg_stats["max_streak"] = rg_stats["current_win"]
                else:
                    rg_stats["losses"] += 1
                    rg_stats["current_loss"] += 1
                    rg_stats["current_win"] = 0
                    if rg_stats["current_loss"] > rg_stats["max_loss_streak"]:
                        rg_stats["max_loss_streak"] = rg_stats["current_loss"]

    # Calculate percentages
    for engine in ["bs", "rg"]:
        for w in window_sizes:
            stats = results[engine][str(w)]
            total = stats["wins"] + stats["losses"]
            stats["win_rate"] = round((stats["wins"] / total * 100), 1) if total > 0 else 0
            
    return results
