
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

/**
 * App Component
 * Core application logic for VibeStream 2026.
 * Features: Feed synchronization, real-time updates, and professional UK-standard UI.
 * Configured for en-GB locale and mobile-first responsiveness.
 */
const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeRoute, setActiveRoute] = useState<AppRoute>(AppRoute.FEED);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    // Priority 1: If not authenticated, we don't need to fetch posts yet
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    // Guard against null DB (if Firebase failed to init)
    if (!db) {
      console.warn("Database not available. Using mock data.");
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
        console.error("Firestore Listen Error:", error);
        addToast("Feed sync paused", "info");
        setPosts(MOCK_POSTS);
        setIsLoading(false);
      });

      return () => unsubscribe();
    } catch (e) {
      console.error("Feed error:", e);
      setPosts(MOCK_POSTS);
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const handleLike = async (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const isLiked = !p.isLiked;
        if (isLiked) addToast('Liked post!', 'success');
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
    if (!newPostText.trim() && !selectedFile) {
      addToast('Please enter some text or add a media file', 'error');
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
      } else {
        // Mock success for development
        setPosts(prev => [{ id: Math.random().toString(), ...postData, timestamp: null } as any, ...prev]);
      }
      
      setNewPostText('');
      setSelectedFile(null);
      setFilePreview(null);
      setIsCreateModalOpen(false);
      addToast('Post published successfully!', 'success');
    } catch (error) {
      addToast('Upload failed. Check environment variables.', 'error');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isAuthenticated) {
    return <LandingPage onEnter={() => setIsAuthenticated(true)} />;
  }

  return (
    <Layout 
      activeRoute={activeRoute} 
      onNavigate={setActiveRoute}
      onOpenCreate={() => setIsCreateModalOpen(true)}
    >
      <div className="space-y-6 pb-20">
        {posts.map(post => (
          <PostCard key={post.id} post={post} onLike={handleLike} />
        ))}
      </div>

      {/* Toast Overlay - Positioned for accessibility and touch targets */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[300] flex flex-col gap-2 items-center pointer-events-none w-full px-4">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto w-fit">
            <Toast toast={toast} onClose={removeToast} />
          </div>
        ))}
      </div>

      {/* Create Post Modal - Touch screen ready with large targets and blur effects */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => !isUploading && setIsCreateModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden p-8 md:p-12 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Post Your Vibe</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-3 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <textarea 
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              className="w-full h-48 p-6 bg-slate-50 rounded-[2rem] border-none focus:ring-2 focus:ring-indigo-100 text-xl placeholder:text-slate-300 mb-6 resize-none"
              placeholder="What's happening, Oliver?"
            />

            {filePreview && (
              <div className="relative rounded-3xl overflow-hidden mb-6 bg-slate-100 aspect-video">
                <img src={filePreview} className="w-full h-full object-cover" alt="Preview" />
                <button 
                  onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                  className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            )}

            <div className="flex justify-between items-center">
              <div className="flex gap-3">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="image/*,video/*"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all active:scale-90"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </button>
              </div>
              <button 
                onClick={handleCreatePost}
                disabled={isUploading}
                className="px-12 py-5 bg-indigo-600 text-white font-black rounded-[1.5rem] shadow-xl shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95"
              >
                {isUploading ? 'SYNCHRONISING...' : 'PUBLISH POST'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

// Fixed the import error in index.tsx by adding the missing default export.
export default App;
