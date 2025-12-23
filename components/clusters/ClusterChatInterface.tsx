
import React, { useState, useEffect, useRef } from 'react';
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
  deleteDoc 
} = Firestore as any;
import { User, Message, Chat } from '../../types';
import { ICONS } from '../../constants';
import { EmojiPicker } from '../ui/EmojiPicker';
import { GiphyPicker } from '../ui/GiphyPicker';
import { DeleteConfirmationModal } from '../ui/DeleteConfirmationModal';
import { uploadToCloudinary } from '../../services/cloudinary';
import { GiphyGif } from '../../services/giphy';

interface ClusterChatInterfaceProps {
  chatId: string;
  currentUser: User;
  allUsers: User[];
  onBack: () => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  chatData: Chat;
}

export const ClusterChatInterface: React.FC<ClusterChatInterfaceProps> = ({ chatId, currentUser, allUsers, onBack, addToast, chatData }) => {
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
  const inputRef = useRef<HTMLInputElement>(null);

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

      // Cluster Notification Logic
      const recipients = chatData.participants.filter(pId => pId !== currentUser.id);
      const notificationText = msgText 
        ? `posted in ${chatData.clusterName}: "${msgText.substring(0, 30)}${msgText.length > 30 ? '...' : ''}"`
        : `posted media in ${chatData.clusterName}`;

      for (const recipientId of recipients) {
          addDoc(collection(db, 'notifications'), {
            type: 'cluster_invite', // Using existing type map or generic
            fromUserId: currentUser.id,
            fromUserName: currentUser.displayName,
            fromUserAvatar: currentUser.avatarUrl,
            toUserId: recipientId,
            targetId: chatId,
            text: notificationText,
            isRead: false,
            timestamp: serverTimestamp(),
            pulseFrequency: 'cognition'
          });
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
    try {
      await deleteDoc(doc(db, 'chats', terminationTarget.id));
      addToast("Cluster Dissolved", "success");
      setTerminationTarget(null);
      onBack();
    } catch (e) {
      addToast("Dissolution Failed", "error");
    }
  };

  return (
    <div className="flex flex-col h-full relative animate-in fade-in duration-300">
      
      {/* 1. CLUSTER HEADER */}
      <div className="absolute top-4 left-4 right-4 z-20">
        <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-[2rem] p-3 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="w-10 h-10 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl flex items-center justify-center transition-all active:scale-90 border border-slate-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M15 19l-7-7 7-7" /></svg>
            </button>
            
            <div className="flex items-center gap-4">
              <div className="relative group cursor-pointer">
                <img src={chatData.clusterAvatar} className="w-10 h-10 md:w-11 md:h-11 rounded-[1.2rem] object-cover border-2 border-indigo-100 shadow-sm" alt="" />
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-[2.5px] border-white bg-indigo-500 animate-pulse" />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-950 uppercase tracking-tight italic leading-none">{chatData.clusterName}</h3>
                <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest font-mono mt-0.5">{chatData.participants.length} Active Nodes</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pr-1">
             {chatData.clusterAdmin === currentUser.id && (
                <button onClick={() => setTerminationTarget({ id: chatId, label: chatData.clusterName || 'Cluster' })} className="w-10 h-10 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-2xl flex items-center justify-center transition-all active:scale-90">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
             )}
          </div>
        </div>
      </div>

      {/* 2. MESSAGE STREAM */}
      <div className="flex-1 overflow-y-auto no-scrollbar scroll-container px-4 md:px-8 pt-28 pb-32 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full opacity-30 text-center">
            <div className="w-20 h-20 bg-indigo-900/10 rounded-[2.5rem] flex items-center justify-center mb-6 text-indigo-900 scale-110"><ICONS.Clusters /></div>
            <h3 className="text-xl font-black uppercase tracking-widest italic text-slate-900">Cluster_Synched</h3>
            <p className="text-[10px] font-mono mt-2 font-bold text-slate-500 uppercase tracking-widest">Awaiting group broadcast packet.</p>
          </div>
        )}
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === currentUser.id;
          const showAvatar = idx === 0 || messages[idx-1]?.senderId !== msg.senderId;
          
          // Sender Info Logic
          const senderDetails = chatData.participantData?.[msg.senderId] || 
                                allUsers.find(u => u.id === msg.senderId) || 
                                { displayName: 'Unknown Node', avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.senderId}` };

          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group/msg animate-in slide-in-from-bottom-2 duration-300`}>
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[70%]`}>
                
                {!isMe && showAvatar && (
                  <div className="flex items-center gap-2 mb-2 ml-1">
                      <img src={senderDetails.avatarUrl} className="w-6 h-6 rounded-lg object-cover border border-slate-100 shadow-sm" alt="" />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono italic">{senderDetails.displayName}</span>
                  </div>
                )}

                <div 
                  className={`
                    p-4 md:p-5 rounded-[2rem] text-sm font-bold shadow-sm relative transition-all duration-300
                    ${isMe 
                      ? 'bg-indigo-600 text-white rounded-tr-sm shadow-xl shadow-indigo-900/10' 
                      : 'bg-white/90 backdrop-blur-md text-slate-800 rounded-tl-sm border border-white/50 shadow-lg shadow-slate-200/50'
                    }
                  `}
                >
                  {/* Media */}
                  {msg.media && msg.media.map((item, mIdx) => (
                    <div key={mIdx} className="mb-3 rounded-xl overflow-hidden shadow-md border border-white/10">
                      {item.type === 'video' ? (
                        <video src={item.url} controls className="w-full h-auto max-h-[300px] object-cover" />
                      ) : (
                        <img src={item.url} alt="Attachment" className="w-full h-auto max-h-[400px] object-cover" />
                      )}
                    </div>
                  ))}

                  <span className="leading-relaxed whitespace-pre-wrap">{msg.text}</span>
                  
                  <div className={`text-[8px] font-black uppercase mt-2 font-mono tracking-widest opacity-40 flex items-center gap-1 ${isMe ? 'justify-end text-white' : 'justify-start text-slate-500'}`}>
                    {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'SENDING'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. INPUT DECK */}
      <div className="absolute bottom-6 left-4 right-4 z-30">
        <div className="max-w-4xl mx-auto bg-white/90 backdrop-blur-2xl rounded-[2.5rem] p-2 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.15)] border border-white/50 flex flex-col gap-2">
          
          {/* Preview Area */}
          {mediaPreview && (
            <div className="px-4 py-2 flex items-center gap-4 animate-in slide-in-from-bottom-2">
              <div className="relative group">
                {selectedFile?.type.startsWith('video/') ? (
                  <video src={mediaPreview} className="h-16 w-16 object-cover rounded-xl border border-slate-200" />
                ) : (
                  <img src={mediaPreview} className="h-16 w-16 object-cover rounded-xl border border-slate-200" alt="Preview" />
                )}
                <button onClick={clearMedia} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md hover:bg-rose-600 transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 font-mono">Attachment_Ready</p>
                <p className="text-xs font-bold text-slate-600 truncate max-w-[150px]">{selectedFile?.name || 'GIF_FRAGMENT'}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex items-center gap-2 pl-2">
            
            {/* Tools */}
            <div className="flex gap-1">
              <button type="button" onClick={() => fileInputRef.current?.click()} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${selectedFile ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z" /></svg>
              </button>
              <button type="button" onClick={() => { setIsGiphyPickerOpen(!isGiphyPickerOpen); setIsEmojiPickerOpen(false); }} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${isGiphyPickerOpen ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}>
                <span className="text-[9px] font-black font-mono">GIF</span>
              </button>
              <button type="button" onClick={() => { setIsEmojiPickerOpen(!isEmojiPickerOpen); setIsGiphyPickerOpen(false); }} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${isEmojiPickerOpen ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" /></svg>
              </button>
            </div>

            {/* Input Field */}
            <input 
              ref={inputRef} 
              type="text" 
              value={newMessage} 
              onChange={(e) => setNewMessage(e.target.value)} 
              placeholder="Inject cluster data..." 
              className="flex-1 bg-transparent border-none px-2 py-4 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:ring-0 outline-none" 
            />
            
            {/* Send Button */}
            <button 
              disabled={(!newMessage.trim() && !selectedFile && !selectedGif) || isSending} 
              className="w-14 h-14 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center transition-all active:scale-90 disabled:opacity-20 hover:bg-indigo-700 shadow-lg"
            >
              {isSending ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5 rotate-90 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Hidden Pickers & Inputs */}
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*,.heic,.heif,.avif,.webp" onChange={handleFileSelect} />
      
      {/* Absolute Positioned Pickers */}
      {(isEmojiPickerOpen || isGiphyPickerOpen) && (
        <div className="absolute bottom-28 left-4 z-[100] animate-in slide-in-from-bottom-4 zoom-in-95 duration-300 origin-bottom-left">
           {isEmojiPickerOpen && <EmojiPicker onSelect={insertEmoji} onClose={() => setIsEmojiPickerOpen(false)} />}
           {isGiphyPickerOpen && <GiphyPicker onSelect={handleGifSelect} onClose={() => setIsGiphyPickerOpen(false)} />}
        </div>
      )}
      {(isEmojiPickerOpen || isGiphyPickerOpen) && (
        <div className="fixed inset-0 z-[90]" onClick={() => { setIsEmojiPickerOpen(false); setIsGiphyPickerOpen(false); }} />
      )}

      <DeleteConfirmationModal 
        isOpen={!!terminationTarget} 
        title="DISSOLVE_CLUSTER" 
        description={`Destroy the cluster "${terminationTarget?.label}"? This will terminate connections for all nodes.`} 
        onConfirm={handleExecuteTermination} 
        onCancel={() => setTerminationTarget(null)} 
        confirmText="CONFIRM_DISSOLUTION"
      />
    </div>
  );
};
