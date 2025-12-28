
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Post, User } from '../../types';
import { ICONS, PULSE_FREQUENCIES } from '../../constants';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { deleteDoc, doc, updateDoc, increment, addDoc, serverTimestamp, collection } = Firestore as any;
import { CommentSection } from './CommentSection';
import { DeleteConfirmationModal } from '../ui/DeleteConfirmationModal';

interface PostCardProps {
  post: Post;
  onLike: (id: string, frequency?: string) => void;
  onBookmark?: (id: string) => void;
  onViewPost?: (post: Post) => void;
  locale?: string;
  isAuthor?: boolean;
  userData: User | null;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  blockedIds?: Set<string>;
}

export const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  onLike, 
  onBookmark,
  onViewPost,
  locale = 'en-GB', 
  isAuthor = false, 
  userData, 
  addToast,
  blockedIds
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  
  const [isPulseMenuOpen, setIsPulseMenuOpen] = useState(false);
  const [rippleEffect, setRippleEffect] = useState<{ x: number, y: number, color: string } | null>(null);
  const pulseTimerRef = useRef<any>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

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

  const formattedTimestamp = useMemo(() => {
    if (post.timestamp && post.timestamp.toDate) {
      return post.timestamp.toDate().toLocaleString(locale, {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    }
    const now = new Date();
    const dateStr = now.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
    return `${dateStr}, ${post.createdAt}`; 
  }, [post.timestamp, post.createdAt, locale]);

  const initiateDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowOptions(false);
    setShowDeleteModal(true);
  };

  const handlePurgeSignal = async () => {
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
        // Only trigger visual ripple if mouse event
        if ('clientX' in e) {
            triggerRipple(e as React.MouseEvent, 'rose');
        }
      }
    }
  };

  const triggerRipple = (e: React.MouseEvent, color: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
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
        },
        authorCosmetics: {
            border: userData.cosmetics?.activeBorder,
            filter: userData.cosmetics?.activeFilter
        }
      });
      await updateDoc(doc(db, 'posts', post.id), { shares: increment(1) });
      if (post.authorId !== userData.id) {
          await addDoc(collection(db, 'notifications'), {
              type: 'relay',
              fromUserId: userData.id,
              fromUserName: userData.displayName,
              fromUserAvatar: userData.avatarUrl,
              toUserId: post.authorId,
              targetId: post.id,
              text: 'relayed your signal',
              isRead: false,
              timestamp: serverTimestamp(),
              pulseFrequency: 'velocity'
          });
      }
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
  const isBookmarked = post.bookmarkedBy && userData && post.bookmarkedBy.includes(userData.id);

  const borderClass = post.authorCosmetics?.border ? `cosmetic-border-${post.authorCosmetics.border}` : '';
  const filterClass = post.authorCosmetics?.filter ? `filter-${post.authorCosmetics.filter}` : '';

  return (
    <article 
      className={`group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] mb-10 relative cursor-pointer overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${isPulse ? 'border-l-[6px] border-l-indigo-600' : ''} ${filterClass}`}
      onClick={() => onViewPost?.(post)}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onViewPost) {
            e.preventDefault();
            onViewPost(post);
        }
      }}
      tabIndex={0}
      role="article"
      aria-label={`Post by ${post.authorName}`}
    >
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative group/avatar">
              <img 
                src={post.authorAvatar} 
                alt={post.authorName} 
                className={`w-14 h-14 rounded-[1.6rem] object-cover ring-4 ring-slate-50 dark:ring-slate-800 transition-all group-hover/avatar:scale-105 z-10 relative bg-white dark:bg-slate-800 ${borderClass}`} 
              />
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
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative" ref={optionsRef} onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => setShowOptions(!showOptions)}
                className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all active:scale-90 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${showOptions ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200/60 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300'}`}
                aria-label="Post Options"
                aria-expanded={showOptions}
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
                      <button onClick={initiateDelete} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all text-left border-t border-slate-50 dark:border-slate-800 mt-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
                        <span className="text-[9px] font-black uppercase tracking-widest font-mono">Purge_Node</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={`mb-8 ${isPulse ? 'text-center px-4' : ''}`}>
          <div className={`text-slate-800 dark:text-slate-200 leading-relaxed font-medium tracking-tight ${isPulse ? 'text-2xl md:text-4xl font-black italic uppercase text-slate-900 dark:text-white' : isDeep ? 'text-base md:text-lg border-l-4 border-indigo-100 dark:border-indigo-900 pl-6 py-1' : 'text-base md:text-lg'}`}>
            {textChunks.map((chunk, idx) => {
              const reactions = post.inlineReactions?.[idx] || [];
              return (
                <span key={idx} className="relative group/chunk inline-block">
                  <span className="hover:bg-indigo-50/80 dark:hover:bg-indigo-900/30 hover:text-indigo-900 dark:hover:text-indigo-200 rounded-lg transition-colors px-0.5 -mx-0.5 cursor-text">{chunk}</span>
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
        </div>

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
                    aria-label={`View media ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 relative">
          <div className="flex gap-3 md:gap-4 w-full">
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button 
                onMouseDown={handlePulseStart} onMouseUp={handlePulseEnd} onTouchStart={handlePulseStart} onTouchEnd={handlePulseEnd} 
                className={`flex items-center gap-3 h-12 md:h-14 px-5 md:px-6 rounded-2xl transition-all duration-300 group/btn border active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  post.isLiked 
                    ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-100 dark:border-rose-900 text-rose-600 dark:text-rose-400' 
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-md'
                }`}
                aria-label={post.isLiked ? "Unlike post" : "Like post"}
              >
                <div className={`transition-transform duration-500 ${post.isLiked ? 'scale-110' : 'group-hover/btn:scale-110'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill={post.isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                </div>
                <span className="text-xs md:text-sm font-black tracking-tighter tabular-nums">{(post.likes || 0).toLocaleString(locale)}</span>
              </button>
              
              {rippleEffect && (
                <div 
                  className={`absolute pointer-events-none rounded-full animate-ping opacity-20 bg-${rippleEffect.color}-500 z-50`}
                  style={{ left: rippleEffect.x, top: rippleEffect.y, width: '150px', height: '150px', marginLeft: '-75px', marginTop: '-75px' }}
                />
              )}

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
                         aria-label={`React with ${freq.label}`}
                       >
                         {freq.emoji}
                       </button>
                     ))}
                  </div>
                </>
              )}
            </div>

            <button 
              onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }}
              className={`flex items-center gap-3 h-12 md:h-14 px-5 md:px-6 rounded-2xl transition-all duration-300 group/btn border active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                showComments 
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400' 
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-md'
              }`}
              aria-label={showComments ? "Hide comments" : "Show comments"}
            >
              <div className="group-hover/btn:scale-110 transition-transform duration-500">
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785 0.596.596 0 0 0 .21.685 0.59.59 0 0 0 .44.03 6.041 6.041 0 0 0 2.986-1.334c.451.06.91.09 1.378.09Z" /></svg>
              </div>
              <span className="text-xs md:text-sm font-black tracking-tighter tabular-nums">{(post.comments || 0).toLocaleString(locale)}</span>
            </button>

            <button 
              onClick={handleRelay} 
              className="flex items-center gap-3 h-12 md:h-14 px-5 md:px-6 rounded-2xl transition-all duration-300 group/btn border bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-md hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Relay post"
            >
              <div className="group-hover/btn:rotate-180 transition-transform duration-700">
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
              </div>
              <span className="text-xs md:text-sm font-black tracking-tighter tabular-nums">{(post.shares || 0).toLocaleString(locale)}</span>
            </button>
          </div>

          <button 
            onClick={(e) => { e.stopPropagation(); onBookmark?.(post.id); }}
            className={`h-12 w-12 md:h-14 md:w-14 flex items-center justify-center rounded-2xl transition-all duration-300 active:scale-90 border border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isBookmarked ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-900' : 'text-slate-300 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-100 dark:hover:border-slate-700'}`}
            aria-label={isBookmarked ? "Remove bookmark" : "Bookmark post"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill={isBookmarked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0-10.628a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5m0 10.628a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5" /></svg>
          </button>
        </div>

        {showComments && (
          <div onClick={(e) => e.stopPropagation()} className="animate-in fade-in slide-in-from-top-4 duration-500">
            <CommentSection 
                postId={post.id} 
                postAuthorId={post.authorId}
                userData={userData} 
                addToast={addToast} 
                locale={locale} 
                blockedIds={blockedIds}
            />
          </div>
        )}
      </div>

      <DeleteConfirmationModal 
        isOpen={showDeleteModal}
        title="PROTOCOL_ALERT"
        description="Terminate transmission sequence? This action is irreversible."
        onConfirm={handlePurgeSignal}
        onCancel={() => setShowDeleteModal(false)}
        confirmText="CONFIRM_PURGE"
      />
    </article>
  );
};
