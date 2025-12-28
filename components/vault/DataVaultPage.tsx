import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  doc, 
  updateDoc, 
  arrayRemove 
} = Firestore as any;
import { Post, User, Region } from '../../types';
import { ICONS } from '../../constants';

interface DataVaultPageProps {
  currentUser: User;
  locale: Region;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onViewPost: (post: Post) => void;
}

export const DataVaultPage: React.FC<DataVaultPageProps> = ({ currentUser, locale, addToast, onViewPost }) => {
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'visuals' | 'text'>('all');

  useEffect(() => {
    if (!db || !currentUser.id) return;

    // Listen for posts bookmarked by the current user
    const q = query(
      collection(db, 'posts'),
      where('bookmarkedBy', 'array-contains', currentUser.id),
      orderBy('timestamp', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot: any) => {
      setSavedPosts(snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() } as Post)));
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser.id]);

  const handleUnsave = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    if (!db) return;
    try {
      await updateDoc(doc(db, 'posts', postId), {
        bookmarkedBy: arrayRemove(currentUser.id)
      });
      addToast("Artifact removed from Vault", "info");
    } catch (error) {
      addToast("Decryption Error: Removal Failed", "error");
    }
  };

  const filteredPosts = useMemo(() => {
    let data = savedPosts;

    if (activeFilter === 'visuals') {
      data = data.filter(p => p.media && p.media.length > 0);
    } else if (activeFilter === 'text') {
      data = data.filter(p => !p.media || p.media.length === 0);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(p => 
        p.content.toLowerCase().includes(q) || 
        p.authorName.toLowerCase().includes(q)
      );
    }

    return data;
  }, [savedPosts, activeFilter, searchQuery]);

  const stats = {
    total: savedPosts.length,
    visuals: savedPosts.filter(p => p.media?.length).length,
    text: savedPosts.filter(p => !p.media?.length).length
  };

  return (
    <div className="w-full max-w-[2400px] mx-auto pb-32 animate-in fade-in duration-700">
      
      {/* 1. VAULT HEADER */}
      <div className="relative rounded-[3rem] bg-[#0f172a] p-10 md:p-12 text-white shadow-2xl border border-slate-800 dark:border-slate-700 overflow-hidden mb-8 group selection:bg-cyan-500 selection:text-black">
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/5 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
         <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3 pointer-events-none" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />
         
         <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
           <div className="space-y-4 max-w-2xl">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-950/50 backdrop-blur-md rounded-xl border border-cyan-500/30 text-cyan-400">
                   <ICONS.Saved />
                </div>
                <span className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.4em] font-mono">Secure_Storage_v4.0</span>
             </div>
             <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none text-white">
               Data_Vault
             </h1>
             <p className="text-xs md:text-sm font-medium text-slate-400 leading-relaxed max-w-lg">
               Encrypted repository for saved signals, media fragments, and neural logs. Access is restricted to your biometric signature.
             </p>
           </div>

           <div className="flex gap-4 w-full lg:w-auto">
              <div className="flex-1 lg:flex-none px-8 py-5 bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] flex flex-col items-center justify-center min-w-[120px] hover:bg-white/10 transition-colors">
                 <span className="text-3xl font-black text-white leading-none tracking-tighter">{stats.total}</span>
                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Artifacts</span>
              </div>
              <div className="flex-1 lg:flex-none px-8 py-5 bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] flex flex-col items-center justify-center min-w-[120px] hover:bg-white/10 transition-colors">
                 <span className="text-3xl font-black text-cyan-400 leading-none tracking-tighter">{stats.visuals}</span>
                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Visuals</span>
              </div>
           </div>
         </div>
      </div>

      {/* 2. CONTROL INTERFACE */}
      <div className="relative z-30 mb-8 px-2 md:px-0">
         <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/60 dark:border-slate-700 p-2 rounded-[2.5rem] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.1)] flex flex-col md:flex-row items-center justify-between gap-3">
            
            {/* Filter Tabs */}
            <div className="flex bg-slate-100/80 dark:bg-slate-800/50 p-1 rounded-[2rem] w-full md:w-auto">
               {[
                 { id: 'all', label: 'All Data' },
                 { id: 'visuals', label: 'Visuals' },
                 { id: 'text', label: 'Logs' }
               ].map(tab => (
                 <button
                   key={tab.id}
                   onClick={() => setActiveFilter(tab.id as any)}
                   className={`flex-1 md:flex-none px-8 py-3 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative ${
                     activeFilter === tab.id 
                       ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' 
                       : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                   }`}
                 >
                   {tab.label}
                 </button>
               ))}
            </div>

            {/* Secure Search */}
            <div className="relative w-full md:w-96 group">
               <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-cyan-600 dark:group-focus-within:text-cyan-400 transition-colors scale-90">
                 <ICONS.Search />
               </div>
               <input 
                 type="text" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="Decrypt Archive..."
                 className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] pl-14 pr-6 py-3.5 text-xs font-bold outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-200 dark:focus:border-cyan-800 focus:bg-white dark:focus:bg-slate-700 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-inner text-slate-700 dark:text-white"
               />
            </div>
         </div>
      </div>

      {/* 3. ARTIFACT GRID */}
      <div className="min-h-[400px]">
         {loading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
             {Array.from({ length: 8 }).map((_, i) => (
               <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] animate-pulse border border-slate-200 dark:border-slate-700" />
             ))}
           </div>
         ) : filteredPosts.length > 0 ? (
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
             {filteredPosts.map((post, idx) => (
               <div 
                 key={post.id} 
                 onClick={() => onViewPost(post)}
                 className="group bg-white dark:bg-slate-900 rounded-[2.5rem] p-4 border border-slate-100 dark:border-slate-800 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] dark:hover:shadow-black/30 hover:border-cyan-200 dark:hover:border-cyan-900 transition-all duration-500 cursor-pointer relative flex flex-col h-full overflow-hidden hover:-translate-y-1"
                 style={{ animationDelay: `${idx * 50}ms` }}
               >
                  {/* Visual Header */}
                  <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden bg-slate-100 dark:bg-slate-800 mb-4 border border-slate-50 dark:border-slate-700">
                     {post.media && post.media.length > 0 ? (
                       <>
                         <img src={post.media[0].url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0" alt="" />
                         <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md text-white px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-1">
                            {post.media[0].type === 'video' ? 'VIDEO' : 'IMG'}
                         </div>
                       </>
                     ) : (
                       <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-50/50 dark:bg-slate-800/50">
                          <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-3 text-slate-300 dark:text-slate-500 shadow-sm">
                             <ICONS.Messages />
                          </div>
                          <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Text_Log</p>
                       </div>
                     )}
                     
                     {/* Hover Overlay */}
                     <div className="absolute inset-0 bg-cyan-900/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center duration-300">
                        <span className="px-5 py-2 border border-white/30 rounded-xl text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-cyan-900 transition-colors">
                          Access_Data
                        </span>
                     </div>
                  </div>

                  {/* Content Info */}
                  <div className="px-2 flex-1 flex flex-col">
                     <div className="flex items-center gap-2 mb-2">
                        <img src={post.authorAvatar} className="w-5 h-5 rounded-lg object-cover bg-slate-100 dark:bg-slate-800" alt="" />
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono truncate">{post.authorName}</span>
                     </div>
                     <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed mb-4 group-hover:text-cyan-700 dark:group-hover:text-cyan-400 transition-colors">
                       "{post.content || 'Encrypted visual artifact.'}"
                     </p>
                     
                     <div className="mt-auto pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-[8px] font-mono font-bold text-slate-400 dark:text-slate-500">{post.timestamp?.toDate ? post.timestamp.toDate().toLocaleDateString(locale) : 'Unknown Date'}</span>
                        <button 
                          onClick={(e) => handleUnsave(e, post.id)}
                          className="text-[8px] font-black text-rose-400 dark:text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 uppercase tracking-widest hover:underline decoration-rose-200 dark:decoration-rose-800 transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-300"
                        >
                          Purge
                        </button>
                     </div>
                  </div>
               </div>
             ))}
           </div>
         ) : (
           <div className="py-40 flex flex-col items-center justify-center text-center opacity-50 bg-slate-50/50 dark:bg-slate-800/50 rounded-[4rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
              <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center mb-8 text-slate-300 dark:text-slate-600 shadow-sm border border-slate-100 dark:border-slate-800">
                 <ICONS.Saved />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-widest italic text-slate-900 dark:text-white">Vault_Empty</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] font-mono mt-3 text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
                {searchQuery ? 'No artifacts match your decryption query.' : 'No data packets currently stored in secure vault.'}
              </p>
           </div>
         )}
      </div>
    </div>
  );
};