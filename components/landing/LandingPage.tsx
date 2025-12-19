
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '../ui/Input';
import { auth } from '../../services/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile 
} from 'firebase/auth';

interface LandingPageProps {
  onEnter: () => void;
}

type Step = 'discovery' | 'verification' | 'entry';
type AuthMode = 'login' | 'register';

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const [step, setStep] = useState<Step>('discovery');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorDetails, setErrorDetails] = useState<{ code: string; message: string } | null>(null);

  // Interaction Refs
  const holdTimerRef = useRef<number | null>(null);

  const handleHoldStart = () => {
    if (isVerified) return;
    holdTimerRef.current = window.setInterval(() => {
      setVerificationProgress(prev => {
        if (prev >= 100) {
          if (holdTimerRef.current) clearInterval(holdTimerRef.current);
          setIsVerified(true);
          setTimeout(() => setStep('entry'), 800);
          return 100;
        }
        return prev + 2;
      });
    }, 20);
  };

  const handleHoldEnd = () => {
    if (isVerified) return;
    if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    if (verificationProgress < 100) {
      setVerificationProgress(0);
    }
  };

  const handleEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;

    setIsProcessing(true);
    setErrorDetails(null);

    try {
      if (authMode === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (fullName) {
          await updateProfile(userCredential.user, { displayName: fullName });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onEnter();
    } catch (error: any) {
      let friendlyMessage = 'Neural Link Interrupted. Retry encryption.';
      switch (error.code) {
        case 'auth/operation-not-allowed': friendlyMessage = 'Protocol Blocked: Check Firebase Console.'; break;
        case 'auth/email-already-in-use': friendlyMessage = 'Identity Conflict: Email already registered.'; break;
        case 'auth/invalid-credential': friendlyMessage = 'Access Denied: Invalid Credentials.'; break;
        case 'auth/weak-password': friendlyMessage = 'Security Risk: Password too short.'; break;
      }
      setErrorDetails({ code: error.code || 'unknown', message: friendlyMessage });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#020617] text-white flex flex-col lg:flex-row font-outfit overflow-y-auto overflow-x-hidden selection:bg-indigo-500 overscroll-none">
      {/* Dynamic Background Mesh - Remains Fixed */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[100vw] h-[100vw] bg-indigo-600/10 blur-[250px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[100vw] h-[100vw] bg-blue-600/10 blur-[250px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.2] mix-blend-overlay" />
      </div>

      {/* LEFT PANEL: The Broadcast Hub (Value Prop & Social Proof) */}
      <section className={`relative z-10 flex-1 flex flex-col p-8 md:p-16 lg:p-24 justify-between transition-all duration-1000 ${step !== 'discovery' ? 'lg:opacity-40 lg:blur-sm' : 'opacity-100'}`}>
        <header className="flex items-center gap-6 animate-in fade-in slide-in-from-top-8 duration-700 mb-12 lg:mb-0">
          <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-[1.8rem] flex items-center justify-center shadow-2xl shadow-indigo-500/40 ring-1 ring-white/20">
            <span className="text-4xl lg:text-5xl font-black italic tracking-tighter">V</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-3xl lg:text-4xl font-black tracking-tighter leading-none">VIBESTREAM</h1>
            <span className="text-[10px] font-bold text-indigo-400 tracking-[0.4em] uppercase opacity-90">UK INFRASTRUCTURE NODE 01</span>
          </div>
        </header>

        <div className="max-w-4xl animate-in fade-in slide-in-from-left-12 duration-1000 delay-300 mb-12 lg:mb-0">
          <h2 className="text-6xl md:text-8xl 2xl:text-[10rem] font-black tracking-tighter leading-[0.85] mb-12">
            CONNECT <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-300 to-indigo-400 bg-[length:200%_auto] animate-text-gradient">THROUGH DATA.</span>
          </h2>
          <p className="text-slate-400 text-xl md:text-2xl lg:text-3xl max-w-2xl leading-snug mb-16 font-medium opacity-80">
            A high-fidelity social ecosystem for the next decade. Immersive, professional, and built on secure UK infrastructure.
          </p>
          
          {/* Social Proof Nodes */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex -space-x-4">
              {[1,2,3,4].map(i => (
                <img key={i} src={`https://picsum.photos/100/100?random=${i+10}`} className="w-12 h-12 rounded-full border-4 border-[#020617] ring-1 ring-white/10" alt="Active user" />
              ))}
            </div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-6 py-3 rounded-full border border-white/5 backdrop-blur-md">
              <span className="text-indigo-400">4,281</span> Nodes Synchronised in London
            </p>
          </div>
        </div>

        <footer className="hidden lg:flex justify-between items-center text-slate-600 font-bold text-[11px] uppercase tracking-[0.4em]">
          <span>© 2026 VIBESTREAM GROUP</span>
          <div className="flex gap-8">
            <a href="#" className="hover:text-indigo-400 transition-colors">Neural Policy</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">Protocol Data</a>
          </div>
        </footer>
      </section>

      {/* RIGHT PANEL: The Access Terminal (Verification & Auth) */}
      <section className="relative z-20 w-full lg:w-[45vw] 2xl:w-[35vw] bg-white/[0.02] lg:bg-white/[0.03] backdrop-blur-[120px] lg:border-l border-white/10 flex flex-col justify-center p-6 md:p-12 lg:p-20">
        
        {/* Verification Gate (Anti-Bot) */}
        {step === 'discovery' && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <h3 className="text-3xl lg:text-5xl font-black mb-4 tracking-tighter uppercase text-center lg:text-left">Humanity Check</h3>
            <p className="text-slate-500 text-lg mb-12 text-center lg:text-left">Hold the Bio-Sync trigger to bypass bot shielding.</p>
            
            <div className="relative group max-w-sm mx-auto lg:mx-0">
              <div className={`absolute inset-0 bg-indigo-500/20 blur-3xl transition-opacity duration-500 ${verificationProgress > 0 ? 'opacity-100' : 'opacity-0'}`} />
              <button 
                onMouseDown={handleHoldStart}
                onMouseUp={handleHoldEnd}
                onMouseLeave={handleHoldEnd}
                onTouchStart={handleHoldStart}
                onTouchEnd={handleHoldEnd}
                className={`relative w-full aspect-square rounded-[3rem] border-2 transition-all duration-300 flex flex-col items-center justify-center gap-6 overflow-hidden select-none touch-none ${isVerified ? 'bg-emerald-500 border-emerald-400 scale-95' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
              >
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-indigo-500/20 transition-all duration-100 ease-linear pointer-events-none" 
                  style={{ height: `${verificationProgress}%` }}
                />
                
                <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${isVerified ? 'bg-white text-emerald-500 rotate-0 scale-110' : 'bg-white/10 text-white rotate-45 group-hover:rotate-0'}`}>
                  {isVerified ? (
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path d="M5 13l4 4L19 7"></path></svg>
                  ) : (
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0112 3m0 0c.887 0 1.758.074 2.606.215M12 3c-1.452 0-2.837.333-4.078.932m7.418 5.371A4.419 4.419 0 0115 11.603c0 .97-.313 1.862-.844 2.615m-1.725 1.747L12 16.51m0 0a10.03 10.03 0 01-7.033-2.87m9.786-9.427a10.022 10.022 0 014.195 5.148m0 0a10.037 10.037 0 01.745 3.791c0 1.251-.23 2.448-.646 3.552M12 3a9.99 9.99 0 015.83 1.872m0 0A9.956 9.956 0 0121 12.004c0 1.251-.23 2.448-.646 3.552M12 3c1.452 0 2.837.333 4.078.932m-10.831 7.637a3.383 3.383 0 00.928 2.38m1.441 1.496l.847.847m1.566 1.566l1.107 1.107m0 0a9.994 9.994 0 008.19-4.266 9.99 9.99 0 001.506-5.411c0-1.251-.23-2.448-.646-3.552m-8.91 8.91l-.846-.846m-1.565-1.565l-1.107-1.107m0 0a9.997 9.997 0 01-2.257-9.571m3.165 9.171a4.414 4.414 0 003.553 4.195m0 0A4.42 4.42 0 0015 11.603c0-.97-.313 1.862-.844-2.615"></path></svg>
                  )}
                </div>
                <span className={`text-xl font-black tracking-widest uppercase transition-all duration-300 ${isVerified ? 'text-white' : 'text-slate-400'}`}>
                  {isVerified ? 'Identity Synchronised' : verificationProgress > 0 ? `Syncing... ${Math.floor(verificationProgress)}%` : 'Hold to Synchronise'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Auth Form (Entry) */}
        {step === 'entry' && (
          <div className="animate-in slide-in-from-right-12 duration-700 w-full">
            <div className="flex gap-10 mb-12 justify-center lg:justify-start">
              {(['login', 'register'] as const).map(mode => (
                <button 
                  key={mode}
                  type="button"
                  onClick={() => { setAuthMode(mode); setErrorDetails(null); }}
                  className={`text-3xl lg:text-4xl font-black tracking-tight transition-all relative uppercase touch-manipulation ${authMode === mode ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`}
                >
                  {mode}
                  {authMode === mode && <div className="absolute -bottom-4 left-0 right-0 h-1.5 bg-indigo-500 rounded-full" />}
                </button>
              ))}
            </div>

            <form onSubmit={handleEntry} className="space-y-6 md:space-y-8 max-w-lg mx-auto lg:mx-0">
              {authMode === 'register' && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                  <Input label="Full Name" placeholder="Alexander Sterling" value={fullName} onChange={e => setFullName(e.target.value)} required />
                </div>
              )}
              <Input label="Neural Identity" type="email" placeholder="identity@vibestream.co.uk" value={email} onChange={e => setEmail(e.target.value)} required />
              <Input label="Passkey" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />

              {errorDetails && (
                <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-[2rem] text-rose-400 text-sm animate-in shake duration-500">
                  <p className="font-black uppercase tracking-widest text-[10px] mb-1 opacity-70">Protocol Error: {errorDetails.code}</p>
                  <p className="font-bold leading-relaxed">{errorDetails.message}</p>
                </div>
              )}

              <button 
                disabled={isProcessing}
                className="group w-full py-6 md:py-8 bg-white text-slate-950 rounded-3xl font-black text-xl lg:text-2xl hover:bg-indigo-50 transition-all active:scale-95 shadow-2xl flex items-center justify-center gap-4 disabled:opacity-70 mt-10 uppercase tracking-tighter"
              >
                {isProcessing ? (
                  <div className="w-6 h-6 border-4 border-slate-900/20 border-t-slate-900 rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{authMode === 'login' ? 'Establish Link' : 'Create Protocol'}</span>
                    <svg className="w-6 h-6 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                  </>
                )}
              </button>
              
              <p className="text-center lg:text-left text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-loose mt-8">
                By establishing a link, you agree to our <br className="md:hidden" />
                <span className="text-slate-400">Standard Neural Protocols</span> and <span className="text-slate-400">Data Encryption Acts</span>.
              </p>
            </form>
          </div>
        )}
      </section>

      <style>{`
        @keyframes text-gradient { 
          0% { background-position: 0% 50%; } 
          50% { background-position: 100% 50%; } 
          100% { background-position: 0% 50%; } 
        }
        .animate-text-gradient { animation: text-gradient 4s linear infinite; }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }

        /* Smooth scrollbar hide but functional */
        .overflow-y-auto::-webkit-scrollbar {
          display: none;
        }
        .overflow-y-auto {
          -ms-overflow-style: none;
          scrollbar-width: none;
          overscroll-behavior-y: none; /* Disable browser pull-to-refresh */
        }

        /* 8K / 4K Responsive Tuning */
        @media (min-width: 2560px) {
          html { font-size: 24px; }
          .max-w-4xl { max-width: 1200px; }
        }
      `}</style>
    </div>
  );
};
