
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Post, User } from '../../types';
import { ICONS, PULSE_FREQUENCIES } from '../../constants';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { 
  deleteDoc, 
  doc, 
  updateDoc, 
  increment, 
  addDoc, 
  serverTimestamp, 
  collection
} = Firestore as any;
import { CommentSection } from './CommentSection';

interface PostCardProps {
  post: Post;
  onLike: (id: string, frequency?: string) => void;
  onBookmark?: (id: string) => void;
  onViewPost?: (post: Post) => void;
  locale?: string;
  isAuthor?: boolean;
  userData: User | null;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  onLike, 
  onBookmark,
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
  const pulseTimerRef = useRef<any>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  // Settings Check
  const shouldAutoPlay = userData?.settings?.appearance?.autoPlayVideo !== false;

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

  const signalVelocity = useMemo(() => {
    if (!post.timestamp) return 0;
    const postTime = post.timestamp.toDate ? post.timestamp.toDate().getTime() : new Date(post.createdAt).getTime();
    const now = Date.now();
    const hoursElapsed = Math.max((now - postTime) / (1000 * 60 * 60), 0.1);
    const totalEngagement = post.likes + post.comments + post.shares;
    return Math.round(totalEngagement / hoursElapsed * 10) / 10;
  }, [post.likes, post.comments, post.shares, post.timestamp]);

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
    const now = new Date();
    const dateStr = now.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
    return `${dateStr}, ${post.createdAt}`; 
  }, [post.timestamp, post.createdAt, locale]);

  const handlePurgeSignal = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthor || !db) return;
    setIsDeleting(true);
    setShowDeleteModal(false);
    try {
      if (post.relaySource && post.relaySource.postId) {
        await updateDoc(doc(db, 'posts', post.relaySource.postId), { shares: increment(-1) });
      }
      await deleteDoc(doc(db, 'posts', post.id));
      addToast(post.relaySource ? "Relay terminated" : "Signal purged", "success");
    } catch (e) {
      addToast("Purge failed", "error");
      setIsDeleting(false);
    }
  };

  const handlePulseStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    pulseTimerRef.current = setTimeout(() => {
      setIsPulseMenuOpen(true);
    }, 500);
  };

  const handlePulseEnd = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
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

  const selectFrequency = (e: React.MouseEvent, freqId: string) => {
    e.stopPropagation();
    onLike(post.id, freqId);
    setIsPulseMenuOpen(false);
    addToast(`${freqId.toUpperCase()} engaged`, 'success');
  };

  const handleRelay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!db || !userData) return;
    addToast("Initiating Relay...", "info");
    try {
      await addDoc(collection(db, 'posts'), {
        authorId: userData.id,
        authorName: userData.displayName,
        authorAvatar: userData.avatarUrl,
        content: post.content,
        contentLengthTier: post.contentLengthTier,
        media: post.media || [],
        likes: 0,
        comments: 0,
        shares: 0,
        createdAt: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        timestamp: serverTimestamp(),
        likedBy: [],
        relaySource: {
          postId: post.id,
          authorName: post.authorName,
          authorAvatar: post.authorAvatar
        }
      });
      await updateDoc(doc(db, 'posts', post.id), { shares: increment(1) });
      addToast("Signal Relayed", "success");
    } catch (e) {
      addToast("Relay failed", "error");
    }
  };

  const handleInlineReact = async (e: React.MouseEvent, chunkIndex: number, emoji: string) => {
    e.stopPropagation();
    if (!db || !userData) return;
    const postRef = doc(db, 'posts', post.id);
    const currentReactions = post.inlineReactions || {};
    const chunkReactions = currentReactions[chunkIndex] || [];
    const existing = chunkReactions.find(r => r.emoji === emoji);
    let updated;
    if (existing) {
      if (existing.users.includes(userData.id)) {
        updated = chunkReactions.map(r => r.emoji === emoji ? { ...r, count: r.count - 1, users: r.users.filter(u => u !== userData.id) } : r).filter(r => r.count > 0);
      } else {
        updated = chunkReactions.map(r => r.emoji === emoji ? { ...r, count: r.count + 1, users: [...r.users, userData.id] } : r);
      }
    } else {
      updated = [...chunkReactions, { emoji, count: 1, users: [userData.id] }];
    }
    try {
      await updateDoc(postRef, { [`inlineReactions.${chunkIndex}`]: updated });
    } catch (e) { addToast("Micro-Signal Error", "error"); }
  };

  if (isDeleting) return null;

  const isPulse = post.contentLengthTier === 'pulse';
  const isDeep = post.contentLengthTier === 'deep';
  // @ts-ignore
  const isBookmarked = post.isBookmarked || (post.bookmarkedBy && userData && post.bookmarkedBy.includes(userData.id));

  return (
    <article 
      onClick={() => onViewPost?.(post)}
      className={`group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] mb-10 relative cursor-pointer overflow-hidden ${isPulse ? 'border-l-[6px] border-l-indigo-600' : ''}`}
    >
      {/* 1. RELAY HEADER - System Style */}
      {post.relaySource && (
        <div className="px-8 py-3 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
           <div className="w-6 h-6 bg-white dark:bg-slate-700 rounded-lg flex items-center justify-center text-indigo-500 shadow-sm">
             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
           </div>
           <span className="text-[9px] font-black uppercase text-indigo-600 tracking-widest font-mono">
             SIGNAL_RELAYED_FROM: <span className="text-slate-900 dark:text-white">{post.relaySource.authorName}</span>
           </span>
        </div>
      )}

      <div className="p-6 md:p-9">
        
        {/* 2. NODE IDENTITY HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative group/avatar">
              <img src={post.authorAvatar} alt={post.authorName} className="w-14 h-14 rounded-[1.6rem] object-cover ring-4 ring-slate-50 dark:ring-slate-800 transition-all group-hover/avatar:ring-indigo-50 dark:group-hover/avatar:ring-indigo-900/30 group-hover/avatar:scale-105 z-10 relative bg-white dark:bg-slate-800" />
              {post.coAuthors?.map((ca, idx) => (
                <img key={ca.id} src={ca.avatar} className="absolute top-0 w-14 h-14 rounded-[1.6rem] object-cover border-2 border-white dark:border-slate-800 shadow-md z-0 -right-4 grayscale group-hover/avatar:grayscale-0 transition-all" style={{ zIndex: -idx }} alt="" />
              ))}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-[3px] border-white dark:border-slate-900 rounded-full z-20 shadow-sm" />
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 dark:text-white text-base tracking-tight leading-none uppercase italic">{post.authorName}</h3>
                <div className="text-indigo-500 scale-90"><ICONS.Verified /></div>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                 <div className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                   <p className="text-[8px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest font-mono leading-none whitespace-nowrap">
                     {formattedTimestamp}
                   </p>
                 </div>
                 {signalVelocity > 0.5 && (
                   <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-md border border-indigo-100 dark:border-indigo-900">
                     <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                     <span className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-wider">VELOCITY: {signalVelocity}</span>
                   </div>
                 )}
              </div>
            </div>
          </div>

          <div className="relative" ref={optionsRef} onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setShowOptions(!showOptions)}
              className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all active:scale-90 ${showOptions ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
            </button>
            {showOptions && (
              <div className="absolute right-0 mt-3 w-48 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-100 dark:border-slate-800 rounded-[1.5rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] overflow-hidden z-[100] animate-in zoom-in-95 slide-in-from-top-2 duration-200">
                <div className="p-1.5 space-y-0.5">
                  <button 
                    onClick={() => { onBookmark?.(post.id); setShowOptions(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all text-left group/opt"
                  >
                    <div className={`transition-colors scale-75 ${isBookmarked ? 'text-indigo-600' : 'text-slate-400 group-hover/opt:text-indigo-500'}`}><ICONS.Saved /></div>
                    <span className="text-[9px] font-black uppercase tracking-widest font-mono">
                      {isBookmarked ? 'Remove_Vault' : 'Save_Vault'}
                    </span>
                  </button>
                  {isAuthor && (
                    <button onClick={handlePurgeSignal} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all text-left border-t border-slate-50 dark:border-slate-800 mt-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
                      <span className="text-[9px] font-black uppercase tracking-widest font-mono">Purge_Node</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. CONTENT MATRIX */}
        <div className={`mb-8 ${isPulse ? 'text-center px-4' : ''}`}>
          <div className={`text-slate-800 dark:text-slate-200 leading-relaxed font-medium tracking-tight ${isPulse ? 'text-2xl md:text-4xl font-black italic uppercase text-slate-900 dark:text-white' : isDeep ? 'text-base md:text-lg border-l-4 border-indigo-100 dark:border-indigo-900 pl-6 py-1' : 'text-base md:text-lg'}`}>
            {textChunks.map((chunk, idx) => {
              const reactions = post.inlineReactions?.[idx] || [];
              return (
                <span key={idx} className="relative group/chunk inline-block">
                  <span className="hover:bg-indigo-50/80 dark:hover:bg-indigo-900/30 hover:text-indigo-900 dark:hover:text-indigo-200 rounded-lg transition-colors px-0.5 -mx-0.5 cursor-text">{chunk}</span>
                  
                  {/* Micro-Reaction Menu */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover/chunk:opacity-100 transition-all duration-300 z-10 pointer-events-none group-hover/chunk:pointer-events-auto scale-90 group-hover/chunk:scale-100 origin-bottom" onClick={(e) => e.stopPropagation()}>
                     <div className="bg-white dark:bg-slate-800 rounded-full p-1 shadow-xl border border-slate-100 dark:border-slate-700 flex gap-1">
                       {['🔥', '❤️', '💡', '🚀'].map(emoji => (
                         <button key={emoji} onClick={(e) => handleInlineReact(e, idx, emoji)} className="w-8 h-8 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full flex items-center justify-center text-sm transition-transform hover:scale-110">{emoji}</button>
                       ))}
                     </div>
                  </div>

                  {reactions.length > 0 && (
                    <div className="inline-flex gap-1 ml-1 align-middle translate-y-[-2px]">
                      {reactions.map(r => (
                        <div key={r.emoji} className="flex items-center gap-0.5 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm text-[9px] font-black">
                          {r.emoji} <span className="text-[8px] text-slate-400 font-mono">{r.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </span>
              );
            })}
          </div>
          
          {/* Captured Status Injection */}
          {post.capturedStatus && (
             <div className="mt-6 mb-2 inline-flex items-center gap-4 px-6 py-4 bg-slate-50/80 dark:bg-slate-800/80 rounded-[2rem] border border-slate-100 dark:border-slate-700 mx-auto max-w-full">
                <span className="text-2xl filter drop-shadow-sm">{post.capturedStatus.emoji}</span>
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300 italic">"{post.capturedStatus.message}"</p>
             </div>
          )}
        </div>

        {/* 4. VISUAL ARTIFACTS */}
        {post.media?.length > 0 && (
          <div className="relative rounded-[2.5rem] overflow-hidden mb-8 bg-slate-950 border border-slate-200/50 dark:border-slate-800 shadow-lg group/carousel">
            <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentMediaIndex * 100}%)` }}>
              {post.media.map((item, idx) => (
                <div key={idx} className="min-w-full flex items-center justify-center aspect-[4/3] md:aspect-video relative">
                  {item.type === 'image' ? (
                    <img src={item.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <video 
                      src={item.url} 
                      className="w-full h-full object-cover" 
                      controls 
                      playsInline
                      autoPlay={shouldAutoPlay}
                      muted={shouldAutoPlay} 
                    />
                  )}
                  {/* Cinematic Vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover/carousel:opacity-100 transition-opacity pointer-events-none" />
                </div>
              ))}
            </div>
            
            {post.media.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/20 backdrop-blur-md p-1.5 rounded-full border border-white/10">
                {post.media.map((_, idx) => (
                  <button 
                    key={idx} 
                    onClick={(e) => { e.stopPropagation(); setCurrentMediaIndex(idx); }}
                    className={`w-2 h-2 rounded-full transition-all ${currentMediaIndex === idx ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/60'}`} 
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5. TACTILE ACTION GRID */}
        <div className="flex items-center justify-between pt-2 relative">
          <div className="flex gap-3 md:gap-4 w-full">
            {/* PULSE BUTTON (Like) */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button 
                onMouseDown={handlePulseStart} onMouseUp={handlePulseEnd} onTouchStart={handlePulseStart} onTouchEnd={handlePulseEnd} 
                className={`flex items-center gap-3 h-12 md:h-14 px-5 md:px-6 rounded-2xl transition-all duration-300 group/btn border active:scale-95 ${
                  post.isLiked 
                    ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-100 dark:border-rose-900 text-rose-600 dark:text-rose-400' 
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-md'
                }`}
              >
                <div className={`transition-transform duration-500 ${post.isLiked ? 'scale-110' : 'group-hover/btn:scale-110'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill={post.isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                </div>
                <span className="text-xs md:text-sm font-black tracking-tighter tabular-nums">{(post.likes || 0).toLocaleString(locale)}</span>
              </button>
              
              {/* Ripple Effect Container */}
              {rippleEffect && (
                <div 
                  className={`absolute pointer-events-none rounded-full animate-ping opacity-20 bg-${rippleEffect.color}-500 z-50`}
                  style={{ left: rippleEffect.x, top: rippleEffect.y, width: '150px', height: '150px', marginLeft: '-75px', marginTop: '-75px' }}
                />
              )}

              {/* Frequency Selector */}
              {isPulseMenuOpen && (
                <>
                  <div className="fixed inset-0 z-[50] bg-transparent" onClick={() => setIsPulseMenuOpen(false)} />
                  <div className="absolute bottom-full left-0 mb-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[1.5rem] p-2 border border-slate-100 dark:border-slate-800 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.15)] flex gap-2 z-[60] animate-in slide-in-from-bottom-2 duration-300 origin-bottom-left">
                     {PULSE_FREQUENCIES.map(freq => (
                       <button 
                         key={freq.id} 
                         onClick={(e) => selectFrequency(e, freq.id)} 
                         className="w-10 h-10 rounded-xl flex items-center justify-center text-xl hover:scale-110 transition-transform bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 shadow-sm"
                         title={freq.label}
                       >
                         {freq.emoji}
                       </button>
                     ))}
                  </div>
                </>
              )}
            </div>

            {/* ECHO BUTTON (Comment) */}
            <button 
              onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }}
              className={`flex items-center gap-3 h-12 md:h-14 px-5 md:px-6 rounded-2xl transition-all duration-300 group/btn border active:scale-95 ${
                showComments 
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400' 
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-md'
              }`}
            >
              <div className="group-hover/btn:scale-110 transition-transform duration-500">
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785 0.596.596 0 0 0 .21.685 0.59.59 0 0 0 .44.03 6.041 6.041 0 0 0 2.986-1.334c.451.06.91.09 1.378.09Z" /></svg>
              </div>
              <span className="text-xs md:text-sm font-black tracking-tighter tabular-nums">{(post.comments || 0).toLocaleString(locale)}</span>
            </button>

            {/* RELAY BUTTON (Share) */}
            <button 
              onClick={handleRelay} 
              className="flex items-center gap-3 h-12 md:h-14 px-5 md:px-6 rounded-2xl transition-all duration-300 group/btn border bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-md hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-95"
            >
              <div className="group-hover/btn:rotate-180 transition-transform duration-700">
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
              </div>
              <span className="text-xs md:text-sm font-black tracking-tighter tabular-nums">{(post.shares || 0).toLocaleString(locale)}</span>
            </button>
          </div>

          <button 
            onClick={(e) => { e.stopPropagation(); onBookmark?.(post.id); }}
            className={`h-12 w-12 md:h-14 md:w-14 flex items-center justify-center rounded-2xl transition-all duration-300 active:scale-90 border border-transparent ${isBookmarked ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-900' : 'text-slate-300 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-100 dark:hover:border-slate-700'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill={isBookmarked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0-10.628a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5m0 10.628a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5" /></svg>
          </button>
        </div>

        {/* 6. NEURAL ECHO FEED (Comments) */}
        {showComments && (
          <div onClick={(e) => e.stopPropagation()} className="animate-in fade-in slide-in-from-top-4 duration-500">
            <CommentSection postId={post.id} userData={userData} addToast={addToast} locale={locale} />
          </div>
        )}
      </div>

      {/* 7. KINETIC ALERT MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300" onClick={(e) => e.stopPropagation()}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}></div>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] p-10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border border-white/20 dark:border-slate-800 overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-600" />
             <div className="text-center space-y-4 mb-10">
               <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-500 rounded-[1.5rem] flex items-center justify-center mx-auto mb-2 shadow-sm border border-rose-100 dark:border-rose-900">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
               </div>
               <h3 className="text-2xl font-black text-slate-950 dark:text-white tracking-tighter uppercase italic leading-none">PROTOCOL_ALERT</h3>
               <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed px-4">Terminate transmission sequence?</p>
             </div>
             <div className="flex flex-col gap-3">
                <button onClick={(e) => handlePurgeSignal(e)} className="w-full py-5 bg-rose-600 text-white rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-rose-200/20 hover:bg-rose-700 transition-all active:scale-95 italic">CONFIRM_PURGE</button>
                <button onClick={() => setShowDeleteModal(false)} className="w-full py-5 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95 italic">ABORT_ACTION</button>
             </div>
          </div>
        </div>
      )}
    </article>
  );
};
