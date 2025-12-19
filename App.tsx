
import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/layout/Layout';
import { PostCard } from './components/feed/PostCard';
import { Toast } from './components/ui/Toast';
import { LandingPage } from './components/landing/LandingPage';
import { AppRoute, Post, ToastMessage } from './types';
import { MOCK_POSTS, MOCK_USER } from './constants';
import { db } from './services/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  serverTimestamp,
  updateDoc,
  doc,
  increment
} from 'firebase/firestore';
import { uploadToCloudinary } from './services/cloudinary';

const SESSION_KEY = 'vibestream_session_2026';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Check for existing session on initial load
    if (typeof window !== 'undefined') {
      const savedSession = localStorage.getItem(SESSION_KEY);
      return savedSession === 'active';
    }
    return false;
  });
  
  const [activeRoute, setActiveRoute] = useState<AppRoute>(AppRoute.FEED);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [userRegion, setUserRegion] = useState('en-GB');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    if (isAuthenticated) {
      addToast('Welcome back to VibeStream', 'success');
    }
  }, []); // Only run once on mount if authenticated

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    if (!db) {
      setPosts(MOCK_POSTS);
      setIsLoading(false);
      return;
    }

    try {
      const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedPosts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Post[];
        
        setPosts(fetchedPosts.length > 0 ? fetchedPosts : MOCK_POSTS);
        setIsLoading(false);
      }, (error) => {
        addToast("Syncing offline data", "info");
        setPosts(MOCK_POSTS);
        setIsLoading(false);
      });

      return () => unsubscribe();
    } catch (e) {
      setPosts(MOCK_POSTS);
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const handleLike = async (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const isLiked = !p.isLiked;
        if (isLiked) addToast('Post Liked', 'success');
        return { ...p, likes: isLiked ? p.likes + 1 : p.likes - 1, isLiked };
      }
      return p;
    }));

    if (!db) return;

    try {
      if (!postId.startsWith('p')) {
        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, {
          likes: increment(1)
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
    addToast('Session terminated securely', 'info');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
      addToast('Media attached', 'info');
    }
  };

  const handleCreatePost = async () => {
    if (!newPostText.trim() && !selectedFile) {
      addToast('Cannot publish empty post', 'error');
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
        authorId: MOCK_USER.id,
        authorName: MOCK_USER.displayName,
        authorAvatar: MOCK_USER.avatarUrl,
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
      } else {
        setPosts(prev => [{ id: `m-${Date.now()}`, ...postData, timestamp: null } as any, ...prev]);
      }
      
      setNewPostText('');
      setSelectedFile(null);
      setFilePreview(null);
      setIsCreateModalOpen(false);
      addToast('Published to VibeStream', 'success');
    } catch (error) {
      addToast('Publishing failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isAuthenticated) {
    return <LandingPage onEnter={() => {
      localStorage.setItem(SESSION_KEY, 'active');
      setIsAuthenticated(true);
      addToast('Secure connection established', 'success');
    }} />;
  }

  return (
    <Layout 
      activeRoute={activeRoute} 
      onNavigate={setActiveRoute}
      onOpenCreate={() => setIsCreateModalOpen(true)}
      onLogout={handleLogout}
    >
      <div className="space-y-4 md:space-y-8 pb-32 md:pb-12 max-w-2xl mx-auto">
        {posts.map(post => (
          <PostCard 
            key={post.id} 
            post={post} 
            onLike={handleLike} 
            locale={userRegion}
          />
        ))}
      </div>

      <div className="fixed top-safe-top pt-4 left-0 right-0 z-[500] flex flex-col gap-2 items-center pointer-events-none px-4">
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
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Create Post</h2>
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
              className="w-full h-40 md:h-56 p-6 bg-slate-50 rounded-[1.5rem] md:rounded-[2rem] border-none focus:ring-2 focus:ring-indigo-100 text-lg md:text-xl placeholder:text-slate-400 mb-6 resize-none transition-all"
              placeholder="Share your vibe..."
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
                {isUploading ? 'Authorising...' : 'Publish Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
