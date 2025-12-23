
import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  arrayUnion,
  writeBatch
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
  const [showDetails, setShowDetails] = useState(false);
  
  // Media & Picker State
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isGiphyPickerOpen, setIsGiphyPickerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedGif, setSelectedGif] = useState<GiphyGif | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  
  // Modal States
  const [terminationTarget, setTerminationTarget] = useState<{ id: string, label: string } | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteSearch, setInviteSearch] = useState('');
  const [selectedInviteIds, setSelectedInviteIds] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync Messages
  useEffect(() => {
    if (!db || !chatId) return;
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp', 'asc'), limit(100));
    const unsub = onSnapshot(q, (snap: any) => {
      setMessages(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Message)));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
    });
    return () => unsub();
  }, [chatId]);

  // Derived Data
  const participants = useMemo(() => {
    return chatData.participants.map(id => {
      return allUsers.find(u => u.id === id) || { 
        id, 
        displayName: chatData.participantData?.[id]?.displayName || 'Unknown Node', 
        avatarUrl: chatData.participantData?.[id]?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
        presenceStatus: 'Offline' as const,
        role: 'member'
      };
    });
  }, [chatData.participants, allUsers, chatData.participantData]);

  const candidatesForInvite = useMemo(() => {
    const query = inviteSearch.toLowerCase();
    return allUsers.filter(u => 
      !chatData.participants.includes(u.id) &&
      (u.displayName.toLowerCase().includes(query) || u.username.toLowerCase().includes(query))
    );
  }, [allUsers, chatData.participants, inviteSearch]);

  // --- Handlers ---

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

      // Cluster Notification (Batched)
      const batch = writeBatch(db);
      const recipients = chatData.participants.filter(pId => pId !== currentUser.id);
      const notificationText = msgText 
        ? `posted in ${chatData.clusterName}: "${msgText.substring(0, 30)}${msgText.length > 30 ? '...' : ''}"`
        : `posted media in ${chatData.clusterName}`;

      recipients.forEach(recipientId => {
          const ref = doc(collection(db, 'notifications'));
          batch.set(ref, {
            type: 'cluster_invite', // Reusing this type for generic cluster msg
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
      });
      await batch.commit();

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

  const handleInviteNodes = async () => {
    if (selectedInviteIds.length === 0 || !db) return;
    try {
        const participantUpdates: any = {};
        selectedInviteIds.forEach(id => {
            const u = allUsers.find(user => user.id === id);
            if (u) {
                participantUpdates[`participantData.${id}`] = {
                    displayName: u.displayName,
                    avatarUrl: u.avatarUrl
                };
            }
        });

        // 1. Add to participants array
        await updateDoc(doc(db, 'chats', chatId), {
            participants: arrayUnion(...selectedInviteIds),
            ...participantUpdates
        });

        // 2. Notify new members
        const batch = writeBatch(db);
        selectedInviteIds.forEach(id => {
            const notifRef = doc(collection(db, 'notifications'));
            batch.set(notifRef, {
                type: 'cluster_invite',
                fromUserId: currentUser.id,
                fromUserName: currentUser.displayName,
                fromUserAvatar: currentUser.avatarUrl,
                toUserId: id,
                targetId: chatId,
                text: `invited you to join the cluster "${chatData.clusterName}"`,
                isRead: false,
                timestamp: serverTimestamp(),
                pulseFrequency: 'intensity'
            });
        });
        await batch.commit();

        // 3. System Message in Chat
        await addDoc(collection(db, 'chats', chatId, 'messages'), {
            senderId: 'SYSTEM',
            text: `Protocol Update: ${selectedInviteIds.length} new node(s) injected into cluster.`,
            timestamp: serverTimestamp(),
            isRead: true
        });

        addToast(`${selectedInviteIds.length} Nodes Injected`, 'success');
        setIsInviteModalOpen(false);
        setSelectedInviteIds([]);
    } catch (e) {
        addToast("Injection Failed", 'error');
    }
  };

  const toggleInviteSelection = (id: string) => {
      setSelectedInviteIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  return (
    <div className="flex h-full w-full bg-[#fcfcfd] rounded-[2.5rem] overflow-hidden shadow-2xl relative animate-in fade-in duration-500 border border-white/50">
      
      {/* MAIN CHAT STREAM (Takes full width, handles resizing via flex) */}
      <div className="flex-1 flex flex-col min-w-0 relative bg-white/40 z-0">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/50 flex items-center justify-between bg-white/60 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="w-10 h-10 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl flex items-center justify-center transition-all active:scale-90 border border-slate-100 shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M15 19l-7-7 7-7" /></svg>
            </button>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <img src={chatData.clusterAvatar} className="w-12 h-12 rounded-[1.2rem] object-cover border-2 border-white shadow-md" alt="" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center border-2 border-white">
                   <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                </div>
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900 uppercase tracking-tight italic leading-none">{chatData.clusterName}</h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono mt-1">{participants.length} Nodes Synced</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <button 
                onClick={() => setIsInviteModalOpen(true)}
                className="hidden sm:flex px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all items-center gap-2 shadow-lg active:scale-95"
             >
                <ICONS.Create /> INVITE
             </button>
             <button 
                onClick={() => setShowDetails(!showDetails)}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90 border shadow-sm ${showDetails ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-100 hover:text-slate-900'}`}
             >
                <ICONS.Profile />
             </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto no-scrollbar scroll-container px-4 md:px-8 pt-6 pb-6 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full opacity-40 text-center">
              <div className="w-24 h-24 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center mb-6 text-indigo-300 shadow-inner">
                 <ICONS.Clusters />
              </div>
              <h3 className="text-xl font-black uppercase tracking-widest italic text-slate-900">Cluster_Initialized</h3>
              <p className="text-[10px] font-mono mt-2 font-bold text-slate-500 uppercase tracking-widest">Secure multi-node frequency established.</p>
            </div>
          )}
          
          {messages.map((msg, idx) => {
            const isMe = msg.senderId === currentUser.id;
            const isSystem = msg.senderId === 'SYSTEM';
            const sender = participants.find(p => p.id === msg.senderId);
            const showHeader = idx === 0 || messages[idx-1]?.senderId !== msg.senderId;

            if (isSystem) {
                return (
                    <div key={msg.id} className="flex justify-center py-2 animate-in fade-in">
                        <span className="px-4 py-1.5 bg-slate-100 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                            {msg.text}
                        </span>
                    </div>
                );
            }

            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group/msg animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[70%]`}>
                  
                  {showHeader && !isMe && (
                    <div className="flex items-center gap-2 mb-2 ml-1">
                       <img src={sender?.avatarUrl} className="w-5 h-5 rounded-lg object-cover shadow-sm" alt="" />
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">{sender?.displayName}</span>
                    </div>
                  )}

                  <div 
                    className={`
                      p-4 md:p-5 rounded-[2rem] text-sm font-medium shadow-sm relative transition-all duration-300
                      ${isMe 
                        ? 'bg-slate-900 text-white rounded-tr-sm shadow-xl shadow-slate-900/10' 
                        : 'bg-white text-slate-700 rounded-tl-sm border border-white/60 shadow-lg shadow-slate-200/50'
                      }
                    `}
                  >
                    {msg.media && msg.media.map((item, mIdx) => (
                      <div key={mIdx} className="mb-3 rounded-xl overflow-hidden shadow-md border border-black/10">
                        {item.type === 'video' ? (
                          <video src={item.url} controls className="w-full h-auto max-h-[300px] object-cover" />
                        ) : (
                          <img src={item.url} alt="Attachment" className="w-full h-auto max-h-[400px] object-cover" />
                        )}
                      </div>
                    ))}

                    <span className="leading-relaxed whitespace-pre-wrap font-bold">{msg.text}</span>
                    
                    <div className={`text-[7px] font-black uppercase mt-2 font-mono tracking-widest opacity-40 ${isMe ? 'text-right text-white' : 'text-left text-slate-400'}`}>
                      {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'SYNCING'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-white/80 backdrop-blur-xl border-t border-white/50 relative z-30">
           
           {/* Media Preview */}
           {mediaPreview && (
             <div className="absolute bottom-full left-0 right-0 px-6 py-3 bg-white/90 backdrop-blur-lg border-t border-white/50 flex items-center gap-4 shadow-sm animate-in slide-in-from-bottom-2">
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
                 <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500 font-mono">Payload_Ready</p>
                 <p className="text-xs font-bold text-slate-600 truncate max-w-[150px]">{selectedFile?.name || 'GIF_ARTIFACT'}</p>
               </div>
             </div>
           )}

           <form onSubmit={handleSendMessage} className="flex gap-3 items-end max-w-5xl mx-auto">
              <div className="flex gap-2 pb-1.5 shrink-0">
                 <button type="button" onClick={() => fileInputRef.current?.click()} className={`p-3 rounded-2xl transition-all active:scale-90 border ${selectedFile ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-white hover:text-indigo-500 shadow-sm'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z" /></svg>
                 </button>
                 <button type="button" onClick={() => { setIsEmojiPickerOpen(!isEmojiPickerOpen); setIsGiphyPickerOpen(false); }} className={`p-3 rounded-2xl transition-all active:scale-90 border ${isEmojiPickerOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-white hover:text-indigo-500 shadow-sm'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" /></svg>
                 </button>
                 <button type="button" onClick={() => { setIsGiphyPickerOpen(!isGiphyPickerOpen); setIsEmojiPickerOpen(false); }} className={`p-3 rounded-2xl transition-all active:scale-90 border ${isGiphyPickerOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-white hover:text-indigo-500 shadow-sm'}`}>
                    <span className="text-[10px] font-black font-mono">GIF</span>
                 </button>
              </div>

              <input 
                ref={inputRef}
                type="text" 
                value={newMessage} 
                onChange={(e) => setNewMessage(e.target.value)} 
                placeholder="Broadcast to cluster..." 
                className="flex-1 bg-slate-100/80 border border-slate-200/60 rounded-[2rem] px-6 py-4 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/5 focus:bg-white focus:border-indigo-500 transition-all outline-none shadow-inner" 
              />
              
              <button 
                disabled={(!newMessage.trim() && !selectedFile && !selectedGif) || isSending} 
                className="w-14 h-14 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center transition-all active:scale-90 disabled:opacity-20 hover:bg-black shadow-lg shrink-0"
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

      {/* CLUSTER DETAILS DRAWER (Overlay for Layout Compliance) */}
      <div 
        className={`absolute top-0 right-0 bottom-0 w-[320px] bg-white/80 backdrop-blur-3xl border-l border-white/50 flex flex-col z-[50] transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] shadow-[-20px_0_50px_rgba(0,0,0,0.1)] ${showDetails ? 'translate-x-0' : 'translate-x-full'}`}
      >
         <div className="p-6 border-b border-white/50 flex justify-between items-start">
            <div>
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mb-4">Cluster_Manifest</h4>
               <div className="flex items-center gap-4">
                  <div className="p-1 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[1.6rem] shadow-lg">
                     <img src={chatData.clusterAvatar} className="w-16 h-16 rounded-[1.4rem] object-cover border-2 border-white" alt="" />
                  </div>
                  <div>
                     <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-1 line-clamp-1">{chatData.clusterName}</h3>
                     <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest font-mono">ID: {chatData.id.slice(0, 4)}</p>
                  </div>
               </div>
            </div>
            <button onClick={() => setShowDetails(false)} className="p-2 text-slate-400 hover:text-slate-900"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2} /></svg></button>
         </div>

         <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
            <div>
               <div className="flex items-center justify-between mb-4">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Active_Nodes ({participants.length})</p>
                  <button onClick={() => { setIsInviteModalOpen(true); setShowDetails(false); }} className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Invite +</button>
               </div>
               <div className="space-y-3">
                  {participants.map(user => (
                     <div key={user.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/50 border border-transparent hover:border-white/60 transition-all group cursor-default">
                        <div className="relative">
                           <img src={user.avatarUrl} className="w-10 h-10 rounded-xl object-cover border border-slate-100" alt="" />
                           <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${user.presenceStatus === 'Online' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        </div>
                        <div className="min-w-0">
                           <p className="text-xs font-black text-slate-900 truncate">{user.displayName}</p>
                           <p className="text-[8px] font-mono text-slate-400 uppercase tracking-wider">{user.role || 'Member'}</p>
                        </div>
                        {user.id === chatData.clusterAdmin && (
                           <div className="ml-auto text-amber-500" title="Cluster Admin">
                              <ICONS.Verified />
                           </div>
                        )}
                     </div>
                  ))}
               </div>
            </div>

            <div className="pt-6 border-t border-white/50">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono mb-4">Cluster_Protocols</p>
               <div className="space-y-2">
                  <button className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-white border border-slate-100 hover:border-slate-200 transition-all group text-left">
                     <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <ICONS.Search />
                     </div>
                     <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Search_Logs</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-white border border-slate-100 hover:border-slate-200 transition-all group text-left">
                     <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <ICONS.Saved />
                     </div>
                     <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Shared_Media</span>
                  </button>
               </div>
            </div>
         </div>

         {chatData.clusterAdmin === currentUser.id && (
            <div className="p-6 border-t border-white/50 bg-rose-50/30">
               <button 
                 onClick={() => setTerminationTarget({ id: chatId, label: chatData.clusterName || 'Cluster' })}
                 className="w-full py-4 bg-white border border-rose-100 text-rose-500 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2} /></svg>
                 DISSOLVE_CLUSTER
               </button>
            </div>
         )}
      </div>

      {/* Hidden Inputs & Modals */}
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*,.heic,.heif,.avif,.webp" onChange={handleFileSelect} />
      
      {(isEmojiPickerOpen || isGiphyPickerOpen) && (
        <div className="absolute bottom-28 left-4 z-[100] animate-in slide-in-from-bottom-4 zoom-in-95 duration-300 origin-bottom-left">
           {isEmojiPickerOpen && <EmojiPicker onSelect={insertEmoji} onClose={() => setIsEmojiPickerOpen(false)} />}
           {isGiphyPickerOpen && <GiphyPicker onSelect={handleGifSelect} onClose={() => setIsGiphyPickerOpen(false)} />}
        </div>
      )}
      {(isEmojiPickerOpen || isGiphyPickerOpen) && (
        <div className="fixed inset-0 z-[90]" onClick={() => { setIsEmojiPickerOpen(false); setIsGiphyPickerOpen(false); }} />
      )}

      {/* INVITE MODAL */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsInviteModalOpen(false)} />
            <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]">
                <div className="mb-6">
                    <h3 className="text-2xl font-black text-slate-900 uppercase italic">Inject_Nodes</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Select peers to add to cluster</p>
                </div>
                
                <input 
                    type="text" 
                    placeholder="Search Directory..." 
                    value={inviteSearch} 
                    onChange={e => setInviteSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 mb-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none"
                />

                <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 mb-6 min-h-[200px]">
                    {candidatesForInvite.length > 0 ? (
                        candidatesForInvite.map(user => {
                            const selected = selectedInviteIds.includes(user.id);
                            return (
                                <button 
                                    key={user.id} 
                                    onClick={() => toggleInviteSelection(user.id)}
                                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${selected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <img src={user.avatarUrl} className="w-10 h-10 rounded-xl object-cover bg-slate-200" alt="" />
                                        <div className="text-left">
                                            <p className={`text-xs font-black uppercase ${selected ? 'text-white' : 'text-slate-900'}`}>{user.displayName}</p>
                                            <p className={`text-[9px] font-mono ${selected ? 'text-white/60' : 'text-slate-400'}`}>@{user.username}</p>
                                        </div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selected ? 'border-white bg-white/20' : 'border-slate-200'}`}>
                                        {selected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path d="M5 13l4 4L19 7" /></svg>}
                                    </div>
                                </button>
                            )
                        })
                    ) : (
                        <div className="text-center py-10 text-slate-300 font-mono text-xs uppercase tracking-widest">No available nodes found</div>
                    )}
                </div>

                <div className="flex gap-3">
                    <button onClick={() => setIsInviteModalOpen(false)} className="flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-slate-50 text-slate-500 hover:bg-slate-100 transition-all">Cancel</button>
                    <button 
                        onClick={handleInviteNodes}
                        disabled={selectedInviteIds.length === 0}
                        className="flex-[2] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-slate-900 text-white hover:bg-indigo-600 disabled:opacity-50 disabled:bg-slate-900 transition-all shadow-lg"
                    >
                        Confirm Injection ({selectedInviteIds.length})
                    </button>
                </div>
            </div>
        </div>
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
