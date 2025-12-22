
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
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { User as VibeUser, Message, Chat, Region, WeatherInfo, CallSession } from '../../types';
import { ICONS } from '../../constants';
import { AtmosphericBackground } from './AtmosphericBackground';
import { ClusterCreationModal } from './ClusterCreationModal';

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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!db || !currentUser.id) return;
    const q = query(
      collection(db, 'chats'), 
      where('participants', 'array-contains', currentUser.id),
      orderBy('lastMessageTimestamp', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setChats(snap.docs.map(d => ({ id: d.id, ...d.data() } as Chat)));
    });
    return () => unsub();
  }, [currentUser.id]);

  useEffect(() => {
    if (!db || !selectedChatId) return;
    const q = query(
      collection(db, 'chats', selectedChatId, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(100)
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
    });
    return () => unsub();
  }, [selectedChatId]);

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

  const handleCreateCluster = async (name: string, participants: string[]) => {
    if (!db) return;
    try {
      const clusterId = `cluster_${Math.random().toString(36).substring(2, 11)}`;
      const participantData: any = {
        [currentUser.id]: { displayName: currentUser.displayName, avatarUrl: currentUser.avatarUrl }
      };
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
    if (!activeChat || activeChat.isCluster || !db) return;
    const targetId = activeChat.participants.find(id => id !== currentUser.id);
    if (!targetId) return;

    // Check target status for focal batching
    const targetUser = allUsers.find(u => u.id === targetId);
    if (targetUser?.presenceStatus === 'Deep Work') {
       addToast("Target Node in Deep Work: Neural Links Intercepted", "error");
       return;
    }

    try {
      const callId = `call_${Date.now()}`;
      await setDoc(doc(db, 'calls', callId), {
        callerId: currentUser.id,
        callerName: currentUser.displayName,
        callerAvatar: currentUser.avatarUrl,
        receiverId: targetId,
        status: 'ringing',
        type,
        timestamp: serverTimestamp()
      });
      addToast(`Initiating Neural ${type === 'video' ? 'Optics' : 'Audio'} Link...`, "info");
    } catch (e) { addToast("Call protocol denied", "error"); }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChatId || isSending) return;
    
    // Check recipient status for "Focal Batching"
    const isCluster = activeChat?.isCluster;
    let isBuffered = false;
    if (!isCluster) {
       const otherId = activeChat?.participants.find(p => p !== currentUser.id);
       const targetUser = allUsers.find(u => u.id === otherId);
       if (targetUser?.presenceStatus === 'Deep Work' || targetUser?.presenceStatus === 'Focus') {
          isBuffered = true;
       }
    }

    setIsSending(true);
    try {
      const msgText = newMessage.trim();
      setNewMessage('');
      await addDoc(collection(db, 'chats', selectedChatId, 'messages'), {
        senderId: currentUser.id,
        text: msgText,
        timestamp: serverTimestamp(),
        isRead: false,
        isBuffered
      });
      await updateDoc(doc(db, 'chats', selectedChatId), {
        lastMessage: isBuffered ? 'Packet buffered in Neural Queue.' : msgText,
        lastMessageTimestamp: serverTimestamp()
      });
      
      if (isBuffered) {
         addToast("Recipient in Focal Mode: Signal Buffered", "info");
      } else if ('vibrate' in navigator) {
         navigator.vibrate(10);
      }
    } catch (e) { addToast("Transmission Interrupted", "error"); } finally { setIsSending(false); }
  };

  const activeChat = chats.find(c => c.id === selectedChatId);
  const otherParticipantId = activeChat?.participants.find(id => id !== currentUser.id);
  const otherParticipant = activeChat?.participantData[otherParticipantId || ''];
  const targetUserFull = allUsers.find(u => u.id === otherParticipantId);

  const isDarkAtmos = weather?.condition?.toLowerCase().includes('rain') || weather?.condition?.toLowerCase().includes('storm');

  return (
    <div className="flex h-[calc(100vh-var(--header-h)-var(--bottom-nav-h)-2rem)] md:h-[calc(100vh-var(--header-h)-4rem)] -mx-4 sm:-mx-6 md:-mx-10 lg:-mx-14 bg-white md:rounded-[3rem] overflow-hidden shadow-heavy relative border border-slate-100 animate-in fade-in duration-500">
      
      {/* Sidebar List */}
      <div className={`${view === 'chat' ? 'hidden md:flex' : 'flex'} w-full md:w-[360px] lg:w-[400px] border-r border-slate-50 flex-col bg-white shrink-0 z-20 shadow-xl relative`}>
        <div className="p-8 pb-4">
          <div className="flex items-start justify-between mb-8">
             <div>
               <h2 className="text-3xl font-black text-slate-950 tracking-tighter uppercase italic leading-none">Neural_Hub</h2>
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest font-mono mt-2 italic">v2.6 Infrastructure</p>
             </div>
             <div className="flex gap-2">
                <button 
                  onClick={() => setIsClusterModalOpen(true)}
                  className="w-12 h-12 bg-slate-950 text-white rounded-2xl shadow-xl flex items-center justify-center hover:bg-black transition-all active:scale-90"
                  title="Create Cluster"
                >
                  <ICONS.Clusters />
                </button>
                <button 
                  onClick={() => setIsDiscoveryOpen(true)}
                  className="w-12 h-12 bg-[#4f46e5] text-white rounded-2xl shadow-xl flex items-center justify-center hover:bg-indigo-700 transition-all active:scale-90"
                  title="New Neural Link"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3.5"><path d="M12 4.5v15m7.5-7.5h-15" /></svg>
                </button>
             </div>
          </div>
          
          <div className="relative group mb-4">
             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors scale-90">
               <ICONS.Search />
             </div>
             <input 
               type="text" placeholder="Scan Active Frequencies..." 
               className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-100 transition-all shadow-inner placeholder:text-slate-300"
             />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar scroll-container p-4 space-y-3">
          {chats.map(chat => {
            const isCluster = chat.isCluster;
            const pId = chat.participants.find(id => id !== currentUser.id);
            const pData = isCluster ? { displayName: chat.clusterName, avatarUrl: chat.clusterAvatar } : chat.participantData[pId || ''];
            const isActive = selectedChatId === chat.id;
            return (
              <button 
                key={chat.id}
                onClick={() => { setSelectedChatId(chat.id); setView('chat'); }}
                className={`w-full flex items-center gap-4 p-5 rounded-[2rem] transition-all duration-300 relative group ${isActive ? 'bg-white shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)] ring-1 ring-slate-100' : 'hover:bg-slate-50/50'}`}
              >
                {isActive && <div className="absolute left-0 top-6 bottom-6 w-1 bg-[#4f46e5] rounded-r-full" />}
                <div className="relative shrink-0">
                  <img src={pData?.avatarUrl} className={`w-12 h-12 object-cover ${isCluster ? 'rounded-[1.2rem] ring-2 ring-indigo-500/20' : 'rounded-2xl'}`} alt="" />
                  {!isCluster && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />}
                </div>
                <div className="text-left overflow-hidden flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <p className={`font-black text-[12px] uppercase tracking-tight truncate ${isActive ? 'text-indigo-600' : 'text-slate-900'}`}>{pData?.displayName}</p>
                    <span className="text-[8px] font-black text-slate-300 font-mono">
                      {chat.lastMessageTimestamp?.toDate ? chat.lastMessageTimestamp.toDate().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'NOW'}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold truncate italic leading-none">{chat.lastMessage}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Viewport */}
      <div className={`${view === 'list' ? 'hidden md:flex' : 'flex'} flex-1 flex-col min-w-0 bg-[#fdfdfe] relative`}>
        <AtmosphericBackground weather={weather}>
          {activeChat ? (
            <>
              {/* Header */}
              <div className={`px-8 py-6 border-b flex items-center justify-between backdrop-blur-3xl sticky top-0 z-20 ${isDarkAtmos ? 'bg-black/20 border-white/5' : 'bg-white/60 border-slate-50'}`}>
                <div className="flex items-center gap-5">
                  <button onClick={() => setView('list')} className={`md:hidden p-3 ${isDarkAtmos ? 'text-white/40' : 'text-slate-400'}`}><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M15 19l-7-7 7-7" /></svg></button>
                  <div className="relative">
                    <img 
                      src={activeChat.isCluster ? activeChat.clusterAvatar : otherParticipant?.avatarUrl} 
                      className={`w-14 h-14 border shadow-sm ${activeChat.isCluster ? 'rounded-[1.4rem] border-indigo-500/20' : 'rounded-2xl border-white/10'}`} 
                      alt="" 
                    />
                    {!activeChat.isCluster && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-lg" />
                    )}
                  </div>
                  <div>
                    <h3 className={`font-black text-xl uppercase tracking-tighter italic leading-none ${isDarkAtmos ? 'text-white' : 'text-slate-950'}`}>
                      {activeChat.isCluster ? activeChat.clusterName : otherParticipant?.displayName}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      {targetUserFull?.presenceStatus === 'Deep Work' ? (
                        <>
                          <div className="w-1.5 h-1.5 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                          <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest font-mono">Buffer_Active: Focal_Sync</p>
                        </>
                      ) : (
                        <>
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                          <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest font-mono">Grid_Uplink: Established</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   {!activeChat.isCluster && (
                     <>
                       <button onClick={() => handleStartCall('voice')} className={`p-3 rounded-xl transition-all ${isDarkAtmos ? 'bg-white/5 text-white/40 hover:text-indigo-400' : 'bg-slate-50 text-slate-400 hover:text-indigo-600'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg></button>
                       <button onClick={() => handleStartCall('video')} className={`p-3 rounded-xl transition-all ${isDarkAtmos ? 'bg-white/5 text-white/40 hover:text-indigo-400' : 'bg-slate-50 text-slate-400 hover:text-indigo-600'}`}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg></button>
                     </>
                   )}
                   <button className={`p-3 rounded-xl transition-all ${isDarkAtmos ? 'bg-white/5 text-white/40 hover:text-white' : 'bg-slate-50 text-slate-400 hover:text-slate-950'}`}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5zM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5zM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z" /></svg></button>
                </div>
              </div>

              {/* Messages */}
              <div ref={chatScrollRef} className="flex-1 overflow-y-auto no-scrollbar scroll-container p-8 space-y-8">
                {messages.map((msg, idx) => {
                  const isMe = msg.senderId === currentUser.id;
                  const senderP = activeChat.participantData[msg.senderId];
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                      <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        {!isMe && activeChat.isCluster && (
                          <div className="flex items-center gap-2 mb-2 ml-1">
                             <img src={senderP?.avatarUrl} className="w-5 h-5 rounded-lg object-cover" alt="" />
                             <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{senderP?.displayName}</span>
                          </div>
                        )}
                        <div className={`p-5 rounded-[2rem] text-sm font-bold shadow-sm backdrop-blur-xl relative group ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : isDarkAtmos ? 'bg-white/5 text-white border border-white/10 rounded-tl-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-50 shadow-float'}`}>
                          {msg.text}
                          {msg.isBuffered && (
                             <div className="absolute -right-3 -top-3 w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-lg border-2 border-white animate-pulse">
                               <ICONS.Temporal />
                             </div>
                          )}
                        </div>
                        <span className={`text-[8px] font-black font-mono mt-2 px-2 uppercase tracking-widest ${isDarkAtmos ? 'text-white/20' : 'text-slate-300'}`}>
                          {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'SYNCING'}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className={`p-8 border-t backdrop-blur-3xl ${isDarkAtmos ? 'bg-black/20 border-white/5' : 'bg-white border-slate-50'}`}>
                <form onSubmit={handleSendMessage} className="flex gap-4 items-center">
                  <div className={`flex-1 border rounded-[2.5rem] px-8 py-4 shadow-inner flex items-center transition-all ${isDarkAtmos ? 'bg-white/5 border-white/10 focus-within:border-indigo-500' : 'bg-slate-50 border-slate-100 focus-within:border-indigo-100'}`}>
                    <input 
                      type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={targetUserFull?.presenceStatus === 'Deep Work' ? "Recipient is focal. Message will be buffered." : "Transmit your frequency..."}
                      className={`w-full bg-transparent text-sm font-bold outline-none italic ${isDarkAtmos ? 'text-white placeholder:text-white/10' : 'text-slate-900 placeholder:text-slate-300'}`}
                    />
                  </div>
                  <button 
                    disabled={!newMessage.trim() || isSending}
                    className={`px-10 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] transition-all active:scale-95 disabled:opacity-50 italic ${newMessage.trim() ? 'bg-indigo-600 text-white shadow-xl' : isDarkAtmos ? 'bg-white/5 text-white/20' : 'bg-slate-100 text-slate-300'}`}
                  >
                    TRANSMIT
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="relative mb-12 opacity-10">
                 <div className={`scale-[3] ${isDarkAtmos ? 'text-white' : 'text-slate-900'}`}><ICONS.Messages /></div>
              </div>
              <p className={`text-[12px] font-black uppercase tracking-[0.6em] font-mono leading-loose italic ${isDarkAtmos ? 'text-white/20' : 'text-slate-300'}`}>ESTABLISH_NEURAL_LINK</p>
            </div>
          )}
        </AtmosphericBackground>
      </div>

      {/* Direct Link Discovery */}
      {isDiscoveryOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl" onClick={() => setIsDiscoveryOpen(false)}></div>
           <div className="relative bg-white w-full max-w-xl rounded-[3.5rem] p-12 shadow-2xl animate-in zoom-in-95 flex flex-col overflow-hidden h-[70vh]">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tighter italic">Node_Scan</h2>
                <button onClick={() => setIsDiscoveryOpen(false)} className="p-3 bg-slate-50 rounded-2xl"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              <input 
                type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus
                placeholder="Identify peer identifier..."
                className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] px-8 py-5 text-sm font-bold outline-none mb-8 italic"
              />
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 scroll-container">
                {allUsers.filter(u => u.id !== currentUser.id && (u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || u.username.toLowerCase().includes(searchQuery.toLowerCase()))).map(user => (
                  <button key={user.id} onClick={() => initiateUplink(user)} className="w-full flex items-center justify-between p-5 bg-slate-50 hover:bg-white hover:shadow-xl rounded-3xl transition-all border border-transparent hover:border-slate-100 group">
                    <div className="flex items-center gap-4">
                      <img src={user.avatarUrl} className="w-12 h-12 rounded-2xl group-hover:scale-105 transition-transform" alt="" />
                      <div className="text-left"><p className="font-black text-slate-900 text-sm uppercase italic">{user.displayName}</p><p className="text-[10px] font-mono text-indigo-500 uppercase tracking-widest">@{user.username}</p></div>
                    </div>
                    <div className="p-3 bg-white rounded-xl text-indigo-600 shadow-sm"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M12 4.5v15m7.5-7.5h-15" /></svg></div>
                  </button>
                ))}
              </div>
           </div>
        </div>
      )}

      {/* Cluster Creation */}
      {isClusterModalOpen && (
        <ClusterCreationModal 
          currentUser={currentUser} 
          availableNodes={allUsers.filter(u => u.id !== currentUser.id)}
          onClose={() => setIsClusterModalOpen(false)}
          onConfirm={handleCreateCluster}
        />
      )}
    </div>
  );
};
