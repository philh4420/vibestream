
import React, { useState, useEffect, useRef } from 'react';
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
  setDoc
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
import { ResonanceMarketplace } from './components/marketplace/ResonanceMarketplace';
import { SignalTrail } from './components/ui/SignalTrail';

// Services
import { fetchWeather } from './services/weather';

const MaintenanceScreen = () => (
  <div className="fixed inset-0 z-[9999] bg-[#030712] flex flex-col items-center justify-center overflow-hidden font-sans selection:bg-rose-500 selection:text-white">
    <div className="relative z-10 flex flex-col items-center text-center p-8 w-full max-w-6xl">
      <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-white italic tracking-tighter leading-none mb-8 drop-shadow-2xl select-none mix-blend-screen">
        SYSTEM<span className="text-rose-600 inline-block px-2">_</span>LOCKDOWN
      </h1>
      <p className="text-[10px] md:text-xs font-black text-rose-400 uppercase tracking-[0.3em] font-mono">MAINTENANCE PROTOCOLS ACTIVE</p>
    </div>
  </div>
);

const FeatureDisabledScreen = ({ featureName }: { featureName: string }) => (
  <div className="flex flex-col items-center justify-center w-full min-h-[70vh] p-6 animate-in zoom-in-95 duration-700 relative overflow-hidden rounded-[3.5rem] bg-[#FFFCF5] dark:bg-slate-900 border dark:border-slate-800">
    <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto">
      <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-6 leading-none">
        ACCESS<span className="text-slate-300 dark:text-slate-700">_</span>DENIED
      </h2>
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 px-8 py-6 rounded-[2rem] shadow-sm mb-10 max-w-lg">
        <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
          The <span className="text-slate-900 dark:text-white font-black bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-600 uppercase mx-1 tracking-wider">{featureName}</span> protocol has been strategically disabled by grid administration.
        </p>
      </div>
    </div>
  </div>
);

const SuspendedScreen = ({ onLogout, userData }: { onLogout: () => void, userData: User | null }) => (
    <div className="fixed inset-0 z-[9999] bg-[#050101] flex flex-col items-center justify-center overflow-hidden font-sans selection:bg-rose-500 selection:text-white">
      <div className="relative z-10 flex flex-col items-center text-center p-8 max-w-2xl w-full">
        <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter italic mb-6 leading-none">
          Node<span className="text-rose-600">_</span>Suspended
        </h1>
        <button onClick={onLogout} className="flex-1 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-200 transition-all active:scale-95 shadow-xl">Terminate_Session</button>
      </div>
    </div>
);

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<User | null>(null);
  
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
  
  // Blocking State
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  
  // Selection States
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedGathering, setSelectedGathering] = useState<Gathering | null>(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState<User | null>(null);
  
  // Streaming & Calling
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null);
  const [watchingStream, setWatchingStream] = useState<LiveStream | null>(null);
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);

  const [rsvpProcessing, setRsvpProcessing] = useState<Set<string>>(new Set());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Sound Refs
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);
  const latestNotifIdRef = useRef<string | null>(null);

  // Initialize Sound
  useEffect(() => {
    notificationSoundRef.current = new Audio('https://actions.google.com/sounds/v1/navigation/arrival_message_success.ogg');
    notificationSoundRef.current.volume = 0.5;
  }, []);

  // --- THEME ENGINE ---
  useEffect(() => {
    const applyTheme = () => {
      const theme = userData?.settings?.appearance?.theme || 'system';
      const root = document.documentElement;
      
      if (theme === 'dark') {
        root.classList.add('dark');
      } else if (theme === 'light') {
        root.classList.remove('dark');
      } else {
        // System preference
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (systemDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    // Apply immediately
    applyTheme();

    // Listen for system changes if using system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (userData?.settings?.appearance?.theme === 'system' || !userData?.settings?.appearance?.theme) {
        applyTheme();
      }
    };
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [userData?.settings?.appearance?.theme]);

  useEffect(() => {
    if (activeRoute !== AppRoute.SINGLE_POST && activeRoute !== AppRoute.SINGLE_GATHERING && activeRoute !== AppRoute.PUBLIC_PROFILE) {
      localStorage.setItem('vibestream_active_route', activeRoute);
    }
  }, [activeRoute]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  // Auth & User Sync
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

        // VibeStream 2026: Auto-restore presence on login
        // Checks if user is stuck in 'Offline' state from last session and restores their preferred state
        getDoc(userRef).then(async (snap: any) => {
            if (snap.exists()) {
                const data = snap.data();
                if (data.presenceStatus === 'Offline') {
                    const nextStatus = data.lastActiveStatus || 'Online';
                    await updateDoc(userRef, { presenceStatus: nextStatus });
                }
            }
        }).catch((e: any) => console.debug("Presence restoration skipped:", e));

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
          }
        });

        const notifQuery = query(collection(db, 'notifications'), where('toUserId', '==', authUser.uid), orderBy('timestamp', 'desc'), limit(50));
        const unsubNotif = onSnapshot(notifQuery, (snap: any) => {
          const newNotifs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as AppNotification));
          
          if (newNotifs.length > 0) {
             const latest = newNotifs[0];
             // Play sound if new unread notification arrives (and it's not the initial load or duplicate)
             if (latestNotifIdRef.current && latest.id !== latestNotifIdRef.current && !latest.isRead) {
                 notificationSoundRef.current?.play().catch(() => {});
             }
             latestNotifIdRef.current = latest.id;
          }
          setNotifications(newNotifs);
        });

        // Block Lists Listeners
        const blockedRef = collection(db, 'users', authUser.uid, 'blocked');
        const blockedByRef = collection(db, 'users', authUser.uid, 'blockedBy');
        
        const unsubBlocked = onSnapshot(blockedRef, (snap: any) => {
            setBlockedIds(prev => {
               const newSet = new Set(prev);
               // Refresh from source
               snap.docs.forEach((d: any) => newSet.add(d.id));
               return newSet;
            });
        });

        const unsubBlockedBy = onSnapshot(blockedByRef, (snap: any) => {
            setBlockedIds(prev => {
                const newSet = new Set(prev);
                snap.docs.forEach((d: any) => newSet.add(d.id));
                return newSet;
            });
        });

        const callQuery = query(collection(db, 'calls'), where('receiverId', '==', authUser.uid), where('status', '==', 'ringing'), limit(1));
        const unsubCalls = onSnapshot(callQuery, (snap: any) => {
          if (!snap.empty) {
            setActiveCall({ id: snap.docs[0].id, ...snap.docs[0].data() } as CallSession);
          }
        });

        return () => {
          unsubUser();
          unsubNotif();
          unsubCalls();
          unsubBlocked();
          unsubBlockedBy();
        };
      } else {
        setUser(null);
        setUserData(null);
        setBlockedIds(new Set());
        setLoading(false);
      }
    });

    return () => {
        clearTimeout(safetyTimer);
        unsubscribe();
    }
  }, []);

  // Global Data Sync
  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap: any) => {
      if (docSnap.exists()) {
        setSystemSettings(prev => ({ ...prev, ...docSnap.data() }));
      }
    });

    const unsubUsers = onSnapshot(query(collection(db, 'users'), limit(100)), (snap: any) => {
      setAllUsers(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as User)));
    });

    const unsubPosts = onSnapshot(query(collection(db, 'posts'), orderBy('timestamp', 'desc'), limit(50)), (snap: any) => {
      setGlobalPosts(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Post)));
    });

    return () => { unsubSettings(); unsubUsers(); unsubPosts(); };
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleLogout = async () => {
    if (userData?.id) {
        // Save current status to allow restoration on next login
        const restoreState = (userData.presenceStatus === 'Offline' || !userData.presenceStatus) 
            ? 'Online' 
            : userData.presenceStatus;
            
        await updateDoc(doc(db, 'users', userData.id), { 
            presenceStatus: 'Offline',
            lastActiveStatus: restoreState
        });
    }
    await signOut(auth);
    setUser(null);
    setUserData(null);
    setActiveRoute(AppRoute.FEED);
    setIsSettingsOpen(false);
  };

  const handleBlockUser = async (targetId: string) => {
    if (!db || !userData?.id || targetId === userData.id) return;
    try {
        const batch = writeBatch(db);
        const myId = userData.id;
        
        const myBlockedRef = doc(db, 'users', myId, 'blocked', targetId);
        batch.set(myBlockedRef, { blockedAt: serverTimestamp(), blockedBy: myId });
        
        const theirBlockedByRef = doc(db, 'users', targetId, 'blockedBy', myId);
        batch.set(theirBlockedByRef, { blockedAt: serverTimestamp(), blockerId: myId });

        const myFollowingRef = doc(db, 'users', myId, 'following', targetId);
        const theirFollowersRef = doc(db, 'users', targetId, 'followers', myId);
        batch.delete(myFollowingRef);
        batch.delete(theirFollowersRef);
        
        const myFollowersRef = doc(db, 'users', myId, 'followers', targetId);
        const theirFollowingRef = doc(db, 'users', targetId, 'following', myId);
        batch.delete(myFollowersRef);
        batch.delete(theirFollowingRef);

        batch.update(doc(db, 'users', myId), { following: increment(-1), followers: increment(-1) });
        batch.update(doc(db, 'users', targetId), { followers: increment(-1), following: increment(-1) });
        
        await batch.commit();
        setBlockedIds(prev => new Set(prev).add(targetId));
        addToast("Node Blocked. Two-Way Signal Severed.", "success");
    } catch (e) {
        addToast("Block Protocol Failed", "error");
    }
  };

  const handleUnblockUser = async (targetId: string) => {
    if (!db || !userData?.id) return;
    const myId = userData.id;
    try {
        const batch = writeBatch(db);
        const myBlockedRef = doc(db, 'users', myId, 'blocked', targetId);
        batch.delete(myBlockedRef);
        const theirBlockedByRef = doc(db, 'users', targetId, 'blockedBy', myId);
        batch.delete(theirBlockedByRef);
        await batch.commit();
        setBlockedIds(prev => { const n = new Set(prev); n.delete(targetId); return n; });
        addToast("Node Unblocked. Signal Path Cleared.", "info");
    } catch (e) {
        addToast("Unblock Protocol Failed", "error");
    }
  };

  // --- NOTIFICATION HANDLERS ---
  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length === 0) return;

    try {
      const batch = writeBatch(db);
      unread.forEach(n => {
        batch.update(doc(db, 'notifications', n.id), { isRead: true });
      });
      await batch.commit();
      addToast("Signals Synchronised", "success");
    } catch (e) {
      addToast("Sync Protocol Failed", "error");
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
      addToast("Signal Purged", "info");
    } catch (e) {
      addToast("Purge Failed", "error");
    }
  };

  // --- GLOBAL INTERACTIONS ---

  const handleLike = async (postId: string, frequency: string = 'pulse') => {
    if (!userData || !db) return;
    try {
        const postRef = doc(db, 'posts', postId);
        // Find post author from global data if available, otherwise fetch
        let postAuthorId = globalPosts.find(p => p.id === postId)?.authorId;
        
        if (!postAuthorId) {
            const snap = await getDoc(postRef);
            if (snap.exists()) postAuthorId = snap.data().authorId;
        }

        const post = globalPosts.find(p => p.id === postId);
        const isLiked = post?.likedBy?.includes(userData.id);

        if (isLiked) {
            await updateDoc(postRef, {
                likes: increment(-1),
                likedBy: arrayRemove(userData.id)
            });
        } else {
            await updateDoc(postRef, {
                likes: increment(1),
                likedBy: arrayUnion(userData.id),
                [`reactions.${frequency}`]: increment(1)
            });

            // Send Notification
            if (postAuthorId && postAuthorId !== userData.id) {
                await addDoc(collection(db, 'notifications'), {
                    type: 'like',
                    fromUserId: userData.id,
                    fromUserName: userData.displayName,
                    fromUserAvatar: userData.avatarUrl,
                    toUserId: postAuthorId,
                    targetId: postId,
                    text: 'pulsed your signal',
                    pulseFrequency: frequency,
                    isRead: false,
                    timestamp: serverTimestamp()
                });
            }
        }
    } catch (e) {
        console.error("Like interaction failed", e);
    }
  };

  const handleBookmark = async (postId: string) => {
    if (!userData || !db) return;
    try {
        const postRef = doc(db, 'posts', postId);
        const post = globalPosts.find(p => p.id === postId);
        // Check if bookmarked in local state or optimistic update
        const isBookmarked = post?.bookmarkedBy?.includes(userData.id);

        if (isBookmarked) {
            await updateDoc(postRef, { bookmarkedBy: arrayRemove(userData.id) });
            addToast("Removed from Data Vault", "info");
        } else {
            await updateDoc(postRef, { bookmarkedBy: arrayUnion(userData.id) });
            addToast("Encrypted to Data Vault", "success");
        }
    } catch (e) {
        addToast("Vault Protocol Failed", "error");
    }
  };

  const handleRSVP = async (gatheringId: string, currentStatus: boolean) => {
    if (!userData || !db) return;
    try {
        const gRef = doc(db, 'gatherings', gatheringId);
        const gSnap = await getDoc(gRef);
        if (!gSnap.exists()) return;
        const gData = gSnap.data() as Gathering;

        if (currentStatus) {
            // Leaving (attendee or waitlist)
            await updateDoc(gRef, {
                attendees: arrayRemove(userData.id),
                waitlist: arrayRemove(userData.id)
            });
            addToast("Withdrawn from Gathering", "info");
        } else {
            // Joining
            await updateDoc(gRef, {
                attendees: arrayUnion(userData.id)
            });
            addToast("RSVP Confirmed", "success");

            if (gData.organizerId !== userData.id) {
                await addDoc(collection(db, 'notifications'), {
                    type: 'gathering_rsvp',
                    fromUserId: userData.id,
                    fromUserName: userData.displayName,
                    fromUserAvatar: userData.avatarUrl,
                    toUserId: gData.organizerId,
                    targetId: gatheringId,
                    text: `is attending your gathering: "${gData.title}"`,
                    isRead: false,
                    timestamp: serverTimestamp(),
                    pulseFrequency: 'intensity'
                });
            }
        }
    } catch (e) {
        addToast("RSVP Protocol Failed", "error");
    }
  };

  const isFeatureEnabled = (route: AppRoute) => {
    if (userData?.role === 'admin') return true;
    return systemSettings.featureFlags?.[route] !== false;
  };

  // Filter global content
  const filteredGlobalPosts = globalPosts.filter(p => !blockedIds.has(p.authorId));
  const filteredUsers = allUsers.filter(u => !blockedIds.has(u.id));

  if (loading) return <div className="fixed inset-0 bg-slate-900 flex items-center justify-center text-white">Initializing_Grid...</div>;
  if (!user) return <LandingPage onEnter={() => {}} systemSettings={systemSettings} />;

  // Maintenance Check (Admin Bypass)
  if (systemSettings.maintenanceMode && userData?.role !== 'admin') {
    return <MaintenanceScreen />;
  }

  // Suspension Check
  if (userData?.isSuspended) {
    return <SuspendedScreen onLogout={handleLogout} userData={userData} />;
  }

  return (
    <>
      <SignalTrail activeTrail={userData?.cosmetics?.activeTrail} />
      <Layout
        activeRoute={activeRoute}
        onNavigate={setActiveRoute}
        onOpenCreate={() => addToast("Composer Ready", "info")}
        onLogout={handleLogout}
        userRole={userData?.role}
        userData={userData}
        notifications={notifications.filter(n => !blockedIds.has(n.fromUserId))}
        onMarkRead={handleMarkAllRead}
        onDeleteNotification={handleDeleteNotification}
        currentRegion="en-GB"
        onRegionChange={() => {}}
        onSearch={() => {}}
        weather={weather}
        systemSettings={systemSettings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        blockedIds={blockedIds}
      >
        {activeRoute === AppRoute.FEED && isFeatureEnabled(AppRoute.FEED) && (
            <FeedPage 
              posts={filteredGlobalPosts} 
              userData={userData}
              locale="en-GB"
              onLike={handleLike}
              onBookmark={handleBookmark}
              onViewPost={(post) => { setSelectedPost(post); setActiveRoute(AppRoute.SINGLE_POST); }}
              onOpenCreate={() => {}}
              onTransmitStory={() => {}}
              onGoLive={() => setActiveStreamId(`stream_${user.uid}`)}
              onJoinStream={setWatchingStream}
              blockedIds={blockedIds}
            />
        )}

        {activeRoute === AppRoute.EXPLORE && isFeatureEnabled(AppRoute.EXPLORE) && (
            <ExplorePage 
              posts={filteredGlobalPosts}
              users={filteredUsers}
              onLike={handleLike}
              onBookmark={handleBookmark}
              onViewPost={(post) => { setSelectedPost(post); setActiveRoute(AppRoute.SINGLE_POST); }}
              onViewProfile={(u) => { setSelectedUserProfile(u); setActiveRoute(AppRoute.PUBLIC_PROFILE); }}
              locale="en-GB"
            />
        )}

        {activeRoute === AppRoute.MESSAGES && userData && isFeatureEnabled(AppRoute.MESSAGES) && (
            <MessagesPage 
              currentUser={userData}
              locale="en-GB"
              addToast={addToast}
              weather={weather}
              allUsers={filteredUsers}
              blockedIds={blockedIds}
            />
        )}

        {activeRoute === AppRoute.NOTIFICATIONS && isFeatureEnabled(AppRoute.NOTIFICATIONS) && (
            <NotificationsPage 
              notifications={notifications.filter(n => !blockedIds.has(n.fromUserId))}
              onDelete={handleDeleteNotification}
              onMarkRead={handleMarkAllRead}
              addToast={addToast}
              locale="en-GB"
              userData={userData}
            />
        )}

        {activeRoute === AppRoute.PROFILE && userData && isFeatureEnabled(AppRoute.PROFILE) && (
            <ProfilePage 
              userData={userData}
              onUpdateProfile={() => {}}
              addToast={addToast}
              locale="en-GB"
              sessionStartTime={Date.now()}
              onViewPost={(post) => { setSelectedPost(post); setActiveRoute(AppRoute.SINGLE_POST); }}
              onViewProfile={(u) => { setSelectedUserProfile(u); setActiveRoute(AppRoute.PUBLIC_PROFILE); }}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onLike={handleLike}
              onBookmark={handleBookmark}
              blockedIds={blockedIds}
            />
        )}

        {activeRoute === AppRoute.PUBLIC_PROFILE && selectedUserProfile && (
           <ProfilePage 
             userData={selectedUserProfile}
             onUpdateProfile={() => {}}
             addToast={addToast}
             locale="en-GB"
             sessionStartTime={Date.now()}
             onViewPost={(post) => { setSelectedPost(post); setActiveRoute(AppRoute.SINGLE_POST); }}
             onViewProfile={(u) => { setSelectedUserProfile(u); setActiveRoute(AppRoute.PUBLIC_PROFILE); }}
             onLike={handleLike}
             onBookmark={handleBookmark}
             blockedIds={blockedIds}
             isBlocked={blockedIds.has(selectedUserProfile.id)}
             onBlock={() => handleBlockUser(selectedUserProfile.id)}
             onUnblock={() => handleUnblockUser(selectedUserProfile.id)}
           />
        )}

        {activeRoute === AppRoute.ADMIN && userData?.role === 'admin' && (
            <AdminPanel 
              addToast={addToast}
              locale="en-GB"
              systemSettings={systemSettings}
              userData={userData}
            />
        )}

        {activeRoute === AppRoute.PRIVACY && <PrivacyPage />}
        {activeRoute === AppRoute.TERMS && <TermsPage />}
        {activeRoute === AppRoute.COOKIES && <CookiesPage />}

        {activeRoute === AppRoute.MESH && userData && isFeatureEnabled(AppRoute.MESH) && (
            <MeshPage 
              currentUser={userData} 
              locale="en-GB" 
              addToast={addToast}
              onViewProfile={(u) => { setSelectedUserProfile(u); setActiveRoute(AppRoute.PUBLIC_PROFILE); }}
              blockedIds={blockedIds}
            />
        )}

        {activeRoute === AppRoute.CLUSTERS && userData && isFeatureEnabled(AppRoute.CLUSTERS) && (
            <ClustersPage 
              currentUser={userData} 
              locale="en-GB" 
              addToast={addToast}
              onOpenChat={() => {}}
              allUsers={filteredUsers}
              weather={weather}
            />
        )}

        {activeRoute === AppRoute.STREAM_GRID && isFeatureEnabled(AppRoute.STREAM_GRID) && (
            <StreamGridPage 
              locale="en-GB"
              onJoinStream={setWatchingStream}
              onGoLive={() => setActiveStreamId(`stream_${user.uid}`)}
              userData={userData}
              onTransmit={() => {}}
            />
        )}

        {activeRoute === AppRoute.TEMPORAL && isFeatureEnabled(AppRoute.TEMPORAL) && (
            <TemporalPage currentUser={userData} locale="en-GB" addToast={addToast} />
        )}

        {activeRoute === AppRoute.SAVED && userData && isFeatureEnabled(AppRoute.SAVED) && (
            <DataVaultPage 
              currentUser={userData} 
              locale="en-GB" 
              addToast={addToast}
              onViewPost={(post) => { setSelectedPost(post); setActiveRoute(AppRoute.SINGLE_POST); }}
            />
        )}

        {activeRoute === AppRoute.VERIFIED_NODES && isFeatureEnabled(AppRoute.VERIFIED_NODES) && (
            <VerifiedNodesPage 
              users={filteredUsers} 
              onViewProfile={(u) => { setSelectedUserProfile(u); setActiveRoute(AppRoute.PUBLIC_PROFILE); }} 
            />
        )}

        {activeRoute === AppRoute.GATHERINGS && userData && isFeatureEnabled(AppRoute.GATHERINGS) && (
            <GatheringsPage 
              currentUser={userData}
              locale="en-GB"
              addToast={addToast}
              allUsers={filteredUsers}
              onOpenLobby={(id) => { console.log('Open Lobby', id); }}
              onViewGathering={(g) => { setSelectedGathering(g); setActiveRoute(AppRoute.SINGLE_GATHERING); }}
              onRSVP={handleRSVP}
            />
        )}

        {activeRoute === AppRoute.SINGLE_GATHERING && selectedGathering && userData && (
            <SingleGatheringView 
              gathering={selectedGathering}
              currentUser={userData}
              allUsers={filteredUsers}
              locale="en-GB"
              onBack={() => setActiveRoute(AppRoute.GATHERINGS)}
              onDelete={() => {}}
              onRSVP={handleRSVP}
              onOpenLobby={(id) => { console.log('Open Lobby', id); }}
            />
        )}

        {activeRoute === AppRoute.SIMULATIONS && isFeatureEnabled(AppRoute.SIMULATIONS) && (
            <SimulationsPage />
        )}

        {activeRoute === AppRoute.RESILIENCE && userData && isFeatureEnabled(AppRoute.RESILIENCE) && (
            <ResiliencePage userData={userData} addToast={addToast} />
        )}

        {activeRoute === AppRoute.SUPPORT && userData && isFeatureEnabled(AppRoute.SUPPORT) && (
            <SupportPage currentUser={userData} locale="en-GB" addToast={addToast} />
        )}

        {activeRoute === AppRoute.SINGLE_POST && selectedPost && (
            <SinglePostView 
              post={selectedPost} 
              userData={userData} 
              locale="en-GB" 
              onClose={() => setActiveRoute(AppRoute.FEED)}
              onLike={handleLike}
              onBookmark={handleBookmark}
              addToast={addToast}
              blockedIds={blockedIds}
            />
        )}

        {activeRoute === AppRoute.MARKETPLACE && userData && (
            <ResonanceMarketplace userData={userData} addToast={addToast} />
        )}

        {!isFeatureEnabled(activeRoute) && activeRoute !== AppRoute.ADMIN && (
           <FeatureDisabledScreen featureName={activeRoute} />
        )}

      </Layout>

      {/* Overlays */}
      {toasts.map(t => <div key={t.id} className="fixed top-24 right-6 z-[3000]"><Toast toast={t} onClose={removeToast} /></div>)}
      
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
          blockedIds={Array.from(blockedIds)}
          onUnblock={handleUnblockUser}
        />
      )}
    </>
  );
}