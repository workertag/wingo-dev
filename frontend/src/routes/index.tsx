import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Activity, Info, BarChart3, Layers, Radio, Download, RotateCcw } from "lucide-react";
import SequencesPage from './pattern/sequences';
import StreakTimingsPage from './pattern/streak-timings';
import RecoveryPage from './pattern/recovery';
import HotColdPage from './pattern/hot-cold';

export const Route = createFileRoute("/")({
  component: Dashboard,
});

const BACKEND_URL = "/api/state";

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
    lossStats: null,
    monitorStats: null
  });
  const [timerLeft, setTimerLeft] = useState("--");
  const [feedOk, setFeedOk] = useState(false);
  const [activeTab, setActiveTab] = useState("30S");
  const [pingLatency, setPingLatency] = useState<number | null>(null);

  const testPing = async () => {
    const start = performance.now();
    try {
      await fetch('/api/ping');
      const end = performance.now();
      setPingLatency(Math.round(end - start));
    } catch (e) {
      setPingLatency(-1);
    }
  };

  useEffect(() => {
    let fallbackInterval: ReturnType<typeof setInterval>;
    let ws: WebSocket | null = null;
    let wsReconnectTimer: ReturnType<typeof setTimeout>;
    let pingInterval: ReturnType<typeof setInterval>;
    let alive = true;

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

    const connectWs = () => {
      if (!alive) return;
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${proto}//${window.location.host}/api/ws?timer=${activeTab}`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("[WS] connected", activeTab);
        // Ping every 10 seconds to keep connection alive on mobile networks
        pingInterval = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 10000);
      };

      ws.onmessage = () => {
        // Backend pushed a new result — fetch the full state immediately
        fetchState();
      };

      ws.onclose = () => {
        console.log("[WS] disconnected, reconnecting in 2s…");
        clearInterval(pingInterval);
        if (alive) {
          wsReconnectTimer = setTimeout(connectWs, 2000);
        }
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    // Initial fetch + WS connect
    fetchState();
    connectWs();

    // 5s fallback poll in case WS is down
    fallbackInterval = setInterval(fetchState, 5000);

    // Instantly fetch and reconnect when switching back to the app on mobile
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchState();
        if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
          connectWs();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      alive = false;
      clearInterval(fallbackInterval);
      clearInterval(pingInterval);
      clearTimeout(wsReconnectTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (ws) {
        ws.onclose = null; // prevent reconnect on intentional close
        ws.close();
      }
    };
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

  const exportCSV = () => {
    if (!data.logs || data.logs.length === 0) return;
    const header = "Period,Prediction,Actual,Digit,BS,Colour,Layer\n";
    const rows = data.logs.map((row: any) => 
      `${row.period},${row.bsPred}/${row.rgPred},${row.actualSide}/${row.actualColour},${row.num},${row.bsStatus},${row.rgStatus},BS:${row.bsLayer}/RG:${row.rgLayer}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wingo_logs_${activeTab}_${new Date().getTime()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };


  const resultsArray = data.results || [];
  const latestIssue = resultsArray && resultsArray.length > 0 ? resultsArray[resultsArray.length - 1] : null;
  const pending = data.pending || {
    bsPred: "WAITING",
    rgPred: "WAITING",
    bsQuality: "—",
    rgQuality: "—",
    bsLayer: "—",
    rgLayer: "—",
  };
  const state = data.state || { bsLevel: 1, rgLevel: 1 };
  const lossStats = data.lossStats || { bs: [], rg: [] };
  const monitorStats = data.monitorStats || {};

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
            <button onClick={testPing} className="ml-2 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold hover:bg-emerald-200 transition-colors flex items-center gap-1">
              Test Latency {pingLatency !== null ? (pingLatency === -1 ? '(Error)' : `(${(pingLatency / 1000).toFixed(3)}s)`) : ""}
            </button>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-6 border-b border-slate-200/60">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">WinGo</div>
            <h2 className="text-4xl font-black text-indigo-600 tracking-tight leading-none mb-2">
              Live <span className="text-slate-900">Prediction Feed</span>
            </h2>
            <p className="text-sm font-medium text-slate-500">
              Real-time mathematical engine analysis and pattern detection.
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Tab Switcher */}
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
                Number(timerLeft) <= 5 
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
          className="relative bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden flex flex-col justify-between min-h-[260px]"
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
          
          <div className="flex-1 flex flex-col items-center justify-center mt-2 mb-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={pending.bsPred}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`text-[56px] leading-none font-black tracking-tighter uppercase ${
                  pending.bsPred === "BIG" ? "text-emerald-500" :
                  pending.bsPred === "SMALL" ? "text-rose-500" : "text-slate-300"
                }`}
              >
                {pending.bsPred || "WAITING"}
              </motion.div>
            </AnimatePresence>
            <div className="mt-2 text-[10px] font-medium text-slate-500/80 tracking-wide text-center">
              Quality {pending.bsQuality || '—'} • regime {pending.bsRegime || 'BUILDING'} • score is not prob
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-blue-200/30 bg-white/40 backdrop-blur-sm rounded-xl p-2">
            <div className="text-center flex flex-col justify-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Big Score</span>
              <span className="text-sm font-black text-slate-800">{pending.bsScoreB ?? '—'}</span>
            </div>
            <div className="text-center flex flex-col justify-center border-x border-slate-200/60">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Small Score</span>
              <span className="text-sm font-black text-slate-800">{pending.bsScoreS ?? '—'}</span>
            </div>
            <div className="text-center flex flex-col justify-center items-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Layer</span>
              <span className="text-[10px] font-bold text-slate-700 bg-white shadow-sm px-2 py-0.5 rounded border border-slate-100 w-full truncate">{pending.bsLayer}</span>
            </div>
          </div>
        </div>

        {/* RG Prediction */}
        <div 
          className="relative bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden flex flex-col justify-between min-h-[260px]"
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
          
          <div className="flex-1 flex flex-col items-center justify-center mt-2 mb-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={pending.rgPred}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`text-[56px] leading-none font-black tracking-tighter uppercase ${
                  pending.rgPred === "GREEN" ? "text-emerald-500" :
                  pending.rgPred === "RED" ? "text-rose-500" :
                  pending.rgPred === "VIOLET" ? "text-violet-500" : "text-slate-300"
                }`}
              >
                {pending.rgPred || "WAITING"}
              </motion.div>
            </AnimatePresence>
            <div className="mt-2 text-[10px] font-medium text-slate-500/80 tracking-wide text-center">
              Quality {pending.rgQuality || '—'} • regime {pending.rgRegime || 'BUILDING'} • score is not prob
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1 pt-4 border-t border-violet-200/30 bg-white/40 backdrop-blur-sm rounded-xl p-2">
            <div className="text-center flex flex-col justify-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Red</span>
              <span className="text-sm font-black text-slate-800">{pending.rgScoreR ?? '—'}</span>
            </div>
            <div className="text-center flex flex-col justify-center border-x border-slate-200/60">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Green</span>
              <span className="text-sm font-black text-slate-800">{pending.rgScoreG ?? '—'}</span>
            </div>
            <div className="text-center flex flex-col justify-center border-r border-slate-200/60">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Violet</span>
              <span className="text-sm font-black text-slate-800">{pending.rgScoreV ?? '—'}</span>
            </div>
            <div className="text-center flex flex-col justify-center items-center px-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Layer</span>
              <span className="text-[9px] font-bold text-slate-700 bg-white shadow-sm px-1 py-0.5 rounded border border-slate-100 w-full truncate" title={pending.rgLayer}>{pending.rgLayer}</span>
            </div>
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
          </div>

          <div className="grid grid-cols-5 gap-y-6 gap-x-2 sm:gap-x-3 items-end mb-6 pb-2">
            <AnimatePresence>
              {[...resultsArray].reverse().slice(0, 10).map((r: any, i: number) => {
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
          <div className="flex gap-3">
            <button onClick={exportCSV} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" /> Export CSV
            </button>
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
                      <span className={`text-sm font-bold ${row.bsPred === 'BIG' ? 'text-blue-500' : 'text-slate-400'}`}>
                        {row.bsPred}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">L{row.bsLayer}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-sm ${
                      row.actualColour === 'GREEN' ? 'bg-emerald-500' :
                      row.actualColour === 'RED' ? 'bg-rose-500' : 'bg-violet-500'
                    }`}>
                      {row.num}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold ${
                        row.rgPred === 'GREEN' ? 'text-emerald-500' :
                        row.rgPred === 'RED' ? 'text-rose-500' :
                        row.rgPred === 'VIOLET' ? 'text-violet-500' : 'text-slate-400'
                      }`}>
                        {row.rgPred}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">L{row.rgLayer}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-bold inline-flex w-max ${
                      row.bsStatus === 'WIN' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                      row.bsStatus === 'LOSS' ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}>
                      {row.bsStatus || 'WAIT'}
                    </span>
                  </td>
                  <td className="p-4 pr-6">
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-bold inline-flex w-max ${
                      row.rgStatus === 'WIN' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                      row.rgStatus === 'LOSS' ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-slate-50 border-slate-200 text-slate-400'
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

      <div className="flex flex-col gap-6 mt-6">
        {/* Loss-Streak Monitor */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col">
          <div className="flex items-start gap-3 mb-6">
            <div className="mt-1 text-orange-500">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Loss-Streak / Downside Monitor</h2>
              <p className="text-[11px] font-medium text-slate-400">Total consecutive LOSS streak statistics</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 mb-4">
            <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
              <div className="text-[10px] text-slate-400 font-bold mb-1">BS Total Losses</div>
              <div className="text-lg font-black text-slate-800">{lossStats?.bs?.[5]?.losses || 0}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
              <div className="text-[10px] text-slate-400 font-bold mb-1">BS Max Streak</div>
              <div className="text-lg font-black text-slate-800">{lossStats?.bs?.[5]?.max || 0}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
              <div className="text-[10px] text-slate-400 font-bold mb-1">BS Settled</div>
              <div className="text-lg font-black text-slate-800">{lossStats?.bs?.[5]?.n || 0}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
              <div className="text-[10px] text-slate-400 font-bold mb-1">BS Loss Rate</div>
              <div className="text-lg font-black text-slate-800">
                {lossStats?.bs?.[5]?.n ? Math.round((lossStats.bs[5].losses / lossStats.bs[5].n) * 100) + '%' : '—'}
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
              <div className="text-[10px] text-slate-400 font-bold mb-1">RG Total Losses</div>
              <div className="text-lg font-black text-slate-800">{lossStats?.rg?.[5]?.losses || 0}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
              <div className="text-[10px] text-slate-400 font-bold mb-1">RG Max Streak</div>
              <div className="text-lg font-black text-slate-800">{lossStats?.rg?.[5]?.max || 0}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
              <div className="text-[10px] text-slate-400 font-bold mb-1">RG Settled</div>
              <div className="text-lg font-black text-slate-800">{lossStats?.rg?.[5]?.n || 0}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
              <div className="text-[10px] text-slate-400 font-bold mb-1">RG Loss Rate</div>
              <div className="text-lg font-black text-slate-800">
                {lossStats?.rg?.[5]?.n ? Math.round((lossStats.rg[5].losses / lossStats.rg[5].n) * 100) + '%' : '—'}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto flex-1 mb-4">
            <table className="w-full text-center text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold">
                  <th className="p-2 border border-slate-100">Streak</th>
                  <th colSpan={6} className="p-2 border border-slate-100">BS • Latest Settled Windows</th>
                  <th colSpan={6} className="p-2 border border-slate-100">RG • Latest Settled Windows</th>
                </tr>
                <tr className="bg-slate-50/50 text-[10px] text-slate-500 font-bold">
                  <th className="p-2 border border-slate-100"></th>
                  <th className="p-2 border border-slate-100">100</th>
                  <th className="p-2 border border-slate-100">200</th>
                  <th className="p-2 border border-slate-100">300</th>
                  <th className="p-2 border border-slate-100">500</th>
                  <th className="p-2 border border-slate-100">1000</th>
                  <th className="p-2 border border-slate-100">ALL</th>
                  <th className="p-2 border border-slate-100">100</th>
                  <th className="p-2 border border-slate-100">200</th>
                  <th className="p-2 border border-slate-100">300</th>
                  <th className="p-2 border border-slate-100">500</th>
                  <th className="p-2 border border-slate-100">1000</th>
                  <th className="p-2 border border-slate-100">ALL</th>
                </tr>
              </thead>
              <tbody>
                {[1,2,3,4,5,6,7,8,9,10].map(k => (
                  <tr key={k} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-2 border border-slate-100 font-bold text-slate-600">{k} loss{k > 1 ? 'es' : ''}</td>
                    {lossStats?.bs?.map((w: any, i: number) => (
                        <td key={`bs-${i}`} className="p-2 border border-slate-100 text-slate-500">{w?.counts?.[k] || 0}</td>
                    ))}
                    {lossStats?.rg?.map((w: any, i: number) => (
                        <td key={`rg-${i}`} className="p-2 border border-slate-100 text-slate-500">{w?.counts?.[k] || 0}</td>
                    ))}
                  </tr>
                ))}
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-2 border border-slate-100 font-bold text-slate-600">11+ losses</td>
                  {lossStats?.bs?.map((w: any, i: number) => (
                      <td key={`bs-11-${i}`} className="p-2 border border-slate-100 text-slate-500">{w?.runs?.filter((n: number) => n >= 11).length || 0}</td>
                  ))}
                  {lossStats?.rg?.map((w: any, i: number) => (
                      <td key={`rg-11-${i}`} className="p-2 border border-slate-100 text-slate-500">{w?.runs?.filter((n: number) => n >= 11).length || 0}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 flex items-center text-[10px] font-semibold text-slate-500 border border-slate-100">
            Exact streaks only. Windows use the latest settled WIN/LOSS records for each engine independently.
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance / Integrity Monitor */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 h-full flex flex-col">
            <div className="flex items-start gap-3 mb-6">
              <div className="mt-1 text-emerald-500">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">Performance / Integrity Monitor</h2>
                <p className="text-[11px] font-medium text-slate-400">System health and accuracy metrics</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                <div className="text-[10px] text-slate-400 font-bold mb-1">Verified Results</div>
                <div className="text-lg font-black text-slate-800">{monitorStats?.totalVerified || 0}</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                <div className="text-[10px] text-slate-400 font-bold mb-1">BS Accuracy</div>
                <div className="text-lg font-black text-slate-800">{monitorStats?.bsAcc != null ? Math.round(monitorStats.bsAcc * 100) + '%' : '—'}</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                <div className="text-[10px] text-slate-400 font-bold mb-1">RG Accuracy</div>
                <div className="text-lg font-black text-slate-800">{monitorStats?.rgAcc != null ? Math.round(monitorStats.rgAcc * 100) + '%' : '—'}</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                <div className="text-[10px] text-slate-400 font-bold mb-1">Both Win %</div>
                <div className="text-lg font-black text-slate-800">{monitorStats?.dualAcc != null ? Math.round(monitorStats.dualAcc * 100) + '%' : '—'}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                <div className="text-[10px] text-slate-400 font-bold mb-1">BS Regime</div>
                <div className="text-sm font-black text-amber-600">{monitorStats?.bsRegime || 'BUILDING'}</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                <div className="text-[10px] text-slate-400 font-bold mb-1">RG Regime</div>
                <div className="text-sm font-black text-amber-600">{monitorStats?.rgRegime || 'BUILDING'}</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                <div className="text-[10px] text-slate-400 font-bold mb-1">Feed Gaps</div>
                <div className="text-lg font-black text-slate-800">{monitorStats?.gaps || 0}</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                <div className="text-[10px] text-slate-400 font-bold mb-1">Missed Rounds</div>
                <div className="text-lg font-black text-slate-800">{monitorStats?.missedRounds || 0}</div>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 flex items-center text-[10px] font-semibold text-slate-500 border border-slate-100">
              Monitoring frequency, transitions, runs, persistence, Markov candidates, EWMA and ensemble agreement.
            </div>
          </div>

          {/* Strategy Lab */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100">
            <div className="flex items-start gap-3 mb-6">
              <div className="mt-1 text-violet-500">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">Strategy Lab • Multi-method validation</h2>
                <p className="text-[11px] font-medium text-slate-400">Adaptive candidate validation</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100 overflow-hidden text-ellipsis whitespace-nowrap">
                <div className="text-[10px] text-slate-400 font-bold mb-1">BS Best Layer</div>
                <div className="text-xs font-black text-slate-800 truncate" title={monitorStats?.bsWfa?.ready && monitorStats?.bsWfa?.best ? monitorStats.bsWfa.best.name : '—'}>
                  {monitorStats?.bsWfa?.ready && monitorStats?.bsWfa?.best ? monitorStats.bsWfa.best.name : '—'}
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                <div className="text-[10px] text-slate-400 font-bold mb-1">BS WFA</div>
                <div className="text-lg font-black text-slate-800">{monitorStats?.bsWfa?.ready && monitorStats?.bsWfa?.best ? Math.round(monitorStats.bsWfa.best.acc * 100) + '%' : '—'}</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100 overflow-hidden text-ellipsis whitespace-nowrap">
                <div className="text-[10px] text-slate-400 font-bold mb-1">RG Best Layer</div>
                <div className="text-xs font-black text-slate-800 truncate" title={monitorStats?.rgWfa?.ready && monitorStats?.rgWfa?.best ? monitorStats.rgWfa.best.name : '—'}>
                  {monitorStats?.rgWfa?.ready && monitorStats?.rgWfa?.best ? monitorStats.rgWfa.best.name : '—'}
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                <div className="text-[10px] text-slate-400 font-bold mb-1">RG WFA</div>
                <div className="text-lg font-black text-slate-800">{monitorStats?.rgWfa?.ready && monitorStats?.rgWfa?.best ? Math.round(monitorStats.rgWfa.best.acc * 100) + '%' : '—'}</div>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-[10px] font-semibold text-slate-500 text-center border border-slate-100">
              {monitorStats?.bsWfa?.ready || monitorStats?.rgWfa?.ready 
                ? "Adaptive candidates are measured out-of-sample; fallback remains available when gates fail."
                : "Need 120+ verified results before adaptive candidate validation activates."}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Banner */}
      <div className="bg-white/50 border border-indigo-100/50 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left mt-8">
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

