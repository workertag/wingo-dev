import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Zap, RefreshCcw, TrendingDown, X, Calendar, Clock } from "lucide-react";
import { LoginScreen } from "@/components/LoginScreen";

export const Route = createFileRoute("/loss-streaks")({
  component: LossStreaksPage,
});

const BACKEND_URL = "/api/loss-streaks";
const windows = ["100", "200", "300", "500", "1000", "2000", "3000", "5000", "999999"];
const windowLabels = ["100", "200", "300", "500", "1000", "2000", "3000", "5000", "ALL"];
const streakRows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

function LossStreaksPage() {
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("30S");
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<any>(null);

  const openModal = (streak: number, engine: string, windowLabel: string, times: number[]) => {
    if (!times || times.length === 0) return;
    times.sort((a, b) => b - a); // newest first
    setModalData({ streak, engine, windowLabel, times });
    setModalOpen(true);
  };

  const formatTime = (ts: number) => {
    if (!ts) return "—";
    const d = new Date(ts);
    return d.toLocaleString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
  }, [activeTab]);

  const getStats = (engine: "bs" | "rg", winKey: string = "999999") => {
    if (!data || !data[engine] || !data[engine][winKey]) return { totalLosses: 0, maxStreak: 0, totalSettled: 0, lossRate: 0 };
    const st = data[engine][winKey];
    return {
      totalLosses: st.losses,
      maxStreak: st.max,
      totalSettled: st.n,
      lossRate: st.n > 0 ? (st.losses / st.n * 100).toFixed(0) : 0
    };
  };

  const bsAll = getStats("bs");
  const rgAll = getStats("rg");

  return (
    <LoginScreen>
    <div className="px-6 sm:px-8 pb-12 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pb-6 border-b border-slate-200/60 mt-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-100 text-orange-500 rounded-2xl">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">
              Loss-Streak / Downside Monitor
            </h2>
            <p className="text-sm font-medium text-slate-500">
              Total consecutive LOSS streak statistics
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => fetchStreaks(activeTab)}
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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col items-center justify-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">BS Total Losses</p>
              <h3 className="text-2xl font-black text-slate-800">{bsAll.totalLosses}</h3>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col items-center justify-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">BS Max Streak</p>
              <h3 className="text-2xl font-black text-slate-800">{bsAll.maxStreak}</h3>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col items-center justify-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">BS Settled</p>
              <h3 className="text-2xl font-black text-slate-800">{bsAll.totalSettled}</h3>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col items-center justify-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">BS Loss Rate</p>
              <h3 className="text-2xl font-black text-slate-800">{bsAll.lossRate}%</h3>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col items-center justify-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">RG Total Losses</p>
              <h3 className="text-2xl font-black text-slate-800">{rgAll.totalLosses}</h3>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col items-center justify-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">RG Max Streak</p>
              <h3 className="text-2xl font-black text-slate-800">{rgAll.maxStreak}</h3>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col items-center justify-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">RG Settled</p>
              <h3 className="text-2xl font-black text-slate-800">{rgAll.totalSettled}</h3>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col items-center justify-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">RG Loss Rate</p>
              <h3 className="text-2xl font-black text-slate-800">{rgAll.lossRate}%</h3>
            </div>
          </div>

          <div className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100">
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="py-4 px-4 font-bold text-slate-400 text-xs w-[120px] text-left">Streak</th>
                    <th colSpan={windows.length} className="py-4 px-4 font-bold text-slate-500 text-xs tracking-wide border-l border-slate-100">
                      BS • Latest Settled Windows
                    </th>
                    <th colSpan={windows.length} className="py-4 px-4 font-bold text-slate-500 text-xs tracking-wide border-l border-slate-100">
                      RG • Latest Settled Windows
                    </th>
                  </tr>
                  <tr className="border-b border-slate-100 text-slate-500 text-xs font-bold">
                    <td className="py-3 px-4"></td>
                    {windows.map((w, i) => (
                      <td key={`bs-win-${w}`} className="py-3 px-2 border-l border-slate-50 w-[50px]">{windowLabels[i]}</td>
                    ))}
                    {windows.map((w, i) => (
                      <td key={`rg-win-${w}`} className={`py-3 px-2 w-[50px] ${i === 0 ? 'border-l border-slate-100' : 'border-l border-slate-50'}`}>{windowLabels[i]}</td>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {streakRows.map(streakLen => (
                    <tr key={streakLen} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 text-left font-bold text-slate-700">
                        {streakLen === 15 ? '15+ losses' : `${streakLen} loss${streakLen > 1 ? 'es' : ''}`}
                      </td>
                      {windows.map((w, i) => {
                        let count = 0;
                        let times: number[] = [];
                        if (data.bs && data.bs[w] && data.bs[w].times) {
                           if (streakLen === 15) {
                             times = Object.entries(data.bs[w].times)
                               .filter(([k,v]) => Number(k) >= 15)
                               .flatMap(([k,v]: any) => v);
                           } else {
                             times = data.bs[w].times[streakLen] || [];
                           }
                           count = times.length;
                        }
                        return (
                          <td key={`bs-${w}-${streakLen}`} className={`py-3.5 px-2 text-xs font-medium border-l border-slate-50 ${count > 0 ? 'text-slate-700' : 'text-slate-300'}`}>
                            {count > 0 ? (
                              <button
                                onClick={() => openModal(streakLen, 'Big/Small', windowLabels[i], times)}
                                className="w-full h-full hover:bg-slate-100 hover:text-indigo-600 rounded cursor-pointer transition-colors px-2 py-1"
                              >
                                {count}
                              </button>
                            ) : count}
                          </td>
                        );
                      })}
                      {windows.map((w, i) => {
                        let count = 0;
                        let times: number[] = [];
                        if (data.rg && data.rg[w] && data.rg[w].times) {
                           if (streakLen === 15) {
                             times = Object.entries(data.rg[w].times)
                               .filter(([k,v]) => Number(k) >= 15)
                               .flatMap(([k,v]: any) => v);
                           } else {
                             times = data.rg[w].times[streakLen] || [];
                           }
                           count = times.length;
                        }
                        return (
                          <td key={`rg-${w}-${streakLen}`} className={`py-3.5 px-2 text-xs font-medium ${i === 0 ? 'border-l border-slate-100' : 'border-l border-slate-50'} ${count > 0 ? 'text-slate-700' : 'text-slate-300'}`}>
                            {count > 0 ? (
                              <button
                                onClick={() => openModal(streakLen, 'Red/Green', windowLabels[i], times)}
                                className="w-full h-full hover:bg-slate-100 hover:text-emerald-600 rounded cursor-pointer transition-colors px-2 py-1"
                              >
                                {count}
                              </button>
                            ) : count}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100 mt-4">
            <p className="text-[11px] font-bold text-slate-400">
              Exact streaks only. Windows use the latest settled WIN/LOSS records for each engine independently.
            </p>
          </div>
        </>
      )}

      {/* Modal */}
      {modalOpen && modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-500" />
                  {modalData.streak === 15 ? '15+' : modalData.streak}-Loss Streak Timing
                </h3>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
                  {modalData.engine} • Window: {modalData.windowLabel}
                </p>
              </div>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 sm:p-6 overflow-y-auto bg-white flex-1">
              <div className="space-y-3">
                {modalData.times.map((ts: number, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-white group-hover:border-indigo-100 transition-colors">
                        <Clock className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                      </div>
                      <span className="text-sm font-bold text-slate-700">{formatTime(ts)}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Occurrence {modalData.times.length - idx}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
              <p className="text-xs font-semibold text-slate-500">
                Found {modalData.times.length} instance{modalData.times.length !== 1 ? 's' : ''} of this streak.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
    </LoginScreen>
  );
}
