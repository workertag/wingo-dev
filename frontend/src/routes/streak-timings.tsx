import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Calendar, Clock, Zap, Filter, Activity } from "lucide-react";
import { LoginScreen } from "@/components/LoginScreen";

export const Route = createFileRoute("/streak-timings")({
  component: StreakTimingsPage,
});

const BACKEND_URL = "/api/loss-streaks";
const windows = ["100", "200", "300", "500", "1000", "2000", "3000", "5000", "999999"];
const windowLabels = ["100", "200", "300", "500", "1K", "2K", "3K", "5K", "ALL"];
const streakRows = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

function StreakTimingsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeTab, setActiveTab] = useState("30S");
  const [activeEngine, setActiveEngine] = useState("bs"); // 'bs' or 'rg'
  const [activeWindow, setActiveWindow] = useState("999999");
  const [activeStreak, setActiveStreak] = useState(10);

  const fetchStreaks = async (tab: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}?timer=${tab}`);
      const json = await res.json();
      if (json.bs) {
        setData(json);
      } else {
        setData(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreaks(activeTab);
    const intv = setInterval(() => fetchStreaks(activeTab), 30000);
    return () => clearInterval(intv);
  }, [activeTab]);

  const formatTime = (ts: number) => {
    if (!ts) return "—";
    const d = new Date(ts);
    return d.toLocaleString('en-GB', {
      weekday: 'long',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  let times: number[] = [];
  if (data && data[activeEngine] && data[activeEngine][activeWindow] && data[activeEngine][activeWindow].times) {
    if (activeStreak === 15) {
      times = Object.entries(data[activeEngine][activeWindow].times)
        .filter(([k,v]) => Number(k) >= 15)
        .flatMap(([k,v]: any) => v);
    } else {
      times = data[activeEngine][activeWindow].times[activeStreak] || [];
    }
    times.sort((a, b) => b - a); // Newest first
  }

  return (
    <LoginScreen>
    <div className="px-6 sm:px-8 pb-12 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pb-6 border-b border-slate-200/60 mt-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">WinGo</div>
          <h2 className="text-4xl font-black text-indigo-600 tracking-tight leading-none mb-2 flex items-center gap-3">
            Streak <span className="text-slate-900">Timings</span>
          </h2>
          <p className="text-sm font-medium text-slate-500">
            View the exact chronological history of your loss streaks.
          </p>
        </div>
        
        <div className="flex p-1.5 bg-white rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-100">
          <button
            onClick={() => setActiveTab("30S")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
              activeTab === "30S"
                ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Zap className="w-4 h-4" fill={activeTab === "30S" ? "currentColor" : "none"} />
            30 SEC
          </button>
          <button
            onClick={() => setActiveTab("1M")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
              activeTab === "1M"
                ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Zap className="w-4 h-4" fill={activeTab === "1M" ? "currentColor" : "none"} />
            1 MIN
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-5 h-5 text-indigo-500" />
          <h3 className="text-lg font-black text-slate-800 tracking-tight">Filter Streaks</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Engine</label>
            <div className="flex p-1 bg-slate-50 rounded-xl border border-slate-100">
              <button
                onClick={() => setActiveEngine("bs")}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeEngine === 'bs' ? 'bg-white shadow-sm border border-slate-200 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Big/Small
              </button>
              <button
                onClick={() => setActiveEngine("rg")}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeEngine === 'rg' ? 'bg-white shadow-sm border border-slate-200 text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Red/Green
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Streak Length</label>
            <select 
              value={activeStreak} 
              onChange={e => setActiveStreak(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none"
            >
              {streakRows.map(s => (
                <option key={s} value={s}>{s === 15 ? '15+ losses' : `${s} losses`}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Lookback Window</label>
            <select 
              value={activeWindow} 
              onChange={e => setActiveWindow(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none"
            >
              {windows.map((w, i) => (
                <option key={w} value={w}>{w === "999999" ? "All Time" : `Last ${w} Games`}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">
              <Calendar className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">
                {activeStreak === 15 ? '15+' : activeStreak}-Loss Occurrences
              </h3>
              <p className="text-xs font-bold text-slate-400 mt-0.5">
                {times.length} instance{times.length !== 1 ? 's' : ''} found
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {loading && !data ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
              <p className="text-sm font-medium text-slate-400">Loading timeline...</p>
            </div>
          ) : times.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Activity className="w-8 h-8 text-slate-300" />
              </div>
              <h4 className="text-lg font-bold text-slate-700 mb-1">No streaks found</h4>
              <p className="text-sm text-slate-400 max-w-sm">
                There are no {activeStreak}-loss streaks recorded in this timeframe for the selected engine.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {times.map((ts: number, idx: number) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 hover:shadow-sm transition-all group gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-white group-hover:border-indigo-100 transition-colors shrink-0">
                      <Clock className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                    </div>
                    <div>
                      <span className="text-lg font-black text-slate-800 block mb-0.5">{formatTime(ts)}</span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        {activeEngine === 'bs' ? <span className="text-indigo-400">Big/Small Engine</span> : <span className="text-emerald-400">Red/Green Engine</span>}
                      </span>
                    </div>
                  </div>
                  <div className="sm:text-right">
                    <span className="inline-flex items-center justify-center px-3 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-full uppercase tracking-widest group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                      Occurrence #{times.length - idx}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </LoginScreen>
  );
}
