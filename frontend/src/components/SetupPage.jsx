import React, { useState, useEffect } from 'react';
import { getZerodhaLoginUrl, getEnvKeys, generateZerodhaSession } from '../services/api';
import { KeyRound, ExternalLink, ArrowRight, AlertTriangle, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function SetupPage({ onSetupComplete }) {
    const [step, setStep] = useState(1);
    const [apiKey, setApiKey] = useState('');
    const [apiSecret, setApiSecret] = useState('');
    const [requestToken, setRequestToken] = useState('');
    const [loginUrl, setLoginUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Auto-fill from .env if available
        getEnvKeys().then(data => {
            if (data.api_key) setApiKey(data.api_key);
            if (data.api_secret) setApiSecret(data.api_secret);
        }).catch(err => console.error("Could not fetch env keys", err));
    }, []);

    const handleConnectZerodha = async () => {
        if (!apiKey.trim() || !apiSecret.trim()) {
            setError('Please enter both API Key and API Secret.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            // Save credentials to localStorage
            localStorage.setItem('zerodha_api_key', apiKey.trim());
            localStorage.setItem('zerodha_api_secret', apiSecret.trim());

            const data = await getZerodhaLoginUrl(apiKey.trim(), apiSecret.trim());
            setLoginUrl(data.login_url);
            setStep(2);
        } catch (err) {
            setError('Failed to generate login URL. Please verify your API Key.');
        } finally {
            setLoading(false);
        }
    };

    const handleStep2 = async () => {
        let token = requestToken.trim();
        
        // Smart extraction: if user pastes full URL, extract request_token automatically
        if (token.includes('request_token=')) {
            const url = new URL(token.startsWith('http') ? token : `https://dummy.com?${token}`);
            token = url.searchParams.get('request_token') || token;
        }

        if (!token || token.length < 10) {
            setError('Please paste a valid request token or the full redirect URL.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await generateZerodhaSession(apiKey.trim(), apiSecret.trim(), token);
            setStep(3);
            // Auto-proceed to dashboard after 2 seconds
            setTimeout(() => {
                onSetupComplete('zerodha');
            }, 2000);
        } catch (err) {
            const backendError = err.response?.data?.detail || err.message;
            setError(`Token exchange failed. Server responded with: ${backendError}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSkipToGroww = () => {
        onSetupComplete('groww');
    };

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4">
            <div className="w-full max-w-xl">
                {/* Error Display */}
                {error && (
                    <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-300 text-sm">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                {/* Main Card */}
                <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-800 shadow-2xl p-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                            <KeyRound className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Connect Your Zerodha Account</h2>
                            <p className="text-slate-400 text-sm mt-0.5">Enter your Kite Connect API credentials</p>
                        </div>
                    </div>

                    {step === 1 && (
                        <>
                            <div className="mb-6 mt-4 p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                                <p className="text-xs text-slate-500 flex items-center gap-2">
                                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                                    The system will auto-fill your keys from .env if configured.
                                </p>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Zerodha API Key</label>
                                    <input
                                        type="text"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder="e.g. gyt5z7p6qvelr6ah"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-mono text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Zerodha API Secret</label>
                                    <input
                                        type="password"
                                        value={apiSecret}
                                        onChange={(e) => setApiSecret(e.target.value)}
                                        placeholder="Enter your API secret"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-mono text-sm"
                                    />
                                </div>

                                <button
                                    onClick={handleConnectZerodha}
                                    disabled={loading}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                                    {loading ? 'Generating Link...' : 'Next Step'}
                                </button>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <div className="space-y-5 mt-6">
                            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                                <p className="text-sm text-slate-300 mb-3">
                                    <strong className="text-amber-400">Step A:</strong> Click to log into Zerodha. You will be redirected to a blank/error page (127.0.0.1).
                                </p>
                                <a
                                    href={loginUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 border border-amber-500/30 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Open Zerodha Login
                                </a>
                            </div>

                            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                                <p className="text-sm text-slate-300 mb-3">
                                    <strong className="text-emerald-400">Step B:</strong> Copy the full URL from the browser address bar and paste it below.
                                </p>
                                <input
                                    type="text"
                                    value={requestToken}
                                    onChange={(e) => setRequestToken(e.target.value)}
                                    placeholder="Paste full redirect URL here"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-mono text-sm"
                                />
                            </div>

                            <button
                                onClick={handleStep2}
                                disabled={loading}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                                Verify & Connect
                            </button>
                            <button
                                onClick={() => { setStep(1); setError(''); }}
                                className="w-full text-slate-500 hover:text-slate-300 text-sm py-2 transition-colors"
                            >
                                ← Back to API Keys
                            </button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="mt-8 text-center">
                            <div className="w-20 h-20 mx-auto mb-6 bg-emerald-500/20 rounded-full flex items-center justify-center border-2 border-emerald-500/50 animate-pulse">
                                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Connected Successfully!</h2>
                            <p className="text-slate-400 mb-6">Your Zerodha account is linked. Loading your portfolio...</p>
                            <div className="w-8 h-8 mx-auto border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    {step !== 3 && (
                        <div className="mt-8 pt-6 border-t border-slate-800">
                            <p className="text-slate-500 text-sm text-center mb-3">Don't have Zerodha API access?</p>
                            <button
                                onClick={handleSkipToGroww}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3 rounded-xl transition-colors border border-slate-700 text-sm"
                            >
                                Skip — Use Groww CSV/Excel Upload Instead
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
