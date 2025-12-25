
import React, { useState, useEffect } from 'react';
import * as FirebaseAuth from 'firebase/auth';
const { onAuthStateChanged, signOut } = FirebaseAuth as any;
import { 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  orderBy, 
  limit, 
  where, 
  writeBatch, 
  serverTimestamp, 
  arrayRemove, 
  arrayUnion, 
  getDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  increment,
  setDoc,
  getDocs
} from 'firebase/firestore'; 
import { auth, db } from './services/firebase';
import { 
  User, 
  AppRoute, 
  AppNotification, 
  Post, 
  Gathering, 
  ToastMessage, 
  WeatherInfo, 
  LiveStream, 
  CallSession,
  SystemSettings
} from './types';

// Components
import { LandingPage } from './components/landing/LandingPage';
import { Layout } from './components/layout/Layout';
import { FeedPage } from './components/feed/FeedPage';
import { ExplorePage } from './components/explore/ExplorePage';
import { MessagesPage } from './components/messages/MessagesPage';
import { NotificationsPage } from './components/notifications/NotificationsPage';
import { ProfilePage } from './components/profile/ProfilePage';
import { AdminPanel } from './components/admin/AdminPanel';
import { PrivacyPage } from './components/legal/PrivacyPage';
import { TermsPage } from './components/legal/TermsPage';
import { CookiesPage } from './components/legal/CookiesPage';
import { MeshPage } from './components/mesh/MeshPage';
import { ClustersPage } from './components/clusters/ClustersPage';
import { StreamGridPage } from './components/streams/StreamGridPage';
import { TemporalPage } from './components/temporal/TemporalPage';
import { DataVaultPage } from './components/vault/DataVaultPage';
import { VerifiedNodesPage } from './components/explore/VerifiedNodesPage';
import { GatheringsPage } from './components/gatherings/GatheringsPage';
import { SingleGatheringView } from './components/gatherings/SingleGatheringView';
import { SinglePostView } from './components/feed/SinglePostView';
import { Toast } from './components/ui/Toast';
import { LiveBroadcastOverlay } from './components/streams/LiveBroadcastOverlay';
import { LiveWatcherOverlay } from './components/streams/LiveWatcherOverlay';
import { NeuralLinkOverlay } from './components/messages/NeuralLinkOverlay';
import { SimulationsPage } from './components/simulations/SimulationsPage';
import { ResiliencePage } from './components/resilience/ResiliencePage';
import { SettingsOverlay } from './components/settings/SettingsOverlay';
import { SupportPage } from './components/support/SupportPage';

// Services
import { fetchWeather } from './services/weather';

/**
 * SCREEN 1: SYSTEM LOCKDOWN (Dark, Urgent, Professional)
 */
const MaintenanceScreen = () => (
  <div className="fixed inset-0 z-[9999] bg-[#030712] flex flex-col items-center justify-center overflow-hidden font-sans selection:bg-rose-500 selection:text-white">
    
    {/* Atmospheric Glow */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-rose-600/10 blur-[150px] rounded-full pointer-events-none animate-pulse" />
    
    {/* Scanline Texture */}
    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[1] bg-[length:100%_2px,3px_100%] pointer-events-none" />

    <div className="relative z-10 flex flex-col items-center text-center p-8 w-full max-w-6xl">
      
      {/* Icon Container */}
      <div className="relative mb-12 group">
        <div className="absolute inset-0 bg-rose-500/30 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-1000 opacity-60 animate-ping" />
        <div className="relative w-28 h-28 bg-[#0f172a] rounded-full border border-rose-500/40 flex items-center justify-center shadow-[0_0_50px_-10px_rgba(225,29,72,0.5)]">
           <svg className="w-12 h-12 text-rose-500 drop-shadow-[0_0_15px_rgba(225,29,72,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
             <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.34c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
           </svg>
        </div>
      </div>

      {/* Heavy Industrial Typography */}
      <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white italic tracking-tighter leading-none mb-8 drop-shadow-2xl select-none mix-blend-screen">
        SYSTEM<span className="text-rose-600 inline-block px-2">_</span>LOCKDOWN
      </h1>
      
      {/* Status Indicators */}
      <div className="flex flex-col items-center gap-6 mb-20">
         <div className="flex items-center gap-4 px-6 py-2 bg-rose-950/30 border border-rose-500/20 rounded-full backdrop-blur-md">
            <div className="flex gap-2">
              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
            </div>
            <p className="text-[10px] md:text-xs font-black text-rose-400 uppercase tracking-[0.3em] font-mono">
              MAINTENANCE PROTOCOLS ACTIVE
            </p>
         </div>
      </div>

      {/* Footer - Tech Info */}
      <div className="absolute bottom-12 left-0 right-0 text-center space-y-2 opacity-60">
         <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.6em] font-mono">
           AUTHORIZED_PERSONNEL_ONLY
         </p>
         <p className="text-[8px] font-mono text-slate-700 uppercase tracking-widest">
           ERR_CODE: 0x99_GRID_HALT
         </p>
      </div>
    </div>
  </div>
);

/**
 * SCREEN 2: FEATURE DISABLED (Light, Clinical, Specific)
 */
const FeatureDisabledScreen = ({ featureName }: { featureName: string }) => (
  <div className="flex flex-col items-center justify-center w-full min-h-[70vh] p-6 animate-in zoom-in-95 duration-700 relative overflow-hidden rounded-[3.5rem] bg-[#FFFCF5] dark:bg-slate-900 border dark:border-slate-800">
    
    {/* Soft Light Leak */}
    <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-500/5 rounded-full blur-[100px]" />
    <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-rose-500/5 rounded-full blur-[100px]" />

    <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto">
      
      {/* Central Icon Cluster */}
      <div className="relative mb-10 group">
        <div className="absolute inset-0 bg-rose-500/10 rounded-[2.5rem] blur-2xl group-hover:blur-3xl transition-all duration-700 scale-110" />
        
        {/* Main Card */}
        <div className="relative w-32 h-32 bg-white dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 dark:border-slate-700">
           <svg className="w-12 h-12 text-slate-300 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
             <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
           </svg>
           
           {/* Floating Badge */}
           <div className="absolute -bottom-4 bg-rose-500 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border-[3px] border-[#FFFCF5] dark:border-slate-900 shadow-lg flex items-center gap-1.5 animate-in slide-in-from-top-2">
             <div className="w-1.5 h-1.5 bg-white rounded-full" />
             LOCKED
           </div>
        </div>
      </div>

      {/* Typography */}
      <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-6 leading-none">
        ACCESS<span className="text-slate-300 dark:text-slate-700">_</span>DENIED
      </h2>
      
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 px-8 py-6 rounded-[2rem] shadow-sm mb-10 max-w-lg">
        <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
          The <span className="text-slate-900 dark:text-white font-black bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-600 uppercase mx-1 tracking-wider">{featureName}</span> protocol has been strategically disabled by grid administration. Access to this sector is currently restricted.
        </p>
      </div>

      {/* System Code Pill */}
      <div className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-700 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)]">
         <span className="text-[8px] font-black text-slate-300 dark:text-slate-500 uppercase tracking-[0.25em] font-mono">SYSTEM_CODE:</span>
         <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest font-mono">503_SERVICE_UNAVAILABLE</span>
      </div>

    </div>
  </div>
);

/**
 * SCREEN 3: ACCOUNT SUSPENDED (Severe, Red, Final)
 */
const SuspendedScreen = ({ onLogout, userData }: { onLogout: () => void, userData: User | null }) => {
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSubmitAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealReason.trim() || !userData) return;
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'support_tickets'), {
        userId: userData.id,
        userName: userData.displayName,
        userEmail: userData.email || 'N/A',
        subject: 'URGENT: Suspension Appeal',
        description: appealReason,
        category: 'appeal',
        status: 'open',
        priority: 'high',
        createdAt: serverTimestamp()
      });
      setHasSubmitted(true);
      setTimeout(() => {
        setShowAppealModal(false);
        setAppealReason('');
      }, 2500);
    } catch (err) {
      console.error("Appeal failed:", err);
      // Fallback for user feedback
      alert("Submission Error: Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#050101] flex flex-col items-center justify-center overflow-hidden font-sans selection:bg-rose-500 selection:text-white">
      
      {/* Ambient Red Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(220,38,38,0.15),transparent_70%)] animate-pulse-slow" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />

      <div className="relative z-10 flex flex-col items-center text-center p-8 max-w-2xl w-full">
        
        {/* Icon */}
        <div className="w-32 h-32 bg-rose-500/10 rounded-full flex items-center justify-center mb-10 border border-rose-500/30 shadow-[0_0_60px_-20px_rgba(244,63,94,0.6)]">
          <svg className="w-12 h-12 text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter italic mb-6 leading-none">
          Node<span className="text-rose-600">_</span>Suspended
        </h1>
        
        <div className="px-6 py-2 bg-rose-950/50 border border-rose-500/30 rounded-lg mb-8">
          <p className="text-xs font-bold text-rose-400 font-mono uppercase tracking-[0.2em]">Access_Protocol: DENIED</p>
        </div>

        <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed max-w-md mb-12">
          Your connection to the grid has been terminated due to a violation of the VibeStream Core Protocols. This suspension is effective immediately.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm relative z-20">
          <button 
            onClick={onLogout}
            className="flex-1 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-200 transition-all active:scale-95 shadow-xl"
          >
            Terminate_Session
          </button>
          <button 
            onClick={() => setShowAppealModal(true)}
            className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-700 transition-all active:scale-95 shadow-xl shadow-rose-900/50 flex items-center justify-center"
          >
            File_Appeal
          </button>
        </div>

        {/* Updated Spacing for ERR_CODE to prevent overlap */}
        <p className="mt-16 text-[9px] font-black text-rose-900/60 uppercase tracking-[0.5em] font-mono select-none">
          ERR_CODE: USER_BAN_0X99
        </p>
      </div>

      {/* APPEAL MODAL */}
      {showAppealModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className="relative bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl border border-rose-900/50 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
              
              {/* Header */}
              <div className="mb-6 flex justify-between items-start">
                 <div>
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Submit_Appeal</h3>
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] font-mono mt-1">Official Legal Protocol</p>
                 </div>
                 <button onClick={() => setShowAppealModal(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>

              {hasSubmitted ? (
                 <div className="py-12 flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-500/20 mb-2">
                       <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h4 className="text-xl font-black text-white uppercase italic">Appeal_Received</h4>
                    <p className="text-xs text-slate-400 max-w-xs">Your case has been logged in the Citadel docket. An admin will review your node history shortly.</p>
                 </div>
              ) : (
                 <form onSubmit={handleSubmitAppeal} className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono ml-2">Defense_Statement</label>
                       <textarea 
                         value={appealReason}
                         onChange={(e) => setAppealReason(e.target.value)}
                         placeholder="Explain why this suspension should be lifted..."
                         className="w-full bg-black/40 border border-slate-700 rounded-2xl p-4 text-sm font-medium text-white placeholder:text-slate-600 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50 outline-none resize-none h-40 transition-all"
                       />
                    </div>
                    
                    <button 
                      type="submit"
                      disabled={!appealReason.trim() || isSubmitting}
                      className="w-full py-5 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isSubmitting ? 'TRANSMITTING...' : 'SUBMIT_TO_COUNCIL'}
                    </button>
                 </form>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<User | null>(null);
  
  // Route Persistence Logic
  const [activeRoute, setActiveRoute] = useState<AppRoute>(() => {
    try {
      const saved = localStorage.getItem('vibestream_active_route') as AppRoute;
      if (saved === AppRoute.SINGLE_POST || saved === AppRoute.SINGLE_GATHERING || saved === AppRoute.PUBLIC_PROFILE) {
        return AppRoute.FEED;
      }
      return saved || AppRoute.FEED;
    } catch {
      return AppRoute.FEED;
    }
  });

  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    registrationDisabled: false,
    minTrustTier: 'Gamma',
    lastUpdatedBy: 'SYSTEM',
    updatedAt: new Date().toISOString(),
    featureFlags: {}
  });

  // Global Data
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [globalPosts, setGlobalPosts] = useState<Post[]>([]);
  
  // Block Logic - Split for 2-way blocking
  const [myBlockedIds, setMyBlockedIds] = useState<Set<string>>(new Set());
  const [blockedByIds, setBlockedByIds] = useState<Set<string>>(new Set());
  
  // Selection States
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedGathering, setSelectedGathering] = useState<Gathering | null>(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState<User | null>(null);
  
  // Streaming & Calling
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null);
  const [watchingStream, setWatchingStream] = useState<LiveStream | null>(null);
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);

  // RSVP Processing Lock
  const [rsvpProcessing, setRsvpProcessing] = useState<Set<string>>(new Set());

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Derived unified block set
  const blockedIds = new Set([...myBlockedIds, ...blockedByIds]);

  // Save Route Changes
  useEffect(() => {
    if (activeRoute !== AppRoute.SINGLE_POST && activeRoute !== AppRoute.SINGLE_GATHERING && activeRoute !== AppRoute.PUBLIC_PROFILE) {
      localStorage.setItem('vibestream_active_route', activeRoute);
    }
  }, [activeRoute]);

  // --- APPEARANCE & SETTINGS EFFECT ---
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (theme: 'system' | 'light' | 'dark', reducedMotion = false, highContrast = false) => {
      root.classList.remove('dark');
      
      let isDark = false;
      if (theme === 'system') {
         isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else if (theme === 'dark') {
         isDark = true;
      }

      if (isDark) root.classList.add('dark');

      if (reducedMotion) root.classList.add('reduced-motion');
      else root.classList.remove('reduced-motion');

      if (highContrast) root.classList.add('high-contrast');
      else root.classList.remove('high-contrast');
    };

    if (userData?.settings?.appearance) {
      const { theme, reducedMotion, highContrast } = userData.settings.appearance;
      applyTheme(theme, reducedMotion, highContrast);

      let cleanupListener = () => {};
      if (theme === 'system') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => applyTheme('system', reducedMotion, highContrast);
        mediaQuery.addEventListener('change', handler);
        cleanupListener = () => mediaQuery.removeEventListener('change', handler);
      }
      return () => cleanupListener();
    } else {
      applyTheme('system');
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme('system');
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [userData?.settings?.appearance]);

  // --- AUTH & USER SYNC ---
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
        setLoading((current) => {
            if (current) {
                console.warn("VibeStream Protocol: Auth handshake timed out. Forcing entry.");
                return false;
            }
            return current;
        });
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (authUser: any) => {
      clearTimeout(safetyTimer);
      
      if (authUser) {
        setUser(authUser);
        const userRef = doc(db, 'users', authUser.uid);
        const unsubUser = onSnapshot(userRef, (docSnap: any) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as User;
            setUserData({ ...data, id: docSnap.id });
            if (data.location) {
              fetchWeather({ query: data.location })
                .then(setWeather)
                .catch(err => console.warn("Atmospheric sync deferred:", err));
            }
            setLoading(false); 
          } else {
            console.warn("Profile not found in Grid. Awaiting initialization...");
          }
        }, (error: any) => {
           console.error("Grid Sync Interrupted:", error.message);
           setLoading(false);
        });

        const notifQuery = query(
          collection(db, 'notifications'), 
          where('toUserId', '==', authUser.uid), 
          orderBy('timestamp', 'desc'), 
          limit(50)
        );
        const unsubNotif = onSnapshot(notifQuery, (snap: any) => {
          setNotifications(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as AppNotification)));
        }, (e: any) => console.debug("Notif bus silent"));

        // LISTENER 1: Who I blocked
        const blockedRef = collection(db, 'users', authUser.uid, 'blocked');
        const unsubMyBlocked = onSnapshot(blockedRef, (snap: any) => {
            const ids = new Set<string>(snap.docs.map((d: any) => d.id));
            setMyBlockedIds(ids);
        });

        // LISTENER 2: Who blocked me
        const blockedByRef = collection(db, 'users', authUser.uid, 'blockedBy');
        const unsubBlockedBy = onSnapshot(blockedByRef, (snap: any) => {
            const ids = new Set<string>(snap.docs.map((d: any) => d.id));
            setBlockedByIds(ids);
        });

        const callQuery = query(
          collection(db, 'calls'),
          where('receiverId', '==', authUser.uid),
          where('status', '==', 'ringing'),
          limit(1)
        );
        const unsubCalls = onSnapshot(callQuery, (snap: any) => {
          if (!snap.empty) {
            setActiveCall({ id: snap.docs[0].id, ...snap.docs[0].data() } as CallSession);
          }
        }, (e: any) => console.debug("Call bus silent"));

        return () => {
          unsubUser();
          unsubNotif();
          unsubCalls();
          unsubMyBlocked();
          unsubBlockedBy();
        };
      } else {
        setUser(null);
        setUserData(null);
        setMyBlockedIds(new Set());
        setBlockedByIds(new Set());
        setLoading(false);
      }
    });

    return () => {
        clearTimeout(safetyTimer);
        unsubscribe();
    }
  }, []);

  // --- GLOBAL DATA SYNC ---
  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap: any) => {
      if (docSnap.exists()) {
        setSystemSettings(prev => ({
          ...prev,
          ...docSnap.data()
        }));
      }
    });

    const unsubUsers = onSnapshot(query(collection(db, 'users'), limit(100)), (snap: any) => {
      setAllUsers(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as User)));
    });

    const unsubPosts = onSnapshot(query(collection(db, 'posts'), orderBy('timestamp', 'desc'), limit(50)), (snap: any) => {
      setGlobalPosts(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Post)));
    });

    return () => {
      unsubSettings();
      unsubUsers();
      unsubPosts();
    };
  }, []);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleLogout = async () => {
    try {
      if (userData?.id) {
        await updateDoc(doc(db, 'users', userData.id), { presenceStatus: 'Offline' });
      }
      await signOut(auth);
      setUser(null);
      setUserData(null);
      setActiveRoute(AppRoute.FEED);
      setIsSettingsOpen(false);
      localStorage.removeItem('vibestream_active_route');
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreatePost = (initialFiles?: File[]) => {
    addToast("Signal Composer Active", "info");
  };

  // --- NAVIGATION HANDLER FOR PROFILES ---
  const handleViewProfile = (user: User) => {
    setSelectedUserProfile(user);
    setActiveRoute(AppRoute.PUBLIC_PROFILE);
    window.scrollTo(0, 0);
  };

  // --- INTERACTION LOGIC ---
  const handleLike = async (postId: string, frequency: string = 'pulse') => {
    if (!user || !userData) return;
    const postRef = doc(db, 'posts', postId);
    try {
        const postSnap = await getDoc(postRef);
        if (!postSnap.exists()) return;
        const postData = postSnap.data() as Post;
        const isLiked = postData.likedBy?.includes(user.uid);
        const batch = writeBatch(db);
        if (isLiked) {
            batch.update(postRef, { likes: increment(-1), likedBy: arrayRemove(user.uid) });
        } else {
            batch.update(postRef, { likes: increment(1), likedBy: arrayUnion(user.uid) });
            if (postData.authorId !== user.uid) {
                const notifRef = doc(collection(db, 'notifications'));
                batch.set(notifRef, {
                    type: 'like',
                    pulseFrequency: frequency,
                    fromUserId: user.uid,
                    fromUserName: userData.displayName,
                    fromUserAvatar: userData.avatarUrl,
                    toUserId: postData.authorId,
                    targetId: postId,
                    text: 'pulsed your signal',
                    isRead: false,
                    timestamp: serverTimestamp()
                });
            }
        }
        await batch.commit();
        if (!isLiked) addToast("Frequency Synced", "success");
    } catch (error) {
        addToast("Pulse Failed", "error");
    }
  };

  const handleBookmark = async (postId: string) => {
    if (!user) return;
    const postRef = doc(db, 'posts', postId);
    try {
        const postSnap = await getDoc(postRef);
        if (!postSnap.exists()) return;
        const isBookmarked = postSnap.data().bookmarkedBy?.includes(user.uid);
        if (isBookmarked) {
            await updateDoc(postRef, { bookmarkedBy: arrayRemove(user.uid) });
            addToast("Removed from Data Vault", "info");
        } else {
            await updateDoc(postRef, { bookmarkedBy: arrayUnion(user.uid) });
            addToast("Secured in Data Vault", "success");
        }
    } catch (error) {
        addToast("Vault Protocol Error", "error");
    }
  };

  // --- RSVP LOGIC ---
  const handleRSVP = async (gatheringId: string, isAttendingOrWaitlisted: boolean) => {
    if (!db || !userData || rsvpProcessing.has(gatheringId)) return;
    setRsvpProcessing(prev => new Set(prev).add(gatheringId));
    try {
      const gatheringRef = doc(db, 'gatherings', gatheringId);
      const freshSnap = await getDoc(gatheringRef);
      if (!freshSnap.exists()) return;
      const currentData = freshSnap.data() as Gathering;
      const userId = userData.id;
      const isCurrentlyAttending = currentData.attendees.includes(userId);
      const isCurrentlyWaitlisted = currentData.waitlist?.includes(userId);
      const max = currentData.maxAttendees || 0;
      const currentCount = currentData.attendees.length;
      const batch = writeBatch(db);
      let successMessage = "";
      let successType: 'success' | 'info' = 'info';

      if (isAttendingOrWaitlisted) {
        if (isCurrentlyAttending) {
            batch.update(gatheringRef, { attendees: arrayRemove(userId) });
            if (currentData.waitlist && currentData.waitlist.length > 0) {
                const nextUserId = currentData.waitlist[0];
                batch.update(gatheringRef, { waitlist: arrayRemove(nextUserId), attendees: arrayUnion(nextUserId) });
                const notifRef = doc(collection(db, 'notifications'));
                batch.set(notifRef, {
                    type: 'gathering_promote',
                    fromUserId: 'SYSTEM',
                    fromUserName: 'VibeStream Protocol',
                    fromUserAvatar: '',
                    toUserId: nextUserId,
                    targetId: gatheringId,
                    text: `You have been promoted from the waitlist for "${currentData.title}"`,
                    isRead: false,
                    timestamp: serverTimestamp(),
                    pulseFrequency: 'velocity'
                });
            }
            if (currentData.linkedChatId) {
                batch.update(doc(db, 'chats', currentData.linkedChatId), { participants: arrayRemove(userId) });
            }
            successMessage = "Withdrawn from Gathering";
            successType = "info";
        } else if (isCurrentlyWaitlisted) {
            batch.update(gatheringRef, { waitlist: arrayRemove(userId) });
            successMessage = "Removed from Waitlist";
            successType = "info";
        }
      } else {
        if (max > 0 && currentCount >= max) {
            batch.update(gatheringRef, { waitlist: arrayUnion(userId) });
            successMessage = "Joined Waitlist";
            successType = "info";
        } else {
            batch.update(gatheringRef, { attendees: arrayUnion(userId) });
            if (currentData.linkedChatId) {
                const chatRef = doc(db, 'chats', currentData.linkedChatId);
                const participantUpdate: any = {};
                participantUpdate[`participantData.${userId}`] = { displayName: userData.displayName, avatarUrl: userData.avatarUrl };
                batch.update(chatRef, { participants: arrayUnion(userId), ...participantUpdate });
            }
            successMessage = "RSVP Confirmed";
            successType = "success";
        }
      }
      await batch.commit();
      if (successMessage) addToast(successMessage, successType);
    } catch (e) {
      addToast("RSVP Protocol Failed", "error");
    } finally {
      setRsvpProcessing(prev => { const n = new Set(prev); n.delete(gatheringId); return n; });
    }
  };

  const handleBlockUser = async (targetId: string) => {
    if (!db || !userData?.id || targetId === userData.id) return;
    try {
        const batch = writeBatch(db);
        const myId = userData.id;
        
        // 1. My View: Block them (Prevents me seeing them)
        const myBlockedRef = doc(db, 'users', myId, 'blocked', targetId);
        batch.set(myBlockedRef, { blockedAt: serverTimestamp(), blockedBy: myId });
        
        // 2. Their View: I blocked them (Prevents them seeing me)
        // Note: Rules allow this write if auth.uid matches the doc ID in the subcollection.
        // Wait, the doc ID for 'blockedBy' should be the blocker's ID (myId).
        const theirBlockedByRef = doc(db, 'users', targetId, 'blockedBy', myId);
        batch.set(theirBlockedByRef, { blockedAt: serverTimestamp(), blockerId: myId });

        // 3. Sever Connection (Unfollow both ways)
        const myFollowingRef = doc(db, 'users', myId, 'following', targetId);
        const theirFollowersRef = doc(db, 'users', targetId, 'followers', myId);
        batch.delete(myFollowingRef);
        batch.delete(theirFollowersRef);
        
        // Also remove if they follow me
        const myFollowersRef = doc(db, 'users', myId, 'followers', targetId);
        const theirFollowingRef = doc(db, 'users', targetId, 'following', myId);
        batch.delete(myFollowersRef);
        batch.delete(theirFollowingRef);

        batch.update(doc(db, 'users', myId), { following: increment(-1), followers: increment(-1) });
        batch.update(doc(db, 'users', targetId), { followers: increment(-1), following: increment(-1) });
        
        await batch.commit();
        addToast("Node Blocked. Two-Way Signal Severed.", "success");
    } catch (e) {
        console.error("Block Error:", e);
        addToast("Block Protocol Failed", "error");
    }
  };

  const handleUnblockUser = async (targetId: string) => {
    if (!db || !userData?.id) return;
    const myId = userData.id;
    try {
        const batch = writeBatch(db);
        
        // 1. Remove from my blocked list
        const myBlockedRef = doc(db, 'users', myId, 'blocked', targetId);
        batch.delete(myBlockedRef);

        // 2. Remove from their blockedBy list
        const theirBlockedByRef = doc(db, 'users', targetId, 'blockedBy', myId);
        batch.delete(theirBlockedByRef);

        await batch.commit();
        addToast("Node Unblocked. Signal Path Cleared.", "info");
    } catch (e) {
        addToast("Unblock Protocol Failed", "error");
    }
  };

  const isFeatureEnabled = (route: AppRoute) => {
    if (userData?.role === 'admin') return true;
    return systemSettings.featureFlags?.[route] !== false;
  };

  const filteredGlobalPosts = globalPosts.filter(p => !blockedIds.has(p.authorId));

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-50 dark:bg-[#020617] flex items-center justify-center transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.4em] font-mono animate-pulse">Initializing_Grid...</p>
        </div>
      </div>
    );
  }

  if (userData?.isSuspended && user) {
    return <SuspendedScreen onLogout={handleLogout} userData={userData} />;
  }

  if (systemSettings.maintenanceMode && userData?.role !== 'admin' && user) {
    return <MaintenanceScreen />;
  }

  if (!user) {
    return <LandingPage onEnter={() => {}} systemSettings={systemSettings} />;
  }

  return (
    <>
      <Layout
        activeRoute={activeRoute}
        onNavigate={setActiveRoute}
        onOpenCreate={() => handleCreatePost()}
        onLogout={handleLogout}
        userRole={userData?.role}
        userData={userData}
        notifications={notifications}
        onMarkRead={() => {
          const batch = writeBatch(db);
          notifications.filter(n => !n.isRead).forEach(n => {
            batch.update(doc(db, 'notifications', n.id), { isRead: true });
          });
          batch.commit();
        }}
        onDeleteNotification={(id) => deleteDoc(doc(db, 'notifications', id))}
        currentRegion="en-GB"
        onRegionChange={() => {}}
        onSearch={() => {}}
        weather={weather}
        systemSettings={systemSettings}
        onOpenSettings={() => setIsSettingsOpen(true)}
      >
        {activeRoute === AppRoute.FEED && (
          isFeatureEnabled(AppRoute.FEED) ? (
            <FeedPage 
              posts={filteredGlobalPosts} 
              userData={userData}
              locale="en-GB"
              onLike={handleLike}
              onBookmark={handleBookmark}
              onViewPost={(post) => { setSelectedPost(post); setActiveRoute(AppRoute.SINGLE_POST); }}
              onOpenCreate={() => handleCreatePost()}
              onTransmitStory={() => {}}
              onGoLive={() => { setActiveStreamId(`stream_${user.uid}`); }}
              onJoinStream={(stream) => setWatchingStream(stream)}
            />
          ) : <FeatureDisabledScreen featureName="FEED" />
        )}

        {activeRoute === AppRoute.EXPLORE && (
          isFeatureEnabled(AppRoute.EXPLORE) ? (
            <ExplorePage 
              posts={filteredGlobalPosts}
              users={allUsers.filter(u => !blockedIds.has(u.id))}
              onLike={handleLike}
              onBookmark={handleBookmark}
              onViewPost={(post) => { setSelectedPost(post); setActiveRoute(AppRoute.SINGLE_POST); }}
              onViewProfile={handleViewProfile}
              locale="en-GB"
            />
          ) : <FeatureDisabledScreen featureName="EXPLORE" />
        )}

        {activeRoute === AppRoute.MESSAGES && userData && (
          isFeatureEnabled(AppRoute.MESSAGES) ? (
            <MessagesPage 
              currentUser={userData}
              locale="en-GB"
              addToast={addToast}
              weather={weather}
              allUsers={allUsers.filter(u => !blockedIds.has(u.id))}
            />
          ) : <FeatureDisabledScreen featureName="MESSAGES" />
        )}

        {activeRoute === AppRoute.NOTIFICATIONS && (
          isFeatureEnabled(AppRoute.NOTIFICATIONS) ? (
            <NotificationsPage 
              notifications={notifications}
              onDelete={(id) => deleteDoc(doc(db, 'notifications', id))}
              onMarkRead={() => {}}
              addToast={addToast}
              locale="en-GB"
              userData={userData}
            />
          ) : <FeatureDisabledScreen featureName="NOTIFICATIONS" />
        )}

        {/* My Profile */}
        {activeRoute === AppRoute.PROFILE && userData && (
          isFeatureEnabled(AppRoute.PROFILE) ? (
            <ProfilePage 
              userData={userData}
              onUpdateProfile={() => {}}
              addToast={addToast}
              locale="en-GB"
              sessionStartTime={Date.now()}
              onViewPost={(post) => { setSelectedPost(post); setActiveRoute(AppRoute.SINGLE_POST); }}
              onViewProfile={handleViewProfile}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onLike={handleLike}
              onBookmark={handleBookmark}
            />
          ) : <FeatureDisabledScreen featureName="PROFILE" />
        )}

        {/* Public Profile View */}
        {activeRoute === AppRoute.PUBLIC_PROFILE && selectedUserProfile && (
           <ProfilePage 
             userData={selectedUserProfile}
             onUpdateProfile={() => {}} // Read-only for others
             addToast={addToast}
             locale="en-GB"
             sessionStartTime={Date.now()}
             onViewPost={(post) => { setSelectedPost(post); setActiveRoute(AppRoute.SINGLE_POST); }}
             onViewProfile={handleViewProfile} // Recursive viewing
             onOpenSettings={() => {}} 
             onLike={handleLike}
             onBookmark={handleBookmark}
             isBlocked={blockedIds.has(selectedUserProfile.id)}
             onBlock={() => handleBlockUser(selectedUserProfile.id)}
           />
        )}

        {activeRoute === AppRoute.CLUSTERS && userData && (
          isFeatureEnabled(AppRoute.CLUSTERS) ? (
            <ClustersPage 
              currentUser={userData}
              locale="en-GB"
              addToast={addToast}
              onOpenChat={() => {}}
              allUsers={allUsers.filter(u => !blockedIds.has(u.id))}
              weather={weather}
            />
          ) : <FeatureDisabledScreen featureName="CLUSTERS" />
        )}

        {activeRoute === AppRoute.STREAM_GRID && (
          isFeatureEnabled(AppRoute.STREAM_GRID) ? (
            <StreamGridPage 
              locale="en-GB"
              onJoinStream={(stream) => setWatchingStream(stream)}
              onGoLive={() => setActiveStreamId(`stream_${user.uid}`)}
              userData={userData}
              onTransmit={() => {}}
            />
          ) : <FeatureDisabledScreen featureName="LIVE STREAMS" />
        )}

        {activeRoute === AppRoute.GATHERINGS && userData && (
          isFeatureEnabled(AppRoute.GATHERINGS) ? (
            <GatheringsPage 
              currentUser={userData}
              locale="en-GB"
              addToast={addToast}
              onViewGathering={(g) => { setSelectedGathering(g); setActiveRoute(AppRoute.SINGLE_GATHERING); }}
              onRSVP={handleRSVP}
              allUsers={allUsers.filter(u => !blockedIds.has(u.id))}
              onOpenLobby={() => {}}
            />
          ) : <FeatureDisabledScreen featureName="GATHERINGS" />
        )}

        {activeRoute === AppRoute.SINGLE_GATHERING && selectedGathering && userData && (
          <SingleGatheringView 
            gathering={selectedGathering}
            currentUser={userData}
            allUsers={allUsers}
            locale="en-GB"
            onBack={() => { setSelectedGathering(null); setActiveRoute(AppRoute.GATHERINGS); }}
            onDelete={(id) => { deleteDoc(doc(db, 'gatherings', id)); setActiveRoute(AppRoute.GATHERINGS); }}
            onRSVP={handleRSVP}
            onOpenLobby={() => {}}
          />
        )}

        {activeRoute === AppRoute.SINGLE_POST && selectedPost && (
          <SinglePostView 
            post={selectedPost}
            userData={userData}
            locale="en-GB"
            onClose={() => { setSelectedPost(null); setActiveRoute(AppRoute.FEED); }}
            onLike={handleLike}
            onBookmark={handleBookmark}
            addToast={addToast}
          />
        )}

        {activeRoute === AppRoute.MESH && userData && (
          isFeatureEnabled(AppRoute.MESH) ? (
            <MeshPage currentUser={userData} locale="en-GB" addToast={addToast} onViewProfile={handleViewProfile} />
          ) : <FeatureDisabledScreen featureName="MESH NETWORK" />
        )}
        
        {activeRoute === AppRoute.TEMPORAL && (
          isFeatureEnabled(AppRoute.TEMPORAL) ? (
            <TemporalPage currentUser={userData} locale="en-GB" addToast={addToast} />
          ) : <FeatureDisabledScreen featureName="TEMPORAL" />
        )}
        
        {activeRoute === AppRoute.SAVED && userData && (
          isFeatureEnabled(AppRoute.SAVED) ? (
            <DataVaultPage currentUser={userData} locale="en-GB" addToast={addToast} onViewPost={() => {}} />
          ) : <FeatureDisabledScreen featureName="DATA VAULT" />
        )}
        
        {activeRoute === AppRoute.VERIFIED_NODES && (
          isFeatureEnabled(AppRoute.VERIFIED_NODES) ? (
            <VerifiedNodesPage users={allUsers.filter(u => !blockedIds.has(u.id))} onViewProfile={handleViewProfile} />
          ) : <FeatureDisabledScreen featureName="VERIFIED NODES" />
        )}
        
        {activeRoute === AppRoute.ADMIN && <AdminPanel addToast={addToast} locale="en-GB" systemSettings={systemSettings} userData={userData} />}
        {activeRoute === AppRoute.PRIVACY && <PrivacyPage />}
        {activeRoute === AppRoute.TERMS && <TermsPage />}
        {activeRoute === AppRoute.COOKIES && <CookiesPage />}
        
        {activeRoute === AppRoute.SIMULATIONS && (
          isFeatureEnabled(AppRoute.SIMULATIONS) ? (
            <SimulationsPage />
          ) : <FeatureDisabledScreen featureName="SIMULATIONS" />
        )}

        {activeRoute === AppRoute.RESILIENCE && userData && (
           isFeatureEnabled(AppRoute.RESILIENCE) ? (
             <ResiliencePage userData={userData} addToast={addToast} />
           ) : <FeatureDisabledScreen featureName="RESILIENCE" />
        )}

        {activeRoute === AppRoute.SUPPORT && userData && (
           isFeatureEnabled(AppRoute.SUPPORT) ? (
             <SupportPage currentUser={userData} addToast={addToast} locale="en-GB" />
           ) : <FeatureDisabledScreen featureName="SUPPORT MATRIX" />
        )}

      </Layout>

      {/* OVERLAYS */}
      {toasts.map(t => (
        <div key={t.id} className="fixed top-24 right-6 z-[3000]">
          <Toast toast={t} onClose={removeToast} />
        </div>
      ))}

      {activeStreamId && userData && (
        <LiveBroadcastOverlay 
          userData={userData} 
          onStart={() => {}} 
          onEnd={() => setActiveStreamId(null)} 
          activeStreamId={activeStreamId} 
        />
      )}

      {watchingStream && (
        <LiveWatcherOverlay 
          stream={watchingStream} 
          onLeave={() => setWatchingStream(null)} 
        />
      )}

      {activeCall && userData && (
        <NeuralLinkOverlay 
          session={activeCall} 
          userData={userData} 
          onEnd={() => setActiveCall(null)} 
        />
      )}

      {isSettingsOpen && userData && (
        <SettingsOverlay 
          userData={userData} 
          onClose={() => setIsSettingsOpen(false)} 
          onLogout={handleLogout}
          addToast={addToast}
          blockedIds={Array.from(myBlockedIds)}
          onUnblock={handleUnblockUser}
        />
      )}
    </>
  );
}