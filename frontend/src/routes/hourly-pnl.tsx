import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Zap, RefreshCcw, TrendingUp, TrendingDown, Clock, Activity } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/hourly-pnl")({
  component: HourlyPnlPage,
});

const BACKEND_URL = "/api/hourly-pnl";

function HourlyPnlPage() {
  const [data, setData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("30S");
  const [loading, setLoading] = useState(true);

  const fetchPnl = async (tab: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}?timer=${tab}`);
      const json = await res.json();
      if (Array.isArray(json)) {
        setData(json);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPnl(activeTab);
  }, [activeTab]);

  const totalBsProfit = data.reduce((acc, row) => acc + (row.bsProfit || 0), 0);
  const totalRgProfit = data.reduce((acc, row) => acc + (row.rgProfit || 0), 0);
  const totalNetProfit = totalBsProfit + totalRgProfit;
  
  const bestHour = data.length > 0 ? data.reduce((prev, current) => (prev.totalProfit > current.totalProfit) ? prev : current) : null;
  const worstHour = data.length > 0 ? data.reduce((prev, current) => (prev.totalProfit < current.totalProfit) ? prev : current) : null;

  return (
    <div className="px-6 sm:px-8 pb-12 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pb-6 border-b border-slate-200/60 mt-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">WinGo</div>
          <h2 className="text-4xl font-black text-indigo-600 tracking-tight leading-none mb-2">
            Hourly <span className="text-slate-900">P&L</span>
          </h2>
          <p className="text-sm font-medium text-slate-500">
            Profit and loss breakdown by hour of day.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => fetchPnl(activeTab)}
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

      {!data.length && !loading ? (
        <div className="flex items-center justify-center p-24 text-slate-400">
          No hourly data found.
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center p-24 text-slate-400">
          <RefreshCcw className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 shadow-[0_8px_30px_rgba(99,102,241,0.2)] border border-indigo-400 flex items-center justify-between text-white">
              <div>
                <p className="text-[11px] font-bold text-indigo-100 uppercase tracking-widest mb-1">Total Net</p>
                <h3 className="text-3xl font-black">${totalNetProfit > 0 ? '+' : ''}{totalNetProfit}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-indigo-400/30 flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
            </div>
            
            <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">BS Profit</p>
                <h3 className={`text-3xl font-black ${totalBsProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  ${totalBsProfit > 0 ? '+' : ''}{totalBsProfit}
                </h3>
              </div>
            </div>
            
            <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">RG Profit</p>
                <h3 className={`text-3xl font-black ${totalRgProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  ${totalRgProfit > 0 ? '+' : ''}{totalRgProfit}
                </h3>
              </div>
            </div>
            
            <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex items-center justify-between">
              <div className="w-full">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Best Hour</p>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-slate-800">{bestHour?.hour || '--:--'}</h3>
                  <span className="text-emerald-500 font-bold">${bestHour?.totalProfit || 0}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-widest text-slate-400 font-bold">
                    <th className="p-4 pl-6 whitespace-nowrap">Hour</th>
                    <th className="p-4">Samples</th>
                    <th className="p-4">BS W/L</th>
                    <th className="p-4">RG W/L</th>
                    <th className="p-4">BS P&L</th>
                    <th className="p-4">RG P&L</th>
                    <th className="p-4 pr-6 text-right">Net P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {data.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6 font-semibold text-slate-800 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {row.hour}
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-500">
                        {row.samples}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 text-sm font-medium">
                          <span className="text-emerald-500">{row.bsWins}W</span>
                          <span className="text-slate-300">/</span>
                          <span className="text-rose-500">{row.bsLosses}L</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 text-sm font-medium">
                          <span className="text-emerald-500">{row.rgWins}W</span>
                          <span className="text-slate-300">/</span>
                          <span className="text-rose-500">{row.rgLosses}L</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-sm font-bold ${row.bsProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          ${row.bsProfit > 0 ? '+' : ''}{row.bsProfit}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`text-sm font-bold ${row.rgProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          ${row.rgProfit > 0 ? '+' : ''}{row.rgProfit}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${
                          row.totalProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {row.totalProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          ${Math.abs(row.totalProfit)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
