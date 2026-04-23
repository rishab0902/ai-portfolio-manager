import React, { useState, useEffect } from 'react';
import { fetchPortfolio, uploadGrowwCSV, analyzePortfolio } from '../services/api';
import { UploadCloud, RefreshCw, Bot, AlertTriangle, TrendingUp, TrendingDown, Settings2, SlidersHorizontal } from 'lucide-react';
import clsx from 'clsx';
import AiAnalysis from './AiAnalysis';

export default function Dashboard() {
    const [portfolio, setPortfolio] = useState(null);
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState('');

    const [intent, setIntent] = useState({
        goal: 'Wealth Creation',
        riskAppetite: 'Medium',
        timeHorizon: 'Medium (1-3 years)',
        strategy: ['Hold for long-term recovery'],
        emotion: 'Balanced'
    });

    useEffect(() => {
        loadPortfolio();
    }, []);

    const loadPortfolio = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await fetchPortfolio();
            setPortfolio(data);
        } catch (err) {
            setError('Failed to fetch portfolio data.');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        setLoading(true);
        setAiAnalysis(null); // Reset analysis
        try {
            const data = await uploadGrowwCSV(file);
            setPortfolio(data);
        } catch (err) {
            setError('Failed to upload/parse Groww Statement (CSV/Excel).');
        } finally {
            setLoading(false);
        }
    };

    const runAnalysis = async () => {
        if (!portfolio) return;
        setAnalyzing(true);
        setError('');
        try {
            const data = await analyzePortfolio(portfolio, intent);
            setAiAnalysis(data);
            
            setTimeout(() => {
                document.getElementById('ai-analysis-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 300);
        } catch (err) {
            setError('Failed to run AI analysis: ' + (err.response?.data?.detail || err.message));
        } finally {
            setAnalyzing(false);
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

    const toggleStrategy = (strat) => {
        setIntent(prev => {
            const current = [...prev.strategy];
            if (current.includes(strat)) {
                return { ...prev, strategy: current.filter(s => s !== strat) };
            } else {
                return { ...prev, strategy: [...current, strat] };
            }
        });
    };

    return (
        <div className="space-y-8">
            {error && (
                <div className="p-4 bg-red-900/50 border border-red-500 rounded-lg flex items-center gap-3 text-red-200 shadow-lg animate-in fade-in slide-in-from-top-2">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <p>{error}</p>
                </div>
            )}
            
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
                <div>
                    <h1 className="text-2xl font-semibold mb-1">Portfolio Summary</h1>
                    <p className="text-slate-400 text-sm">Real-time valuation based on market prices</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 border border-slate-700">
                        <UploadCloud className="w-4 h-4" />
                        Upload Statement
                        <input type="file" accept=".csv,.xlsx" className="hidden" onChange={handleFileUpload} />
                    </label>
                    <button 
                        onClick={loadPortfolio}
                        disabled={loading}
                        className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 border border-slate-700"
                    >
                        <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
                        Refresh
                    </button>
                    <button 
                        onClick={() => document.getElementById('advisor-config')?.scrollIntoView({ behavior: 'smooth' })}
                        disabled={loading || !portfolio}
                        className="bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 border border-indigo-500/30 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <Bot className="w-4 h-4" />
                        Configure AI
                    </button>
                </div>
            </div>

            {loading ? (
                 <div className="flex justify-center items-center h-64">
                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                 </div>
            ) : portfolio ? (
                <>
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col justify-center">
                            <span className="text-slate-400 text-sm mb-1">Total Valid Valuation</span>
                            <span className="text-3xl font-bold text-white tracking-tight">{formatCurrency(portfolio.totalValue)}</span>
                        </div>
                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col justify-center">
                            <span className="text-slate-400 text-sm mb-1">Total Investment</span>
                            <span className="text-3xl font-bold text-slate-200 tracking-tight">{formatCurrency(portfolio.totalInvestment)}</span>
                        </div>
                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col justify-center">
                            <span className="text-slate-400 text-sm mb-1 flex items-center gap-2">Overall P&L</span>
                            <div className="flex items-center gap-2">
                                <span className={clsx("text-3xl font-bold tracking-tight", portfolio.totalProfitLoss >= 0 ? "text-emerald-400" : "text-rose-400")}>
                                    {portfolio.totalProfitLoss >= 0 ? "+" : ""}{formatCurrency(portfolio.totalProfitLoss)}
                                </span>
                                {portfolio.totalProfitLoss >= 0 ? <TrendingUp className="w-6 h-6 text-emerald-400" /> : <TrendingDown className="w-6 h-6 text-rose-400" />}
                            </div>
                        </div>
                    </div>

                    {/* AI Advisor Configuration */}
                    <div id="advisor-config" className="bg-slate-900/80 backdrop-blur-md rounded-3xl border border-indigo-900/40 shadow-2xl p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Settings2 className="w-48 h-48 text-indigo-400 rotate-12" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                                    <SlidersHorizontal className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Advisor Configuration</h2>
                                    <p className="text-slate-400 text-sm mt-1">Set your specific context so the AI can provide personalized advice.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Core Setup */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Investment Goal</label>
                                        <select 
                                            value={intent.goal} 
                                            onChange={e => setIntent({...intent, goal: e.target.value})}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none appearance-none"
                                        >
                                            <option>Wealth Creation</option>
                                            <option>Capital Preservation</option>
                                            <option>Short-term Profit</option>
                                            <option>Long-term Growth</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Risk Appetite</label>
                                        <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                                            {['Low', 'Medium', 'High'].map(risk => (
                                                <button
                                                    key={risk}
                                                    onClick={() => setIntent({...intent, riskAppetite: risk})}
                                                    className={clsx(
                                                        "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                                                        intent.riskAppetite === risk 
                                                            ? (risk === 'High' ? "bg-rose-500/20 text-rose-400" : risk === 'Medium' ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400") 
                                                            : "text-slate-500 hover:text-slate-300"
                                                    )}
                                                >
                                                    {risk}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Time Horizon</label>
                                        <select 
                                            value={intent.timeHorizon} 
                                            onChange={e => setIntent({...intent, timeHorizon: e.target.value})}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none appearance-none"
                                        >
                                            <option>Short-term (&lt; 1 year)</option>
                                            <option>Medium (1-3 years)</option>
                                            <option>Long-term (3+ years)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Strategy Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-3">Strategy Preferences (Multi-select)</label>
                                    <div className="space-y-3">
                                        {[
                                            'Add new stocks', 
                                            'Rebalance portfolio', 
                                            'Exit weak positions', 
                                            'Hold for long-term recovery'
                                        ].map(strat => (
                                            <label key={strat} className={clsx(
                                                "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors",
                                                intent.strategy.includes(strat) ? "bg-indigo-500/10 border-indigo-500/50" : "bg-slate-950 border-slate-800 hover:border-slate-700/80"
                                            )}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={intent.strategy.includes(strat)} 
                                                    onChange={() => toggleStrategy(strat)}
                                                    className="w-4 h-4 rounded text-indigo-500 bg-slate-900 border-slate-700 focus:ring-indigo-500 focus:ring-offset-slate-900"
                                                />
                                                <span className={clsx(
                                                    "text-sm font-medium",
                                                    intent.strategy.includes(strat) ? "text-indigo-200" : "text-slate-400"
                                                )}>{strat}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Emotion & Action */}
                                <div className="flex flex-col h-full justify-between space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-3">Emotional Bias</label>
                                        <div className="grid grid-cols-1 gap-3">
                                            {[
                                                { id: 'Aggressive', desc: 'Seeking high returns context' },
                                                { id: 'Balanced', desc: 'Neutral, data-driven approach' },
                                                { id: 'Fearful', desc: 'Seeking extreme safety' }
                                            ].map(emo => (
                                                <button
                                                    key={emo.id}
                                                    onClick={() => setIntent({...intent, emotion: emo.id})}
                                                    className={clsx(
                                                        "text-left p-3 rounded-xl border transition-colors",
                                                        intent.emotion === emo.id ? "bg-slate-800 border-slate-600 text-white" : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700"
                                                    )}
                                                >
                                                    <div className="font-medium text-sm mb-0.5">{emo.id}</div>
                                                    <div className={clsx("text-xs", intent.emotion === emo.id ? "text-slate-300" : "text-slate-600")}>{emo.desc}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={runAnalysis}
                                        disabled={analyzing || intent.strategy.length === 0}
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] transition-all flex items-center justify-center gap-3 text-lg"
                                    >
                                        {analyzing ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Bot className="w-6 h-6" />}
                                        {analyzing ? "Generating Strategy..." : "Run Context-Aware Analysis"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AI Analysis Section */}
                    {aiAnalysis && (
                        <div id="ai-analysis-section">
                            <AiAnalysis data={aiAnalysis} />
                        </div>
                    )}

                    {/* Holdings Table */}
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden mt-12">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                            <h2 className="text-xl font-semibold">Active Holdings</h2>
                            <span className="text-sm border border-slate-700 bg-slate-800 px-3 py-1 rounded-full text-slate-300 shadow-inner">
                                {portfolio.holdings.length} Assets
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="text-xs uppercase bg-slate-950/50 text-slate-400">
                                    <tr>
                                        <th className="px-6 py-4">Symbol</th>
                                        <th className="px-6 py-4">Quantity</th>
                                        <th className="px-6 py-4">Buy Price</th>
                                        <th className="px-6 py-4">Current Price</th>
                                        <th className="px-6 py-4">P&L</th>
                                        <th className="px-6 py-4">Sector</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {portfolio.holdings.map((h, i) => (
                                        <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-200">
                                                {h.symbol}
                                                <div className="text-xs text-slate-500 font-normal truncate mt-0.5 max-w-[120px]">{h.stockName}</div>
                                            </td>
                                            <td className="px-6 py-4 font-mono">{h.quantity}</td>
                                            <td className="px-6 py-4 font-mono">{formatCurrency(h.avgPrice)}</td>
                                            <td className="px-6 py-4 font-mono">{formatCurrency(h.currentPrice)}</td>
                                            <td className={clsx("px-6 py-4 font-medium font-mono border-l-2", h.profitLoss >= 0 ? "text-emerald-400 border-l-emerald-500/20" : "text-rose-400 border-l-rose-500/20")}>
                                                {h.profitLoss >= 0 ? "+" : ""}{formatCurrency(h.profitLoss)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="bg-slate-800 text-slate-400 text-xs px-2.5 py-1 rounded-full border border-slate-700/50 truncate">
                                                    {h.sector}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : null}
        </div>
    );
}
