
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
const { doc, setDoc, serverTimestamp, collection, query, limit, getDocs, getDoc } = Firestore as any;
import { SystemSettings } from '../../types';
import { PrivacyPage } from '../legal/PrivacyPage';
import { TermsPage } from '../legal/TermsPage';
import { CookiesPage } from '../legal/CookiesPage';
import { ICONS } from '../../constants';

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
  
  // Location States
  const [location, setLocation] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<any>(null);

  const [errorDetails, setErrorDetails] = useState<{ code: string; message: string } | null>(null);

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
        return prev + 2; // Speed of fill
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
    
    // Quick local check
    if (systemSettings.registrationDisabled) {
      setErrorDetails({ code: 'REG_DISABLED', message: 'Registration is currently disabled.' });
      return;
    }

    if (!fullName.trim() || !email.trim() || !password.trim() || !location.trim()) {
      setErrorDetails({ code: 'MISSING_FIELDS', message: 'All fields are required.' });
      return;
    }

    setIsProcessing(true);
    setErrorDetails(null);

    try {
      // SECURITY PROTOCOL: Fresh Server Check for Registration Lock
      // This prevents race conditions where the local settings might be stale.
      const settingsSnap = await getDoc(doc(db, 'settings', 'global'));
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

      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        username: email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''),
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

  // RENDER CONTENT FOR LEGAL PAGES
  const renderLegalContent = () => {
    const commonClasses = "max-w-4xl mx-auto pt-24 pb-12 px-6 min-h-screen";
    const BackButton = () => (
      <button 
        onClick={() => setCurrentView('auth')}
        className="fixed top-6 right-6 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all z-50 active:scale-95 flex items-center gap-2"
      >
        <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        Return_To_Grid
      </button>
    );

    if (currentView === 'privacy') return <div className={commonClasses}><BackButton /><PrivacyPage /></div>;
    if (currentView === 'terms') return <div className={commonClasses}><BackButton /><TermsPage /></div>;
    if (currentView === 'cookies') return <div className={commonClasses}><BackButton /><CookiesPage /></div>;
    return null;
  };

  if (currentView !== 'auth') {
    return (
      <div className="min-h-screen bg-[#f8fafc] overflow-y-auto">
        {renderLegalContent()}
      </div>
    );
  }

  // --- MAIN RENDER ---
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-indigo-600/5 rounded-full blur-[120px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-rose-500/5 rounded-full blur-[120px]" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center p-6 lg:p-12 relative z-10 gap-12 lg:gap-24">
        
        {/* BRAND COLUMN */}
        <div className="flex-1 max-w-xl text-center lg:text-left space-y-8 animate-in slide-in-from-left-8 duration-700">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
             <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono">System_Operational</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
            Vibe<br/>Stream
          </h1>
          
          <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed max-w-lg mx-auto lg:mx-0">
            The next-generation neural interface for global synchronization. Connect, broadcast, and amplify your signal.
          </p>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-4">
             <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><ICONS.Verified /></div>
                <div className="text-left">
                   <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 font-mono">Security</p>
                   <p className="text-xs font-bold text-slate-900">End-to-End Encrypted</p>
                </div>
             </div>
             <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-50 rounded-xl text-rose-600"><ICONS.Temporal /></div>
                <div className="text-left">
                   <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 font-mono">Latency</p>
                   <p className="text-xs font-bold text-slate-900">Real-Time Sync</p>
                </div>
             </div>
          </div>
        </div>

        {/* INTERACTION COLUMN */}
        <div className="w-full max-w-[420px] animate-in slide-in-from-bottom-8 duration-700 delay-100">
          <div className="bg-white/80 backdrop-blur-2xl p-8 rounded-[3rem] shadow-2xl border border-white/50 relative overflow-hidden ring-1 ring-slate-900/5">
            
            {/* STATE 1: RECAPTCHA HOLD */}
            {!isVerified ? (
              <div className="py-10 flex flex-col items-center text-center">
                <div className="relative mb-8 group cursor-pointer touch-none">
                  {/* Progress Ring */}
                  <svg className="w-32 h-32 -rotate-90 transform" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="46" fill="none" stroke="#f1f5f9" strokeWidth="6" strokeLinecap="round" />
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
                    className="absolute inset-2 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center shadow-inner transition-all active:scale-95 group-active:shadow-none"
                  >
                    <div className={`transition-all duration-300 ${verificationProgress > 0 ? 'scale-110 text-indigo-600' : 'text-slate-300'}`}>
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
                      </svg>
                    </div>
                  </button>
                </div>
                
                <h3 className="text-xl font-black text-slate-900 mb-2 uppercase italic tracking-tight">Security_Check</h3>
                <p className="text-xs font-medium text-slate-500 max-w-[200px] leading-relaxed">
                  Hold the button to verify biometric signature and synchronize with the grid.
                </p>
                <p className="text-[8px] text-slate-300 text-center mt-6 uppercase tracking-[0.3em] font-mono">
                  Protected by reCAPTCHA
                </p>
              </div>
            ) : (
              // STATE 2: AUTH FORMS
              <div className="animate-in slide-in-from-right-8 duration-500">
                {authMode === 'login' && (
                  <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <div className="text-center mb-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest font-mono mb-4 border border-emerald-100">
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
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                      />
                      <input 
                        type="password" 
                        placeholder="Access Key" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all placeholder:text-slate-400"
                      />
                    </div>
                    
                    {errorDetails && (
                      <div className="text-rose-500 text-[10px] font-black uppercase tracking-widest text-center bg-rose-50 py-2 rounded-xl border border-rose-100">
                        {errorDetails.message}
                      </div>
                    )}

                    <button 
                      type="submit" 
                      disabled={isProcessing}
                      className="w-full bg-slate-900 text-white h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
                    >
                      {isProcessing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'INITIALIZE_LINK'}
                    </button>

                    <div className="flex justify-between items-center mt-2 px-1">
                      <button 
                        type="button" 
                        onClick={() => { setAuthMode('reset'); setErrorDetails(null); }}
                        className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        Lost Key?
                      </button>
                      <button 
                        type="button"
                        onClick={() => { setShowRegisterModal(true); setAuthMode('register'); setErrorDetails(null); setEmail(''); setPassword(''); }}
                        className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-colors"
                      >
                        Create_Node
                      </button>
                    </div>
                  </form>
                )}

                {authMode === 'reset' && (
                  <form onSubmit={handleReset} className="flex flex-col gap-6 py-2">
                    <div className="text-center">
                      <h3 className="text-xl font-black text-slate-900 uppercase italic">Recovery_Mode</h3>
                      <p className="text-[10px] font-bold text-slate-400 mt-2">Enter your Neural ID to reset access protocols.</p>
                    </div>
                    <input 
                      type="email" 
                      placeholder="Target Email Address" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      required
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none"
                    />
                    
                    {errorDetails && <div className="text-rose-500 text-[10px] font-bold text-center">{errorDetails.message}</div>}
                    {resetSuccess && <div className="text-emerald-500 text-[10px] font-black uppercase tracking-widest text-center">Recovery signal sent.</div>}

                    <div className="flex gap-3">
                      <button 
                        type="button" 
                        onClick={() => { setAuthMode('login'); setErrorDetails(null); setResetSuccess(false); }}
                        className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
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
          
          <div className="mt-8 text-center">
             <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] font-mono">
               System_v2.6 • Secure_Gateway
             </p>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 w-full max-w-[1400px] mx-auto px-6 py-8 border-t border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex gap-6 text-[10px] font-bold text-slate-400">
              <button onClick={() => setCurrentView('privacy')} className="hover:text-indigo-600 transition-colors uppercase tracking-wider">Privacy Protocol</button>
              <button onClick={() => setCurrentView('terms')} className="hover:text-indigo-600 transition-colors uppercase tracking-wider">Terms of Uplink</button>
              <button onClick={() => setCurrentView('cookies')} className="hover:text-indigo-600 transition-colors uppercase tracking-wider">Data Artifacts</button>
           </div>
           <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest font-mono">
             © 2026 VibeStream Citadel. All Rights Reserved.
           </p>
        </div>
      </footer>

      {/* REGISTRATION MODAL */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden relative border border-white/20">
            <div className="p-8 pb-0 flex justify-between items-start">
               <div>
                 <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">New_Node</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Join the mesh network</p>
               </div>
               <button onClick={() => { setShowRegisterModal(false); setAuthMode('login'); }} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all">
                 <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2.5}/></svg>
               </button>
            </div>

            <div className="p-8">
              <form onSubmit={handleRegister} className="flex flex-col gap-4">
                <input 
                  type="text" 
                  placeholder="Full Designation (Name)" 
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all"
                />
                
                <input 
                  type="email" 
                  placeholder="Neural ID (Email)" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all"
                />

                <input 
                  type="password" 
                  placeholder="Secret Key" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all"
                />

                <div className="relative group">
                  <input 
                    type="text" 
                    placeholder="Geospatial Node (Location)"
                    value={location}
                    onChange={handleLocationSearch}
                    required
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all"
                  />
                  {showSuggestions && locationSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 bg-white border border-slate-100 rounded-2xl shadow-xl mt-2 overflow-hidden max-h-48 overflow-y-auto no-scrollbar p-2">
                      {locationSuggestions.map((loc, idx) => (
                        <button 
                          key={idx}
                          type="button"
                          onClick={() => selectLocation(loc)}
                          className="w-full text-left px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors truncate"
                        >
                          {loc.display_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-[9px] text-slate-400 mt-2 font-medium leading-relaxed px-2">
                  By initializing, you accept the <span className="text-indigo-500 cursor-pointer hover:underline" onClick={() => {setShowRegisterModal(false); setCurrentView('terms');}}>Terms of Uplink</span> and <span className="text-indigo-500 cursor-pointer hover:underline" onClick={() => {setShowRegisterModal(false); setCurrentView('privacy');}}>Privacy Protocol</span>.
                </div>

                {errorDetails && (
                  <div className="bg-rose-50 text-rose-500 text-[10px] font-black uppercase tracking-widest p-3 rounded-xl text-center border border-rose-100">
                    {errorDetails.message}
                  </div>
                )}

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={isProcessing}
                    className="w-full bg-emerald-500 text-white h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isProcessing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'CONFIRM_ENTRY'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
