
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
  setDoc,
  getDocs,
  limit,
  where
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
  const [chats, setChats] = useState<any[]>([]);
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

  const handleRegionChange = (newRegion: Region) => {
    setUserRegion(newRegion);
    addToast(`Link: ${newRegion}`, 'info');
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
                 addToast("Access Denied: Node Suspended", "error");
                 return;
              }
              setUserData({ 
                id: userDoc.id, 
                ...data,
              } as VibeUser);
            } else {
              const usersQuery = query(collection(db, 'users'), limit(1));
              const usersSnap = await getDocs(usersQuery);
              const isFirstUser = usersSnap.empty;

              const newProfile: any = {
                username: user.email?.split('@')[0] || `node_${user.uid.slice(0, 5)}`,
                displayName: user.displayName || user.email?.split('@')[0] || 'Member',
                bio: 'Citadel User.',
                avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
                coverUrl: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop',
                followers: 0,
                following: 0,
                role: isFirstUser ? 'admin' : 'member',
                location: 'London, UK',
                joinedAt: new Date().toISOString(),
                badges: isFirstUser ? ['Admin'] : ['Citizen'],
                verifiedHuman: isFirstUser,
                isSuspended: false,
                geoNode: 'UK',
                // 2026 Default Data
                dob: '2000-01-01',
                pronouns: 'they/them',
                website: '',
                tags: ['Pioneer'],
                trustTier: 'Alpha'
              };
              await setDoc(userDocRef, newProfile);
              setUserData({ id: user.uid, ...newProfile } as VibeUser);
              if (isFirstUser) addToast("Admin Privileges Granted", "success");
            }
          } catch (e) {
            console.warn("Sync error:", e);
            addToast("Protocol Conflict", "error");
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
      });
      return () => unsubscribe();
    } catch (e) { console.error(e); }
  }, [isAuthenticated]);

  const handleLike = async (postId: string) => {
    if (!db || !currentUser) return;
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const isLiked = !p.isLiked;
        return { ...p, likes: isLiked ? p.likes + 1 : p.likes - 1, isLiked };
      }
      return p;
    }));
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, { likes: increment(1) });
    } catch (e) { console.error(e); }
  };

  const handleLogout = async () => {
    try {
      if (auth) await signOut(auth);
      localStorage.removeItem(SESSION_KEY);
      setIsAuthenticated(false);
      setUserData(null);
      setActiveRoute(AppRoute.FEED);
      addToast('Session Ended', 'info');
    } catch (error) { addToast('Logout failed', 'error'); }
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
    if (!userData) return;
    setIsUploading(true);
    try {
      let mediaUrl = '';
      if (selectedFile) mediaUrl = await uploadToCloudinary(selectedFile);
      const postData = {
        authorId: userData.id,
        authorName: userData.displayName,
        authorAvatar: userData.avatarUrl,
        content: newPostText,
        media: mediaUrl ? [{ type: selectedFile?.type.startsWith('video/') ? 'video' : 'image', url: mediaUrl }] : [],
        likes: 0,
        comments: 0,
        shares: 0,
        createdAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
        timestamp: serverTimestamp()
      };
      if (db) await addDoc(collection(db, 'posts'), postData);
      setNewPostText('');
      setSelectedFile(null);
      setFilePreview(null);
      setIsCreateModalOpen(false);
      addToast('Post Published', 'success');
    } catch (error) {
      addToast('Publishing failed', 'error');
    } finally { setIsUploading(false); }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <LandingPage onEnter={() => setIsAuthenticated(true)} />;

  const renderRoute = () => {
    switch(activeRoute) {
      case AppRoute.ADMIN: return <AdminPanel addToast={addToast} locale="en-GB" />;
      case AppRoute.PROFILE: return userData ? <ProfilePage userData={userData} onUpdateProfile={(d) => setUserData(p => p ? ({ ...p, ...d }) : null)} addToast={addToast} locale={userRegion} /> : null;
      case AppRoute.EXPLORE:
        return (
          <div className="space-y-6 route-transition">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Explore</h1>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {posts.filter(p => p.media?.[0]).map(post => (
                <div key={post.id} className="relative aspect-square rounded-xl overflow-hidden border-precision bg-slate-100 cursor-pointer hover:opacity-90 transition-opacity">
                  <img src={post.media[0].url} className="w-full h-full object-cover" alt="" />
                </div>
              ))}
            </div>
          </div>
        );
      case AppRoute.MESSAGES:
        return (
          <div className="space-y-4 route-transition">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Messages</h1>
            <div className="bg-white border-precision rounded-2xl p-12 text-center text-slate-400">
               <p className="font-bold text-xs uppercase tracking-widest">Secure Channels Initializing...</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-4 route-transition">
            {posts.map(post => <PostCard key={post.id} post={post} onLike={handleLike} />)}
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

      {/* TOAST SYSTEM (Precision Location) */}
      <div className="fixed bottom-6 right-6 md:bottom-12 md:right-12 z-[500] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map(t => <div key={t.id} className="pointer-events-auto"><Toast toast={t} onClose={removeToast} /></div>)}
      </div>

      {/* MODAL SYSTEM (Ultra Sharp) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" onClick={() => !isUploading && setIsCreateModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden p-8 border-precision route-transition">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Compose Post</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <textarea 
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              className="w-full h-32 p-4 bg-slate-50 rounded-xl border-precision focus:ring-1 focus:ring-indigo-500 outline-none text-slate-800 placeholder:text-slate-400 text-sm font-medium resize-none mb-4"
              placeholder="What's happening?"
              autoFocus
            />
            {filePreview && (
              <div className="relative rounded-lg overflow-hidden mb-4 bg-slate-100 aspect-video"><img src={filePreview} className="w-full h-full object-cover" alt="" /></div>
            )}
            <div className="flex gap-3">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" />
              <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all"><ICONS.Create /></button>
              <button onClick={handleCreatePost} disabled={isUploading} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-all uppercase text-xs tracking-widest">{isUploading ? 'Sending...' : 'Post'}</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
