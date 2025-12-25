
import React, { useEffect, useMemo } from 'react';
import { Post, User, Region } from '../../types';
import { ICONS } from '../../constants';
import { CommentSection } from './CommentSection';

interface SinglePostViewProps {
  post: Post;
  userData: User | null;
  locale: Region;
  onClose: () => void;
  onLike: (id: string, freq?: string) => void;
  onBookmark: (id: string) => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SinglePostView: React.FC<SinglePostViewProps> = ({ 
  post, 
  userData, 
  locale, 
  onClose, 
  onLike,
  onBookmark,
  addToast 
}) => {
  
  // Scroll to top of the central viewport when mounting
  useEffect(() => {
    const mainViewport = document.querySelector('.scroll-viewport');
    if (mainViewport) mainViewport.scrollTo({ top: 0, behavior: 'smooth' });
    else window.scrollTo(0, 0);
  }, [post.id]);

  const formattedTimestamp = useMemo(() => {
    if (post.timestamp && post.timestamp.toDate) {
      return post.timestamp.toDate().toLocaleString(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
    // Fallback logic
    const now = new Date();
    // If post.createdAt already has date, use it, otherwise append.
    if (post.createdAt.length > 10) return post.createdAt;
    return `${now.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })}, ${post.createdAt}`;
  }, [post.timestamp, post.createdAt, locale]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32 max-w-4xl mx-auto w-full">
      
      {/* 1. NAVIGATION HEADER - Sticky & Adaptive */}
      <div className="flex items-center justify-between sticky top-0 z-30 py-4 -mt-6 px-2 bg-[#fcfcfd]/90 dark:bg-[#020617]/90 backdrop-blur-xl border-b border-transparent dark:border-slate-800/50 transition-colors">
        <button 
          onClick={onClose}
          className="flex items-center gap-3 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl transition-all active:scale-95 shadow-sm group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M15 19l-7-7 7-7" /></svg>
          <span className="text-[10px] font-black uppercase tracking-widest font-mono">Return_To_Stream</span>
        </button>
        
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
           <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">SIGNAL_ID:</span>
           <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 font-mono">{post.id.slice(0, 8).toUpperCase()}</span>
        </div>
      </div>

      {/* 2. MAIN SIGNAL CARD */}
      <article className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] dark:shadow-none overflow-hidden relative transition-colors">
        
        {/* Decorative Header Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 opacity-80" />

        <div className="p-8 md:p-10">
          {/* Author & Time */}
          <div className="flex items-start justify-between gap-4 mb-8">
             <div className="flex items-center gap-5">
               <div className="relative">
                 <img src={post.authorAvatar} className="w-16 h-16 rounded-[1.6rem] object-cover border-2 border-white dark:border-slate-800 shadow-md bg-slate-50 dark:bg-slate-800" alt="" />
                 <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 text-indigo-500 dark:text-indigo-400 p-1 rounded-lg shadow-sm border border-slate-50 dark:border-slate-700 scale-75">
                   <ICONS.Verified />
                 </div>
               </div>
               <div>
                  <h1 className="text-2xl md:text-3xl font-black text-slate-950 dark:text-white uppercase italic tracking-tighter leading-none mb-1.5 transition-colors">
                    {post.authorName}
                  </h1>
                  <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg inline-block">
                    <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] font-mono leading-none">
                      {formattedTimestamp}
                    </p>
                  </div>
               </div>
             </div>
             
             {post.relaySource && (
               <div className="hidden sm:flex flex-col items-end opacity-60">
                 <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">RELAY_SOURCE</span>
                 <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400">{post.relaySource.authorName}</span>
               </div>
             )}
          </div>

          {/* Content Body */}
          <div className="mb-10">
             <p className="text-xl md:text-2xl text-slate-800 dark:text-slate-200 font-medium leading-relaxed tracking-tight whitespace-pre-wrap transition-colors">
               {post.content}
             </p>
             
             {post.capturedStatus && (
               <div className="mt-8 inline-flex items-center gap-4 px-6 py-4 bg-slate-50/80 dark:bg-slate-800/80 rounded-[2rem] border border-slate-100 dark:border-slate-700 transition-colors">
                  <span className="text-2xl filter drop-shadow-sm">{post.capturedStatus.emoji}</span>
                  <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300 italic">"{post.capturedStatus.message}"</p>
               </div>
             )}
          </div>

          {/* Visual Assets */}
          {post.media && post.media.length > 0 && (
            <div className="rounded-[2.5rem] overflow-hidden bg-slate-950 shadow-xl border border-slate-100 dark:border-slate-800 mb-10 relative group/media">
               {post.media[0].type === 'image' ? (
                 <img src={post.media[0].url} className="w-full h-auto object-cover max-h-[600px]" alt="Signal Visual" />
               ) : (
                 <video src={post.media[0].url} className="w-full h-full max-h-[600px] object-cover" controls playsInline />
               )}
               {/* Cinematic gradient overlay */}
               <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/media:opacity-100 transition-opacity pointer-events-none" />
            </div>
          )}

          {/* Control Surface */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-8 border-t border-slate-100 dark:border-slate-800">
             <button 
               onClick={() => onLike(post.id)}
               className={`w-full sm:flex-1 h-16 rounded-[1.8rem] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg group ${
                 post.isLiked 
                   ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900 shadow-rose-100 dark:shadow-none' 
                   : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-rose-200 dark:hover:border-rose-800 hover:text-rose-500 dark:hover:text-rose-400'
               }`}
             >
               <svg className={`w-6 h-6 transition-transform ${post.isLiked ? 'scale-110' : 'group-hover:scale-110'}`} fill={post.isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
               <div className="flex flex-col items-start leading-none">
                 <span className="text-[11px] font-black uppercase tracking-widest">{post.isLiked ? 'PULSED' : 'PULSE'}</span>
                 <span className="text-[9px] font-mono opacity-60">{post.likes} Signals</span>
               </div>
             </button>

             <button className="w-full sm:flex-1 h-16 bg-indigo-600 dark:bg-indigo-500 text-white rounded-[1.8rem] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 dark:hover:bg-indigo-400 group">
               <div className="group-hover:rotate-180 transition-transform duration-500"><ICONS.Explore /></div>
               <div className="flex flex-col items-start leading-none">
                 <span className="text-[11px] font-black uppercase tracking-widest">RELAY</span>
                 <span className="text-[9px] font-mono opacity-60">{post.shares} Broadcasts</span>
               </div>
             </button>
             
             <button 
                onClick={() => onBookmark(post.id)}
                className={`w-full sm:w-16 h-16 rounded-[1.8rem] flex items-center justify-center transition-all active:scale-95 shadow-lg ${
                  post.bookmarkedBy?.includes(userData?.id || '') 
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400' 
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-white'
                }`}
             >
                <div className="scale-110"><ICONS.Saved /></div>
             </button>
          </div>
        </div>
      </article>

      {/* 3. NEURAL ECHOES (Comments) */}
      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-8 md:p-10 shadow-inner min-h-[300px] transition-colors">
         <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 shadow-sm border border-slate-100 dark:border-slate-700">
               <ICONS.Messages />
            </div>
            <div>
               <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">Neural_Echoes</h3>
               <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] font-mono mt-1">{post.comments} Responses</p>
            </div>
         </div>
         
         <div className="relative">
            <CommentSection 
              postId={post.id} 
              userData={userData} 
              addToast={addToast} 
              locale={locale} 
            />
         </div>
      </div>

    </div>
  );
};
