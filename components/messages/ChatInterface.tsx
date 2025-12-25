
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
  where,
  writeBatch,
  getDocs
} = Firestore as any;
import { User, Message, Chat } from '../../types';
import { ICONS } from '../../constants';
import { EmojiPicker } from '../ui/EmojiPicker';
import { GiphyPicker } from '../ui/GiphyPicker';
import { DeleteConfirmationModal } from '../ui/DeleteConfirmationModal';
import { uploadToCloudinary } from '../../services/cloudinary';
import { GiphyGif } from '../../services/giphy';

interface ChatInterfaceProps {
  chatId: string;
  currentUser: User;
  allUsers: User[];
  onBack: () => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  chatData?: Chat;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ chatId, currentUser, allUsers, onBack, addToast, chatData }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Media & Picker State
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isGiphyPickerOpen, setIsGiphyPickerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedGif, setSelectedGif] = useState<GiphyGif | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  
  const [terminationTarget, setTerminationTarget] = useState<{ type: 'chat', id: string, label: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      if (file.size > 20 * 1024 * 1024) {
        addToast("Artifact too large (Max 20MB)", "error");
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
    setNewMessage(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile && !selectedGif) || !chatId || isSending) return;
    
    setIsSending(true);
    let mediaItems: { type: 'image' | 'video', url: string }[] = [];

    try {
      if (selectedFile) {
        addToast("Uploading Artifact...", "info");
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

      const msgText = newMessage.trim();
      const payload: any = {
        senderId: currentUser.id,
        text: msgText,
        timestamp: serverTimestamp(),
        isRead: false
      };

      if (mediaItems.length > 0) {
        payload.media = mediaItems;
      }

      await addDoc(collection(db, 'chats', chatId, 'messages'), payload);
      
      const lastMsgText = mediaItems.length > 0 ? (msgText ? `📎 ${msgText}` : '📎 Attached Artifact') : msgText;
      await updateDoc(doc(db, 'chats', chatId), { 
        lastMessage: lastMsgText, 
        lastMessageTimestamp: serverTimestamp() 
      });

      // Notification Logic
      if (chatData) {
        const recipients = chatData.participants.filter(pId => pId !== currentUser.id);
        const notificationText = msgText 
          ? `transmitted: "${msgText.substring(0, 30)}${msgText.length > 30 ? '...' : ''}"`
          : (mediaItems.length > 0 ? "transmitted visual artifact" : "sent a signal");

        for (const recipientId of recipients) {
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
      }

      setNewMessage('');
      clearMedia();
    } catch (e) { 
      addToast("Transmission Interrupted", "error"); 
    } finally { 
      setIsSending(false); 
    }
  };

  const handleExecuteTermination = async () => {
    if (!terminationTarget || !db) return;
    const { id } = terminationTarget;
    try {
      await deleteDoc(doc(db, 'chats', id));
      addToast("Link Terminated Successfully", "success");
      setTerminationTarget(null);
      onBack();
    } catch (e) {
      addToast("Termination Protocol Failed", "error");
    }
  };

  // Determine Header Info
  const isCluster = chatData?.isCluster;
  const otherParticipantId = !isCluster ? chatData?.participants.find(id => id !== currentUser.id) : null;
  const otherParticipant = otherParticipantId ? chatData?.participantData?.[otherParticipantId] : null;
  const targetUserFull = otherParticipantId ? allUsers.find(u => u.id === otherParticipantId) : null;
  
  const headerTitle = isCluster ? chatData?.clusterName : otherParticipant?.displayName;
  const headerAvatar = isCluster ? chatData?.clusterAvatar : otherParticipant?.avatarUrl;
  const showActivity = targetUserFull?.settings?.privacy?.activityStatus !== false;

  const PRESENCE_AURA: Record<string, string> = {
    'Online': 'shadow-[0_0_15px_rgba(16,185,129,0.4)] bg-[#10b981]',
    'Focus': 'shadow-[0_0_15px_rgba(245,158,11,0.4)] bg-[#f59e0b]',
    'Deep Work': 'shadow-[0_0_15px_rgba(225,29,72,0.4)] bg-[#e11d48]',
    'Away': 'bg-[#94a3b8]',
    'Syncing': 'bg-[#60a5fa] animate-pulse'
  };

  return (
    <div className="flex flex-col h-full bg-[#fdfdfe] relative animate-in fade-in duration-300">
      {/* IMMERSIVE HEADER */}
      <div className="px-6 md:px-8 py-4 md:py-6 border-b flex items-center justify-between backdrop-blur-3xl sticky top-0 z-20 bg-white/70 border-slate-100/50">
        <div className="flex items-center gap-4 md:gap-5">
          <button onClick={onBack} className="p-2 md:p-3 text-slate-400 active:scale-90 transition-transform hover:bg-slate-100 rounded-xl"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3.5}><path d="M15 19l-7-7 7-7" /></svg></button>
          <div className="relative group">
            <img src={headerAvatar} className={`w-12 h-12 md:w-14 md:h-14 border shadow-sm transition-transform group-hover:scale-105 ${isCluster ? 'rounded-[1.4rem]' : 'rounded-2xl'}`} alt="" />
            {!isCluster && showActivity && targetUserFull?.presenceStatus === 'Online' && <div className="absolute inset-0 rounded-2xl border-2 border-emerald-500 animate-ping opacity-20" />}
          </div>
          <div>
            <h3 className="font-black text-xl md:text-2xl uppercase tracking-tighter italic leading-none text-slate-950">{headerTitle}</h3>
            <div className="flex items-center gap-2 mt-1 md:mt-2">
                {!isCluster ? (
                    <>
                        {showActivity && (
                            <div className={`w-1.5 h-1.5 rounded-full ${targetUserFull?.presenceStatus ? PRESENCE_AURA[targetUserFull.presenceStatus] : 'bg-slate-300'}`} />
                        )}
                        <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest font-mono text-slate-400">
                            {showActivity ? (targetUserFull?.presenceStatus || 'Offline') : 'Offline'}
                        </p>
                    </>
                ) : (
                    <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest font-mono text-indigo-500">{chatData?.participants.length} Active Nodes</p>
                )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
            {(!isCluster || chatData?.clusterAdmin === currentUser.id) && (
                <button onClick={() => setTerminationTarget({ type: 'chat', id: chatId, label: isCluster ? 'Cluster' : 'Link' })} className="p-3 md:p-4 bg-white/50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-90 border border-slate-100">
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            )}
        </div>
      </div>

      {/* MESSAGE STREAM AREA */}
      <div className="flex-1 overflow-y-auto no-scrollbar scroll-container p-6 md:p-8 space-y-6 md:space-y-8 relative">
        {messages.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-10 pointer-events-none p-12 text-center">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-900 rounded-[3rem] mb-6 flex items-center justify-center text-white scale-125"><ICONS.Messages /></div>
            <h3 className="text-lg md:text-xl font-black uppercase tracking-widest italic">Neural_Link_Established</h3>
            <p className="text-[8px] md:text-[9px] font-mono mt-2">AWAITING_PEER_BURST_SEQUENCE</p>
          </div>
        )}
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === currentUser.id;
          const showAvatar = idx === 0 || messages[idx-1]?.senderId !== msg.senderId;
          
          // DYNAMIC SENDER LOOKUP
          const senderDetails = chatData?.participantData?.[msg.senderId] || 
                                allUsers.find(u => u.id === msg.senderId) || 
                                { displayName: 'Unknown Node', avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.senderId}` };

          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group/msg animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[70%]`}>
                {!isMe && showAvatar && (
                  <div className="flex items-center gap-2 mb-2 ml-1">
                      <img src={senderDetails.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.senderId}`} className="w-5 h-5 rounded-lg object-cover border border-slate-100" alt="" />
                      <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono italic">{senderDetails.displayName}</span>
                  </div>
                )}
                <div className={`p-5 md:p-6 rounded-[2rem] md:rounded-[2.5rem] text-sm font-bold shadow-sm relative group-hover/msg:shadow-lg transition-all duration-300 ${isMe ? 'bg-[#0f172a] text-white rounded-tr-none shadow-indigo-950/10' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100 shadow-slate-200/50'}`}>
                  
                  {/* Media Rendering */}
                  {msg.media && msg.media.map((item, mIdx) => (
                    <div key={mIdx} className="mb-3 rounded-2xl overflow-hidden shadow-md">
                      {item.type === 'video' ? (
                        <video src={item.url} controls className="w-full h-auto max-h-[300px] object-cover" />
                      ) : (
                        <img src={item.url} alt="Attachment" className="w-full h-auto max-h-[400px] object-cover" />
                      )}
                    </div>
                  ))}

                  {msg.text}
                  <div className={`text-[7px] font-black uppercase mt-3 opacity-30 font-mono tracking-widest ${isMe ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'SYNCING...'}
                    {isMe && msg.isRead && <span className="text-emerald-400 ml-1">READ</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT SECTION */}
      <div className="p-4 md:p-8 border-t bg-white/80 backdrop-blur-md border-slate-100/50 relative z-30">
        
        {/* Media Preview Area */}
        {mediaPreview && (
          <div className="absolute bottom-full left-0 right-0 p-4 bg-slate-50/90 backdrop-blur-lg border-t border-slate-100 flex items-center gap-4 animate-in slide-in-from-bottom-2">
            <div className="relative group">
              {selectedFile?.type.startsWith('video/') ? (
                <video src={mediaPreview} className="h-20 w-20 object-cover rounded-xl border border-slate-200" />
              ) : (
                <img src={mediaPreview} className="h-20 w-20 object-cover rounded-xl border border-slate-200" alt="Preview" />
              )}
              <button 
                onClick={clearMedia}
                className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md hover:bg-rose-600 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono">Artifact Ready</p>
              <p className="text-xs font-bold text-slate-900 truncate max-w-[200px]">{selectedFile?.name || 'GIF Fragment'}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex gap-2 md:gap-4 max-w-5xl mx-auto items-end">
          {/* Media Tools */}
          <div className="flex gap-1.5 md:gap-2 pb-1.5 shrink-0">
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className={`p-2.5 md:p-3 rounded-2xl transition-all active:scale-90 border ${selectedFile ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-white hover:border-indigo-100 hover:text-indigo-500 shadow-sm'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z" /></svg>
            </button>
            <button 
              type="button"
              onClick={() => { setIsGiphyPickerOpen(!isGiphyPickerOpen); setIsEmojiPickerOpen(false); }}
              className={`p-2.5 md:p-3 rounded-2xl transition-all active:scale-90 border ${isGiphyPickerOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-white hover:border-indigo-100 hover:text-indigo-500 shadow-sm'}`}
            >
              <span className="text-[10px] font-black font-mono">GIF</span>
            </button>
            <button 
              type="button"
              onClick={() => { setIsEmojiPickerOpen(!isEmojiPickerOpen); setIsGiphyPickerOpen(false); }}
              className={`p-2.5 md:p-3 rounded-2xl transition-all active:scale-90 border ${isEmojiPickerOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-indigo-100 hover:text-indigo-500 shadow-sm'}`}
            >
              <span className="text-xl leading-none">😊</span>
            </button>
          </div>

          <div className="flex-1 relative">
            <input 
              ref={inputRef}
              type="text" 
              value={newMessage} 
              onChange={(e) => setNewMessage(e.target.value)} 
              placeholder={selectedFile ? "Add a caption..." : "Establish broadcast sequence..."} 
              className="w-full bg-slate-100/80 border border-slate-200 rounded-[2.2rem] pl-6 pr-6 py-4 md:py-5 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all outline-none italic placeholder:text-slate-400 shadow-inner" 
            />
          </div>
          
          <button 
            disabled={(!newMessage.trim() && !selectedFile && !selectedGif) || isSending} 
            className="h-[52px] md:h-[58px] px-6 md:px-8 bg-slate-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all active:scale-95 disabled:opacity-30 italic shadow-xl group flex items-center justify-center shrink-0"
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            )}
          </button>
        </form>
      </div>

      {/* Hidden Pickers & Inputs */}
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*,.heic,.heif,.avif,.webp" onChange={handleFileSelect} />
      
      {/* FIXED POSITION PICKERS */}
      {(isEmojiPickerOpen || isGiphyPickerOpen) && createPortal(
        <>
          <div className="fixed inset-0 z-[9990] bg-transparent" onClick={() => { setIsEmojiPickerOpen(false); setIsGiphyPickerOpen(false); }} />
          <div className="fixed bottom-24 left-4 z-[9999] animate-in slide-in-from-bottom-4 zoom-in-95 duration-300 origin-bottom-left">
             {isEmojiPickerOpen && <EmojiPicker onSelect={insertEmoji} onClose={() => setIsEmojiPickerOpen(false)} />}
             {isGiphyPickerOpen && <GiphyPicker onSelect={handleGifSelect} onClose={() => setIsGiphyPickerOpen(false)} />}
          </div>
        </>,
        document.body
      )}

      <DeleteConfirmationModal 
        isOpen={!!terminationTarget} 
        title="TERMINATION_PROTOCOL" 
        description={`Destroy active link with ${terminationTarget?.label}? This action cannot be reversed.`} 
        onConfirm={handleExecuteTermination} 
        onCancel={() => setTerminationTarget(null)} 
        confirmText="TERMINATE_LINK"
      />
    </div>
  );
};
