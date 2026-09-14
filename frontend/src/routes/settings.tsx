import { createFileRoute } from "@tanstack/react-router";
import { Settings as SettingsIcon, Save, RefreshCw, Activity, Target, Database } from "lucide-react";
import { LoginScreen } from "@/components/LoginScreen";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  // mode can be 'smart', 'all', or 'custom'
  const [mode, setMode] = useState<"smart" | "all" | "custom">("smart");
  const [customSize, setCustomSize] = useState<number>(300);
  const [smartWindowSize, setSmartWindowSize] = useState<number | null>(null);
  const [actualActiveMode, setActualActiveMode] = useState<"smart" | "all" | "custom">("smart");
  const [actualActiveCustomSize, setActualActiveCustomSize] = useState<number>(300);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch("/api/state?timer=30S");
        const data = await res.json();
        const windowSize = data?.state?.windowSize;
        if (windowSize !== undefined) {
          if (windowSize === -2) {
            setMode("smart");
            setActualActiveMode("smart");
          } else if (windowSize === -1) {
            setMode("all");
            setActualActiveMode("all");
          } else {
            setMode("custom");
            setCustomSize(windowSize || 300);
            setActualActiveMode("custom");
            setActualActiveCustomSize(windowSize || 300);
          }
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchSmart = async () => {
      try {
        const res = await fetch("/api/window-simulation");
        const json = await res.json();
        if (!json.error && json.bs) {
          const engineData = json.bs;
          const windows = Object.keys(engineData).map(Number).sort((a, b) => a - b);
          let bestWindow = windows[0];
          let maxWinRate = 0;
          for (const w of windows) {
            if (engineData[w.toString()].win_rate > maxWinRate) {
              maxWinRate = engineData[w.toString()].win_rate;
              bestWindow = w;
            }
          }
          setSmartWindowSize(bestWindow);
        }
      } catch (e) {}
    };

    fetchState();
    fetchSmart();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    
    let sizeToSave = customSize;
    if (mode === "smart") sizeToSave = -2;
    if (mode === "all") sizeToSave = -1;
    
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ windowSize: sizeToSave, timerType: "30S" })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: "Settings saved successfully!", type: "success" });
        setActualActiveMode(mode);
        if (mode === "custom") {
          setActualActiveCustomSize(customSize);
        }
      } else {
        setMessage({ text: data.message || "Failed to save settings.", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "An error occurred while saving.", type: "error" });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <LoginScreen>
      <div className="flex min-h-[calc(100vh-6rem)] w-full flex-col items-center py-12 px-4 sm:px-8 relative overflow-hidden">
        {/* Background gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[80px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-6"
        >
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/5 dark:bg-gray-900 dark:ring-white/10">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-transparent via-indigo-500/10 to-transparent"
            />
            <SettingsIcon className="h-10 w-10 text-indigo-500 dark:text-indigo-400" />
          </div>

          <div className="space-y-4 text-center">
            <h1 className="bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-5xl dark:from-white dark:to-gray-400">
              Engine Settings
            </h1>
            <p className="mx-auto max-w-md text-lg text-gray-500 dark:text-gray-400">
              Configure your core AI prediction parameters.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-full mt-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-xl"
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-indigo-500">
                <RefreshCw className="w-8 h-8 animate-spin mb-4" />
                <p className="font-medium">Loading settings...</p>
              </div>
            ) : (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white mb-2">
                    <Activity className="w-6 h-6 text-indigo-500" />
                    Prediction Window Mode
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Choose how the AI analyzes historical games to formulate its next prediction. 
                  </p>
                  
                  {/* Current Active Banner */}
                  <div className="mb-6 p-4 rounded-xl bg-indigo-50 border border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/20 flex items-center gap-3">
                    <Activity className="w-5 h-5 text-indigo-500" />
                    <div>
                      <span className="text-sm font-bold text-indigo-900 dark:text-indigo-300">Currently Active Window: </span>
                      <span className="text-sm font-medium text-indigo-700 dark:text-indigo-400">
                        {actualActiveMode === 'smart' 
                          ? `${smartWindowSize ? smartWindowSize + " games" : "Calculating..."} (Smart Auto-detected)` 
                          : actualActiveMode === 'all' 
                            ? "All Available Games" 
                            : `${actualActiveCustomSize} games`}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <button 
                      onClick={() => setMode("smart")}
                      className={`w-full flex items-start gap-4 p-4 rounded-2xl border-2 transition-all text-left ${mode === "smart" ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10' : 'border-gray-200 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 bg-transparent'}`}
                    >
                      <div className={`mt-1 p-2 rounded-lg ${mode === "smart" ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
                        <Target className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className={`font-bold ${mode === "smart" ? 'text-indigo-900 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'}`}>Smart Window Detection</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Automatically tests various historical windows in real-time and applies the one with the highest proven win rate.</p>
                        {smartWindowSize && (
                          <div className="mt-2 text-xs font-bold text-indigo-600 bg-indigo-100 dark:bg-indigo-500/20 px-2 py-1 rounded w-fit">
                            Currently optimal: {smartWindowSize} games
                          </div>
                        )}
                      </div>
                    </button>

                    <button 
                      onClick={() => setMode("all")}
                      className={`w-full flex items-start gap-4 p-4 rounded-2xl border-2 transition-all text-left ${mode === "all" ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10' : 'border-gray-200 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 bg-transparent'}`}
                    >
                      <div className={`mt-1 p-2 rounded-lg ${mode === "all" ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className={`font-bold ${mode === "all" ? 'text-indigo-900 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'}`}>All Data Available</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Forces the engine to factor in all available game history without cutting off at a specific window size.</p>
                      </div>
                    </button>

                    <button 
                      onClick={() => setMode("custom")}
                      className={`w-full flex items-start gap-4 p-4 rounded-2xl border-2 transition-all text-left ${mode === "custom" ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10' : 'border-gray-200 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 bg-transparent'}`}
                    >
                      <div className={`mt-1 p-2 rounded-lg ${mode === "custom" ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
                        <SettingsIcon className="w-5 h-5" />
                      </div>
                      <div className="w-full">
                        <h4 className={`font-bold ${mode === "custom" ? 'text-indigo-900 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'}`}>Custom Fixed Window</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-3">Set an exact fixed number of past games for the engine to analyze.</p>
                        
                        {mode === "custom" && (
                          <div className="flex items-center gap-3">
                            <input 
                              type="number"
                              value={customSize}
                              onChange={(e) => setCustomSize(parseInt(e.target.value) || 0)}
                              className="w-32 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-2 font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                              min="50"
                              max="1000"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="text-sm font-semibold text-gray-500">games</span>
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                  
                  <div className="flex justify-end border-t border-gray-100 dark:border-gray-800 pt-6">
                    <button 
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-70 disabled:active:scale-100 w-full sm:w-auto"
                    >
                      {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      {saving ? "Saving..." : "Save Settings"}
                    </button>
                  </div>
                </div>

                {message && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className={`p-4 rounded-xl text-sm font-bold text-center ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20' : 'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20'}`}
                  >
                    {message.text}
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </LoginScreen>
  );
}
