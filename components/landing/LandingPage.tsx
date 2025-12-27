
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
const { doc, setDoc, serverTimestamp, collection, query, limit, getDocs, getDoc, getDocFromServer, addDoc } = Firestore as any;
import { SystemSettings, ToastMessage } from '../../types';
import { PrivacyPage } from '../legal/PrivacyPage';
import { TermsPage } from '../legal/TermsPage';
import { CookiesPage } from '../legal/CookiesPage';
import { ICONS } from '../../constants';
import { Toast } from '../ui/Toast';

interface LandingPageProps {
  onEnter: () => void;
  systemSettings: SystemSettings;
}

type AuthMode = 'login' | 'register' | 'reset';
type ViewMode = 'auth' | 'privacy' | 'terms' | 'cookies';

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter, systemSettings }) => {
  const [currentView, setCurrentView] = useState<ViewMode>('auth');
  
  // Auth States
  const [isVerified, setIsVerified] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const holdTimerRef = useRef<number | null>(null);

  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  // Location States
  const [location, setLocation] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<any>(null);

  const [errorDetails, setErrorDetails] = useState<{ code: string; message: string } | null>(null);
  
  // Local Toast System
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // --- HOLD TO SYNC LOGIC ---
  const handleHoldStart = () => {
    if (isVerified) return;
    if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    
    holdTimerRef.current = window.setInterval(() => {
      setVerificationProgress(prev => {
        if (prev >= 100) {
          if (holdTimerRef.current) clearInterval(holdTimerRef.current);
          setIsVerified(true);
          return 100;
        }
        return prev + 2; 
      });
    }, 16);
  };

  const handleHoldEnd = () => {
    if (isVerified) return;
    if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    setVerificationProgress(0);
  };

  // --- LOCATION LOGIC ---
  const handleLocationSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocation(val);
    
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (val.length > 2) {
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=5&addressdetails=1`);
          const data = await res.json();
          setLocationSuggestions(data);
          setShowSuggestions(true);
        } catch (err) {
          console.error("Location lookup failed", err);
        }
      }, 500); 
    } else {
      setLocationSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectLocation = (loc: any) => {
    let preciseLoc = loc.display_name;
    if (loc.address) {
       const parts = [
         loc.address.road || loc.address.suburb || loc.address.village,
         loc.address.city || loc.address.town || loc.address.county,
         loc.address.country_code?.toUpperCase()
       ].filter(Boolean);
       if (parts.length >= 2) preciseLoc = parts.join(', ');
    }

    setLocation(preciseLoc);
    setLocationSuggestions([]);
    setShowSuggestions(false);
  };

  // --- AUTH HANDLERS ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setIsProcessing(true);
    setErrorDetails(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      onEnter();
    } catch (error: any) {
      console.error(error);
      let msg = 'Login failed. Please check your credentials.';
      if (error.code === 'auth/user-not-found') msg = 'Account not found.';
      if (error.code === 'auth/wrong-password') msg = 'Incorrect password.';
      if (error.code === 'auth/invalid-email') msg = 'Invalid email format.';
      setErrorDetails({ code: error.code, message: msg });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (systemSettings.registrationDisabled) {
      addToast('Registration Protocols Disabled: New node creation restricted.', 'error');
      return;
    }

    if (!fullName.trim() || !email.trim() || !password.trim() || !location.trim()) {
      setErrorDetails({ code: 'MISSING_FIELDS', message: 'All fields are required.' });
      return;
    }

    if (!acceptedTerms) {
      setErrorDetails({ code: 'TERMS_NOT_ACCEPTED', message: 'You must accept the Terms of Uplink.' });
      return;
    }

    setIsProcessing(true);
    setErrorDetails(null);

    try {
      const settingsSnap = await getDocFromServer(doc(db, 'settings', 'global'));
      
      if (settingsSnap.exists() && settingsSnap.data().registrationDisabled) {
         setErrorDetails({ code: 'REG_DISABLED_SERVER', message: 'Registration is locked by Citadel Command.' });
         setIsProcessing(false);
         return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: fullName });

      let assignedRole = 'member';
      let trustTier = 'Gamma';
      let badges = ['New Arrival'];
      let bio = 'Just joined the grid.';
      let verified = false;

      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, limit(1));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          assignedRole = 'admin';
          trustTier = 'Alpha';
          badges = ['System Root', 'Founder'];
          bio = 'System Administrator and Grid Architect.';
          verified = true;
        }
      } catch (err) {
        console.warn('Role assignment check skipped, defaulting to member');
      }

      const nameBase = fullName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const emailBase = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      const username = nameBase.length > 0 ? nameBase : emailBase;

      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        username: username,
        displayName: fullName, 
        email: email,
        bio: bio,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
        coverUrl: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80',
        followers: 0,
        following: 0,
        role: assignedRole,
        location: location,
        joinedAt: serverTimestamp(),
        verifiedHuman: verified,
        presenceStatus: 'Online',
        statusEmoji: '👋',
        statusMessage: 'Hello world!',
        trustTier: trustTier,
        badges: badges,
        tags: [],
        socialLinks: []
      });

      await addDoc(collection(db, 'notifications'), {
        type: 'system',
        fromUserId: 'SYSTEM',
        fromUserName: 'VibeStream Core',
        fromUserAvatar: '',
        toUserId: user.uid,
        targetId: 'onboarding',
        text: `Welcome to the Grid, ${fullName}. Your neural node is active. Complete your profile to increase signal velocity.`,
        isRead: false,
        timestamp: serverTimestamp(),
        pulseFrequency: 'resilience'
      });
      
      onEnter();
    } catch (error: any) {
      let msg = 'Registration failed.';
      if (error.code === 'auth/email-already-in-use') msg = 'Email already in use.';
      if (error.code === 'auth/weak-password') msg = 'Password should be at least 6 characters.';
      if (error.code === 'auth/invalid-email') msg = 'Invalid email format.';
      setErrorDetails({ code: error.code, message: msg });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorDetails({ code: 'NO_EMAIL', message: 'Please enter your email address.' });
      return;
    }
    setIsProcessing(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSuccess(true);
      setErrorDetails(null);
    } catch (error: any) {
      setErrorDetails({ code: error.code, message: 'Failed to send reset email.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptTerms = () => {
    setAcceptedTerms(true);
    setAuthMode('register');
    setShowRegisterModal(true);
    setCurrentView('auth');
    addToast("Protocols Accepted", "success");
  };

  const renderLegalContent = () => {
    const commonClasses = "max-w-4xl mx-auto pt-24 pb-12 px-6 min-h-screen text-slate-900 dark:text-white";
    const BackButton = () => (
      <button 
        onClick={() => setCurrentView('auth')}
        className="fixed top-6 right-6 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 dark:hover:bg-indigo-400 transition-all z-50 active:scale-95 flex items-center gap-2"
      >
        <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7-7 7m7-7H3" /></svg>
        Return_To_Grid
      </button>
    );

    if (currentView === 'privacy') return <div className={commonClasses}><BackButton /><PrivacyPage /></div>;
    if (currentView === 'terms') return <div className={commonClasses}><BackButton /><TermsPage onAccept={handleAcceptTerms} /></div>;
    if (currentView === 'cookies') return <div className={commonClasses}><BackButton /><CookiesPage /></div>;
    return null;
  };

  if (currentView !== 'auth') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-y-auto">
        {renderLegalContent()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans relative overflow-hidden selection:bg-indigo-500 selection:text-white transition-colors duration-500">
      
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-indigo-600/5 dark:bg-indigo-500/10 rounded-full blur-[120px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-rose-500/5 dark:bg-rose-500/10 rounded-full blur-[120px]" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay dark:opacity-[0.05]" />
      </div>

      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center p-6 lg:p-12 relative z-10 gap-12 lg:gap-24">
        
        {/* BRAND COLUMN */}
        <div className="flex-1 max-w-xl text-center lg:text-left space-y-8 animate-in slide-in-from-left-8 duration-700">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white dark:bg-slate-900 rounded-full shadow-sm border border-slate-100 dark:border-slate-800">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
             <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em] font-mono">System_Operational</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none">
            Vibe<br/>Stream
          </h1>
          
          <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-lg mx-auto lg:mx-0">
            The next-generation neural interface for global synchronization. Connect, broadcast, and amplify your signal.
          </p>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-4">
             <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400"><ICONS.Verified /></div>
                <div className="text-left">
                   <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 font-mono">Security</p>
                   <p className="text-xs font-bold text-slate-900 dark:text-white">End-to-End Encrypted</p>
                </div>
             </div>
             <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-50 dark:bg-rose-900/30 rounded-xl text-rose-600 dark:text-rose-400"><ICONS.Temporal /></div>
                <div className="text-left">
                   <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 font-mono">Latency</p>
                   <p className="text-xs font-bold text-slate-900 dark:text-white">Real-Time Sync</p>
                </div>
             </div>
          </div>
        </div>

        {/* INTERACTION COLUMN */}
        <div className="w-full max-w-[420px] animate-in slide-in-from-bottom-8 duration-700 delay-100">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-8 rounded-[3rem] shadow-2xl border border-white/50 dark:border-slate-800 relative overflow-hidden ring-1 ring-slate-900/5 dark:ring-white/5">
            
            {/* STATE 1: ACCESS HOLD */}
            {!isVerified ? (
              <div className="py-10 flex flex-col items-center text-center">
                <div className="relative mb-8 group cursor-pointer touch-none">
                  {/* Progress Ring */}
                  <svg className="w-32 h-32 -rotate-90 transform" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="6" strokeLinecap="round" />
                    <circle 
                      cx="50" cy="50" r="46" fill="none" 
                      stroke="#4f46e5" 
                      strokeWidth="6"
                      strokeDasharray="289.02" 
                      strokeDashoffset={289.02 - (289.02 * verificationProgress) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-75 ease-linear"
                    />
                  </svg>
                  
                  {/* Interactive Button */}
                  <button 
                    onMouseDown={handleHoldStart} 
                    onMouseUp={handleHoldEnd} 
                    onMouseLeave={handleHoldEnd}
                    onTouchStart={handleHoldStart} 
                    onTouchEnd={handleHoldEnd}
                    className="absolute inset-2 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center shadow-inner transition-all active:scale-95 group-active:shadow-none"
                  >
                    <div className={`transition-all duration-300 ${verificationProgress > 0 ? 'scale-110 text-indigo-600 dark:text-indigo-400' : 'text-slate-300 dark:text-slate-600'}`}>
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 1 1 7.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 0 1-3.6 9.75m6.633-4.596a18.666 18.666 0 0 1-2.485 5.33" />
                      </svg>
                    </div>
                  </button>
                </div>
                
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase italic tracking-tight">Security_Check</h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-[200px] leading-relaxed">
                  Hold the button to verify biometric signature and synchronize with the grid.
                </p>
              </div>
            ) : (
              // STATE 2: AUTH FORMS
              <div className="animate-in slide-in-from-right-8 duration-500">
                {authMode === 'login' && (
                  <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <div className="text-center mb-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-widest font-mono mb-4 border border-emerald-100 dark:border-emerald-800">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>
                        Identity Verified
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <input 
                        type="email" 
                        placeholder="Neural ID (Email)" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required
                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white"
                      />
                      <input 
                        type="password" 
                        placeholder="Access Key" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required
                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white"
                      />
                    </div>
                    
                    {errorDetails && (
                      <div className="text-rose-500 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest text-center bg-rose-50 dark:bg-rose-900/20 py-2 rounded-xl border border-rose-100 dark:border-rose-900">
                        {errorDetails.message}
                      </div>
                    )}

                    <button 
                      type="submit" 
                      disabled={isProcessing}
                      className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 dark:hover:bg-indigo-400 dark:hover:text-white transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
                    >
                      {isProcessing ? <div className="w-4 h-4 border-2 border-white/30 dark:border-slate-900/30 border-t-white dark:border-t-slate-900 rounded-full animate-spin" /> : 'INITIALIZE_LINK'}
                    </button>

                    <div className="flex justify-between items-center mt-2 px-1">
                      <button 
                        type="button" 
                        onClick={() => { setAuthMode('reset'); setErrorDetails(null); }}
                        className="text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      >
                        Lost Key?
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          if (systemSettings.registrationDisabled) {
                            addToast("Registration Protocols Disabled: New node creation is currently restricted by Grid Command.", "error");
                            return;
                          }
                          setShowRegisterModal(true);
                          setAuthMode('register');
                          setErrorDetails(null);
                          setEmail('');
                          setPassword('');
                          setAcceptedTerms(false);
                        }}
                        className={`text-[10px] font-black uppercase tracking-widest transition-colors ${systemSettings.registrationDisabled ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed hover:text-slate-50 dark:hover:text-slate-500' : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300'}`}
                      >
                        Create_Node
                      </button>
                    </div>
                  </form>
                )}

                {authMode === 'reset' && (
                  <form onSubmit={handleReset} className="flex flex-col gap-6 py-2">
                    <div className="text-center">
                      <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic">Recovery_Mode</h3>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-2">Enter your Neural ID to reset access protocols.</p>
                    </div>
                    <input 
                      type="email" 
                      placeholder="Target Email Address" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      required
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-slate-900 dark:text-white"
                    />
                    
                    {errorDetails && <div className="text-rose-500 dark:text-rose-400 text-[10px] font-bold text-center">{errorDetails.message}</div>}
                    {resetSuccess && <div className="text-emerald-500 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest text-center">Recovery signal sent.</div>}

                    <div className="flex gap-3">
                      <button 
                        type="button" 
                        onClick={() => { setAuthMode('login'); setErrorDetails(null); setResetSuccess(false); }}
                        className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                      >
                        Abort
                      </button>
                      <button 
                        type="submit" 
                        disabled={isProcessing}
                        className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg"
                      >
                        Send_Signal
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* REGISTER MODAL */}
      {showRegisterModal && authMode === 'register' && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowRegisterModal(false)}></div>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3.5rem] p-10 shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="shrink-0 flex justify-between items-start mb-8">
               <div>
                 <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none">Node_Creation</h2>
                 <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] font-mono mt-2">Initialize Your Neural ID</p>
               </div>
               <button onClick={() => setShowRegisterModal(false)} className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all"><svg className="w-6 h-6 text-slate-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>

            <form onSubmit={handleRegister} className="flex-1 overflow-y-auto no-scrollbar space-y-6 px-1">
               <div className="space-y-4">
                  <div className="space-y-1">
                     <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono ml-2">Public_Display_Name</label>
                     <input 
                       type="text" value={fullName} onChange={e => setFullName(e.target.value)} 
                       placeholder="e.g. Alex Rivera" required
                       className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-900 dark:text-white"
                     />
                  </div>

                  <div className="space-y-1">
                     <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono ml-2">Neural_ID (Email)</label>
                     <input 
                       type="email" value={email} onChange={e => setEmail(e.target.value)} 
                       placeholder="node@vibestream.io" required
                       className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-900 dark:text-white"
                     />
                  </div>

                  <div className="space-y-1">
                     <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono ml-2">Access_Key (Password)</label>
                     <input 
                       type="password" value={password} onChange={e => setPassword(e.target.value)} 
                       placeholder="••••••••" required
                       className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-900 dark:text-white"
                     />
                  </div>

                  <div className="space-y-1 relative">
                     <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono ml-2">Geospatial_Node</label>
                     <input 
                       type="text" value={location} onChange={handleLocationSearch} 
                       placeholder="London, UK..." required
                       className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white dark:focus:bg-slate-700 transition-all text-slate-900 dark:text-white"
                     />
                     {showSuggestions && locationSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden overflow-y-auto max-h-48">
                           {locationSuggestions.map((loc, idx) => (
                              <button key={idx} type="button" onClick={() => selectLocation(loc)} className="w-full px-4 py-3 text-left text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-50 dark:border-slate-700 last:border-0 text-slate-700 dark:text-slate-300">
                                 {loc.display_name}
                              </button>
                           ))}
                        </div>
                     )}
                  </div>

                  <div className="pt-4">
                     <button 
                       type="button" 
                       onClick={() => { setCurrentView('terms'); setShowRegisterModal(false); }}
                       className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${acceptedTerms ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 text-indigo-600' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 text-slate-400 hover:border-indigo-100'}`}
                     >
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-colors ${acceptedTerms ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200'}`}>
                           {acceptedTerms && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Accept Terms of Uplink</span>
                     </button>
                  </div>
               </div>

               {errorDetails && <div className="text-rose-500 text-[10px] font-black uppercase tracking-widest text-center py-3 bg-rose-50 rounded-xl border border-rose-100">{errorDetails.message}</div>}

               <div className="pt-6 border-t border-slate-50 dark:border-slate-800">
                  <button 
                    type="submit" 
                    disabled={isProcessing || !acceptedTerms}
                    className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.8rem] font-black text-xs uppercase tracking-[0.4em] shadow-xl hover:bg-indigo-600 dark:hover:bg-indigo-400 dark:hover:text-white transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3"
                  >
                    {isProcessing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ICONS.Verified />}
                    INITIALIZE_SYNC
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="p-8 text-center relative z-10">
         <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-4">
            <button onClick={() => setCurrentView('privacy')} className="text-[10px] font-black text-slate-400 hover:text-indigo-500 uppercase tracking-widest transition-colors">Privacy_Protocol</button>
            <button onClick={() => setCurrentView('terms')} className="text-[10px] font-black text-slate-400 hover:text-indigo-500 uppercase tracking-widest transition-colors">Terms_of_Uplink</button>
            <button onClick={() => setCurrentView('cookies')} className="text-[10px] font-black text-slate-400 hover:text-indigo-500 uppercase tracking-widest transition-colors">Data_Fragments</button>
         </div>
         <p className="text-[9px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-[0.5em] font-mono">
           VibeStream Grid • UK_Central • Node_v2.6.4
         </p>
      </footer>

      {toasts.map(t => <div key={t.id} className="fixed top-12 right-6 z-[2000]"><Toast toast={t} onClose={removeToast} /></div>)}
    </div>
  );
};
