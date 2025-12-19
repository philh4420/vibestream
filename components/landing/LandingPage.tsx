
import React, { useState, useEffect } from 'react';

interface LandingPageProps {
  onEnter: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const [step, setStep] = useState<'idle' | 'verifying' | 'granted'>('idle');
  const [progress, setProgress] = useState(0);

  const startVerification = () => {
    setStep('verifying');
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 15;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setTimeout(() => setStep('granted'), 500);
        setTimeout(onEnter, 1500);
      }
      setProgress(p);
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#020617] text-white flex flex-col items-center justify-center overflow-hidden font-outfit selection:bg-indigo-500">
      {/* 2026 Ambient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 blur-[150px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      <div className="relative z-10 w-full max-w-[90rem] px-6 md:px-12 flex flex-col items-center">
        {/* Brand */}
        <header className="mb-12 animate-in fade-in slide-in-from-top-10 duration-1000">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-indigo-500/30 ring-1 ring-white/20">
              <span className="text-3xl font-black italic tracking-tighter">V</span>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-black tracking-tighter leading-none">VIBESTREAM</span>
              <span className="text-[10px] font-bold text-indigo-400 tracking-[0.3em] uppercase opacity-80">Social Protocol v2.6</span>
            </div>
          </div>
        </header>

        {/* Hero Text */}
        <div className="text-center max-w-6xl mb-16 space-y-8">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tight leading-[0.95] animate-in fade-in zoom-in-95 duration-1000 delay-200">
            CONNECT THE <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-indigo-400 bg-[length:200%_auto] animate-text-gradient">NEURAL ERA.</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-2xl max-w-3xl mx-auto leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
            A high-fidelity ecosystem for the next generation of creators. Built for 8K resolution, powered by security, and refined for the 2026 standard.
          </p>
        </div>

        {/* Verification System */}
        <div className="w-full max-w-xl">
          <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 md:p-12 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
            
            {step === 'idle' && (
              <div className="text-center space-y-8 animate-in fade-in duration-500">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Neural Handshake</h2>
                  <p className="text-slate-500 text-sm">Initiate biometric validation to access the protocol.</p>
                </div>
                <button 
                  onClick={startVerification}
                  className="w-full py-6 bg-white text-slate-950 rounded-2xl font-black text-xl hover:bg-indigo-50 transition-all active:scale-95 shadow-xl shadow-white/5"
                >
                  ENTER HUB
                </button>
              </div>
            )}

            {step === 'verifying' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-xl font-bold text-indigo-400">Verifying Identity</h2>
                    <p className="text-slate-500 text-xs font-mono uppercase tracking-widest">Scanning neural patterns...</p>
                  </div>
                  <span className="text-3xl font-mono font-black">{Math.floor(progress)}%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mb-1" />
                    <span className="text-[10px] text-slate-500 font-bold uppercase">SSL Secured</span>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse mb-1" />
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Bot-Shield v4</span>
                  </div>
                </div>
              </div>
            )}

            {step === 'granted' && (
              <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20 ring-4 ring-emerald-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={4} stroke="currentColor" className="w-10 h-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <h2 className="text-3xl font-black text-emerald-400">ACCESS GRANTED</h2>
                <p className="text-slate-500 font-medium">Synchronizing profile nodes...</p>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Footer Info */}
        <div className="mt-20 flex flex-wrap justify-center gap-12 text-slate-600 font-bold text-[10px] uppercase tracking-[0.3em]">
          <span>ENCRYPTED IN THE UK</span>
          <span>8K NATIVE INTERFACE</span>
          <span>NEURAL PROTECTED</span>
        </div>
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
