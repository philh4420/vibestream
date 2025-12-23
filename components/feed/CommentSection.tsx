
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '../../services/firebase';
// Fixed: Using namespaced import for firebase/firestore to resolve "no exported member" errors
import * as Firestore from 'firebase/firestore';
const { 
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
} = Firestore as any;
import { Comment, User } from '../../types';
import { EmojiPicker } from '../ui/EmojiPicker';
import { GiphyPicker } from '../ui/GiphyPicker';
import { uploadToCloudinary } from '../../services/cloudinary';
import { GiphyGif } from '../../services/giphy';

interface CommentSectionProps {
  postId: string;
  userData: User | null;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  locale?: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ postId, userData, addToast, locale = 'en-GB' }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [focusedCommentId, setFocusedCommentId] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isGiphyPickerOpen, setIsGiphyPickerOpen] = useState(false);
  
  // Media State for Comments
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedGif, setSelectedGif] = useState<GiphyGif | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!db) return;
    const q = query(
      collection(db, 'posts', postId, 'comments'), 
      orderBy('timestamp', 'asc'), 
      limit(100)
    );
    return onSnapshot(q, (snap: any) => {
      setComments(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Comment)));
    });
  }, [postId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedGif(null); // Clear GIF if file selected
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      addToast("Artifact Buffer Ready", "info");
    }
  };

  const handleGifSelect = (gif: GiphyGif) => {
    setSelectedFile(null); // Clear file if GIF selected
    setSelectedGif(gif);
    setPreviewUrl(gif.images.fixed_height.url);
    setIsGiphyPickerOpen(false);
    addToast("Giphy Fragment Linked", "success");
  };

  const removeSelectedFile = () => {
    if (previewUrl && !selectedGif) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setSelectedGif(null);
    setPreviewUrl(null);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newComment.trim() && !selectedFile && !selectedGif) || !db || !userData) return;
    
    setIsSubmittingComment(true);
    let mediaItems: { type: 'image' | 'video'; url: string }[] = [];

    try {
      if (selectedFile) {
        setIsUploadingMedia(true);
        addToast("Syncing Media Fragment...", "info");
        const url = await uploadToCloudinary(selectedFile);
        mediaItems.push({
          type: selectedFile.type.startsWith('video/') ? 'video' : 'image',
          url
        });
      } else if (selectedGif) {
        mediaItems.push({
          type: 'image',
          url: selectedGif.images.original.url
        });
      }

      const commentText = newComment.trim();
      const parent = replyingTo ? comments.find(c => c.id === replyingTo) : null;
      const payload: any = {
        authorId: userData.id,
        authorName: userData.displayName,
        authorAvatar: userData.avatarUrl,
        content: commentText,
        likes: 0,
        timestamp: serverTimestamp(),
        depth: parent ? (parent.depth || 0) + 1 : 0,
        media: mediaItems.length > 0 ? mediaItems : null
      };
      if (replyingTo) payload.parentId = replyingTo;

      await addDoc(collection(db, 'posts', postId, 'comments'), payload);
      await updateDoc(doc(db, 'posts', postId), {
        comments: increment(1)
      });

      setNewComment('');
      setReplyingTo(null);
      setIsEmojiPickerOpen(false);
      removeSelectedFile();
      addToast("Frequency Echo Synchronised", "success");
    } catch (e) {
      addToast("Neural Broadcast Failed", "error");
    } finally {
      setIsSubmittingComment(false);
      setIsUploadingMedia(false);
    }
  };

  const insertEmoji = (emoji: string) => {
    const input = inputRef.current;
    if (!input) {
      setNewComment(prev => prev + emoji);
      return;
    }
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const text = input.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    setNewComment(before + emoji + after);
    
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
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
    const hasChildren = commentThreads[comment.id] && commentThreads[comment.id].length > 0;
    
    return (
      <div key={comment.id} className={`relative flex flex-col animate-in fade-in slide-in-from-top-2 duration-300 group/comment ${isFocused ? 'z-[10]' : ''}`}>
        <div className="flex gap-3 relative">
          {/* Avatar Column */}
          <div className="flex flex-col items-center shrink-0">
             <img src={comment.authorAvatar} className="w-8 h-8 rounded-xl object-cover border border-slate-200 shadow-sm bg-white" alt="" />
             {hasChildren && <div className="w-px flex-1 bg-slate-200 my-1" />}
          </div>

          <div className="flex-1 min-w-0 pb-4">
             {/* Comment Bubble */}
             <div 
               onClick={() => setFocusedCommentId(isFocused ? null : comment.id)}
               className={`relative p-4 rounded-2xl rounded-tl-none transition-all duration-300 ${isFocused ? 'bg-white shadow-xl ring-2 ring-indigo-500 z-10' : 'bg-white border border-slate-100 hover:border-slate-300 hover:shadow-md'}`}
             >
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">{comment.authorName}</span>
                  <span className="text-[8px] font-mono font-bold text-slate-300">
                    {comment.timestamp?.toDate ? comment.timestamp.toDate().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : 'SYNC...'}
                  </span>
                </div>
                
                <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                
                {comment.media && comment.media.length > 0 && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 max-w-[240px]">
                    {comment.media[0].type === 'video' ? (
                      <video src={comment.media[0].url} className="w-full h-auto" controls />
                    ) : (
                      <img src={comment.media[0].url} className="w-full h-auto object-cover" alt="" />
                    )}
                  </div>
                )}
             </div>

             {/* Actions */}
             <div className="flex items-center gap-4 mt-1.5 ml-1">
                <button className="text-[8px] font-black uppercase text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1">
                   <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                   Pulse
                </button>
                <button 
                  onClick={() => setReplyingTo(comment.id)}
                  className="text-[8px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                  Echo
                </button>
             </div>

             {/* Nested Replies */}
             {commentThreads[comment.id] && (
               <div className="mt-3 space-y-4">
                 {commentThreads[comment.id].map(reply => renderComment(reply))}
               </div>
             )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-8 pt-8 border-t border-slate-100 animate-in slide-in-from-bottom-2 duration-500">
      {(isEmojiPickerOpen || isGiphyPickerOpen) && (
        <div 
          className="fixed inset-0 z-[1500] bg-slate-950/20 backdrop-blur-[2px] animate-in fade-in duration-300"
          onClick={() => { setIsEmojiPickerOpen(false); setIsGiphyPickerOpen(false); }}
        />
      )}

      <form onSubmit={handleSubmitComment} className="flex flex-col gap-4 mb-8 bg-slate-50 p-4 rounded-[2rem] border border-slate-100 relative group/input focus-within:border-indigo-200 focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all">
        {replyingTo && (
          <div className="flex items-center justify-between bg-indigo-100/50 px-4 py-2 rounded-xl text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-2 border border-indigo-100">
            <span>Targeting Node: {comments.find(c => c.id === replyingTo)?.authorName || 'Unknown'}</span>
            <button onClick={() => setReplyingTo(null)} className="opacity-60 hover:opacity-100 hover:bg-indigo-200 rounded-lg p-1 transition-all"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
        )}

        {/* Media Preview Box */}
        {previewUrl && (
          <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-indigo-500 shadow-lg group/preview mb-2 mx-2">
             {selectedFile?.type.startsWith('video/') ? (
               <video src={previewUrl} className="w-full h-full object-cover" />
             ) : (
               <img src={previewUrl} className="w-full h-full object-cover" alt="" />
             )}
             <button 
               type="button"
               onClick={removeSelectedFile}
               className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity text-white"
             >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
             {isUploadingMedia && (
               <div className="absolute inset-0 bg-indigo-600/60 flex items-center justify-center backdrop-blur-sm">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
               </div>
             )}
          </div>
        )}

        <div className="flex items-end gap-3">
          <img src={userData?.avatarUrl} className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-sm border border-white" alt="" />
          
          <div className="flex-1 flex flex-col gap-2">
             <input 
               ref={inputRef}
               type="text" 
               value={newComment}
               onChange={(e) => setNewComment(e.target.value)}
               placeholder={replyingTo ? "Transmit reply..." : "Inject thoughts into the stream..."}
               className="w-full bg-transparent border-none p-0 text-sm font-bold outline-none placeholder:text-slate-300 h-10"
             />
             
             <div className="flex items-center gap-1">
               <button 
                 type="button"
                 onClick={() => fileInputRef.current?.click()}
                 className={`p-2 rounded-lg transition-all active:scale-90 ${selectedFile ? 'text-indigo-600 bg-indigo-100' : 'text-slate-400 hover:text-indigo-500 hover:bg-white'}`}
               >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z" /></svg>
               </button>
               <button 
                 type="button"
                 onClick={() => { setIsGiphyPickerOpen(!isGiphyPickerOpen); setIsEmojiPickerOpen(false); }}
                 className={`p-2 rounded-lg transition-all active:scale-90 ${isGiphyPickerOpen ? 'text-indigo-600 bg-indigo-100' : 'text-slate-400 hover:text-indigo-500 hover:bg-white'}`}
               >
                  <span className="text-[10px] font-black font-mono">GIF</span>
               </button>
               <button 
                 type="button"
                 onClick={() => { setIsEmojiPickerOpen(!isEmojiPickerOpen); setIsGiphyPickerOpen(false); }}
                 className={`p-2 rounded-lg transition-all active:scale-90 ${isEmojiPickerOpen ? 'text-indigo-600 bg-indigo-100' : 'text-slate-400 hover:text-indigo-500 hover:bg-white'}`}
               >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" /></svg>
               </button>
             </div>
          </div>

          <button 
            disabled={(!newComment.trim() && !selectedFile && !selectedGif) || isSubmittingComment}
            className="p-3 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-30 disabled:bg-slate-300 shrink-0"
          >
             {isSubmittingComment ? (
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
             ) : (
               <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
             )}
          </button>
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*,video/*,.heic,.heif,.avif,.webp" 
          onChange={handleFileChange} 
        />

        {isEmojiPickerOpen && (
          <div className="absolute bottom-full left-0 z-[200] mb-2 shadow-2xl">
            <EmojiPicker onSelect={insertEmoji} onClose={() => setIsEmojiPickerOpen(false)} />
          </div>
        )}

        {isGiphyPickerOpen && (
          <div className="absolute bottom-full left-0 z-[200] mb-2 shadow-2xl">
            <GiphyPicker onSelect={handleGifSelect} onClose={() => setIsGiphyPickerOpen(false)} />
          </div>
        )}
      </form>

      <div className="space-y-6">
        {commentThreads.root.length > 0 ? (
          commentThreads.root.map(comment => renderComment(comment))
        ) : (
          <div className="py-12 text-center opacity-40 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] font-mono italic text-slate-400">Signal_Path_Clear</p>
            <p className="text-[8px] font-bold text-slate-300 mt-1 uppercase tracking-widest">Be the first to echo.</p>
          </div>
        )}
      </div>
    </div>
  );
};
