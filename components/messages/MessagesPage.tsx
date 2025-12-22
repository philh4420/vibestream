
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
  getDocs
} from 'firebase/firestore';
import { User as VibeUser, Message, Chat, Region } from '../../types';
import { ICONS } from '../../constants';

interface MessagesPageProps {
  currentUser: VibeUser;
  locale: Region;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({ currentUser, locale, addToast }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [view, setView] = useState<'list' | 'chat'>('list');
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [foundUsers, setFoundUsers] = useState<VibeUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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
    const existing = chats.find(c => c.participants.includes(targetNode.id));
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
        lastMessageTimestamp: serverTimestamp()
      });
      setSelectedChatId(chatId);
      setView('chat');
      setIsDiscoveryOpen(false);
      addToast("Uplink Established Successfully", "success");
    } catch (e) { addToast("Link Failed", "error"); }
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
      await updateDoc(doc(db, 'chats', selectedChatId), {
        lastMessage: msgText,
        lastMessageTimestamp: serverTimestamp()
      });
      if ('vibrate' in navigator) navigator.vibrate(10);
    } catch (e) { addToast("Transmission Failed", "error"); } finally { setIsSending(false); }
  };

  const activeChat = chats.find(c => c.id === selectedChatId);
  const otherParticipantId = activeChat?.participants.find(id => id !== currentUser.id);
  const otherParticipant = activeChat?.participantData[otherParticipantId || ''];

  return (
    <div className="flex h-[calc(100vh-var(--header-h)-var(--bottom-nav-h)-2rem)] md:h-[calc(100vh-var(--header-h)-4rem)] -mx-4 sm:-mx-6 md:-mx-10 lg:-mx-14 bg-white md:rounded-[3rem] overflow-hidden shadow-heavy relative border border-slate-100 animate-in fade-in duration-500">
      
      {/* 1. NODE LIST / CHAT LIST */}
      <div className={`${view === 'chat' ? 'hidden md:flex' : 'flex'} w-full md:w-[360px] lg:w-[400px] border-r border-slate-50 flex-col bg-white shrink-0`}>
        <div className="p-8 pb-4">
          <div className="flex items-start justify-between mb-8">
             <div>
               <h2 className="text-3xl font-black text-slate-950 tracking-tighter uppercase italic leading-none">Neural_Comms</h2>
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest font-mono mt-2 italic">v2.6.GB Protocol</p>
             </div>
             <button 
               onClick={() => setIsDiscoveryOpen(true)}
               className="w-12 h-12 bg-[#4f46e5] text-white rounded-2xl shadow-[0_10px_30px_rgba(79,70,229,0.3)] flex items-center justify-center hover:bg-indigo-700 transition-all active:scale-90"
             >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3.5"><path d="M12 4.5v15m7.5-7.5h-15" /></svg>
             </button>
          </div>
          
          <div className="relative group mb-4">
             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors scale-90">
               <ICONS.Search />
             </div>
             <input 
               type="text" placeholder="Filter Active Links..." 
               className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-100 transition-all shadow-inner italic placeholder:text-slate-300"
             />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar scroll-container p-4 space-y-3">
          {chats.map(chat => {
            const pId = chat.participants.find(id => id !== currentUser.id);
            const pData = chat.participantData[pId || ''];
            const isActive = selectedChatId === chat.id;
            return (
              <button 
                key={chat.id}
                onClick={() => { setSelectedChatId(chat.id); setView('chat'); }}
                className={`w-full flex items-center gap-4 p-5 rounded-[2rem] transition-all duration-300 relative group ${isActive ? 'bg-white shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)] ring-1 ring-slate-50' : 'hover:bg-slate-50/50'}`}
              >
                {isActive && <div className="absolute left-0 top-6 bottom-6 w-1 bg-[#4f46e5] rounded-r-full" />}
                <div className="relative shrink-0">
                  <img src={pData?.avatarUrl} className="w-12 h-12 rounded-2xl object-cover" alt="" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                </div>
                <div className="text-left overflow-hidden flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <p className={`font-black text-[13px] uppercase tracking-tighter truncate ${isActive ? 'text-indigo-600' : 'text-slate-900'}`}>{pData?.displayName}</p>
                    <span className="text-[9px] font-black text-slate-300 font-mono">
                      {chat.lastMessageTimestamp?.toDate ? chat.lastMessageTimestamp.toDate().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'NOW'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold truncate italic leading-none">{chat.lastMessage}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. CHAT VIEWPORT */}
      <div className={`${view === 'list' ? 'hidden md:flex' : 'flex'} flex-1 flex-col min-w-0 bg-[#fdfdfe] relative`}>
        {activeChat ? (
          <>
            {/* Thread Header */}
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
              <div className="flex items-center gap-5">
                <button onClick={() => setView('list')} className="md:hidden p-3 text-slate-400"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M15 19l-7-7 7-7" /></svg></button>
                <div className="relative">
                  <img src={otherParticipant?.avatarUrl} className="w-14 h-14 rounded-2xl border border-slate-100 shadow-sm" alt="" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-lg" />
                </div>
                <div>
                  <h3 className="font-black text-slate-950 text-xl uppercase tracking-tighter italic leading-none">{otherParticipant?.displayName}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest font-mono">Synchronized_Uplink</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                 <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-indigo-600 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button>
                 <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-slate-950 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5zM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5zM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z" /></svg></button>
              </div>
            </div>

            {/* Signal Feed */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto no-scrollbar scroll-container p-8 space-y-8">
              {messages.map((msg, idx) => {
                const isMe = msg.senderId === currentUser.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                    <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`p-5 rounded-[2rem] text-sm font-bold shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-50 shadow-float'}`}>
                        {msg.text}
                      </div>
                      <span className="text-[8px] font-black text-slate-300 font-mono mt-2 px-2 uppercase tracking-widest">
                        {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'SYNCING'}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Hub */}
            <div className="p-8 border-t border-slate-50 bg-white">
              <form onSubmit={handleSendMessage} className="flex gap-4 items-center">
                <button type="button" className="p-5 bg-slate-50 text-slate-300 rounded-3xl hover:bg-slate-100 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M12 4.5v15m7.5-7.5h-15" /></svg></button>
                <div className="flex-1 bg-slate-50 border border-slate-100 rounded-[2.5rem] px-8 py-4 shadow-inner flex items-center">
                  <input 
                    type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Broadcast your frequency..."
                    className="w-full bg-transparent text-sm font-bold outline-none italic"
                  />
                </div>
                <button 
                  disabled={!newMessage.trim() || isSending}
                  className="px-10 py-5 bg-[#e2e8f0] text-[#94a3b8] rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] transition-all active:scale-95 disabled:opacity-50 italic hover:bg-slate-300 hover:text-slate-600"
                >
                  TRANSMIT
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="relative mb-12 opacity-10">
               <div className="scale-[3] text-slate-900"><ICONS.Search /></div>
            </div>
            <p className="text-[12px] font-black text-slate-300 uppercase tracking-[0.6em] font-mono leading-loose italic">Establish_Initial_Ping</p>
          </div>
        )}
      </div>

      {/* Discovery Modal */}
      {isDiscoveryOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl" onClick={() => setIsDiscoveryOpen(false)}></div>
           <div className="relative bg-white w-full max-w-xl rounded-[3.5rem] p-12 shadow-2xl animate-in zoom-in-95 flex flex-col overflow-hidden">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tighter italic">Node_Registry</h2>
                <button onClick={() => setIsDiscoveryOpen(false)} className="p-3 bg-slate-50 rounded-2xl"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              <input 
                type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus
                placeholder="Identify node handle..."
                className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] px-8 py-5 text-sm font-bold outline-none mb-8 italic"
              />
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 min-h-[300px]">
                {foundUsers.map(user => (
                  <button key={user.id} onClick={() => initiateUplink(user)} className="w-full flex items-center justify-between p-5 bg-slate-50 hover:bg-indigo-50 rounded-3xl transition-all">
                    <div className="flex items-center gap-4">
                      <img src={user.avatarUrl} className="w-10 h-10 rounded-xl" alt="" />
                      <div className="text-left"><p className="font-black text-slate-900 text-sm uppercase italic">{user.displayName}</p><p className="text-[10px] font-mono text-indigo-500 uppercase tracking-widest">@{user.username}</p></div>
                    </div>
                    <div className="p-3 bg-white rounded-xl text-indigo-600 shadow-sm"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M12 4.5v15m7.5-7.5h-15" /></svg></div>
                  </button>
                ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
