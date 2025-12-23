
import React, { useEffect, useRef, useMemo } from 'react';
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

  const formattedTimestamp = useMemo(() => {
    if (post.timestamp && post.timestamp.toDate) {
      return post.timestamp.toDate().toLocaleString(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    // Fallback logic to ensure date/year is present if timestamp object is missing (optimistic UI)
    const now = new Date();
    // If post.createdAt is just time (e.g. "14:30"), prepend date. 
    // If it's already full string, use it. simplified check:
    return post.createdAt.includes(',') ? post.createdAt : `${now.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })}, ${post.createdAt}`;
  }, [post.timestamp, post.createdAt, locale]);

  return (
    <div className="w-full h-full min-h-screen animate-in fade-in slide-in-from-right-4 duration-500 bg-[#fcfcfd]">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 py-6 px-4 md:px-8">
        
        {/* Signal Aspect: Media & Content Area */}
        <div className="lg:w-[60%] flex flex-col gap-6">
          <div className="flex items-center justify-between mb-2">
            <button 
              onClick={onClose}
              className="group flex items-center gap-3 px-5 py-3 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-900 rounded-2xl transition-all active:scale-95 shadow-sm"
            >
              <div className="text-slate-400 group-hover:-translate-x-1 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M15 19l-7-7 7-7" /></svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest font-mono">Return_To_Grid</span>
            </button>
            
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
               <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
               <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest font-mono">SIGNAL_LOCKED</span>
            </div>
          </div>

          <div className="bg-white rounded-[3.5rem] border border-precision shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col relative group/card">
            {/* Ambient Glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            {/* Author Header */}
            <div className="p-8 md:p-10 flex items-start justify-between border-b border-slate-50 relative z-10">
               <div className="flex items-center gap-5">
                 <div className="relative">
                   <img src={post.authorAvatar} className="w-16 h-16 rounded-[1.8rem] object-cover border-2 border-white shadow-md ring-1 ring-slate-100" alt="" />
                   <div className="absolute -bottom-1 -right-1 bg-white text-indigo-500 p-1 rounded-lg shadow-sm border border-slate-50 scale-75">
                     <ICONS.Verified />
                   </div>
                 </div>
                 <div>
                    <h2 className="text-2xl font-black text-slate-950 uppercase italic tracking-tighter leading-none">{post.authorName}</h2>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono bg-slate-100 px-2 py-0.5 rounded-md">{formattedTimestamp}</span>
                      {post.location && (
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest font-mono flex items-center gap-1">
                          <ICONS.Globe /> {post.location}
                        </span>
                      )}
                    </div>
                 </div>
               </div>
               <div className="hidden sm:block px-4 py-2 bg-slate-50 text-slate-400 rounded-2xl text-[9px] font-black uppercase tracking-widest font-mono border border-slate-100">
                  ID: {post.id.slice(0, 8).toUpperCase()}
               </div>
            </div>

            {/* Content Field */}
            <div className="p-8 md:p-12 relative z-10">
               <p className="text-2xl md:text-3xl font-medium text-slate-900 leading-[1.4] tracking-tight mb-10 whitespace-pre-wrap">
                 {post.content}
               </p>
               
               {post.capturedStatus && (
                 <div className="mb-10 inline-flex items-center gap-4 px-6 py-4 bg-slate-50 rounded-[1.5rem] border border-slate-100/80 shadow-sm">
                    <span className="text-3xl filter drop-shadow-sm">{post.capturedStatus.emoji}</span>
                    <div className="h-8 w-px bg-slate-200" />
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono mb-0.5">Current_Mood</p>
                      <p className="text-sm font-bold text-slate-700 italic">"{post.capturedStatus.message}"</p>
                    </div>
                 </div>
               )}

               {post.media && post.media.length > 0 && (
                 <div className="rounded-[2.5rem] overflow-hidden bg-slate-950 shadow-2xl relative group/media border border-slate-900">
                    {post.media[0].type === 'image' ? (
                      <img src={post.media[0].url} className="w-full h-auto object-cover max-h-[700px]" alt="" />
                    ) : (
                      <video src={post.media[0].url} className="w-full h-full max-h-[700px] object-cover" controls playsInline />
                    )}
                    {/* Media Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/media:opacity-100 transition-opacity pointer-events-none" />
                 </div>
               )}
            </div>

            {/* Shared Controls */}
            <div className="p-8 border-t border-slate-50 bg-slate-50/30 backdrop-blur-sm relative z-10">
               <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex w-full sm:w-auto gap-4">
                     <button 
                       onClick={() => onLike(post.id)}
                       className={`flex-1 sm:flex-none h-16 px-10 rounded-[1.8rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl flex items-center justify-center gap-4 group/btn ${post.isLiked ? 'bg-rose-600 text-white shadow-rose-200' : 'bg-white text-slate-600 border border-slate-100 hover:border-rose-200 hover:text-rose-600'}`}
                     >
                       <svg className={`w-6 h-6 transition-transform duration-500 ${post.isLiked ? 'scale-110' : 'group-hover/btn:scale-110'}`} fill={post.isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                       {post.isLiked ? 'PULSED' : 'PULSE'}
                     </button>
                     <button 
                       className="flex-1 sm:flex-none h-16 px-10 bg-indigo-600 text-white rounded-[1.8rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-4 group/btn"
                     >
                       <div className="group-hover/btn:rotate-180 transition-transform duration-700"><ICONS.Explore /></div>
                       RELAY
                     </button>
                  </div>
                  
                  {/* Quick Stats Pill */}
                  <div className="hidden sm:flex items-center gap-4 px-6 py-4 bg-white rounded-[1.5rem] border border-slate-100 shadow-sm">
                     <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">{post.likes}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pulses</span>
                     </div>
                     <div className="w-px h-4 bg-slate-200" />
                     <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">{post.comments}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Echoes</span>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Right Aspect: Signal Analytics & Neural Echoes */}
        <div className="lg:w-[40%] flex flex-col gap-6">
          {/* Performance Data - Dashboard Style */}
          <div className="bg-white rounded-[3rem] border border-precision p-8 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-[4rem] -mr-8 -mt-8 pointer-events-none" />
             
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mb-8 flex items-center gap-3 relative z-10">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
               Live_Telemetry
             </h4>
             
             <div className="grid grid-cols-3 gap-4 relative z-10">
                {[
                  { label: 'PULSES', val: post.likes, icon: <ICONS.Resilience />, color: 'text-rose-500' },
                  { label: 'ECHOES', val: post.comments, icon: <ICONS.Messages />, color: 'text-indigo-500' },
                  { label: 'RELAYS', val: post.shares, icon: <ICONS.Explore />, color: 'text-emerald-500' }
                ].map(m => (
                  <div key={m.label} className="bg-slate-50 border border-slate-100 p-5 rounded-[2rem] text-center group hover:bg-white hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                     <div className={`scale-90 mb-3 flex justify-center opacity-60 group-hover:opacity-100 transition-all ${m.color}`}>{m.icon}</div>
                     <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none mb-2 italic">{m.val.toLocaleString(locale)}</p>
                     <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest font-mono">{m.label}</p>
                  </div>
                ))}
             </div>
          </div>

          {/* Comms Layer */}
          <div className="bg-white rounded-[3rem] border border-precision p-8 md:p-10 shadow-sm flex-1 flex flex-col min-h-[500px]">
             <div className="flex items-center gap-4 mb-8 shrink-0">
                <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 shadow-inner">
                   <ICONS.Messages />
                </div>
                <div>
                   <h4 className="text-lg font-black text-slate-900 uppercase italic tracking-tighter leading-none">Neural_Echo_Feed</h4>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mt-1">Open Frequency Channel</p>
                </div>
             </div>
             
             <div className="flex-1 overflow-visible">
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
    </div>
  );
};
