
import React, { useState, useRef, useEffect } from 'react';
import { auth, db } from '../../services/firebase';
import * as FirebaseAuth from 'firebase/auth';
const { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
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
type AuthMode = 'login' | 'register' | 'reset';

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter, systemSettings }) => {
  const [step, setStep] = useState<Step>('discovery');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorDetails, setErrorDetails] = useState<{ code: string; message: string } | null>(null);

  const holdTimerRef = useRef<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Parallax Effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 20 - 10,
        y: (e.clientY / window.innerHeight) * 20 - 10
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleHoldStart = () => {
    if (isVerified) return;
    holdTimerRef.current = window.setInterval(() => {
      setVerificationProgress(prev => {
        if (prev >= 100) {
          if (holdTimerRef.current) clearInterval(holdTimerRef.current);
          setIsVerified(true);
          setTimeout(() => setStep('entry'), 800); // Slight delay to show success state
          return 100;
        }
        return prev + 2; // Speed of fill
      });
    }, 16);
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
    setResetSuccess(false);

    try {
      if (authMode === 'reset') {
        if (!email) throw new Error('EMAIL_REQUIRED');
        await sendPasswordResetEmail(auth, email);
        setResetSuccess(true);
      } else if (authMode === 'register') {
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
        
        onEnter();
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        onEnter();
      }
    } catch (error: any) {
      console.error(error);
      let msg = 'Credential authentication failed. Access denied.';
      if (error.message === 'REGISTRATION_DISABLED') msg = 'Registration is currently locked by central command.';
      if (error.message === 'EMAIL_REQUIRED') msg = 'Please provide a valid network ID to reset.';
      if (error.code === 'auth/user-not-found') msg = 'Identity node not found on grid.';
      if (error.code === 'auth/wrong-password') msg = 'Incorrect passkey. Access rejected.';
      if (error.code === 'auth/email-already-in-use') msg = 'Identity already registered on the grid.';
      if (error.code === 'auth/invalid-email') msg = 'Malformed network ID format.';
      
      setErrorDetails({ code: error.code || 'ERR', message: msg });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] bg-[#020617] text-white flex items-center justify-center overflow-hidden selection:bg-indigo-500 selection:text-white font-sans">
      
      {/* --- ATMOSPHERIC BACKGROUND LAYER --- */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Deep Space Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#0f172a] to-[#020617]" />
        
        {/* Animated Mesh Grid */}
        <div className="absolute inset-0 opacity-[0.03]" 
             style={{ 
               backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, 
               backgroundSize: '50px 50px',
               transform: `translate(${mousePos.x * 2}px, ${mousePos.y * 2}px)`
             }} 
        />
        
        {/* Floating Orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse-slow" 
             style={{ transform: `translate(${mousePos.x * -4}px, ${mousePos.y * -4}px)` }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-rose-600/5 rounded-full blur-[100px]" 
             style={{ transform: `translate(${mousePos.x * 3}px, ${mousePos.y * 3}px)` }} />
      </div>

      {/* --- CONTENT LAYER --- */}
      <div className="relative z-10 w-full max-w-md px-6">
        
        {step === 'discovery' && (
          <div className="flex flex-col items-center justify-center space-y-12 animate-in fade-in zoom-in-95 duration-1000">
            
            {/* Brand Header */}
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-white text-slate-950 rounded-[2rem] flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.2)] mx-auto relative group">
                <span className="font-black italic text-4xl relative z-10">V</span>
                <div className="absolute inset-0 bg-white/20 blur-xl rounded-full animate-pulse" />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tighter uppercase text-white">VibeStream</h1>
                <div className="flex items-center justify-center gap-3 mt-2 opacity-50">
                  <span className="h-px w-8 bg-white" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] font-mono">System_Ready</p>
                  <span className="h-px w-8 bg-white" />
                </div>
              </div>
            </div>

            {/* Interaction Core */}
            <div className="relative group w-64 h-64 flex items-center justify-center">
              {/* Spinning Rings */}
              <div className={`absolute inset-0 rounded-full border border-white/5 animate-[spin_10s_linear_infinite] ${isVerified ? 'border-emerald-500/20' : ''}`} />
              <div className={`absolute inset-4 rounded-full border border-white/5 animate-[spin_15s_linear_infinite_reverse] ${isVerified ? 'border-emerald-500/20' : ''}`} />
              
              {/* Progress Ring SVG */}
              <svg className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                <circle 
                  cx="50" cy="50" r="46" fill="none" 
                  stroke={isVerified ? '#10b981' : '#6366f1'} 
                  strokeWidth="2"
                  strokeDasharray="289.02" // 2 * PI * 46
                  strokeDashoffset={289.02 - (289.02 * verificationProgress) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-75 ease-linear"
                />
              </svg>

              {/* The Button */}
              <button 
                onMouseDown={handleHoldStart} 
                onMouseUp={handleHoldEnd} 
                onMouseLeave={handleHoldEnd}
                onTouchStart={handleHoldStart} 
                onTouchEnd={handleHoldEnd}
                className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 z-10 active:scale-95 touch-none select-none ${
                  isVerified 
                    ? 'bg-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.6)] scale-110' 
                    : 'bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.1)]'
                }`}
              >
                {isVerified ? (
                  <svg className="w-12 h-12 text-white animate-in zoom-in duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <div className="text-white opacity-80 group-hover:opacity-100 transition-opacity">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
                    </svg>
                  </div>
                )}
              </button>
              
              {/* Text Hint */}
              <div className="absolute -bottom-16 text-center transition-opacity duration-300">
                <p className={`text-[10px] font-black uppercase tracking-[0.3em] font-mono ${isVerified ? 'text-emerald-400' : 'text-slate-500 animate-pulse'}`}>
                  {isVerified ? 'UPLINK_ESTABLISHED' : 'HOLD_TO_SYNC'}
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 'entry' && (
          <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-8 md:p-10 shadow-2xl animate-in slide-in-from-bottom-12 duration-700 relative overflow-hidden">
            
            {/* Top Shine */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />

            {/* Mode Switcher */}
            {authMode !== 'reset' ? (
              <div className="flex p-1 bg-black/40 rounded-[1.5rem] mb-8 relative border border-white/5">
                {(['login', 'register'] as const).map(mode => {
                  if (mode === 'register' && systemSettings.registrationDisabled) return null;
                  return (
                    <button 
                      key={mode} 
                      onClick={() => { setAuthMode(mode); setErrorDetails(null); }}
                      className={`flex-1 py-3 rounded-[1.2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all relative z-10 ${authMode === mode ? 'text-slate-950 bg-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      {mode}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="mb-8 flex items-center justify-between pb-4 border-b border-white/10">
                <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Recovery_Mode</h3>
                <button 
                  onClick={() => { setAuthMode('login'); setErrorDetails(null); setResetSuccess(false); }} 
                  className="text-[9px] font-bold text-slate-400 hover:text-white uppercase tracking-widest font-mono"
                >
                  Return
                </button>
              </div>
            )}

            <form onSubmit={handleEntry} className="space-y-5">
              {authMode === 'register' && (
                <div className="space-y-1 animate-in fade-in slide-in-from-right-4">
                  <label className="text-[8px] font-black text-indigo-400 uppercase tracking-widest ml-4 font-mono">Identity_Label</label>
                  <input 
                    type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white placeholder:text-slate-600 focus:bg-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
                  />
                </div>
              )}
              
              <div className="space-y-1">
                <label className="text-[8px] font-black text-indigo-400 uppercase tracking-widest ml-4 font-mono">Network_ID</label>
                <input 
                  type="email" placeholder="node@vibestream.io" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white placeholder:text-slate-600 focus:bg-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
                />
              </div>

              {authMode !== 'reset' && (
                <div className="space-y-1 animate-in fade-in slide-in-from-right-4">
                  <div className="flex justify-between items-center px-4">
                    <label className="text-[8px] font-black text-indigo-400 uppercase tracking-widest font-mono">Passkey</label>
                    {authMode === 'login' && (
                      <button 
                        type="button" 
                        onClick={() => { setAuthMode('reset'); setErrorDetails(null); }}
                        className="text-[8px] font-bold text-slate-500 hover:text-white uppercase tracking-widest font-mono transition-colors"
                      >
                        Forgot?
                      </button>
                    )}
                  </div>
                  <input 
                    type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white placeholder:text-slate-600 focus:bg-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
                  />
                </div>
              )}

              {/* Status Messages */}
              {errorDetails && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl animate-in zoom-in-95">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                    <p className="text-[9px] font-bold text-rose-300 uppercase tracking-widest font-mono leading-tight">{errorDetails.message}</p>
                  </div>
                </div>
              )}

              {resetSuccess && authMode === 'reset' && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl animate-in zoom-in-95">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <p className="text-[9px] font-bold text-emerald-300 uppercase tracking-widest font-mono leading-tight">Recovery signal transmitted.</p>
                  </div>
                </div>
              )}

              <button 
                disabled={isProcessing || (authMode === 'reset' && resetSuccess)}
                className="w-full py-5 bg-white text-slate-950 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-indigo-50 transition-all active:scale-95 disabled:opacity-50 mt-6 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_50px_rgba(255,255,255,0.2)] flex items-center justify-center gap-3 group"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-950 rounded-full animate-spin" />
                    <span>PROCESSING...</span>
                  </>
                ) : (
                  <>
                    <span>{authMode === 'login' ? 'INITIALIZE_SESSION' : authMode === 'register' ? 'CREATE_NODE' : 'TRANSMIT_RESET'}</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.1; transform: scale(1.1); }
        }
        .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
      `}} />
    </div>
  );
};
