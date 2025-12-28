
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { auth, db } from './services/firebase';
import * as FirebaseAuth from 'firebase/auth';
const { onAuthStateChanged, signOut } = FirebaseAuth as any;
import * as Firestore from 'firebase/firestore';
const { 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  increment,
  setDoc,
  serverTimestamp,
  writeBatch
} = Firestore as any;
import { 
  AppRoute, 
  User, 
  AppNotification, 
  SystemSettings, 
  Region, 
  WeatherInfo, 
  Post, 
  LiveStream,
  Gathering,
  ToastMessage
} from './types';
import { Layout } from './components/layout/Layout';
import { LandingPage } from './components/landing/LandingPage';
import { FeedPage } from './components/feed/FeedPage';
import { ExplorePage } from './components/explore/ExplorePage';
import { MessagesPage } from './components/messages/MessagesPage';
import { ProfilePage } from './components/profile/ProfilePage';
import { AdminPanel } from './components/admin/AdminPanel';
import { GatheringsPage } from './components/gatherings/GatheringsPage';
import { SingleGatheringView } from './components/gatherings/SingleGatheringView';
import { ClustersPage } from './components/clusters/ClustersPage';
import { StreamGridPage } from './components/streams/StreamGridPage';
import { TemporalPage } from './components/temporal/TemporalPage';
import { DataVaultPage } from './components/vault/DataVaultPage';
import { VerifiedNodesPage } from './components/explore/VerifiedNodesPage';
import { SimulationsPage } from './components/simulations/SimulationsPage';
import { ResiliencePage } from './components/resilience/ResiliencePage';
import { SupportPage } from './components/support/SupportPage';
import { ResonanceMarketplace } from './components/marketplace/ResonanceMarketplace';
import { SinglePostView } from './components/feed/SinglePostView';
import { SettingsOverlay } from './components/settings/SettingsOverlay';
import { LiveBroadcastOverlay } from './components/streams/LiveBroadcastOverlay';
import { LiveWatcherOverlay } from './components/streams/LiveWatcherOverlay';
import { SignalTrail } from './components/ui/SignalTrail';
import { MeshPage } from './components/mesh/MeshPage';
import { fetchWeather } from './services/weather';
import { uploadToCloudinary } from './services/cloudinary';

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // App State
  const [activeRoute, setActiveRoute] = useState<AppRoute>(AppRoute.FEED);
  const [posts, setPosts] = useState<Post[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [region, setRegion] = useState<Region>('en-GB');
  
  // UI Modal State
  const [viewingPost, setViewingPost] = useState<Post | null>(null);
  const [viewingProfile, setViewingProfile] = useState<User | null>(null);
  const [viewingGathering, setViewingGathering] = useState<Gathering | null>(null);
  const [activeLobbyGathering, setActiveLobbyGathering] = useState<Gathering | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeStream, setActiveStream] = useState<LiveStream | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Derived State
  const blockedIds = useMemo(() => new Set(userData?.settings?.safety?.hiddenWords || []), [userData]);

  // Auth Listener
  useEffect(() => {
    return onAuthStateChanged(auth, (u: any) => {
      setUser(u);
      setIsAuthLoading(false);
      if (!u) {
        setUserData(null);
        setActiveRoute(AppRoute.FEED);
      }
    });
  }, []);

  // User Data & System Settings Listener
  useEffect(() => {
    if (!user || !db) return;
    
    const unsubUser = onSnapshot(doc(db, 'users', user.uid), (snap: any) => {
      if (snap.exists()) setUserData({ id: snap.id, ...snap.data() } as User);
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (snap: any) => {
      if (snap.exists()) setSystemSettings(snap.data() as SystemSettings);
    });

    return () => { unsubUser(); unsubSettings(); };
  }, [user]);

  // Theme & Accessibility Master Sync
  useEffect(() => {
    const appearance = userData?.settings?.appearance;
    if (!appearance) return;

    const root = window.document.documentElement;
    
    // 1. Theme Logic (System/Light/Dark)
    const applyTheme = (isDark: boolean) => {
      if (isDark) root.classList.add('dark');
      else root.classList.remove('dark');
    };

    if (appearance.theme === 'dark') {
      applyTheme(true);
    } else if (appearance.theme === 'light') {
      applyTheme(false);
    } else {
      // System Default
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mql.matches);
      
      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mql.addEventListener('change', listener);
      return () => mql.removeEventListener('change', listener);
    }

    // 2. High Contrast logic
    if (appearance.highContrast) root.classList.add('high-contrast');
    else root.classList.remove('high-contrast');

    // 3. Reduced Motion logic
    if (appearance.reducedMotion) root.classList.add('reduced-motion');
    else root.classList.remove('reduced-motion');

  }, [userData?.settings?.appearance]);

  // Global Data Fetchers
  useEffect(() => {
    if (!user || !db) return;

    const qPosts = query(collection(db, 'posts'), orderBy('timestamp', 'desc'), limit(100));
    const unsubPosts = onSnapshot(qPosts, (snap: any) => {
      setPosts(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Post)));
    });

    const qUsers = query(collection(db, 'users'), limit(100));
    const unsubUsers = onSnapshot(qUsers, (snap: any) => {
      setAllUsers(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as User)));
    });

    const qNotifs = query(collection(db, 'notifications'), where('toUserId', '==', user.uid), orderBy('timestamp', 'desc'), limit(50));
    const unsubNotifs = onSnapshot(qNotifs, (snap: any) => {
      setNotifications(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as AppNotification)));
    });

    return () => { unsubPosts(); unsubUsers(); unsubNotifs(); };
  }, [user]);

  // Weather Sync
  useEffect(() => {
    const updateAtmos = async () => {
      const w = await fetchWeather({ query: userData?.location || 'London' });
      setWeather(w);
    };
    updateAtmos();
    const interval = setInterval(updateAtmos, 600000); // 10 mins
    return () => clearInterval(interval);
  }, [userData?.location]);

  // Toast System Handler
  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    window.dispatchEvent(new CustomEvent('vibe-toast', { detail: { msg: message, type } }));
  }, []);

  // Global Event Listeners
  useEffect(() => {
    const handleViewPost = (e: any) => setViewingPost(e.detail.post);
    const handleNavigate = (e: any) => setActiveRoute(e.detail.route);
    
    window.addEventListener('vibe-view-post', handleViewPost);
    window.addEventListener('vibe-navigate', handleNavigate);
    
    return () => {
      window.removeEventListener('vibe-view-post', handleViewPost);
      window.removeEventListener('vibe-navigate', handleNavigate);
    };
  }, []);

  // Global Signal Handlers
  const handleLogout = async () => {
    await signOut(auth);
    setUserData(null);
    setUser(null);
  };

  const handleLike = async (postId: string, frequency?: string) => {
    if (!user || !db) return;
    const postRef = doc(db, 'posts', postId);
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const isLiked = post.likedBy?.includes(user.uid);
    try {
      await updateDoc(postRef, {
        likes: increment(isLiked ? -1 : 1),
        likedBy: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
      
      if (!isLiked && post.authorId !== user.uid) {
        await setDoc(doc(collection(db, 'notifications')), {
          type: 'like',
          fromUserId: user.uid,
          fromUserName: userData?.displayName,
          fromUserAvatar: userData?.avatarUrl,
          toUserId: post.authorId,
          targetId: postId,
          text: 'pulsed your signal',
          isRead: false,
          timestamp: serverTimestamp(),
          pulseFrequency: frequency || 'pulse'
        });
      }
    } catch (e) { addToast("Sync error", "error"); }
  };

  const handleBookmark = async (postId: string) => {
    if (!user || !db) return;
    const postRef = doc(db, 'posts', postId);
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const isBookmarked = post.bookmarkedBy?.includes(user.uid);
    try {
      await updateDoc(postRef, {
        bookmarkedBy: isBookmarked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
      addToast(isBookmarked ? "Removed from vault" : "Saved to vault", "success");
    } catch (e) { addToast("Vault error", "error"); }
  };

  const handleRSVP = async (gatheringId: string, currentRSVP: boolean) => {
    if (!user || !db) return;
    const gatheringRef = doc(db, 'gatherings', gatheringId);
    try {
      await updateDoc(gatheringRef, {
        attendees: currentRSVP ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
      addToast(currentRSVP ? "Withdrawn from gathering" : "Presence confirmed", "success");
    } catch (e) { addToast("RSVP error", "error"); }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-8" />
        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] font-mono animate-pulse">Initializing_Grid_Handshake...</p>
      </div>
    );
  }

  if (!user) {
    return <LandingPage onEnter={() => setActiveRoute(AppRoute.FEED)} systemSettings={systemSettings || { maintenanceMode: false, registrationDisabled: false, minTrustTier: 'Gamma', featureFlags: {}, lastUpdatedBy: '', updatedAt: '' } as any} />;
  }

  return (
    <div className="h-full w-full relative">
      <SignalTrail activeTrail={userData?.cosmetics?.activeTrail} />
      
      <Layout 
        activeRoute={activeRoute}
        onNavigate={setActiveRoute}
        onOpenCreate={() => setActiveRoute(AppRoute.FEED)}
        onLogout={handleLogout}
        userRole={userData?.role}
        userData={userData}
        notifications={notifications}
        onMarkRead={async () => {
          const batch = writeBatch(db);
          notifications.filter(n => !n.isRead).forEach(n => batch.update(doc(db, 'notifications', n.id), { isRead: true }));
          await batch.commit();
        }}
        onDeleteNotification={async (id) => await updateDoc(doc(db, 'notifications', id), { isRead: true })} 
        currentRegion={region}
        onRegionChange={setRegion}
        onSearch={(q) => { setSearchQuery(q); setActiveRoute(AppRoute.EXPLORE); }}
        weather={weather}
        systemSettings={systemSettings || undefined}
        onOpenSettings={() => setIsSettingsOpen(true)}
        blockedIds={blockedIds}
      >
        {activeRoute === AppRoute.FEED && (
          <FeedPage 
            posts={posts} 
            userData={userData} 
            onLike={handleLike} 
            onBookmark={handleBookmark} 
            onViewPost={setViewingPost}
            onOpenCreate={() => {}} 
            onTransmitStory={async (file) => {
              const url = await uploadToCloudinary(file);
              await setDoc(doc(collection(db, 'stories')), {
                authorId: user.uid,
                authorName: userData?.displayName,
                authorAvatar: userData?.avatarUrl,
                coverUrl: url,
                timestamp: serverTimestamp(),
                type: file.type.startsWith('video/') ? 'video' : 'image'
              });
              addToast("Temporal Fragment Broadcasted", "success");
            }}
            onGoLive={() => { setIsBroadcasting(true); setActiveStreamId(`stream_${Math.random().toString(36).substring(2, 11)}`); }}
            onJoinStream={setActiveStream}
            locale={region}
            blockedIds={blockedIds}
          />
        )}
        {activeRoute === AppRoute.EXPLORE && (
          <ExplorePage 
            posts={posts} users={allUsers} onLike={handleLike} onBookmark={handleBookmark} 
            onViewPost={setViewingPost} onViewProfile={setViewingProfile} locale={region} 
            searchQuery={searchQuery} onClearSearch={() => setSearchQuery('')}
            userData={userData}
          />
        )}
        {activeRoute === AppRoute.MESSAGES && (
          <MessagesPage currentUser={userData!} locale={region} addToast={addToast} weather={weather} allUsers={allUsers} blockedIds={blockedIds} />
        )}
        {activeRoute === AppRoute.PROFILE && (
          <ProfilePage 
            userData={userData!} onUpdateProfile={() => {}} addToast={addToast} locale={region} 
            sessionStartTime={Date.now()} onViewPost={setViewingPost} onViewProfile={setViewingProfile} 
            onOpenSettings={() => setIsSettingsOpen(true)} onLike={handleLike} onBookmark={handleBookmark}
            blockedIds={blockedIds}
          />
        )}
        {activeRoute === AppRoute.ADMIN && (
          <AdminPanel addToast={addToast} locale={region} systemSettings={systemSettings!} userData={userData} />
        )}
        {activeRoute === AppRoute.MESH && (
          <MeshPage 
            currentUser={userData!} 
            locale={region} 
            addToast={addToast} 
            onViewProfile={setViewingProfile}
            blockedIds={blockedIds}
          />
        )}
        {activeRoute === AppRoute.GATHERINGS && (
          <GatheringsPage 
            currentUser={userData!} locale={region} addToast={addToast} allUsers={allUsers}
            onOpenLobby={setActiveLobbyGathering} onViewGathering={setViewingGathering} onRSVP={handleRSVP}
          />
        )}
        {activeRoute === AppRoute.CLUSTERS && (
          <ClustersPage currentUser={userData!} locale={region} addToast={addToast} onOpenChat={() => {}} allUsers={allUsers} weather={weather} />
        )}
        {activeRoute === AppRoute.STREAM_GRID && (
          <StreamGridPage 
            locale={region} onJoinStream={setActiveStream} onGoLive={() => setIsBroadcasting(true)} 
            userData={userData} onTransmit={() => {}} 
          />
        )}
        {activeRoute === AppRoute.TEMPORAL && (
          <TemporalPage currentUser={userData} locale={region} addToast={addToast} />
        )}
        {activeRoute === AppRoute.SAVED && (
          <DataVaultPage currentUser={userData!} locale={region} addToast={addToast} onViewPost={setViewingPost} />
        )}
        {activeRoute === AppRoute.VERIFIED_NODES && (
          <VerifiedNodesPage users={allUsers} onViewProfile={setViewingProfile} />
        )}
        {activeRoute === AppRoute.SIMULATIONS && <SimulationsPage />}
        {activeRoute === AppRoute.RESILIENCE && <ResiliencePage userData={userData!} addToast={addToast} />}
        {activeRoute === AppRoute.SUPPORT && <SupportPage currentUser={userData!} locale={region} addToast={addToast} />}
        {activeRoute === AppRoute.MARKETPLACE && <ResonanceMarketplace userData={userData!} addToast={addToast} />}
      </Layout>

      {/* Global Overlays */}
      {viewingPost && (
        <div className="fixed inset-0 z-[1100] bg-white dark:bg-[#020617] overflow-y-auto no-scrollbar scroll-viewport">
          <SinglePostView 
            post={viewingPost} userData={userData} locale={region} 
            onClose={() => setViewingPost(null)} onLike={handleLike} onBookmark={handleBookmark} 
            addToast={addToast} blockedIds={blockedIds}
          />
        </div>
      )}

      {viewingProfile && (
        <div className="fixed inset-0 z-[1100] bg-white dark:bg-[#020617] overflow-y-auto no-scrollbar scroll-viewport">
          <ProfilePage 
            userData={viewingProfile} onUpdateProfile={() => {}} addToast={addToast} locale={region} 
            sessionStartTime={Date.now()} onViewPost={setViewingPost} onViewProfile={setViewingProfile} 
            onLike={handleLike} onBookmark={handleBookmark} blockedIds={blockedIds}
          />
          <button 
            onClick={() => setViewingProfile(null)}
            className="fixed top-6 right-6 z-[1200] p-4 bg-slate-950 dark:bg-white text-white dark:text-slate-900 rounded-full shadow-2xl active:scale-90"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg>
          </button>
        </div>
      )}

      {viewingGathering && (
        <div className="fixed inset-0 z-[1100] bg-white dark:bg-[#020617] overflow-y-auto no-scrollbar scroll-viewport p-6">
          <SingleGatheringView 
            gathering={viewingGathering} currentUser={userData!} allUsers={allUsers} locale={region}
            onBack={() => setViewingGathering(null)} onDelete={() => {}} onRSVP={handleRSVP} onOpenLobby={setActiveLobbyGathering}
          />
        </div>
      )}

      {activeLobbyGathering && (
        <div className="fixed inset-0 z-[2500] bg-white dark:bg-slate-900 flex flex-col">
            <ClustersPage 
                currentUser={userData!} locale={region} addToast={addToast} 
                onOpenChat={() => {}} allUsers={allUsers} weather={weather} 
                initialClusterId={activeLobbyGathering.linkedChatId}
            />
            <button 
                onClick={() => setActiveLobbyGathering(null)}
                className="fixed top-4 right-4 z-[2600] p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg>
            </button>
        </div>
      )}

      {isSettingsOpen && (
        <SettingsOverlay 
            userData={userData!} onClose={() => setIsSettingsOpen(false)} 
            onLogout={handleLogout} addToast={addToast} 
        />
      )}

      {isBroadcasting && activeStreamId && (
        <LiveBroadcastOverlay 
            userData={userData!} onStart={() => {}} onEnd={() => { setIsBroadcasting(false); setActiveStreamId(null); }} 
            activeStreamId={activeStreamId}
        />
      )}

      {activeStream && (
        <LiveWatcherOverlay stream={activeStream} onLeave={() => setActiveStream(null)} />
      )}
    </div>
  );
};

export default App;
