
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
      className={`group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] mb-10 relative cursor-pointer overflow-hidden ${isPulse ? 'border-l-[6px] border-l-indigo-600' : ''} ${filterClass}`}
      onClick={() => !isEditing && onViewPost?.(post)}
    >
      {/* Relay Header */}
      {post.relaySource && (
        <div className="px-9 pt-6 flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M7.5 12l3 3m-3-3l-3 3" strokeWidth={3} /></svg>
           Relayed_From {post.relaySource.authorName}
        </div>
      )}

      <div className="p-6 md:p-9">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* Multi-Author Visual Cluster */}
            <div className="flex -space-x-4">
                <div className={`relative shrink-0 w-14 h-14 rounded-[1.6rem] z-10 ${borderClass}`}>
                    <img src={post.authorAvatar} alt="" className="w-full h-full rounded-[1.6rem] object-cover ring-4 ring-slate-50 dark:ring-slate-800 bg-white dark:bg-slate-800" />
                </div>
                {post.coAuthors?.slice(0, 2).map((ca, idx) => (
                    <div key={idx} className="relative shrink-0 w-14 h-14 rounded-[1.6rem] z-0">
                        <img src={ca.avatar} alt="" className="w-full h-full rounded-[1.6rem] object-cover ring-4 ring-slate-50 dark:ring-slate-800 bg-white dark:bg-slate-800 opacity-60" />
                    </div>
                ))}
            </div>
            
            <div>
                <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-900 dark:text-white text-base uppercase italic tracking-tight">
                        {post.authorName}
                        {post.coAuthors && post.coAuthors.length > 0 && <span className="text-slate-400 font-bold ml-1 text-sm">+ {post.coAuthors.length}</span>}
                    </h3>
                    {post.location && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-100 dark:border-slate-700">
                           <div className="scale-50 text-indigo-500"><ICONS.Globe /></div>
                           <span className="text-[7px] font-black text-slate-400 uppercase font-mono">{post.location}</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <p className="text-[8px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest font-mono">{post.createdAt}</p>
                    {post.capturedStatus && (
                        <span className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 italic">
                            {post.capturedStatus.emoji} {post.capturedStatus.message}
                        </span>
                    )}
                </div>
            </div>
          </div>

          {/* Options Menu */}
          <div className="relative" ref={optionsRef}>
            <button 
                onClick={(e) => { e.stopPropagation(); setShowOptions(!showOptions); }}
                className="p-3 text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" /></svg>
            </button>
            {showOptions && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-2xl z-50 p-2 overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                    {isAuthor ? (
                        <>
                            <button className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all">Edit_Protocol</button>
                            <button onClick={() => setShowDeleteModal(true)} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all">Purge_Signal</button>
                        </>
                    ) : (
                        <button className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all">Report_Anomaly</button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(window.location.href); addToast("Coordinate Copied", "success"); setShowOptions(false); }} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all">Copy_Hash</button>
                </div>
            )}
          </div>
        </div>

        <div className={`mb-8 ${isPulse ? 'text-center' : ''}`}>
            <div className={`text-slate-800 dark:text-slate-200 leading-relaxed font-medium ${isPulse ? 'text-2xl md:text-3xl font-black italic uppercase' : 'text-base md:text-lg'}`}>
                {isHtml ? <div className="ProseMirror" dangerouslySetInnerHTML={{ __html: post.content }} /> : post.content}
            </div>
            {extractedUrl && <LinkPreview url={extractedUrl} />}
            {post.type === 'poll' && <div onClick={e => e.stopPropagation()}><PollNode post={post} userData={userData} addToast={addToast} /></div>}
        </div>

        {post.media?.length > 0 && (
          <div className="relative rounded-[2.5rem] overflow-hidden mb-8 bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-lg" onClick={e => e.stopPropagation()}>
            <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${currentMediaIndex * 100}%)` }}>
              {post.media.map((item, idx) => (
                <div key={idx} className="min-w-full aspect-[4/3] md:aspect-video relative">
                  {item.type === 'image' ? <img src={item.url} className="w-full h-full object-cover" alt="" /> : <video src={item.url} className="w-full h-full object-cover" controls autoPlay={shouldAutoPlay} muted={shouldAutoPlay} />}
                </div>
              ))}
            </div>
            {post.media.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/20 backdrop-blur-md px-3 py-2 rounded-full">
                    {post.media.map((_, idx) => (
                        <button key={idx} onClick={(e) => { e.stopPropagation(); setCurrentMediaIndex(idx); }} className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentMediaIndex ? 'bg-white w-4' : 'bg-white/40 hover:bg-white/60'}`} />
                    ))}
                </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-4">
            <div className="relative">
                <button 
                    onMouseDown={handlePulseStart} 
                    onMouseUp={handlePulseEnd}
                    onClick={(e) => e.stopPropagation()}
                    className={`flex items-center gap-3 h-12 px-6 rounded-2xl transition-all border ${post.isLiked ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-100 text-rose-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-white dark:hover:bg-slate-700'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill={post.isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                    <span className="text-xs font-black">{post.likes}</span>
                </button>
                {isPulseMenuOpen && (
                    <div className="absolute bottom-full left-0 mb-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-100 dark:border-slate-700 rounded-2xl p-2 flex gap-1 shadow-2xl animate-in slide-in-from-bottom-2 duration-200 z-50" onClick={e => e.stopPropagation()}>
                        {PULSE_FREQUENCIES.map(pf => (
                            <button 
                                key={pf.id} onClick={(e) => { e.stopPropagation(); onLike(post.id, pf.id); setIsPulseMenuOpen(false); }}
                                className="w-10 h-10 flex items-center justify-center text-lg hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all active:scale-90"
                                title={pf.label}
                            >
                                {pf.emoji}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <button 
                onClick={(e) => { e.stopPropagation(); setShowComments(!showComments); }}
                className={`flex items-center gap-3 h-12 px-6 rounded-2xl transition-all border ${showComments ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-white dark:hover:bg-slate-700'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785 0.596.596 0 0 0 .21.685 0.59.59 0 0 0 .44.03 6.041 6.041 0 0 0 2.986-1.334c.451.06.91.09 1.378.09Z" /></svg>
              <span className="text-xs font-black">{post.comments}</span>
            </button>

            <button 
                onClick={handleRelay}
                className="flex items-center gap-3 h-12 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 transition-all border border-transparent hover:border-indigo-100"
            >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M7.5 12l3 3m-3-3l-3 3" /></svg>
               <span className="text-xs font-black">{post.shares}</span>
            </button>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onBookmark?.(post.id); }}
            className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all ${isBookmarked ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <ICONS.Saved />
          </button>
        </div>

        {showComments && (
          <div onClick={(e) => e.stopPropagation()} className="animate-in fade-in slide-in-from-top-4">
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
