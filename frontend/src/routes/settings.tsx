import { createFileRoute } from "@tanstack/react-router";
import { Settings as SettingsIcon, Save, RefreshCw, Activity } from "lucide-react";
import { LoginScreen } from "@/components/LoginScreen";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [windowSize, setWindowSize] = useState<number>(300);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch("/api/state?timer=30S");
        const data = await res.json();
        if (data && data.windowSize) {
          setWindowSize(data.windowSize);
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchState();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ windowSize: windowSize, timerType: "30S" })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: "Settings saved successfully!", type: "success" });
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
              Settings
            </h1>
            <p className="mx-auto max-w-md text-lg text-gray-500 dark:text-gray-400">
              Configure your prediction engine parameters.
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
                    Prediction Window Size
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Number of recent games to analyze when generating the next prediction. 
                    Default is 300. Changing this affects how the AI interprets trends.
                  </p>
                  
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          History Games (Window)
                        </label>
                        <input 
                          type="number"
                          value={windowSize}
                          onChange={(e) => setWindowSize(parseInt(e.target.value) || 0)}
                          className="w-32 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-2 font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                          min="50"
                          max="1000"
                        />
                      </div>
                      
                      <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-70 disabled:active:scale-100 w-full sm:w-auto"
                      >
                        {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {saving ? "Saving..." : "Save Settings"}
                      </button>
                    </div>
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
