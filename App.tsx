import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/layout/Layout';
import { PostCard } from './components/feed/PostCard';
import { Toast } from './components/ui/Toast';
import { LandingPage } from './components/landing/LandingPage';
import { AdminPanel } from './components/admin/AdminPanel';
import { ProfilePage } from './components/profile/ProfilePage';
import { AppRoute, Post, ToastMessage, UserRole, Region, User as VibeUser } from './types';
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
  setDoc
} from 'firebase/firestore';
import { uploadToCloudinary } from './services/cloudinary';
import { ICONS } from './constants';

const SESSION_KEY = 'vibestream_session_2026';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(SESSION_KEY) === 'active';
    }
    return false;
  });
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userData, setUserData] = useState<VibeUser | null>(null);
  const [activeRoute, setActiveRoute] = useState<AppRoute>(AppRoute.FEED);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [userRegion, setUserRegion] = useState<Region>('en-GB');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleRegionChange = (newRegion: Region) => {
    setUserRegion(newRegion);
    addToast(`Neural Switch: ${newRegion}`, 'info');
  };

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
                 addToast("Access Terminated: Node Suspended", "error");
                 return;
              }
              setUserData({ 
                id: userDoc.id, 
                ...data,
                badges: data.badges || [],
                verifiedHuman: !!data.verifiedHuman,
                role: data.role || 'member',
                followers: data.followers || 0,
                following: data.following || 0,
                location: data.location || 'London, UK'
              } as VibeUser);
            } else {
              const newProfile: any = {
                username: user.email?.split('@')[0] || `node_${user.uid.slice(0, 5)}`,
                displayName: user.displayName || user.email?.split('@')[0] || 'Unknown Signal',
                bio: 'Citadel citizen.',
                avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
                coverUrl: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop',
                followers: 0,
                following: 0,
                role: 'member',
                location: 'London, UK',
                joinedAt: new Date().toISOString(),
                badges: ['Citizen'],
                verifiedHuman: false,
                isSuspended: false,
                geoNode: 'UK' // CRITICAL: Must match firestore.rules
              };
              await setDoc(userDocRef, newProfile);
              setUserData({ id: user.uid, ...newProfile } as VibeUser);
            }
          } catch (e) {
            console.warn("Sync error:", e);
            addToast("Protocol Conflict: Check permissions", "error");
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

  useEffect(() => {
    if (!isAuthenticated || !db) return;

    try {
      const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedPosts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Post[];
        
        setPosts(fetchedPosts);
      }, (error) => {
        console.error("Snapshot error:", error);
        addToast("Resyncing grid...", "info");
      });

      return () => unsubscribe();
    } catch (e) {
      console.error("Grid sync failed:", e);
    }
  }, [isAuthenticated]);

  const handleLike = async (postId: string) => {
    if (!db || !currentUser) return;
    
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const isLiked = !p.isLiked;
        if (isLiked) addToast('Signal Liked', 'success');
        return { ...p, likes: isLiked ? p.likes + 1 : p.likes - 1, isLiked };
      }
      return p;
    }));

    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        likes: increment(1)
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
      localStorage.removeItem(SESSION_KEY);
      setIsAuthenticated(false);
      setUserData(null);
      setActiveRoute(AppRoute.FEED);
      addToast('Neural Link Terminated', 'info');
    } catch (error) {
      addToast('Termination failed', 'error');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
      addToast('Data buffered', 'info');
    }
  };

  const handleCreatePost = async () => {
    if (!newPostText.trim() && !selectedFile) {
      addToast('Missing signal content', 'error');
      return;
    }

    if (!userData) {
      addToast('Identity sync required', 'error');
      return;
    }

    setIsUploading(true);
    let mediaUrl = '';
    let mediaType: 'image' | 'video' | 'file' = 'image';

    try {
      if (selectedFile) {
        mediaUrl = await uploadToCloudinary(selectedFile);
        mediaType = selectedFile.type.startsWith('video/') ? 'video' : 'image';
      }

      const postData = {
        authorId: userData.id,
        authorName: userData.displayName,
        authorAvatar: userData.avatarUrl,
        content: newPostText,
        media: mediaUrl ? [{ type: mediaType, url: mediaUrl }] : [],
        likes: 0,
        comments: 0,
        shares: 0,
        createdAt: new Date().toLocaleDateString('en-GB', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        timestamp: serverTimestamp()
      };

      if (db) {
        await addDoc(collection(db, 'posts'), postData);
      }
      
      setNewPostText('');
      setSelectedFile(null);
      setFilePreview(null);
      setIsCreateModalOpen(false);
      addToast('Broadcast active', 'success');
    } catch (error) {
      console.error(error);
      addToast('Protocol failed: Check permissions', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage onEnter={() => setIsAuthenticated(true)} />;
  }

  const renderRoute = () => {
    switch(activeRoute) {
      case AppRoute.ADMIN:
        return <AdminPanel addToast={addToast} locale="en-GB" />;
      case AppRoute.PROFILE:
        return userData ? (
          <ProfilePage 
            userData={userData} 
            onUpdateProfile={(newData) => setUserData(prev => prev ? ({ ...prev, ...newData }) : null)}
            addToast={addToast}
            locale="en-GB"
          />
        ) : null;
      case AppRoute.EXPLORE:
        return (
          <div className="space-y-8 page-transition">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Grid Discovery</h1>
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
              {['Trending', 'Art', 'UK Tech', 'London', 'Global'].map(tag => (
                <button key={tag} className="px-6 py-3 bg-white border border-slate-200 rounded-2xl whitespace-nowrap font-bold text-slate-600 hover:text-indigo-600 transition-all shadow-sm">
                  {tag}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="relative group rounded-[2.5rem] overflow-hidden aspect-video shadow-lg border border-slate-200/50 bg-white">
                  <img src={`https://picsum.photos/800/600?random=${i+20}`} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-all" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 p-8 flex flex-col justify-end">
                    <p className="text-white font-black text-xl tracking-tight">Signal Alpha-{i*10}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case AppRoute.MESSAGES:
        return (
          <div className="space-y-6 page-transition">
             <div className="flex justify-between items-center">
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Neural Comms</h1>
                <button className="p-4 bg-indigo-600 text-white rounded-2xl"><ICONS.Create /></button>
             </div>
             <div className="space-y-4">
               {[1, 2, 3].map(i => (
                 <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-200/50 shadow-sm flex items-center gap-6 hover:shadow-md transition-all cursor-pointer">
                    <div className="relative">
                       <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i+50}`} className="w-16 h-16 rounded-[1.5rem] object-cover" alt="" />
                       <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-white rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <h4 className="font-black text-slate-900 text-lg">Signal {i+100}</h4>
                        <span className="text-[10px] font-bold text-slate-400">2m</span>
                      </div>
                      <p className="text-slate-500 text-sm font-medium line-clamp-1 truncate">Encrypted transmission incoming...</p>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6 page-transition">
            {posts.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-[3rem] border border-slate-200/50 shadow-sm">
                 <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">No signals found</h3>
                 <p className="text-slate-400 font-bold mt-2">The grid is currently silent.</p>
              </div>
            ) : posts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                onLike={handleLike} 
                locale="en-GB"
              />
            ))}
          </div>
        );
    }
  };

  return (
    <Layout 
      activeRoute={activeRoute} 
      onNavigate={setActiveRoute}
      onOpenCreate={() => setIsCreateModalOpen(true)}
      onLogout={handleLogout}
      userRole={userData?.role || 'member'}
      userData={userData}
      currentRegion={userRegion}
      onRegionChange={handleRegionChange}
    >
      {renderRoute()}

      {/* FIXED TOAST LAYER */}
      <div className="fixed top-24 left-0 right-0 z-[500] flex flex-col gap-2 items-center pointer-events-none px-4">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto w-fit">
            <Toast toast={toast} onClose={removeToast} />
          </div>
        ))}
      </div>

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-end md:items-center justify-center p-0 md:p-6">
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300" 
            onClick={() => !isUploading && setIsCreateModalOpen(false)}
          ></div>
          <div className="relative bg-white w-full max-w-2xl rounded-t-[2.5rem] md:rounded-[3rem] shadow-2xl overflow-hidden p-6 md:p-10 animate-in slide-in-from-bottom-12 duration-400">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Broadcast</h2>
              <button 
                onClick={() => setIsCreateModalOpen(false)} 
                className="p-3 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <textarea 
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              className="w-full h-40 p-6 bg-slate-50 rounded-[2rem] border-none focus:ring-2 focus:ring-indigo-100 text-xl placeholder:text-slate-400 mb-6 resize-none transition-all font-semibold"
              placeholder="What's your frequency?"
              autoFocus
            />

            {filePreview && (
              <div className="relative rounded-3xl overflow-hidden mb-6 bg-slate-100 aspect-video group">
                <img src={filePreview} className="w-full h-full object-cover" alt="Preview" />
                <button 
                  onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                  className="absolute top-4 right-4 p-2.5 bg-black/60 text-white rounded-full"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            )}

            <div className="flex gap-4">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*,video/*"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-5 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all active:scale-90"
              >
                <ICONS.Create />
              </button>
              <button 
                onClick={handleCreatePost}
                disabled={isUploading}
                className="flex-1 py-5 bg-indigo-600 text-white font-black rounded-[1.5rem] shadow-xl hover:bg-indigo-700 disabled:opacity-50 transition-all uppercase tracking-widest"
              >
                {isUploading ? 'Syncing...' : 'Initiate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;