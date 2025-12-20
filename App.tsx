
import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/layout/Layout';
import { PostCard } from './components/feed/PostCard';
import { Toast } from './components/ui/Toast';
import { LandingPage } from './components/landing/LandingPage';
import { AdminPanel } from './components/admin/AdminPanel';
import { ProfilePage } from './components/profile/ProfilePage';
import { ExplorePage } from './components/explore/ExplorePage';
import { MessagesPage } from './components/messages/MessagesPage';
import { PrivacyPage } from './components/legal/PrivacyPage';
import { TermsPage } from './components/legal/TermsPage';
import { CookiesPage } from './components/legal/CookiesPage';
import { AppRoute, Post, ToastMessage, UserRole, Region, User as VibeUser, SystemSettings } from './types';
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
  limit
} from 'firebase/firestore';
import { uploadToCloudinary } from './services/cloudinary';
import { ICONS } from './constants';

const SESSION_KEY = 'vibestream_session_2026';
const SESSION_START_KEY = 'vibestream_session_start_timestamp';
const ROUTE_KEY = 'vibestream_active_route';

const MaintenanceOverlay: React.FC<{ type?: 'system' | 'feature' }> = ({ type = 'system' }) => (
  <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
    <div className="absolute inset-0 opacity-10 pointer-events-none">
      <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] w-full h-full">
        {Array.from({ length: 400 }).map((_, i) => (
          <div key={i} className="border-t border-l border-white h-full" />
        ))}
      </div>
    </div>
    <div className="relative z-10 max-w-lg space-y-8">
      <div className="w-24 h-24 bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 flex items-center justify-center mx-auto mb-10 shadow-2xl">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
      <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase leading-none italic">
        {type === 'system' ? 'Infrastructure' : 'Protocol'}<br />Maintenance
      </h1>
      <div className="space-y-4">
        <p className="text-slate-400 font-mono text-xs uppercase tracking-[0.3em]">
          {type === 'system' ? 'Protocol_Interrupted • GB_NODE_OVR' : 'Module_Recalibration • GB_SYNC_WAIT'}
        </p>
        <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-sm mx-auto">
          {type === 'system' 
            ? 'The VibeStream Neural Grid is currently undergoing scheduled synchronization. All nodes are temporarily suspended.'
            : 'This specific module is currently undergoing performance calibration. Normal service will resume shortly.'}
        </p>
      </div>
    </div>
  </div>
);

const NodePlaceholder: React.FC<{ title: string, subtitle: string }> = ({ title, subtitle }) => (
  <div className="py-32 px-10 text-center bg-white rounded-[3rem] border-precision shadow-sm animate-in fade-in slide-in-from-bottom-6 duration-700">
     <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner border border-slate-100">
        <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse" />
     </div>
     <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic mb-2">{title}</h2>
     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">{subtitle}</p>
     <div className="mt-10 flex flex-wrap justify-center gap-4">
        <div className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest font-mono">Status: Initializing</div>
        <div className="px-6 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest font-mono border border-indigo-100">Layer: GB-Node-2.6</div>
     </div>
  </div>
);

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(SESSION_KEY) === 'active';
    }
    return false;
  });
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userData, setUserData] = useState<VibeUser | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(SESSION_START_KEY);
      return saved ? parseInt(saved, 10) : Date.now();
    }
    return Date.now();
  });

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
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setUserToasts] = useState<ToastMessage[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
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
      localStorage.removeItem(SESSION_START_KEY);
      addToast("Session Terminated", "info");
    }
  };

  useEffect(() => {
    if (!db) return;
    const unsub = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setSystemSettings(docSnap.data() as SystemSettings);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }

    let userUnsubscribe: (() => void) | null = null;

    const authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        localStorage.setItem(SESSION_KEY, 'active');
        
        if (!localStorage.getItem(SESSION_START_KEY)) {
          const now = Date.now();
          localStorage.setItem(SESSION_START_KEY, now.toString());
          setSessionStartTime(now);
        }

        if (db) {
          const userDocRef = doc(db, 'users', user.uid);
          userUnsubscribe = onSnapshot(userDocRef, async (userDoc) => {
            if (userDoc.exists()) {
              const data = userDoc.data() as any;
              if (data.isSuspended) {
                 await signOut(auth);
                 addToast("Access Denied: Node Suspended", "error");
                 return;
              }
              setUserData({ id: userDoc.id, ...data } as VibeUser);
            } else {
              const newProfile: any = {
                username: `node_${user.uid.slice(0, 5)}`,
                displayName: user.displayName || 'Unnamed Node',
                bio: '',
                avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
                coverUrl: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80',
                followers: 0,
                following: 0,
                role: 'member',
                location: '',
                joinedAt: new Date().toISOString(),
                badges: [],
                trustTier: 'Gamma',
                presenceStatus: 'Online',
                statusEmoji: '⚡',
                statusMessage: ''
              };
              await setDoc(doc(db, 'users', user.uid), newProfile);
            }
          });
        }
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setUserData(null);
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(SESSION_START_KEY);
        if (userUnsubscribe) userUnsubscribe();
      }
      setIsLoading(false);
    });

    return () => {
      authUnsubscribe();
      if (userUnsubscribe) userUnsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!db || !isAuthenticated) return;
    const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Post));
      setPosts(postsData);
    });
    return () => unsubscribe();
  }, [isAuthenticated]);

  const handleLike = async (postId: string) => {
    if (!db || !userData) return;
    try {
      const postRef = doc(db, 'posts', postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const likedBy = postSnap.data().likedBy || [];
        const isLiked = likedBy.includes(userData.id);
        await updateDoc(postRef, {
          likes: increment(isLiked ? -1 : 1),
          likedBy: isLiked 
            ? likedBy.filter((id: string) => id !== userData.id)
            : [...likedBy, userData.id]
        });
        addToast(isLiked ? "Pulse Removed" : "Pulse Synchronised", "info");
      }
    } catch (e) { addToast("Sync Error: Pulse Interrupted", "error"); }
  };

  const handleCreatePost = async () => {
    if (!newPostText.trim() && !selectedFile) return;
    if (!db || !userData) return;

    setIsUploading(true);
    try {
      let mediaUrl = '';
      let mediaType: 'image' | 'video' | 'file' = 'image';

      if (selectedFile) {
        mediaUrl = await uploadToCloudinary(selectedFile);
        mediaType = selectedFile.type.startsWith('video/') ? 'video' : 'image';
      }

      await addDoc(collection(db, 'posts'), {
        authorId: userData.id,
        authorName: userData.displayName,
        authorAvatar: userData.avatarUrl,
        content: newPostText,
        media: mediaUrl ? [{ type: mediaType, url: mediaUrl }] : [],
        likes: 0,
        comments: 0,
        shares: 0,
        createdAt: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        timestamp: serverTimestamp(),
        likedBy: []
      });

      setNewPostText('');
      setSelectedFile(null);
      setFilePreview(null);
      setIsCreateModalOpen(false);
      addToast("Signal Published", "success");
    } catch (error) {
      addToast("Uplink Failed", "error");
    } finally {
      setIsUploading(false);
    }
  };

  if (systemSettings.maintenanceMode && userData?.role !== 'admin') {
    return <MaintenanceOverlay type="system" />;
  }

  if (isLoading || (isAuthenticated && !userData)) {
    return (
      <div className="h-full w-full bg-[#fcfcfd] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black italic shadow-2xl animate-pulse">V</div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono animate-pulse">Initialising Grid...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage onEnter={() => setIsAuthenticated(true)} systemSettings={systemSettings} />;
  }

  const renderContent = () => {
    const user = userData!;
    
    // Feature Toggle Logic: Redirect non-admins if a feature is disabled
    const isFeatureDisabled = systemSettings.featureFlags && systemSettings.featureFlags[activeRoute] === false;
    if (isFeatureDisabled && user.role !== 'admin') {
      return <MaintenanceOverlay type="feature" />;
    }

    switch (activeRoute) {
      case AppRoute.ADMIN:
        return user.role === 'admin' ? <AdminPanel addToast={addToast} locale={userRegion} systemSettings={systemSettings} /> : <div className="text-center py-20 font-black">UNAUTHORISED ACCESS</div>;
      case AppRoute.PROFILE:
        return <ProfilePage userData={user} onUpdateProfile={(d) => setUserData({...user, ...d})} addToast={addToast} locale={userRegion} sessionStartTime={sessionStartTime} />;
      case AppRoute.EXPLORE:
        return <ExplorePage posts={posts} onLike={handleLike} locale={userRegion} />;
      case AppRoute.MESSAGES:
        return <MessagesPage currentUser={user} locale={userRegion} addToast={addToast} />;
      case AppRoute.PRIVACY:
        return <PrivacyPage />;
      case AppRoute.TERMS:
        return <TermsPage />;
      case AppRoute.COOKIES:
        return <CookiesPage />;
      
      // New 2026 Expanded Route Handlers
      case AppRoute.MESH:
        return <NodePlaceholder title="Neural Mesh" subtitle="Synchronizing network identity bonds..." />;
      case AppRoute.CLUSTERS:
        return <NodePlaceholder title="Neural Clusters" subtitle="Calibrating group frequency protocols..." />;
      case AppRoute.STREAM_GRID:
        return <NodePlaceholder title="Stream Grid" subtitle="Buffering direct visual streams..." />;
      case AppRoute.SAVED:
        return <NodePlaceholder title="Saved Signals" subtitle="Retrieving fragments from temporal vault..." />;
      case AppRoute.VERIFIED_NODES:
        return <NodePlaceholder title="Verified Nodes" subtitle="Authenticating entity nodes..." />;
      case AppRoute.GATHERINGS:
        return <NodePlaceholder title="Gatherings" subtitle="Calculating localized pulse events..." />;
      case AppRoute.SIMULATIONS:
        return <NodePlaceholder title="Simulations" subtitle="Initializing neural entertainment environment..." />;
      case AppRoute.RESILIENCE:
        return <NodePlaceholder title="Resilience Support" subtitle="Establishing humanitarian resonance uplink..." />;
      case AppRoute.TEMPORAL:
        return <NodePlaceholder title="Temporal Fragments" subtitle="Accessing historical signal database..." />;

      default:
        return (
          <div className="space-y-6 animate-in fade-in duration-700">
            <div className="flex flex-col gap-1 mb-8">
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter">CENTRAL_HUB</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Infrastructure Relay Active • GB-LON</p>
            </div>
            {posts.length > 0 ? (
              posts.map(post => (
                <PostCard key={post.id} post={post} onLike={handleLike} locale={userRegion} />
              ))
            ) : (
              <div className="py-20 text-center bg-white rounded-[3rem] border border-slate-100">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No signals detected in local buffer</p>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <Layout 
      activeRoute={activeRoute} 
      onNavigate={handleNavigate} 
      onOpenCreate={() => { setIsCreateModalOpen(true); addToast("Opening Neural Uplink", "info"); }}
      onLogout={handleLogout}
      userData={userData}
      userRole={userData?.role}
      currentRegion={userRegion}
      onRegionChange={(r) => { setUserRegion(r); addToast(`Region Switched: ${r}`, 'success'); }}
    >
      {renderContent()}

      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[1000] flex flex-col gap-3 pointer-events-none w-full max-w-sm px-4">
        {toasts.map(toast => <Toast key={toast.id} toast={toast} onClose={removeToast} />)}
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-end md:items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl" onClick={() => !isUploading && setIsCreateModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-xl rounded-t-[3rem] md:rounded-[3rem] p-8 md:p-12 shadow-2xl animate-in slide-in-from-bottom-20 duration-500">
            <div className="flex justify-between items-center mb-10">
               <div>
                 <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">New Transmission</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Neural Uplink v2.6</p>
               </div>
               <button onClick={() => setIsCreateModalOpen(false)} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>
            
            <textarea 
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              placeholder="What's the signal, member?"
              className="w-full h-40 bg-slate-50 border-none rounded-3xl p-6 text-lg font-medium placeholder:text-slate-300 focus:ring-0 resize-none transition-all"
            />

            {filePreview && (
              <div className="relative mt-4 rounded-2xl overflow-hidden group">
                {selectedFile?.type.startsWith('video/') ? (
                  <video src={filePreview} className="w-full h-48 object-cover" />
                ) : (
                  <img src={filePreview} className="w-full h-48 object-cover" alt="Preview" />
                )}
                <button onClick={() => { setSelectedFile(null); setFilePreview(null); }} className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            )}

            <div className="flex items-center justify-between mt-8">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-3 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-all active:scale-95 group"
              >
                <div className="group-hover:rotate-12 transition-transform duration-500"><ICONS.Create /></div>
                <span className="text-[10px] font-black uppercase tracking-widest">Attach Media</span>
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setSelectedFile(file);
                  const reader = new FileReader();
                  reader.onloadend = () => setFilePreview(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }} />
              
              <button 
                onClick={handleCreatePost}
                disabled={isUploading || (!newPostText.trim() && !selectedFile)}
                className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Publishing...
                  </>
                ) : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
