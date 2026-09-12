import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Zap, RefreshCcw, TrendingUp, TrendingDown, Target, Wallet } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: EarningHistoryPage,
});

const BACKEND_URL = "/api/earning-history";

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

function EarningHistoryPage() {
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState("30S");
  const [loading, setLoading] = useState(false);

  const fetchEarnings = async (p: number, tab: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}?timer=${tab}&page=${p}&limit=20`);
      const json = await res.json();
      if (json.data) {
        setData(json.data);
        setTotalPages(json.totalPages);
        setPage(json.page);
        setSummary(json.summary);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings(page, activeTab);
  }, [page, activeTab]);

  return (
    <div className="px-6 sm:px-8 pb-12 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pb-6 border-b border-slate-200/60 mt-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">WinGo</div>
          <h2 className="text-4xl font-black text-indigo-600 tracking-tight leading-none mb-2">
            Earning <span className="text-slate-900">History</span>
          </h2>
          <p className="text-sm font-medium text-slate-500">
            Per-game earning ledger and running profit tracking.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => fetchEarnings(page, activeTab)}
            className="p-2.5 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 shadow-sm transition-all"
            disabled={loading}
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-500' : ''}`} />
          </button>
          
          <div className="flex p-1.5 bg-white rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-100">
            <button
              onClick={() => { setActiveTab("30S"); setPage(1); }}
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
              onClick={() => { setActiveTab("1M"); setPage(1); }}
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

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 shadow-[0_8px_30px_rgba(99,102,241,0.2)] border border-indigo-400 flex items-center justify-between text-white">
            <div>
              <p className="text-[11px] font-bold text-indigo-100 uppercase tracking-widest mb-1">Total Balance</p>
              <h3 className="text-3xl font-black">${summary.runningTotal > 0 ? '+' : ''}{summary.runningTotal}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-indigo-400/30 flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
          
          <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Games</p>
              <h3 className="text-3xl font-black text-slate-800">
                {summary.totalGames}
              </h3>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">BS Win Rate</p>
              <h3 className="text-3xl font-black text-slate-800">
                {summary.bsWinRate.toFixed(1)}%
              </h3>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">RG Win Rate</p>
              <h3 className="text-3xl font-black text-slate-800">
                {summary.rgWinRate.toFixed(1)}%
              </h3>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-widest text-slate-400 font-bold">
                <th className="p-4 pl-6 whitespace-nowrap">Issue</th>
                <th className="p-4">Time</th>
                <th className="p-4 text-center">BS Bet / Result</th>
                <th className="p-4 text-center">RG Bet / Result</th>
                <th className="p-4 text-right">Game P&L</th>
                <th className="p-4 pr-6 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {data.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 pl-6 font-semibold text-slate-800">{row.period}</td>
                  <td className="p-4 text-xs font-medium text-slate-500">{formatTime(row.time)}</td>
                  
                  <td className="p-4">
                    {row.bsStatus === 'WAIT' || row.bsStatus === 'NO BET' ? (
                      <span className="text-xs text-slate-400 font-medium block text-center">No Bet</span>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex flex-col items-end">
                          <span className={`text-xs font-bold ${row.bsPred === 'BIG' ? 'text-blue-500' : 'text-slate-400'}`}>
                            {row.bsPred}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">${row.bsBet}</span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                          row.bsStatus === 'WIN' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                          'bg-rose-50 border-rose-200 text-rose-600'
                        }`}>
                          {row.bsStatus}
                        </span>
                        <span className={`text-sm font-bold w-12 text-left ${row.bsPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {row.bsPnl > 0 ? '+' : ''}{row.bsPnl}
                        </span>
                      </div>
                    )}
                  </td>
                  
                  <td className="p-4">
                    {row.rgStatus === 'WAIT' || row.rgStatus === 'NO BET' ? (
                      <span className="text-xs text-slate-400 font-medium block text-center">No Bet</span>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex flex-col items-end">
                          <span className={`text-xs font-bold ${
                            row.rgPred === 'GREEN' ? 'text-emerald-500' :
                            row.rgPred === 'RED' ? 'text-rose-500' :
                            row.rgPred === 'VIOLET' ? 'text-violet-500' : 'text-slate-400'
                          }`}>
                            {row.rgPred}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">${row.rgBet}</span>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                          row.rgStatus === 'WIN' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                          'bg-rose-50 border-rose-200 text-rose-600'
                        }`}>
                          {row.rgStatus}
                        </span>
                        <span className={`text-sm font-bold w-12 text-left ${row.rgPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {row.rgPnl > 0 ? '+' : ''}{row.rgPnl}
                        </span>
                      </div>
                    )}
                  </td>

                  <td className="p-4 text-right">
                    <span className={`text-sm font-bold ${row.gamePnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      ${row.gamePnl > 0 ? '+' : ''}{row.gamePnl}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <span className={`text-sm font-black ${row.runningTotal >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                      ${row.runningTotal > 0 ? '+' : ''}{row.runningTotal}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && !loading && (
            <div className="p-12 text-center text-slate-400 font-medium">No logs found.</div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <p className="text-xs font-semibold text-slate-500 pl-2">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
