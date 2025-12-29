import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, PollOption } from '../../types';
import { ICONS } from '../../constants';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { collection, addDoc, serverTimestamp, query, where, limit, getDocs } = Firestore as any;
import { uploadToCloudinary } from '../../services/cloudinary';
import { EmojiPicker } from '../ui/EmojiPicker';
import { GiphyPicker } from '../ui/GiphyPicker';
import { GiphyGif } from '../../services/giphy';
import { RichTextEditor, RichTextEditorRef } from '../ui/RichTextEditor';

interface CreateSignalBoxProps {
  userData: User | null;
  onOpen?: (initialAction?: 'media' | 'gif') => void; 
  onFileSelect?: (file: File) => void;
}

export const CreateSignalBox: React.FC<CreateSignalBoxProps> = ({ userData, onOpen }) => {
  const [content, setContent] = useState(''); // Stores HTML
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  
  // Attachments
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [selectedGif, setSelectedGif] = useState<GiphyGif | null>(null);
  
  // Poll State
  const [isPollMode, setIsPollMode] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

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
  const editorRef = useRef<RichTextEditorRef>(null);

  const borderClass = userData?.cosmetics?.activeBorder ? `cosmetic-border-${userData.cosmetics.activeBorder}` : '';

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

  const handleEditorChange = (html: string) => {
    setContent(html);
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

  const handleEmojiSelect = (emoji: string) => {
    editorRef.current?.insertContent(emoji);
  };

  const handleGifSelect = (gif: GiphyGif) => {
    setSelectedGif(gif);
    setSelectedFiles([]);
    setMediaPreviews([]);
    setIsPollMode(false); 
    setShowGifPicker(false);
    setIsExpanded(true);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setMediaPreviews(prev => [...prev, ...newPreviews]);
      setSelectedGif(null);
      setIsPollMode(false); 
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

  const handlePollOptionChange = (idx: number, val: string) => {
    const newOptions = [...pollOptions];
    newOptions[idx] = val;
    setPollOptions(newOptions);
  };

  const addPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const removePollOption = (idx: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== idx));
    }
  };

  const togglePollMode = () => {
    if (isPollMode) {
      setIsPollMode(false);
    } else {
      setIsPollMode(true);
      setSelectedFiles([]);
      setMediaPreviews([]);
      setSelectedGif(null);
      setIsExpanded(true);
    }
  };

  const handlePost = async () => {
    const isEmpty = !content || content === '<p></p>';
    if ((isEmpty && selectedFiles.length === 0 && !selectedGif && !isPollMode) || !userData || !db) return;

    if (isPollMode) {
      const validOptions = pollOptions.filter(o => o.trim() !== '');
      if (validOptions.length < 2) {
        window.dispatchEvent(new CustomEvent('vibe-toast', { detail: { msg: "Poll requires at least 2 options.", type: 'error' } }));
        return;
      }
    }

    setIsPosting(true);
    const mediaItems: { type: 'image' | 'video' | 'file'; url: string }[] = [];

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

      let pollPayload = {};
      if (isPollMode) {
        const options: PollOption[] = pollOptions
          .filter(o => o.trim() !== '')
          .map(text => ({ id: Math.random().toString(36).substr(2, 9), text: text.trim() }));
        
        pollPayload = {
          type: 'poll',
          pollOptions: options,
          pollVotes: options.reduce((acc, opt) => ({ ...acc, [opt.id]: 0 }), {}),
          pollVoters: {},
          pollTotalVotes: 0
        };
      } else {
        pollPayload = { type: mediaItems.length > 0 ? 'media' : 'text' };
      }

      const postRef = await addDoc(collection(db, 'posts'), {
        authorId: userData.id,
        authorName: userData.displayName,
        authorAvatar: userData.avatarUrl,
        authorCosmetics: {
          border: userData.cosmetics?.activeBorder || null,
          filter: userData.cosmetics?.activeFilter || null
        },
        content: content.trim(), 
        contentLengthTier: content.length > 280 ? 'deep' : 'standard',
        media: mediaItems,
        likes: 0,
        comments: 0,
        shares: 0,
        createdAt: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        timestamp: serverTimestamp(),
        likedBy: [],
        ...pollPayload
      });

      const mentionsToNotify = mentionedUserCache.filter(u => content.includes(`@${u.username}`));
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
                text: `mentioned you in a signal.`,
                isRead: false,
                timestamp: serverTimestamp(),
                pulseFrequency: 'cognition'
            });
        }
      }

      setContent('');
      editorRef.current?.clear();
      setSelectedFiles([]);
      setMediaPreviews([]);
      setSelectedGif(null);
      setIsPollMode(false);
      setPollOptions(['', '']);
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

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.8rem] p-6 md:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.04)] hover:shadow-[0_35px_80px_-12px_rgba(0,0,0,0.1)] transition-all duration-500 group relative z-40 ${isExpanded ? 'ring-2 ring-indigo-500/10' : ''}`}>
      <div className="flex gap-5 relative">
        <div className="relative shrink-0">
          <div className={`w-12 h-12 md:w-14 md:h-14 rounded-[1.4rem] ${borderClass}`}>
            <img 
              src={userData?.avatarUrl} 
              className="w-full h-full rounded-[1.4rem] object-cover shadow-sm ring-4 ring-slate-50 dark:ring-slate-800/60 bg-white dark:bg-slate-800" 
              alt="My Node" 
            />
          </div>
          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm" />
        </div>
        <div className="flex-1 pt-1.5 relative">
          <RichTextEditor 
            ref={editorRef}
            content={content}
            onChange={handleEditorChange}
            onFocus={handleFocus}
            placeholder={isPollMode ? "Formulate the consensus..." : `Broadcast a new signal, ${userData?.displayName.split(' ')[0]}...`}
            className="text-slate-800 dark:text-slate-200"
            minHeight="48px"
          />
          {showMentionList && (
            <div className="absolute top-full left-0 z-50 w-64 bg-white/95 dark:bg-slate-800/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-700 rounded-[1.8rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] mt-3 overflow-hidden animate-in fade-in slide-in-from-top-3">
                <div className="px-4 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500 font-mono">
                      {isSearching ? 'SCANNING_NODES...' : 'IDENTITY_LOOKUP'}
                    </span>
                </div>
                {isSearching ? (
                   <div className="p-5 text-center"><div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
                ) : mentionResults.length > 0 ? (
                   <div className="p-1.5">
                     {mentionResults.map(user => (
                        <button key={user.id} onClick={() => selectMention(user)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-xl transition-colors text-left group">
                            <img src={user.avatarUrl} className="w-8 h-8 rounded-lg object-cover border border-slate-100 dark:border-slate-800" alt="" />
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-black text-slate-900 dark:text-white truncate">@{user.username}</span>
                                    {user.verifiedHuman && <span className="text-indigo-500 text-[10px]"><ICONS.Verified /></span>}
                                </div>
                                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate">{user.displayName}</span>
                            </div>
                        </button>
                      ))}
                   </div>
                ) : (
                   <div className="px-4 py-5 text-[10px] text-slate-400 dark:text-slate-500 italic text-center font-medium">Sector empty.</div>
                )}
            </div>
          )}
        </div>
      </div>
      {isPollMode && (
        <div className="mt-8 mb-4 pl-[calc(3.5rem+1.25rem)] pr-2 animate-in slide-in-from-top-4 duration-500">
           <div className="space-y-3">
              {pollOptions.map((opt, idx) => (
                <div key={idx} className="flex gap-2.5">
                   <input 
                     type="text" 
                     value={opt}
                     onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                     placeholder={`Consensus Node ${idx + 1}`}
                     className="flex-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 dark:focus:border-indigo-600 outline-none transition-all placeholder:text-slate-400/80"
                   />
                   {pollOptions.length > 2 && (
                     <button onClick={() => removePollOption(idx)} className="p-4 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all active:scale-90">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                     </button>
                   )}
                </div>
              ))}
              {pollOptions.length < 4 && (
                <button 
                  onClick={addPollOption}
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 transition-colors flex items-center gap-2 mt-3 ml-2 group/add"
                >
                  <div className="w-5 h-5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center group-hover/add:scale-110 transition-transform">
                     <span className="text-lg leading-none">+</span>
                  </div>
                  Add_Consensus_Node
                </button>
              )}
           </div>
        </div>
      )}
      {(mediaPreviews.length > 0 || selectedGif) && (
        <div className="mt-8 mb-4 pl-[calc(3.5rem+1.25rem)]">
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {mediaPreviews.map((url, idx) => (
              <div key={idx} className="relative shrink-0 group/media">
                <img src={url} className="h-36 w-36 object-cover rounded-[1.8rem] border border-slate-200 dark:border-slate-700 shadow-lg" alt="Preview" />
                <button onClick={() => removeMedia(idx)} className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-2 shadow-xl hover:bg-rose-700 transition-all opacity-0 group-hover/media:opacity-100 scale-90" aria-label="Remove media">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3.5} d="M6 18L18 6M6 6l12 12" />
                </button>
              </div>
            ))}
            {selectedGif && (
              <div key="gif-preview" className="relative shrink-0 group/media">
                <img src={selectedGif.images.fixed_height.url} className="h-36 w-auto object-cover rounded-[1.8rem] border border-slate-200 dark:border-slate-700 shadow-lg" alt="GIF" />
                <button onClick={() => setSelectedGif(null)} className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-2 shadow-xl hover:bg-rose-700 transition-all opacity-0 group-hover/media:opacity-100 scale-90" aria-label="Remove GIF">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3.5} d="M6 18L18 6M6 6l12 12" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {isExpanded && (
        <div className="mt-6 pl-[calc(3.5rem+1.25rem)] flex flex-col gap-4 animate-in fade-in slide-in-from-top-3 duration-500">
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6">
            <div className="flex items-center gap-2">
                <button onClick={() => fileInputRef.current?.click()} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 transition-all active:scale-90 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 shadow-sm" title="Uplink Artifact">
                <ICONS.Create />
                </button>
                <button onClick={() => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false); }} className={`p-3.5 rounded-2xl transition-all active:scale-90 border ${showGifPicker ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 border-transparent shadow-sm'}`} title="GIF Library">
                <span className="text-[10px] font-black font-mono">GIF</span>
                </button>
                <button onClick={togglePollMode} className={`p-3.5 rounded-2xl transition-all active:scale-90 border ${isPollMode ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 border-transparent shadow-sm'}`} title="Consensus Poll">
                <ICONS.Poll />
                </button>
                <button onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); }} className={`p-3.5 rounded-2xl transition-all active:scale-90 border ${showEmojiPicker ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-white dark:hover:bg-slate-700 border-transparent shadow-sm'}`} title="Neural Glyph">
                <span className="text-xl leading-none">😊</span>
                </button>
            </div>
            <div className="flex items-center gap-4">
                <button 
                    onClick={handlePost}
                    disabled={isPosting || ((!content || content === '<p></p>') && selectedFiles.length === 0 && !selectedGif && !isPollMode)}
                    className="px-10 py-4 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-[1.8rem] font-black text-[11px] uppercase tracking-[0.25em] shadow-[0_15px_40px_-10px_rgba(99,102,241,0.4)] hover:bg-indigo-600 dark:hover:bg-indigo-400 dark:hover:text-white transition-all active:scale-95 disabled:opacity-30 flex items-center gap-3 italic"
                >
                    {isPosting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>BROADCAST <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" /></>}
                </button>
            </div>
          </div>
        </div>
      )}
      {(showEmojiPicker || showGifPicker) && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-sm" onClick={() => { setShowEmojiPicker(false); setShowGifPicker(false); }} />
          <div className="relative animate-in zoom-in-95 duration-500">
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