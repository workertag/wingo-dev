import { createFileRoute } from "@tanstack/react-router";
import { Settings as SettingsIcon, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="flex h-[calc(100vh-6rem)] w-full flex-col items-center justify-center p-8 text-center relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[80px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 flex max-w-2xl flex-col items-center gap-6"
      >
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-black/5 dark:bg-gray-900 dark:ring-white/10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-transparent via-indigo-500/10 to-transparent"
          />
          <SettingsIcon className="h-10 w-10 text-indigo-500 dark:text-indigo-400" />
        </div>

        <div className="space-y-4">
          <h1 className="bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-6xl dark:from-white dark:to-gray-400">
            Settings
          </h1>
          <p className="mx-auto max-w-md text-lg text-gray-500 dark:text-gray-400">
            We are crafting settings , it will be available soon.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-8 flex items-center gap-3 rounded-full border border-indigo-100 bg-indigo-50/50 px-6 py-3 text-indigo-600 shadow-sm backdrop-blur-sm dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300"
        >
          <Sparkles className="h-5 w-5 animate-pulse text-indigo-500" />
          <span className="font-medium">Coming Soon</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
