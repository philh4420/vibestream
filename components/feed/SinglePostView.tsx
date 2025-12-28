
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
    const now = new Date();
    if (post.createdAt.length > 10) return post.createdAt;
    return `${now.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })}, ${post.createdAt}`;
  }, [post.timestamp, post.createdAt, locale]);

  const borderClass = post.authorCosmetics?.border ? `cosmetic-border-${post.authorCosmetics.border}` : '';

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32 max-w-5xl mx-auto w-full px-4">
      <div className="flex items-center justify-between relative z-30 py-4 -mt-6 px-2 bg-[#fcfcfd]/90 dark:bg-[#020617]/90 backdrop-blur-xl transition-colors">
        <button onClick={onClose} className="flex items-center gap-3 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl shadow-sm transition-all active:scale-95 group">
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M15 19l-7-7 7-7" /></svg>
          <span className="text-[10px] font-black uppercase tracking-widest font-mono">Return_To_Stream</span>
        </button>
      </div>

      <article className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 overflow-hidden relative">
        <div className="p-8 md:p-14">
          <div className="flex items-start justify-between gap-4 mb-10">
             <div className="flex items-center gap-6">
               <div className={`relative shrink-0 w-20 h-20 rounded-[1.8rem] ${borderClass}`}>
                 <img src={post.authorAvatar} className="w-full h-full rounded-[1.8rem] object-cover ring-4 ring-slate-50 dark:ring-slate-800 bg-white dark:bg-slate-800" alt="" />
               </div>
               <div>
                  <h1 className="text-3xl md:text-4xl font-black text-slate-950 dark:text-white uppercase italic tracking-tighter leading-none mb-2">{post.authorName}</h1>
                  <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] font-mono">{formattedTimestamp}</p>
               </div>
          </div></div>

          <div className="mb-12">
             <div className="text-2xl md:text-3xl text-slate-800 dark:text-slate-200 font-medium leading-relaxed tracking-tight whitespace-pre-wrap">
               {post.content}
             </div>
             {post.media && post.media.length > 0 && (
                <div className="mt-10 rounded-[3rem] overflow-hidden bg-slate-950 shadow-2xl border border-slate-100 dark:border-slate-800">
                    {post.media[0].type === 'image' ? (
                      <img src={post.media[0].url} className="w-full h-auto object-cover" alt="" />
                    ) : (
                      <video src={post.media[0].url} controls className="w-full h-full object-cover" />
                    )}
                </div>
             )}
          </div>

          <div className="flex gap-4 pt-10 border-t border-slate-100 dark:border-slate-800">
             <button onClick={() => onLike(post.id)} className={`flex-1 h-20 rounded-[2.2rem] flex items-center justify-center gap-4 transition-all active:scale-95 ${post.isLiked ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600'}`}>
               <svg className="w-8 h-8" fill={post.isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
               <span className="text-sm font-black uppercase tracking-widest">{post.likes} PULSES</span>
             </button>
             <button onClick={() => onBookmark(post.id)} className="w-20 h-20 rounded-[2.2rem] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-sm"><ICONS.Saved /></button>
          </div>
        </div>
      </article>

      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[3.5rem] p-8 md:p-14 shadow-inner">
         <CommentSection postId={post.id} postAuthorId={post.authorId} userData={userData} addToast={addToast} locale={locale} blockedIds={blockedIds} />
      </div>
    </div>
  );
};
