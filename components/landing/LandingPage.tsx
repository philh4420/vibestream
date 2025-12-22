
import React, { useState, useRef } from 'react';
import { auth, db } from '../../services/firebase';
// Fixed: Using namespaced import for firebase/auth to resolve "no exported member" errors
import * as FirebaseAuth from 'firebase/auth';
const { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile 
} = FirebaseAuth as any;
import * as Firestore from 'firebase/firestore';
const { doc, setDoc, serverTimestamp } = Firestore as any;
import { ICONS } from '../../constants';
import { SystemSettings } from '../../types';

interface LandingPageProps {
  onEnter: () => void;
  systemSettings: SystemSettings;
}

type Step = 'discovery' | 'verification' | 'entry';
type AuthMode = 'login' | 'register';

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter, systemSettings }) => {
  const [step, setStep] = useState<Step>('discovery');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorDetails, setErrorDetails] = useState<{ code: string; message: string } | null>(null);

  const holdTimerRef = useRef<number | null>(null);

  const handleHoldStart = () => {
    if (isVerified) return;
    holdTimerRef.current = window.setInterval(() => {
      setVerificationProgress(prev => {
        if (prev >= 100) {
          if (holdTimerRef.current) clearInterval(holdTimerRef.current);
          setIsVerified(true);
          setTimeout(() => setStep('entry'), 600);
          return 100;
        }
        return prev + 2.5;
      });
    }, 20);
  };

  const handleHoldEnd = () => {
    if (isVerified) return;
    if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    if (verificationProgress < 100) setVerificationProgress(0);
  };

  const handleEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setIsProcessing(true);
    setErrorDetails(null);
    try {
      if (authMode === 'register') {
        if (systemSettings.registrationDisabled) {
          throw new Error('REGISTRATION_DISABLED');
        }
        // 1. Create Auth User
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // 2. Update Auth Profile
        if (fullName) await updateProfile(user, { displayName: fullName });

        // 3. Create Firestore User Document
        await setDoc(doc(db, 'users', user.uid), {
          id: user.uid,
          username: email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''),
          displayName: fullName || 'New Node',
          email: email,
          bio: 'Digital identity synchronised.',
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
          coverUrl: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80',
          followers: 0,
          following: 0,
          role: 'member',
          location: 'Grid Node',
          joinedAt: serverTimestamp(),
          verifiedHuman: false,
          presenceStatus: 'Online',
          statusEmoji: '⚡',
          statusMessage: 'Initializing uplink...',
          trustTier: 'Gamma',
          badges: ['New Arrival'],
          tags: ['Novice'],
          socialLinks: []
        });

      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onEnter();
    } catch (error: any) {
      const msg = error.message === 'REGISTRATION_DISABLED' 
        ? 'Registration is currently locked by central command.'
        : 'Credential authentication failed. Access denied.';
      setErrorDetails({ code: error.code || 'ERR', message: msg });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] bg-[#020617] text-white flex items-center justify-center p-6 overflow-hidden selection:bg-indigo-500">
      {/* Precision Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.1] mix-blend-overlay" />
        <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] w-full h-full opacity-[0.03]">
          {Array.from({ length: 400 }).map((_, i) => (
            <div key={i} className="border-t border-l border-white h-full" />
          ))}
        </div>
      </div>

      <div className="relative z-10 w-full max-w-xl">
        {step === 'discovery' && (
          <div className="space-y-12 animate-in fade-in zoom-in-95 duration-700 text-center">
            <div className="flex flex-col items-center gap-6">
              <div className="w-16 h-16 bg-white text-slate-950 rounded-2xl flex items-center justify-center shadow-2xl font-black italic text-4xl">V</div>
              <div>
                <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">VibeStream Pro</h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] font-mono">Infrastructure Node v2.6.GB</p>
              </div>
            </div>

            <div className="space-y-8">
              <p className="text-slate-400 text-sm font-medium tracking-wide max-w-sm mx-auto leading-relaxed">
                A precision-engineered social environment. Synchronise your identity to establish connection.
              </p>
              
              <div className="relative group w-44 h-44 mx-auto">
                <div className={`absolute inset-0 bg-indigo-500/20 blur-3xl transition-opacity duration-500 ${verificationProgress > 0 ? 'opacity-100' : 'opacity-0'}`} />
                <button 
                  onMouseDown={handleHoldStart} onMouseUp={handleHoldEnd} onMouseLeave={handleHoldEnd}
                  onTouchStart={handleHoldStart} onTouchEnd={handleHoldEnd}
                  className={`relative w-full h-full rounded-[2.5rem] border transition-all duration-300 flex flex-col items-center justify-center gap-4 overflow-hidden select-none touch-none ${isVerified ? 'bg-emerald-500 border-emerald-400' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                >
                  <div className="absolute bottom-0 left-0 right-0 bg-indigo-500/30 transition-all duration-100 ease-linear" style={{ height: `${verificationProgress}%` }} />
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${isVerified ? 'bg-white text-emerald-500 scale-110 shadow-lg' : 'bg-white/10'}`}>
                    {isVerified ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path d="M5 13l4 4L19 7" /></svg> : <ICONS.Profile />}
                  </div>
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400 font-mono">
                    {isVerified ? 'Synchronised' : 'Hold to Sync'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'entry' && (
          <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 animate-in slide-in-from-bottom-8 duration-500 shadow-2xl">
            <div className="flex gap-8 mb-10 border-b border-white/5 overflow-x-auto no-scrollbar">
              {(['login', 'register'] as const).map(mode => {
                if (mode === 'register' && systemSettings.registrationDisabled) return null;
                return (
                  <button 
                    key={mode} onClick={() => setAuthMode(mode)}
                    className={`pb-4 text-xl font-black uppercase tracking-tight transition-all relative whitespace-nowrap ${authMode === mode ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`}
                  >
                    {mode}
                    {authMode === mode && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500 rounded-full" />}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleEntry} className="space-y-6">
              {authMode === 'register' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 font-mono">Full Name</label>
                  <input 
                    type="text" placeholder="Identity Label" value={fullName} onChange={e => setFullName(e.target.value)} required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-700"
                  />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 font-mono">Network ID (Email)</label>
                <input 
                  type="email" placeholder="node@vibestream.co.uk" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 font-mono">Passkey (Password)</label>
                <input 
                  type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-700"
                />
              </div>

              {errorDetails && <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest text-center font-mono leading-relaxed">{errorDetails.message}</p>}

              <button 
                disabled={isProcessing}
                className="w-full py-4 bg-white text-slate-950 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-indigo-50 transition-all active:scale-95 disabled:opacity-50 mt-4 shadow-xl"
              >
                {isProcessing ? 'Authenticating...' : 'Establish Connection'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
