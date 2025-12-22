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
  updateDoc,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { User as VibeUser, Message, Chat, Region, WeatherInfo } from '../../types';
import { ICONS } from '../../constants';
import { AtmosphericBackground } from './AtmosphericBackground';
import { ClusterCreationModal } from './ClusterCreationModal';
import { DeleteConfirmationModal } from '../ui/DeleteConfirmationModal';

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
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);
  const [isClusterModalOpen, setIsClusterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [terminationTarget, setTerminationTarget] = useState<{ type: 'message' | 'chat', id: string, label: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

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

  const initiateUplink = async (targetNode: VibeUser) => {
    if (!db) return;
    const existing = chats.find(c => !c.isCluster && c.participants.includes(targetNode.id));
    if (existing) {
      setSelectedChatId(existing.id);
      setView('chat');
      setIsDiscoveryOpen(false);
      return;
    }
    try {
      const chatId = [currentUser.id, targetNode.id].sort().join('_');
      await setDoc(doc(db, 'chats', chatId), {
        participants: [currentUser.id, targetNode.id],
        participantData: {
          [currentUser.id]: { displayName: currentUser.displayName, avatarUrl: currentUser.avatarUrl },
          [targetNode.id]: { displayName: targetNode.displayName, avatarUrl: targetNode.avatarUrl }
        },
        lastMessage: 'Neural link established.',
        lastMessageTimestamp: serverTimestamp(),
        isCluster: false
      });
      setSelectedChatId(chatId);
      setView('chat');
      setIsDiscoveryOpen(false);
      addToast("Neural Direct Link Established", "success");
    } catch (e) { addToast("Link Handshake Failed", "error"); }
  };

  const handleExecuteTermination = async () => {
    if (!db || !terminationTarget) return;
    try {
      if (terminationTarget.type === 'message' && selectedChatId) {
        await deleteDoc(doc(db, 'chats', selectedChatId, 'messages', terminationTarget.id));
      } else if (terminationTarget.type === 'chat') {
        await deleteDoc(doc(db, 'chats', terminationTarget.id));
        if (selectedChatId === terminationTarget.id) { setSelectedChatId(null); setView('list'); }
      }
      addToast("Packet Purged", "success");
    } catch (e) { addToast("Termination Protocol Failed", "error"); } finally { setTerminationTarget(null); }
  };

  const handleStartCall = async (type: 'voice' | 'video') => {
    if (!activeChat || activeChat.isCluster || !db) return;
    const targetId = activeChat.participants.find(id => id !== currentUser.id);
    if (!targetId) return;
    const targetUser = allUsers.find(u => u.id === targetId);
    
    // Safety check for presence status before initiation
    if (!targetUser || targetUser.presenceStatus === 'Away' || targetUser.presenceStatus === 'Invisible') {
       addToast(`Target node is currently ${targetUser?.presenceStatus || 'Offline'}. Link refused.`, "error");
       return;
    }
    
    try {
      const callId = `call_${Date.now()}_${currentUser.id.slice(0,4)}`;
      await setDoc(doc(db, 'calls', callId), {
        callerId: currentUser.id,
        callerName: currentUser.displayName,
        callerAvatar: currentUser.avatarUrl,
        receiverId: targetId,
        receiverName: targetUser.displayName,
        receiverAvatar: targetUser.avatarUrl,
        status: 'ringing',
        type,
        timestamp: serverTimestamp()
      });
      addToast(`Initiating Neural ${type.toUpperCase()} Protocol...`, "info");
    } catch (e) { addToast("Call protocol handshake denied", "error"); }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChatId || isSending) return;
    setIsSending(true);
    try {
      const msgText = newMessage.trim();
      setNewMessage('');
      await addDoc(collection(db, 'chats', selectedChatId, 'messages'), {
        senderId: currentUser.id,
        text: msgText,
        timestamp: serverTimestamp(),
        isRead: false
      });
      await updateDoc(doc(db, 'chats', selectedChatId), { lastMessage: msgText, lastMessageTimestamp: serverTimestamp() });
    } catch (e) { addToast("Transmission Interrupted", "error"); } finally { setIsSending(false); }
  };

  const activeChat = chats.find(c => c.id === selectedChatId);
  const otherParticipantId = activeChat?.participants.find(id => id !== currentUser.id);
  const otherParticipant = activeChat?.participantData[otherParticipantId || ''];
  const targetUserFull = allUsers.find(u => u.id === otherParticipantId);

  return (
    <div className="flex h-[calc(100vh-var(--header-h)-var(--bottom-nav-h)-2rem)] md:h-[calc(100vh-var(--header-h)-4rem)] -mx-4 sm:-mx-6 md:-mx-10 lg:-mx-14 bg-white md:rounded-[3rem] overflow-hidden shadow-heavy relative border border-slate-100 animate-in fade-in duration-500">
      <div className={`${view === 'chat' ? 'hidden md:flex' : 'flex'} w-full md:w-[360px] lg:w-[400px] border-r border-slate-50 flex-col bg-white shrink-0 z-20 shadow-xl relative`}>
        <div className="p-8 pb-4">
          <div className="flex items-start justify-between mb-8">
             <div>
               <h2 className="text-3xl font-black text-slate-950 tracking-tighter uppercase italic leading-none">Neural_Hub</h2>
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest font-mono mt-2 italic">v2.6 Infrastructure</p>
             </div>
             <div className="flex gap-2">
                <button onClick={() => setIsClusterModalOpen(true)} className="w-12 h-12 bg-slate-950 text-white rounded-2xl shadow-xl flex items-center justify-center hover:bg-black transition-all active:scale-90"><ICONS.Clusters /></button>
                <button onClick={() => setIsDiscoveryOpen(true)} className="w-12 h-12 bg-[#4f46e5] text-white rounded-2xl shadow-xl flex items-center justify-center hover:bg-indigo-700 transition-all active:scale-90"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3.5"><path d="M12 4.5v15m7.5-7.5h-15" /></svg></button>
             </div>
          </div>
          <div className="relative group mb-4">
             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 scale-90"><ICONS.Search /></div>
             <input type="text" placeholder="Scan Frequencies..." className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-inner placeholder:text-slate-300" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar scroll-container p-4 space-y-3">
          {chats.map(chat => {
            const isCluster = chat.isCluster;
            const pId = chat.participants.find(id => id !== currentUser.id);
            const pData = isCluster ? { displayName: chat.clusterName, avatarUrl: chat.clusterAvatar } : chat.participantData[pId || ''];
            const isActive = selectedChatId === chat.id;
            return (
              <div key={chat.id} className="relative group">
                <button onClick={() => { setSelectedChatId(chat.id); setView('chat'); }} className={`w-full flex items-center gap-4 p-5 rounded-[2rem] transition-all duration-300 relative group ${isActive ? 'bg-white shadow-xl ring-1 ring-slate-100' : 'hover:bg-slate-50/50'}`}>
                  {isActive && <div className="absolute left-0 top-6 bottom-6 w-1 bg-[#4f46e5] rounded-r-full" />}
                  <img src={pData?.avatarUrl} className={`w-12 h-12 object-cover ${isCluster ? 'rounded-[1.2rem] ring-2 ring-indigo-500/20' : 'rounded-2xl'}`} alt="" />
                  <div className="text-left overflow-hidden flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <p className={`font-black text-[12px] uppercase tracking-tight truncate ${isActive ? 'text-indigo-600' : 'text-slate-900'}`}>{pData?.displayName}</p>
                      <span className="text-[8px] font-black text-slate-300 font-mono">{chat.lastMessageTimestamp?.toDate ? chat.lastMessageTimestamp.toDate().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'NOW'}</span>
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold truncate italic leading-none">{chat.lastMessage}</p>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className={`${view === 'list' ? 'hidden md:flex' : 'flex'} flex-1 flex-col min-w-0 bg-[#fdfdfe] relative`}>
        <AtmosphericBackground weather={weather}>
          {activeChat ? (
            <>
              <div className="px-8 py-6 border-b flex items-center justify-between backdrop-blur-3xl sticky top-0 z-20 bg-white/60 border-slate-50">
                <div className="flex items-center gap-5">
                  <button onClick={() => setView('list')} className="md:hidden p-3 text-slate-400"><svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg></button>
                  <img src={activeChat.isCluster ? activeChat.clusterAvatar : otherParticipant?.avatarUrl} className={`w-14 h-14 border shadow-sm ${activeChat.isCluster ? 'rounded-[1.4rem]' : 'rounded-2xl'}`} alt="" />
                  <div>
                    <h3 className="font-black text-xl uppercase tracking-tighter italic leading-none text-slate-950">{activeChat.isCluster ? activeChat.clusterName : otherParticipant?.displayName}</h3>
                    <div className="flex items-center gap-2 mt-2">
                       <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${targetUserFull?.presenceStatus === 'Online' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                       <p className="text-[9px] font-black uppercase tracking-widest font-mono text-slate-400">{targetUserFull?.presenceStatus || 'Offline'}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   {!activeChat.isCluster && (
                     <div className="flex bg-slate-100 p-1.5 rounded-[1.8rem] gap-1.5 shadow-inner border border-slate-200">
                       <button onClick={() => handleStartCall('voice')} className="p-3 bg-white hover:bg-indigo-50 text-indigo-600 rounded-2xl transition-all shadow-sm flex flex-col items-center gap-1 group active:scale-90">
                         <svg className="w-6 h-6 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                         <span className="text-[7px] font-black uppercase tracking-widest opacity-60">Voice_Only</span>
                       </button>
                       <button onClick={() => handleStartCall('video')} className="p-3 bg-white hover:bg-emerald-50 text-emerald-600 rounded-2xl transition-all shadow-sm flex flex-col items-center gap-1 group active:scale-90">
                         <svg className="w-6 h-6 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>
                         <span className="text-[7px] font-black uppercase tracking-widest opacity-60">Video_Sync</span>
                       </button>
                     </div>
                   )}
                   <button onClick={() => setTerminationTarget({ type: 'chat', id: activeChat.id, label: activeChat.isCluster ? 'Cluster' : 'Link' })} className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-90"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
              </div>
              <div ref={chatScrollRef} className="flex-1 overflow-y-auto no-scrollbar scroll-container p-8 space-y-6">
                {messages.map((msg, idx) => {
                  const isMe = msg.senderId === currentUser.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group/msg`}>
                      <div className={`max-w-[75%] p-5 rounded-[2rem] text-sm font-bold shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-50'}`}>
                        {msg.text}
                        <div className={`text-[7px] font-black uppercase mt-2 opacity-40 ${isMe ? 'text-right' : 'text-left'}`}>
                          {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'SYNCING'}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-8 border-t bg-white/80 backdrop-blur-md border-slate-50">
                <form onSubmit={handleSendMessage} className="flex gap-4">
                  <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Transmit..." className="flex-1 bg-slate-50 border border-slate-100 rounded-[1.8rem] px-8 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none" />
                  <button disabled={!newMessage.trim() || isSending} className="px-10 py-4 bg-slate-950 text-white rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all active:scale-95 disabled:opacity-30 italic">SEND</button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-20"><div className="scale-[3] mb-12"><ICONS.Messages /></div><p className="text-[10px] font-black uppercase tracking-[0.5em] font-mono italic">ESTABLISH_NEURAL_LINK</p></div>
          )}
        </AtmosphericBackground>
      </div>

      <DeleteConfirmationModal isOpen={!!terminationTarget} title="PROTOCOL_ALERT" description={`Terminate link?`} onConfirm={handleExecuteTermination} onCancel={() => setTerminationTarget(null)} />
    </div>
  );
};