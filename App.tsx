
import React, { useState, useEffect } from 'react';
import * as FirebaseAuth from 'firebase/auth';
const { onAuthStateChanged, signOut } = FirebaseAuth as any;
import * as Firestore from 'firebase/firestore';
const { 
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
  deleteDoc
} = Firestore as any;
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

// Services
import { fetchWeather } from './services/weather';

const MaintenanceScreen = () => (
  <div className="fixed inset-0 z-[9999] bg-[#020617] flex flex-col items-center justify-center overflow-hidden selection:bg-rose-500 selection:text-white">
    
    {/* Ambient Effects */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-600/20 rounded-full blur-[120px] animate-pulse" />
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
    
    <div className="relative z-10 flex flex-col items-center text-center p-8">
      
      {/* Icon Container */}
      <div className="relative mb-12 group">
        <div className="absolute inset-0 bg-rose-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000 animate-pulse" />
        <div className="relative w-32 h-32 bg-[#0f172a] rounded-full border border-rose-500/30 flex items-center justify-center shadow-2xl shadow-rose-900/20">
           <svg className="w-12 h-12 text-rose-500 drop-shadow-[0_0_15px_rgba(225,29,72,0.6)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
             <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.34c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
           </svg>
        </div>
      </div>

      {/* Typography */}
      <h1 className="text-5xl md:text-8xl font-black text-white uppercase italic tracking-tighter leading-none mb-6 drop-shadow-2xl">
        System<br/><span className="text-rose-600">Lockdown</span>
      </h1>
      
      <div className="flex items-center justify-center gap-4 mb-16">
         <div className="h-px w-12 bg-gradient-to-r from-transparent to-rose-500/50" />
         <p className="text-[10px] md:text-xs font-black text-rose-400 uppercase tracking-[0.4em] font-mono">
           Maintenance Protocols Active
         </p>
         <div className="h-px w-12 bg-gradient-to-l from-transparent to-rose-500/50" />
      </div>

      {/* Loader */}
      <div className="flex gap-4 mb-20">
         <div className="w-2 h-2 bg-rose-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
         <div className="w-2 h-2 bg-rose-600 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
         <div className="w-2 h-2 bg-rose-600 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
      </div>

      {/* Footer */}
      <div className="absolute bottom-12 left-0 right-0 text-center">
         <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.5em] font-mono">
           Authorized_Personnel_Only
         </p>
      </div>
    </div>
  </div>
);

const FeatureDisabledScreen = ({ featureName }: { featureName: string }) => (
  <div className="flex flex-col items-center justify-center h-full w-full min-h-[60vh] p-6 animate-in fade-in duration-700 relative overflow-hidden rounded-[3rem] border border-slate-100 bg-slate-50/50">
    
    {/* Background Patterns */}
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay" />
    <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-[80px]" />
    <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-300/10 rounded-full blur-[80px]" />

    <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto">
      
      {/* Icon Container */}
      <div className="relative mb-8 group">
        <div className="absolute inset-0 bg-rose-500/20 rounded-[2rem] blur-xl group-hover:blur-2xl transition-all duration-700" />
        <div className="relative w-28 h-28 bg-white rounded-[2rem] flex items-center justify-center shadow-xl border border-white/50">
           <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
             <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
           </svg>
           <div className="absolute -bottom-3 -right-3 bg-rose-500 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border-2 border-white shadow-lg flex items-center gap-1.5">
             <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
             LOCKED
           </div>
        </div>
      </div>

      <h2 className="text-4xl md:text-5xl font-black text-slate-900 uppercase italic tracking-tighter mb-4 leading-none">
        Access_Denied
      </h2>
      
      <p className="text-sm font-medium text-slate-500 leading-relaxed mb-8">
        The <span className="text-slate-900 font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200 mx-1">{featureName}</span> protocol has been strategically disabled by grid administration. Access to this sector is currently restricted.
      </p>

      <div className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-xl border border-slate-200 shadow-sm">
         <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] font-mono">SYSTEM_CODE:</span>
         <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest font-mono">503_SERVICE_UNAVAILABLE</span>
      </div>

    </div>
  </div>
);

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<User | null>(null);
  
  // Route Persistence Logic
  const [activeRoute, setActiveRoute] = useState<AppRoute>(() => {
    try {
      const saved = localStorage.getItem('vibestream_active_route') as AppRoute;
      // Fallback to FEED if saved route is a detail view (which lacks state on refresh) or invalid
      if (saved === AppRoute.SINGLE_POST || saved === AppRoute.SINGLE_GATHERING) {
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
  
  // Selection States
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedGathering, setSelectedGathering] = useState<Gathering | null>(null);
  
  // Streaming & Calling
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null);
  const [watchingStream, setWatchingStream] = useState<LiveStream | null>(null);
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);

  // RSVP Processing Lock
  const [rsvpProcessing, setRsvpProcessing] = useState<Set<string>>(new Set());

  // Save Route Changes
  useEffect(() => {
    if (activeRoute !== AppRoute.SINGLE_POST && activeRoute !== AppRoute.SINGLE_GATHERING) {
      localStorage.setItem('vibestream_active_route', activeRoute);
    }
  }, [activeRoute]);

  // --- AUTH & USER SYNC ---
  useEffect(() => {
    // Safety Timeout: Force stop loading if Auth listener hangs or network fails
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
        
        // Sync User Data & Check for Ghost Session
        const userRef = doc(db, 'users', authUser.uid);
        const unsubUser = onSnapshot(userRef, (docSnap: any) => {
          if (docSnap.exists()) {
            // Valid User Profile Found
            const data = docSnap.data() as User;
            setUserData({ ...data, id: docSnap.id });
            
            // Fetch Weather based on location
            if (data.location) {
              fetchWeather({ query: data.location })
                .then(setWeather)
                .catch(err => console.warn("Atmospheric sync deferred:", err));
            }
            setLoading(false); // Stop spinner
          } else {
            console.warn("Profile not found in Grid. Awaiting initialization...");
            // Keep loading true if just created, handled by LandingPage usually
          }
        }, (error: any) => {
           console.error("Grid Sync Interrupted:", error.message);
           // Handle permission errors by not blocking the UI completely, but user data might be stale
           setLoading(false);
        });

        // Sync Notifications (Non-blocking)
        const notifQuery = query(
          collection(db, 'notifications'), 
          where('toUserId', '==', authUser.uid), 
          orderBy('timestamp', 'desc'), 
          limit(50)
        );
        const unsubNotif = onSnapshot(notifQuery, (snap: any) => {
          setNotifications(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as AppNotification)));
        }, (e: any) => console.debug("Notif bus silent"));

        // Sync Calls (Non-blocking)
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
        };
      } else {
        // No Auth User
        setUser(null);
        setUserData(null);
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
    // Sync Settings Globally
    // We use functional update setSystemSettings(prev => ({...prev, ...data})) to ensure
    // we merge partial data from Firestore with our robust defaults, preventing
    // undefined values from breaking features like registration disable.
    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap: any) => {
      if (docSnap.exists()) {
        setSystemSettings(prev => ({
          ...prev,
          ...docSnap.data()
        }));
      }
    });

    // Sync All Users (Lightweight)
    const unsubUsers = onSnapshot(query(collection(db, 'users'), limit(100)), (snap: any) => {
      setAllUsers(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as User)));
    });

    // Sync Feed Posts
    const unsubPosts = onSnapshot(query(collection(db, 'posts'), orderBy('timestamp', 'desc'), limit(50)), (snap: any) => {
      setGlobalPosts(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Post)));
    });

    return () => {
      unsubSettings();
      unsubUsers();
      unsubPosts();
    };
  }, []); // Run once on mount to ensure settings are always available for LandingPage

  // --- ACTIONS ---

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
      localStorage.removeItem('vibestream_active_route');
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreatePost = (initialFiles?: File[]) => {
    addToast("Signal Composer Active", "info");
  };

  // --- RSVP LOGIC ---
  const handleRSVP = async (gatheringId: string, isAttendingOrWaitlisted: boolean) => {
    if (!db || !userData || rsvpProcessing.has(gatheringId)) return;
    
    // Lock this gathering
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
        // Withdrawing
        if (isCurrentlyAttending) {
            batch.update(gatheringRef, { attendees: arrayRemove(userId) });
            
            // Auto-promote
            if (currentData.waitlist && currentData.waitlist.length > 0) {
                const nextUserId = currentData.waitlist[0];
                batch.update(gatheringRef, { 
                    waitlist: arrayRemove(nextUserId),
                    attendees: arrayUnion(nextUserId) 
                });

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
                batch.update(doc(db, 'chats', currentData.linkedChatId), {
                    participants: arrayRemove(userId)
                });
            }
            successMessage = "Withdrawn from Gathering";
            successType = "info";

        } else if (isCurrentlyWaitlisted) {
            batch.update(gatheringRef, { waitlist: arrayRemove(userId) });
            successMessage = "Removed from Waitlist";
            successType = "info";
        }

      } else {
        // Joining
        if (max > 0 && currentCount >= max) {
            batch.update(gatheringRef, { waitlist: arrayUnion(userId) });
            successMessage = "Joined Waitlist";
            successType = "info";
        } else {
            batch.update(gatheringRef, { attendees: arrayUnion(userId) });
            
            if (currentData.linkedChatId) {
                const chatRef = doc(db, 'chats', currentData.linkedChatId);
                const participantUpdate: any = {};
                participantUpdate[`participantData.${userId}`] = { 
                    displayName: userData.displayName, 
                    avatarUrl: userData.avatarUrl 
                };
                batch.update(chatRef, { 
                    participants: arrayUnion(userId),
                    ...participantUpdate
                });
            }
            successMessage = "RSVP Confirmed";
            successType = "success";
        }
      }

      await batch.commit();
      if (successMessage) addToast(successMessage, successType);

    } catch (e) {
      console.error(e);
      addToast("RSVP Protocol Failed", "error");
    } finally {
      // Release lock
      setRsvpProcessing(prev => { const n = new Set(prev); n.delete(gatheringId); return n; });
    }
  };

  // --- HELPERS ---
  const isFeatureEnabled = (route: AppRoute) => {
    // Admin always overrides
    if (userData?.role === 'admin') return true;
    return systemSettings.featureFlags?.[route] !== false;
  };

  // --- RENDER ---

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] font-mono animate-pulse">Initializing_Grid...</p>
        </div>
      </div>
    );
  }

  // MAINTENANCE MODE CHECK (Bypass for Admins)
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
      >
        {activeRoute === AppRoute.FEED && (
          isFeatureEnabled(AppRoute.FEED) ? (
            <FeedPage 
              posts={globalPosts} 
              userData={userData}
              locale="en-GB"
              onLike={() => {}}
              onBookmark={() => {}}
              onViewPost={(post) => { setSelectedPost(post); setActiveRoute(AppRoute.SINGLE_POST); }}
              onOpenCreate={() => handleCreatePost()}
              onTransmitStory={() => {}}
              onGoLive={() => {
                 setActiveStreamId(`stream_${user.uid}`);
              }}
              onJoinStream={(stream) => setWatchingStream(stream)}
            />
          ) : <FeatureDisabledScreen featureName="FEED" />
        )}

        {activeRoute === AppRoute.EXPLORE && (
          isFeatureEnabled(AppRoute.EXPLORE) ? (
            <ExplorePage 
              posts={globalPosts}
              users={allUsers}
              onLike={() => {}}
              onBookmark={() => {}}
              onViewPost={(post) => { setSelectedPost(post); setActiveRoute(AppRoute.SINGLE_POST); }}
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
              allUsers={allUsers}
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

        {activeRoute === AppRoute.PROFILE && userData && (
          isFeatureEnabled(AppRoute.PROFILE) ? (
            <ProfilePage 
              userData={userData}
              onUpdateProfile={() => {}}
              addToast={addToast}
              locale="en-GB"
              sessionStartTime={Date.now()}
              onViewPost={(post) => { setSelectedPost(post); setActiveRoute(AppRoute.SINGLE_POST); }}
            />
          ) : <FeatureDisabledScreen featureName="PROFILE" />
        )}

        {activeRoute === AppRoute.CLUSTERS && userData && (
          isFeatureEnabled(AppRoute.CLUSTERS) ? (
            <ClustersPage 
              currentUser={userData}
              locale="en-GB"
              addToast={addToast}
              onOpenChat={() => {}}
              allUsers={allUsers}
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
              allUsers={allUsers}
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
            onDelete={(id) => {
               deleteDoc(doc(db, 'gatherings', id));
               setActiveRoute(AppRoute.GATHERINGS);
            }}
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
            onLike={() => {}}
            onBookmark={() => {}}
            addToast={addToast}
          />
        )}

        {/* Other Pages */}
        {activeRoute === AppRoute.MESH && userData && (
          isFeatureEnabled(AppRoute.MESH) ? (
            <MeshPage currentUser={userData} locale="en-GB" addToast={addToast} onViewProfile={() => {}} />
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
            <VerifiedNodesPage users={allUsers} onViewProfile={() => {}} />
          ) : <FeatureDisabledScreen featureName="VERIFIED NODES" />
        )}
        
        {activeRoute === AppRoute.ADMIN && <AdminPanel addToast={addToast} locale="en-GB" systemSettings={systemSettings} />}
        {activeRoute === AppRoute.PRIVACY && <PrivacyPage />}
        {activeRoute === AppRoute.TERMS && <TermsPage />}
        {activeRoute === AppRoute.COOKIES && <CookiesPage />}
        
        {/* New Simulations Page */}
        {activeRoute === AppRoute.SIMULATIONS && (
          isFeatureEnabled(AppRoute.SIMULATIONS) ? (
            <SimulationsPage />
          ) : <FeatureDisabledScreen featureName="SIMULATIONS" />
        )}

        {/* Resilience Module */}
        {activeRoute === AppRoute.RESILIENCE && userData && (
           isFeatureEnabled(AppRoute.RESILIENCE) ? (
             <ResiliencePage 
               userData={userData} 
               addToast={addToast}
             />
           ) : <FeatureDisabledScreen featureName="RESILIENCE" />
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
    </>
  );
}
