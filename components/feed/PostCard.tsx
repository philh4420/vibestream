
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
  locale?: string;
  isAuthor?: boolean;
  userData: User | null;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onLike, locale = 'en-GB', isAuthor = false, userData, addToast }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(post.bookmarkedBy?.includes(userData?.id || '') || false);
  
  // Pulse Spectrum State
  const [isPulseMenuOpen, setIsPulseMenuOpen] = useState(false);
  const [rippleEffect, setRippleEffect] = useState<{ x: number, y: number, color: string } | null>(null);
  const pulseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const textChunks = useMemo(() => {
    return post.content.split(/([.!?]\s+)/).filter(Boolean).map((chunk, i, arr) => {
       if (i % 2 !== 0) return null;
       const next = arr[i+1];
       return chunk + (next || '');
    }).filter(Boolean);
  }, [post.content]);

  // Signal Velocity Calculation
  const signalVelocity = useMemo(() => {
    if (!post.timestamp) return 0;
    const postTime = post.timestamp.toDate ? post.timestamp.toDate().getTime() : new Date(post.createdAt).getTime();
    const now = Date.now();
    const hoursElapsed = Math.max((now - postTime) / (1000 * 60 * 60), 0.1);
    const totalEngagement = post.likes + post.comments + post.shares;
    return Math.round(totalEngagement / hoursElapsed * 10) / 10;
  }, [post.likes, post.comments, post.shares, post.timestamp]);

  const handlePurgeSignal = async () => {
    if (!isAuthor || !db) return;
    setIsDeleting(true);
    setShowDeleteModal(false);
    try {
      await deleteDoc(doc(db, 'posts', post.id));
      addToast("Signal purged from grid", "success");
    } catch (e) {
      addToast("Purge failed: Access denied", "error");
      setIsDeleting(false);
    }
  };

  const handlePulseStart = (e: React.MouseEvent | React.TouchEvent) => {
    pulseTimerRef.current = setTimeout(() => {
      setIsPulseMenuOpen(true);
    }, 500);
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

  const selectFrequency = (freqId: string) => {
    onLike(post.id, freqId);
    setIsPulseMenuOpen(false);
    addToast(`${freqId.toUpperCase()} Frequency Engaged`, 'success');
  };

  const handleRelay = async () => {
    if (!db || !userData) return;
    addToast("Initiating Signal Relay...", "info");
    try {
      // Fix: Added missing collection import from firebase/firestore
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
      addToast("Signal Relayed successfully", "success");
    } catch (e) {
      addToast("Relay failed: Grid interference", "error");
    }
  };

  const handleInlineReact = async (chunkIndex: number, emoji: string) => {
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
      addToast("Micro-Signal Synchronized", "success");
    } catch (e) {
      addToast("Heatmap Update Failed", "error");
    }
  };

  if (isDeleting) return null;

  const isPulse = post.contentLengthTier === 'pulse';
  const isDeep = post.contentLengthTier === 'deep';

  return (
    <div className={`group bg-white border-precision rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] mb-8 relative ${isPulse ? 'border-l-8 border-l-indigo-600' : ''}`}>
      
      {/* Visual Ripple Effect */}
      {rippleEffect && (
        <div 
          className={`absolute pointer-events-none rounded-full animate-ping opacity-20 bg-${rippleEffect.color}-500`}
          style={{ 
            left: rippleEffect.x, 
            top: rippleEffect.y, 
            width: '200px', 
            height: '200px', 
            marginLeft: '-100px', 
            marginTop: '-100px' 
          }}
        />
      )}

      {/* Relay Lineage Header */}
      {post.relaySource && (
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
              <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest font-mono">Signal_Relay_From: {post.relaySource.authorName}</span>
           </div>
        </div>
      )}

      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative group/avatar cursor-pointer flex items-center">
              <img 
                src={post.authorAvatar} 
                alt={post.authorName} 
                className="w-12 h-12 md:w-14 md:h-14 rounded-[1.4rem] object-cover ring-4 ring-slate-50 transition-all group-hover/avatar:ring-indigo-100 z-10" 
              />
              {post.coAuthors && post.coAuthors.length > 0 && post.coAuthors.map((ca, idx) => (
                <img 
                  key={ca.id}
                  src={ca.avatar} 
                  className="w-10 h-10 rounded-full border-2 border-white -ml-4 shadow-lg z-0 grayscale group-hover/avatar:grayscale-0 transition-all"
                  style={{ zIndex: -idx }}
                  alt="" 
                />
              ))}
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-[2.5px] border-white rounded-full z-20" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-slate-950 text-sm md:text-base tracking-tight leading-none italic uppercase">
                  {post.authorName}
                </h3>
                <ICONS.Verified />
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                 <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest font-mono">
                   {post.createdAt}
                 </p>
                 {signalVelocity > 0.5 && (
                   <div className="flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 rounded-md">
                     <svg className="w-2.5 h-2.5 text-indigo-600 animate-pulse" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                     <span className="text-[8px] font-black text-indigo-600 font-mono">{signalVelocity} p/h</span>
                   </div>
                 )}
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setShowOptions(!showOptions)}
            className="p-2.5 text-slate-300 hover:text-slate-900 transition-all hover:bg-slate-50 rounded-xl active:scale-90"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
          </button>
        </div>

        <div className={`mb-6 ${isPulse ? 'text-center' : ''}`}>
          <div className={`text-slate-800 leading-relaxed font-medium tracking-tight transition-all duration-500 
            ${isPulse ? 'text-2xl md:text-3xl font-black italic uppercase' : isDeep ? 'text-base md:text-lg border-l-2 border-slate-100 pl-6 py-2' : 'text-base md:text-lg'}`}>
            {textChunks.map((chunk, idx) => {
              const reactions = post.inlineReactions?.[idx] || [];
              return (
                <span key={idx} className="relative group/chunk inline-block">
                  <span className="hover:bg-indigo-50/50 rounded-md transition-colors cursor-pointer p-0.5 inline">
                    {chunk}
                  </span>
                  <div className="absolute -top-6 left-0 flex gap-1 opacity-0 group-hover/chunk:opacity-100 transition-opacity z-10">
                     {['🔥', '❤️', '💡', '🚀'].map(emoji => (
                       <button 
                         key={emoji} 
                         onClick={() => handleInlineReact(idx, emoji)}
                         className="w-6 h-6 bg-white shadow-lg border border-slate-100 rounded-full flex items-center justify-center text-[10px] hover:scale-125 transition-transform"
                       >
                         {emoji}
                       </button>
                     ))}
                  </div>
                  {reactions.length > 0 && (
                    <div className="inline-flex gap-1 ml-1 align-middle">
                      {reactions.map(r => (
                        <div key={r.emoji} className="flex items-center gap-0.5 bg-slate-100/80 px-1.5 py-0.5 rounded-full border border-white text-[9px] font-black">
                          {r.emoji} <span className="text-[8px] opacity-60">{r.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </span>
              );
            })}
          </div>
        </div>

        {post.media && post.media.length > 0 && (
          <div className="relative rounded-[2rem] overflow-hidden mb-6 bg-slate-50 border-precision shadow-inner group/carousel">
            <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentMediaIndex * 100}%)` }}>
              {post.media.map((item, idx) => (
                <div key={idx} className="min-w-full flex items-center justify-center bg-slate-950 aspect-video md:aspect-[16/9]">
                  {item.type === 'image' ? (
                    <img src={item.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <video src={item.url} className="w-full h-full object-cover" controls playsInline />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-5 border-t border-slate-50 relative">
          <div className="flex gap-6 md:gap-10">
            {/* Pulse Spectrum Engagement */}
            <div className="relative">
              <button 
                onMouseDown={handlePulseStart}
                onMouseUp={handlePulseEnd}
                onTouchStart={handlePulseStart}
                onTouchEnd={handlePulseEnd}
                className={`flex items-center gap-2.5 transition-all touch-active group/btn ${post.isLiked ? 'text-rose-500' : 'text-slate-400'}`}
              >
                <div className={`p-2.5 rounded-full transition-all duration-300 ${post.isLiked ? 'bg-rose-50 shadow-lg scale-110' : 'group-hover/btn:bg-rose-50'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill={post.isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 transition-transform group-active/btn:scale-75">
                    <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                  </svg>
                </div>
                <span className="text-sm font-black tracking-tighter">{(post.likes || 0).toLocaleString(locale)}</span>
              </button>

              {/* Hold-to-Reveal Spectrum Menu */}
              {isPulseMenuOpen && (
                <>
                  <div className="fixed inset-0 z-[100]" onClick={() => setIsPulseMenuOpen(false)} />
                  <div className="absolute bottom-14 left-0 bg-white/80 backdrop-blur-3xl rounded-full p-2 border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] flex gap-2 z-[110] animate-in slide-in-from-bottom-4 duration-300">
                     {PULSE_FREQUENCIES.map(freq => (
                       <button 
                         key={freq.id}
                         onClick={() => selectFrequency(freq.id)}
                         className="w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center text-xl lg:text-2xl hover:scale-125 transition-transform bg-white shadow-sm border border-slate-50"
                         title={freq.label}
                       >
                         {freq.emoji}
                       </button>
                     ))}
                  </div>
                </>
              )}
            </div>

            <button 
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-2.5 transition-all touch-active group/btn ${showComments ? 'text-indigo-600' : 'text-slate-400'}`}
            >
              <div className={`p-2.5 rounded-full transition-all duration-300 ${showComments ? 'bg-indigo-50 shadow-lg' : 'group-hover/btn:bg-indigo-50'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785 0.596.596 0 0 0 .21.685 0.59.59 0 0 0 .44.03 6.041 6.041 0 0 0 2.986-1.334c.451.06.91.09 1.378.09Z" /></svg>
              </div>
              <span className="text-sm font-black tracking-tighter">{(post.comments || 0).toLocaleString(locale)}</span>
            </button>

            {/* Signal Relay Action */}
            <button 
              onClick={handleRelay}
              className="flex items-center gap-2.5 transition-all touch-active group/btn text-slate-400"
            >
              <div className="p-2.5 rounded-full transition-all duration-300 group-hover/btn:bg-indigo-50 group-hover/btn:text-indigo-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
              </div>
              <span className="text-sm font-black tracking-tighter">{(post.shares || 0).toLocaleString(locale)}</span>
            </button>
          </div>

          <button className="p-2.5 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0-10.628a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5m0 10.628a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5" />
            </svg>
          </button>
        </div>

        {showComments && (
          <CommentSection 
            postId={post.id} 
            userData={userData} 
            addToast={addToast} 
            locale={locale} 
          />
        )}
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl" onClick={() => setShowDeleteModal(false)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl border border-white/10">
             <div className="text-center space-y-3 mb-10">
               <h3 className="text-2xl font-black text-slate-950 tracking-tighter uppercase italic leading-none">PROTOCOL_ALERT</h3>
               <p className="text-xs text-slate-500 font-bold leading-relaxed px-4">Terminate this transmission sequence? This action is immutable.</p>
             </div>
             <div className="flex flex-col gap-3">
                <button onClick={handlePurgeSignal} className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl">CONFIRM_PURGE</button>
                <button onClick={() => setShowDeleteModal(false)} className="w-full py-5 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em]">ABORT_ACTION</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
