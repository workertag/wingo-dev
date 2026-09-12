import { useState } from "react";
import { Lock, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function LoginScreen({ children }: { children: React.ReactNode }) {
  const { isAdmin, login } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  if (isAdmin) {
    return <>{children}</>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    
    const success = await login(password);
    if (!success) {
      setError(true);
      setPassword("");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 animate-in fade-in duration-500">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 p-8 sm:p-12 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-500">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Admin Access</h2>
        <p className="text-sm font-medium text-slate-500 mb-8">Please enter the admin password to continue.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              className={`w-full px-5 py-3.5 bg-slate-50 border rounded-2xl text-slate-800 font-medium placeholder-slate-400 focus:outline-none transition-all ${
                error ? 'border-rose-300 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10' : 'border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10'
              }`}
            />
            {error && <p className="text-xs font-bold text-rose-500 mt-2 text-left px-2">Incorrect password. Please try again.</p>}
          </div>
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-bold py-3.5 px-6 rounded-2xl transition-colors flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Unlock Dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
