
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
             <img src={comment.authorAvatar} className="w-8 h-8 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800" alt="" />
             {hasChildren && <div className="w-px flex-1 bg-slate-200 dark:bg-slate-700 my-1" />}
          </div>

          <div className="flex-1 min-w-0 pb-4">
             {/* Comment Bubble */}
             <div 
               onClick={() => setFocusedCommentId(isFocused ? null : comment.id)}
               className={`relative p-4 rounded-2xl rounded-tl-none transition-all duration-300 ${isFocused ? 'bg-white dark:bg-slate-800 shadow-xl ring-2 ring-indigo-500 z-10' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md'}`}
             >
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none">{comment.authorName}</span>
                  <span className="text-[8px] font-mono font-bold text-slate-300 dark:text-slate-500">
                    {comment.timestamp?.toDate ? comment.timestamp.toDate().toLocaleString(locale, { 
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit', 
                      minute: '2-digit' 
                    }) : 'SYNC...'}
                  </span>
                </div>
                
                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                
                {comment.media && comment.media.length > 0 && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 max-w-[240px]">
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
                <button className="text-[8px] font-black uppercase text-slate-400 dark:text-slate-500 hover:text-rose-500 transition-colors flex items-center gap-1">
                   <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                   Pulse
                </button>
                <button 
                  onClick={() => setReplyingTo(comment.id)}
                  className="text-[8px] font-black uppercase text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
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
    <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom-2 duration-500">
      {(isEmojiPickerOpen || isGiphyPickerOpen) && (
        <div 
          className="fixed inset-0 z-[1500] bg-transparent animate-in fade-in duration-300"
          onClick={() => { setIsEmojiPickerOpen(false); setIsGiphyPickerOpen(false); }}
        />
      )}

      <form onSubmit={handleSubmitComment} className="flex flex-col gap-4 mb-8 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 relative group/input focus-within:border-indigo-200 dark:focus-within:border-indigo-800 focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all">
        {replyingTo && (
          <div className="flex items-center justify-between bg-indigo-100/50 dark:bg-indigo-900/30 px-4 py-2 rounded-xl text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2 border border-indigo-100 dark:border-indigo-800">
            <span>Targeting Node: {comments.find(c => c.id === replyingTo)?.authorName || 'Unknown'}</span>
            <button onClick={() => setReplyingTo(null)} className="opacity-60 hover:opacity-100 hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-lg p-1 transition-all"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg></button>
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
               <div