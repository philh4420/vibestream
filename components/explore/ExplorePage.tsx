
import React, { useState, useMemo } from 'react';
import { Post, Region } from '../../types';
import { ICONS } from '../../constants';

interface ExplorePageProps {
  posts: Post[];
  onLike: (id: string) => void;
  onViewPost: (post: Post) => void;
  locale: Region;
  searchQuery?: string;
  onClearSearch?: () => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({ 
  posts, 
  onLike, 
  onViewPost, 
  locale,
  searchQuery = '',
  onClearSearch
}) => {
  const [filter, setFilter] = useState<'all' | 'media' | 'text'>('all');

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      // 1. Apply Media/Text Filter
      let matchesType = true;
      if (filter === 'media') matchesType = post.media && post.media.length > 0;
      if (filter === 'text') matchesType = !post.media || post.media.length === 0;
      
      if (!matchesType) return false;

      // 2. Apply Global Search Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesContent = post.content.toLowerCase().includes(query);
        const matchesAuthor = post.authorName.toLowerCase().includes(query);
        return matchesContent || matchesAuthor;
      }

      return true;
    });
  }, [posts, filter, searchQuery]);

  return (
    <div className="animate-in fade-in duration-700 space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Discover_Grid</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mt-3">
            Scanning Global Data Streams • Neural Filter: {filter.toUpperCase()}
          </p>
        </div>
        
        <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl overflow-x-auto no-scrollbar max-w-full">
          {(['all', 'media', 'text'] as const).map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {searchQuery && (
        <div className="flex items-center justify-between p-6 bg-indigo-50 border border-indigo-100 rounded-[2rem] animate-in slide-in-from-top-4 duration-500">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                <ICONS.Search />
              </div>
              <div>
                <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest font-mono">Signal_Results_For</p>
                <h2 className="text-xl font-black text-indigo-900 italic uppercase">"{searchQuery}"</h2>
              </div>
           </div>
           <button 
             onClick={onClearSearch}
             className="px-5 py-2.5 bg-white text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
           >
             Clear_Filter
           </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPosts.length > 0 ? (
          filteredPosts.map(post => (
            <div 
              key={post.id} 
              onClick={() => onViewPost(post)}
              className="group relative bg-white border-precision rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:border-indigo-200 transition-all duration-500 cursor-pointer aspect-[4/5] sm:aspect-square flex flex-col"
            >
              {post.media && post.media.length > 0 ? (
                <div className="flex-1 overflow-hidden relative">
                  <img 
                    src={post.media[0].url} 
                    className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" 
                    alt="" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              ) : (
                <div className="flex-1 p-8 flex items-center justify-center bg-slate-50 group-hover:bg-indigo-50/30 transition-colors">
                  <p className="text-slate-600 font-bold text-center line-clamp-6 leading-relaxed italic">"{post.content}"</p>
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={post.authorAvatar} className="w-8 h-8 rounded-full border border-white" alt="" />
                    <span className="text-white text-[10px] font-black uppercase tracking-widest truncate max-w-[120px]">{post.authorName}</span>
                  </div>
                  <div className="flex gap-3">
                    <div 
                      className={`p-2 rounded-lg text-white ${post.isLiked ? 'bg-rose-500' : 'bg-white/20 backdrop-blur-md'}`}
                    >
                      <svg className="w-4 h-4" fill={post.isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-precision shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-8 text-slate-200">
               <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/></svg>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">No_Signals_Logged</h2>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mt-3 italic px-10">Neural buffer cleared. No fragments matching your search query detected.</p>
            {searchQuery && (
              <button 
                onClick={onClearSearch}
                className="mt-10 px-8 py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95 italic"
              >
                RETURN_TO_GLOBAL_FEED
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
