import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Grid, Zap } from "lucide-react";
import { LoginScreen } from "@/components/LoginScreen";

export const Route = createFileRoute("/pattern/heatmap")({
  component: HeatmapPage,
});

const BACKEND_URL = "/api/advanced-analytics";
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function HeatmapPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("30S");
  const [activeEngine, setActiveEngine] = useState("bs"); // 'bs' or 'rg'
  const [windowDays, setWindowDays] = useState(7); // 7, 14, 30

  const fetchAnalytics = async (tab: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}?timer=${tab}`);
      const json = await res.json();
      setData(json.heatmap || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(activeTab);
  }, [activeTab]);

  const getHeatmapColor = (wins: number, losses: number) => {
    const total = wins + losses;
    if (total === 0) return "bg-slate-50 border-slate-100 text-slate-300";
    
    const rate = wins / total;
    if (rate >= 0.55) return "bg-emerald-100 border-emerald-200 text-emerald-700 font-bold shadow-sm";
    if (rate >= 0.50) return "bg-emerald-50 border-emerald-100 text-emerald-600 font-medium";
    if (rate >= 0.45) return "bg-rose-50 border-rose-100 text-rose-500 font-medium";
    return "bg-rose-100 border-rose-200 text-rose-700 font-bold shadow-sm";
  };

  return (
    <LoginScreen>
    <div className="px-6 sm:px-8 pb-12 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pb-6 border-b border-slate-200/60 mt-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Pattern Lab</div>
          <h2 className="text-4xl font-black text-indigo-600 tracking-tight leading-none mb-2 flex items-center gap-3">
            Profit <span className="text-slate-900">Heatmap</span>
          </h2>
          <p className="text-sm font-medium text-slate-500">
            Discover the most profitable hours of the week based on recent history.
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

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
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
        
        <div className="flex p-1 bg-white rounded-xl shadow-sm border border-slate-200">
          <button
            onClick={() => setWindowDays(7)}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${windowDays === 7 ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-700'}`}
          >
            7 Days
          </button>
          <button
            onClick={() => setWindowDays(14)}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${windowDays === 14 ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-700'}`}
          >
            14 Days
          </button>
          <button
            onClick={() => setWindowDays(30)}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${windowDays === 30 ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-700'}`}
          >
            30 Days
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Grid className="w-5 h-5 text-indigo-500" />
            24-Hour Win Rate Matrix
          </h3>
          <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200" /> 55%+ Win Rate</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-rose-100 border border-rose-200" /> &lt; 45% Win Rate</div>
          </div>
        </div>
        
        <div className="p-6 overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>
          ) : !data ? (
            <div className="text-center py-12 text-slate-400 font-bold">No data available</div>
          ) : (
            <table className="w-full border-collapse min-w-[800px]">
              <thead>
                <tr>
                  <th className="p-2 border-b border-slate-200 text-left text-xs font-black text-slate-400 uppercase tracking-widest w-24">Date</th>
                  {HOURS.map(h => (
                    <th key={h} className="p-2 border-b border-slate-200 text-center text-[10px] font-bold text-slate-500">{h.toString().padStart(2, '0')}:00</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const engineData = data[activeEngine] || {};
                  const allDates = Object.keys(engineData).sort((a, b) => b.localeCompare(a));
                  const displayDates = allDates.slice(0, windowDays);
                  
                  if (displayDates.length === 0) {
                    return <tr><td colSpan={25} className="py-8 text-center text-slate-400 font-bold">No date records found.</td></tr>;
                  }

                  return displayDates.map(date => (
                    <tr key={date}>
                      <td className="p-2 border-b border-slate-100 text-[10px] font-bold text-slate-700 whitespace-nowrap">{date}</td>
                      {HOURS.map(h => {
                        const cell = engineData[date]?.[h.toString()] || {wins: 0, losses: 0};
                        const colorClass = getHeatmapColor(cell.wins, cell.losses);
                        const total = cell.wins + cell.losses;
                        const rate = total > 0 ? Math.round((cell.wins / total) * 100) : 0;
                        
                        return (
                          <td key={h} className="p-1 border-b border-slate-100 text-center">
                            <div className={`w-full h-10 rounded border flex items-center justify-center text-[10px] transition-all hover:scale-110 cursor-default ${colorClass}`} title={`${cell.wins}W - ${cell.losses}L (${rate}%)`}>
                              {total > 0 ? `${rate}%` : '-'}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
    </LoginScreen>
  );
}
