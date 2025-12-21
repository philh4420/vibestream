
import React, { useState } from 'react';
import { Post, Region } from '../../types';
import { ICONS } from '../../constants';

interface ExplorePageProps {
  posts: Post[];
  onLike: (id: string) => void;
  onViewPost: (post: Post) => void;
  locale: Region;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({ posts, onLike, onViewPost, locale }) => {
  const [filter, setFilter] = useState<'all' | 'media' | 'text'>('all');

  const filteredPosts = posts.filter(post => {
    if (filter === 'media') return post.media && post.media.length > 0;
    if (filter === 'text') return !post.media || post.media.length === 0;
    return true;
  });

  return (
    <div className="animate-in fade-in duration-700 space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic">Discover_Grid</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mt-2">Scanning Global Data Streams • Neural Filter: {filter.toUpperCase()}</p>
        </div>
        
        <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl">
          {(['all', 'media', 'text'] as const).map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

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
                    <span className="text-white text-[10px] font-black uppercase tracking-widest">{post.authorName}</span>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onLike(post.id); }} 
                      className="p-2 bg-white/20 backdrop-blur-md rounded-lg text-white hover:bg-rose-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill={post.isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-precision">
            <p className="text-slate-300 font-black uppercase tracking-[0.4em] font-mono italic">No signals matching filter protocols...</p>
          </div>
        )}
      </div>
    </div>
  );
};
