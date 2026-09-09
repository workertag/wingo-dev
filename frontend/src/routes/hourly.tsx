import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Zap, RefreshCcw, Clock, Target, Activity } from "lucide-react";

export const Route = createFileRoute("/hourly")({
  component: HourlyAccuracyDashboard,
});

const BACKEND_URL = "/api/hourly-accuracy";

function HourlyAccuracyDashboard() {
  const [data, setData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("30S");
  const [loading, setLoading] = useState(true);

  const fetchHourly = async (tab: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}?timer=${tab}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHourly(activeTab);
  }, [activeTab]);

  return (
    <div className="px-6 sm:px-8 pb-12 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pb-6 border-b border-slate-200/60 mt-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">WinGo</div>
          <h2 className="text-4xl font-black text-indigo-600 tracking-tight leading-none mb-2">
            Hourly <span className="text-slate-900">Accuracy</span>
          </h2>
          <p className="text-sm font-medium text-slate-500">
            Compare Base and Smart engine performance by hour of day.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => fetchHourly(activeTab)}
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

      {loading && data.length === 0 ? (
        <div className="flex items-center justify-center p-24 text-slate-400">
          <RefreshCcw className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex gap-3">
                 <div className="mt-1 text-indigo-500">
                   <Clock className="w-5 h-5" />
                 </div>
                 <div>
                   <h2 className="text-base font-black text-slate-900">Win Rate By Hour</h2>
                   <p className="text-[11px] font-medium text-slate-400">Time-based pattern comparison</p>
                 </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                    <th className="p-4 pl-6 whitespace-nowrap">Hour</th>
                    <th className="p-4 text-blue-600">Base BS %</th>
                    <th className="p-4 text-amber-600">Smart BS %</th>
                    <th className="p-4">Base Samples</th>
                    <th className="p-4 text-emerald-600">Base RG %</th>
                    <th className="p-4 text-teal-600">Smart RG %</th>
                    <th className="p-4 pr-6">Smart Samples</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {data.map((row: any, i: number) => {
                    const bsDiff = row.smartBsWinRate - row.baseBsWinRate;
                    const rgDiff = row.smartRgWinRate - row.baseRgWinRate;
                    
                    return (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 pl-6 font-bold text-slate-800">{row.hour}</td>
                        <td className="p-4 font-semibold text-slate-600">
                          {row.baseBsWinRate.toFixed(1)}%
                        </td>
                        <td className="p-4 font-bold text-slate-900">
                          {row.smartBsWinRate.toFixed(1)}%
                          {bsDiff > 0 && <span className="text-emerald-500 text-[10px] ml-2">+{bsDiff.toFixed(1)}</span>}
                          {bsDiff < 0 && <span className="text-rose-500 text-[10px] ml-2">{bsDiff.toFixed(1)}</span>}
                        </td>
                        <td className="p-4 text-xs font-medium text-slate-500">{row.baseSamples}</td>
                        <td className="p-4 font-semibold text-slate-600">
                          {row.baseRgWinRate.toFixed(1)}%
                        </td>
                        <td className="p-4 font-bold text-slate-900">
                          {row.smartRgWinRate.toFixed(1)}%
                          {rgDiff > 0 && <span className="text-emerald-500 text-[10px] ml-2">+{rgDiff.toFixed(1)}</span>}
                          {rgDiff < 0 && <span className="text-rose-500 text-[10px] ml-2">{rgDiff.toFixed(1)}</span>}
                        </td>
                        <td className="p-4 pr-6 text-xs font-medium text-slate-500">{row.smartSamples}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
