import React from 'react';
import { AlertCircle, TrendingUp, TrendingDown, MinusCircle, ShieldAlert, Target, Sparkles, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

export default function AiAnalysis({ data }) {
    if (!data) return null;

    const renderActionCards = (title, items, icon, colorClass, borderClass, bgClass) => (
        <div className={`p-5 rounded-2xl border ${borderClass} ${bgClass}`}>
            <h3 className={`text-lg font-semibold flex items-center gap-2 mb-4 ${colorClass}`}>
                {icon}
                {title} Action ({items.length})
            </h3>
            <div className="space-y-3">
                {items.length === 0 ? (
                    <p className="text-sm opacity-60">No recommendations.</p>
                ) : items.map((item, i) => (
                    <div key={i} className="bg-slate-900 overflow-hidden rounded-xl border border-slate-800 flex flex-col sm:flex-row shadow-sm">
                        <div className={`px-4 py-3 sm:w-1/3 border-b sm:border-b-0 sm:border-r border-slate-800 font-bold bg-slate-950/40 flex items-center ${colorClass}`}>
                            {item.stock}
                        </div>
                        <div className="px-4 py-3 sm:w-2/3 text-sm text-slate-300 leading-relaxed">
                            {item.reason}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Header / Summary section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 to-slate-900 p-8 rounded-3xl border border-indigo-900/50 shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
                    <Sparkles className="w-48 h-48 text-indigo-400 rotate-12" />
                </div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-500/20 rounded-xl">
                            <BotIcon className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-indigo-400">
                            AI Intelligence Report
                        </h2>
                    </div>

                    <p className="text-lg text-indigo-100/90 leading-relaxed max-w-4xl backdrop-blur-sm p-4 bg-slate-950/30 rounded-2xl border border-white/5">
                        {data.summary}
                    </p>

                    <div className="flex flex-wrap items-center gap-6 mt-6">
                        <div className="flex items-center gap-3 bg-slate-950/50 px-5 py-3 rounded-full border border-indigo-500/20 shadow-inner">
                            <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">Confidence</span>
                            <span className={clsx(
                                "px-3 py-1 text-sm font-bold rounded-full border",
                                data.confidence?.toLowerCase() === 'high' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                data.confidence?.toLowerCase() === 'medium' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                                'bg-rose-500/20 text-rose-400 border-rose-500/30'
                            )}>
                                {data.confidence?.toUpperCase() || 'UNKNOWN'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recommendations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {renderActionCards("BUY", data.buy, <TrendingUp className="w-5 h-5" />, "text-emerald-400", "border-emerald-900/50", "bg-emerald-950/10")}
                {renderActionCards("HOLD", data.hold, <MinusCircle className="w-5 h-5" />, "text-amber-400", "border-amber-900/50", "bg-amber-950/10")}
                {renderActionCards("SELL", data.sell, <TrendingDown className="w-5 h-5" />, "text-rose-400", "border-rose-900/50", "bg-rose-950/10")}
            </div>

            {/* Secondary Intel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden group hover:border-rose-500/30 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                       <ShieldAlert className="w-24 h-24 text-rose-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-rose-400" /> Key Risk Factors
                    </h3>
                    <ul className="space-y-3 relative z-10">
                        {data.risks.map((risk, i) => (
                            <li key={i} className="flex gap-3 text-sm text-slate-300 items-start">
                                <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                                {risk}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                       <Target className="w-24 h-24 text-cyan-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5 text-cyan-400" /> Rebalancing Strategy
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed relative z-10">
                        {data.rebalancing}
                    </p>
                </div>
            </div>
        </div>
    );
}

function BotIcon(props) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8V4H8" />
            <rect width="16" height="12" x="4" y="8" rx="2" />
            <path d="M2 14h2" />
            <path d="M20 14h2" />
            <path d="M15 13v2" />
            <path d="M9 13v2" />
        </svg>
    )
}
