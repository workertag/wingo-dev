import React, { useEffect, useState } from "react";
import { Zap, RefreshCcw, ShieldAlert, Target } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/pattern/window-compare")({
  component: WindowComparePage,
});

export default function WindowComparePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeEngine, setActiveEngine] = useState("bs"); // bs or rg

  const fetchSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/window-simulation");
      const json = await res.json();
      if (!json.error) setData(json);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSimulation();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <RefreshCcw className="w-12 h-12 text-slate-300 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Running Mathematical Simulation...</h2>
        <p className="text-slate-500 mt-2 max-w-md mx-auto">
          The AI is currently backtesting the last 300 games across multiple historical window sizes (50, 100, 200, 300, 500) to find the absolute most profitable setting. This takes a few seconds!
        </p>
      </div>
    );
  }

  if (!data || !data.bs) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl shadow-sm border border-slate-100 max-w-lg mx-auto mt-20">
        <p className="text-slate-500 font-bold">Failed to load simulation. Ensure backend is running and has enough history (min 200 games).</p>
        <button onClick={fetchSimulation} className="mt-4 px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700">Retry</button>
      </div>
    );
  }

  const engineData = data[activeEngine];
  const windows = Object.keys(engineData).map(Number).sort((a, b) => a - b);

  // Find the optimal window
  let bestWindow = windows[0].toString();
  let maxWinRate = 0;
  for (const w of windows) {
    if (engineData[w].win_rate > maxWinRate) {
      maxWinRate = engineData[w].win_rate;
      bestWindow = w.toString();
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2 flex items-center gap-3">
          <Zap className="w-8 h-8 text-indigo-500" />
          Window Simulator
        </h1>
        <p className="text-slate-500 font-medium">
          Mathematical backtest of the last {data.meta.test_games} games. Compares how different historical "look-back windows" impact the AI's win rate.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex p-1 bg-white rounded-xl shadow-sm border border-slate-200">
          <button
            onClick={() => setActiveEngine("bs")}
            className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeEngine === 'bs' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Big/Small Engine
          </button>
          <button
            onClick={() => setActiveEngine("rg")}
            className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeEngine === 'rg' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Red/Green Engine
          </button>
        </div>

        <button
          onClick={fetchSimulation}
          className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 font-bold text-sm rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
        >
          <RefreshCcw className="w-4 h-4" /> Run New Simulation
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {windows.map(w => {
          const stats = engineData[w.toString()];
          const isBest = w.toString() === bestWindow;

          return (
            <div key={w} className={`bg-white rounded-3xl p-6 border-2 relative overflow-hidden transition-all ${isBest ? 'border-indigo-500 shadow-[0_8px_30px_rgba(99,102,241,0.15)] scale-[1.02]' : 'border-slate-100 shadow-sm hover:border-slate-200'}`}>
              {isBest && (
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                  Optimal
                </div>
              )}

              <div className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Window Size</div>
              <div className={`text-4xl font-black mb-6 ${isBest ? 'text-indigo-600' : 'text-slate-800'}`}>
                {w}
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-slate-400 text-xs font-bold mb-1 flex items-center gap-1"><Target className="w-3 h-3" /> Win Rate</div>
                  <div className={`text-2xl font-black ${stats.win_rate >= 50 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {stats.win_rate}%
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100">
                  <div>
                    <div className="text-slate-400 text-[10px] font-bold uppercase">Wins</div>
                    <div className="text-sm font-black text-slate-700">{stats.wins}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px] font-bold uppercase">Losses</div>
                    <div className="text-sm font-black text-slate-700">{stats.losses}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div>
                    <div className="text-slate-400 text-[10px] font-bold uppercase text-emerald-600">Max Win Streak</div>
                    <div className="text-sm font-black text-emerald-600">{stats.max_streak}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px] font-bold uppercase text-rose-500">Max Loss Streak</div>
                    <div className="text-sm font-black text-rose-500">{stats.max_loss_streak}</div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex gap-4 items-start mt-8">
        <ShieldAlert className="w-6 h-6 text-indigo-500 flex-shrink-0 mt-1" />
        <div>
          <h3 className="text-indigo-900 font-bold mb-1">Mathematical Verdict</h3>
          <p className="text-indigo-700 text-sm font-medium leading-relaxed">
            Based on the last {data.meta.test_games} games, the <strong className="font-black">Window Size {bestWindow}</strong> yielded the highest win rate ({maxWinRate}%) for the {activeEngine === 'bs' ? 'Big/Small' : 'Red/Green'} engine.
            , compare the <strong className="font-black text-rose-500">Max Loss Streak</strong> across windows to ensure comfortable with the risk profile.
          </p>
        </div>
      </div>
    </div>
  );
}
