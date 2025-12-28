
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
  
  // Media & Picker State
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
                snap.docs.forEach((d: any) => {
                    batch.update(d.ref, { isRead: true });
                });
                await batch.commit();
            }
        } catch (e) {
            console.error("Read receipt error", e);
        }
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
    editorRef.current?.insertContent(emoji);
  };

  const handleCall = (type: 'voice' | 'video') => {
    addToast("Feature coming soon", "info");
  };

  const handleSendMessage = async () => {
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
      const recipientId = chatData.participants.find(pId => pId !== currentUser.id);
      if (recipientId) {
        const notificationText = msgText 
          ? `transmitted: "${msgText.substring(0, 30)}${msgText.length > 30 ? '...' : ''}"`
          : (mediaItems.length > 0 ? "transmitted visual artifact" : "sent a signal");

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
    } catch (e) { 
      addToast("Transmission Interrupted", "error"); 
    } finally { 
      setIsSending(false); 
    }
  };

  const handleExecuteTermination = async () => {
    if (!terminationTarget || !db) return;
    try {
      await deleteDoc(doc(db, 'chats', terminationTarget.id));
      addToast("Link Terminated Successfully", "success");
      setTerminationTarget(null);
      onBack();
    } catch (e) {
      addToast("Termination Protocol Failed", "error");
    }
  };

  const otherParticipantId = chatData.participants.find(id => id !== currentUser.id);
  const otherParticipant = chatData.participantData?.[otherParticipantId || ''];
  const targetUserFull = allUsers.find(u => u.id === otherParticipantId);
  const showActivity = targetUserFull?.settings?.privacy?.activityStatus !== false;
  
  const PRESENCE_AURA: Record<string, string> = {
    'Online': 'bg-emerald-500 shadow-[0_0_10px_#10b981]',
    'Focus': 'bg-amber-500 shadow-[0_0_10px_#f59e0b]',
    'Deep Work': 'bg-rose-500 shadow-[0_0_10px_#e11d48]',
    'Away': 'bg-slate-400',
    'Syncing': 'bg-blue-400 animate-pulse'
  };

  return (
    <div className="flex flex-col h-full relative animate-in fade-in duration-300">
      <div className="absolute top-4 left-4 right-4 z-20">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/50 dark:border-slate-700 rounded-[2rem] p-3 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="w-10 h-10 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-2xl flex items-center justify-center transition-all active:scale-90 border border-slate-100 dark:border-slate-700 shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3.5}><path d="M15 19l-7-7 7-7" /></svg>
            </button>
            
            <div className="flex items-center gap-4">
              <div className="relative group cursor-pointer">
                <img src={otherParticipant?.avatarUrl} className="w-10 h-10 md:w-11 md:h-11 rounded-[1.2rem] object-cover border-2 border-white dark:border-slate-800 shadow-sm" alt="" />
                {showActivity && targetUserFull?.presenceStatus && (
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-[2.5px] border-white dark:border-slate-800 ${PRESENCE_AURA[targetUserFull.presenceStatus] || 'bg-slate-300'}`} />
                )}
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900 dark:text-white uppercase tracking-tight italic leading-none">{otherParticipant?.displayName}</h3>
                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono mt-0.5">
                    {showActivity ? (targetUserFull?.presenceStatus || 'Offline') : 'Offline'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pr-1">
             <button onClick={() => handleCall('voice')} className="w-10 h-10 bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 rounded-2xl flex items-center justify-center transition-all cursor-not-allowed opacity-60">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
             </button>
             <button onClick={() => handleCall('video')} className="w-10 h-10 bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 rounded-2xl flex items-center justify-center transition-all cursor-not-allowed opacity-60">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M15.75 10.5l4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25z" /></svg>
             </button>
             <button onClick={() => setTerminationTarget({ id: chatId, label: otherParticipant?.displayName || 'Link' })} className="w-10 h-10 bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 rounded-2xl flex items-center justify-center transition-all active:scale-90">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
             </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar scroll-container px-4 md:px-8 pt-28 pb-32 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-30 text-center">
            <div className="w-20 h-20 bg-indigo-900/10 dark:bg-indigo-500/10 rounded-[2.5rem] flex items-center justify-center mb-6 text-indigo-900 dark:text-indigo-400 scale-110"><ICONS.Messages /></div>
            <h3 className="text-xl font-black uppercase tracking-widest italic text-slate-900 dark:text-white">Link_Established</h3>
            <p className="text-[10px] font-mono mt-2 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Encrypted frequency ready for transmission.</p>
          </div>
        )}
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === currentUser.id;
          const showAvatar = idx === 0 || messages[idx-1]?.senderId !== msg.senderId;
          const extractedUrl = extractUrls(msg.text)[0];
          
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group/msg animate-in slide-in-from-bottom-2 duration-300`}>
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[70%]`}>
                
                {!isMe && showAvatar && (
                  <div className="flex items-center gap-2 mb-2 ml-1">
                      <img src={otherParticipant?.avatarUrl} className="w-6 h-6 rounded-lg object-cover border border-slate-100 dark:border-slate-700 shadow-sm" alt="" />
                      <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">{otherParticipant?.displayName}</span>
                  </div>
                )}

                <div 
                  className={`
                    p-4 md:p-5 rounded-[2rem] text-sm font-medium shadow-sm relative transition-all duration-300
                    ${isMe 
                      ? 'bg-slate-900 dark:bg-slate-700 text-white rounded-tr-sm shadow-xl shadow-slate-900/10 dark:shadow-slate-900/30' 
                      : 'bg-white/90 dark:bg-slate-800/90 backdrop-blur-md text-slate-800 dark:text-slate-200 rounded-tl-sm border border-white/50 dark:border-slate-700 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/30'
                    }
                  `}
                >
                  {msg.media && msg.media.map((item, mIdx) => (
                    <div key={mIdx} className="mb-3 rounded-xl overflow-hidden shadow-md border border-white/10 dark:border-black/20">
                      {item.type === 'video' ? <video src={item.url} controls className="w-full h-auto max-h-[300px] object-cover" /> : <img src={item.url} alt="Attachment" className="w-full h-auto max-h-[400px] object-cover" />}
                    </div>
                  ))}

                  <div className="leading-relaxed font-bold" dangerouslySetInnerHTML={{ __html: msg.text }} />
                  
                  {extractedUrl && <div className="mt-3 max-w-[300px]"><LinkPreview url={extractedUrl} compact={true} /></div>}
                  
                  <div className={`text-[8px] font-black uppercase mt-2 font-mono tracking-widest opacity-40 flex items-center gap-1 ${isMe ? 'justify-end text-white' : 'justify-start text-slate-500 dark:text-slate-400'}`}>
                    {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'SENDING'}
                    {isMe && msg.isRead && <span className="text-emerald-400 ml-1">READ</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="absolute bottom-6 left-4 right-4 z-30">
        <div className="max-w-4xl mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[2.5rem] p-2 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)] border border-white/50 dark:border-slate-700 flex flex-col gap-2">
          
          {mediaPreview && (
            <div className="px-4 py-2 flex items-center gap-4 animate-in slide-in-from-bottom-2 bg-slate-50/90 dark:bg-slate-800/90 rounded-t-[2rem]">
              <div className="relative group">
                {selectedFile?.type.startsWith('video/') ? (
                  <video src={mediaPreview} className="h-16 w-16 object-cover rounded-xl border border-slate-200 dark:border-slate-700" />
                ) : (
                  <img src={mediaPreview} className="h-16 w-16 object-cover rounded-xl border border-slate-200 dark:border-slate-700" alt="Preview" />
                )}
                <button onClick={clearMedia} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md hover:bg-rose-600 transition-colors"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500 font-mono">Artifact Ready</p>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate max-w-[150px]">{selectedFile?.name || 'GIF Fragment'}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pl-2">
            <div className="flex gap-1">
              <button type="button" onClick={() => fileInputRef.current?.click()} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${selectedFile ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z" /></svg>
              </button>
              <button type="button" onClick={() => { setIsGiphyPickerOpen(!isGiphyPickerOpen); setIsEmojiPickerOpen(false); }} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${isGiphyPickerOpen ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                <span className="text-[9px] font-black font-mono">GIF</span>
              </button>
              <button type="button" onClick={() => { setIsEmojiPickerOpen(!isEmojiPickerOpen); setIsGiphyPickerOpen(false); }} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${isEmojiPickerOpen ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                <span className="text-xl leading-none">😊</span>
              </button>
            </div>

            <div className="flex-1">
                <RichTextEditor 
                    ref={editorRef}
                    content={newMessage} 
                    onChange={setNewMessage}
                    onSubmit={handleSendMessage}
                    placeholder="Inject message..."
                    className="w-full bg-transparent border-none px-2 py-4 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-0 outline-none"
                    minHeight="auto"
                />
            </div>
            
            <button 
              onClick={handleSendMessage}
              disabled={(!newMessage.trim() && !selectedFile && !selectedGif) || isSending} 
              className="w-14 h-14 bg-slate-950 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] flex items-center justify-center transition-all active:scale-90 disabled:opacity-20 hover:bg-black dark:hover:bg-slate-200 shadow-lg"
            >
              {isSending ? <div className="w-5 h-5 border-2 border-white/20 border-t-white dark:border-slate-900/20 dark:border-t-slate-900 rounded-full animate-spin" /> : <svg className="w-5 h-5 rotate-90 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
            </button>
          </div>
        </div>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*,.heic,.heif,.avif,.webp" onChange={handleFileSelect} />
      
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
