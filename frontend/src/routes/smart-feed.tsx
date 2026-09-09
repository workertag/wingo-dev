import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Activity, Info, BarChart3, Layers, Radio } from "lucide-react";

export const Route = createFileRoute("/smart-feed")({
  component: Dashboard,
});

const BACKEND_URL = "/api/smart-state";

function bit(n: number | string) {
  return Number(n) >= 5 ? 1 : 0;
}
function colourClass(n: number | string) {
  n = Number(n);
  return n === 0 || n === 5 ? "v" : n % 2 === 0 ? "r" : "g";
}

function formatTime(ts: number | string) {
  if (!ts) return "—";
  const d = new Date(Number(ts));
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// Faint SVG Wave Backgrounds for Cards
const waveBg1 = `url("data:image/svg+xml,%3Csvg viewBox='0 0 800 500' preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' width='100%25' id='blobSvg'%3E%3Cpath id='blob' d='M0,350 Q150,250 400,350 T800,350 L800,500 L0,500 Z' fill='%23fdba74' fill-opacity='0.15'%3E%3C/path%3E%3Cpath d='M0,400 Q200,300 500,400 T800,400 L800,500 L0,500 Z' fill='%23fdba74' fill-opacity='0.1'%3E%3C/path%3E%3C/svg%3E")`;
const waveBg2 = `url("data:image/svg+xml,%3Csvg viewBox='0 0 800 500' preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' width='100%25' id='blobSvg'%3E%3Cpath id='blob' d='M0,350 Q150,250 400,350 T800,350 L800,500 L0,500 Z' fill='%2393c5fd' fill-opacity='0.15'%3E%3C/path%3E%3Cpath d='M0,400 Q200,300 500,400 T800,400 L800,500 L0,500 Z' fill='%2393c5fd' fill-opacity='0.1'%3E%3C/path%3E%3C/svg%3E")`;
const waveBg3 = `url("data:image/svg+xml,%3Csvg viewBox='0 0 800 500' preserveAspectRatio='none' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' width='100%25' id='blobSvg'%3E%3Cpath id='blob' d='M0,350 Q150,250 400,350 T800,350 L800,500 L0,500 Z' fill='%23a78bfa' fill-opacity='0.15'%3E%3C/path%3E%3Cpath d='M0,400 Q200,300 500,400 T800,400 L800,500 L0,500 Z' fill='%23a78bfa' fill-opacity='0.1'%3E%3C/path%3E%3C/svg%3E")`;

function Dashboard() {
  const [data, setData] = useState<any>({
    results: [],
    logs: [],
    state: {},
    pending: null,
  });
  const [timerLeft, setTimerLeft] = useState("--");
  const [feedOk, setFeedOk] = useState(false);
  const [activeTab, setActiveTab] = useState("30S");

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const fetchState = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}?timer=${activeTab}`);
        const json = await res.json();
        setData(json);
        setFeedOk(true);
      } catch (err) {
        console.error("Backend fetch error", err);
        setFeedOk(false);
      }
    };

    fetchState();
    interval = setInterval(fetchState, 5000);
    return () => clearInterval(interval);
  }, [activeTab]);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const sec = Math.floor(now / 1000) % 60;
      let left = 0;
      if (activeTab === "30S") {
        left = 30 - (sec % 30);
      } else {
        left = 60 - sec;
        if (left === 0) left = 60;
      }
      setTimerLeft(String(left).padStart(2, "0"));
      requestAnimationFrame(tick);
    };
    const req = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(req);
  }, [activeTab]);

  const latestIssue =
    data.results && data.results.length > 0 ? data.results[0] : null;
  const pending = data.pending ? {
    ...data.pending,
    bsPred: data.pending.bsPred === null ? "SKIP" : data.pending.bsPred,
    rgPred: data.pending.rgPred === null ? "SKIP" : data.pending.rgPred,
  } : {
    bsPred: "WAITING",
    rgPred: "WAITING",
    bsQuality: "—",
    rgQuality: "—",
    bsLayer: "—",
    rgLayer: "—",
  };
  const state = data.state || { bsLevel: 1, rgLevel: 1 };
  const resultsArray = data.results || [];

  return (
    <div className="px-6 sm:px-8 pb-12 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Page Header Section */}
      <div className="relative">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-8 mt-[-30px]">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Good to see you back,</p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">
              Admin User <span className="text-2xl">👋</span>
            </h1>
            <p className="text-sm font-medium text-slate-400">
              Here's the latest from WinGo mathematical engine.
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-700">System Online</span>
            <span className="text-[10px] text-emerald-600/70 ml-1">Real-time Analysis</span>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-6 border-b border-slate-200/60">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">WinGo</div>
            <h2 className="text-4xl font-black text-indigo-600 tracking-tight leading-none mb-2">
              Smart <span className="text-slate-900">Feed</span>
            </h2>
            <p className="text-sm font-medium text-slate-500">
              Selective betting — only high-confidence rounds.
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Tab Switcher matching Mockup */}
            <div className="flex p-1.5 bg-white rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-100">
              <button
                onClick={() => setActiveTab("30S")}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                  activeTab === "30S"
                    ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/20"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                {activeTab === "30S" && <Zap className="w-4 h-4" fill="currentColor" />}
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
                {activeTab === "1M" && <Zap className="w-4 h-4" fill="currentColor" />}
                1 MIN
              </button>
            </div>
            
            <div className="hidden xl:block opacity-30 italic font-serif text-lg tracking-wide text-slate-500 pr-4">
              "Numbers reveal patterns." —
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Network Status / Timer */}
        <div 
          className="relative bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden flex flex-col justify-between h-[220px]"
          style={{ backgroundImage: waveBg1, backgroundPosition: 'bottom', backgroundRepeat: 'no-repeat', backgroundSize: 'cover' }}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Network Status</h3>
                <p className="text-[11px] font-semibold text-slate-400">Engine Connection</p>
              </div>
            </div>
            <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 ${feedOk ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${feedOk ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
              {feedOk ? 'LIVE' : 'OFFLINE'}
            </div>
          </div>
          
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              key={timerLeft}
              initial={{ opacity: 0.5, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`text-[80px] leading-none font-black text-transparent bg-clip-text drop-shadow-sm tracking-tighter ${
                timerLeft <= 5 
                  ? "bg-gradient-to-b from-red-500 to-red-700" 
                  : "bg-gradient-to-b from-orange-400 to-orange-600"
              }`}
            >
              {timerLeft}
            </motion.div>
          </div>

          <div className="flex items-center justify-between text-xs font-semibold pt-4 border-t border-orange-200/30">
            <span className="text-slate-400 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> Latest Settled
            </span>
            <span className="text-slate-800">{latestIssue ? latestIssue.issue : "—"}</span>
          </div>
        </div>

        {/* BS Prediction */}
        <div 
          className="relative bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden flex flex-col justify-between h-[220px]"
          style={{ backgroundImage: waveBg2, backgroundPosition: 'bottom', backgroundRepeat: 'no-repeat', backgroundSize: 'cover' }}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">BS • Big / Small</h3>
              <p className="text-[11px] font-semibold text-slate-400">Current Prediction</p>
            </div>
          </div>
          
          <div className="flex-1 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={pending.bsPred}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`text-[56px] leading-none font-black tracking-tighter uppercase ${
                  pending.bsPred === "BIG" ? "text-emerald-500" :
                  pending.bsPred === "SMALL" ? "text-red-500" : 
                  pending.bsPred === "SKIP" ? "text-amber-500" : "text-slate-300"
                }`}
              >
                {pending.bsPred || "WAITING"}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between text-xs font-semibold pt-4 border-t border-blue-200/30">
            <span className="text-slate-400 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Layer
            </span>
            <span className="text-slate-800">{pending.bsLayer}</span>
          </div>
        </div>

        {/* RG Prediction */}
        <div 
          className="relative bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden flex flex-col justify-between h-[220px]"
          style={{ backgroundImage: waveBg3, backgroundPosition: 'bottom', backgroundRepeat: 'no-repeat', backgroundSize: 'cover' }}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
              <div className="w-5 h-5 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full border-2 border-current translate-x-1" />
                <div className="w-3 h-3 rounded-full border-2 border-current -translate-x-1" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">RG • Red / Green</h3>
              <p className="text-[11px] font-semibold text-slate-400">Current Prediction</p>
            </div>
          </div>
          
          <div className="flex-1 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={pending.rgPred}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`text-[56px] leading-none font-black tracking-tighter uppercase ${
                  pending.rgPred === "GREEN" ? "text-emerald-500" :
                  pending.rgPred === "RED" ? "text-rose-500" :
                  pending.rgPred === "VIOLET" ? "text-violet-500" : 
                  pending.rgPred === "SKIP" ? "text-amber-500" : "text-slate-300"
                }`}
              >
                {pending.rgPred || "WAITING"}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between text-xs font-semibold pt-4 border-t border-violet-200/30">
            <span className="text-slate-400 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Layer
            </span>
            <span className="text-slate-800">{pending.rgLayer}</span>
          </div>
        </div>

      </div>

      {/* Bottom Grid: Digits & Martingale */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Digits */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-8">
            <div className="flex gap-3">
              <div className="mt-1 text-indigo-500">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">Recent Verified Digits</h2>
                <p className="text-[11px] font-medium text-slate-400">Latest results verified by WinGo engine</p>
              </div>
            </div>
            <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              View History <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-5 gap-y-6 gap-x-2 sm:gap-x-3 items-end mb-6 pb-2">
            <AnimatePresence>
              {resultsArray.slice(0, 10).map((r: any, i: number) => {
                const color = colourClass(r.num);
                let bgClass = "bg-slate-800 shadow-slate-500/30";
                if (color === "r") bgClass = "bg-rose-500 shadow-rose-500/30";
                if (color === "g") bgClass = "bg-emerald-500 shadow-emerald-500/30";
                if (color === "v") bgClass = "bg-violet-500 shadow-violet-500/30";
                
                return (
                  <div key={r.issue} className="flex flex-col items-center gap-2 shrink-0">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ delay: i * 0.05 }}
                      className={`w-[42px] h-[42px] sm:w-[48px] sm:h-[48px] rounded-2xl flex items-center justify-center font-black text-white text-xl sm:text-2xl shadow-lg ${bgClass}`}
                    >
                      {r.num}
                    </motion.div>
                    <span className="text-[10px] font-bold text-slate-400">#{i + 1}</span>
                  </div>
                );
              })}
            </AnimatePresence>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-700">Verified using WinGo mathematical engine</p>
                <p className="text-[10px] text-slate-400">Results are processed and validated in real-time.</p>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-slate-400">Most recent on the left</span>
          </div>
        </div>

        {/* Martingale Levels */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-8">
            <div className="flex gap-3">
              <div className="mt-1 text-indigo-500">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">Martingale Levels</h2>
                <p className="text-[11px] font-medium text-slate-400">Strategy layers for pattern analysis</p>
              </div>
            </div>
            <Info className="w-4 h-4 text-slate-300" />
          </div>

          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <div className="text-[10px] font-black tracking-widest text-slate-800 mb-3">BIG / SMALL</div>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={`bs-${i}`}
                    className={`h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                      state.bsLevel === i + 1
                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105"
                        : "bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100"
                    }`}
                  >
                    L{i + 1}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-black tracking-widest text-slate-800 mb-3">RED / GREEN</div>
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={`rg-${i}`}
                    className={`h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                      state.rgLevel === i + 1
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105"
                        : "bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100"
                    }`}
                  >
                    L{i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 pt-4 border-t border-slate-100">
            <span className="flex items-center gap-1.5 text-emerald-600">
              <div className="w-3 h-3 rounded-full border-2 border-emerald-500 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-emerald-500" />
              </div>
              Active level is highlighted
            </span>
            <span>Follow strategy rules for better accuracy.</span>
          </div>
        </div>
      </div>

      {/* Mini History Table */}
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex gap-3">
             <div className="mt-1 text-indigo-500">
               <History className="w-5 h-5" />
             </div>
             <div>
               <h2 className="text-base font-black text-slate-900">Recent Prediction Logs</h2>
               <p className="text-[11px] font-medium text-slate-400">Last 10 results from the engine</p>
             </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-widest text-slate-400 font-bold">
                <th className="p-4 pl-6 whitespace-nowrap">Issue</th>
                <th className="p-4">Time</th>
                <th className="p-4">BS Pred</th>
                <th className="p-4">Actual Num</th>
                <th className="p-4">RG Pred</th>
                <th className="p-4">BS Status</th>
                <th className="p-4 pr-6">RG Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {data.logs && data.logs.slice(0, 10).map((row: any, i: number) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6 font-semibold text-slate-800">{row.period}</td>
                  <td className="p-4 text-xs font-medium text-slate-500">{formatTime(row.time)}</td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold ${
                        row.bsPred === 'BIG' ? 'text-blue-500' :
                        row.bsPred === 'SMALL' ? 'text-blue-500' :
                        row.bsPred === 'SKIP' || row.bsPred === null ? 'text-amber-500' : 'text-slate-400'
                      }`}>
                        {row.bsPred || 'SKIP'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">L{row.bsLayer}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-sm ${
                      row.actualColour === 'green' ? 'bg-emerald-500' :
                      row.actualColour === 'red' ? 'bg-rose-500' : 'bg-violet-500'
                    }`}>
                      {row.num}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold ${
                        row.rgPred === 'GREEN' ? 'text-emerald-500' :
                        row.rgPred === 'RED' ? 'text-rose-500' :
                        row.rgPred === 'VIOLET' ? 'text-violet-500' : 
                        row.rgPred === 'SKIP' || row.rgPred === null ? 'text-amber-500' : 'text-slate-400'
                      }`}>
                        {row.rgPred || 'SKIP'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">L{row.rgLayer}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-bold inline-flex w-max ${
                      row.bsStatus === 'WIN' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                      row.bsStatus === 'LOSS' ? 'bg-rose-50 border-rose-200 text-rose-600' :
                      row.bsStatus === 'NO BET' ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}>
                      {row.bsStatus || 'WAIT'}
                    </span>
                  </td>
                  <td className="p-4 pr-6">
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-bold inline-flex w-max ${
                      row.rgStatus === 'WIN' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                      row.rgStatus === 'LOSS' ? 'bg-rose-50 border-rose-200 text-rose-600' : 
                      row.rgStatus === 'NO BET' ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}>
                      {row.rgStatus || 'WAIT'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!data.logs || data.logs.length === 0) && (
            <div className="p-12 text-center text-slate-400 font-medium">No logs found.</div>
          )}
        </div>
      </div>

      {/* Footer Banner */}
      <div className="bg-white/50 border border-indigo-100/50 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Powered by Advanced Mathematics</h4>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
              WinGo uses real-time data analysis, frequency mapping and pattern recognition to generate predictions.
            </p>
          </div>
        </div>
        <div className="text-[9px] font-black tracking-[0.2em] uppercase text-indigo-400">
          Data • Patterns • Precision
        </div>
      </div>
    </div>
  );
}

// Additional icons that weren't imported
function History(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}

function ChevronRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
