import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import SetupPage from './components/SetupPage';
import CallbackPage from './components/CallbackPage';

function App() {
  // Persist session across page refreshes
  const [isSetupDone, setIsSetupDone] = useState(
    () => localStorage.getItem('setup_done') === 'true'
  );
  const [connectionMode, setConnectionMode] = useState(
    () => localStorage.getItem('connection_mode') || null
  );

  // Detect if we're on the /callback route (Zerodha redirect)
  const isCallback = window.location.pathname === '/callback';

  const handleSetupComplete = (mode) => {
    localStorage.setItem('setup_done', 'true');
    localStorage.setItem('connection_mode', mode);
    setConnectionMode(mode);
    setIsSetupDone(true);
  };

  const handleCallbackSuccess = () => {
    localStorage.setItem('setup_done', 'true');
    localStorage.setItem('connection_mode', 'zerodha');
    setConnectionMode('zerodha');
    setIsSetupDone(true);
  };

  const handleCallbackError = () => {
    // Go back to / without reloading — avoids wiping React state
    window.history.replaceState({}, '', '/');
    setIsSetupDone(false);
    setConnectionMode(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('zerodha_api_key');
    localStorage.removeItem('zerodha_api_secret');
    localStorage.removeItem('setup_done');
    localStorage.removeItem('connection_mode');
    setIsSetupDone(false);
    setConnectionMode(null);
  };

  // Determine which page to render
  const renderPage = () => {
    if (isCallback) {
      return (
        <CallbackPage
          onSuccess={handleCallbackSuccess}
          onError={handleCallbackError}
        />
      );
    }
    if (isSetupDone) {
      return <Dashboard connectionMode={connectionMode} />;
    }
    return <SetupPage onSetupComplete={handleSetupComplete} />;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <nav className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
              AI Portfolio Manager
            </span>
        </div>
        <div className="flex items-center gap-4">
            {isSetupDone && (
              <button
                onClick={handleLogout}
                className="text-sm text-slate-500 hover:text-slate-300 transition-colors border border-slate-700 px-3 py-1.5 rounded-lg"
              >
                Disconnect
              </button>
            )}
            <div className="text-sm text-slate-400">
                Intelligent Wealth Insights
            </div>
        </div>
      </nav>
      
      <main className="container mx-auto px-4 py-8">
        {renderPage()}
      </main>

      <footer className="mt-12 py-6 text-center text-slate-500 text-sm border-t border-slate-800">
        <p className="mb-2">⚠️ This is NOT an auto-trading bot. <strong>This is not financial advice.</strong></p>
        <p>AI Portfolio Manager © 2024</p>
      </footer>
    </div>
  );
}

export default App;
