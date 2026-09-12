import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { GitMerge, Zap } from "lucide-react";
import { LoginScreen } from "@/components/LoginScreen";

export const Route = createFileRoute("/pattern/sequences")({
  component: SequencesPage,
});

const BACKEND_URL = "/api/advanced-analytics";

function SequencesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("30S");
  const [activeEngine, setActiveEngine] = useState("bs"); 

  const fetchAnalytics = async (tab: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}?timer=${tab}`);
      const json = await res.json();
      setData(json.sequences || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(activeTab);
  }, [activeTab]);

  const renderSeqStats = (stats: any, engine: string) => {
    if (!stats) return <p className="text-slate-400">No sequence data available yet.</p>;
    
    // Sort by sequence length descending
    const keys = Object.keys(stats).sort((a, b) => {
      const lenA = parseInt(a.split('_')[0]);
      const lenB = parseInt(b.split('_')[0]);
      return lenB - lenA;
    });

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {keys.map(k => {
          const [len, side] = k.split('_');
          const cell = stats[k];
          const total = cell.wins + cell.losses;
          const rate = total > 0 ? ((cell.wins / total) * 100).toFixed(1) : "0";
          
          let sideColor = "text-slate-700 bg-slate-100";
          if (side === "BIG") sideColor = "text-blue-700 bg-blue-100";
          if (side === "SMALL") sideColor = "text-orange-700 bg-orange-100";
          if (side === "RED") sideColor = "text-rose-700 bg-rose-100";
          if (side === "GREEN") sideColor = "text-emerald-700 bg-emerald-100";

          return (
            <div key={k} className="p-5 rounded-2xl border border-slate-100 hover:border-indigo-100 bg-white shadow-sm transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-black ${sideColor}`}>
                    {side} x{len}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-400">{total} encounters</span>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">AI Win Rate</p>
                  <span className={`text-2xl font-black ${parseFloat(rate) >= 50 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {rate}%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-700 block">{cell.wins} Wins</span>
                  <span className="text-sm font-bold text-slate-500">{cell.losses} Losses</span>
                </div>
              </div>
            </div>
          );
        })}
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
            Sequence <span className="text-slate-900">Detection</span>
          </h2>
          <p className="text-sm font-medium text-slate-500">
            Analyze how the AI engine performs against "Dragons" (consecutive identical results).
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

      <div className="flex items-center gap-4 mb-4">
        <div className="flex p-1 bg-white rounded-xl shadow-sm border border-slate-200">
          <button
            onClick={() => setActiveEngine("bs")}
            className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeEngine === 'bs' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'}`}
          >
            Big/Small Engine
          </button>
          <button
            onClick={() => setActiveEngine("rg")}
            className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeEngine === 'rg' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500'}`}
          >
            Red/Green Engine
          </button>
        </div>
      </div>

      <div className="bg-slate-50/50 p-6 sm:p-8 rounded-3xl border border-slate-100">
        <div className="flex items-center gap-2 mb-6">
          <GitMerge className="w-5 h-5 text-indigo-500" />
          <h3 className="text-lg font-black text-slate-800 tracking-tight">Market Trend Resilience</h3>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>
        ) : (
          renderSeqStats(data?.[activeEngine], activeEngine)
        )}
      </div>
    </div>
    </LoginScreen>
  );
}
