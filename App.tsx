
import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/layout/Layout';
import { FeedPage } from './components/feed/FeedPage'; 
import { Toast } from './components/ui/Toast';
import { LandingPage } from './components/landing/LandingPage';
import { AdminPanel } from './components/admin/AdminPanel';
import { ProfilePage } from './components/profile/ProfilePage';
import { ExplorePage } from './components/explore/ExplorePage';
import { MessagesPage } from './components/messages/MessagesPage';
import { NotificationsPage } from './components/notifications/NotificationsPage';
import { StreamGridPage } from './components/streams/StreamGridPage';
import { LiveBroadcastOverlay } from './components/streams/LiveBroadcastOverlay';
import { LiveWatcherOverlay } from './components/streams/LiveWatcherOverlay';
import { SinglePostView } from './components/feed/SinglePostView';
import { PrivacyPage } from './components/legal/PrivacyPage';
import { TermsPage } from './components/legal/TermsPage';
import { CookiesPage } from './components/legal/CookiesPage';
import { AppRoute, Post, ToastMessage, Region, User as VibeUser, SystemSettings, LiveStream, AppNotification, SignalAudience, PresenceStatus, WeatherInfo } from './types';
import { db, auth } from './services/firebase';
import * as FirebaseAuth from 'firebase/auth';
const { onAuthStateChanged, signOut } = FirebaseAuth as any;
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
  where,
  writeBatch,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { uploadToCloudinary } from './services/cloudinary';
import { ICONS, PRESENCE_CONFIG } from './constants';
import { EmojiPicker } from './components/ui/EmojiPicker';
import { GiphyPicker } from './components/ui/GiphyPicker';
import { GiphyGif } from './services/giphy';
import { fetchWeather } from './services/weather';

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
  const [allUsers, setAllUsers] = useState<VibeUser[]>([]);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);

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
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [previousRoute, setPreviousRoute] = useState<AppRoute | null>(null);
  
  const [newPostText, setNewPostText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedGifs, setSelectedGifs] = useState<GiphyGif[]>([]);
  const [filePreviews, setFilePreviews] = useState<{url: string, type: string, isGif?: boolean}[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [postLocation, setPostLocation] = useState<string | null>(null);
  const [postAudience, setPostAudience] = useState<SignalAudience>('global');
  
  const [coAuthors, setCoAuthors] = useState<{ id: string, name: string, avatar: string }[]>([]);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isGiphyPickerOpen, setIsGiphyPickerOpen] = useState(false);

  // Universal Search Hub
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  const [userRegion, setUserRegion] = useState<Region>('en-GB');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const isInitialLoad = useRef(true);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setUserToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setUserToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    const handleGlobalToast = (e: any) => {
      if (e.detail?.msg) addToast(e.detail.msg, e.detail.type);
    };
    window.addEventListener('vibe-toast', handleGlobalToast);
    return () => window.removeEventListener('vibe-toast', handleGlobalToast);
  }, []);

  // Atmospheric Synch Protocol
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const syncAtmosphere = async () => {
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              const info = await fetchWeather({ coords: { lat: pos.coords.latitude, lon: pos.coords.longitude } });
              if (info) setWeather(info);
            },
            async () => {
              const info = await fetchWeather({ query: userData?.location || 'London' });
              if (info) setWeather(info);
            }
          );
        } else {
          const info = await fetchWeather({ query: userData?.location || 'London' });
          if (info) setWeather(info);
        }
      } catch (err) { console.debug("Atmospheric link failed"); }
    };

    syncAtmosphere();
    const interval = setInterval(syncAtmosphere, 1800000); // 30min sync
    return () => clearInterval(interval);
  }, [isAuthenticated, userData?.location]);

  const handleNavigate = (route: AppRoute) => {
    if (route !== AppRoute.SINGLE_POST) {
      setPreviousRoute(activeRoute);
      setSelectedPost(null);
    }
    setActiveRoute(route);
    localStorage.setItem(ROUTE_KEY, route);
  };

  const handleSearch = (query: string) => {
    setGlobalSearchQuery(query);
    if (query.trim()) {
      addToast(`Scanning Grid for "${query}"`, "info");
      handleNavigate(AppRoute.EXPLORE);
    }
  };

  const handleOpenPost = (post: Post) => {
    setSelectedPost(post);
    setPreviousRoute(activeRoute);
    setActiveRoute(AppRoute.SINGLE_POST);
  };

  const handleOpenCreate = (initialFiles?: File[], action?: 'gif') => {
    if (initialFiles && initialFiles.length > 0) {
      const newFiles = [...selectedFiles, ...initialFiles];
      setSelectedFiles(newFiles);
      const newPreviews = initialFiles.map(f => ({
        url: URL.createObjectURL(f),
        type: f.type.startsWith('video/') ? 'video' : 'image'
      }));
      setFilePreviews([...filePreviews, ...newPreviews]);
    }
    if (action === 'gif') {
      setIsGiphyPickerOpen(true);
    }
    setIsCreateModalOpen(true);
  };

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      setIsAuthenticated(false);
      localStorage.removeItem(SESSION_KEY);
      addToast("Session Terminated", "info");
    }
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textAreaRef.current;
    if (!textarea) {
      setNewPostText(prev => prev + emoji);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    setNewPostText(before + emoji + after);
    setIsEmojiPickerOpen(false);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  const handleGifSelect = (gif: GiphyGif) => {
    if (selectedGifs.length + selectedFiles.length >= 5) {
      addToast("Mesh overload: Limit 5 fragments per signal", "error");
      return;
    }
    setSelectedGifs([...selectedGifs, gif]);
    setFilePreviews([...filePreviews, { url: gif.images.fixed_height.url, type: 'image', isGif: true }]);
    setIsGiphyPickerOpen(false);
    addToast("GIF Linked to Buffer", "success");
  };

  useEffect(() => {
    if (!auth) { setIsLoading(false); return; }
    const authUnsubscribe = onAuthStateChanged(auth, async (user: any) => {
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        if (db) {
          onSnapshot(doc(db, 'users', user.uid), (userDoc) => {
            if (userDoc.exists()) setUserData({ id: userDoc.id, ...userDoc.data() } as VibeUser);
          });
          
          // Universal Registry Subscription
          const qUsers = query(collection(db, 'users'), limit(100));
          onSnapshot(qUsers, (snap) => {
            setAllUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as VibeUser)));
          });

          const qNotif = query(collection(db, 'notifications'), where('toUserId', '==', user.uid), orderBy('timestamp', 'desc'), limit(50));
          onSnapshot(qNotif, (snap) => {
            const newNotifs = snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
            setNotifications(newNotifs);

            if (!isInitialLoad.current) {
              snap.docChanges().forEach(change => {
                if (change.type === 'added') {
                  const data = change.doc.data() as AppNotification;
                  addToast(`New Signal: ${data.fromUserName} ${data.text}`, 'info');
                }
              });
            }
            isInitialLoad.current = false;
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
    const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'), limit(100));
    return onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        isLiked: doc.data().likedBy?.includes(auth.currentUser?.uid)
      } as Post));
      setPosts(fetchedPosts);
      
      if (selectedPost) {
        const updated = fetchedPosts.find(p => p.id === selectedPost.id);
        if (updated) setSelectedPost(updated);
      }
    });
  }, [isAuthenticated, selectedPost?.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length + selectedGifs.length > 5) {
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
    const previewToRemove = filePreviews[index];
    const newPreviews = [...filePreviews];
    newPreviews.splice(index, 1);
    setFilePreviews(newPreviews);

    if (previewToRemove.isGif) {
      const newGifs = selectedGifs.filter(g => g.images.fixed_height.url !== previewToRemove.url);
      setSelectedGifs(newGifs);
    } else {
      const gifCountBefore = filePreviews.slice(0, index).filter(p => p.isGif).length;
      const fileIndex = index - gifCountBefore;
      const newFiles = [...selectedFiles];
      URL.revokeObjectURL(previewToRemove.url);
      newFiles.splice(fileIndex, 1);
      setSelectedFiles(newFiles);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostText.trim() && selectedFiles.length === 0 && selectedGifs.length === 0) return;
    if (!db || !userData) return;
    setIsUploading(true);
    addToast("Initiating Neural Uplink...", "info");

    const contentLen = newPostText.trim().length;
    let contentLengthTier: 'pulse' | 'standard' | 'deep' = 'standard';
    if (contentLen < 80) contentLengthTier = 'pulse';
    else if (contentLen > 280) contentLengthTier = 'deep';

    try {
      const mediaUplinks = selectedFiles.map(async (file) => {
        const url = await uploadToCloudinary(file);
        return { type: file.type.startsWith('video/') ? 'video' : 'image' as any, url };
      });
      const uploadedFiles = await Promise.all(mediaUplinks);
      const gifMedia = selectedGifs.map(g => ({ type: 'image' as any, url: g.images.original.url }));
      const mediaItems = [...uploadedFiles, ...gifMedia];

      await addDoc(collection(db, 'posts'), {
        authorId: userData.id,
        authorName: userData.displayName,
        authorAvatar: userData.avatarUrl,
        content: newPostText,
        contentLengthTier,
        coAuthors: coAuthors,
        capturedStatus: {
          emoji: userData.statusEmoji || '⚡',
          message: userData.statusMessage || ''
        },
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
      setSelectedGifs([]);
      setFilePreviews([]);
      setPostLocation(null);
      setCoAuthors([]);
      setIsCreateModalOpen(false);
      addToast("Signal Successfully Published", "success");
    } catch (error) {
      addToast("Transmission Interrupted: Buffer Failure", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleLike = async (postId: string, frequency?: string) => {
    if (!db || !auth.currentUser) {
      addToast("Connection to grid lost. Neural link required.", "error");
      return;
    }
    const postRef = doc(db, 'posts', postId);
    const userId = auth.currentUser.uid;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const isLiked = post.likedBy?.includes(userId);
    try {
      if (isLiked) {
        await updateDoc(postRef, {
          likes: increment(-1),
          likedBy: arrayRemove(userId)
        });
        addToast("Pulse Recalled", "info");
      } else {
        await updateDoc(postRef, {
          likes: increment(1),
          likedBy: arrayUnion(userId)
        });
        if (post.authorId !== userId) {
          await addDoc(collection(db, 'notifications'), {
            type: 'like',
            fromUserId: userId,
            fromUserName: userData?.displayName || 'Identity Node',
            fromUserAvatar: userData?.avatarUrl || '',
            toUserId: post.authorId,
            targetId: postId,
            pulseFrequency: frequency || 'pulse',
            text: `pulsed your transmission`,
            isRead: false,
            timestamp: serverTimestamp()
          });
        }
        addToast(`${(frequency || 'pulse').toUpperCase()} Synchronised`, "success");
      }
    } catch (error) {
      addToast("Transmission failure: Pulse rejected", "error");
    }
  };

  if (isLoading) return <div className="h-full w-full flex items-center justify-center font-black animate-pulse text-indigo-600 uppercase italic">Syncing_Neural_Buffer...</div>;
  if (!isAuthenticated) return <LandingPage onEnter={() => setIsAuthenticated(true)} systemSettings={systemSettings} />;

  return (
    <Layout 
      activeRoute={activeRoute} onNavigate={handleNavigate} 
      onOpenCreate={() => handleOpenCreate()}
      onLogout={handleLogout} userData={userData} notifications={notifications}
      onMarkRead={() => {}} onDeleteNotification={() => {}} userRole={userData?.role} currentRegion={userRegion}
      onRegionChange={setUserRegion}
      onSearch={handleSearch}
    >
      {activeRoute === AppRoute.FEED && (
        <FeedPage 
          posts={posts} userData={userData} onLike={handleLike} 
          onOpenCreate={handleOpenCreate}
          onTransmitStory={() => {}} onGoLive={() => setIsLiveOverlayOpen(true)}
          onJoinStream={(s) => setWatchingStream(s)} locale={userRegion}
          onViewPost={handleOpenPost}
        />
      )}

      {activeRoute === AppRoute.EXPLORE && (
        <ExplorePage 
          posts={posts} 
          users={allUsers}
          onLike={handleLike} locale={userRegion} 
          onViewPost={handleOpenPost} 
          searchQuery={globalSearchQuery}
          onClearSearch={() => setGlobalSearchQuery('')}
        />
      )}
      
      {activeRoute === AppRoute.SINGLE_POST && selectedPost && (
        <SinglePostView 
          post={selectedPost} 
          userData={userData} 
          locale={userRegion} 
          onClose={() => handleNavigate(previousRoute || AppRoute.FEED)}
          onLike={handleLike}
          addToast={addToast}
        />
      )}

      {activeRoute === AppRoute.MESSAGES && userData && <MessagesPage currentUser={userData} locale={userRegion} addToast={addToast} weather={weather} />}
      {activeRoute === AppRoute.NOTIFICATIONS && (
        <NotificationsPage 
          notifications={notifications} 
          onDelete={() => {}} 
          onMarkRead={() => {}} 
          addToast={addToast} 
          locale={userRegion}
          userData={userData}
        />
      )}
      {activeRoute === AppRoute.PROFILE && userData && (
        <ProfilePage 
          userData={userData} 
          onUpdateProfile={(d) => setUserData(prev => prev ? { ...prev, ...d } : null)} 
          addToast={addToast} 
          locale={userRegion} 
          sessionStartTime={Date.now()}
          onViewPost={handleOpenPost}
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
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 md:p-6 overflow-hidden">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => !isUploading && setIsCreateModalOpen(false)}></div>
          
          <div className="relative bg-white w-full max-w-2xl md:rounded-[4rem] h-[95vh] md:h-auto max-h-[95vh] flex flex-col shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-20 duration-700 overflow-hidden border border-white">
            
            {isGiphyPickerOpen && (
              <div className="absolute inset-0 z-[2700] p-4 md:p-10 flex items-center justify-center bg-slate-950/20 backdrop-blur-md animate-in fade-in duration-500">
                <div className="absolute inset-0" onClick={() => setIsGiphyPickerOpen(false)} />
                <div className="relative w-full max-w-lg shadow-2xl">
                   <GiphyPicker onSelect={handleGifSelect} onClose={() => setIsGiphyPickerOpen(false)} />
                </div>
              </div>
            )}

            {isEmojiPickerOpen && (
              <div className="absolute inset-0 z-[2700] p-4 md:p-10 flex items-center justify-center bg-slate-950/20 backdrop-blur-md animate-in fade-in duration-500">
                <div className="absolute inset-0" onClick={() => setIsEmojiPickerOpen(false)} />
                <div className="relative w-full max-w-lg shadow-2xl">
                   <EmojiPicker onSelect={insertEmoji} onClose={() => setIsEmojiPickerOpen(false)} />
                </div>
              </div>
            )}

            <button 
              onClick={() => setIsCreateModalOpen(false)} 
              className="absolute top-8 right-8 z-[200] p-3.5 bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-[1.4rem] transition-all active:scale-90 shadow-sm border border-slate-100"
            >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="flex-1 overflow-y-auto no-scrollbar p-10 md:p-14 pt-20">
              <div className="flex items-start gap-6 mb-10">
                <div className="relative shrink-0">
                  <img src={userData?.avatarUrl} className="w-14 h-14 md:w-16 md:h-16 rounded-[1.6rem] object-cover border-2 border-slate-50 shadow-md" alt="" />
                </div>
                <div className="flex-1">
                   <textarea 
                    ref={textAreaRef}
                    value={newPostText} 
                    onChange={(e) => setNewPostText(e.target.value)} 
                    placeholder="Broadcast your frequency..." 
                    className="w-full min-h-[160px] bg-transparent border-none p-0 text-2xl md:text-3xl font-black placeholder:text-slate-100 focus:ring-0 resize-none transition-all tracking-tight italic" 
                   />
                </div>
              </div>

              {filePreviews.length > 0 && (
                <div className={`grid gap-4 mb-10 ${filePreviews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {filePreviews.map((prev, idx) => (
                    <div key={idx} className="relative aspect-video rounded-[2.5rem] overflow-hidden border border-slate-100 group shadow-lg bg-slate-50">
                      {prev.type === 'video' ? <video src={prev.url} className="w-full h-full object-cover" muted /> : <img src={prev.url} className="w-full h-full object-cover" alt="" />}
                      <button onClick={() => removeFile(idx)} className="absolute top-4 right-4 p-2.5 bg-black/40 backdrop-blur-md text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all active:scale-90"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3.5}><path d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-10 md:p-14 pt-0 shrink-0 relative bg-white">
               <div className="flex items-center gap-4 mb-10">
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="w-16 h-16 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all active:scale-90 shadow-sm"
                  >
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z" /></svg>
                  </button>
                  
                  <button 
                    onClick={() => { setIsGiphyPickerOpen(true); setIsEmojiPickerOpen(false); }}
                    className={`w-16 h-16 border-2 rounded-2xl flex items-center justify-center text-xs font-black font-mono transition-all active:scale-90 shadow-sm ${isGiphyPickerOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200 hover:text-indigo-600'}`}
                  >
                    GIF
                  </button>

                  <button 
                    onClick={() => { setIsEmojiPickerOpen(true); setIsGiphyPickerOpen(false); }}
                    className={`w-16 h-16 border-2 rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-sm ${isEmojiPickerOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200 hover:text-indigo-600'}`}
                  >
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" /></svg>
                  </button>
               </div>

               <input type="file" ref={fileInputRef} multiple className="hidden" accept="image/*,video/*,.heic,.heif,.avif,.webp" onChange={handleFileChange} />
               <button 
                 onClick={handleCreatePost} 
                 disabled={isUploading || (!newPostText.trim() && selectedFiles.length === 0 && selectedGifs.length === 0)} 
                 className="w-full py-8 md:py-10 bg-indigo-600 text-white rounded-[2.5rem] font-black text-sm md:text-base uppercase tracking-[0.6em] shadow-[0_20px_50px_rgba(79,70,229,0.35)] hover:bg-indigo-700 transition-all active:scale-[0.97] flex items-center justify-center gap-4 italic"
               >
                 {isUploading ? 'SYNCHRONIZING...' : 'Broadcast_Signal'}
               </button>
            </div>

            {isUploading && <div className="absolute inset-x-0 bottom-0 h-2 bg-indigo-100 overflow-hidden"><div className="h-full bg-indigo-600 animate-[pulse_2s_infinite] w-full origin-left" /></div>}
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
