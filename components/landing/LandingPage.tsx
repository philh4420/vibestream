
import React, { useState } from 'react';
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

type Step = 'discovery' | 'neural_check' | 'entry';
type AuthMode = 'login' | 'register';

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
  const [step, setStep] = useState<Step>('discovery');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const startSecureScan = () => {
    setStep('neural_check');
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 15;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setTimeout(() => setStep('entry'), 500);
      }
      setScanProgress(p);
    }, 50);
  };

  const handleEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      alert("Firebase not configured. Check your infrastructure settings.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

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
      console.error(error);
      const friendlyMessage = error.code?.includes('auth/') 
        ? error.message.replace('Firebase: ', '').replace(/\(auth.*\)./, '').trim()
        : 'Neural Link Interrupted. Retry encryption.';
      setErrorMessage(friendlyMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#020617] text-white flex flex-col font-outfit overflow-x-hidden selection:bg-indigo-500 overflow-y-auto">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[80vw] h-[80vw] bg-indigo-600/10 blur-[200px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[80vw] h-[80vw] bg-blue-600/10 blur-[200px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay" />
      </div>

      <div className="relative z-10 w-full max-w-[140rem] mx-auto min-h-screen flex flex-col p-6 md:p-12 lg:p-20">
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
          <button 
            onClick={() => setStep('entry')} 
            className="px-8 py-3.5 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-2xl text-[10px] font-black tracking-widest uppercase hover:bg-white/10 transition-all active:scale-95"
          >
            Terminal Login
          </button>
        </nav>

        <main className="flex-1 flex flex-col items-center justify-center">
          {step === 'discovery' && (
            <div className="text-center animate-in fade-in zoom-in-95 duration-1000 flex flex-col items-center">
              <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] lg:text-[12px] font-black uppercase tracking-[0.4em] mb-12">
                Deployment: London / GB-ENG
              </div>
              <h1 className="text-6xl md:text-9xl 2xl:text-[12rem] font-black tracking-tighter leading-[0.85] mb-16 max-w-[15ch]">
                BEYOND <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-300 to-indigo-400 bg-[length:200%_auto] animate-text-gradient">SOCIAL.</span>
              </h1>
              <p className="text-slate-400 text-xl md:text-3xl lg:text-4xl max-w-4xl leading-snug mb-20 font-medium opacity-80">
                A professional-grade 8K social ecosystem. Secure. Decentralised. Immersive.
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
              <h2 className="text-4xl lg:text-6xl font-black mb-6 tracking-tighter uppercase">Verifying Authenticity</h2>
              <p className="text-slate-500 text-xl mb-16 uppercase tracking-widest">Running Bot-Shield v2.6 protocols...</p>
              <div className="bg-white/[0.02] backdrop-blur-[60px] border border-white/5 rounded-[4rem] p-16 lg:p-24 relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex justify-between items-end mb-10">
                    <span className="text-[12px] font-bold text-indigo-400 tracking-[0.5em] uppercase font-mono">Neural Analysis...</span>
                    <span className="text-7xl font-mono font-black">{Math.floor(scanProgress)}%</span>
                  </div>
                  <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden mb-16">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-400 transition-all duration-300" style={{ width: `${scanProgress}%` }} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {['Biometric Sync', 'Node Integrity', 'UK Certificate'].map((t) => (
                      <div key={t} className="bg-white/5 border border-white/5 rounded-3xl p-8 text-left">
                        <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse mb-4" />
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{t}</p>
                        <p className="text-sm font-mono text-slate-400 mt-2 font-bold">READY</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'entry' && (
            <div className="w-full max-w-3xl animate-in zoom-in-95 duration-700">
              <div className="bg-white/[0.03] backdrop-blur-[100px] border border-white/10 rounded-[4rem] p-12 lg:p-20 shadow-2xl relative">
                <div className="flex gap-12 mb-16 justify-center">
                  {(['login', 'register'] as const).map(mode => (
                    <button 
                      key={mode}
                      onClick={() => { setAuthMode(mode); setErrorMessage(''); }}
                      className={`text-3xl font-black tracking-tight transition-all relative uppercase ${authMode === mode ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`}
                    >
                      {mode}
                      {authMode === mode && <div className="absolute -bottom-4 left-0 right-0 h-1.5 bg-indigo-500 rounded-full" />}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleEntry} className="space-y-8">
                  {authMode === 'register' && (
                    <Input label="Full Name" placeholder="e.g. Alexander Sterling" value={fullName} onChange={e => setFullName(e.target.value)} required />
                  )}
                  <Input label="Neural Identity" type="email" placeholder="identity@vibestream.co.uk" value={email} onChange={e => setEmail(e.target.value)} required />
                  <Input label="Passkey" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />

                  {errorMessage && (
                    <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm font-bold animate-pulse">
                      SYSTEM ERROR: {errorMessage}
                    </div>
                  )}

                  <button 
                    disabled={isProcessing}
                    className="w-full py-7 bg-white text-slate-950 rounded-3xl font-black text-xl hover:bg-indigo-50 transition-all active:scale-95 shadow-2xl flex items-center justify-center gap-4 disabled:opacity-70 mt-10 uppercase tracking-tighter"
                  >
                    {isProcessing ? 'SYNCHRONISING...' : (authMode === 'login' ? 'ESTABLISH LINK' : 'CREATE PROTOCOL')}
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>

        <footer className="w-full mt-24 border-t border-white/5 pt-16 flex flex-col md:flex-row justify-between items-center gap-10 text-slate-600 font-bold text-[11px] uppercase tracking-[0.4em] pb-12">
          <span>GLOBAL_SYNC: OK</span>
          <p>© 2026 VibeStream Infrastructure Group. London HQ.</p>
        </footer>
      </div>

      <style>{`
        @keyframes text-gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .animate-text-gradient { animation: text-gradient 4s linear infinite; }
        html { font-size: clamp(14px, 1vw, 24px); }
      `}</style>
    </div>
  );
};
