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
  userData?: User | null;
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
  onClearSearch,
  userData
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'signals' | 'nodes'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Advanced Filters State
  const [mediaType, setMediaType] = useState<'any' | 'visual' | 'image' | 'video' | 'text'>('any');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [geoRadius, setGeoRadius] = useState<'global' | 'local'>('global');
  const [trustTiers, setTrustTiers] = useState<string[]>([]);

  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const startTime = dateRange.start ? new Date(dateRange.start).getTime() : 0;
    const endTime = dateRange.end ? new Date(dateRange.end).getTime() + 86400000 : Infinity; // Include full end day

    // 1. Filter Nodes (Users)
    const matchedNodes = users.filter(u => {
      // Basic Text Match
      const textMatch = !query || (
        u.displayName.toLowerCase().includes(query) ||
        u.username.toLowerCase().includes(query) ||
        u.bio?.toLowerCase().includes(query) ||
        u.location?.toLowerCase().includes(query) ||
        u.tags?.some(t => t.toLowerCase().includes(query))
      );

      // Trust Tier Filter
      const tierMatch = trustTiers.length === 0 || (u.trustTier && trustTiers.includes(u.trustTier));

      // Geo Filter (Simulated: check if location string contains user location string)
      const geoMatch = geoRadius === 'global' || !userData?.location || (u.location && userData.location && u.location.toLowerCase().includes(userData.location.split(',')[0].toLowerCase().trim()));

      // Date Filter (Joined At) - Optional for users but consistent
      const joinedAt = u.joinedAt as any;
      const joinedTime = joinedAt && typeof joinedAt === 'object' && 'toDate' in joinedAt ? joinedAt.toDate().getTime() : 0;
      const dateMatch = (!dateRange.start && !dateRange.end) || (joinedTime >= startTime && joinedTime <= endTime);

      return textMatch && tierMatch && geoMatch && dateMatch;
    });

    // 2. Filter Signals (Posts)
    const matchedSignals = posts.filter(p => {
      // Basic Text Match
      const textMatch = !query || (
        p.content.toLowerCase().includes(query) ||
        p.authorName.toLowerCase().includes(query) ||
        p.location?.toLowerCase().includes(query)
      );

      // Media Type Filter
      let mediaMatch = true;
      if (mediaType === 'visual') mediaMatch = !!(p.media && p.media.length > 0);
      else if (mediaType === 'image') mediaMatch = p.media?.some(m => m.type === 'image') || false;
      else if (mediaType === 'video') mediaMatch = p.media?.some(m => m.type === 'video') || false;
      else if (mediaType === 'text') mediaMatch = !p.media || p.media.length === 0;

      // Date Filter
      const postTime = p.timestamp && typeof p.timestamp === 'object' && 'toDate' in p.timestamp ? p.timestamp.toDate().getTime() : 0;
      const dateMatch = (!dateRange.start && !dateRange.end) || (postTime >= startTime && postTime <= endTime);

      // Geo Filter (Simulated based on post location or author location if available)
      const geoMatch = geoRadius === 'global' || !userData?.location || (p.location && p.location.toLowerCase().includes(userData.location.split(',')[0].toLowerCase().trim()));

      // Trust Tier Filter (Lookup author)
      // Note: This requires O(N*M) which is acceptable for client side filtering of <1000 items
      let trustMatch = true;
      if (trustTiers.length > 0) {
         const author = users.find(u => u.id === p.authorId);
         trustMatch = !!(author && author.trustTier && trustTiers.includes(author.trustTier));
      }

      return textMatch && mediaMatch && dateMatch && geoMatch && trustMatch;
    });

    return { nodes: matchedNodes, signals: matchedSignals };
  }, [posts, users, searchQuery, mediaType, dateRange, geoRadius, trustTiers, userData]);

  const showNodes = activeFilter === 'all' || activeFilter === 'nodes';
  const showSignals = activeFilter === 'all' || activeFilter === 'signals';

  const toggleTrustTier = (tier: string) => {
    setTrustTiers(prev => prev.includes(tier) ? prev.filter(t => t !== tier) : [...prev, tier]);
  };

  return (
    <div className="w-full max-w-6xl mx-auto pb-24">
      
      {/* 1. Header & Active Search Telemetry */}
      <div className="mb-8 pt-4 px-4 md:px-0">
        {searchQuery ? (
          <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white relative overflow-hidden shadow-2xl border border-white/10 animate-in slide-in-from-top-4 duration-500">
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 blur-[80px] rounded-full translate-x-1/3 -translate-y-1/3" />
             
             <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                   <div className="flex items-center gap-3 mb-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em] font-mono">Query_Active</span>
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

      {/* 2. Advanced Control Bar */}
      <div className="sticky top-[calc(var(--header-h)+1rem)] z-30 mb-8 px-2 md:px-0">
         <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-[2rem] p-1.5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] flex flex-col md:flex-row gap-2">
            
            <div className="flex items-center justify-between w-full">
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

                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`ml-auto px-5 py-2.5 rounded-[1.4rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${showFilters ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" /></svg>
                    FILTERS {(dateRange.start || geoRadius !== 'global' || trustTiers.length > 0 || mediaType !== 'any') && <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />}
                </button>
            </div>
         </div>

         {/* Collapsible Filter Panel */}
         {showFilters && (
             <div className="mt-4 p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-xl animate-in slide-in-from-top-4 duration-300">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                     
                     {/* 1. Temporal Range */}
                     <div className="space-y-3">
                         <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono ml-1">Temporal_Window</label>
                         <div className="flex flex-col gap-2">
                             <input 
                               type="date" 
                               value={dateRange.start}
                               onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                               className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/20"
                             />
                             <input 
                               type="date" 
                               value={dateRange.end}
                               onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                               className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/20"
                             />
                         </div>
                     </div>

                     {/* 2. Signal Format */}
                     <div className="space-y-3">
                         <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono ml-1">Signal_Type</label>
                         <div className="grid grid-cols-2 gap-2">
                             {(['any', 'visual', 'video', 'text'] as const).map(t => (
                                 <button
                                    key={t}
                                    onClick={() => setMediaType(t)}
                                    className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border ${mediaType === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                 >
                                     {t}
                                 </button>
                             ))}
                         </div>
                     </div>

                     {/* 3. Geo-Fencing */}
                     <div className="space-y-3">
                         <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono ml-1">Geo_Fencing</label>
                         <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                             <button 
                                onClick={() => setGeoRadius('global')}
                                className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${geoRadius === 'global' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-400'}`}
                             >
                                Global
                             </button>
                             <button 
                                onClick={() => setGeoRadius('local')}
                                className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${geoRadius === 'local' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-400'}`}
                             >
                                Local
                             </button>
                         </div>
                         {geoRadius === 'local' && (
                             <p className="text-[8px] text-emerald-600 dark:text-emerald-400 font-mono pl-1">
                                Filtering for nodes near: {userData?.location || 'Unknown'}
                             </p>
                         )}
                     </div>

                     {/* 4. Trust Protocol */}
                     <div className="space-y-3">
                         <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono ml-1">Trust_Clearance</label>
                         <div className="flex flex-wrap gap-2">
                             {['Alpha', 'Beta', 'Gamma'].map(tier => {
                                 const active = trustTiers.includes(tier);
                                 return (
                                     <button
                                        key={tier}
                                        onClick={() => toggleTrustTier(tier)}
                                        className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${
                                            active 
                                            ? 'bg-amber-500 text-white border-amber-500' 
                                            : 'bg-transparent text-slate-400 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                                        }`}
                                     >
                                         {tier}
                                     </button>
                                 );
                             })}
                         </div>
                     </div>

                 </div>
                 
                 <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                     <button 
                        onClick={() => {
                            setMediaType('any');
                            setDateRange({ start: '', end: '' });
                            setGeoRadius('global');
                            setTrustTiers([]);
                        }}
                        className="text-[9px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 transition-colors"
                     >
                        Reset Filters
                     </button>
                 </div>
             </div>
         )}
      </div>

      {/* 3. Content Matrix */}
      <div className="space-y-12 px-4 md:px-0">
         
         {/* NODE CLUSTER */}
         {showNodes && filteredData.nodes.length > 0 && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center gap-4 mb-6">
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Suggested_Nodes</span>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredData.nodes.slice(0, 9).map(user => (
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
                           <div className="mt-2 flex gap-1">
                                <span className="text-[7px] font-black bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 uppercase">{user.trustTier || 'GAMMA'}</span>
                                {user.location && <span className="text-[7px] font-black bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 uppercase truncate max-w-[80px]">{user.location}</span>}
                           </div>
                        </div>
                        <button className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 hover:bg-slate-950 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 flex items-center justify-center transition-all active:scale-90 shrink-0">
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
                                 {post.media[0].type === 'video' && (
                                     <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg">
                                         <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                     </div>
                                 )}
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