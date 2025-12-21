
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Post, User } from '../../types';
import { ICONS, PULSE_FREQUENCIES } from '../../constants';
import { db } from '../../services/firebase';
import { 
  deleteDoc, 
  doc, 
  updateDoc,
  increment,
  addDoc,
  serverTimestamp,
  collection
} from 'firebase/firestore';
import { CommentSection } from './CommentSection';

interface PostCardProps {
  post: Post;
  onLike: (id: string, frequency?: string) => void;
  onViewPost?: (post: Post) => void;
  locale?: string;
  isAuthor?: boolean;
  userData: User | null;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  onLike, 
  onViewPost,
  locale = 'en-GB', 
  isAuthor = false, 
  userData, 
  addToast 
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  
  // Pulse Spectrum State
  const [isPulseMenuOpen, setIsPulseMenuOpen] = useState(false);
  const [rippleEffect, setRippleEffect] = useState<{ x: number, y: number, color: string } | null>(null);
  const pulseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  // Intentional Friction (Focus Protocol)
  const isHighVelocity = useMemo(() => (post.comments || 0) > 25, [post.comments]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };
    if (showOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showOptions]);

  const textChunks = useMemo(() => {
    return post.content.split(/([.!?]\s+)/).filter(Boolean).map((chunk, i, arr) => {
       if (i % 2 !== 0) return null;
       const next = arr[i+1];
       return chunk + (next || '');
    }).filter(Boolean);
  }, [post.content]);

  const handlePurgeSignal = async () => {
    if (!isAuthor || !db) return;
    setIsDeleting(true);
    try {
      if (post.relaySource && post.relaySource.postId) {
        await updateDoc(doc(db, 'posts', post.relaySource.postId), { shares: increment(-1) });
      }
      await deleteDoc(doc(db, 'posts', post.id));
      addToast("Signal purged from grid", "success");
    } catch (e) {
      addToast("Purge failed", "error");
      setIsDeleting(false);
    }
  };

  const handlePulseStart = (e: React.MouseEvent | React.TouchEvent) => {
    pulseTimerRef.current = setTimeout(() => setIsPulseMenuOpen(true), 500);
  };

  const handlePulseEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (pulseTimerRef.current) {
      clearTimeout(pulseTimerRef.current);
      if (!isPulseMenuOpen) {
        onLike(post.id);
        triggerRipple(e, 'rose');
      }
    }
  };

  const triggerRipple = (e: any, color: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;
    setRippleEffect({ x, y, color });
    setTimeout(() => setRippleEffect(null), 1000);
  };

  if (isDeleting) return null;

  return (
    <div className={`group relative bg-white border-precision rounded-[2.5rem] overflow-hidden transition-all duration-700 
      ${isHighVelocity ? 'bg-slate-50/90 shadow-inner scale-[0.98]' : 'hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)]'}`}>
      
      {/* Glass Refraction Sweep Effect */}
      <div className="glass-sweep-effect opacity-0 group-hover:animate-[glass-sweep_1.5s_ease-in-out]" />

      {/* Focus Protocol Badge */}
      {isHighVelocity && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
           <div className="bg-slate-900/80 backdrop-blur-xl text-white px-4 py-1.5 rounded-full text-[7px] font-black uppercase tracking-[0.4em] flex items-center gap-2 border border-white/10">
              <div className="w-1 h-1 bg-indigo-400 rounded-full animate-pulse" />
              Focus_Protocol_Active
           </div>
        </div>
      )}

      <div className="p-6 md:p-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <img src={post.authorAvatar} className="w-12 h-12 md:w-14 md:h-14 rounded-[1.4rem] object-cover ring-4 ring-slate-50" alt="" />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className={`font-black uppercase italic tracking-tighter transition-all ${isHighVelocity ? 'text-slate-600 text-xs' : 'text-slate-950 text-sm md:text-base'}`}>{post.authorName}</h3>
                <ICONS.Verified />
              </div>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest font-mono">{post.createdAt}</p>
            </div>
          </div>
          
          <button onClick={() => setShowOptions(!showOptions)} className="p-2.5 text-slate-300 hover:text-slate-900 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
          </button>
        </div>

        <div className={`mb-8 ${isHighVelocity ? 'opacity-80' : ''}`}>
          <div 
            onClick={() => onViewPost?.(post)}
            className={`cursor-pointer transition-all duration-500 font-medium tracking-tight text-slate-800 leading-relaxed
            ${post.contentLengthTier === 'pulse' ? 'text-2xl md:text-3xl font-black italic uppercase' : 'text-base md:text-lg'}`}
          >
            {post.content}
          </div>
        </div>

        {post.media && post.media.length > 0 && (
          <div onClick={() => onViewPost?.(post)} className="relative rounded-[2rem] overflow-hidden mb-8 bg-slate-100 border-precision cursor-pointer aspect-video group/media">
            <img src={post.media[0].url} className="w-full h-full object-cover transition-transform duration-700 group-hover/media:scale-105" alt="" />
          </div>
        )}

        <div className="flex items-center justify-between pt-6 border-t border-slate-50 relative">
          <div className="flex gap-8">
            <button 
              onMouseDown={handlePulseStart} onMouseUp={handlePulseEnd}
              className={`flex items-center gap-2.5 transition-all touch-active ${post.isLiked ? 'text-rose-500' : 'text-slate-400'}`}
            >
              <div className={`p-2.5 rounded-full transition-all ${post.isLiked ? 'bg-rose-50' : 'hover:bg-slate-50'}`}>
                <svg className="w-6 h-6" fill={post.isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
              </div>
              <span className="text-sm font-black italic">{(post.likes || 0).toLocaleString(locale)}</span>
            </button>

            <button 
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-2.5 transition-all touch-active ${showComments ? 'text-indigo-600' : 'text-slate-400'}`}
            >
              <div className={`p-2.5 rounded-full transition-all ${showComments ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785 0.596.596 0 0 0 .21.685 0.59.59 0 0 0 .44.03 6.041 6.041 0 0 0 2.986-1.334c.451.06.91.09 1.378.09Z" /></svg>
              </div>
              <span className="text-sm font-black italic">{(post.comments || 0).toLocaleString(locale)}</span>
            </button>
          </div>

          <button className="p-3 text-slate-300 hover:bg-slate-50 rounded-full transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314" /></svg>
          </button>
        </div>

        {showComments && (
          <CommentSection postId={post.id} userData={userData} addToast={addToast} locale={locale} />
        )}
      </div>

      {isPulseMenuOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/20 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsPulseMenuOpen(false)}>
          <div className="flex gap-4 p-6 bg-slate-900 rounded-[2.5rem] shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
            {PULSE_FREQUENCIES.map(f => (
              <button 
                key={f.id} 
                onClick={() => { onLike(post.id, f.id); setIsPulseMenuOpen(false); addToast(`${f.label} Synced`, 'success'); }}
                className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-3xl hover:scale-125 transition-transform active:scale-90"
              >
                {f.emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
