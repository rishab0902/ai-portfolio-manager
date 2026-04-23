import React, { useEffect, useState, useRef } from 'react';
import { generateZerodhaSession } from '../services/api';
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

export default function CallbackPage({ onSuccess, onError }) {
    const [status, setStatus] = useState('processing');
    const [errorMsg, setErrorMsg] = useState('');
    // Guard against React Strict Mode double-invocation
    const hasRun = useRef(false);

    useEffect(() => {
        if (hasRun.current) return; // already ran, skip second invocation
        hasRun.current = true;
        handleCallback();
    }, []);

    const handleCallback = async () => {
        const params = new URLSearchParams(window.location.search);
        const requestToken = params.get('request_token');
        const loginStatus = params.get('status');

        if (!requestToken) {
            setStatus('error');
            setErrorMsg('No request_token found in the redirect URL.');
            // Don't reload — just let user navigate back
            return;
        }

        if (loginStatus === 'cancelled') {
            setStatus('error');
            setErrorMsg('Login was cancelled.');
            return;
        }

        const apiKey = localStorage.getItem('zerodha_api_key');
        const apiSecret = localStorage.getItem('zerodha_api_secret');

        if (!apiKey || !apiSecret) {
            setStatus('error');
            setErrorMsg('API credentials not found. Please start the setup again.');
            return;
        }

        try {
            await generateZerodhaSession(apiKey, apiSecret, requestToken);
            setStatus('success');
            setTimeout(() => {
                window.history.replaceState({}, '', '/');
                onSuccess();
            }, 2000);
        } catch (err) {
            setStatus('error');
            const backendError = err.response?.data?.detail || err.message;
            setErrorMsg(`Token exchange failed: ${backendError}`);
            // Don't auto-navigate — let user click a button
        }
    };

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {status === 'processing' && (
                    <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-800 shadow-2xl p-10 text-center">
                        <div className="w-20 h-20 mx-auto mb-6 bg-indigo-500/20 rounded-full flex items-center justify-center border-2 border-indigo-500/50">
                            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Connecting to Zerodha...</h2>
                        <p className="text-slate-400 text-sm">Exchanging your authorization token securely</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl border border-emerald-900/40 shadow-2xl p-10 text-center">
                        <div className="w-20 h-20 mx-auto mb-6 bg-emerald-500/20 rounded-full flex items-center justify-center border-2 border-emerald-500/50 animate-pulse">
                            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Connected Successfully!</h2>
                        <p className="text-slate-400 mb-6">Your Zerodha account is linked. Loading your portfolio...</p>
                        <div className="w-8 h-8 mx-auto border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {status === 'error' && (
                    <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl border border-red-900/40 shadow-2xl p-10 text-center">
                        <div className="w-20 h-20 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center border-2 border-red-500/50">
                            <AlertTriangle className="w-10 h-10 text-red-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Connection Failed</h2>
                        <p className="text-red-300 text-sm mb-6">{errorMsg}</p>
                        <button
                            onClick={() => {
                                window.history.replaceState({}, '', '/');
                                onError();
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium px-6 py-2.5 rounded-xl border border-slate-700 text-sm transition-colors"
                        >
                            ← Back to Setup
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
