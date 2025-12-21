
import React, { useState, useEffect, useMemo } from 'react';
import { Post, User, Comment, InlineReaction } from '../../types';
import { ICONS } from '../../constants';
import { db, auth } from '../../services/firebase';
import { 
  deleteDoc, 
  doc, 
  collection, 
  addDoc, 
  serverTimestamp, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  updateDoc, 
  increment,
  getDoc
} from 'firebase/firestore';

interface PostCardProps {
  post: Post;
  onLike: (id: string) => void;
  locale?: string;
  isAuthor?: boolean;
  userData: User | null;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const FREQUENCY_COLORS = [
  'from-indigo-500 to-blue-500',
  'from-rose-500 to-pink-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-violet-500 to-purple-500'
];

export const PostCard: React.FC<PostCardProps> = ({ post, onLike, locale = 'en-GB', isAuthor = false, userData, addToast }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [focusedCommentId, setFocusedCommentId] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(post.bookmarkedBy?.includes(userData?.id || '') || false);

  // Heatmap State
  const textChunks = useMemo(() => {
    return post.content.split(/([.!?]\s+)/).filter(Boolean).map((chunk, i, arr) => {
       if (i % 2 !== 0) return null; // These are the delimiters
       const next = arr[i+1];
       return chunk + (next || '');
    }).filter(Boolean);
  }, [post.content]);

  useEffect(() => {
    if (showComments && db) {
      const q = query(collection(db, 'posts', post.id, 'comments'), orderBy('timestamp', 'asc'), limit(100));
      return onSnapshot(q, (snap) => {
        setComments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Comment)));
      });
    }
  }, [showComments, post.id]);

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

  const handleToggleBookmark = async () => {
    if (!db || !userData) return;
    const postRef = doc(db, 'posts', post.id);
    const newBookmarked = !isBookmarked;
    setIsBookmarked(newBookmarked);
    
    try {
      await updateDoc(postRef, {
        bookmarkedBy: newBookmarked 
          ? [...(post.bookmarkedBy || []), userData.id]
          : (post.bookmarkedBy || []).filter(id => id !== userData.id)
      });
      addToast(newBookmarked ? "Signal archived in vault" : "Signal removed from vault", "info");
    } catch (e) {
      addToast("Vault sync failed", "error");
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

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !db || !userData) return;
    setIsSubmittingComment(true);
    try {
      const commentText = newComment.trim();
      const payload: any = {
        authorId: userData.id,
        authorName: userData.displayName,
        authorAvatar: userData.avatarUrl,
        content: commentText,
        likes: 0,
        timestamp: serverTimestamp(),
        depth: replyingTo ? (comments.find(c => c.id === replyingTo)?.depth || 0) + 1 : 0
      };
      if (replyingTo) payload.parentId = replyingTo;

      await addDoc(collection(db, 'posts', post.id, 'comments'), payload);
      
      await updateDoc(doc(db, 'posts', post.id), {
        comments: increment(1)
      });

      setNewComment('');
      setReplyingTo(null);
      addToast("Comment broadcasted", "success");
    } catch (e) {
      addToast("Neural broadcast failed", "error");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const commentThreads = useMemo(() => {
    const map: Record<string, Comment[]> = { root: [] };
    comments.forEach(c => {
      const key = c.parentId || 'root';
      if (!map[key]) map[key] = [];
      map[key].push(c);
    });
    return map;
  }, [comments]);

  const renderComment = (comment: Comment) => {
    const isFocused = focusedCommentId === comment.id;
    const colorClass = FREQUENCY_COLORS[(comment.depth || 0) % FREQUENCY_COLORS.length];
    
    return (
      <div key={comment.id} className={`relative flex flex-col gap-2 animate-in fade-in slide-in-from-left-2 duration-300 group/comment ${isFocused ? 'z-[600]' : ''}`}>
        <div className="flex gap-4">
          {/* Frequency Line */}
          <div className={`w-1 rounded-full bg-gradient-to-b ${colorClass} opacity-40 group-hover/comment:opacity-100 transition-opacity`} />
          
          <div className="flex-1 min-w-0">
             <div 
               onClick={() => setFocusedCommentId(isFocused ? null : comment.id)}
               className={`cursor-pointer transition-all duration-500 rounded-3xl p-4 ${isFocused ? 'bg-white shadow-2xl scale-105 border-2 border-indigo-500' : 'bg-slate-50 border border-slate-100 hover:border-slate-200'}`}
             >
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <img src={comment.authorAvatar} className="w-6 h-6 rounded-lg object-cover" alt="" />
                    <p className="text-[10px] font-black text-slate-950 uppercase tracking-tight italic">{comment.authorName}</p>
                  </div>
                  <span className="text-[8px] font-black text-slate-300 font-mono">
                    {comment.timestamp?.toDate ? comment.timestamp.toDate().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'NOW'}
                  </span>
                </div>
                <p className="text-sm text-slate-700 font-medium leading-relaxed">{comment.content}</p>
             </div>
             
             <div className="flex gap-4 mt-2 ml-1 items-center">
                <button className="text-[9px] font-black uppercase text-slate-400 hover:text-rose-500 transition-colors">Pulse</button>
                <button 
                  onClick={() => setReplyingTo(comment.id)}
                  className="text-[9px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  Echo
                </button>
                {commentThreads[comment.id] && (
                  <span className="text-[8px] font-bold text-indigo-300 uppercase tracking-widest">{commentThreads[comment.id].length} Frequency Nodes</span>
                )}
             </div>
             
             {/* Recursive Replies */}
             {commentThreads[comment.id] && (
               <div className="mt-4 space-y-4 pl-4 border-l border-slate-100">
                 {commentThreads[comment.id].map(reply => renderComment(reply))}
               </div>
             )}
          </div>
        </div>
      </div>
    );
  };

  if (isDeleting) return null;

  const isPulse = post.contentLengthTier === 'pulse';
  const isDeep = post.contentLengthTier === 'deep';

  return (
    <div className={`group bg-white border-precision rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] mb-8 ${isPulse ? 'border-l-8 border-l-indigo-600' : ''} ${focusedCommentId ? 'relative' : ''}`}>
      
      {/* Neural Dialogue Overlay (Focus Mode) */}
      {focusedCommentId && (
        <div className="fixed inset-0 z-[550] flex items-center justify-center p-6 animate-in fade-in duration-500">
           <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" onClick={() => setFocusedCommentId(null)}></div>
        </div>
      )}

      <div className="p-6 md:p-8">
        {/* Header Block with Multi-Node Support */}
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

        {/* Heatmap Content Block */}
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
                  
                  {/* Micro-Signal Indicator */}
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

                  {/* Reaction Badges */}
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

        {/* Media Block */}
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

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-5 border-t border-slate-50">
          <div className="flex gap-6 md:gap-10">
            <button 
              onClick={(e) => { e.stopPropagation(); onLike(post.id); }} 
              className={`flex items-center gap-2.5 transition-all touch-active group/btn ${post.isLiked ? 'text-rose-500' : 'text-slate-400'}`}
            >
              <div className={`p-2.5 rounded-full transition-all duration-300 ${post.isLiked ? 'bg-rose-50 shadow-lg' : 'group-hover/btn:bg-rose-50'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill={post.isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                  <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
              </div>
              <span className="text-sm font-black tracking-tighter">{post.likes.toLocaleString(locale)}</span>
            </button>

            <button 
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-2.5 transition-all touch-active group/btn ${showComments ? 'text-indigo-600' : 'text-slate-400'}`}
            >
              <div className={`p-2.5 rounded-full transition-all duration-300 ${showComments ? 'bg-indigo-50 shadow-lg' : 'group-hover/btn:bg-indigo-50'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785 0.596.596 0 0 0 .21.685 0.59.59 0 0 0 .44.03 6.041 6.041 0 0 0 2.986-1.334c.451.06.91.09 1.378.09Z" /></svg>
              </div>
              <span className="text-sm font-black tracking-tighter">{post.comments.toLocaleString(locale)}</span>
            </button>
          </div>
        </div>

        {/* COLLAPSIBLE COMMENT SECTION */}
        {showComments && (
          <div className="mt-8 pt-8 border-t border-slate-100 animate-in slide-in-from-top-4 duration-500">
             <form onSubmit={handleSubmitComment} className="flex flex-col gap-4 mb-8">
                {replyingTo && (
                  <div className="flex items-center justify-between bg-indigo-50 px-4 py-2 rounded-xl text-[10px] font-black text-indigo-600 uppercase italic">
                    Replying to neural node...
                    <button onClick={() => setReplyingTo(null)} className="opacity-40 hover:opacity-100">Cancel</button>
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <img src={userData?.avatarUrl} className="w-10 h-10 rounded-xl object-cover shrink-0" alt="" />
                  <div className="flex-1 relative">
                     <input 
                       type="text" 
                       value={newComment}
                       onChange={(e) => setNewComment(e.target.value)}
                       placeholder={replyingTo ? "Echo your frequency..." : "Broadcast initial thought..."}
                       className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                     />
                  </div>
                  <button 
                    disabled={!newComment.trim() || isSubmittingComment}
                    className="p-3.5 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-black transition-all active:scale-95 disabled:opacity-30"
                  >
                     {isSubmittingComment ? (
                       <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                     ) : (
                       <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                     )}
                  </button>
                </div>
             </form>

             <div className="space-y-8">
                {commentThreads.root.length > 0 ? (
                  commentThreads.root.map(comment => renderComment(comment))
                ) : (
                  <div className="py-10 text-center opacity-30">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] font-mono italic">Awaiting first frequency echo...</p>
                  </div>
                )}
             </div>
          </div>
        )}
      </div>

      {/* Options Menu & Modals */}
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
