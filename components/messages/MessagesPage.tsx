import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  orderBy,
  limit,
  doc,
  setDoc,
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { User as VibeUser, Message, Chat, Region, WeatherInfo } from '../../types';
import { ICONS } from '../../constants';
import { AtmosphericBackground } from './AtmosphericBackground';
import { ClusterCreationModal } from './ClusterCreationModal';
import { DeleteConfirmationModal } from '../ui/DeleteConfirmationModal';
import { EmojiPicker } from '../ui/EmojiPicker';
import { GiphyPicker } from '../ui/GiphyPicker';
import { uploadToCloudinary } from '../../services/cloudinary';
import { GiphyGif } from '../../services/giphy';

interface MessagesPageProps {
  currentUser: VibeUser;
  locale: Region;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  weather: WeatherInfo | null;
  allUsers?: VibeUser[];
}

export const MessagesPage: React.FC<MessagesPageProps> = ({ currentUser, locale, addToast, weather, allUsers = [] }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [view, setView] = useState<'list' | 'chat'>('list');
  const [isClusterModalOpen, setIsClusterModalOpen] = useState(false);
  
  // Media & Picker State
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isGiphyPickerOpen, setIsGiphyPickerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedGif, setSelectedGif] = useState<GiphyGif | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  
  const [terminationTarget, setTerminationTarget] = useState<{ type: 'message' | 'chat', id: string, label: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!db || !currentUser.id) return;
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', currentUser.id), orderBy('lastMessageTimestamp', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setChats(snap.docs.map(d => ({ id: d.id, ...d.data() } as Chat)));
    });
    return () => unsub();
  }, [currentUser.id]);

  useEffect(() => {
    if (!db || !selectedChatId) return;
    const q = query(collection(db, 'chats', selectedChatId, 'messages'), orderBy('timestamp', 'asc'), limit(100));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
    });
    return () => unsub();
  }, [selectedChatId]);

  const handleCreateCluster = async (name: string, participants: string[]) => {
    if (!db) return;
    try {
      const clusterId = `cluster_${Math.random().toString(36).substring(2, 11)}`;
      const participantData: any = { [currentUser.id]: { displayName: currentUser.displayName, avatarUrl: currentUser.avatarUrl } };
      participants.forEach(pId => {
         const user = allUsers.find(u => u.id === pId);
         if (user) participantData[pId] = { displayName: user.displayName, avatarUrl: user.avatarUrl };
      });
      await setDoc(doc(db, 'chats', clusterId), {
        participants: [currentUser.id, ...participants],
        participantData,
        lastMessage: 'Cluster communications initialised.',
        lastMessageTimestamp: serverTimestamp(),
        isCluster: true,
        clusterName: name,
        clusterAdmin: currentUser.id,
        clusterAvatar: `https://api.dicebear.com/7.x/initials/svg?seed=${name}`
      });
      setSelectedChatId(clusterId);
      setView('chat');
      setIsClusterModalOpen(false);
      addToast(`${name.toUpperCase()} Cluster Synchronised`, "success");
    } catch (e) { addToast("Cluster Fusion Failed", "error"); }
  };

  const handleStartCall = async (type: 'voice' | 'video') => {
    // Protocol Update: Feature Gate v2.6.4
    const featureName = type === 'voice' ? 'Neural Voice Uplink' : 'Quantum Video Sync';
    addToast(`${featureName} v3.0 Coming Soon to the Grid`, "info");
    return;
  };

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
    if ((!newMessage.trim() && !selectedFile && !selectedGif) || !selectedChatId || isSending) return;
    
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

      await addDoc(collection(db, 'chats', selectedChatId, 'messages'), payload);
      
      const lastMsgText = mediaItems.length > 0 ? (msgText ? `📎 ${msgText}` : '📎 Attached Artifact') : msgText;
      await updateDoc(doc(db, 'chats', selectedChatId), { 
        lastMessage: lastMsgText, 
        lastMessageTimestamp: serverTimestamp() 
      });

      // Notification Logic
      const activeChat = chats.find(c => c.id === selectedChatId);
      if (activeChat) {
        const recipients = activeChat.participants.filter(pId => pId !== currentUser.id);
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
             targetId: selectedChatId,
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
    const { type, id } = terminationTarget;
    try {
      if (type === 'chat') {
        await deleteDoc(doc(db, 'chats', id));
        if (selectedChatId === id) {
          setSelectedChatId(null);
          setView('list');
        }
        addToast("Link Terminated Successfully", "success");
      }
      setTerminationTarget(null);
    } catch (e) {
      addToast("Termination Protocol Failed", "error");
    }
  };

  const activeChat = chats.find(c => c.id === selectedChatId);
  const otherParticipantId = activeChat?.participants.find(id => id !== currentUser.id);
  const otherParticipant = activeChat?.participantData[otherParticipantId || ''];
  const targetUserFull = allUsers.find(u => u.id === otherParticipantId);

  const PRESENCE_AURA: Record<string, string> = {
    'Online': 'shadow-[0_0_15px_rgba(16,185,129,0.4)] bg-[#10b981]',
    'Focus': 'shadow-[0_0_15px_rgba(245,158,11,0.4)] bg-[#f59e0b]',
    'Deep Work': 'shadow-[0_0_15px_rgba(225,29,72,0.4)] bg-[#e11d48]',
    'Away': 'bg-[#94a3b8]',
    'Syncing': 'bg-[#60a5fa] animate-pulse'
  };

  return (
    <div className="flex h-[calc(100vh-var(--header-h)-var(--bottom-nav-h)-1rem)] md:h-[calc(100vh-var(--header-h)-3rem)] -mx-4 sm:-mx-6 md:-mx-10 lg:-mx-14 bg-[#fcfcfd] md:rounded-[3.5rem] overflow-hidden shadow-heavy relative border border-slate-100 animate-in fade-in duration-700">
      
      {/* SIDEBAR: CONTACTS FEED */}
      <div className={`${view === 'chat' ? 'hidden md:flex' : 'flex'} w-full md:w-[380px] lg:w-[420px] border-r border-slate-50 flex-col bg-white shrink-0 z-20 relative overflow-hidden`}>
        <div className="p-8 pb-4">
          <div className="flex items-center justify-between mb-8">
             <div className="flex flex-col">
               <h2 className="text-3xl font-black text-slate-950 tracking-tighter uppercase italic leading-none">Comms_Feed</h2>
               <div className="flex items-center gap-2 mt-2">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Neural_Grid_v2.6_OK</p>
               </div>
             </div>
             <button onClick={() => setIsClusterModalOpen(true)} className="p-3.5 bg-slate-950 text-white rounded-2xl shadow-xl hover:bg-black transition-all active:scale-90"><ICONS.Clusters /></button>
          </div>
          <div className="relative group">
             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 scale-90"><ICONS.Search /></div>
             <input type="text" placeholder="Scan nodes..." className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all shadow-inner placeholder:text-slate-300" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-2">
          {chats.map(chat => {
            const isCluster = chat.isCluster;
            const pId = chat.participants.find(id => id !== currentUser.id);
            const pData = isCluster ? { displayName: chat.clusterName, avatarUrl: chat.clusterAvatar } : chat.participantData[pId || ''];
            const isActive = selectedChatId === chat.id;
            const peerUser = allUsers.find(u => u.id === pId);

            return (
              <button 
                key={chat.id} 
                onClick={() => { setSelectedChatId(chat.id); setView('chat'); }} 
                className={`w-full flex items-center gap-4 p-5 rounded-[2.2rem] transition-all duration-500 relative group ${isActive ? 'bg-white shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] ring-1 ring-slate-100' : 'hover:bg-slate-50/70'}`}
              >
                {isActive && <div className="absolute left-2 top-6 bottom-6 w-1 bg-[#4f46e5] rounded-full" />}
                <div className="relative shrink-0">
                  <img src={pData?.avatarUrl} className={`w-14 h-14 object-cover border-2 border-white shadow-sm ${isCluster ? 'rounded-[1.4rem]' : 'rounded-[1.8rem]'}`} alt="" />
                  {!isCluster && peerUser?.presenceStatus && (
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-white ${PRESENCE_AURA[peerUser.presenceStatus] || 'bg-slate-300'}`} />
                  )}
                </div>
                <div className="text-left overflow-hidden flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <p className={`font-black text-[13px] uppercase tracking-tight truncate ${isActive ? 'text-indigo-600' : 'text-slate-950'}`}>{pData?.displayName}</p>
                    <span className="text-[8px] font-black text-slate-300 font-mono italic">{chat.lastMessageTimestamp?.toDate ? chat.lastMessageTimestamp.toDate().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'NOW'}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold truncate italic leading-none opacity-80">{chat.lastMessage}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN VIEWPORT: CHAT STREAM */}
      <div className={`${view === 'list' ? 'hidden md:flex' : 'flex'} flex-1 flex-col min-w-0 bg-[#fdfdfe] relative`}>
        <AtmosphericBackground weather={weather}>
          {activeChat ? (
            <>
              {/* IMMERSIVE HEADER */}
              <div className="px-8 py-6 border-b flex items-center justify-between backdrop-blur-3xl sticky top-0 z-20 bg-white/70 border-slate-100/50">
                <div className="flex items-center gap-5">
                  <button onClick={() => setView('list')} className="md:hidden p-3 text-slate-400 active:scale-90 transition-transform"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3.5}><path d="M15 19l-7-7 7-7" /></svg></button>
                  <div className="relative group">
                    <img src={activeChat.isCluster ? activeChat.clusterAvatar : otherParticipant?.avatarUrl} className={`w-14 h-14 border shadow-sm transition-transform group-hover:scale-105 ${activeChat.isCluster ? 'rounded-[1.4rem]' : 'rounded-2xl'}`} alt="" />
                    {!activeChat.isCluster && targetUserFull?.presenceStatus === 'Online' && <div className="absolute inset-0 rounded-2xl border-2 border-emerald-500 animate-ping opacity-20" />}
                  </div>
                  <div>
                    <h3 className="font-black text-2xl uppercase tracking-tighter italic leading-none text-slate-950">{activeChat.isCluster ? activeChat.clusterName : otherParticipant?.displayName}</h3>
                    <div className="flex items-center gap-2 mt-2">
                       <div className={`w-1.5 h-1.5 rounded-full ${targetUserFull?.presenceStatus ? PRESENCE_AURA[targetUserFull.presenceStatus] : 'bg-slate-300'}`} />
                       <p className="text-[9px] font-black uppercase tracking-widest font-mono text-slate-400">{targetUserFull?.presenceStatus || 'Offline'}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   {!activeChat.isCluster && (
                     <div className="hidden sm:flex bg-slate-100/80 p-1.5 rounded-[2.2rem] gap-1.5 shadow-inner border border-slate-100">
                       <button onClick={() => handleStartCall('voice')} className="px-5 py-3 bg-white hover:bg-indigo-50 text-indigo-600 rounded-2xl transition-all shadow-sm flex items-center gap-2 group active:scale-90">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                       </button>
                       <button onClick={() => handleStartCall('video')} className="px-5 py-3 bg-white hover:bg-emerald-50 text-emerald-600 rounded-2xl transition-all shadow-sm flex items-center gap-2 group active:scale-90">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25z" /></svg>
                       </button>
                     </div>
                   )}
                   <button onClick={() => setTerminationTarget({ type: 'chat', id: activeChat.id, label: activeChat.isCluster ? 'Cluster' : 'Link' })} className="p-4 bg-white/50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-90 border border-slate-100"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
              </div>

              {/* MESSAGE STREAM AREA */}
              <div ref={chatScrollRef} className="flex-1 overflow-y-auto no-scrollbar scroll-container p-8 space-y-8 relative">
                {messages.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center opacity-10 pointer-events-none p-12 text-center">
                    <div className="w-24 h-24 bg-slate-900 rounded-[3rem] mb-6 flex items-center justify-center text-white scale-125"><ICONS.Messages /></div>
                    <h3 className="text-xl font-black uppercase tracking-widest italic">Neural_Link_Established</h3>
                    <p className="text-[9px] font-mono mt-2">AWAITING_PEER_BURST_SEQUENCE</p>
                  </div>
                )}
                {messages.map((msg, idx) => {
                  const isMe = msg.senderId === currentUser.id;
                  const showAvatar = idx === 0 || messages[idx-1]?.senderId !== msg.senderId;
                  
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group/msg animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[70%]`}>
                        {!isMe && showAvatar && (
                          <div className="flex items-center gap-2 mb-2 ml-1">
                             <img src={otherParticipant?.avatarUrl} className="w-5 h-5 rounded-lg object-cover border border-slate-100" alt="" />
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono italic">{otherParticipant?.displayName}</span>
                          </div>
                        )}
                        <div className={`p-6 rounded-[2.5rem] text-sm font-bold shadow-sm relative group-hover/msg:shadow-lg transition-all duration-300 ${isMe ? 'bg-[#0f172a] text-white rounded-tr-none shadow-indigo-950/10' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100 shadow-slate-200/50'}`}>
                          
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
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* INPUT SECTION */}
              <div className="p-6 md:p-8 border-t bg-white/80 backdrop-blur-md border-slate-100/50 relative z-30">
                
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
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 font-mono">Artifact Ready</p>
                      <p className="text-xs font-bold text-slate-900 truncate max-w-[200px]">{selectedFile?.name || 'GIF Fragment'}</p>
                    </div>
                  </div>
                )}

                {/* Overlays */}
                {(isEmojiPickerOpen || isGiphyPickerOpen) && (
                  <div className="fixed inset-0 z-[100] bg-black/10 backdrop-blur-[1px]" onClick={() => { setIsEmojiPickerOpen(false); setIsGiphyPickerOpen(false); }} />
                )}
                {isEmojiPickerOpen && (
                  <div className="absolute bottom-24 left-4 z-[200]">
                    <EmojiPicker onSelect={insertEmoji} onClose={() => setIsEmojiPickerOpen(false)} />
                  </div>
                )}
                {isGiphyPickerOpen && (
                  <div className="absolute bottom-24 left-4 z-[200]">
                    <GiphyPicker onSelect={handleGifSelect} onClose={() => setIsGiphyPickerOpen(false)} />
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex gap-3 md:gap-4 max-w-5xl mx-auto items-end">
                  {/* Media Tools */}
                  <div className="flex gap-2 pb-1.5 shrink-0">
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      className={`p-3 rounded-2xl transition-all active:scale-90 border ${selectedFile ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-white hover:border-indigo-100 hover:text-indigo-500 shadow-sm'}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z" /></svg>
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setIsGiphyPickerOpen(!isGiphyPickerOpen); setIsEmojiPickerOpen(false); }}
                      className={`p-3 rounded-2xl transition-all active:scale-90 border ${isGiphyPickerOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-white hover:border-indigo-100 hover:text-indigo-500 shadow-sm'}`}
                    >
                      <span className="text-[10px] font-black font-mono">GIF</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setIsEmojiPickerOpen(!isEmojiPickerOpen); setIsGiphyPickerOpen(false); }}
                      className={`p-3 rounded-2xl transition-all active:scale-90 border ${isEmojiPickerOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-indigo-100 hover:text-indigo-500 shadow-sm'}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" /></svg>
                    </button>
                  </div>

                  <div className="flex-1 relative">
                    <input 
                      ref={inputRef}
                      type="text" 
                      value={newMessage} 
                      onChange={(e) => setNewMessage(e.target.value)} 
                      placeholder={selectedFile ? "Add a caption..." : "Establish broadcast sequence..."} 
                      className="w-full bg-slate-100/80 border border-slate-200 rounded-[2.2rem] pl-6 pr-6 py-5 text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all outline-none italic placeholder:text-slate-400 shadow-inner" 
                    />
                  </div>
                  
                  <button 
                    disabled={(!newMessage.trim() && !selectedFile && !selectedGif) || isSending} 
                    className="h-[58px] px-8 bg-slate-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all active:scale-95 disabled:opacity-30 italic shadow-xl group flex items-center justify-center shrink-0"
                  >
                    {isSending ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
               <div className="relative group">
                 <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-full scale-150 animate-pulse" />
                 <div className="relative w-32 h-32 md:w-48 md:h-48 bg-white rounded-[4rem] border-sharp shadow-heavy flex items-center justify-center text-slate-200 scale-110 mb-12"><ICONS.Messages /></div>
               </div>
               <h3 className="text-2xl font-black text-slate-950 tracking-tighter uppercase italic leading-none mb-4">Neural_Wait_State</h3>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] font-mono italic max-w-xs leading-loose">Establish a peer link from the node registry to initiate frequency transmission.</p>
            </div>
          )}
        </AtmosphericBackground>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*,.heic,.heif,.avif,.webp" onChange={handleFileSelect} />

      {/* CLUSTER MODAL OVERLAYS */}
      {isClusterModalOpen && (
        <ClusterCreationModal 
          currentUser={currentUser} 
          availableNodes={allUsers.filter(u => u.id !== currentUser.id)} 
          onClose={() => setIsClusterModalOpen(false)} 
          onConfirm={handleCreateCluster} 
        />
      )}
      
      <DeleteConfirmationModal 
        isOpen={!!terminationTarget} 
        title="TERMINATION_PROTOCOL" 
        description={`Destroy active link with ${terminationTarget?.label}? This action cannot be reversed within the current grid cycle.`} 
        onConfirm={handleExecuteTermination} 
        onCancel={() => setTerminationTarget(null)} 
        confirmText="TERMINATE_LINK"
      />
    </div>
  );
};