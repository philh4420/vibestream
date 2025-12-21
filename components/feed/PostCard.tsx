
import React, { useState, useEffect } from 'react';
import { Post, User, Comment } from '../../types';
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

export const PostCard: React.FC<PostCardProps> = ({ post, onLike, locale = 'en-GB', isAuthor = false, userData, addToast }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(post.bookmarkedBy?.includes(userData?.id || '') || false);

  useEffect(() => {
    if (showComments && db) {
      const q = query(collection(db, 'posts', post.id, 'comments'), orderBy('timestamp', 'desc'), limit(50));
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

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !db || !userData) return;
    setIsSubmittingComment(true);
    try {
      const commentText = newComment.trim();
      await addDoc(collection(db, 'posts', post.id, 'comments'), {
        authorId: userData.id,
        authorName: userData.displayName,
        authorAvatar: userData.avatarUrl,
        content: commentText,
        likes: 0,
        timestamp: serverTimestamp()
      });
      
      await updateDoc(doc(db, 'posts', post.id), {
        comments: increment(1)
      });

      // Create Notification for Post Owner
      if (post.authorId !== userData.id) {
        await addDoc(collection(db, 'notifications'), {
          type: 'comment',
          fromUserId: userData.id,
          fromUserName: userData.displayName,
          fromUserAvatar: userData.avatarUrl,
          toUserId: post.authorId,
          targetId: post.id,
          text: `echoed your signal: "${commentText.slice(0, 20)}..."`,
          isRead: false,
          timestamp: serverTimestamp()
        });
      }

      setNewComment('');
      addToast("Comment broadcasted", "success");
    } catch (e) {
      addToast("Neural broadcast failed", "error");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (isDeleting) return null;

  return (
    <div className="group bg-white border-precision rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] mb-8">
      <div className="p-6 md:p-8">
        {/* Header Block */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative group/avatar cursor-pointer">
              <img 
                src={post.authorAvatar} 
                alt={post.authorName} 
                className="w-12 h-12 md:w-14 md:h-14 rounded-[1.4rem] object-cover ring-4 ring-slate-50 transition-all group-hover/avatar:ring-indigo-100" 
              />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-[2.5px] border-white rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-slate-950 text-sm md:text-base tracking-tight leading-none italic uppercase">{post.authorName}</h3>
                <ICONS.Verified />
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                 <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest font-mono">
                   {post.createdAt}
                 </p>
                 {post.location && (
                   <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 rounded-full">
                     <span className="text-[8px] font-black text-indigo-600 uppercase tracking-tight">{post.location}</span>
                   </div>
                 )}
              </div>
            </div>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowOptions(!showOptions)}
              className="p-2.5 text-slate-300 hover:text-slate-900 transition-all hover:bg-slate-50 rounded-xl active:scale-90"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
            </button>
            {showOptions && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowOptions(false)}></div>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 z-20 overflow-hidden animate-in zoom-in-95 duration-200">
                  <button onClick={handleToggleBookmark} className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 transition-all text-[10px] font-black uppercase tracking-widest font-mono">
                    <svg className={`w-4 h-4 ${isBookmarked ? 'fill-indigo-600 text-indigo-600' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" strokeWidth={2.5}/></svg>
                    {isBookmarked ? 'De-Archive' : 'Vault_Signal'}
                  </button>
                  {isAuthor && (
                    <button onClick={() => { setShowDeleteModal(true); setShowOptions(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-50 transition-all text-[10px] font-black uppercase tracking-widest font-mono border-t border-slate-50">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="m14.74 9-.344 12.142m-4.762 0L9.26 9m9.968-3.21c.342.053.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" strokeWidth={2.5}/></svg>
                      Purge_Signal
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Content Block */}
        <p className="text-slate-800 text-base md:text-lg leading-relaxed mb-6 font-medium whitespace-pre-wrap tracking-tight">
          {post.content}
        </p>

        {/* Media Carousel Block */}
        {post.media && post.media.length > 0 && (
          <div className="relative rounded-[2rem] overflow-hidden mb-6 bg-slate-50 border-precision shadow-inner group/carousel">
            <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentMediaIndex * 100}%)` }}>
              {post.media.map((item, idx) => (
                <div key={idx} className="min-w-full flex items-center justify-center bg-slate-950 aspect-video md:aspect-[16/9]">
                  {item.type === 'image' ? (
                    <img 
                      src={item.url} 
                      alt="" 
                      className="w-full h-full object-cover" 
                      loading="lazy" 
                    />
                  ) : (
                    <video src={item.url} className="w-full h-full object-cover" controls playsInline />
                  )}
                </div>
              ))}
            </div>
            {post.media.length > 1 && (
               <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5 z-10">
                 {post.media.map((_, idx) => (
                   <div key={idx} className={`h-1 rounded-full transition-all duration-300 ${currentMediaIndex === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`} />
                 ))}
               </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-5 border-t border-slate-50">
          <div className="flex gap-6 md:gap-10">
            <button 
              onClick={(e) => { e.stopPropagation(); onLike(post.id); }} 
              className={`flex items-center gap-2.5 transition-all touch-active group/btn ${post.isLiked ? 'text-rose-500 scale-105' : 'text-slate-400 hover:text-rose-500'}`}
            >
              <div className={`p-2.5 rounded-full transition-all duration-300 ${post.isLiked ? 'bg-rose-50 shadow-lg shadow-rose-100' : 'group-hover/btn:bg-rose-50'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill={post.isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                  <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
              </div>
              <span className="text-sm font-black tracking-tighter">{post.likes.toLocaleString(locale)}</span>
            </button>

            <button 
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-2.5 transition-all touch-active group/btn ${showComments ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-600'}`}
            >
              <div className={`p-2.5 rounded-full transition-all duration-300 ${showComments ? 'bg-indigo-50 shadow-lg shadow-indigo-100' : 'group-hover/btn:bg-indigo-50'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785 0.596.596 0 0 0 .21.685 0.59.59 0 0 0 .44.03 6.041 6.041 0 0 0 2.986-1.334c.451.06.91.09 1.378.09Z" /></svg>
              </div>
              <span className="text-sm font-black tracking-tighter">{post.comments.toLocaleString(locale)}</span>
            </button>
          </div>
        </div>

        {/* COLLAPSIBLE COMMENT SECTION */}
        {showComments && (
          <div className="mt-8 pt-8 border-t border-slate-100 animate-in slide-in-from-top-4 duration-500">
             {/* Comment Input */}
             <form onSubmit={handleSubmitComment} className="flex items-center gap-4 mb-8">
                <img src={userData?.avatarUrl} className="w-10 h-10 rounded-xl object-cover shrink-0" alt="" />
                <div className="flex-1 relative">
                   <input 
                     type="text" 
                     value={newComment}
                     onChange={(e) => setNewComment(e.target.value)}
                     placeholder="Echo your frequency..."
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
             </form>

             {/* Comments List */}
             <div className="space-y-6">
                {comments.length > 0 ? (
                  comments.map(comment => (
                    <div key={comment.id} className="flex gap-4 animate-in fade-in slide-in-from-left-2 duration-300 group/comment">
                       <img src={comment.authorAvatar} className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-100" alt="" />
                       <div className="flex-1 min-w-0">
                          <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none border border-slate-100">
                             <div className="flex justify-between items-center mb-1">
                               <p className="text-[11px] font-black text-slate-950 uppercase tracking-tight italic">{comment.authorName}</p>
                               <span className="text-[8px] font-black text-slate-300 font-mono">
                                 {comment.timestamp?.toDate ? comment.timestamp.toDate().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'NOW'}
                               </span>
                             </div>
                             <p className="text-sm text-slate-700 font-medium leading-relaxed">{comment.content}</p>
                          </div>
                          <div className="flex gap-4 mt-2 ml-1">
                             <button className="text-[9px] font-black uppercase text-slate-400 hover:text-rose-500 transition-colors">Pulse</button>
                             <button className="text-[9px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors">Thread</button>
                          </div>
                       </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center opacity-30">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] font-mono italic">Awaiting first echo...</p>
                  </div>
                )}
             </div>
          </div>
        )}
      </div>

      {/* PURGE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl" onClick={() => setShowDeleteModal(false)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl border border-white/10 animate-in zoom-in-95 duration-500">
             <div className="w-20 h-20 bg-rose-50 rounded-[2.5rem] flex items-center justify-center mb-8 mx-auto text-rose-500">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
             </div>
             <div className="text-center space-y-3 mb-10">
               <h3 className="text-2xl font-black text-slate-950 tracking-tighter uppercase italic leading-none">PROTOCOL_ALERT</h3>
               <p className="text-xs text-slate-500 font-bold leading-relaxed px-4">Terminate this transmission sequence from the grid permanently? This action is immutable.</p>
             </div>
             <div className="flex flex-col gap-3">
                <button 
                  onClick={handlePurgeSignal}
                  className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-rose-100 hover:bg-rose-700 active:scale-95 transition-all"
                >
                  CONFIRM_PURGE
                </button>
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full py-5 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-100 active:scale-95 transition-all"
                >
                  ABORT_ACTION
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
