
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Layout } from './components/layout/Layout';
import { PostCard } from './components/feed/PostCard';
import { Toast } from './components/ui/Toast';
import { LandingPage } from './components/landing/LandingPage';
import { AdminPanel } from './components/admin/AdminPanel';
import { ProfilePage } from './components/profile/ProfilePage';
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
  getDocs,
  limit,
  where
} from 'firebase/firestore';
import { uploadToCloudinary } from './services/cloudinary';
import { ICONS } from './constants';

const SESSION_KEY = 'vibestream_session_2026';
const ROUTE_KEY = 'vibestream_active_route';

const MaintenanceOverlay: React.FC = () => (
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
        Infrastructure<br />Maintenance
      </h1>
      <div className="space-y-4">
        <p className="text-slate-400 font-mono text-xs uppercase tracking-[0.3em]">Protocol_Interrupted • GB_NODE_OVR</p>
        <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-sm mx-auto">
          The VibeStream Neural Grid is currently undergoing scheduled synchronization. All nodes are temporarily suspended.
        </p>
      </div>
      <div className="pt-8 flex justify-center gap-4">
        <div className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
          ETA: 14:00 GMT
        </div>
        <div className="px-5 py-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[9px] font-black text-indigo-400 uppercase tracking-widest font-mono">
          Priority Sync
        </div>
      </div>
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
  const [sessionStartTime] = useState<number>(Date.now());
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    registrationDisabled: false,
    minTrustTier: 'Gamma',
    lastUpdatedBy: '',
    updatedAt: ''
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
      addToast("Session Terminated", "info");
    }
  };

  // Real-time System Control Sync
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

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        localStorage.setItem(SESSION_KEY, 'active');
        
        if (db) {
          try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            
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
                username: user.email?.split('@')[0] || `node_${user.uid.slice(0, 5)}`,
                displayName: user.displayName || user.email?.split('@')[0] || 'Member',
                bio: 'Citadel User.',
                avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
                coverUrl: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80',
                followers: 0,
                following: 0,
                role: 'member',
                location: 'United Kingdom',
                joinedAt: new Date().toISOString(),
                badges: [],
                trustTier: 'Gamma'
              };
              await setDoc(doc(db, 'users', user.uid), newProfile);
              setUserData({ id: user.uid, ...newProfile } as VibeUser);
            }
          } catch (e) {
            console.error("User Data Sync Failure:", e);
          }
        }
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setUserData(null);
        localStorage.removeItem(SESSION_KEY);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time Posts Stream
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
        const isLiked = postSnap.data().likedBy?.includes(userData.id);
        await updateDoc(postRef, {
          likes: increment(isLiked ? -1 : 1),
          likedBy: isLiked 
            ? postSnap.data().likedBy.filter((id: string) => id !== userData.id)
            : [...(postSnap.data().likedBy || []), userData.id]
        });
      }
    } catch (e) { addToast("Sync Error: Pulse Interrupted", "error"); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
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
        createdAt: 'Just now',
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

  // Global Maintenance Lock
  if (systemSettings.maintenanceMode && userData?.role !== 'admin') {
    return <MaintenanceOverlay />;
  }

  if (isLoading) {
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
    switch (activeRoute) {
      case AppRoute.ADMIN:
        return userData?.role === 'admin' ? <AdminPanel addToast={addToast} locale={userRegion} systemSettings={systemSettings} /> : <div className="text-center py-20 font-black">UNAUTHORISED ACCESS</div>;
      case AppRoute.PROFILE:
        return <ProfilePage userData={userData!} onUpdateProfile={(d) => setUserData({...userData!, ...d})} addToast={addToast} locale={userRegion} sessionStartTime={sessionStartTime} />;
      default:
        return (
          <div className="space-y-6 animate-in fade-in duration-700">
            <div className="flex flex-col gap-1 mb-8">
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter">CENTRAL_HUB</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Infrastructure Relay Active • GB-LON</p>
            </div>
            {posts.map(post => (
              <PostCard key={post.id} post={post} onLike={handleLike} locale={userRegion} />
            ))}
          </div>
        );
    }
  };

  return (
    <Layout 
      activeRoute={activeRoute} 
      onNavigate={handleNavigate} 
      onOpenCreate={() => setIsCreateModalOpen(true)}
      onLogout={handleLogout}
      userData={userData}
      userRole={userData?.role}
      currentRegion={userRegion}
      onRegionChange={setUserRegion}
    >
      {renderContent()}

      {/* Toasts System */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[1000] flex flex-col gap-3 pointer-events-none w-full max-w-sm px-4">
        {toasts.map(toast => <Toast key={toast.id} toast={toast} onClose={removeToast} />)}
      </div>

      {/* Create Transmission Modal */}
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
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
              
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
