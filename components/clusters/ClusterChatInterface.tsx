
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
  getDocs,
  deleteDoc,
  writeBatch
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
import { summarizeClusterThread } from '../../services/aiAssistant';

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
  const [threadSummary, setThreadSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isGiphyPickerOpen, setIsGiphyPickerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedGif, setSelectedGif] = useState<GiphyGif | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  
  const [nodeToRemove, setNodeToRemove] = useState<User | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<RichTextEditorRef>(null);

  const isAdmin = chatData?.clusterAdmin === currentUser?.id;

  useEffect(() => {
    if (!db || !chatId) return;
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp', 'asc'), limit(100));
    const unsub = onSnapshot(q, (snap: any) => {
      setMessages(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Message)));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
    });
    return () => unsub();
  }, [chatId]);

  const handleSummarize = async () => {
    if (messages.length < 5 || isSummarizing) return;
    setIsSummarizing(true);
    const summary = await summarizeClusterThread(messages);
    setThreadSummary(summary);
    setIsSummarizing(false);
    setTimeout(() => setThreadSummary(null), 10000); // Clear after 10s
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

      setNewMessage('');
      editorRef.current?.clear();
      clearMedia();
    } catch (e) { addToast("Transmission Interrupted", "error"); } finally { setIsSending(false); }
  };

  const handleConfirmRemoval = async () => {
    if (!nodeToRemove || !db) return;
    try {
      await updateDoc(doc(db, 'chats', chatId), { participants: arrayRemove(nodeToRemove.id) });
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: 'SYSTEM',
        text: `Node ${nodeToRemove.displayName} disconnected from cluster.`,
        timestamp: serverTimestamp(),
        isRead: true
      });
      setNodeToRemove(null);
    } catch (e) { addToast("Removal Protocol Failed", "error"); }
  };

  const handleLeaveCluster = async () => {
    if (!db || !currentUser.id) return;
    try {
      await updateDoc(doc(db, 'chats', chatId), { participants: arrayRemove(currentUser.id) });
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: 'SYSTEM',
        text: `Node ${currentUser.displayName} has left the cluster.`,
        timestamp: serverTimestamp(),
        isRead: true
      });
      onBack();
    } catch (e) { addToast("Leave Protocol Failed", "error"); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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

  if (!chatData) return <div className="p-20 text-center opacity-40 uppercase font-black font-mono tracking-[0.3em]">Synching_Lobby...</div>;

  return (
    <div className="flex flex-col h-full bg-[#fdfdfe] dark:bg-[#020617] relative selection:bg-indigo-500">
      
      {/* HEADER: CLUSTER CONTROL */}
      <div className="px-6 py-4 border-b flex items-center justify-between backdrop-blur-3xl relative z-20 bg-white/80 dark:bg-slate-950/80 border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 text-slate-400 active:scale-90 transition-transform hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3.5}><path d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setShowMembers(!showMembers)}>
            <img src={chatData.clusterAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${chatData.clusterName}`} className="w-12 h-12 rounded-[1.4rem] object-cover border shadow-sm transition-transform group-hover:scale-105" alt="" />
            <div>
              <h3 className="font-black text-xl uppercase tracking-tighter italic leading-none text-slate-900 dark:text-white">{chatData.clusterName || 'Neural Lobby'}</h3>
              <p className="text-[9px] font-black uppercase tracking-widest font-mono text-indigo-500 mt-1">{(chatData.participants || []).length} Nodes Linked</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={handleSummarize}
             disabled={isSummarizing || messages.length < 5}
             className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-all active:scale-90 shadow-sm"
             title="Hive Summary"
           >
              {isSummarizing ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <ICONS.Resilience />}
           </button>
           <button onClick={() => setShowMembers(!showMembers)} className={`p-3 rounded-2xl transition-all border ${showMembers ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 border-indigo-200' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700 shadow-sm'}`}>
              <ICONS.Profile />
           </button>
           <button onClick={() => setShowLeaveModal(true)} className="p-3 bg-white/50 dark:bg-slate-800 text-rose-500 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all border border-slate-100 dark:border-slate-700 shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
           </button>
        </div>
      </div>

      {/* CLUSTER STREAM AREA */}
      <div className="flex-1 overflow-hidden relative">
        
        {/* THREAD SUMMARY OVERLAY */}
        {threadSummary && (
            <div className="absolute top-4 left-4 right-4 z-40 animate-in slide-in-from-top-4 duration-500">
                <div className="bg-indigo-600 text-white p-5 rounded-[2.2rem] shadow-heavy border border-indigo-400 backdrop-blur-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                    <div className="flex items-start gap-4 relative z-10">
                        <div className="p-2.5 bg-white/20 rounded-xl text-white shadow-sm"><ICONS.Resilience /></div>
                        <div className="flex-1 min-w-0">
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] font-mono text-indigo-200">Hive_Intelligence_Summary</span>
                            <p className="text-sm font-bold mt-1 leading-relaxed">"{threadSummary}"</p>
                        </div>
                        <button onClick={() => setThreadSummary(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                </div>
            </div>
        )}

        {showMembers && (
            <div className="absolute inset-y-0 right-0 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border-l border-slate-100 dark:border-slate-800 z-30 p-8 overflow-y-auto animate-in slide-in-from-right duration-300 shadow-heavy">
               <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500 mb-6 font-mono">Cluster_Registry</h4>
               <div className="space-y-4">
                  {(chatData.participants || []).map(pId => {
                      const user = chatData.participantData?.[pId] || allUsers.find(u => u.id === pId);
                      const isMe = pId === currentUser?.id;
                      const isUserAdmin = chatData.clusterAdmin === pId;

                      return (
                          <div key={pId} className="flex items-center justify-between group/p">
                              <div className="flex items-center gap-4">
                                  <img src={user?.avatarUrl} className="w-10 h-10 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 border shadow-sm" alt="" />
                                  <div className="min-w-0">
                                      <p className={`text-sm font-black uppercase italic tracking-tight truncate ${isMe ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>{user?.displayName || 'Unknown Node'}</p>
                                      {isUserAdmin && <span className="text-[8px] font-black bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-2 py-0.5 rounded uppercase tracking-widest mt-1 inline-block">ROOT</span>}
                                  </div>
                              </div>
                              {isAdmin && !isMe && (
                                  <button onClick={() => setNodeToRemove({ id: pId, displayName: user?.displayName } as User)} className="p-2 text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover/p:opacity-100 active:scale-90">
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  </button>
                              )}
                          </div>
                      );
                  })}
               </div>
            </div>
        )}

        <div className="h-full overflow-y-auto no-scrollbar scroll-container px-6 md:px-10 py-8 space-y-1 relative bg-transparent">
            {messages.map((msg, idx) => {
                const isMe = msg.senderId === currentUser?.id;
                const isSystem = msg.senderId === 'SYSTEM';
                if (isSystem) {
                    return (
                        <div key={msg.id} className="flex justify-center my-6">
                            <span className="text-[9px] font-black font-mono text-slate-400 dark:text-slate-500 bg-slate-100/50 dark:bg-slate-800/30 px-4 py-1.5 rounded-full uppercase tracking-[0.2em] border border-slate-100/50 dark:border-slate-800/30 italic">
                              {msg.text}
                            </span>
                        </div>
                    );
                }

                const pos = getMessagePosition(idx);
                const sender = chatData.participantData?.[msg.senderId] || allUsers.find(u => u.id === msg.senderId);
                const extractedUrl = extractUrls(msg.text)[0];

                return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group/msg animate-in fade-in slide-in-from-bottom-2 duration-300 ${pos === 'top' || pos === 'single' ? 'mt-6' : 'mt-0.5'}`}>
                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[70%]`}>
                            {(!isMe && (pos === 'top' || pos === 'single')) && (
                                <div className="flex items-center gap-3 mb-2 ml-1">
                                    <img src={sender?.avatarUrl} className="w-5 h-5 rounded-lg object-cover border border-slate-100 dark:border-slate-800" alt="" />
                                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono italic">{sender?.displayName}</span>
                                </div>
                            )}
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
                                    <div key={mIdx} className="mb-4 rounded-[1.8rem] overflow-hidden shadow-lg border border-slate-100 dark:border-slate-700">
                                        {item.type === 'video' ? <video src={item.url} controls className="w-full h-auto max-h-[300px] object-cover" /> : <img src={item.url} alt="" className="w-full h-auto max-h-[400px] object-cover" />}
                                    </div>
                                ))}
                                
                                <div className="leading-[1.5] ProseMirror" dangerouslySetInnerHTML={{ __html: msg.text }} />
                                
                                {extractedUrl && <div className="mt-4"><LinkPreview url={extractedUrl} compact={true} /></div>}

                                <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/msg:opacity-40 transition-opacity whitespace-nowrap text-[7px] font-black font-mono tracking-widest ${isMe ? '-left-16 text-slate-400' : '-right-16 text-slate-400'}`}>
                                    {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : 'SYNC'}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
            <div ref={messagesEndRef} className="h-10" />
        </div>
      </div>

      {/* INPUT COCKPIT */}
      <div className="p-4 md:p-8 border-t border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl relative z-40">
         {mediaPreview && (
            <div className="absolute bottom-full left-6 right-6 mb-4 p-4 bg-white/90 dark:bg-slate-800/90 rounded-[2.5rem] shadow-premium border border-slate-200 dark:border-slate-700 backdrop-blur-xl flex items-center gap-4 animate-in slide-in-from-bottom-2 duration-300">
                <div className="relative group">
                    <img src={mediaPreview} className="h-20 w-20 object-cover rounded-2xl border-4 border-white dark:border-slate-700 shadow-lg" alt="" />
                    <button onClick={clearMedia} className="absolute -top-3 -right-3 bg-rose-600 text-white rounded-full p-2.5 shadow-xl hover:bg-rose-700 active:scale-90 transition-all border-2 border-white dark:border-slate-800"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <div>
                   <p className="text-[9px] font-black uppercase tracking-[0.25em] text-indigo-500 font-mono italic">Cluster_Payload_Ready</p>
                   <p className="text-xs font-bold text-slate-700 dark:text-white truncate mt-1">{selectedFile?.name || 'GIF_FRAGMENT'}</p>
                </div>
            </div>
         )}

         <div className="flex gap-4 max-w-5xl mx-auto items-end">
            <div className="flex gap-2 pb-1.5 shrink-0">
               <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3.5 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-400 hover:text-indigo-600 transition-all rounded-2xl border border-transparent shadow-sm active:scale-90">
                  <ICONS.Create />
               </button>
               <button type="button" onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)} className="p-3.5 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-400 hover:text-indigo-600 transition-all rounded-2xl border border-transparent shadow-sm active:scale-90">
                  <span className="text-2xl leading-none">😊</span>
               </button>
            </div>
            
            <div className="flex-1 relative pb-1">
                <RichTextEditor 
                    ref={editorRef}
                    content={newMessage} 
                    onChange={setNewMessage}
                    onSubmit={() => handleSendMessage()}
                    placeholder="Broadcast to cluster..." 
                    className="w-full bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-[2.5rem] px-2 py-1 shadow-inner focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all"
                    minHeight="52px"
                />
            </div>
            
            <button 
               onClick={handleSendMessage}
               disabled={(!newMessage.trim() && !selectedFile && !selectedGif) || isSending}
               className="h-[52px] md:h-[58px] px-8 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-[2rem] flex items-center justify-center shadow-xl transition-all active:scale-95 disabled:opacity-20 disabled:scale-100 group shrink-0 mb-1"
            >
               {isSending ? <div className="w-6 h-6 border-2 border-white/30 border-t-white dark:border-slate-300 dark:border-t-slate-950 rounded-full animate-spin" /> : <svg className="w-6 h-6 rotate-90 ml-1 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3.5}><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
            </button>
         </div>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileSelect} />

      <DeleteConfirmationModal 
        isOpen={showLeaveModal} 
        title="LEAVE_CLUSTER" 
        description="Disconnect from this neural hive? You will need a fresh invite sequence to rejoin." 
        onConfirm={handleLeaveCluster} 
        onCancel={() => setShowLeaveModal(false)} 
        confirmText="CONFIRM_EXIT"
      />

      <DeleteConfirmationModal 
        isOpen={!!nodeToRemove} 
        title="EJECT_NODE" 
        description={`Sever access for ${nodeToRemove?.displayName} from this cluster?`} 
        onConfirm={handleConfirmRemoval} 
        onCancel={() => setNodeToRemove(null)} 
        confirmText="EJECT_NODE"
      />

      {(isEmojiPickerOpen || isGiphyPickerOpen) && createPortal(
        <>
          <div className="fixed inset-0 z-[9990] bg-transparent" onClick={() => { setIsEmojiPickerOpen(false); setIsGiphyPickerOpen(false); }} />
          <div className="fixed bottom-36 left-12 z-[9999] animate-in slide-in-from-bottom-8 zoom-in-95 duration-300 origin-bottom-left">
             {isEmojiPickerOpen && <EmojiPicker onSelect={insertEmoji} onClose={() => setIsEmojiPickerOpen(false)} />}
             {isGiphyPickerOpen && <GiphyPicker onSelect={handleGifSelect} onClose={() => setIsGiphyPickerOpen(false)} />}
          </div>
        </>,
        document.body
      )}
    </div>
  );
};
