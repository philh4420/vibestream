
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  orderBy, 
  limit, 
  updateDoc, 
  doc, 
  deleteDoc,
  writeBatch,
  where,
  getDocs
} = Firestore as any;
import { User, Message, Chat } from '../../types';
import { ICONS } from '../../constants';
import { EmojiPicker } from '../ui/EmojiPicker';
import { GiphyPicker } from '../ui/GiphyPicker';
import { DeleteConfirmationModal } from '../ui/DeleteConfirmationModal';
import { uploadToCloudinary } from '../../services/cloudinary';
import { GiphyGif } from '../../services/giphy';
import { extractUrls } from '../../lib/textUtils';
import { LinkPreview } from '../ui/LinkPreview';
import { RichTextEditor, RichTextEditorRef } from '../ui/RichTextEditor';
import { generateSmartReplies } from '../../services/aiAssistant';

interface DirectChatInterfaceProps {
  chatId: string;
  currentUser: User;
  allUsers: User[];
  onBack: () => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  chatData: Chat;
}

export const DirectChatInterface: React.FC<DirectChatInterfaceProps> = ({ chatId, currentUser, allUsers, onBack, addToast, chatData }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isGiphyPickerOpen, setIsGiphyPickerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedGif, setSelectedGif] = useState<GiphyGif | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  
  const [terminationTarget, setTerminationTarget] = useState<{ id: string, label: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<RichTextEditorRef>(null);

  // Read Receipts Logic
  useEffect(() => {
    if (!db || !chatId || !currentUser.id) return;
    if (currentUser.settings?.privacy?.readReceipts === false) return;

    const markRead = async () => {
        try {
            const q = query(
                collection(db, 'chats', chatId, 'messages'),
                where('isRead', '==', false),
                where('senderId', '!=', currentUser.id)
            );
            const snap = await getDocs(q);
            if (!snap.empty) {
                const batch = writeBatch(db);
                snap.docs.forEach((d: any) => batch.update(d.ref, { isRead: true }));
                await batch.commit();
            }
        } catch (e) { console.error("Read sync failed", e); }
    };
    markRead();
  }, [chatId, messages.length, currentUser.id, currentUser.settings?.privacy?.readReceipts]);

  // Sync Messages & AI Smart Replies
  useEffect(() => {
    if (!db || !chatId) return;
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp', 'asc'), limit(50));
    const unsub = onSnapshot(q, async (snap: any) => {
      const fetched = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Message));
      setMessages(fetched);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 300);

      // Trigger Smart Replies if last message is from peer
      if (fetched.length > 0) {
        const lastMsg = fetched[fetched.length - 1];
        if (lastMsg.senderId !== currentUser.id) {
            setIsAiThinking(true);
            const replies = await generateSmartReplies(fetched);
            setSmartReplies(replies);
            setIsAiThinking(false);
        } else {
            setSmartReplies([]);
        }
      }
    });
    return () => unsub();
  }, [chatId, currentUser.id]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        addToast("Artifact exceeds bandwidth (Max 25MB)", "error");
        return;
      }
      setSelectedFile(file);
      setSelectedGif(null);
      setMediaPreview(URL.createObjectURL(file));
      setIsGiphyPickerOpen(false);
      setIsEmojiPickerOpen(false);
    }
  };

  const handleGifSelect = (gif: GiphyGif) => {
    setSelectedGif(gif);
    setSelectedFile(null);
    setMediaPreview(gif.images.fixed_height.url);
    setIsGiphyPickerOpen(false);
  };

  const clearMedia = () => {
    if (mediaPreview && selectedFile) URL.revokeObjectURL(mediaPreview);
    setSelectedFile(null);
    setSelectedGif(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const insertEmoji = (emoji: string) => {
    editorRef.current?.insertContent(emoji);
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText !== undefined ? customText : newMessage;
    if ((!textToSend.trim() && !selectedFile && !selectedGif) || !chatId || isSending) return;
    
    setIsSending(true);
    let mediaItems: { type: 'image' | 'video', url: string }[] = [];

    try {
      if (selectedFile) {
        const url = await uploadToCloudinary(selectedFile);
        mediaItems.push({ type: selectedFile.type.startsWith('video/') ? 'video' : 'image', url });
      } else if (selectedGif) {
        mediaItems.push({ type: 'image', url: selectedGif.images.original.url });
      }

      const msgText = textToSend.trim();
      const payload: any = {
        senderId: currentUser.id,
        text: msgText,
        timestamp: serverTimestamp(),
        isRead: false
      };

      if (mediaItems.length > 0) payload.media = mediaItems;

      await addDoc(collection(db, 'chats', chatId, 'messages'), payload);
      
      const lastMsgText = mediaItems.length > 0 ? (msgText ? `📎 ${msgText}` : '📎 Attached Artifact') : msgText;
      await updateDoc(doc(db, 'chats', chatId), { lastMessage: lastMsgText, lastMessageTimestamp: serverTimestamp() });

      const recipientId = chatData.participants.find(pId => pId !== currentUser.id);
      if (recipientId) {
          const notificationText = msgText ? `transmitted: "${msgText.substring(0, 30)}..."` : "transmitted visual artifact";
          addDoc(collection(db, 'notifications'), {
              type: 'message',
              fromUserId: currentUser.id,
              fromUserName: currentUser.displayName,
              fromUserAvatar: currentUser.avatarUrl,
              toUserId: recipientId,
              targetId: chatId,
              text: notificationText,
              isRead: false,
              timestamp: serverTimestamp(),
              pulseFrequency: 'velocity'
          });
      }

      setNewMessage('');
      editorRef.current?.clear();
      clearMedia();
      setSmartReplies([]);
    } catch (e) { addToast("Uplink Interrupted", "error"); } finally { setIsSending(false); }
  };

  const handleExecuteTermination = async () => {
    if (!terminationTarget || !db) return;
    try {
      await deleteDoc(doc(db, 'chats', terminationTarget.id));
      addToast("Channel Closed", "success");
      setTerminationTarget(null);
      onBack();
    } catch (e) { addToast("Termination Protocol Failed", "error"); }
  };

  const otherParticipantId = chatData.participants.find(id => id !== currentUser.id);
  const otherParticipant = chatData.participantData?.[otherParticipantId || ''];
  const targetUserFull = allUsers.find(u => u.id === otherParticipantId);
  const showActivity = targetUserFull?.settings?.privacy?.activityStatus !== false;
  const borderClass = targetUserFull?.cosmetics?.activeBorder ? `cosmetic-border-${targetUserFull.cosmetics.activeBorder}` : '';

  const PRESENCE_AURA: Record<string, string> = {
    'Online': 'bg-emerald-500 shadow-[0_0_12px_#10b981]',
    'Focus': 'bg-amber-500 shadow-[0_0_12px_#f59e0b]',
    'Deep Work': 'bg-rose-500 shadow-[0_0_12px_#e11d48]',
    'Syncing': 'bg-blue-400 animate-pulse'
  };

  const getMessagePosition = (idx: number) => {
    const prev = messages[idx - 1];
    const next = messages[idx + 1];
    const isMe = messages[idx].senderId === currentUser.id;

    const top = !prev || prev.senderId !== messages[idx].senderId;
    const bottom = !next || next.senderId !== messages[idx].senderId;

    if (top && bottom) return 'single';
    if (top) return 'top';
    if (bottom) return 'bottom';
    return 'middle';
  };

  return (
    <div className="flex flex-col h-full relative animate-in fade-in duration-500 bg-[#fcfcfd] dark:bg-[#020617]">
      
      {/* HEADER: COMMAND STRIP */}
      <div className="relative z-20 px-8 py-5 border-b border-slate-100 dark:border-slate-800/60 bg-white/80 dark:bg-slate-950/80 backdrop-blur-3xl flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="md:hidden w-11 h-11 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl flex items-center justify-center transition-all active:scale-90">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3.5}><path d="M15 19l-7-7 7-7" /></svg>
          </button>
          
          <div className="flex items-center gap-4">
            <div 
              onClick={() => window.dispatchEvent(new CustomEvent('vibe-navigate', { detail: { route: 'profile', userId: otherParticipantId } }))}
              className={`relative shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-[1.4rem] cursor-pointer group/av transition-transform hover:scale-105 ${borderClass}`}
            >
              <img src={otherParticipant?.avatarUrl} className="w-full h-full rounded-[1.4rem] object-cover border-2 border-white dark:border-slate-800 shadow-premium" alt="" />
              {showActivity && targetUserFull?.presenceStatus && (
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-[3px] border-white dark:border-slate-900 ${PRESENCE_AURA[targetUserFull.presenceStatus] || 'bg-slate-300'}`} />
              )}
            </div>
            <div>
              <h3 className="font-black text-lg md:text-xl text-slate-900 dark:text-white uppercase tracking-tight italic leading-none">{otherParticipant?.displayName}</h3>
              <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[8px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest font-mono">
                    {showActivity ? (targetUserFull?.presenceStatus || 'Offline') : 'Encrypted'}
                  </span>
                  <div className="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono">NODE_{otherParticipantId?.slice(0, 6)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="hidden lg:flex flex-col items-end mr-4 opacity-40">
              <span className="text-[7px] font-black uppercase tracking-widest font-mono">SYNC_LATENCY: 12ms</span>
              <span className="text-[7px] font-black uppercase tracking-widest font-mono">ENCRYPTION: AES-256</span>
           </div>
           <button onClick={() => setTerminationTarget({ id: chatId, label: otherParticipant?.displayName || 'Link' })} className="w-12 h-12 bg-slate-50 dark:bg-slate-800/60 text-slate-300 hover:text-rose-500 rounded-2xl flex items-center justify-center transition-all active:scale-90 border border-slate-100 dark:border-slate-700 shadow-sm">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
           </button>
        </div>
      </div>

      {/* STREAM AREA */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-10 py-10 space-y-1 relative">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-10 text-center select-none pointer-events-none pb-20">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-[3.5rem] flex items-center justify-center mb-8 text-slate-400 scale-125 shadow-inner"><ICONS.Messages /></div>
            <h3 className="text-2xl font-black uppercase tracking-[0.3em] italic">Protocol_Initialized</h3>
            <p className="text-[10px] font-mono mt-4 uppercase tracking-[0.5em]">Establishing secure signal flow...</p>
          </div>
        )}
        
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === currentUser.id;
          const pos = getMessagePosition(idx);
          const nextMsg = messages[idx + 1];
          const showAvatar = pos === 'bottom' || pos === 'single';
          
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group/msg animate-in fade-in slide-in-from-bottom-1 duration-300 ${pos === 'top' || pos === 'single' ? 'mt-6' : 'mt-0.5'}`}>
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[70%]`}>
                <div 
                  className={`
                    p-4 md:p-5 text-sm md:text-[15px] font-bold shadow-sm relative transition-all duration-300
                    ${isMe 
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-indigo-950/10' 
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700'
                    }
                    ${pos === 'top' ? (isMe ? 'rounded-[2rem] rounded-br-md' : 'rounded-[2rem] rounded-bl-md') : ''}
                    ${pos === 'middle' ? (isMe ? 'rounded-r-md rounded-l-[2rem]' : 'rounded-l-md rounded-r-[2rem]') : ''}
                    ${pos === 'bottom' ? (isMe ? 'rounded-l-[2rem] rounded-tr-md rounded-br-[2rem]' : 'rounded-r-[2rem] rounded-tl-md rounded-bl-[2rem]') : ''}
                    ${pos === 'single' ? 'rounded-[2rem]' : ''}
                  `}
                >
                  {msg.media && msg.media.map((item, mIdx) => (
                    <div key={mIdx} className="mb-4 rounded-[1.8rem] overflow-hidden shadow-lg bg-slate-950 border border-white/10">
                      {item.type === 'video' ? <video src={item.url} controls className="w-full h-auto max-h-[300px] object-cover" /> : <img src={item.url} alt="" className="w-full h-auto max-h-[400px] object-cover" />}
                    </div>
                  ))}
                  
                  <div className="leading-[1.5] ProseMirror" dangerouslySetInnerHTML={{ __html: msg.text }} />
                  
                  {extractUrls(msg.text)[0] && (
                    <div className="mt-4"><LinkPreview url={extractUrls(msg.text)[0]} compact={true} /></div>
                  )}

                  {/* Micro timestamp reveal on hover */}
                  <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/msg:opacity-40 transition-opacity whitespace-nowrap text-[7px] font-black font-mono tracking-widest ${isMe ? '-left-16 text-slate-400' : '-right-16 text-slate-400'}`}>
                    {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : 'SYNC'}
                  </div>
                </div>

                {pos === 'bottom' || pos === 'single' ? (
                    <div className={`mt-2 flex items-center gap-2 ${isMe ? 'justify-end opacity-40' : 'justify-start opacity-30'}`}>
                        {isMe && msg.isRead && <span className="text-emerald-500 dark:text-emerald-400 text-[7px] font-black uppercase tracking-widest">SYNCED</span>}
                        <span className="text-[7px] font-black uppercase tracking-widest font-mono">
                            {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : 'PENDING'}
                        </span>
                    </div>
                ) : null}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} className="h-10" />
      </div>

      {/* INPUT COCKPIT */}
      <div className="px-6 md:px-10 pb-8 pt-4 relative z-30 space-y-5 bg-gradient-to-t from-white dark:from-[#020617] via-white/50 dark:via-[#020617]/50 to-transparent">
        
        {/* AI SIGNAL INTELLIGENCE (Smart Replies) */}
        {(smartReplies.length > 0 || isAiThinking) && (
            <div className="max-w-4xl mx-auto flex flex-wrap gap-2 animate-in slide-in-from-bottom-2 duration-500">
                <div className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center gap-2 border border-indigo-100 dark:border-indigo-800">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                    <span className="text-[8px] font-black uppercase tracking-widest font-mono text-indigo-600 dark:text-indigo-400 italic">Signal_AI:</span>
                </div>
                {isAiThinking ? (
                    <div className="flex gap-1 items-center px-4">
                        <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" />
                    </div>
                ) : (
                    smartReplies.map((reply, i) => (
                        <button 
                            key={i} 
                            onClick={() => handleSendMessage(reply)}
                            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 transition-all shadow-sm active:scale-95 whitespace-nowrap"
                        >
                            {reply}
                        </button>
                    ))
                )}
            </div>
        )}

        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] p-2.5 shadow-premium focus-within:ring-8 focus-within:ring-indigo-500/5 transition-all duration-500">
          {mediaPreview && (
            <div className="px-4 py-4 flex items-center gap-4 animate-in slide-in-from-bottom-2 bg-slate-50 dark:bg-slate-800/80 rounded-[2.2rem] mb-2 border border-slate-100 dark:border-slate-700 backdrop-blur-md">
              <div className="relative">
                {selectedFile?.type.startsWith('video/') ? (
                  <video src={mediaPreview} className="h-20 w-20 object-cover rounded-2xl border border-white dark:border-slate-700 shadow-lg" />
                ) : (
                  <img src={mediaPreview} className="h-20 w-20 object-cover rounded-2xl border border-white dark:border-slate-700 shadow-lg" alt="" />
                )}
                <button onClick={clearMedia} className="absolute -top-3 -right-3 bg-rose-600 text-white rounded-full p-2.5 shadow-xl hover:bg-rose-700 active:scale-90 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500 font-mono italic">Fragment_Buffer</p>
                <p className="text-xs font-bold text-slate-700 dark:text-white truncate max-w-[200px] mt-1">{selectedFile?.name || 'GIF_PACKET'}</p>
              </div>
            </div>
          )}

          <div className="flex gap-2 items-end">
            <div className="flex gap-1.5 pb-1 pl-1">
              <button onClick={() => fileInputRef.current?.click()} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90 border ${selectedFile ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'}`}>
                <ICONS.Create />
              </button>
              <button onClick={() => { setIsEmojiPickerOpen(!isEmojiPickerOpen); setIsGiphyPickerOpen(false); }} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90 border ${isEmojiPickerOpen ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}>
                <span className="text-2xl leading-none">😊</span>
              </button>
              <button onClick={() => { setIsGiphyPickerOpen(!isGiphyPickerOpen); setIsEmojiPickerOpen(false); }} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90 border ${isGiphyPickerOpen ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}>
                <span className="text-[9px] font-black font-mono">GIF</span>
              </button>
            </div>

            <div className="flex-1 relative pb-1">
                <RichTextEditor 
                    ref={editorRef}
                    content={newMessage} 
                    onChange={setNewMessage}
                    onSubmit={() => handleSendMessage()}
                    placeholder="Broadcast sequence..."
                    className="w-full bg-slate-50 dark:bg-slate-800/60 rounded-[2.2rem] px-2 py-1 shadow-inner border border-transparent focus-within:border-indigo-500/20"
                    minHeight="52px"
                />
            </div>
            
            <button 
              onClick={() => handleSendMessage()}
              disabled={(!newMessage.trim() && !selectedFile && !selectedGif) || isSending} 
              className="w-16 h-16 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-20 shadow-xl hover:shadow-indigo-500/20 group shrink-0 mb-1"
            >
              {isSending ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white dark:border-slate-300 dark:border-t-slate-950 rounded-full animate-spin" />
              ) : (
                <svg className="w-8 h-8 rotate-90 ml-1 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3.5}><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*,.heic,.heif,.avif,.webp" onChange={handleFileSelect} />
      
      {(isEmojiPickerOpen || isGiphyPickerOpen) && createPortal(
        <>
          <div className="fixed inset-0 z-[9990] bg-transparent" onClick={() => { setIsEmojiPickerOpen(false); setIsGiphyPickerOpen(false); }} />
          <div className="fixed bottom-32 left-12 z-[9999] animate-in slide-in-from-bottom-8 zoom-in-95 duration-300 origin-bottom-left">
             {isEmojiPickerOpen && <EmojiPicker onSelect={insertEmoji} onClose={() => setIsEmojiPickerOpen(false)} />}
             {isGiphyPickerOpen && <GiphyPicker onSelect={handleGifSelect} onClose={() => setIsGiphyPickerOpen(false)} />}
          </div>
        </>,
        document.body
      )}

      <DeleteConfirmationModal isOpen={!!terminationTarget} title="TERMINATE_LINK" description={`Sever active handshake with ${terminationTarget?.label}?`} onConfirm={handleExecuteTermination} onCancel={() => setTerminationTarget(null)} />
    </div>
  );
};
