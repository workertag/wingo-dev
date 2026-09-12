import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { RotateCcw, Zap, TrendingUp, TrendingDown } from "lucide-react";
import { LoginScreen } from "@/components/LoginScreen";

export const Route = createFileRoute("/pattern/recovery")({
  component: RecoveryPage,
});

const BACKEND_URL = "/api/advanced-analytics";

function RecoveryPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("30S");

  const fetchAnalytics = async (tab: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}?timer=${tab}`);
      const json = await res.json();
      setData(json.recovery || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(activeTab);
  }, [activeTab]);

  const renderCard = (title: string, stats: any, isPostLoss: boolean) => {
    if (!stats) return null;
    const total = stats.wins + stats.losses;
    const rate = total > 0 ? ((stats.wins / total) * 100).toFixed(1) : "0";
    
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col items-center text-center">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${isPostLoss ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
          {isPostLoss ? <TrendingDown className="w-8 h-8" /> : <TrendingUp className="w-8 h-8" />}
        </div>
        <h3 className="text-xl font-black text-slate-800 mb-2">{title}</h3>
        <p className="text-sm font-medium text-slate-500 mb-8">AI Win Rate immediately following a {isPostLoss ? 'Loss' : 'Win'}</p>
        
        <div className="relative w-40 h-40 mb-6 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-100"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className={parseFloat(rate) >= 50 ? "text-emerald-500" : "text-indigo-500"}
              strokeDasharray={`${rate}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-slate-800">{rate}%</span>
          </div>
        </div>
        
        <div className="w-full grid grid-cols-2 gap-4 mt-auto">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Wins</p>
            <p className="text-lg font-black text-slate-700">{stats.wins}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Losses</p>
            <p className="text-lg font-black text-slate-700">{stats.losses}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <LoginScreen>
    <div className="px-6 sm:px-8 pb-12 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pb-6 border-b border-slate-200/60 mt-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Pattern Lab</div>
          <h2 className="text-4xl font-black text-indigo-600 tracking-tight leading-none mb-2 flex items-center gap-3">
            Recovery <span className="text-slate-900">Rate</span>
          </h2>
          <p className="text-sm font-medium text-slate-500">
            Does the engine bounce back after a loss? Analyze post-win vs post-loss performance.
          </p>
        </div>
        
        <div className="flex p-1.5 bg-white rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-100">
          <button
            onClick={() => setActiveTab("30S")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
              activeTab === "30S" ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md" : "text-slate-500"
            }`}
          >
            <Zap className="w-4 h-4" /> 30 SEC
          </button>
          <button
            onClick={() => setActiveTab("1M")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
              activeTab === "1M" ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md" : "text-slate-500"
            }`}
          >
            <Zap className="w-4 h-4" /> 1 MIN
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>
      ) : data ? (
        <div className="space-y-12">
          <div>
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
              Big/Small Engine
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderCard("Post-Loss Recovery", data.bs?.post_loss, true)}
              {renderCard("Post-Win Momentum", data.bs?.post_win, false)}
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
              Red/Green Engine
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderCard("Post-Loss Recovery", data.rg?.post_loss, true)}
              {renderCard("Post-Win Momentum", data.rg?.post_win, false)}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-slate-400">No data available.</p>
      )}
    </div>
    </LoginScreen>
  );
}
