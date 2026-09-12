import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Hash, Zap } from "lucide-react";
import { LoginScreen } from "@/components/LoginScreen";

export const Route = createFileRoute("/pattern/hot-cold")({
  component: HotColdPage,
});

const BACKEND_URL = "/api/advanced-analytics";

function HotColdPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("30S");
  const [activeWindow, setActiveWindow] = useState("100"); // 100, 500, ALL

  const fetchAnalytics = async (tab: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}?timer=${tab}`);
      const json = await res.json();
      setData(json.hot_cold || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(activeTab);
  }, [activeTab]);

  const renderNumbers = () => {
    if (!data || !data[activeWindow]) return null;
    const counts = data[activeWindow];
    const total = Object.values(counts).reduce((a: any, b: any) => a + b, 0) as number;
    if (total === 0) return <p className="text-slate-400">No data for this window.</p>;

    // Find max and min to color code
    const values = Object.values(counts) as number[];
    const maxCount = Math.max(...values);
    const minCount = Math.min(...values);

    return (
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
          const count = counts[num] as number;
          const rate = ((count / total) * 100).toFixed(1);
          const isHot = count === maxCount;
          const isCold = count === minCount;

          let colorClass = "bg-slate-50 border-slate-100";
          if (isHot) colorClass = "bg-rose-50 border-rose-200 shadow-sm";
          if (isCold) colorClass = "bg-blue-50 border-blue-200";

          // Wingo colors: 0/5=Violet, 1,3,7,9=Green, 2,4,6,8=Red
          let numColor = "text-slate-800";
          if (num === 0 || num === 5) numColor = "text-violet-500";
          else if (num % 2 === 0) numColor = "text-rose-500";
          else numColor = "text-emerald-500";

          return (
            <div key={num} className={`p-4 rounded-2xl border ${colorClass} flex flex-col items-center justify-center relative group transition-all hover:-translate-y-1`}>
              {isHot && <span className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">🔥</span>}
              {isCold && <span className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">❄️</span>}
              
              <span className={`text-4xl font-black mb-1 ${numColor}`}>{num}</span>
              <span className="text-sm font-bold text-slate-700">{count} times</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{rate}% freq</span>
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
            Hot & Cold <span className="text-slate-900">Numbers</span>
          </h2>
          <p className="text-sm font-medium text-slate-500">
            Track which exact numbers (0-9) are trending in the market.
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
            onClick={() => setActiveWindow("100")}
            className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeWindow === '100' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Last 100 Games
          </button>
          <button
            onClick={() => setActiveWindow("500")}
            className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeWindow === '500' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Last 500 Games
          </button>
          <button
            onClick={() => setActiveWindow("ALL")}
            className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeWindow === 'ALL' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            All Time
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
          <Hash className="w-5 h-5 text-indigo-500" />
          <h3 className="text-lg font-black text-slate-800 tracking-tight">Draw Frequency Distribution</h3>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>
        ) : (
          renderNumbers()
        )}
      </div>
    </div>
    </LoginScreen>
  );
}
