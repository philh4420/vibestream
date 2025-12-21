
import React, { useEffect, useRef } from 'react';
import { Post, User, Region } from '../../types';
import { ICONS } from '../../constants';
import { CommentSection } from './CommentSection';

interface SinglePostViewProps {
  post: Post;
  userData: User | null;
  locale: Region;
  onClose: () => void;
  onLike: (id: string, freq?: string) => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SinglePostView: React.FC<SinglePostViewProps> = ({ 
  post, 
  userData, 
  locale, 
  onClose, 
  onLike,
  addToast 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Body scroll is handled by the main layout in non-modal mode
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [post.id]);

  return (
    <div className="w-full h-full min-h-screen animate-in fade-in slide-in-from-right-4 duration-500 bg-[#fcfcfd]">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 py-4">
        
        {/* Signal Aspect: Media & Content Area */}
        <div className="lg:w-[60%] flex flex-col gap-6">
          <div className="flex items-center gap-4 mb-2">
            <button 
              onClick={onClose}
              className="p-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 rounded-2xl transition-all active:scale-90 shadow-sm flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M15 19l-7-7 7-7" /></svg>
              <span className="text-[10px] font-black uppercase tracking-widest font-mono">Exit_Focal_Mode</span>
            </button>
          </div>

          <div className="bg-white rounded-[3.5rem] border border-precision shadow-sm overflow-hidden flex flex-col">
            {/* Author Header */}
            <div className="p-6 md:p-8 flex items-center justify-between border-b border-slate-50">
               <div className="flex items-center gap-4">
                 <img src={post.authorAvatar} className="w-12 h-12 rounded-2xl border border-slate-100" alt="" />
                 <div>
                    <p className="text-slate-950 font-black uppercase italic tracking-tighter text-sm leading-none">{post.authorName}</p>
                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest font-mono mt-1">NODE_SYNC_OK • {post.createdAt}</p>
                 </div>
               </div>
               <div className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest font-mono border border-indigo-100">
                  REF: {post.id.slice(0, 8).toUpperCase()}
               </div>
            </div>

            {/* Content Field */}
            <div className="p-8 md:p-10">
               <p className="text-2xl md:text-3xl font-bold text-slate-900 leading-[1.3] tracking-tight italic mb-8">
                 {post.content}
               </p>
               
               {post.capturedStatus && (
                 <div className="mb-8 flex items-center gap-3 px-5 py-3 bg-slate-50 rounded-2xl border border-slate-100 w-fit">
                    <span className="text-xl">{post.capturedStatus.emoji}</span>
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest font-mono italic">"{post.capturedStatus.message}"</span>
                 </div>
               )}

               {post.media && post.media.length > 0 && (
                 <div className="rounded-[2.5rem] overflow-hidden bg-slate-950 aspect-video shadow-2xl relative group">
                    {post.media[0].type === 'image' ? (
                      <img src={post.media[0].url} className="w-full h-full object-contain" alt="" />
                    ) : (
                      <video src={post.media[0].url} className="w-full h-full" controls playsInline />
                    )}
                 </div>
               )}
            </div>

            {/* Shared Controls */}
            <div className="p-8 border-t border-slate-50 bg-slate-50/20">
               <div className="flex items-center justify-between">
                  <div className="flex gap-4">
                     <button 
                       onClick={() => onLike(post.id)}
                       className={`flex items-center gap-3 px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl ${post.isLiked ? 'bg-rose-600 text-white shadow-rose-200' : 'bg-white text-slate-600 border border-slate-100'}`}
                     >
                       <svg className="w-4 h-4" fill={post.isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                       {post.isLiked ? 'PULSED' : 'PULSE_SYNC'}
                     </button>
                     <button 
                       className="flex items-center gap-3 px-8 py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-95"
                     >
                       <ICONS.Explore />
                       RELAY_SIGNAL
                     </button>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Right Aspect: Signal Analytics & Neural Echoes */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Performance Data */}
          <div className="bg-white rounded-[3.5rem] border border-precision p-8 shadow-sm">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mb-8 flex items-center gap-3">
               <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
               Signal_Analytics
             </h4>
             <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'PULSES', val: post.likes, icon: <ICONS.Resilience /> },
                  { label: 'ECHOES', val: post.comments, icon: <ICONS.Messages /> },
                  { label: 'RELAYS', val: post.shares, icon: <ICONS.Explore /> }
                ].map(m => (
                  <div key={m.label} className="bg-slate-50 border border-slate-100 p-6 rounded-[2rem] text-center group hover:bg-white hover:shadow-xl transition-all">
                     <div className="text-slate-300 scale-75 mb-3 flex justify-center group-hover:text-indigo-400 transition-colors">{m.icon}</div>
                     <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none mb-1 italic">{m.val.toLocaleString(locale)}</p>
                     <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest font-mono">{m.label}</p>
                  </div>
                ))}
             </div>
          </div>

          {/* Comms Layer */}
          <div className="bg-white rounded-[3.5rem] border border-precision p-8 shadow-sm flex-1">
             <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1 bg-slate-100" />
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono italic">Neural_Echo_Feed</h4>
                <div className="h-px flex-1 bg-slate-100" />
             </div>
             
             <CommentSection 
               postId={post.id} 
               userData={userData} 
               addToast={addToast} 
               locale={locale} 
             />
          </div>
        </div>

      </div>
    </div>
  );
};
