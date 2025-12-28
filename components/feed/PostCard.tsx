import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Post, User } from '../../types';
import { ICONS, PULSE_FREQUENCIES } from '../../constants';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { deleteDoc, doc, updateDoc, increment, addDoc, serverTimestamp, collection } = Firestore as any;
import { CommentSection } from './CommentSection';
import { DeleteConfirmationModal } from '../ui/DeleteConfirmationModal';
import { extractUrls } from '../../lib/textUtils';
import { LinkPreview } from '../ui/LinkPreview';
import { PollNode } from './PollNode';

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
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  
  const [isPulseMenuOpen, setIsPulseMenuOpen] = useState(false);
  const pulseTimerRef = useRef<any>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  const shouldAutoPlay = userData?.settings?.appearance?.autoPlayVideo !== false;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };
    if (showOptions) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showOptions]);

  const isHtml = post.content && (post.content.trim().startsWith('<') || post.content.includes('</'));
  const extractedUrl = useMemo(() => {
    const urls = extractUrls(post.content);
    return urls.length > 0 ? urls[0] : null;
  }, [post.content]);

  // RELATIVE TIME CALCULATION
  const displayTime = useMemo(() => {
    if (!post.timestamp) return { relative: post.createdAt, full: post.createdAt };
    
    const date = post.timestamp.toDate ? post.timestamp.toDate() : new Date(post.timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let relative = '';
    if (diffInSeconds < 60) relative = 'Just now';
    else if (diffInSeconds < 3600) relative = `${Math.floor(diffInSeconds / 60)}m ago`;
    else if (diffInSeconds < 86400) relative = `${Math.floor(diffInSeconds / 3600)}h ago`;
    else if (diffInSeconds < 604800) relative = `${Math.floor(diffInSeconds / 86400)}d ago`;
    else relative = date.toLocaleDateString(locale, { day: '2-digit', month: 'short' });

    const full = date.toLocaleString(locale, { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    return { relative, full };
  }, [post.timestamp, post.createdAt, locale]);

  const handlePulseStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    pulseTimerRef.current = setTimeout(() => setIsPulseMenuOpen(true), 600);
  };

  const handlePulseEnd = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (pulseTimerRef.current) {
      clearTimeout(pulseTimerRef.current);
      if (!isPulseMenuOpen) onLike(post.id);
    }
  };

  const handleRelay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userData || !db) return;
    try {
      await updateDoc(doc(db, 'posts', post.id), { shares: increment(1) });
      await addDoc(collection(db, 'posts'), {
        authorId: userData.id,
        authorName: userData.displayName,
        authorAvatar: userData.avatarUrl,
        content: `Relayed: ${post.content.substring(0, 100)}...`,
        relaySource: {
          postId: post.id,
          authorName: post.authorName,
          authorAvatar: post.authorAvatar
        },
        media: [],
        likes: 0,
        comments: 0,
        shares: 0,
        createdAt: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        timestamp: serverTimestamp(),
        contentLengthTier: 'standard'
      });
      addToast("Signal Relayed to Grid", "success");
    } catch (e) {
      addToast("Relay Protocol Failed", "error");
    }
  };

  const handleDelete = async () => {
    if (!db) return;
    setIsDeleting(true);
    try {
      if (post.relaySource && post.relaySource.postId) {
        try {
          const originalPostRef = doc(db, 'posts', post.relaySource.postId);
          await updateDoc(originalPostRef, { shares: increment(-1) });
        } catch (e) { console.warn("Relay update bypass."); }
      }
      await deleteDoc(doc(db, 'posts', post.id));
      addToast("Signal Purged", "info");
    } catch (e) {
      setIsDeleting(false);
      addToast("Purge Failed", "error");
    }
  };

  if (isDeleting) return null;

  const isPulse = post.contentLengthTier === 'pulse';
  const isBookmarked = post.bookmarkedBy && userData && post.bookmarkedBy.includes(userData.id);
  const borderClass = post.authorCosmetics?.border ? `cosmetic-border-${post.authorCosmetics.border}` : '';
  const filterClass = post.authorCosmetics?.filter ? `filter-${post.authorCosmetics.filter}` : '';

  return (
    <article 
      className={`group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] transition-all duration-500 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] mb-8 relative cursor-pointer overflow-hidden ${isPulse ? 'ring-1 ring-indigo-500/20' : ''} ${filterClass}`}
      onClick={() => !isEditing && onViewPost?.(post)}
    >
      {/* Visual Identity Strip */}
      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500/40 via-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Relay Header */}
      {post.relaySource && (
        <div className="px-6 md:px-10 pt-5 flex items-center gap-2.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
           <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M7.5 12l3 3m-3-3l-3 3" /></svg>
           <span className="opacity-80">Relayed_By</span> <span className="text-indigo-500 dark:text-indigo-400">{post.relaySource.authorName}</span>
        </div>
      )}

      <div className="p-6 md:p-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-5">
            {/* Unified Author Presentation */}
            <div className="flex -space-x-4">
                <div className={`relative shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-[1.6rem] z-10 ${borderClass}`}>
                    <img src={post.authorAvatar} alt="" className="w-full h-full rounded-[1.6rem] object-cover ring-4 ring-white dark:ring-slate-900 shadow-lg bg-slate-100 dark:bg-slate-800" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-[3px] border-white dark:border-slate-900" />
                </div>
                {post.coAuthors?.slice(0, 2).map((ca, idx) => (
                    <div key={idx} className="relative shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-[1.6rem] z-0">
                        <img src={ca.avatar} alt="" className="w-full h-full rounded-[1.6rem] object-cover ring-4 ring-white dark:ring-slate-900 opacity-40 grayscale group-hover:grayscale-0 transition-all duration-700" />
                    </div>
                ))}
            </div>
            
            <div>
                <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-black text-slate-900 dark:text-white text-base md:text-lg uppercase italic tracking-tighter leading-none">
                        {post.authorName}
                        {post.coAuthors && post.coAuthors.length > 0 && <span className="text-slate-400 font-bold ml-1.5 text-sm">+ {post.coAuthors.length}</span>}
                    </h3>
                    <div className="text-indigo-500 scale-75 drop-shadow-sm"><ICONS.Verified /></div>
                </div>
                <div className="flex items-center gap-2">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest font-mono" title={displayTime.full}>
                        {displayTime.relative}
                    </p>
                    <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-800" />
                    {post.location && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                           <div className="scale-50 text-indigo-500"><ICONS.Globe /></div>
                           <span className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase font-mono tracking-wider">{post.location}</span>
                        </div>
                    )}
                </div>
            </div>
          </div>

          <div className="relative" ref={optionsRef}>
            <button 
                onClick={(e) => { e.stopPropagation(); setShowOptions(!showOptions); }}
                className="p-3 text-slate-300 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white transition-all active:scale-90"
            >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" /></svg>
            </button>
            {showOptions && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[1.8rem] shadow-2xl z-50 p-2 overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                    {isAuthor ? (
                        <>
                            <button className="w-full text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-2xl transition-all">Edit_Parameters</button>
                            <button onClick={() => setShowDeleteModal(true)} className="w-full text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.15em] text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-2xl transition-all">Purge_Signal</button>
                        </>
                    ) : (
                        <button className="w-full text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.15em] text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-2xl transition-all">Report_Anomaly</button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(window.location.href); addToast("Coordinate Copied", "success"); setShowOptions(false); }} className="w-full text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-2xl transition-all">Copy_Neural_Link</button>
                </div>
            )}
          </div>
        </div>

        <div className={`mb-10 ${isPulse ? 'text-center' : ''}`}>
            <div className={`text-slate-800 dark:text-slate-200 leading-relaxed font-medium ${isPulse ? 'text-3xl md:text-5xl font-black italic uppercase tracking-tighter' : 'text-lg md:text-xl'}`}>
                {isHtml ? <div className="ProseMirror" dangerouslySetInnerHTML={{ __html: post.content }} /> : post.content}
            </div>
            {extractedUrl && <LinkPreview url={extractedUrl} />}
            {post.type === 'poll' && <div onClick={e => e.stopPropagation()}><PollNode post={post} userData={userData} addToast={addToast} /></div>}
        </div>

        {post.media?.length > 0 && (
          <div className="relative rounded-[3rem] overflow-hidden mb-10 bg-slate-950 border border-white/5 dark:border-white/10 shadow-2xl group/media" onClick={e => e.stopPropagation()}>
            <div className="flex transition-transform duration-700 cubic-bezier(0.2, 1, 0.2, 1)" style={{ transform: `translateX(-${currentMediaIndex * 100}%)` }}>
              {post.media.map((item, idx) => (
                <div key={idx} className="min-w-full aspect-[16/10] md:aspect-video relative overflow-hidden">
                  {item.type === 'image' ? (
                      <img src={item.url} className="w-full h-full object-cover transition-transform duration-[4s] group-hover/media:scale-105" alt="" />
                  ) : (
                      <video src={item.url} className="w-full h-full object-cover" controls autoPlay={shouldAutoPlay} muted={shouldAutoPlay} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
                </div>
              ))}
            </div>
            {post.media.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-black/40 backdrop-blur-xl px-4 py-2.5 rounded-full border border-white/10">
                    {post.media.map((_, idx) => (
                        <button key={idx} onClick={(e) => { e.stopPropagation(); setCurrentMediaIndex(idx); }} className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentMediaIndex ? 'bg-white w-6' : 'bg-white/30 w-1.5 hover:bg-white/60'}`} />
                    ))}
                </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-3 md:gap-4">
            <div className="relative">
                <button 
                    onMouseDown={handlePulseStart} 
                    onMouseUp={handlePulseEnd}
                    onClick={(e) => e.stopPropagation()}
                    className={`flex items-center gap-3 h-14 px-7 rounded-[1.6rem] transition-all border group/btn ${post.isLiked ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-100 dark:border-rose-900/50 text-rose-600' : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-transparent hover:bg-white dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700 shadow-sm'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill={post.isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-5 h-5 transition-transform duration-300 ${post.isLiked ? 'scale-110' : 'group-hover/btn:scale-125'}`}><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                    <span className="text-xs font-black font-mono tracking-wider">{post.likes}</span>
                </button>
                {isPulseMenuOpen && (
                    <div className="absolute bottom-full left-0 mb-5 bg-white/95 dark:bg-slate-800/95 backdrop-blur-2xl border border-slate-100 dark:border-slate-700 rounded-[1.8rem] p-2.5 flex gap-1.5 shadow-[0_30px_60px_-10px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom-3 zoom-in-95 duration-200 z-[100]" onClick={e => e.stopPropagation()}>
                        {PULSE_FREQUENCIES.map(pf => (
                            <button 
                                key={pf.id} onClick={(e) => { e.stopPropagation(); onLike(post.id, pf.id); setIsPulseMenuOpen(false); }}
                                className="w-12 h-12 flex flex-col items-center justify-center hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-2xl transition-all active:scale-90 group/freq"
                                title={pf.label}
                            >
                                <span className="text-xl group-hover/freq:scale-125 transition-transform">{pf.emoji}</span>
                                <span className="text-[6px] font-black uppercase tracking-widest text-slate-400 mt-1 opacity-0 group-hover/freq:opacity-100 transition-opacity">{pf.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <button 
                onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }}
                className={`flex items-center gap-3 h-14 px-7 rounded-[1.6rem] transition-all border group/btn ${showComments ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 border-indigo-100 dark:border-indigo-900/50' : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-transparent hover:bg-white dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700 shadow-sm'}`}
            >
              <svg className="w-5 h-5 group-hover/btn:scale-125 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785 0.596.596 0 0 0 .21.685 0.59.59 0 0 0 .44.03 6.041 6.041 0 0 0 2.986-1.334c.451.06.91.09 1.378.09Z" /></svg>
              <span className="text-xs font-black font-mono tracking-wider">{post.comments}</span>
            </button>

            <button 
                onClick={handleRelay}
                className="flex items-center gap-3 h-14 px-7 rounded-[1.6rem] bg-slate-50 dark:bg-slate-800/40 text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/50 group/btn"
            >
               <svg className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M7.5 12l3 3m-3-3l-3 3" /></svg>
               <span className="text-xs font-black font-mono tracking-wider">{post.shares}</span>
            </button>
          </div>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onBookmark?.(post.id); }}
            className={`w-14 h-14 flex items-center justify-center rounded-[1.6rem] transition-all active:scale-90 ${isBookmarked ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-900/50' : 'text-slate-300 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <ICONS.Saved />
          </button>
        </div>

        {showComments && (
          <div onClick={(e) => e.stopPropagation()} className="animate-in fade-in slide-in-from-top-6 duration-500">
            <CommentSection postId={post.id} postAuthorId={post.authorId} userData={userData} addToast={addToast} locale={locale} blockedIds={blockedIds} />
          </div>
        )}
      </div>
      
      <DeleteConfirmationModal 
        isOpen={showDeleteModal} 
        title="PURGE_SIGNAL" 
        description="Permanently delete this transmission from the grid? This action is irreversible." 
        onConfirm={handleDelete} 
        onCancel={() => setShowDeleteModal(false)} 
      />
    </article>
  );
};