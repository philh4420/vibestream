
import React, { useState } from 'react';
import { ICONS } from '../constants';

interface LandingPageProps {
  onEnter: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const handleVerify = () => {
    setIsVerifying(true);
    // Simulate futuristic Neural/Bot check
    setTimeout(() => {
      setIsVerifying(false);
      setIsVerified(true);
      setTimeout(onEnter, 800);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 overflow-y-auto overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full" />
      </div>

      <div className="relative min-h-screen flex flex-col">
        {/* Navigation */}
        <nav className="flex items-center justify-between px-6 py-8 md:px-12 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/40">
              <span className="text-white font-bold text-2xl italic">V</span>
            </div>
            <span className="text-2xl font-bold tracking-tighter text-white font-outfit">VibeStream</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-slate-400 font-medium">
            <a href="#" className="hover:text-white transition-colors">Vision</a>
            <a href="#" className="hover:text-white transition-colors">Security</a>
            <a href="#" className="hover:text-white transition-colors">Creators</a>
          </div>
          <button onClick={handleVerify} className="px-6 py-2.5 bg-white/5 backdrop-blur-md border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all active:scale-95">
            Early Access
          </button>
        </nav>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-5xl mx-auto w-full py-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-8 animate-bounce">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Next-Gen Social Standard 2026
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white font-outfit leading-[1.1] tracking-tight mb-8">
            Experience the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">Future</span> of Connection.
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed">
            A secure, professional-grade ecosystem designed for the next era of creators. High-fidelity media, neural-secure authentication, and a community built on trust.
          </p>

          {/* Auth / Entry Card */}
          <div className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-500" />
            
            <h2 className="text-2xl font-bold text-white mb-2">Initialize VibeStream</h2>
            <p className="text-slate-500 text-sm mb-8">Neural check required to prevent bot interference.</p>

            <button 
              onClick={handleVerify}
              disabled={isVerifying || isVerified}
              className={`w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-xl ${
                isVerified 
                ? 'bg-emerald-500 text-white' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
              } active:scale-95 disabled:opacity-80`}
            >
              {isVerifying ? (
                <>
                  <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : isVerified ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Human Verified</span>
                </>
              ) : (
                'Secure Access'
              )}
            </button>

            <div className="mt-6 flex items-center justify-center gap-4 text-slate-600 text-[10px] font-bold uppercase tracking-widest">
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"></path></svg>
                SSL 8192-BIT
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path></svg>
                Neural Scan
              </span>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-8 text-center text-slate-600 text-xs font-medium max-w-7xl mx-auto w-full">
          <div className="flex flex-wrap justify-center gap-6 mb-4">
            <a href="#" className="hover:text-slate-400 transition-colors">Privacy Protocol</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Term of Presence</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Neural Safeguards</a>
          </div>
          <p>© 2026 VibeStream Global. Encrypted in the United Kingdom.</p>
        </footer>
      </div>
    </div>
  );
};
