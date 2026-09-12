import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Zap, RefreshCcw, TrendingUp, PieChart, Activity } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsDashboard,
});

const BACKEND_URL = "/api/analytics";

function AnalyticsDashboard() {
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("30S");
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async (tab: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}?timer=${tab}`);
      const json = await res.json();
      if (json.summary) {
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
    fetchAnalytics(activeTab);
  }, [activeTab]);

  return (
    <div className="px-6 sm:px-8 pb-12 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pb-6 border-b border-slate-200/60 mt-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">WinGo</div>
          <h2 className="text-4xl font-black text-indigo-600 tracking-tight leading-none mb-2">
            Engine <span className="text-slate-900">Analytics</span>
          </h2>
          <p className="text-sm font-medium text-slate-500">
            Win rate statistics and pattern performance across different levels.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => fetchAnalytics(activeTab)}
            className="p-2.5 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 shadow-sm transition-all"
            disabled={loading}
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-500' : ''}`} />
          </button>
          
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
        </div>
      </div>

      {!data || loading ? (
        <div className="flex items-center justify-center p-24 text-slate-400">
          <RefreshCcw className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Base Engine (All Rounds)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Samples Analyzed</p>
                  <h3 className="text-3xl font-black text-slate-800">{data.summary.totalAnalyzed}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                  <Activity className="w-6 h-6" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-6 shadow-[0_8px_30px_rgba(59,130,246,0.2)] border border-blue-400 flex items-center justify-between text-white">
                <div>
                  <p className="text-[11px] font-bold text-blue-100 uppercase tracking-widest mb-1">BS Win Rate</p>
                  <h3 className="text-3xl font-black">{data.summary.bsWinRate.toFixed(1)}%</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-400/30 flex items-center justify-center">
                  <PieChart className="w-6 h-6" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-6 shadow-[0_8px_30px_rgba(16,185,129,0.2)] border border-emerald-400 flex items-center justify-between text-white">
                <div>
                  <p className="text-[11px] font-bold text-emerald-100 uppercase tracking-widest mb-1">RG Win Rate</p>
                  <h3 className="text-3xl font-black">{data.summary.rgWinRate.toFixed(1)}%</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-emerald-400/30 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>


          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Big/Small Layer Performance</h3>
              <div className="space-y-4">
                {Object.entries(data.bsLayers).sort((a,b) => Number(a[0]) - Number(b[0])).map(([layer, stats]: any) => {
                  const total = stats.wins + stats.losses;
                  const winRate = total > 0 ? (stats.wins / total) * 100 : 0;
                  return (
                    <div key={layer}>
                      <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5">
                        <span>Layer {layer}</span>
                        <span>{winRate.toFixed(1)}% ({stats.wins}W / {stats.losses}L)</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${winRate}%` }}
                          className="h-full bg-blue-500 rounded-full" 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Red/Green Layer Performance</h3>
              <div className="space-y-4">
                {Object.entries(data.rgLayers).sort((a,b) => Number(a[0]) - Number(b[0])).map(([layer, stats]: any) => {
                  const total = stats.wins + stats.losses;
                  const winRate = total > 0 ? (stats.wins / total) * 100 : 0;
                  return (
                    <div key={layer}>
                      <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5">
                        <span>Layer {layer}</span>
                        <span>{winRate.toFixed(1)}% ({stats.wins}W / {stats.losses}L)</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${winRate}%` }}
                          className="h-full bg-emerald-500 rounded-full" 
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
