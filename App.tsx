
import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/layout/Layout';
import { FeedPage } from './components/feed/FeedPage'; 
import { Toast } from './components/ui/Toast';
import { LandingPage } from './components/landing/LandingPage';
import { AdminPanel } from './components/admin/AdminPanel';
import { ProfilePage } from './components/profile/ProfilePage';
import { ExplorePage } from './components/explore/ExplorePage';
import { MessagesPage } from './components/messages/MessagesPage';
import { StreamGridPage } from './components/streams/StreamGridPage';
import { LiveBroadcastOverlay } from './components/streams/LiveBroadcastOverlay';
import { LiveWatcherOverlay } from './components/streams/LiveWatcherOverlay';
import { PrivacyPage } from './components/legal/PrivacyPage';
import { TermsPage } from './components/legal/TermsPage';
import { CookiesPage } from './components/legal/CookiesPage';
import { AppRoute, Post, ToastMessage, Region, User as VibeUser, SystemSettings, LiveStream, AppNotification, SignalAudience } from './types';
import { db, auth } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  serverTimestamp,
  updateDoc,
  doc,
  increment,
  getDoc,
  setDoc,
  limit,
  deleteDoc,
  where
} from 'firebase/firestore';
import { uploadToCloudinary } from './services/cloudinary';
import { ICONS } from './constants';

const SESSION_KEY = 'vibestream_session_2026';
const ROUTE_KEY = 'vibestream_active_route';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(SESSION_KEY) === 'active';
    }
    return false;
  });
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userData, setUserData] = useState<VibeUser | null>(null);

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    registrationDisabled: false,
    minTrustTier: 'Gamma',
    lastUpdatedBy: '',
    updatedAt: '',
    featureFlags: {}
  });
  
  const [activeRoute, setActiveRoute] = useState<AppRoute>(() => {
    if (typeof window !== 'undefined') {
      const savedRoute = localStorage.getItem(ROUTE_KEY) as AppRoute;
      return Object.values(AppRoute).includes(savedRoute) ? savedRoute : AppRoute.FEED;
    }
    return AppRoute.FEED;
  });

  const [posts, setPosts] = useState<Post[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setUserToasts] = useState<ToastMessage[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLiveOverlayOpen, setIsLiveOverlayOpen] = useState(false);
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null);
  const [watchingStream, setWatchingStream] = useState<LiveStream | null>(null);
  
  const [newPostText, setNewPostText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<{url: string, type: string}[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [postLocation, setPostLocation] = useState<string | null>(null);
  const [postAudience, setPostAudience] = useState<SignalAudience>('global');
  
  const [userRegion, setUserRegion] = useState<Region>('en-GB');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setUserToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setUserToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleNavigate = (route: AppRoute) => {
    setActiveRoute(route);
    localStorage.setItem(ROUTE_KEY, route);
  };

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      setIsAuthenticated(false);
      localStorage.removeItem(SESSION_KEY);
      addToast("Session Terminated", "info");
    }
  };

  useEffect(() => {
    if (!auth) { setIsLoading(false); return; }
    const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        if (db) {
          onSnapshot(doc(db, 'users', user.uid), (userDoc) => {
            if (userDoc.exists()) setUserData({ id: userDoc.id, ...userDoc.data() } as VibeUser);
          });
          
          // Real-time Notifications Buffer
          const qNotif = query(collection(db, 'notifications'), where('toUserId', '==', user.uid), orderBy('timestamp', 'desc'), limit(20));
          onSnapshot(qNotif, (snap) => {
            setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification)));
          });
        }
      } else {
        setIsAuthenticated(false);
        setUserData(null);
      }
      setIsLoading(false);
    });
    return () => authUnsubscribe();
  }, []);

  useEffect(() => {
    if (!db || !isAuthenticated) return;
    const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'), limit(50));
    return onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        isLiked: doc.data().likedBy?.includes(auth.currentUser?.uid)
      } as Post)));
    });
  }, [isAuthenticated]);

  const fetchCurrentLocation = () => {
    if (!navigator.geolocation) {
      addToast("Geospatial locking unavailable", "error");
      return;
    }
    addToast("Searching for local node...", "info");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPostLocation(`NODE_GB_CENTRAL`);
        addToast("Geospatial coordinates locked", "success");
      },
      () => addToast("Signal interference: Location lock failed", "error")
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > 5) {
      addToast("Transmission overload: Limit 5 artifacts per signal", "error");
      return;
    }
    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);
    const newPreviews = files.map(f => ({
      url: URL.createObjectURL(f),
      type: f.type.startsWith('video/') ? 'video' : 'image'
    }));
    setFilePreviews([...filePreviews, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    const updatedFiles = [...selectedFiles];
    updatedFiles.splice(index, 1);
    setSelectedFiles(updatedFiles);
    const updatedPreviews = [...filePreviews];
    URL.revokeObjectURL(updatedPreviews[index].url);
    updatedPreviews.splice(index, 1);
    setFilePreviews(updatedPreviews);
  };

  const handleCreatePost = async () => {
    if (!newPostText.trim() && selectedFiles.length === 0) return;
    if (!db || !userData) return;
    setIsUploading(true);
    addToast("Initiating Neural Uplink...", "info");
    try {
      const mediaUplinks = selectedFiles.map(async (file) => {
        const url = await uploadToCloudinary(file);
        return { type: file.type.startsWith('video/') ? 'video' : 'image' as any, url };
      });
      const mediaItems = await Promise.all(mediaUplinks);
      await addDoc(collection(db, 'posts'), {
        authorId: userData.id,
        authorName: userData.displayName,
        authorAvatar: userData.avatarUrl,
        content: newPostText,
        media: mediaItems,
        likes: 0,
        comments: 0,
        shares: 0,
        createdAt: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        timestamp: serverTimestamp(),
        likedBy: [],
        location: postLocation,
        audience: postAudience,
        bookmarkedBy: []
      });
      setNewPostText('');
      setSelectedFiles([]);
      setFilePreviews([]);
      setPostLocation(null);
      setIsCreateModalOpen(false);
      addToast("Signal Successfully Published", "success");
    } catch (error) {
      addToast("Transmission Interrupted: Buffer Failure", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!db || !userData) return;
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    if (postSnap.exists()) {
      const data = postSnap.data();
      const likedBy = data.likedBy || [];
      const isLiked = likedBy.includes(userData.id);
      
      await updateDoc(postRef, {
        likes: increment(isLiked ? -1 : 1),
        likedBy: isLiked ? likedBy.filter((id: string) => id !== userData.id) : [...likedBy, userData.id]
      });

      // Notify owner if not self
      if (!isLiked && data.authorId !== userData.id) {
        await addDoc(collection(db, 'notifications'), {
          type: 'like',
          fromUserId: userData.id,
          fromUserName: userData.displayName,
          fromUserAvatar: userData.avatarUrl,
          toUserId: data.authorId,
          targetId: postId,
          text: "pulsed your signal",
          isRead: false,
          timestamp: serverTimestamp()
        });
      }
      
      addToast(isLiked ? "Pulse Removed" : "Pulse Synchronised", "info");
    }
  };

  const handleMarkRead = async () => {
    if (!db || !auth.currentUser) return;
    notifications.filter(n => !n.isRead).forEach(async n => {
      await updateDoc(doc(db, 'notifications', n.id), { isRead: true });
    });
  };

  if (isLoading) return <div className="h-full w-full flex items-center justify-center font-black animate-pulse text-indigo-600 uppercase italic">Syncing_Neural_Buffer...</div>;
  if (!isAuthenticated) return <LandingPage onEnter={() => setIsAuthenticated(true)} systemSettings={systemSettings} />;

  return (
    <Layout 
      activeRoute={activeRoute} onNavigate={handleNavigate} 
      onOpenCreate={() => setIsCreateModalOpen(true)}
      onLogout={handleLogout} userData={userData} notifications={notifications}
      onMarkRead={handleMarkRead} userRole={userData?.role} currentRegion={userRegion}
      onRegionChange={setUserRegion}
    >
      {activeRoute === AppRoute.FEED && (
        <FeedPage 
          posts={posts} userData={userData} onLike={handleLike} 
          onOpenCreate={() => setIsCreateModalOpen(true)}
          onTransmitStory={() => {}} onGoLive={() => setIsLiveOverlayOpen(true)}
          onJoinStream={(s) => setWatchingStream(s)} locale={userRegion}
        />
      )}

      {activeRoute === AppRoute.EXPLORE && <ExplorePage posts={posts} onLike={handleLike} locale={userRegion} />}
      {activeRoute === AppRoute.MESSAGES && userData && <MessagesPage currentUser={userData} locale={userRegion} addToast={addToast} />}
      {activeRoute === AppRoute.PROFILE && userData && (
        <ProfilePage 
          userData={userData} 
          onUpdateProfile={(d) => setUserData(prev => prev ? { ...prev, ...d } : null)} 
          addToast={addToast} 
          locale={userRegion} 
          sessionStartTime={Date.now()}
        />
      )}
      {activeRoute === AppRoute.STREAM_GRID && <StreamGridPage locale={userRegion} onJoinStream={setWatchingStream} onGoLive={() => setIsLiveOverlayOpen(true)} />}
      {activeRoute === AppRoute.ADMIN && <AdminPanel addToast={addToast} locale={userRegion} systemSettings={systemSettings} />}
      {activeRoute === AppRoute.PRIVACY && <PrivacyPage />}
      {activeRoute === AppRoute.TERMS && <TermsPage />}
      {activeRoute === AppRoute.COOKIES && <CookiesPage />}

      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[3000] flex flex-col gap-3 pointer-events-none w-full max-w-sm px-4">
        {toasts.map(toast => <Toast key={toast.id} toast={toast} onClose={removeToast} />)}
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-end md:items-center justify-center p-0 md:p-6 overflow-hidden">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => !isUploading && setIsCreateModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl md:rounded-[3.5rem] h-[95vh] md:h-auto max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-20 duration-500 overflow-hidden">
            <div className="px-8 py-6 md:py-8 border-b border-slate-50 flex items-center justify-between shrink-0">
               <div>
                 <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Create_Signal</h2>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Channel: GB-NODE-2.6</p>
               </div>
               <button onClick={() => setIsCreateModalOpen(false)} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all active:scale-90">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar p-8">
              <div className="flex items-start gap-5 mb-8">
                <img src={userData?.avatarUrl} className="w-12 h-12 rounded-[1.2rem] object-cover border border-slate-100 shadow-sm" alt="" />
                <div className="flex-1">
                   <div className="flex gap-2 mb-3">
                     <button onClick={() => setPostAudience(postAudience === 'global' ? 'mesh' : 'global')} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:bg-white transition-all shadow-sm">
                        {postAudience.toUpperCase()}_GRID
                     </button>
                     {postLocation && <button onClick={() => setPostLocation(null)} className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest"> {postLocation} </button>}
                   </div>
                   <textarea value={newPostText} onChange={(e) => setNewPostText(e.target.value)} placeholder="Broadcast your frequency..." className="w-full h-32 bg-transparent border-none p-0 text-xl font-medium placeholder:text-slate-200 focus:ring-0 resize-none transition-all" />
                </div>
              </div>
              {filePreviews.length > 0 && (
                <div className={`grid gap-3 mb-8 ${filePreviews.length === 1 ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3'}`}>
                  {filePreviews.map((prev, idx) => (
                    <div key={idx} className="relative aspect-square rounded-[1.5rem] overflow-hidden border border-slate-100 group shadow-md">
                      {prev.type === 'video' ? <video src={prev.url} className="w-full h-full object-cover" muted /> : <img src={prev.url} className="w-full h-full object-cover" alt="" />}
                      <button onClick={() => removeFile(idx)} className="absolute top-3 right-3 p-2 bg-black/40 backdrop-blur-md text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all active:scale-90"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-8 border-t border-slate-50 bg-slate-50/50 shrink-0">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex gap-3">
                    <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-indigo-600 transition-all active:scale-90"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z" /></svg></button>
                    <button onClick={fetchCurrentLocation} className={`p-4 border rounded-2xl transition-all active:scale-90 ${postLocation ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-emerald-600'}`}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg></button>
                  </div>
               </div>
               <input type="file" ref={fileInputRef} multiple className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
               <button onClick={handleCreatePost} disabled={isUploading || (!newPostText.trim() && selectedFiles.length === 0)} className="w-full py-6 md:py-8 bg-indigo-600 text-white rounded-[2rem] md:rounded-[2.5rem] font-black text-sm md:text-base uppercase tracking-[0.4em] shadow-2xl hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-4 italic">{isUploading ? 'SYNCHRONIZING...' : 'Broadcast_Signal'}</button>
            </div>
            {isUploading && <div className="absolute inset-x-0 bottom-0 h-1.5 bg-indigo-50 overflow-hidden"><div className="h-full bg-indigo-600 animate-[pulse_2s_infinite] w-full origin-left" /></div>}
          </div>
        </div>
      )}

      {isLiveOverlayOpen && userData && (
        <LiveBroadcastOverlay 
          userData={userData} 
          onStart={async (title) => {
            const streamRef = await addDoc(collection(db, 'streams'), {
              authorId: userData.id,
              authorName: userData.displayName,
              authorAvatar: userData.avatarUrl,
              title,
              thumbnailUrl: userData.avatarUrl,
              viewerCount: 0,
              startedAt: serverTimestamp(),
              category: 'Global'
            });
            setActiveStreamId(streamRef.id);
          }} 
          onEnd={async () => {
            if (activeStreamId) await deleteDoc(doc(db, 'streams', activeStreamId));
            setActiveStreamId(null);
            setIsLiveOverlayOpen(false);
          }}
          activeStreamId={activeStreamId}
        />
      )}

      {watchingStream && (
        <LiveWatcherOverlay 
          stream={watchingStream} 
          onLeave={() => setWatchingStream(null)} 
        />
      )}
    </Layout>
  );
};

export default App;
