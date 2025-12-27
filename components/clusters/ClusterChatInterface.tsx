
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
  arrayRemove,
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

interface ClusterChatInterfaceProps {
  chatId: string;
  currentUser: User;
  allUsers: User[];
  onBack: () => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  chatData: Chat;
}

export const ClusterChatInterface: React.FC<ClusterChatInterfaceProps> = ({ 
  chatId, 
  currentUser, 
  allUsers, 
  onBack, 
  addToast, 
  chatData 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Media & Picker State
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isGiphyPickerOpen, setIsGiphyPickerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedGif, setSelectedGif] = useState<GiphyGif | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  
  // Admin & Management State
  const [nodeToRemove, setNodeToRemove] = useState<User | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isAdmin = chatData?.clusterAdmin === currentUser?.id;

  // --- Real-time Messages ---
  useEffect(() => {
    if (!db || !chatId) return;
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp', 'asc'), limit(100));
    const unsub = onSnapshot(q, (snap: any) => {
      setMessages(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Message)));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
    });
    return () => unsub();
  }, [chatId]);

  // --- Message Sending Logic ---
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

      if (chatData?.participants?.length < 20) {
          const recipients = chatData.participants.filter(pId => pId !== currentUser.id);
          const notificationText = msgText 
            ? `in ${chatData.clusterName}: "${msgText.substring(0, 30)}..."`
            : `sent media to ${chatData.clusterName}`;

          for (const recipientId of recipients) {
             addDoc(collection(db, 'notifications'), {
               type: 'cluster_invite', 
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

  // --- Admin Logic ---
  const handleConfirmRemoval = async () => {
    if (!nodeToRemove || !db) return;
    try {
      await updateDoc(doc(db, 'chats', chatId), {
        participants: arrayRemove(nodeToRemove.id)
      });
      
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: 'SYSTEM',
        text: `Node ${nodeToRemove.displayName} disconnected from cluster.`,
        timestamp: serverTimestamp(),
        isRead: true
      });

      await addDoc(collection(db, 'notifications'), {
        type: 'system',
        fromUserId: currentUser.id,
        fromUserName: 'Cluster Admin',
        fromUserAvatar: currentUser.avatarUrl,
        toUserId: nodeToRemove.id,
        targetId: chatId,
        text: `You have been disconnected from Cluster "${chatData.clusterName}" by the administrator.`,
        isRead: false,
        timestamp: serverTimestamp(),
        pulseFrequency: 'resilience'
      });

      addToast(`Node Removed: ${nodeToRemove.displayName}`, "success");
      setNodeToRemove(null);
    } catch (e) {
      console.error(e);
      addToast("Removal Protocol Failed", "error");
    }
  };

  const handleLeaveCluster = async () => {
    if (!db || !currentUser.id) return;
    try {
      await updateDoc(doc(db, 'chats', chatId), {
        participants: arrayRemove(currentUser.id)
      });
      
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: 'SYSTEM',
        text: `Node ${currentUser.displayName} has left the cluster.`,
        timestamp: serverTimestamp(),
        isRead: true
      });

      addToast("Left Cluster Successfully", "success");
      setShowLeaveModal(false);
      onBack();
    } catch (e) {
      addToast("Leave Protocol Failed", "error");
    }
  };

  // --- Helper Functions ---
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

  if (!chatData) return <div className="p-20 text-center opacity-40 uppercase font-black font-mono tracking-[0.3em]">Synching_Lobby...</div>;

  return (
    <div className="flex flex-col h-full bg-[#fdfdfe] dark:bg-slate-900 relative">
      {/* HEADER */}
      <div className="px-6 py-4 border-b flex items-center justify-between backdrop-blur-3xl sticky top-0 z-20 bg-white/70 dark:bg-slate-900/70 border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 text-slate-400 active:scale-90 transition-transform hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3.5}><path d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setShowMembers(!showMembers)}>
            <img src={chatData.clusterAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${chatData.clusterName}`} className="w-12 h-12 rounded-[1.2rem] object-cover border shadow-sm" alt="" />
            <div>
              <h3 className="font-black text-xl uppercase tracking-tighter italic leading-none text-slate-900 dark:text-white">{chatData.clusterName || 'Neural Lobby'}</h3>
              <p className="text-[9px] font-black uppercase tracking-widest font-mono text-indigo-500 mt-1">{(chatData.participants || []).length} Nodes Online</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => setShowMembers(!showMembers)} className={`p-3 rounded-2xl transition-all border ${showMembers ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border-indigo-200' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700'}`}>
              <ICONS.Profile />
           </button>
           <button onClick={() => setShowLeaveModal(true)} className="p-3 bg-white/50 dark:bg-slate-800 text-rose-500 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all border border-slate-100 dark:border-slate-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
           </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* MEMBERS SIDEBAR */}
        {showMembers && (
            <div className="absolute inset-y-0 right-0 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-slate-100 dark:border-slate-800 z-30 p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4 font-mono">Cluster_Nodes</h4>
               <div className="space-y-3">
                  {(chatData.participants || []).map(pId => {
                      const user = chatData.participantData?.[pId] || allUsers.find(u => u.id === pId);
                      const isMe = pId === currentUser?.id;
                      const isUserAdmin = chatData.clusterAdmin === pId;

                      return (
                          <div key={pId} className="flex items-center justify-between group">
                              <div className="flex items-center gap-3">
                                  <img src={user?.avatarUrl} className="w-8 h-8 rounded-lg object-cover bg-slate-100 dark:bg-slate-800" alt="" />
                                  <div className="min-w-0">
                                      <p className={`text-xs font-bold truncate ${isMe ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>{user?.displayName || 'Unknown'}</p>
                                      {isUserAdmin && <span className="text-[8px] font-black bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 uppercase">ADMIN</span>}
                                  </div>
                              </div>
                              {isAdmin && !isMe && (
                                  <button onClick={() => setNodeToRemove({ id: pId, displayName: user?.displayName } as User)} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                              )}
                          </div>
                      );
                  })}
               </div>
            </div>
        )}

        {/* MESSAGE STREAM */}
        <div className="flex-1 overflow-y-auto no-scrollbar scroll-container px-4 md:px-8 pt-6 pb-32 space-y-6">
            {messages.map((msg, idx) => {
                const isMe = msg.senderId === currentUser?.id;
                const isSystem = msg.senderId === 'SYSTEM';
                const showAvatar = idx === 0 || messages[idx-1]?.senderId !== msg.senderId;
                
                if (isSystem) {
                    return (
                        <div key={msg.id} className="flex justify-center my-4">
                            <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full uppercase tracking-wider">
                                {msg.text}
                            </span>
                        </div>
                    );
                }

                const sender = chatData.participantData?.[msg.senderId] || allUsers.find(u => u.id === msg.senderId);

                return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group/msg animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[70%]`}>
                            {!isMe && showAvatar && (
                                <div className="flex items-center gap-2 mb-1 ml-1">
                                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">{sender?.displayName}</span>
                                </div>
                            )}
                            <div className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                {!isMe && showAvatar ? (
                                    <img src={sender?.avatarUrl} className="w-8 h-8 rounded-xl object-cover self-end mb-1 bg-slate-100 dark:bg-slate-800" alt="" />
                                ) : !isMe && <div className="w-8" />}
                                
                                <div className={`p-4 rounded-[1.5rem] text-sm font-medium shadow-sm relative ${isMe ? 'bg-slate-900 dark:bg-slate-700 text-white rounded-br-sm' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm border border-slate-100 dark:border-slate-700'}`}>
                                    {msg.media && msg.media.map((item, mIdx) => (
                                        <div key={mIdx} className="mb-2 rounded-xl overflow-hidden">
                                            {item.type === 'video' ? (
                                                <video src={item.url} controls className="w-full h-auto max-h-[300px] object-cover" />
                                            ) : (
                                                <img src={item.url} alt="Attachment" className="w-full h-auto max-h-[400px] object-cover" />
                                            )}
                                        </div>
                                    ))}
                                    <span className="whitespace-pre-wrap leading-relaxed">{msg.text}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
            <div ref={messagesEndRef} />
        </div>
      </div>

      {/* INPUT AREA */}
      <div className="p-4 md:p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 relative z-40">
         {mediaPreview && (
            <div className="absolute bottom-full left-4 mb-4 p-2 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 flex items-center gap-3">
                <img src={mediaPreview} className="w-12 h-12 rounded-xl object-cover" alt="Preview" />
                <button onClick={clearMedia} className="p-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
         )}

         <form onSubmit={handleSendMessage} className="flex items-end gap-3 max-w-4xl mx-auto">
            <div className="flex gap-2 pb-1">
               <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-400 hover:text-indigo-600 transition-colors rounded-2xl">
                  <ICONS.Create />
               </button>
               <button type="button" onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)} className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-400 hover:text-indigo-600 transition-colors rounded-2xl">
                  <span className="text-xl leading-none">😊</span>
               </button>
            </div>
            
            <input 
               ref={inputRef}
               type="text" 
               value={newMessage} 
               onChange={(e) => setNewMessage(e.target.value)} 
               placeholder="Broadcast to cluster..." 
               className="flex-1 bg-slate-100/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] px-6 py-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all placeholder:text-slate-400"
            />
            
            <button 
               disabled={(!newMessage.trim() && !selectedFile && !selectedGif) || isSending}
               className="w-14 h-14 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-indigo-200/50 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
            >
               {isSending ? (
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
               ) : (
                   <svg className="w-6 h-6 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
               )}
            </button>
         </form>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileSelect} />

      {/* MODALS */}
      <DeleteConfirmationModal 
        isOpen={showLeaveModal} 
        title="LEAVE_CLUSTER" 
        description="Are you sure you want to disconnect from this cluster? You will need an invite to rejoin." 
        onConfirm={handleLeaveCluster} 
        onCancel={() => setShowLeaveModal(false)} 
        confirmText="CONFIRM_EXIT"
      />

      <DeleteConfirmationModal 
        isOpen={!!nodeToRemove} 
        title="EJECT_NODE" 
        description={`Remove ${nodeToRemove?.displayName} from the cluster?`} 
        onConfirm={handleConfirmRemoval} 
        onCancel={() => setNodeToRemove(null)} 
        confirmText="EJECT"
      />

      {/* Pickers Portal */}
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
    </div>
  );
};
