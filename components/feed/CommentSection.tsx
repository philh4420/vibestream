
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../services/firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  updateDoc, 
  increment,
  doc
} from 'firebase/firestore';
import { Comment, User } from '../../types';

interface CommentSectionProps {
  postId: string;
  userData: User | null;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  locale?: string;
}

const FREQUENCY_COLORS = [
  'from-indigo-500 to-blue-500',
  'from-rose-500 to-pink-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-violet-500 to-purple-500'
];

export const CommentSection: React.FC<CommentSectionProps> = ({ postId, userData, addToast, locale = 'en-GB' }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [focusedCommentId, setFocusedCommentId] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    if (!db) return;
    const q = query(
      collection(db, 'posts', postId, 'comments'), 
      orderBy('timestamp', 'asc'), 
      limit(100)
    );
    return onSnapshot(q, (snap) => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Comment)));
    });
  }, [postId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !db || !userData) return;
    setIsSubmittingComment(true);
    try {
      const commentText = newComment.trim();
      const parent = replyingTo ? comments.find(c => c.id === replyingTo) : null;
      const payload: any = {
        authorId: userData.id,
        authorName: userData.displayName,
        authorAvatar: userData.avatarUrl,
        content: commentText,
        likes: 0,
        timestamp: serverTimestamp(),
        depth: parent ? (parent.depth || 0) + 1 : 0
      };
      if (replyingTo) payload.parentId = replyingTo;

      await addDoc(collection(db, 'posts', postId, 'comments'), payload);
      await updateDoc(doc(db, 'posts', postId), {
        comments: increment(1)
      });

      setNewComment('');
      setReplyingTo(null);
      addToast("Frequency Echo Synchronised", "success");
    } catch (e) {
      addToast("Neural Broadcast Failed", "error");
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
                    {comment.timestamp?.toDate ? comment.timestamp.toDate().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : 'NOW'}
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
                  <span className="text-[8px] font-bold text-indigo-300 uppercase tracking-widest">{commentThreads[comment.id].length} Nodes</span>
                )}
             </div>
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

  return (
    <div className="mt-8 pt-8 border-t border-slate-100 animate-in slide-in-from-top-4 duration-500">
      {focusedCommentId && (
        <div className="fixed inset-0 z-[550] flex items-center justify-center p-6 animate-in fade-in duration-500">
           <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" onClick={() => setFocusedCommentId(null)}></div>
        </div>
      )}

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
  );
};
