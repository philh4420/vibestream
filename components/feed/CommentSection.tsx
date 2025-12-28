
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

  // --- MENTION LOGIC ---
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
    
    const lastWord = text.split(/\s/).pop();
    if (lastWord && lastWord.startsWith('@')) {
      const query = lastWord.slice(1);
      if (query.length >= 1) {
        setMentionQuery(query);
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
    if ((!newComment.trim() && !selectedFile && !selectedGif) || !db || !userData) return;
    
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
        content: commentText,
        likes: 0,
        timestamp: serverTimestamp(),
        depth: parent ? (parent.depth || 0) + 1 : 0,
        media: mediaItems.length > 0 ? mediaItems : null
      };
      if (replyingTo) payload.parentId = replyingTo;

      await addDoc(collection(db, 'posts', postId, 'comments'), payload);
      await updateDoc(doc(db, 'posts', postId), { comments: increment(1) });

      // Notifications
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

  const renderComment = (comment: Comment) => {
    const isFocused = focusedCommentId === comment.id;
    const hasChildren = commentThreads[comment.id] && commentThreads[comment.id].length > 0;
    const canDelete = userData && (userData.id === comment.authorId || userData.id === postAuthorId);
    const canEdit = userData && userData.id === comment.authorId;
    const isEditing = editingCommentId === comment.id;
    const extractedUrl = extractUrls(comment.content)[0];

    return (
      <div key={comment.id} className={`relative flex flex-col animate-in fade-in slide-in-from-top-2 duration-300 group/comment ${isFocused ? 'z-[10]' : ''}`}>
        <div className="flex gap-3 relative">
          <div className="flex flex-col items-center shrink-0">
             <img src={comment.authorAvatar} className="w-8 h-8 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800" alt="" />
             {hasChildren && <div className="w-px flex-1 bg-slate-200 dark:bg-slate-700 my-1" />}
          </div>

          <div className="flex-1 min-w-0 pb-4">
             <div 
               onClick={() => !isEditing && setFocusedCommentId(isFocused ? null : comment.id)}
               className={`relative p-4 rounded-2xl rounded-tl-none transition-all duration-300 ${isFocused && !isEditing ? 'bg-white dark:bg-slate-800 shadow-xl ring-2 ring-indigo-500 z-10' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md'}`}
             >
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none">{comment.authorName}</span>
                  <span className="text-[8px] font-mono font-bold text-slate-300 dark:text-slate-500">
                    {comment.timestamp?.toDate ? comment.timestamp.toDate().toLocaleString(locale, { 
                      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                    }) : 'SYNC...'}
                  </span>
                </div>
                
                {isEditing ? (
                    <div className="mt-2">
                        <RichTextEditor 
                            ref={editEditorRef}
                            content={editContent} 
                            onChange={setEditContent}
                            onSubmit={() => handleUpdateComment(comment.id)}
                            className="border border-indigo-200 dark:border-indigo-800 rounded-xl"
                            minHeight="60px"
                        />
                        <div className="flex gap-2 mt-2 justify-end">
                            <button onClick={() => setEditingCommentId(null)} className="text-[9px] font-black uppercase text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">Cancel</button>
                            <button onClick={() => handleUpdateComment(comment.id)} className="text-[9px] font-black uppercase text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-all shadow-sm">Save</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: comment.content }} />
                        
                        {extractedUrl && <div className="mt-3 max-w-[280px]"><LinkPreview url={extractedUrl} compact={true} /></div>}

                        {comment.media && comment.media.length > 0 && (
                        <div className="mt-3 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 max-w-[240px]">
                            {comment.media[0].type === 'video' ? (
                            <video src={comment.media[0].url} className="w-full h-auto" controls />
                            ) : (
                            <img src={comment.media[0].url} className="w-full h-auto object-cover" alt="" />
                            )}
                        </div>
                        )}
                    </>
                )}
             </div>

             <div className="flex items-center gap-4 mt-1.5 ml-1">
                <button onClick={() => setReplyingTo(comment.id)} className="text-[8px] font-black uppercase text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1">Echo</button>
                {canEdit && (
                    <button onClick={() => { setEditingCommentId(comment.id); setEditContent(comment.content); }} className="text-[8px] font-black uppercase text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1">Edit</button>
                )}
                {canDelete && (
                  <button onClick={() => setCommentToDelete(comment.id)} className="text-[8px] font-black uppercase text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors flex items-center gap-1">Purge</button>
                )}
             </div>

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
      <div className="space-y-6 mb-8">
        {commentThreads['root'].length > 0 ? commentThreads['root'].map(comment => renderComment(comment)) : (
          <div className="text-center py-8 opacity-50"><p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">No neural echoes yet.</p></div>
        )}
      </div>

      <div className="flex flex-col gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 relative group/input z-20">
        {replyingTo && (
          <div className="flex items-center justify-between bg-indigo-100/50 dark:bg-indigo-900/30 px-4 py-2 rounded-xl text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2 border border-indigo-100 dark:border-indigo-800">
            <span>Targeting Node: {comments.find(c => c.id === replyingTo)?.authorName || 'Unknown'}</span>
            <button type="button" onClick={() => setReplyingTo(null)} className="opacity-60 hover:opacity-100 hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-lg p-1 transition-all"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
        )}

        {previewUrl && (
          <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-indigo-500 shadow-lg group/preview mb-2 mx-2 bg-slate-200 dark:bg-slate-800">
             {selectedFile?.type.startsWith('video/') ? <video src={previewUrl} className="w-full h-full object-cover" /> : <img src={previewUrl} className="w-full h-full object-cover" alt="" />}
             <button onClick={removeSelectedFile} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg></button>
             {isUploadingMedia && <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /></div>}
          </div>
        )}

        <div className="flex gap-2 items-end">
           <div className="flex gap-1 shrink-0 pb-1.5">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 transition-all active:scale-90"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z" /></svg></button>
              <button type="button" onClick={() => { setIsGiphyPickerOpen(!isGiphyPickerOpen); setIsEmojiPickerOpen(false); }} className="p-3 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-90 text-[10px] font-black font-mono text-slate-400 dark:text-slate-500">GIF</button>
              <button type="button" onClick={() => { setIsEmojiPickerOpen(!isEmojiPickerOpen); setIsGiphyPickerOpen(false); }} className="p-3 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-90 text-xl leading-none">😊</button>
           </div>

           <div className="relative flex-1">
              <RichTextEditor 
                ref={editorRef}
                content={newComment}
                onChange={handleEditorChange}
                onSubmit={handleSubmitComment}
                placeholder="Broadcast your echo..."
                className="w-full bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 rounded-[2.2rem] px-6 py-3"
                minHeight="50px"
              />
              
              {showMentionList && (
                <div className="absolute bottom-full left-0 mb-2 w-56 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 z-50">
                    <div className="px-3 py-1.5 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 font-mono">{isSearching ? 'Scanning...' : 'Select_Node'}</span>
                    </div>
                    {isSearching ? (
                       <div className="p-3 text-center"><div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
                    ) : mentionResults.length > 0 ? (
                        mentionResults.map(user => (
                            <button key={user.id} onClick={() => selectMention(user)} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors text-left group">
                                <img src={user.avatarUrl} className="w-6 h-6 rounded-md object-cover" alt="" />
                                <div className="min-w-0">
                                    <span className="text-[10px] font-bold text-slate-900 dark:text-white truncate block">{user.displayName}</span>
                                    <span className="text-[8px] font-mono text-slate-400 dark:text-slate-500 truncate block">@{user.username}</span>
                                </div>
                            </button>
                        ))
                    ) : <div className="px-3 py-2 text-[9px] text-slate-400 italic text-center">No nodes found.</div>}
                </div>
              )}

              <button 
                onClick={handleSubmitComment}
                disabled={(!newComment.trim() && !selectedFile && !selectedGif) || isSubmittingComment}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-all active:scale-90 disabled:opacity-30 disabled:active:scale-100 z-10"
              >
                {isSubmittingComment ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <svg className="w-4 h-4 rotate-90 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
              </button>
           </div>
        </div>
      </div>
      
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*,video/*" />

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
        description="Permanently delete this comment? This action cannot be reversed."
        onConfirm={handleExecuteDelete}
        onCancel={() => setCommentToDelete(null)}
        confirmText="CONFIRM_PURGE"
      />
    </div>
  );
};
