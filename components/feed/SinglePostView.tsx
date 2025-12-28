import React, { useEffect, useMemo } from 'react';
import { Post, User, Region } from '../../types';
import { ICONS } from '../../constants';
import { CommentSection } from './CommentSection';
import { extractUrls } from '../../lib/textUtils';
import { LinkPreview } from '../ui/LinkPreview';

interface SinglePostViewProps {
  post: Post;
  userData: User | null;
  locale: Region;
  onClose: () => void;
  onLike: (id: string, freq?: string) => void;
  onBookmark: (id: string) => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  blockedIds?: Set<string>;
}

export const SinglePostView: React.FC<SinglePostViewProps> = ({ 
  post, 
  userData, 
  locale, 
  onClose, 
  onLike,
  onBookmark,
  addToast,
  blockedIds
}) => {
  useEffect(() => {
    const mainViewport = document.querySelector('.scroll-viewport');
    if (mainViewport) mainViewport.scrollTo({ top: 0, behavior: 'smooth' });
    else window.scrollTo(0, 0);
  }, [post.id]);

  const formattedTimestamp = useMemo(() => {
    if (post.timestamp && post.timestamp.toDate) {
      return post.timestamp.toDate().toLocaleString(locale, {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
      });
    }
    return post.createdAt;
  }, [post.timestamp, post.createdAt, locale]);

  const borderClass = post.authorCosmetics?.border ? `cosmetic-border-${post.authorCosmetics.border}` : '';

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-right-6 duration-700 pb-40 max-w-5xl mx-auto w-full px-4 md:px-6">
      {/* Precision Header */}
      <div className="sticky top-0 z-50 py-6 -mx-4 px-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-3xl border-b border-slate-100 dark:border-slate-800 transition-colors mb-10">
        <div className="flex items-center justify-between max-w-5xl mx-auto w-full">
            <button onClick={onClose} className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-[1.5rem] shadow-sm transition-all active:scale-95 group hover:border-indigo-300">
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M15 19l-7-7 7-7" /></svg>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] font-mono">Synchronize_Return</span>
            </button>
            <div className="hidden md:flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Transmission_Live</span>
            </div>
        </div>
      </div>

      {/* Main Signal Display */}
      <article className="bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden relative shadow-2xl">
        {/* Author Bio Strip */}
        <div className="p-8 md:p-16 border-b border-slate-50 dark:border-slate-800/50">
          <div className="flex items-center gap-8">
             <div 
               onClick={() => window.dispatchEvent(new CustomEvent('vibe-navigate', { detail: { route: 'profile', userId: post.authorId } }))}
               className={`relative shrink-0 w-24 h-24 rounded-[2rem] cursor-pointer group ${borderClass}`}
             >
                <img src={post.authorAvatar} className="w-full h-full rounded-[2rem] object-cover ring-4 ring-slate-50 dark:ring-slate-800 bg-white dark:bg-slate-800 transition-transform duration-500 group-hover:scale-105" alt="" />
                <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2 rounded-xl shadow-xl border-4 border-white dark:border-slate-900"><ICONS.Verified /></div>
             </div>
             <div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-950 dark:text-white uppercase italic tracking-tighter leading-none mb-3">{post.authorName}</h1>
                <div className="flex flex-wrap items-center gap-4">
                    <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-mono bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-lg">Broadcast_ID: {post.id.slice(0, 8)}</span>
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">{formattedTimestamp}</span>
                </div>
             </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8 md:p-16">
          <div className="text-2xl md:text-3xl lg:text-4xl text-slate-800 dark:text-slate-200 font-medium leading-[1.4] tracking-tight whitespace-pre-wrap mb-14 ProseMirror">
             {post.content}
          </div>
          
          {post.media && post.media.length > 0 && (
             <div className="rounded-[3rem] overflow-hidden bg-slate-950 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.5)] border border-white/10 mb-14">
                 {post.media[0].type === 'image' ? (
                   <img src={post.media[0].url} className="w-full h-auto object-cover" alt="" />
                 ) : (
                   <video src={post.media[0].url} controls className="w-full h-full object-cover" />
                 )}
             </div>
          )}

          {/* Action Interface */}
          <div className="flex flex-col sm:flex-row gap-4 pt-12 border-t border-slate-100 dark:border-slate-800/50">
             <button 
                onClick={() => onLike(post.id)} 
                className={`flex-1 h-24 rounded-[2.5rem] flex flex-col items-center justify-center gap-1 transition-all active:scale-95 border ${post.isLiked ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 border-rose-100 dark:border-rose-900/50' : 'bg-slate-50 dark:bg-slate-800/40 border-transparent text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-200 shadow-sm'}`}
             >
               <div className={`transition-transform duration-300 ${post.isLiked ? 'scale-110' : 'group-hover:scale-125'}`}>
                  <svg className="w-8 h-8" fill={post.isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
               </div>
               <span className="text-[10px] font-black uppercase tracking-[0.3em] font-mono">{post.likes} RESONANCE_PULSES</span>
             </button>
             <button 
                onClick={() => { onBookmark(post.id); addToast(post.bookmarkedBy?.includes(userData?.id || '') ? "Archive Purged" : "Encoded to Vault", "success"); }}
                className="w-full sm:w-24 h-24 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800/40 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all active:scale-90"
             >
                <div className="scale-150"><ICONS.Saved /></div>
             </button>
          </div>
        </div>
      </article>

      {/* Comment Engine Viewport */}
      <div className="mt-10 px-2">
         <CommentSection 
            postId={post.id} 
            postAuthorId={post.authorId} 
            userData={userData} 
            addToast={addToast} 
            locale={locale} 
            blockedIds={blockedIds} 
         />
      </div>
    </div>
  );
};