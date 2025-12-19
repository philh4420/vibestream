
import React, { useState, useEffect } from 'react';
import { Input } from '../ui/Input';

interface LandingPageProps {
  onEnter: () => void;
}

type Step = 'discovery' | 'neural_check' | 'entry';
type AuthMode = 'login' | 'register';

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const [step, setStep] = useState<Step>('discovery');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const startSecureScan = () => {
    setStep('neural_check');
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 8;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setTimeout(() => setStep('entry'), 800);
      }
      setScanProgress(p);
    }, 80);
  };

  const handleEntry = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    // 2026 Standard authentication handshake delay
    setTimeout(() => {
      setIsProcessing(false);
      onEnter();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#020617] text-white flex flex-col font-outfit overflow-x-hidden selection:bg-indigo-500 overflow-y-auto">
      {/* 8K Immersive Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[80vw] h-[80vw] bg-indigo-600/10 blur-[200px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[80vw] h-[80vw] bg-blue-600/10 blur-[200px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay" />
      </div>

      <div className="relative z-10 w-full max-w-[140rem] mx-auto min-h-screen flex flex-col p-6 md:p-12 lg:p-20">
        {/* UK Localised Header */}
        <nav className="w-full flex justify-between items-center mb-16 lg:mb-32 animate-in fade-in slide-in-from-top-12 duration-1000">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 lg:w-20 lg:h-20 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-[1.5rem] lg:rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-500/40 ring-1 ring-white/20">
              <span className="text-3xl lg:text-5xl font-black italic tracking-tighter">V</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl lg:text-4xl font-black tracking-tighter leading-none">VIBESTREAM</span>
              <span className="text-[9px] lg:text-[11px] font-bold text-indigo-400 tracking-[0.4em] uppercase opacity-90">UK Infrastructure Node 01</span>
            </div>
          </div>
          <div className="hidden lg:flex gap-16 text-[11px] font-bold tracking-[0.3em] uppercase text-slate-500">
            <a href="#" className="hover:text-white transition-all hover:tracking-[0.4em]">Infrastructure</a>
            <a href="#" className="hover:text-white transition-all hover:tracking-[0.4em]">Creator Economy</a>
            <a href="#" className="hover:text-white transition-all hover:tracking-[0.4em]">Safety Protocol</a>
          </div>
          <button 
            onClick={() => setStep('entry')} 
            className="px-8 py-3.5 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-2xl text-[10px] font-black tracking-widest uppercase hover:bg-white/10 transition-all active:scale-95"
          >
            Portal Access
          </button>
        </nav>

        {/* Dynamic State Layouts */}
        <main className="flex-1 flex flex-col items-center justify-center">
          {step === 'discovery' && (
            <div className="text-center animate-in fade-in zoom-in-95 duration-1000 flex flex-col items-center">
              <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] lg:text-[12px] font-black uppercase tracking-[0.4em] mb-12 shadow-xl shadow-indigo-500/5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                </span>
                Deployment: London / GB-ENG
              </div>
              <h1 className="text-6xl md:text-9xl 2xl:text-[12rem] font-black tracking-tighter leading-[0.85] mb-16 max-w-[15ch]">
                BEYOND <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-300 to-indigo-400 bg-[length:200%_auto] animate-text-gradient">SOCIAL.</span>
              </h1>
              <p className="text-slate-400 text-xl md:text-3xl lg:text-4xl max-w-4xl leading-snug mb-20 font-medium opacity-80">
                Experience the 2026 standard in social connectivity. Secure, professional, and built for 8K high-fidelity creators.
              </p>
              <button 
                onClick={startSecureScan}
                className="group relative px-16 py-8 md:px-24 md:py-10 bg-white text-slate-950 rounded-[2.5rem] font-black text-2xl md:text-3xl hover:bg-indigo-50 transition-all active:scale-90 shadow-2xl shadow-white/10 overflow-hidden"
              >
                <div className="absolute inset-0 bg-indigo-600/5 translate-y-full group-hover:translate-y-0 transition-transform" />
                <span className="relative">ESTABLISH NEURAL LINK</span>
              </button>
            </div>
          )}

          {step === 'neural_check' && (
            <div className="w-full max-w-4xl animate-in fade-in duration-1000 text-center">
              <h2 className="text-4xl lg:text-6xl font-black mb-6 tracking-tighter">BOT-SHIELD ACTIVE</h2>
              <p className="text-slate-500 text-xl mb-16">Verifying your human-node status via UK Secure Protocol...</p>
              <div className="bg-white/[0.02] backdrop-blur-[60px] border border-white/5 rounded-[4rem] p-16 lg:p-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-50" />
                <div className="relative z-10">
                  <div className="flex justify-between items-end mb-10">
                    <span className="text-[12px] font-bold text-indigo-400 tracking-[0.5em] uppercase font-mono">Neural Scanning...</span>
                    <span className="text-7xl font-mono font-black">{Math.floor(scanProgress)}%</span>
                  </div>
                  <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden mb-16 shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-blue-400 transition-all duration-300" 
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                    <div className="bg-white/5 border border-white/5 rounded-3xl p-8">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse mb-4" />
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Biometric Proof</p>
                      <p className="text-sm font-mono text-slate-400 mt-2 font-bold">MATCHED_99%</p>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-3xl p-8">
                      <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse mb-4" />
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Geo Integrity</p>
                      <p className="text-sm font-mono text-slate-400 mt-2 font-bold">REG_UK_EN</p>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-3xl p-8">
                      <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse mb-4" />
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Device Cert</p>
                      <p className="text-sm font-mono text-slate-400 mt-2 font-bold">VERIFIED_8K</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'entry' && (
            <div className="w-full max-w-3xl animate-in zoom-in-95 duration-700">
              <div className="bg-white/[0.03] backdrop-blur-[100px] border border-white/10 rounded-[4rem] p-12 lg:p-20 shadow-2xl relative">
                <div className="flex gap-12 mb-16 justify-center">
                  <button 
                    onClick={() => setAuthMode('login')}
                    className={`text-3xl font-black tracking-tight transition-all relative ${authMode === 'login' ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`}
                  >
                    LOGIN
                    {authMode === 'login' && <div className="absolute -bottom-4 left-0 right-0 h-1.5 bg-indigo-500 rounded-full" />}
                  </button>
                  <button 
                    onClick={() => setAuthMode('register')}
                    className={`text-3xl font-black tracking-tight transition-all relative ${authMode === 'register' ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`}
                  >
                    SIGN UP
                    {authMode === 'register' && <div className="absolute -bottom-4 left-0 right-0 h-1.5 bg-indigo-500 rounded-full" />}
                  </button>
                </div>

                <form onSubmit={handleEntry} className="space-y-8">
                  {authMode === 'register' && (
                    <div className="animate-in slide-in-from-top-4 duration-500">
                      <Input label="Full Name" placeholder="e.g. Alexander Sterling" required />
                    </div>
                  )}
                  <Input label="Neural Identity" type="email" placeholder="identity@vibestream.co.uk" required />
                  <Input label="Passkey" type="password" placeholder="••••••••" required />

                  <button 
                    disabled={isProcessing}
                    className="w-full py-7 bg-white text-slate-950 rounded-3xl font-black text-xl hover:bg-indigo-50 transition-all active:scale-95 shadow-2xl flex items-center justify-center gap-4 disabled:opacity-70 mt-10"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-3">
                        <svg className="animate-spin h-7 w-7" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>AUTHORISING...</span>
                      </div>
                    ) : (
                      authMode === 'login' ? 'ESTABLISH LINK' : 'CREATE PROTOCOL'
                    )}
                  </button>
                </form>

                <div className="mt-12 pt-8 border-t border-white/5 text-center">
                   <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-lg mx-auto">
                    Deployment Region: <b>United Kingdom</b>. <br />
                    Compliant with 2026 Social Governance and Neural Safety protocols.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Global Footer Metrics */}
        <footer className="w-full mt-24 border-t border-white/5 pt-16 flex flex-col md:flex-row justify-between items-center gap-10 text-slate-600 font-bold text-[11px] uppercase tracking-[0.4em] pb-12">
          <div className="flex gap-16">
             <span className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20" /> GLOBAL_SYNC: OK</span>
             <span>UK_NODE_LATENCY: 8ms</span>
             <span className="hidden sm:inline">PROTOCOL: v2.6.4</span>
          </div>
          <p>© 2026 VibeStream Infrastructure Group. London HQ.</p>
        </footer>
      </div>

      <style>{`
        @keyframes text-gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-text-gradient {
          animation: text-gradient 4s linear infinite;
        }
        /* Fluid Typography scaling for 8K */
        html {
          font-size: clamp(14px, 1vw, 24px);
        }
      `}</style>
    </div>
  );
};
