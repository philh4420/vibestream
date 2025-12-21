
import React, { useEffect, useRef } from 'react';
import { Post, User, Region } from '../../types';
import { ICONS, PULSE_FREQUENCIES } from '../../constants';
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

  // Lock body scroll when signal is focused
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center p-0 md:p-6 lg:p-10 animate-in fade-in duration-300">
      {/* Dynamic Glass Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-3xl transition-opacity" 
        onClick={onClose} 
      />
      
      <div className="relative bg-white w-full max-w-[1400px] h-full md:h-[90vh] md:rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col lg:flex-row animate-in slide-in-from-bottom-10 zoom-in-95 duration-500">
        
        {/* Left Aspect: Media Interface (60%) */}
        <div className="lg:w-[60%] bg-slate-950 flex flex-col relative group shrink-0">
          <div className="absolute top-6 left-6 z-20 flex gap-3">
             <button 
               onClick={onClose}
               className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white rounded-2xl transition-all active:scale-90 border border-white/10"
             >
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M15 19l-7-7 7-7" /></svg>
             </button>
          </div>

          <div className="flex-1 flex items-center justify-center overflow-hidden">
            {post.media && post.media.length > 0 ? (
              post.media[0].type === 'image' ? (
                <img 
                  src={post.media[0].url} 
                  className="w-full h-full object-contain" 
                  alt="Signal Artifact" 
                />
              ) : (
                <video 
                  src={post.media[0].url} 
                  className="w-full h-full" 
                  controls 
                  autoPlay 
                  playsInline 
                />
              )
            ) : (
              <div className="text-center space-y-6 px-10">
                 <div className="w-24 h-24 bg-white/5 rounded-[3rem] flex items-center justify-center mx-auto border border-white/10">
                    <ICONS.Explore />
                 </div>
                 <p className="text-[12px] font-black text-white/20 uppercase tracking-[0.6em] font-mono italic">Packet_Contains_No_Visual_Data</p>
              </div>
            )}
          </div>
          
          {/* Signal Identity Ribbon (Overlay) */}
          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none">
             <div className="flex items-center gap-4">
                <img src={post.authorAvatar} className="w-12 h-12 rounded-xl border border-white/20" alt="" />
                <div>
                   <p className="text-white font-black uppercase italic tracking-tighter text-sm leading-none">{post.authorName}</p>
                   <p className="text-white/40 text-[9px] font-black uppercase tracking-widest font-mono mt-1">NODE_SYNC_ESTABLISHED</p>
                </div>
             </div>
          </div>
        </div>

        {/* Right Aspect: Signal Interactions (40%) */}
        <div className="flex-1 flex flex-col bg-white min-w-0">
          {/* Metadata Header */}
          <div className="p-8 border-b border-slate-50 flex items-center justify-between shrink-0">
             <div className="flex items-center gap-4">
                <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest font-mono border border-indigo-100">
                  REF: {post.id.slice(0, 8).toUpperCase()}
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                   <div className="w-1 h-1 bg-current rounded-full" />
                   <span className="text-[9px] font-black uppercase tracking-widest font-mono">{post.createdAt}</span>
                </div>
             </div>
             <button onClick={onClose} className="lg:hidden p-3 bg-slate-50 rounded-xl"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar scroll-container" ref={scrollRef}>
             <div className="p-8 md:p-10">
                {/* Signal Content */}
                <div className="mb-10">
                   <p className="text-2xl md:text-3xl font-bold text-slate-900 leading-[1.3] tracking-tight italic">
                     {post.content}
                   </p>
                   {post.capturedStatus && (
                     <div className="mt-6 flex items-center gap-3 px-5 py-3 bg-slate-50 rounded-2xl border border-slate-100 w-fit">
                        <span className="text-xl">{post.capturedStatus.emoji}</span>
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest font-mono italic">"{post.capturedStatus.message}"</span>
                     </div>
                   )}
                </div>

                {/* Metrics Cluster */}
                <div className="grid grid-cols-3 gap-4 mb-12">
                   {[
                     { label: 'PULSES', val: post.likes, icon: <ICONS.Resilience /> },
                     { label: 'ECHOES', val: post.comments, icon: <ICONS.Messages /> },
                     { label: 'RELAYS', val: post.shares, icon: <ICONS.Explore /> }
                   ].map(m => (
                     <div key={m.label} className="bg-slate-50/50 border border-slate-100 p-5 rounded-[2rem] text-center">
                        <div className="text-slate-300 scale-75 mb-2 flex justify-center">{m.icon}</div>
                        <p className="text-xl font-black text-slate-900 tracking-tighter leading-none mb-1">{m.val.toLocaleString(locale)}</p>
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest font-mono">{m.label}</p>
                     </div>
                   ))}
                </div>

                {/* Main Echo Matrix (Comments) */}
                <div className="space-y-6">
                   <div className="flex items-center gap-4 mb-8">
                      <div className="h-px flex-1 bg-slate-100" />
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Neural_Echoes</h4>
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

          {/* Persistent Action Dock */}
          <div className="p-8 border-t border-slate-50 bg-slate-50/30 shrink-0">
             <div className="flex items-center justify-between">
                <div className="flex gap-4">
                   <button 
                     onClick={() => onLike(post.id)}
                     className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg ${post.isLiked ? 'bg-rose-600 text-white shadow-rose-200' : 'bg-white text-slate-600 border border-slate-100'}`}
                   >
                     <svg className="w-4 h-4" fill={post.isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                     PULSE
                   </button>
                   <button 
                     className="flex items-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all active:scale-95"
                   >
                     <ICONS.Explore />
                     RELAY
                   </button>
                </div>
                <button className="p-4 text-slate-400 hover:text-slate-900 transition-colors">
                   <ICONS.Saved />
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
