import React from 'react';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <nav className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
              AI Portfolio Manager
            </span>
        </div>
        <div className="text-sm text-slate-400">
            Intelligent Wealth Insights
        </div>
      </nav>
      
      <main className="container mx-auto px-4 py-8">
        <Dashboard />
      </main>

      <footer className="mt-12 py-6 text-center text-slate-500 text-sm border-t border-slate-800">
        <p className="mb-2">⚠️ This is NOT an auto-trading bot. <strong>This is not financial advice.</strong></p>
        <p>AI Portfolio Manager © 2024</p>
      </footer>
    </div>
  );
}

export default App;
