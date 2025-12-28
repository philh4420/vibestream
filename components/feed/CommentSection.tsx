import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../../services/firebase';
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
  doc,
  where,
  getDocs,
  writeBatch,
  deleteDoc
} = Firestore as any;
import { Comment, User } from '../../types';
import { EmojiPicker } from '../ui/EmojiPicker';
import { GiphyPicker } from '../ui/GiphyPicker';
import { uploadToCloudinary } from '../../services/cloudinary';
import { GiphyGif } from '../../services/giphy';
import { ICONS } from '../../constants';
import { extractUrls } from '../../lib/textUtils';
import { LinkPreview } from '../ui/LinkPreview';
import { DeleteConfirmationModal } from '../ui/DeleteConfirmationModal';
import { RichTextEditor, RichTextEditorRef } from '../ui/RichTextEditor';

interface CommentSectionProps {
  postId: string;
  postAuthorId: string;
  userData: User | null;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  locale?: string;
  blockedIds?: Set<string>;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ postId, postAuthorId, userData, addToast, locale = 'en-GB', blockedIds }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [focusedCommentId, setFocusedCommentId] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isGiphyPickerOpen, setIsGiphyPickerOpen] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedGif, setSelectedGif] = useState<GiphyGif | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  // Editing State
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Deletion State
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  // Mention State
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<User[]>([]);
  const [mentionedUserCache, setMentionedUserCache] = useState<User[]>([]);
  const [showMentionList, setShowMentionList] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<RichTextEditorRef>(null);
  const editEditorRef = useRef<RichTextEditorRef>(null);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'posts', postId, 'comments'), orderBy('timestamp', 'asc'), limit(100));
    return onSnapshot(q, (snap: any) => {
      const allComments = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Comment));
      setComments(allComments);
    });
  }, [postId]);

  const visibleComments = useMemo(() => {
    return comments.filter(c => !blockedIds?.has(c.authorId));
  }, [comments, blockedIds]);

  useEffect(() => {
    if (mentionQuery === null) {
      setMentionResults([]);
      setShowMentionList(false);
      return;
    }

    const searchUsers = async () => {
      setIsSearching(true);
      setShowMentionList(true);

      try {
        const q = query(
          collection(db, 'users'),
          where('username', '>=', mentionQuery.toLowerCase()),
          where('username', '<=', mentionQuery.toLowerCase() + '\uf8ff'),
          limit(3)
        );
        const snap = await getDocs(q);
        const users = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as User));
        setMentionResults(users);
      } catch (e) {
        console.error("Mention search error", e);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [mentionQuery]);

  const handleEditorChange = (html: string) => {
    setNewComment(html);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const text = tempDiv.innerText || "";
    
    const words = text.split(/\s/);
    const lastWord = words[words.length - 1];
    
    if (lastWord && lastWord.startsWith('@')) {
      const queryStr = lastWord.slice(1);
      if (queryStr.length >= 1) {
        setMentionQuery(queryStr);
      } else {
        setMentionQuery(null);
        setShowMentionList(false);
      }
    } else {
      setMentionQuery(null);
      setShowMentionList(false);
    }
  };

  const selectMention = (user: User) => {
    editorRef.current?.insertContent(`<strong>@${user.username}</strong> `);
    setMentionedUserCache(prev => {
        if (prev.some(u => u.id === user.id)) return prev;
        return [...prev, user];
    });
    setMentionQuery(null);
    setShowMentionList(false);
    editorRef.current?.focus();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedGif(null);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      addToast("Artifact Buffer Ready", "info");
    }
  };

  const handleGifSelect = (gif: GiphyGif) => {
    setSelectedFile(null);
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmitComment = async () => {
    const isActuallyEmpty = !newComment.trim() || newComment === '<p></p>';
    if ((isActuallyEmpty && !selectedFile && !selectedGif) || !db || !userData) return;
    
    setIsSubmittingComment(true);
    let mediaItems: { type: 'image' | 'video'; url: string }[] = [];

    try {
      if (selectedFile) {
        setIsUploadingMedia(true);
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
        authorCosmetics: {
          border: userData.cosmetics?.activeBorder || null
        },
        content: commentText,
        likes: 0,
        timestamp: serverTimestamp(),
        depth: parent ? (parent.depth || 0) + 1 : 0,
        media: mediaItems.length > 0 ? mediaItems : null
      };
      if (replyingTo) payload.parentId = replyingTo;

      await addDoc(collection(db, 'posts', postId, 'comments'), payload);
      await updateDoc(doc(db, 'posts', postId), { comments: increment(1) });

      const batch = writeBatch(db);
      if (userData.id !== postAuthorId) {
        batch.set(doc(collection(db, 'notifications')), {
          type: 'comment',
          fromUserId: userData.id,
          fromUserName: userData.displayName,
          fromUserAvatar: userData.avatarUrl,
          toUserId: postAuthorId,
          targetId: postId,
          text: `echoed on your signal.`,
          isRead: false,
          timestamp: serverTimestamp(),
          pulseFrequency: 'intensity'
        });
      }

      const mentionsToNotify = mentionedUserCache.filter(u => commentText.includes(`@${u.username}`));
      const uniqueMentions = Array.from(new Set(mentionsToNotify.map(u => u.id))).map(id => mentionsToNotify.find(u => u.id === id));

      uniqueMentions.forEach(targetUser => {
        if (targetUser && targetUser.id !== userData.id && targetUser.id !== postAuthorId) {
            batch.set(doc(collection(db, 'notifications')), {
                type: 'mention',
                fromUserId: userData.id,
                fromUserName: userData.displayName,
                fromUserAvatar: userData.avatarUrl,
                toUserId: targetUser.id,
                targetId: postId,
                text: `mentioned you in a comment.`,
                isRead: false,
                timestamp: serverTimestamp(),
                pulseFrequency: 'velocity'
            });
        }
      });

      await batch.commit();

      setNewComment('');
      editorRef.current?.clear();
      setReplyingTo(null);
      setIsEmojiPickerOpen(false);
      removeSelectedFile();
      setMentionedUserCache([]);
      setMentionQuery(null);
      setShowMentionList(false);
      addToast("Frequency Echo Synchronised", "success");
    } catch (e) {
      addToast("Neural Broadcast Failed", "error");
    } finally {
      setIsSubmittingComment(false);
      setIsUploadingMedia(false);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim() || !db) return;
    try {
        await updateDoc(doc(db, 'posts', postId, 'comments', commentId), {
            content: editContent.trim(),
            updatedAt: serverTimestamp()
        });
        setEditingCommentId(null);
        addToast("Echo Updated", "success");
    } catch (e) {
        addToast("Update Failed", "error");
    }
  };

  const handleExecuteDelete = async () => {
    if (!commentToDelete || !db) return;
    try {
      await deleteDoc(doc(db, 'posts', postId, 'comments', commentToDelete));
      await updateDoc(doc(db, 'posts', postId), { comments: increment(-1) });
      addToast("Echo Silenced", "success");
    } catch (e) {
      addToast("Purge Protocol Failed", "error");
    } finally {
      setCommentToDelete(null);
    }
  };

  const insertEmoji = (emoji: string) => {
    editorRef.current?.insertContent(emoji);
  };

  const commentThreads = useMemo(() => {
    const map: Record<string, Comment[]> = { root: [] };
    visibleComments.forEach(c => {
      const key = c.parentId || 'root';
      if (!map[key]) map[key] = [];
      map[key].push(c);
    });
    return map;
  }, [visibleComments]);

  const renderComment = (comment: Comment, isLast: boolean = false) => {
    const isFocused = focusedCommentId === comment.id;
    const hasChildren = commentThreads[comment.id] && commentThreads[comment.id].length > 0;
    const canDelete = userData && (userData.id === comment.authorId || userData.id === postAuthorId);
    const canEdit = userData && userData.id === comment.authorId;
    const isEditing = editingCommentId === comment.id;
    const isOP = comment.authorId === postAuthorId;
    const extractedUrl = extractUrls(comment.content)[0];
    const borderClass = comment.authorCosmetics?.border ? `cosmetic-border-${comment.authorCosmetics.border}` : '';

    return (
      <div key={comment.id} className={`relative flex flex-col animate-in fade-in slide-in-from-top-2 duration-500 group/comment ${isFocused ? 'z-[10]' : ''}`}>
        <div className="flex gap-4 relative">
          
          {/* Thread Connector Visuals */}
          <div className="flex flex-col items-center shrink-0 w-8">
             <div className={`relative shrink-0 w-8 h-8 rounded-xl z-10 transition-transform duration-300 group-hover/comment:scale-105 ${borderClass}`}>
              <img src={comment.authorAvatar} className="w-full h-full rounded-xl object-cover ring-2 ring-white dark:ring-slate-900 bg-slate-100 shadow-sm" alt="" />
              {isOP && (
                <div className="absolute -bottom-1.5 -right-1.5 bg-indigo-600 text-white px-1.5 py-0.5 rounded-md text-[6px] font-black uppercase tracking-widest shadow-lg border border-white dark:border-slate-900">OP</div>
              )}
             </div>
             {hasChildren && <div className="w-0.5 flex-1 bg-slate-100 dark:bg-slate-800/60 my-1 rounded-full" />}
             {!isLast && !hasChildren && comment.parentId && <div className="absolute left-4 -bottom-4 w-0.5 h-4 bg-slate-100 dark:bg-slate-800/60" />}
          </div>

          <div className="flex-1 min-w-0 pb-6">
             <div 
               onClick={() => !isEditing && setFocusedCommentId(isFocused ? null : comment.id)}
               className={`relative p-5 rounded-[1.8rem] rounded-tl-none transition-all duration-300 cursor-pointer ${
                   isFocused && !isEditing 
                     ? 'bg-white dark:bg-slate-800 shadow-2xl ring-2 ring-indigo-500/40 z-10' 
                     : 'bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-lg'
                }`}
             >
                <div className="flex justify-between items-baseline mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider leading-none">{comment.authorName}</span>
                    {isOP && <span className="w-1 h-1 bg-indigo-500 rounded-full animate-pulse" />}
                  </div>
                  <span className="text-[8px] font-mono font-bold text-slate-400 dark:text-slate-500 opacity-60">
                    {comment.timestamp?.toDate ? comment.timestamp.toDate().toLocaleString(locale, { 
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
                    }) : 'Establishing...'}
                  </span>
                </div>
                
                {isEditing ? (
                    <div className="mt-3 animate-in fade-in duration-300" onClick={e => e.stopPropagation()}>
                        <RichTextEditor 
                            ref={editEditorRef}
                            content={editContent} 
                            onChange={setEditContent}
                            onSubmit={() => handleUpdateComment(comment.id)}
                            className="border border-indigo-200 dark:border-indigo-800/50 rounded-2xl overflow-hidden"
                            minHeight="60px"
                        />
                        <div className="flex gap-2 mt-3 justify-end">
                            <button onClick={() => setEditingCommentId(null)} className="text-[9px] font-black uppercase text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 px-4 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">Cancel</button>
                            <button onClick={() => handleUpdateComment(comment.id)} className="text-[9px] font-black uppercase text-white bg-indigo-600 hover:bg-indigo-700 px-5 py-2 rounded-xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none">Save_Update</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: comment.content }} />
                        {extractedUrl && <div className="mt-4"><LinkPreview url={extractedUrl} compact={true} /></div>}
                        {comment.media && comment.media.length > 0 && (
                        <div className="mt-4 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 max-w-full md:max-w-[400px]">
                            {comment.media[0].type === 'video' ? (
                                <video src={comment.media[0].url} className="w-full h-auto" controls />
                            ) : (
                                <img src={comment.media[0].url} className="w-full h-auto object-cover" alt="Echo Visual" />
                            )}
                        </div>
                        )}
                    </>
                )}
             </div>

             {/* Actions Bar */}
             <div className="flex items-center gap-6 mt-2 ml-1 opacity-60 group-hover/comment:opacity-100 transition-opacity">
                <button 
                    onClick={(e) => { e.stopPropagation(); setReplyingTo(comment.id); editorRef.current?.focus(); }} 
                    className="text-[8px] font-black uppercase text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5"
                >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                    ECHO_REPLY
                </button>
                {canEdit && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); setEditingCommentId(comment.id); setEditContent(comment.content); }} 
                        className="text-[8px] font-black uppercase text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                    >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        EDIT
                    </button>
                )}
                {canDelete && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCommentToDelete(comment.id); }} 
                    className="text-[8px] font-black uppercase text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    PURGE
                  </button>
                )}
             </div>

             {/* Nested Replies Rendering */}
             {hasChildren && (
               <div className="mt-6 space-y-6">
                 {commentThreads[comment.id].map((reply, ridx) => renderComment(reply, ridx === commentThreads[comment.id].length - 1))}
               </div>
             )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-800/50 animate-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. Comment Stream */}
      <div className="space-y-8 mb-12">
        <div className="flex items-center gap-3 mb-10 px-1">
            <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] font-mono">Neural_Echoes</h3>
            <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800/60" />
            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 font-mono">COUNT: {visibleComments.length}</span>
        </div>
        
        {commentThreads['root'].length > 0 ? (
            commentThreads['root'].map((comment, idx) => renderComment(comment, idx === commentThreads['root'].length - 1))
        ) : (
          <div className="text-center py-16 opacity-40 bg-slate-50/50 dark:bg-slate-800/20 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-700">
             <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-slate-600">
                <ICONS.Messages />
             </div>
             <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Zero_Frequency_Reflections</p>
          </div>
        )}
      </div>

      {/* 2. Interactive Input Deck */}
      <div className="sticky bottom-4 z-40 bg-white dark:bg-slate-900 rounded-[2.8rem] p-4 shadow-2xl border border-slate-100 dark:border-slate-800 transition-all duration-500 ring-4 ring-slate-50/50 dark:ring-slate-950/50 group/input focus-within:ring-indigo-500/10">
        
        {/* Reply Context Bar */}
        {replyingTo && (
          <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/40 px-5 py-3 rounded-2xl text-[9px] font-black text-indigo-600 dark:text-indigo-300 uppercase tracking-widest mb-4 border border-indigo-100 dark:border-indigo-800/50 animate-in slide-in-from-top-2 duration-300">
            <span className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-pulse" />
                Targeting_Node: {comments.find(c => c.id === replyingTo)?.authorName || 'Fragment'}
            </span>
            <button 
                type="button" 
                onClick={() => setReplyingTo(null)} 
                className="hover:bg-white dark:hover:bg-slate-800 rounded-lg p-1.5 transition-all text-indigo-400 hover:text-rose-500 active:scale-90"
            >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </button>
          </div>
        )}

        {/* Media Preview Area */}
        {previewUrl && (
          <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-indigo-500 shadow-xl group/preview mb-4 mx-2 animate-in zoom-in-95 duration-300">
             {selectedFile?.type.startsWith('video/') ? (
                 <video src={previewUrl} className="w-full h-full object-cover" muted />
             ) : (
                 <img src={previewUrl} className="w-full h-full object-cover" alt="Echo Buffer" />
             )}
             <button 
                onClick={removeSelectedFile} 
                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity text-white hover:text-rose-400"
             >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
             </button>
             {isUploadingMedia && <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10"><div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /></div>}
          </div>
        )}

        {/* Input Controls */}
        <div className="flex gap-4 items-end">
           <div className="flex gap-1 shrink-0 pb-1.5 px-1">
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()} 
                className="p-3.5 rounded-2xl hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-90 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-800"
                title="Attach Media"
              >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z" />
              </button>
              <button 
                type="button" 
                onClick={() => { setIsGiphyPickerOpen(!isGiphyPickerOpen); setIsEmojiPickerOpen(false); }} 
                className={`p-3.5 rounded-2xl transition-all active:scale-90 text-[10px] font-black font-mono border border-transparent ${isGiphyPickerOpen ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 border-indigo-100 dark:border-indigo-800' : 'hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-indigo-600 hover:border-indigo-100'}`}
                title="Giphy Fragment"
              >
                  GIF
              </button>
              <button 
                type="button" 
                onClick={() => { setIsEmojiPickerOpen(!isEmojiPickerOpen); setIsGiphyPickerOpen(false); }} 
                className={`p-3.5 rounded-2xl transition-all active:scale-90 text-xl leading-none border border-transparent ${isEmojiPickerOpen ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-100 dark:border-indigo-800' : 'hover:bg-indigo-50 dark:hover:bg-slate-800'}`}
                title="Neural Glyph"
              >
                  😊
              </button>
           </div>

           {/* Main Input Component */}
           <div className="relative flex-1 group/field">
              <RichTextEditor 
                ref={editorRef}
                content={newComment}
                onChange={handleEditorChange}
                onSubmit={handleSubmitComment}
                placeholder={replyingTo ? "Compose echo response..." : "Transmit new echo sequence..."}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-[2.2rem] px-6 py-4 transition-all focus-within:bg-white dark:focus-within:bg-slate-700 focus-within:border-indigo-300 dark:focus-within:border-indigo-900 focus-within:shadow-lg"
                minHeight="50px"
              />

              {/* Mentions Dropdown Portal */}
              {showMentionList && (
                <div className="absolute bottom-full left-0 mb-3 w-64 bg-white/95 dark:bg-slate-800/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-700 rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 z-[60]">
                    <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 font-mono">
                            {isSearching ? 'SCANNIG_NODES...' : 'IDENTIFY_NODE'}
                        </span>
                        {isSearching && <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
                    </div>
                    {mentionResults.length > 0 ? (
                        <div className="p-1.5">
                            {mentionResults.map(user => (
                                <button 
                                    key={user.id} 
                                    onClick={() => selectMention(user)} 
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:text-white rounded-2xl transition-all text-left group/mitem"
                                >
                                    <img src={user.avatarUrl} className="w-8 h-8 rounded-xl object-cover border border-slate-100 group-hover/mitem:border-white/20" alt="" />
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-black truncate group-hover/mitem:text-white">@{user.username}</span>
                                            {user.verifiedHuman && <span className="text-indigo-500 group-hover/mitem:text-white text-[10px]"><ICONS.Verified /></span>}
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 truncate block group-hover/mitem:text-white/60">{user.displayName}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : !isSearching && <div className="px-5 py-4 text-[10px] text-slate-400 italic text-center font-medium">No results in sector.</div>}
                </div>
              )}

              {/* Submit Button Integrated in Input */}
              <button 
                onClick={handleSubmitComment}
                disabled={(!newComment.trim() || newComment === '<p></p>') && !selectedFile && !selectedGif || isSubmittingComment}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-full flex items-center justify-center shadow-xl hover:bg-indigo-600 dark:hover:bg-indigo-400 dark:hover:text-white transition-all active:scale-90 disabled:opacity-20 disabled:active:scale-100 z-10 group/send"
              >
                {isSubmittingComment ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                    <svg className="w-5 h-5 rotate-90 ml-0.5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                )}
              </button>
           </div>
        </div>  
      </div>

      {/* Hidden Pickers & Inputs */}
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*,video/*,.heic,.avif,.webp" />
      
      {(isEmojiPickerOpen || isGiphyPickerOpen) && createPortal(
        <>
          <div className="fixed inset-0 z-[9990] bg-transparent" onClick={() => { setIsEmojiPickerOpen(false); setIsGiphyPickerOpen(false); }} />
          <div className="fixed bottom-24 left-4 z-[9999] animate-in slide-in-from-bottom-4 zoom-in-95 duration-300 origin-bottom-left font-sans">
              {isEmojiPickerOpen && <EmojiPicker onSelect={insertEmoji} onClose={() => setIsEmojiPickerOpen(false)} />}
              {isGiphyPickerOpen && <GiphyPicker onSelect={handleGifSelect} onClose={() => setIsGiphyPickerOpen(false)} />}
          </div>
        </>,
        document.body
      )}

      <DeleteConfirmationModal 
        isOpen={!!commentToDelete} 
        title="SILENCE_ECHO" 
        description="Permanently purge this neural reflection? This protocol cannot be reversed once initialized." 
        onConfirm={handleExecuteDelete} 
        onCancel={() => setCommentToDelete(null)} 
        confirmText="CONFIRM_PURGE" 
      />
    </div>
  );
};