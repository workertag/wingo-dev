import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Zap, RefreshCcw } from "lucide-react";

export const Route = createFileRoute("/history")({
  component: HistoryLogs,
});

const BACKEND_URL = "/api/history";

function formatTime(ts: number | string) {
  if (!ts) return "—";
  // The timestamp is in milliseconds
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

function HistoryLogs() {
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState("30S");
  const [loading, setLoading] = useState(false);

  const fetchHistory = async (p: number, tab: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}?timer=${tab}&page=${p}&limit=20`);
      const json = await res.json();
      if (json.data) {
        setData(json.data);
        setTotalPages(json.totalPages);
        setPage(json.page);
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
    fetchHistory(page, activeTab);
  }, [page, activeTab]);

  return (
    <div className="px-6 sm:px-8 pb-12 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pb-6 border-b border-slate-200/60 mt-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">WinGo</div>
          <h2 className="text-4xl font-black text-indigo-600 tracking-tight leading-none mb-2">
            History <span className="text-slate-900">Logs</span>
          </h2>
          <p className="text-sm font-medium text-slate-500">
            Past predictions, actual results, and engine performance tracking.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => fetchHistory(page, activeTab)}
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

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden flex flex-col">
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
              {data.map((row, i) => (
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
                      row.actualColour === 'green' ? 'bg-emerald-500' :
                      row.actualColour === 'red' ? 'bg-rose-500' : 'bg-violet-500'
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
