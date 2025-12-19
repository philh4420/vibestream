
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout } from './components/Layout';
import { PostCard } from './components/PostCard';
import { Toast } from './components/Toast';
import { LandingPage } from './components/LandingPage';
import { AppRoute, Post, ToastMessage } from './types';
import { MOCK_POSTS, MOCK_USER } from './constants';
import { db } from './lib/firebase';
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
import { uploadToCloudinary } from './lib/cloudinary';

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

  // Real-time Firebase Feed
  useEffect(() => {
    if (!isAuthenticated) return;

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
  }, [isAuthenticated]);

  const handleLike = async (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const isLiked = !p.isLiked;
        if (isLiked) addToast('Liked post!');
        return { ...p, likes: isLiked ? p.likes + 1 : p.likes - 1, isLiked };
      }
      return p;
    }));

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
      addToast('Please enter some text or add a file', 'error');
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

      await addDoc(collection(db, 'posts'), postData);
      
      setNewPostText('');
      setSelectedFile(null);
      setFilePreview(null);
      setIsCreateModalOpen(false);
      addToast('Post published successfully!', 'success');
    } catch (error) {
      addToast('Error creating post. Please try again.', 'error');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const renderContent = () => {
    switch (activeRoute) {
      case AppRoute.FEED:
        return (
          <div className="space-y-6">
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              <div className="flex-shrink-0 flex flex-col items-center gap-1 group cursor-pointer">
                <div className="w-16 h-16 rounded-full p-1 border-2 border-dashed border-indigo-400 group-hover:scale-105 transition-transform flex items-center justify-center">
                  <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">You</span>
              </div>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1 group cursor-pointer">
                  <div className="w-16 h-16 rounded-full p-1 border-2 border-indigo-500 group-hover:scale-105 transition-transform">
                    <img src={`https://picsum.photos/100/100?random=${i+50}`} className="w-full h-full rounded-full object-cover" alt="Story" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">User {i}</span>
                </div>
              ))}
            </div>

            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 animate-pulse">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-full" />
                      <div className="space-y-2">
                        <div className="w-24 h-3 bg-slate-100 rounded" />
                        <div className="w-16 h-2 bg-slate-50 rounded" />
                      </div>
                    </div>
                    <div className="w-full h-4 bg-slate-100 rounded mb-2" />
                    <div className="w-2/3 h-4 bg-slate-100 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              posts.map(post => (
                <PostCard key={post.id} post={post} onLike={handleLike} />
              ))
            )}
          </div>
        );
      
      case AppRoute.PROFILE:
        return (
          <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm">
            <div className="relative h-48 md:h-64 bg-slate-200">
              <img src={MOCK_USER.coverUrl} className="w-full h-full object-cover" alt="Cover" />
              <div className="absolute -bottom-12 left-8 p-1 bg-white rounded-full">
                <img src={MOCK_USER.avatarUrl} className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white object-cover shadow-lg" alt="Profile" />
              </div>
            </div>
            <div className="pt-16 px-8 pb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    {MOCK_USER.displayName}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-indigo-500">
                      <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                    </svg>
                  </h1>
                  <p className="text-slate-500 font-medium">@{MOCK_USER.username}</p>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 md:flex-none px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100">Edit Profile</button>
                  <button className="px-3 py-2.5 bg-slate-50 text-slate-600 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                    </svg>
                  </button>
                </div>
              </div>
              <p className="text-slate-700 leading-relaxed max-w-2xl mb-6">{MOCK_USER.bio}</p>
              <div className="flex items-center gap-6 mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-center">
                  <p className="text-xl font-bold text-slate-900">{(MOCK_USER.followers / 1000).toFixed(1)}k</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Followers</p>
                </div>
                <div className="w-px h-8 bg-slate-200"></div>
                <div className="text-center">
                  <p className="text-xl font-bold text-slate-900">{MOCK_USER.following}</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Following</p>
                </div>
                <div className="w-px h-8 bg-slate-200"></div>
                <div className="text-center">
                  <p className="text-xl font-bold text-slate-900">234</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Posts</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 md:gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-square bg-slate-100 rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                    <img src={`https://picsum.photos/400/400?random=${i+100}`} className="w-full h-full object-cover" alt="Post" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Coming Soon</h2>
            <p className="text-slate-500">We're building something innovative. Stay tuned!</p>
          </div>
        );
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
      {renderContent()}

      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} onClose={removeToast} />
          </div>
        ))}
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isUploading && setIsCreateModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 font-outfit">Create New Post</h2>
              <button 
                onClick={() => setIsCreateModalOpen(false)} 
                disabled={isUploading}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors disabled:opacity-30"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-8">
              <textarea 
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                placeholder="What's happening in your world?"
                disabled={isUploading}
                className="w-full h-32 resize-none border-none focus:ring-0 text-lg placeholder:text-slate-300 text-slate-800 p-0 mb-4"
              />

              {filePreview && (
                <div className="relative rounded-2xl overflow-hidden mb-6 bg-slate-50 border border-slate-100">
                  {selectedFile?.type.startsWith('video/') ? (
                    <video src={filePreview} className="w-full max-h-60 object-cover" controls />
                  ) : (
                    <img src={filePreview} className="w-full max-h-60 object-cover" alt="Preview" />
                  )}
                  <button 
                    onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                    className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              
              <div className="flex items-center gap-3 mb-8">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="image/*,video/*"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-colors disabled:opacity-50"
                  title="Add Image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                </button>
                <button 
                  disabled={isUploading}
                  className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-colors disabled:opacity-50"
                  title="Add Video"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                </button>
                <button 
                  disabled={isUploading}
                  className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-colors disabled:opacity-50"
                  title="Tag Location"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <span>Publicly visible</span>
                </div>
                <button 
                  onClick={handleCreatePost}
                  disabled={(!newPostText.trim() && !selectedFile) || isUploading}
                  className="px-10 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 disabled:bg-slate-300 disabled:shadow-none transition-all flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    'Publish Post'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
