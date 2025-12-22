
import React, { useState, useMemo } from 'react';
import { Post, User, Region } from '../../types';
import { ICONS } from '../../constants';

interface ExplorePageProps {
  posts: Post[];
  users: User[];
  onLike: (id: string) => void;
  onViewPost: (post: Post) => void;
  locale: Region;
  searchQuery?: string;
  onClearSearch?: () => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({ 
  posts, 
  users,
  onLike, 
  onViewPost, 
  locale,
  searchQuery = '',
  onClearSearch
}) => {
  const [filter, setFilter] = useState<'all' | 'signals' | 'nodes'>('all');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'media' | 'text'>('all');

  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    // 1. Filter Nodes (Users)
    const matchedNodes = users.filter(u => {
      if (!query) return false;
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
      // Basic Media Filter
      let matchesMedia = true;
      if (mediaFilter === 'media') matchesMedia = p.media && p.media.length > 0;
      if (mediaFilter === 'text') matchesMedia = !p.media || p.media.length === 0;
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
  }, [posts, users, searchQuery, mediaFilter]);

  const showNodes = filter === 'all' || filter === 'nodes';
  const showSignals = filter === 'all' || filter === 'signals';

  return (
    <div className="animate-in fade-in duration-700 space-y-10 pb-20">
      {/* Dynamic Grid Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-4">
             <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
             <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] font-mono">Neural_Discovery_Protocol</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Discover_Grid</h1>
        </div>
        
        <div className="flex flex-col gap-3 w-full md:w-auto">
          <div className="flex gap-1.5 p-1.5 bg-slate-100 rounded-2xl">
            {(['all', 'signals', 'nodes'] as const).map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {f}
              </button>
            ))}
          </div>
          
          {filter !== 'nodes' && (
            <div className="flex gap-1.5 p-1 bg-white border border-slate-100 rounded-xl">
              {(['all', 'media', 'text'] as const).map(mf => (
                <button 
                  key={mf}
                  onClick={() => setMediaFilter(mf)}
                  className={`flex-1 px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${mediaFilter === mf ? 'bg-indigo-50 text-indigo-700' : 'text-slate-300'}`}
                >
                  {mf}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Persistence Banner */}
      {searchQuery && (
        <div className="relative p-8 md:p-12 rounded-[3rem] overflow-hidden group">
           <div className="absolute inset-0 bg-indigo-600/5 backdrop-blur-3xl border border-indigo-100/50" />
           <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3 group-hover:scale-110 transition-transform duration-1000" />
           
           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6 text-center md:text-left flex-col md:flex-row">
                 <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-600 text-white rounded-[1.8rem] flex items-center justify-center shadow-2xl shadow-indigo-200 group-hover:rotate-12 transition-transform duration-500">
                   <ICONS.Search />
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] font-mono mb-2">Universal_Query_Match</p>
                   <h2 className="text-3xl md:text-5xl font-black text-indigo-950 italic uppercase tracking-tighter">"{searchQuery}"</h2>
                   <div className="flex gap-3 mt-4 justify-center md:justify-start">
                     <span className="px-3 py-1 bg-white rounded-lg text-[8px] font-black text-indigo-600 uppercase tracking-widest border border-indigo-100">{filteredData.signals.length} Signals</span>
                     <span className="px-3 py-1 bg-white rounded-lg text-[8px] font-black text-indigo-600 uppercase tracking-widest border border-indigo-100">{filteredData.nodes.length} Nodes</span>
                   </div>
                 </div>
              </div>
              <button 
                onClick={onClearSearch}
                className="px-10 py-5 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-95 border border-indigo-100 italic"
              >
                Reset_Grid_Protocol
              </button>
           </div>
        </div>
      )}

      {/* Results Matrix */}
      <div className="space-y-16">
        
        {/* Sector: Nodes (Users) */}
        {showNodes && filteredData.nodes.length > 0 && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-100" />
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] font-mono italic">Identified_Nodes</h3>
                <div className="h-px flex-1 bg-slate-100" />
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredData.nodes.map(user => (
                  <div key={user.id} className="group bg-white border border-slate-100 rounded-[2.5rem] p-6 hover:shadow-2xl hover:border-indigo-200 transition-all duration-500 flex flex-col items-center text-center relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                     <div className="relative mb-6">
                        <img src={user.avatarUrl} className="w-20 h-20 md:w-24 md:h-24 rounded-[1.8rem] object-cover ring-4 ring-slate-50 transition-transform group-hover:scale-105" alt="" />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg border border-slate-50">
                           <div className={`w-3 h-3 rounded-full ${user.presenceStatus === 'Online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                        </div>
                     </div>
                     <h4 className="text-lg font-black text-slate-950 uppercase italic tracking-tighter leading-none mb-1">{user.displayName}</h4>
                     <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest font-mono mb-4">@{user.username}</p>
                     <p className="text-xs text-slate-500 font-bold line-clamp-2 italic mb-6 px-4 leading-relaxed">"{user.bio || 'Encrypted node identity...'}"</p>
                     <button className="w-full py-3.5 bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-900 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all">Synchronize_Link</button>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* Sector: Signals (Posts) */}
        {showSignals && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
             <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-100" />
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] font-mono italic">Packet_Transmissions</h3>
                <div className="h-px flex-1 bg-slate-100" />
             </div>
             
             {filteredData.signals.length > 0 ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                 {filteredData.signals.map(post => (
                    <div 
                      key={post.id} 
                      onClick={() => onViewPost(post)}
                      className="group relative bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:border-indigo-200 transition-all duration-500 cursor-pointer aspect-[4/5] sm:aspect-square flex flex-col"
                    >
                      {post.media && post.media.length > 0 ? (
                        <div className="flex-1 overflow-hidden relative">
                          <img 
                            src={post.media[0].url} 
                            className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" 
                            alt="" 
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>
                      ) : (
                        <div className="flex-1 p-10 flex items-center justify-center bg-slate-50 group-hover:bg-indigo-50/30 transition-colors">
                          <p className="text-slate-600 font-bold text-center line-clamp-6 leading-relaxed italic text-lg md:text-xl">"{post.content}"</p>
                        </div>
                      )}

                      <div className="absolute bottom-0 left-0 right-0 p-8 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <img src={post.authorAvatar} className="w-10 h-10 rounded-xl border-2 border-white shadow-xl" alt="" />
                            <div className="min-w-0">
                               <p className="text-white text-[11px] font-black uppercase tracking-widest truncate">{post.authorName}</p>
                               <p className="text-white/40 text-[8px] font-black font-mono tracking-widest">SIGNAL_OK</p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <div className={`p-3 rounded-xl text-white ${post.isLiked ? 'bg-rose-500' : 'bg-white/20 backdrop-blur-md'}`}>
                              <svg className="w-5 h-5" fill={post.isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                 ))}
               </div>
             ) : (
               <div className="py-40 text-center bg-white rounded-[4rem] border border-slate-100 shadow-sm flex flex-col items-center">
                  <div className="w-24 h-24 bg-slate-50 rounded-[3rem] flex items-center justify-center mb-8 text-slate-200">
                     <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Signals_Not_Found</h2>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mt-3 px-10">Neural buffer cleared. No transmissions matching query detected in this sector.</p>
               </div>
             )}
          </div>
        )}

        {/* Global Empty State */}
        {filteredData.nodes.length === 0 && filteredData.signals.length === 0 && (
          <div className="py-60 text-center bg-white rounded-[5rem] border-precision shadow-heavy flex flex-col items-center justify-center mx-2">
            <div className="w-32 h-32 bg-slate-50 rounded-[4rem] flex items-center justify-center mb-10 text-slate-100 shadow-inner animate-pulse">
               <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/></svg>
            </div>
            <h2 className="text-3xl font-black text-slate-950 tracking-tighter uppercase italic">Total_Grid_Silence</h2>
            <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.6em] font-mono mt-4 italic px-12 leading-loose max-w-md">The neural query returned zero matches across all registered nodes and transmission fragments.</p>
            {searchQuery && (
              <button 
                onClick={onClearSearch}
                className="mt-12 px-12 py-6 bg-slate-950 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.5em] shadow-2xl hover:bg-black transition-all active:scale-95 italic ring-offset-4 ring-2 ring-slate-100"
              >
                RETURN_TO_CORE_GRID
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
