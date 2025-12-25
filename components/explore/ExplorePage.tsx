
import React, { useState, useMemo } from 'react';
import { Post, User, Region } from '../../types';
import { ICONS } from '../../constants';

interface ExplorePageProps {
  posts: Post[];
  users: User[];
  onLike: (id: string) => void;
  onBookmark: (id: string) => void;
  onViewPost: (post: Post) => void;
  onViewProfile: (user: User) => void;
  locale: Region;
  searchQuery?: string;
  onClearSearch?: () => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({ 
  posts, 
  users,
  onLike, 
  onBookmark,
  onViewPost,
  onViewProfile,
  locale,
  searchQuery = '',
  onClearSearch
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'signals' | 'nodes'>('all');
  const [mediaType, setMediaType] = useState<'any' | 'visual' | 'text'>('any');

  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    // 1. Filter Nodes (Users)
    const matchedNodes = users.filter(u => {
      // Basic activity check or random selection for 'explore' if no query
      const isRelevant = query ? true : u.followers > 0 || u.verifiedHuman; 
      
      if (!query) return isRelevant;
      
      return (
        u.displayName.toLowerCase().includes(query) ||
        u.username.toLowerCase().includes(query) ||
        u.bio?.toLowerCase().includes(query) ||
        u.location?.toLowerCase().includes(query) ||
        u.tags?.some(t => t.toLowerCase().includes(query))
      );
    });

    // 2. Filter Signals (Posts)
    const matchedSignals = posts.filter(p => {
      // Media Type Filter
      let matchesMedia = true;
      if (mediaType === 'visual') matchesMedia = !!(p.media && p.media.length > 0);
      if (mediaType === 'text') matchesMedia = !p.media || p.media.length === 0;
      if (!matchesMedia) return false;

      // Search Query Logic
      if (query) {
        return (
          p.content.toLowerCase().includes(query) ||
          p.authorName.toLowerCase().includes(query) ||
          p.location?.toLowerCase().includes(query)
        );
      }
      return true;
    });

    return { nodes: matchedNodes, signals: matchedSignals };
  }, [posts, users, searchQuery, mediaType]);

  const showNodes = activeFilter === 'all' || activeFilter === 'nodes';
  const showSignals = activeFilter === 'all' || activeFilter === 'signals';

  return (
    <div className="w-full max-w-5xl mx-auto pb-24">
      
      {/* 1. Header & Active Search Telemetry */}
      <div className="mb-8 pt-4 px-2">
        {searchQuery ? (
          <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white relative overflow-hidden shadow-2xl border border-white/10 animate-in slide-in-from-top-4 duration-500">
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 blur-[80px] rounded-full translate-x-1/3 -translate-y-1/3" />
             
             <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                   <div className="flex items-center gap-3 mb-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] font-mono">Query_Active</span>
                   </div>
                   <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase leading-none">"{searchQuery}"</h1>
                   <p className="text-[10px] font-bold text-slate-400 font-mono mt-2 tracking-widest">
                     Found {filteredData.nodes.length} Nodes • {filteredData.signals.length} Signals
                   </p>
                </div>
                <button 
                  onClick={onClearSearch}
                  className="px-6 py-3 bg-white/10 hover:bg-white text-white hover:text-slate-900 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 border border-white/10 backdrop-blur-md"
                >
                  Reset_Scan
                </button>
             </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 mb-6">
             <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none">Explore_Grid</h1>
             <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] font-mono">Global Frequency Index</p>
          </div>
        )}
      </div>

      {/* 2. Sticky Control Bar */}
      <div className="sticky top-[calc(var(--header-h)+1rem)] z-30 mb-8 mx-2">
         <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-[2rem] p-1.5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] flex items-center justify-between gap-2">
            
            {/* Main Tabs */}
            <div className="flex bg-slate-100/50 dark:bg-slate-800/50 rounded-[1.6rem] p-1">
               {(['all', 'signals', 'nodes'] as const).map(f => (
                 <button
                   key={f}
                   onClick={() => setActiveFilter(f)}
                   className={`px-5 py-2.5 rounded-[1.4rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === f ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                 >
                   {f}
                 </button>
               ))}
            </div>

            {/* Media Toggles (Only show if signals are active) */}
            {activeFilter !== 'nodes' && (
               <div className="hidden sm:flex bg-slate-100/50 dark:bg-slate-800/50 rounded-[1.6rem] p-1 border border-slate-100 dark:border-slate-700">
                  {(['any', 'visual', 'text'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setMediaType(m)}
                      className={`px-4 py-2.5 rounded-[1.4rem] text-[9px] font-bold uppercase tracking-widest transition-all ${mediaType === m ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                      {m}
                    </button>
                  ))}
               </div>
            )}
         </div>
      </div>

      {/* 3. Content Matrix */}
      <div className="space-y-12 px-2">
         
         {/* NODE CLUSTER */}
         {showNodes && filteredData.nodes.length > 0 && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center gap-4 mb-6">
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Suggested_Nodes</span>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredData.nodes.slice(0, 6).map(user => (
                     <div 
                        key={user.id} 
                        onClick={() => onViewProfile(user)}
                        className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-5 flex items-center gap-4 hover:border-indigo-100 dark:hover:border-indigo-900 hover:shadow-lg transition-all duration-300 cursor-pointer"
                     >
                        <div className="relative shrink-0">
                           <img src={user.avatarUrl} className="w-16 h-16 rounded-[1.4rem] object-cover border-2 border-slate-50 dark:border-slate-800 group-hover:scale-105 transition-transform" alt="" />
                           {user.verifiedHuman && (
                              <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 text-indigo-500 p-0.5 rounded-full border border-slate-50 dark:border-slate-700 shadow-sm">
                                 <ICONS.Verified />
                              </div>
                           )}
                        </div>
                        <div className="flex-1 min-w-0">
                           <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{user.displayName}</h4>
                           <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 font-mono tracking-wider truncate">@{user.username}</p>
                           <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-1 opacity-80">{user.bio || 'Node active.'}</p>
                        </div>
                        <button className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 hover:bg-slate-950 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 flex items-center justify-center transition-all active:scale-90">
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M12 4.5v15m7.5-7.5h-15" /></svg>
                        </button>
                     </div>
                  ))}
               </div>
            </section>
         )}

         {/* SIGNAL STREAM */}
         {showSignals && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
               <div className="flex items-center gap-4 mb-6">
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Transmission_Feed</span>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
               </div>

               {filteredData.signals.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                     {filteredData.signals.map(post => (
                        <div 
                           key={post.id}
                           onClick={() => onViewPost(post)}
                           className="group bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-slate-800 hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900 transition-all duration-300 cursor-pointer flex flex-col h-full"
                        >
                           {/* Media Header */}
                           {post.media && post.media.length > 0 ? (
                              <div className="aspect-square relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                                 <img 
                                    src={post.media[0].url} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                    alt="" 
                                    loading="lazy"
                                 />
                                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                                    <div className="text-white">
                                       <p className="text-[10px] font-black uppercase tracking-widest font-mono mb-1">{post.authorName}</p>
                                       <p className="text-xs font-bold line-clamp-2">{post.content}</p>
                                    </div>
                                 </div>
                              </div>
                           ) : (
                              <div className="aspect-square p-8 flex flex-col justify-between bg-slate-50 dark:bg-slate-800 group-hover:bg-indigo-50/30 dark:group-hover:bg-indigo-900/10 transition-colors">
                                 <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-xl shadow-sm flex items-center justify-center text-slate-300 dark:text-slate-500 mb-4">
                                    <ICONS.Messages />
                                 </div>
                                 <p className="text-lg font-black text-slate-800 dark:text-slate-200 italic tracking-tight line-clamp-4 leading-snug">
                                    "{post.content}"
                                 </p>
                                 <div className="flex items-center gap-2 mt-4">
                                    <img src={post.authorAvatar} className="w-6 h-6 rounded-full border border-white dark:border-slate-600 shadow-sm" alt="" />
                                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{post.authorName}</span>
                                 </div>
                              </div>
                           )}

                           {/* Mini Stats Footer (Only for media posts as text posts have internal footer) */}
                           {post.media && post.media.length > 0 && (
                              <div className="p-4 flex items-center justify-between border-t border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900">
                                 <div className="flex items-center gap-1.5">
                                    <div className={`p-1.5 rounded-full ${post.isLiked ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-500' : 'text-slate-300 dark:text-slate-600'}`}>
                                       <svg className="w-4 h-4" fill={post.isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                                    </div>
                                    <span className="text-[10px] font-black font-mono text-slate-600 dark:text-slate-400">{post.likes}</span>
                                 </div>
                                 <span className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">VIEW_SIGNAL</span>
                              </div>
                           )}
                        </div>
                     ))}
                  </div>
               ) : (
                  <div className="py-24 text-center bg-slate-50 dark:bg-slate-800/50 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-700">
                     <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.4em] font-mono italic">Sector Empty</p>
                  </div>
               )}
            </section>
         )}

         {/* Empty State */}
         {filteredData.nodes.length === 0 && filteredData.signals.length === 0 && (
            <div className="py-40 text-center">
               <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 dark:text-slate-600 animate-pulse">
                  <ICONS.Search />
               </div>
               <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Grid_Silence</h3>
               <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] font-mono mt-2">No frequencies match your query.</p>
            </div>
         )}

      </div>
    </div>
  );
};
