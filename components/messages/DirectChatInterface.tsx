
import React, { useState, useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (!db || !chatId) return;
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp', 'asc'), limit(100));
    const unsub = onSnapshot(q, (snap: any) => {
      setMessages(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Message)));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
    });
    return () => unsub();
  }, [chatId]);

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

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile && !selectedGif) || !chatId || isSending) return;
    
    setIsSending(true);
    let mediaItems: { type: 'image' | 'video', url: string }[] = [];

    try {
      if (selectedFile) {
        const url = await uploadToCloudinary(selectedFile);
        mediaItems.push({ type: selectedFile.type.startsWith('video/') ? 'video' : 'image', url });
      } else if (selectedGif) {
        mediaItems.push({ type: 'image', url: selectedGif.images.original.url });
      }

      const msgText = newMessage.trim();
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

      // Peer Notification
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

  return (
    <div className="flex flex-col h-full relative animate-in fade-in duration-500">
      
      {/* HEADER: PREMIUM GLASS */}
      <div className="relative z-20 px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="md:hidden w-11 h-11 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl flex items-center justify-center transition-all active:scale-90">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3.5}><path d="M15 19l-7-7 7-7" /></svg>
          </button>
          
          <div className="flex items-center gap-5">
            <div className={`relative shrink-0 w-14 h-14 rounded-[1.4rem] cursor-pointer group/av ${borderClass}`}>
              <img src={otherParticipant?.avatarUrl} className="w-full h-full rounded-[1.4rem] object-cover border-2 border-white dark:border-slate-800 shadow-md transition-transform group-hover/av:scale-105" alt="" />
              {showActivity && targetUserFull?.presenceStatus && (
                  <div className={`absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full border-[3px] border-white dark:border-slate-800 ${PRESENCE_AURA[targetUserFull.presenceStatus] || 'bg-slate-300'}`} />
              )}
            </div>
            <div>
              <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">{otherParticipant?.displayName}</h3>
              <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.3em] font-mono mt-1.5 flex items-center gap-2">
                {showActivity ? (targetUserFull?.presenceStatus || 'Offline') : 'Encrypted'}
                {targetUserFull?.verifiedHuman && <ICONS.Verified />}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <button onClick={() => setTerminationTarget({ id: chatId, label: otherParticipant?.displayName || 'Link' })} className="w-12 h-12 bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-300 hover:text-rose-500 rounded-[1.1rem] flex items-center justify-center transition-all active:scale-90 border border-slate-100 dark:border-slate-700 shadow-sm" title="Terminate Link">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
           </button>
        </div>
      </div>

      {/* STREAM AREA */}
      <div className="flex-1 overflow-y-auto no-scrollbar scroll-container px-6 md:px-16 py-12 space-y-12">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-20 text-center select-none pointer-events-none">
            <div className="w-24 h-24 bg-slate-200 dark:bg-slate-800 rounded-[3.5rem] flex items-center justify-center mb-8 text-slate-400 scale-125"><ICONS.Messages /></div>
            <h3 className="text-2xl font-black uppercase tracking-[0.3em] italic">Link_Active</h3>
            <p className="text-[10px] font-mono mt-4 uppercase tracking-[0.5em]">Establishing secure signal flow</p>
          </div>
        )}
        
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === currentUser.id;
          const showAvatar = idx === 0 || messages[idx-1]?.senderId !== msg.senderId;
          const extractedUrl = extractUrls(msg.text)[0];
          
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group/msg animate-in slide-in-from-bottom-2 duration-500`}>
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[70%]`}>
                
                {!isMe && showAvatar && (
                  <div className="flex items-center gap-3 mb-3 ml-1">
                      <div className="w-6 h-6 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800">
                          <img src={otherParticipant?.avatarUrl} className="w-full h-full object-cover" alt="" />
                      </div>
                      <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono italic">{otherParticipant?.displayName}</span>
                  </div>
                )}

                <div 
                  className={`
                    p-6 md:p-7 rounded-[2.5rem] text-sm md:text-base font-bold shadow-sm relative transition-all duration-300 group-hover/msg:shadow-2xl
                    ${isMe 
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-tr-none shadow-xl shadow-slate-950/10' 
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700 shadow-lg shadow-slate-200/50'
                    }
                  `}
                >
                  {msg.media && msg.media.map((item, mIdx) => (
                    <div key={mIdx} className="mb-4 rounded-[1.8rem] overflow-hidden shadow-heavy border border-white/10 bg-slate-950">
                      {item.type === 'video' ? <video src={item.url} controls className="w-full h-auto max-h-[350px] object-cover" /> : <img src={item.url} alt="Attachment" className="w-full h-auto max-h-[450px] object-cover" />}
                    </div>
                  ))}
                  
                  <div className="leading-relaxed ProseMirror" dangerouslySetInnerHTML={{ __html: msg.text }} />
                  
                  {extractedUrl && <div className="mt-5"><LinkPreview url={extractedUrl} compact={true} /></div>}
                  
                  <div className={`text-[8px] font-black uppercase mt-4 font-mono tracking-widest flex items-center gap-2 ${isMe ? 'justify-end text-white/40 dark:text-slate-400' : 'justify-start text-slate-400 dark:text-slate-500'}`}>
                    {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : 'HANDSHAKE...'}
                    {isMe && msg.isRead && <span className="text-emerald-400">TRANSMITTED</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* INTERACTION DECK */}
      <div className="px-6 md:px-12 pb-10 pt-4 relative z-30">
        <div className="max-w-4xl mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-[3.2rem] p-3 shadow-heavy border border-slate-200/60 dark:border-slate-800 group/input ring-[12px] ring-black/5 dark:ring-white/5 focus-within:ring-indigo-500/10 transition-all duration-500">
          
          {mediaPreview && (
            <div className="px-5 py-4 flex items-center gap-5 animate-in slide-in-from-bottom-2 bg-slate-50/80 dark:bg-slate-800/80 rounded-[2.2rem] mb-3 border border-slate-100 dark:border-slate-700 shadow-inner backdrop-blur-md">
              <div className="relative group/preview">
                {selectedFile?.type.startsWith('video/') ? (
                  <video src={mediaPreview} className="h-24 w-24 object-cover rounded-[1.4rem] border-2 border-white dark:border-slate-900 shadow-xl" />
                ) : (
                  <img src={mediaPreview} className="h-24 w-24 object-cover rounded-[1.4rem] border-2 border-white dark:border-slate-900 shadow-xl" alt="Preview" />
                )}
                <button onClick={clearMedia} className="absolute -top-3 -right-3 bg-rose-600 text-white rounded-full p-2.5 shadow-2xl hover:bg-rose-700 transition-all scale-90"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 font-mono">Signal_Artifact</p>
                <p className="text-xs font-bold text-slate-700 dark:text-white truncate mt-1.5">{selectedFile?.name || 'GIF_FRAGMENT'}</p>
              </div>
            </div>
          )}

          <div className="flex gap-4 items-end">
            <div className="flex gap-2 pb-2 pl-2">
              <button onClick={() => fileInputRef.current?.click()} className={`w-13 h-13 rounded-2xl flex items-center justify-center transition-all active:scale-90 border shadow-sm ${selectedFile ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'}`} title="Attach Visual">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z" /></svg>
              </button>
              <button onClick={() => { setIsEmojiPickerOpen(!isEmojiPickerOpen); setIsGiphyPickerOpen(false); }} className={`w-13 h-13 rounded-2xl flex items-center justify-center transition-all active:scale-90 border shadow-sm ${isEmojiPickerOpen ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`} title="Neural Glyph">
                <span className="text-2xl leading-none">😊</span>
              </button>
            </div>

            <div className="flex-1 relative pb-2">
                <RichTextEditor 
                    ref={editorRef}
                    content={newMessage} 
                    onChange={setNewMessage}
                    onSubmit={handleSendMessage}
                    placeholder="Establish broadcast sequence..."
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-transparent rounded-[2.5rem] px-2 py-1.5 shadow-inner"
                    minHeight="54px"
                />
            </div>
            
            <button 
              onClick={handleSendMessage}
              disabled={(!newMessage.trim() && !selectedFile && !selectedGif) || isSending} 
              className="w-18 h-18 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-30 shadow-2xl hover:bg-indigo-600 dark:hover:bg-indigo-400 dark:hover:text-white group shrink-0 mb-1"
            >
              {isSending ? (
                <div className="w-6 h-6 border-3 border-white/20 border-t-white dark:border-slate-300 dark:border-t-slate-950 rounded-full animate-spin" />
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
          <div className="fixed inset-0 z-[9990] bg-slate-950/20 backdrop-blur-sm" onClick={() => { setIsEmojiPickerOpen(false); setIsGiphyPickerOpen(false); }} />
          <div className="fixed bottom-36 left-12 md:left-1/2 md:-translate-x-1/2 z-[9999] animate-in slide-in-from-bottom-8 zoom-in-95 duration-500 origin-bottom">
             {isEmojiPickerOpen && <EmojiPicker onSelect={insertEmoji} onClose={() => setIsEmojiPickerOpen(false)} />}
             {isGiphyPickerOpen && <GiphyPicker onSelect={handleGifSelect} onClose={() => setIsGiphyPickerOpen(false)} />}
          </div>
        </>,
        document.body
      )}

      <DeleteConfirmationModal isOpen={!!terminationTarget} title="TERMINATION_PROTOCOL" description={`Destroy neural link with ${terminationTarget?.label}? This action is irreversible.`} onConfirm={handleExecuteTermination} onCancel={() => setTerminationTarget(null)} confirmText="TERMINATE_LINK" />
    </div>
  );
};
