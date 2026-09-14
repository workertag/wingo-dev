import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Calculator, Play, DollarSign, Clock, Layers, TrendingUp, AlertCircle, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/calculator")({
  component: CalculatorPage,
});

function CalculatorPage() {
  const [balance, setBalance] = useState<number>(35000);
  const [baseBet, setBaseBet] = useState<number>(1);
  const [maxLevel, setMaxLevel] = useState<number>(8);
  const [hours, setHours] = useState<number>(10);
  const [gamesPerHour, setGamesPerHour] = useState<number>(60); // Default 1M
  const [winRate, setWinRate] = useState<number>(54); // Default 54% for AI

  const [simulationResult, setSimulationResult] = useState<any>(null);

  const handleSimulate = () => {
    const totalGames = hours * gamesPerHour;
    const pWin = winRate / 100;
    const pLoss = 1 - pWin;

    let currentBalance = balance;
    let maxDrawdown = 0;
    let peakBalance = balance;
    let currentLevel = 1;
    let wins = 0;
    let losses = 0;
    let maxLevelHits = 0;

    // Simulation loop (deterministic-ish expected value, or random? Let's do expected probability based to be deterministic)
    // Actually, Monte-carlo is better, but maybe just a fixed deterministic expected value is what they want.
    // Let's do a deterministic expected value calculation.
    
    // In a Wingo 3x system:
    // Level 1: Bet 1. Win = 1.96
    // Level n: Bet 3^(n-1). Win = 3^(n-1) * 1.96

    let totalProfit = 0;
    
    // Calculate expected profit per sequence
    let expectedProfitPerSequence = 0;
    let expectedLengthPerSequence = 0;
    
    let probReachingLevel = 1.0;
    let totalBetSoFar = 0;

    for (let i = 1; i <= maxLevel; i++) {
      const betAmount = baseBet * Math.pow(3, i - 1);
      totalBetSoFar += betAmount;
      
      const winAmount = betAmount * 1.96;
      const profitIfWin = winAmount - totalBetSoFar;
      
      const probWinHere = probReachingLevel * pWin;
      
      expectedProfitPerSequence += probWinHere * profitIfWin;
      expectedLengthPerSequence += probReachingLevel * pWin * i;
      
      probReachingLevel *= pLoss; // Probability of reaching next level
    }

    // If it loses at max level, we lose the total bet so far
    const probLosingMax = probReachingLevel;
    expectedProfitPerSequence -= probLosingMax * totalBetSoFar;
    expectedLengthPerSequence += probLosingMax * maxLevel; // Sequences that max out take maxLevel games

    const totalSequences = totalGames / expectedLengthPerSequence;
    totalProfit = totalSequences * expectedProfitPerSequence;
    
    const finalBalance = balance + totalProfit;
    
    setSimulationResult({
      finalBalance,
      totalProfit,
      totalGames,
      totalSequences,
      expectedProfitPerSequence,
      probLosingMax,
      maxLevelLossTotal: totalBetSoFar, // Total capital at risk for max level
    });
  };

  return (
    <div className="px-6 sm:px-8 pb-12 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pb-6 border-b border-slate-200/60 mt-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Tools</div>
          <h2 className="text-4xl font-black text-indigo-600 tracking-tight leading-none mb-2">
            Profit <span className="text-slate-900">Simulator</span>
          </h2>
          <p className="text-sm font-medium text-slate-500">
            Calculate estimated balance based on historical parameters.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-500" />
              Parameters
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Current Wallet Balance (₹)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="number" 
                    value={balance}
                    onChange={(e) => setBalance(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Minimum Starting Level (Base Bet)
                </label>
                <div className="relative">
                  <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="number" 
                    value={baseBet}
                    onChange={(e) => setBaseBet(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Maximum Level Set
                </label>
                <div className="relative">
                  <ShieldAlert className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="number" 
                    value={maxLevel}
                    onChange={(e) => setMaxLevel(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Hours Before Started
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="number" 
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
              
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Expected Win Rate (%)
                </label>
                <div className="relative">
                  <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="number" 
                    value={winRate}
                    onChange={(e) => setWinRate(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-4 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <button 
                onClick={handleSimulate}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98]"
              >
                <Play className="w-5 h-5 fill-current" />
                Run Simulation
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {simulationResult ? (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-8 shadow-xl border border-slate-800 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                
                <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-2 relative z-10">Estimated Final Balance</p>
                <h3 className="text-5xl md:text-6xl font-black mb-6 relative z-10 flex items-center gap-2">
                  ₹{simulationResult.finalBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </h3>
                
                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-700/50 relative z-10">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Expected Profit</p>
                    <p className={`text-xl font-bold ${simulationResult.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {simulationResult.totalProfit >= 0 ? '+' : ''}₹{simulationResult.totalProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Games Played</p>
                    <p className="text-xl font-bold text-white">{simulationResult.totalGames}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    Sequence Metrics
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                      <span className="text-sm font-medium text-slate-500">Expected Sequences</span>
                      <span className="font-bold text-slate-800">{Math.round(simulationResult.totalSequences)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                      <span className="text-sm font-medium text-slate-500">Avg Profit per Seq</span>
                      <span className="font-bold text-emerald-600">₹{simulationResult.expectedProfitPerSequence.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-500">Required Capital for Max Lvl</span>
                      <span className="font-bold text-rose-600">₹{simulationResult.maxLevelLossTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                    Risk Assessment
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                      <span className="text-sm font-medium text-slate-500">Ruin Probability (per seq)</span>
                      <span className="font-bold text-rose-500">{(simulationResult.probLosingMax * 100).toFixed(4)}%</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                      <span className="text-sm font-medium text-slate-500">Est. Max Level Hits</span>
                      <span className="font-bold text-slate-800">
                        {Math.round(simulationResult.totalSequences * simulationResult.probLosingMax)}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-slate-400 bg-slate-50 p-3 rounded-lg leading-relaxed">
                      If capital drops below Required Capital, you cannot afford the maximum level bet and simulation ends.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 bg-slate-50 rounded-3xl border border-slate-100 border-dashed min-h-[400px]">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-6">
                <Calculator className="w-8 h-8 text-indigo-300" />
              </div>
              <h3 className="text-xl font-black text-slate-700 mb-2">Ready to Simulate</h3>
              <p className="text-sm text-slate-500 text-center max-w-sm">
                Enter your current balance, starting bet, maximum level, and time duration, then run the simulation to estimate your hypothetical earnings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
