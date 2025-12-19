
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
    addToast(`Neural Node Switched: ${newRegion}`, 'info');
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
              const data = userDoc.data() as VibeUser;
              if (data.isSuspended) {
                 await signOut(auth);
                 addToast("Protocol Breach: Node Suspended", "error");
                 return;
              }
              // Normalise data to ensure no undefined crashes on map/toLocaleString
              setUserData({ 
                id: userDoc.id, 
                ...data,
                badges: data.badges || [],
                verifiedHuman: !!data.verifiedHuman,
                role: data.role || 'member',
                followers: data.followers || 0,
                following: data.following || 0,
                location: data.location || 'Unknown Node'
              } as VibeUser);
            } else {
              const newProfile: Partial<VibeUser> = {
                username: user.email?.split('@')[0] || `user_${user.uid.slice(0, 5)}`,
                displayName: user.displayName || user.email?.split('@')[0] || 'Unknown Node',
                bio: 'New VibeStream citizen.',
                avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
                coverUrl: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop',
                followers: 0,
                following: 0,
                role: 'member',
                location: 'London, UK',
                joinedAt: new Date().toISOString(),
                badges: ['New Citizen'],
                verifiedHuman: false,
                isSuspended: false
              };
              await setDoc(userDocRef, newProfile);
              setUserData({ id: user.uid, ...newProfile } as VibeUser);
            }
          } catch (e) {
            console.warn("Profile Sync Offline:", e);
          }
        }
        addToast(`Neural Link Active`, 'success');
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
        addToast("Network Syncing...", "info");
      });

      return () => unsubscribe();
    } catch (e) {
      console.error("Feed error:", e);
    }
  }, [isAuthenticated]);

  const handleLike = async (postId: string) => {
    if (!db || !currentUser) return;
    
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const isLiked = !p.isLiked;
        if (isLiked) addToast('Resonance Increased', 'success');
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
      addToast('Logout Failed', 'error');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
      addToast('Buffer Prepared', 'info');
    }
  };

  const handleCreatePost = async () => {
    if (!newPostText.trim() && !selectedFile) {
      addToast('Content required for broadcast', 'error');
      return;
    }

    if (!userData) {
      addToast('Identity Sync Required', 'error');
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
        createdAt: new Date().toLocaleDateString(userRegion, { 
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
      addToast('Broadcast Successful', 'success');
    } catch (error) {
      addToast('Transmission Failure', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#020617] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage onEnter={() => setIsAuthenticated(true)} />;
  }

  const renderRoute = () => {
    switch(activeRoute) {
      case AppRoute.ADMIN:
        return <AdminPanel addToast={addToast} locale={userRegion} />;
      case AppRoute.PROFILE:
        return userData ? (
          <ProfilePage 
            userData={userData} 
            onUpdateProfile={(newData) => setUserData(prev => prev ? ({ ...prev, ...newData }) : null)}
            addToast={addToast}
            locale={userRegion}
          />
        ) : null;
      default:
        return (
          <div className="space-y-6 md:space-y-10 pb-32 md:pb-12 max-w-2xl mx-auto">
            {posts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                 <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-300">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
                 </div>
                 <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">No signals found</h3>
                 <p className="text-slate-400 font-medium mt-2">Be the first to broadcast on the network.</p>
              </div>
            ) : posts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                onLike={handleLike} 
                locale={userRegion}
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

      <div className="fixed top-safe-top pt-24 md:pt-28 left-0 right-0 z-[500] flex flex-col gap-2 items-center pointer-events-none px-4">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto w-fit">
            <Toast toast={toast} onClose={removeToast} />
          </div>
        ))}
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[400] flex items-end md:items-center justify-center p-0 md:p-6">
          <div 
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-500" 
            onClick={() => !isUploading && setIsCreateModalOpen(false)}
          ></div>
          <div className="relative bg-white w-full max-w-2xl rounded-t-[2.5rem] md:rounded-[3rem] shadow-2xl overflow-hidden p-6 md:p-10 animate-in slide-in-from-bottom-12 md:zoom-in-95 duration-500">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Broadcast</h2>
              <button 
                onClick={() => setIsCreateModalOpen(false)} 
                className="p-3 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors active:scale-90"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <textarea 
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              className="w-full h-40 md:h-56 p-6 bg-slate-50 rounded-[1.5rem] md:rounded-[2rem] border-none focus:ring-2 focus:ring-indigo-100 text-lg md:text-xl placeholder:text-slate-400 mb-6 resize-none transition-all font-semibold"
              placeholder="What's your frequency?"
              autoFocus
            />

            {filePreview && (
              <div className="relative rounded-2xl md:rounded-3xl overflow-hidden mb-6 bg-slate-100 aspect-video group">
                <img src={filePreview} className="w-full h-full object-cover" alt="Preview" />
                <button 
                  onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                  className="absolute top-4 right-4 p-2.5 bg-black/60 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            )}

            <div className="flex justify-between items-center gap-4">
              <div className="flex gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="image/*,video/*"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 md:p-5 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all active:scale-90"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </button>
              </div>
              <button 
                onClick={handleCreatePost}
                disabled={isUploading}
                className="flex-1 py-4 md:py-5 bg-indigo-600 text-white font-black rounded-2xl md:rounded-[1.5rem] shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95 text-base md:text-lg tracking-tight uppercase"
              >
                {isUploading ? 'Encrypting...' : 'Initiate Broadcast'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
