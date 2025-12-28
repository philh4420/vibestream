
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User } from '../../types';
import { ICONS } from '../../constants';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { collection, addDoc, serverTimestamp, query, where, limit, getDocs } = Firestore as any;
import { uploadToCloudinary } from '../../services/cloudinary';
import { EmojiPicker } from '../ui/EmojiPicker';
import { GiphyPicker } from '../ui/GiphyPicker';
import { GiphyGif } from '../../services/giphy';

interface CreateSignalBoxProps {
  userData: User | null;
  onOpen?: (initialAction?: 'media' | 'gif') => void; 
  onFileSelect?: (file: File) => void;
}

export const CreateSignalBox: React.FC<CreateSignalBoxProps> = ({ userData, onOpen }) => {
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  
  // Attachments
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [selectedGif, setSelectedGif] = useState<GiphyGif | null>(null);
  
  // Pickers
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);

  // Mentions
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<User[]>([]);
  const [mentionedUserCache, setMentionedUserCache] = useState<User[]>([]);
  const [showMentionList, setShowMentionList] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Search Users Effect
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
          limit(5)
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

  const handleFocus = () => {
    setIsExpanded(true);
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);
    const lastWord = textBeforeCursor.split(/\s/).pop();

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

  const renderHighlightedContent = (text: string) => {
    // Regex to split by mentions (@username) and hashtags (#tag)
    const parts = text.split(/((?:@|#)[a-zA-Z0-9_]+)/g);
    return parts.map((part, i) => {
        if (part.startsWith('@')) {
            return <span key={i} className="text-indigo-600 dark:text-indigo-400 font-bold">{part}</span>;
        }
        if (part.startsWith('#')) {
            return <span key={i} className="text-rose-500 dark:text-rose-400 font-bold">{part}</span>;
        }
        return <span key={i}>{part}</span>;
    });
  };

  const handleEmojiSelect = (emoji: string) => {
    const input = textareaRef.current;
    if (!input) {
      setContent(prev => prev + emoji);
      return;
    }
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const text = input.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    setContent(before + emoji + after);
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  const handleGifSelect = (gif: GiphyGif) => {
    setSelectedGif(gif);
    setSelectedFiles([]);
    setMediaPreviews([]);
    setShowGifPicker(false);
    setIsExpanded(true);
  };

  const selectMention = (user: User) => {
    const cursor = textareaRef.current?.selectionStart || 0;
    const textBefore = content.slice(0, cursor);
    const textAfter = content.slice(cursor);
    
    // Find the last occurrence of '@' before cursor
    const lastWordStart = textBefore.lastIndexOf('@');
    
    if (lastWordStart !== -1) {
        const newContent = content.slice(0, lastWordStart) + `@${user.username} ` + textAfter;
        setContent(newContent);
        setMentionedUserCache(prev => {
            if (prev.some(u => u.id === user.id)) return prev;
            return [...prev, user];
        });
    }
    setMentionQuery(null);
    setShowMentionList(false);
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 10);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setMediaPreviews(prev => [...prev, ...newPreviews]);
      setSelectedGif(null);
      setIsExpanded(true);
    }
  };

  const removeMedia = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handlePost = async () => {
    if ((!content.trim() && selectedFiles.length === 0 && !selectedGif) || !userData || !db) return;

    setIsPosting(true);
    const mediaItems: { type: 'image' | 'video'; url: string }[] = [];

    try {
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map(file => uploadToCloudinary(file));
        const urls = await Promise.all(uploadPromises);
        urls.forEach((url, index) => {
          mediaItems.push({
            type: selectedFiles[index].type.startsWith('video/') ? 'video' : 'image',
            url
          });
        });
      }

      if (selectedGif) {
        mediaItems.push({ type: 'image', url: selectedGif.images.original.url });
      }

      const postRef = await addDoc(collection(db, 'posts'), {
        authorId: userData.id,
        authorName: userData.displayName,
        authorAvatar: userData.avatarUrl,
        content: content.trim(),
        contentLengthTier: content.length > 280 ? 'deep' : 'standard',
        media: mediaItems,
        likes: 0,
        comments: 0,
        shares: 0,
        createdAt: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        timestamp: serverTimestamp(),
        likedBy: []
      });

      const finalContent = content.trim();
      // Notify mentioned users
      const mentionsToNotify = mentionedUserCache.filter(u => finalContent.includes(`@${u.username}`));
      const uniqueMentions = Array.from(new Set(mentionsToNotify.map(u => u.id)))
        .map(id => mentionsToNotify.find(u => u.id === id));

      for (const targetUser of uniqueMentions) {
        if (targetUser && targetUser.id !== userData.id) {
            await addDoc(collection(db, 'notifications'), {
                type: 'mention',
                fromUserId: userData.id,
                fromUserName: userData.displayName,
                fromUserAvatar: userData.avatarUrl,
                toUserId: targetUser.id,
                targetId: postRef.id,
                text: `mentioned you in a signal: "${finalContent.substring(0, 30)}..."`,
                isRead: false,
                timestamp: serverTimestamp(),
                pulseFrequency: 'cognition'
            });
        }
      }

      setContent('');
      setSelectedFiles([]);
      setMediaPreviews([]);
      setSelectedGif(null);
      setIsExpanded(false);
      setShowEmojiPicker(false);
      setShowGifPicker(false);
      setMentionedUserCache([]);
      window.dispatchEvent(new CustomEvent('vibe-toast', { detail: { msg: "Signal Broadcasted Successfully", type: 'success' } }));
    } catch (error) {
      window.dispatchEvent(new CustomEvent('vibe-toast', { detail: { msg: "Broadcast Failed", type: 'error' } }));
    } finally {
      setIsPosting(false);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  return (
    <div className={`bg-white dark:bg-slate-900 border-precision rounded-[3rem] p-6 md:p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.08)] transition-all duration-500 group relative z-40 ${isExpanded ? 'ring-2 ring-indigo-500/20' : ''}`}>
      
      <div className="flex gap-6 relative">
        <div className="relative shrink-0">
          <img 
            src={userData?.avatarUrl} 
            className="w-12 h-12 md:w-16 md:h-16 rounded-[1.4rem] object-cover shadow-md ring-1 ring-slate-100 dark:ring-slate-800" 
            alt="My Node" 
          />
          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse shadow-sm" />
        </div>
        
        <div className="flex-1 pt-1 relative">
          <div className="relative w-full min-h-[60px]">
              {/* Highlight Rendering Layer */}
              <div 
                className="absolute inset-0 w-full h-full text-lg font-medium whitespace-pre-wrap break-words pointer-events-none text-slate-900 dark:text-white"
                aria-hidden="true"
                style={{ overflowWrap: 'break-word' }}
              >
                 {renderHighlightedContent(content)}
                 {/* Ensure trailing newline is rendered */}
                 {content.endsWith('\n') && <br />}
              </div>

              {/* Input Layer */}
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleInput}
                onFocus={handleFocus}
                placeholder={`Initiate a new signal, ${userData?.displayName.split(' ')[0]}...`}
                className={`w-full bg-transparent border-none text-lg font-medium focus:ring-0 resize-none overflow-hidden min-h-[60px] relative z-10 placeholder:text-slate-400 dark:placeholder:text-slate-500 caret-indigo-600 dark:caret-white ${content ? 'text-transparent' : 'text-slate-900 dark:text-white'}`}
                rows={1}
                aria-label="Create Post Content"
                style={{ overflowWrap: 'break-word' }}
              />
          </div>

          {showMentionList && (
            <div className="absolute top-full left-0 z-50 w-64 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl mt-2 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 font-mono">
                      {isSearching ? 'Scanning_Grid...' : 'Neural_Lookup'}
                    </span>
                </div>
                {isSearching ? (
                   <div className="p-4 text-center"><div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
                ) : mentionResults.length > 0 ? (
                   mentionResults.map(user => (
                    <button key={user.id} onClick={() => selectMention(user)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors text-left group">
                        <img src={user.avatarUrl} className="w-8 h-8 rounded-lg object-cover" alt="" />
                        <div className="min-w-0">
                            <div className="flex items-center gap-1">
                                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.displayName}</span>
                                {user.verifiedHuman && <span className="text-indigo-500 text-[10px]"><ICONS.Verified /></span>}
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate">@{user.username}</span>
                        </div>
                    </button>
                   ))
                ) : (
                   <div className="px-4 py-3 text-[10px] text-slate-400 dark:text-slate-500 italic text-center">No matching nodes.</div>
                )}
            </div>
          )}
        </div>
      </div>

      {(mediaPreviews.length > 0 || selectedGif) && (
        <div className="mt-6 mb-4 pl-[calc(4rem+1.5rem)]">
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            {mediaPreviews.map((url, idx) => (
              <div key={idx} className="relative shrink-0 group/media">
                <img src={url} className="h-32 w-32 object-cover rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm" alt="Preview" />
                <button onClick={() => removeMedia(idx)} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md hover:bg-rose-600 transition-all opacity-0 group-hover/media:opacity-100" aria-label="Remove media">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
            {selectedGif && (
              <div key="gif-preview" className="relative shrink-0 group/media">
                <img src={selectedGif.images.fixed_height.url} className="h-32 w-auto object-cover rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm" alt="GIF" />
                <button onClick={() => setSelectedGif(null)} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md hover:bg-rose-600 transition-all opacity-0 group-hover/media:opacity-100" aria-label="Remove GIF">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {isExpanded && (
        <div className="mt-4 pl-[calc(4rem+1.5rem)] flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 animate-in fade-in slide-in-from-top-2 duration-300">
          
          <div className="flex items-center gap-1">
            <button onClick={() => fileInputRef.current?.click()} className="p-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" title="Upload Media" aria-label="Attach media">
              <div className="scale-90"><ICONS.Create /></div>
            </button>
            
            <button onClick={() => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false); }} className={`p-2.5 rounded-xl transition-colors ${showGifPicker ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400' : 'hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-indigo-600'}`} title="Add GIF" aria-label="Add GIF">
              <span className="text-[10px] font-black font-mono">GIF</span>
            </button>

            <button onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); }} className={`p-2.5 rounded-xl transition-colors ${showEmojiPicker ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400' : 'hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-400'}`} title="Add Emoji" aria-label="Add Emoji">
              <span className="text-xl leading-none">😊</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
             <button 
                onClick={handlePost}
                disabled={isPosting || (!content.trim() && selectedFiles.length === 0 && !selectedGif)}
                className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 dark:hover:bg-indigo-400 dark:hover:text-white transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                aria-label="Broadcast Signal"
             >
                {isPosting ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>BROADCAST <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /></>}
             </button>
          </div>
        </div>
      )}

      {(showEmojiPicker || showGifPicker) && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-transparent" onClick={() => { setShowEmojiPicker(false); setShowGifPicker(false); }} />
          <div className="relative animate-in zoom-in-95 duration-300">
            {showEmojiPicker && <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />}
            {showGifPicker && <GiphyPicker onSelect={handleGifSelect} onClose={() => setShowGifPicker(false)} />}
          </div>
        </div>,
        document.body
      )}

      <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*,video/*" onChange={handleFileSelect} />
    </div>
  );
};
