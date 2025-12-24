
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
const { doc, setDoc, serverTimestamp, collection, query, limit, getDocs } = Firestore as any;
import { SystemSettings } from '../../types';

interface LandingPageProps {
  onEnter: () => void;
  systemSettings: SystemSettings;
}

type AuthMode = 'login' | 'register' | 'reset';

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter, systemSettings }) => {
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
      }, 500); // 500ms debounce
    } else {
      setLocationSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectLocation = (loc: any) => {
    // Construct a cleaner address if possible, otherwise use display_name
    let preciseLoc = loc.display_name;
    // Attempt to shorten if it's extremely long, but keep key parts
    // e.g. "Park Street, St Albans, Hertfordshire, East of England, England, AL2 2PX, United Kingdom"
    // We ideally want "Park Street, St Albans, UK"
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
      setErrorDetails({ code: 'REG_DISABLED', message: 'Registration is currently disabled.' });
      return;
    }

    // STRICT FIELD VALIDATION
    if (!fullName.trim()) {
      setErrorDetails({ code: 'NO_NAME', message: 'Please enter your full name.' });
      return;
    }

    if (!email.trim()) {
      setErrorDetails({ code: 'NO_EMAIL', message: 'Please enter a valid email address.' });
      return;
    }

    if (!password.trim()) {
      setErrorDetails({ code: 'NO_PASSWORD', message: 'Please create a password.' });
      return;
    }

    if (!location.trim()) {
      setErrorDetails({ code: 'NO_LOC', message: 'Please enter your location.' });
      return;
    }

    setIsProcessing(true);
    setErrorDetails(null);

    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update Auth Profile immediately
      await updateProfile(user, { displayName: fullName });

      // 2. Determine Role (First user gets Admin)
      let assignedRole = 'member';
      let trustTier = 'Gamma';
      let badges = ['New Arrival'];
      let bio = 'Just joined the grid.';
      let verified = false;

      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, limit(1));
        const snapshot = await getDocs(q);
        
        // If snapshot is empty, this is the first user document being created -> ADMIN
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

      // 3. Create Profile Document
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
        location: location, // Use precise location
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

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col items-center justify-center py-10 px-4 md:px-0 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      <div className="w-full max-w-[980px] flex flex-col md:flex-row items-center md:items-start justify-between gap-10 md:gap-0">
        
        {/* LEFT COLUMN: BRANDING */}
        <div className="flex-1 text-center md:text-left pt-8 md:pr-8">
          <h1 className="text-indigo-600 text-5xl md:text-6xl font-black tracking-tighter mb-4">
            VibeStream
          </h1>
          <h2 className="text-2xl md:text-[28px] leading-8 text-[#1c1e21] font-medium max-w-lg mx-auto md:mx-0">
            Connect with friends and the world around you on VibeStream.
          </h2>
        </div>

        {/* RIGHT COLUMN: INTERACTION CARD */}
        <div className="w-full max-w-[396px]">
          <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200/60 transition-all duration-500 overflow-hidden relative">
            
            {/* STATE 1: HOLD TO SYNC (BOT PROTECTION) */}
            {!isVerified ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 animate-in fade-in duration-500">
                <div className="relative mb-8 group cursor-pointer">
                  {/* Progress Ring */}
                  <svg className="w-32 h-32 -rotate-90 transform" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="46" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                    <circle 
                      cx="50" cy="50" r="46" fill="none" 
                      stroke="#4f46e5" 
                      strokeWidth="4"
                      strokeDasharray="289.02" 
                      strokeDashoffset={289.02 - (289.02 * verificationProgress) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-75 ease-linear"
                    />
                  </svg>
                  
                  {/* Touch Button */}
                  <button 
                    onMouseDown={handleHoldStart} 
                    onMouseUp={handleHoldEnd} 
                    onMouseLeave={handleHoldEnd}
                    onTouchStart={handleHoldStart} 
                    onTouchEnd={handleHoldEnd}
                    className="absolute inset-2 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center shadow-inner transition-colors active:scale-95"
                  >
                    <div className={`transition-all duration-300 ${verificationProgress > 0 ? 'scale-110 text-indigo-600' : 'text-slate-400'}`}>
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
                      </svg>
                    </div>
                  </button>
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 mb-2 text-center">Security Check</h3>
                <p className="text-sm text-slate-500 text-center leading-relaxed">
                  Please hold the button above to verify your human identity and synchronize with the grid.
                </p>
                <p className="text-[9px] text-slate-400 text-center mt-4 uppercase tracking-widest font-mono">
                  Protected by reCAPTCHA
                </p>
              </div>
            ) : (
              // STATE 2: AUTH FORMS (LOGIN/REGISTER)
              <div className="animate-in slide-in-from-right-8 duration-500">
                {authMode === 'login' && (
                  <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
                    <div className="text-center mb-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>
                        Identity Verified
                      </div>
                    </div>
                    <input 
                      type="email" 
                      placeholder="Email or Network ID" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      required
                      className="w-full px-4 py-3.5 text-[17px] border border-slate-300 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-500"
                    />
                    <input 
                      type="password" 
                      placeholder="Password" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      required
                      className="w-full px-4 py-3.5 text-[17px] border border-slate-300 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-500"
                    />
                    
                    {errorDetails && (
                      <div className="text-rose-600 text-[13px] text-left font-medium px-1 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                        {errorDetails.message}
                      </div>
                    )}

                    <button 
                      type="submit" 
                      disabled={isProcessing}
                      className="w-full bg-[#1877f2] hover:bg-[#166fe5] text-white text-[20px] font-bold py-2.5 rounded-md transition-colors shadow-sm disabled:opacity-50 mt-1"
                    >
                      {isProcessing ? 'Logging in...' : 'Log In'}
                    </button>

                    <div className="text-center mt-1">
                      <button 
                        type="button" 
                        onClick={() => { setAuthMode('reset'); setErrorDetails(null); }}
                        className="text-[#1877f2] text-[14px] hover:underline font-medium"
                      >
                        Forgotten password?
                      </button>
                    </div>

                    <div className="border-b border-slate-300 my-2"></div>

                    <div className="text-center">
                      <button 
                        type="button"
                        onClick={() => { setShowRegisterModal(true); setAuthMode('register'); setErrorDetails(null); setEmail(''); setPassword(''); }}
                        className="bg-[#42b72a] hover:bg-[#36a420] text-white text-[17px] font-bold px-8 py-3 rounded-md transition-colors shadow-sm"
                      >
                        Create new account
                      </button>
                    </div>

                    <div className="mt-4 text-[10px] text-slate-400 text-center leading-tight">
                      This site is protected by reCAPTCHA and the Google
                      <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline mx-1">Privacy Policy</a>
                      and
                      <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline mx-1">Terms of Service</a>
                      apply.
                    </div>
                  </form>
                )}

                {authMode === 'reset' && (
                  <form onSubmit={handleReset} className="flex flex-col gap-4 py-2">
                    <div className="text-center mb-2">
                      <h3 className="text-xl font-bold text-slate-800">Find Your Account</h3>
                      <p className="text-slate-600 text-sm mt-1">Please enter your email to search for your account.</p>
                    </div>
                    <input 
                      type="email" 
                      placeholder="Email address" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      required
                      className="w-full px-4 py-3 text-[17px] border border-slate-300 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                    
                    {errorDetails && <div className="text-rose-600 text-sm text-center">{errorDetails.message}</div>}
                    {resetSuccess && <div className="text-emerald-600 text-sm text-center font-medium">Reset link sent to your email.</div>}

                    <div className="flex gap-3 mt-2 border-t border-slate-200 pt-4 justify-end">
                      <button 
                        type="button" 
                        onClick={() => { setAuthMode('login'); setErrorDetails(null); setResetSuccess(false); }}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-2 rounded-md transition-colors text-sm"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={isProcessing}
                        className="bg-[#1877f2] hover:bg-[#166fe5] text-white font-bold px-6 py-2 rounded-md transition-colors text-sm disabled:opacity-50"
                      >
                        Search
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
          
          {authMode === 'login' && isVerified && (
            <div className="mt-7 text-center">
              <p className="text-[14px] text-slate-800">
                <span className="font-bold">Create a Page</span> for a celebrity, brand or business.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* REGISTRATION MODAL */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-[432px] overflow-hidden relative">
            
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-slate-300 flex justify-between items-start bg-slate-50">
              <div>
                <h3 className="text-[32px] font-bold text-[#1c1e21] leading-none">Sign Up</h3>
                <p className="text-[15px] text-[#606770] mt-1">It's quick and easy.</p>
              </div>
              <button onClick={() => { setShowRegisterModal(false); setAuthMode('login'); }} className="text-slate-500 hover:text-slate-800">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4">
              <form onSubmit={handleRegister} className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    placeholder="Full name" 
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                    className="flex-1 bg-[#f5f6f7] border border-[#ccd0d5] rounded-[5px] p-[11px] text-[15px] placeholder-[#8d949e] focus:border-indigo-500 outline-none"
                  />
                </div>
                
                <input 
                  type="email" 
                  placeholder="Email address" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full bg-[#f5f6f7] border border-[#ccd0d5] rounded-[5px] p-[11px] text-[15px] placeholder-[#8d949e] focus:border-indigo-500 outline-none"
                />

                <input 
                  type="password" 
                  placeholder="New password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#f5f6f7] border border-[#ccd0d5] rounded-[5px] p-[11px] text-[15px] placeholder-[#8d949e] focus:border-indigo-500 outline-none"
                />

                {/* Location Input with Autocomplete */}
                <div className="relative group">
                  <input 
                    type="text" 
                    placeholder="City / Location (e.g. Park Street)"
                    value={location}
                    onChange={handleLocationSearch}
                    required
                    className="w-full bg-[#f5f6f7] border border-[#ccd0d5] rounded-[5px] p-[11px] text-[15px] placeholder-[#8d949e] focus:border-indigo-500 outline-none"
                  />
                  {showSuggestions && locationSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 bg-white border border-slate-200 rounded-b-md shadow-lg max-h-48 overflow-y-auto no-scrollbar">
                      {locationSuggestions.map((loc, idx) => (
                        <button 
                          key={idx}
                          type="button"
                          onClick={() => selectLocation(loc)}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 border-b border-slate-50 last:border-0 truncate"
                        >
                          {loc.display_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-[#777] mt-2 mb-2 leading-snug">
                  By clicking Sign Up, you agree to our <a href="#" className="text-[#385898] hover:underline">Terms</a>, <a href="#" className="text-[#385898] hover:underline">Privacy Policy</a> and <a href="#" className="text-[#385898] hover:underline">Cookies Policy</a>.
                  <br/><br/>
                  This site is protected by reCAPTCHA and the Google <a href="https://policies.google.com/privacy" target="_blank" className="text-[#385898] hover:underline">Privacy Policy</a> and <a href="https://policies.google.com/terms" target="_blank" className="text-[#385898] hover:underline">Terms of Service</a> apply.
                </div>

                {errorDetails && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm p-2 rounded mb-2 text-center font-medium">
                    {errorDetails.message}
                  </div>
                )}

                <div className="text-center">
                  <button 
                    type="submit" 
                    disabled={isProcessing}
                    className="bg-[#00a400] hover:bg-[#008900] text-white text-[18px] font-bold px-10 py-2 rounded-md shadow-sm min-w-[194px] disabled:opacity-50"
                  >
                    {isProcessing ? 'Signing Up...' : 'Sign Up'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="mt-auto pt-8 pb-4 w-full max-w-[980px] text-[#737373] text-[12px] px-4 md:px-0">
        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
          <span>English (UK)</span>
          <span className="hover:underline cursor-pointer">Español</span>
          <span className="hover:underline cursor-pointer">Français (France)</span>
          <span className="hover:underline cursor-pointer">Deutsch</span>
        </div>
        <div className="border-t border-[#ddd] pt-2 flex flex-wrap gap-x-4 gap-y-1">
          <span className="hover:underline cursor-pointer">Privacy Policy</span>
          <span className="hover:underline cursor-pointer">Terms of Service</span>
          <span className="hover:underline cursor-pointer">Cookies Policy</span>
        </div>
        <div className="mt-4">
          VibeStream © 2026
        </div>
      </footer>

    </div>
  );
};
