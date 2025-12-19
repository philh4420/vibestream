
import React, { useState } from 'react';
import { Input } from '../ui/Input';

interface LandingPageProps {
  onEnter: () => void;
}

type AuthMode = 'login' | 'register';
type Step = 'hero' | 'neural' | 'auth';

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const [step, setStep] = useState<Step>('hero');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const startNeuralScan = () => {
    setStep('neural');
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 12;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setTimeout(() => setStep('auth'), 600);
      }
      setProgress(p);
    }, 100);
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate professional secure auth delay
    setTimeout(() => {
      setIsLoading(false);
      onEnter();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#020617] text-white overflow-y-auto selection:bg-indigo-500 font-outfit">
      {/* 2026 Background Engine */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] bg-indigo-600/10 blur-[180px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-600/10 blur-[180px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center p-6 md:p-12 lg:p-24">
        {/* Navigation */}
        <nav className="w-full max-w-[120rem] flex justify-between items-center mb-12 lg:mb-24 animate-in fade-in slide-in-from-top-10 duration-1000">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-[1.2rem] lg:rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-indigo-500/30">
              <span className="text-2xl lg:text-3xl font-black italic tracking-tighter">V</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl lg:text-3xl font-black tracking-tighter leading-none">VIBESTREAM</span>
              <span className="text-[8px] lg:text-[10px] font-bold text-indigo-400 tracking-[0.3em] uppercase opacity-80">Social Protocol v2.6</span>
            </div>
          </div>
          <div className="hidden md:flex gap-12 text-[10px] font-bold tracking-[0.2em] uppercase text-slate-500">
            <a href="#" className="hover:text-white transition-colors">Vision</a>
            <a href="#" className="hover:text-white transition-colors">Infrastructure</a>
            <a href="#" className="hover:text-white transition-colors">Compliance</a>
          </div>
          <button 
            onClick={() => setStep('auth')} 
            className="px-6 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl text-[10px] font-black tracking-widest uppercase hover:bg-white/10 transition-all"
          >
            Access Portal
          </button>
        </nav>

        {/* Dynamic Main Content */}
        <main className="flex-1 w-full max-w-[120rem] flex flex-col items-center justify-center text-center">
          {step === 'hero' && (
            <div className="animate-in fade-in zoom-in-95 duration-1000 delay-200 flex flex-col items-center">
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-12">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                Deployment Region: UK-EN
              </div>
              <h1 className="text-5xl md:text-8xl lg:text-9xl 2xl:text-[10rem] font-black tracking-tight leading-[0.9] mb-12 max-w-7xl">
                REDEFINING <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-indigo-400 bg-[length:200%_auto] animate-text-gradient">CONNECTION.</span>
              </h1>
              <p className="text-slate-400 text-lg md:text-2xl 2xl:text-3xl max-w-3xl leading-relaxed mb-16 font-medium">
                Enter a professional-grade ecosystem designed for the next era of creators. High-fidelity, neural-secure, and globally compliant.
              </p>
              <button 
                onClick={startNeuralScan}
                className="group relative px-12 py-6 md:px-20 md:py-8 bg-white text-slate-950 rounded-[2rem] font-black text-xl md:text-2xl hover:bg-indigo-50 transition-all active:scale-95 shadow-2xl shadow-white/5 overflow-hidden"
              >
                <div className="absolute inset-0 bg-indigo-600/10 translate-y-full group-hover:translate-y-0 transition-transform" />
                <span className="relative">INITIALIZE SESSION</span>
              </button>
            </div>
          )}

          {step === 'neural' && (
            <div className="w-full max-w-2xl animate-in fade-in duration-700">
              <div className="mb-12">
                <h2 className="text-4xl lg:text-5xl font-black mb-4 tracking-tighter">NEURAL HANDSHAKE</h2>
                <p className="text-slate-500 text-lg">Validating session integrity for your region...</p>
              </div>
              <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[3rem] p-12 lg:p-16">
                 <div className="flex justify-between items-end mb-8">
                    <span className="text-[10px] font-bold text-indigo-400 tracking-[0.3em] uppercase">Security Protocol active</span>
                    <span className="text-5xl font-black font-mono">{Math.floor(progress)}%</span>
                 </div>
                 <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden mb-12">
                   <div 
                     className="h-full bg-indigo-500 transition-all duration-300" 
                     style={{ width: `${progress}%` }}
                   />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-6 text-left">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mb-3" />
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Biometric Match</p>
                      <p className="text-xs font-mono text-slate-400 mt-1">SUCCESS_99.2%</p>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-6 text-left">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse mb-3" />
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Node Sync</p>
                      <p className="text-xs font-mono text-slate-400 mt-1">REGIONAL_UK_GB</p>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {step === 'auth' && (
            <div className="w-full max-w-xl animate-in zoom-in-95 duration-500">
              <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[3.5rem] p-10 lg:p-14 shadow-2xl relative">
                <div className="flex gap-8 mb-12 justify-center">
                  <button 
                    onClick={() => setAuthMode('login')}
                    className={`text-2xl font-black tracking-tight transition-all ${authMode === 'login' ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`}
                  >
                    LOGIN
                  </button>
                  <button 
                    onClick={() => setAuthMode('register')}
                    className={`text-2xl font-black tracking-tight transition-all ${authMode === 'register' ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`}
                  >
                    SIGN UP
                  </button>
                </div>

                <form onSubmit={handleAuth} className="space-y-6">
                  {authMode === 'register' && (
                    <Input label="Display Name" placeholder="e.g. Oliver Bennett" required />
                  )}
                  <Input label="Neural ID / Email" type="email" placeholder="name@vibestream.com" required />
                  <Input label="Access Key" type="password" placeholder="••••••••" required />

                  <button 
                    disabled={isLoading}
                    className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black text-lg hover:bg-indigo-50 transition-all active:scale-95 shadow-xl flex items-center justify-center gap-3 disabled:opacity-70 mt-4"
                  >
                    {isLoading ? (
                      <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      authMode === 'login' ? 'ESTABLISH LINK' : 'CREATE PROTOCOL'
                    )}
                  </button>
                </form>

                <p className="mt-8 text-slate-500 text-xs font-medium leading-relaxed">
                  By accessing VibeStream, you agree to our 2026 Neural Security Standards and Regional Privacy Protocols.
                </p>
              </div>
            </div>
          )}
        </main>

        {/* Footer Metrics */}
        <footer className="w-full max-w-[120rem] mt-24 border-t border-white/5 pt-12 flex flex-col md:flex-row justify-between items-center gap-8 text-slate-600 font-bold text-[10px] uppercase tracking-[0.3em] pb-12">
          <div className="flex gap-12">
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> SYSTEMS_OPTIMAL</span>
            <span>LATENCY: 12ms</span>
          </div>
          <p>© 2026 VibeStream Social Infrastructure Group. London, UK.</p>
        </footer>
      </div>

      <style>{`
        @keyframes text-gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-text-gradient {
          animation: text-gradient 3s linear infinite;
        }
      `}</style>
    </div>
  );
};
