
import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  getDocs,
  Timestamp,
  updateDoc,
  setDoc
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

  // 1. Initialise Neural Link Registry (Chats)
  useEffect(() => {
    if (!db || !currentUser.id) return;
    
    const q = query(
      collection(db, 'chats'), 
      where('participants', 'array-contains', currentUser.id),
      orderBy('lastMessageTimestamp', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const chatData = snap.docs.map(d => ({ id: d.id, ...d.data() } as Chat));
      setChats(chatData);
    });

    return () => unsub();
  }, [currentUser.id]);

  // 2. Initialise Signal Feed for Active Link (Messages)
  useEffect(() => {
    if (!db || !selectedChatId) return;

    const q = query(
      collection(db, 'chats', selectedChatId, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
      // Scroll protocol with smooth easing
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    });

    return () => unsub();
  }, [selectedChatId]);

  // 3. Start New Neural Link (Discovery)
  const handleStartDiscovery = async () => {
    setIsDiscoveryOpen(true);
    addToast("Scanning Grid for Nodes...", "info");
  };

  useEffect(() => {
    if (!searchQuery.trim() || !isDiscoveryOpen) {
      setFoundUsers([]);
      return;
    }
    const delay = setTimeout(async () => {
      setIsSearching(true);
      try {
        const q = query(collection(db, 'users'), limit(20));
        const snap = await getDocs(q);
        const users = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as VibeUser))
          .filter(u => 
            u.id !== currentUser.id && 
            (u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
             u.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
          );
        setFoundUsers(users);
      } catch (e) {
        addToast("Registry Scan Interrupted", "error");
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(delay);
  }, [searchQuery, isDiscoveryOpen, currentUser.id]);

  const initiateUplink = async (targetNode: VibeUser) => {
    if (!db) return;
    
    // Check for existing link first
    const existing = chats.find(c => c.participants.includes(targetNode.id));
    if (existing) {
      setSelectedChatId(existing.id);
      setView('chat');
      setIsDiscoveryOpen(false);
      return;
    }

    addToast(`Initialising Link with ${targetNode.displayName}...`, "info");
    try {
      const chatId = [currentUser.id, targetNode.id].sort().join('_');
      const chatRef = doc(db, 'chats', chatId);
      
      await setDoc(chatRef, {
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
    } catch (e) {
      addToast("Link Establishment Failed", "error");
    }
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
      
      // Haptic confirmation
      if ('vibrate' in navigator) navigator.vibrate(15);
    } catch (e) {
      addToast("Packet Loss: Delivery Failed", "error");
    } finally {
      setIsSending(false);
    }
  };

  const activeChat = chats.find(c => c.id === selectedChatId);
  const otherParticipantId = activeChat?.participants.find(id => id !== currentUser.id);
  const otherParticipant = activeChat?.participantData[otherParticipantId || ''];

  return (
    <div className="flex h-[calc(100vh-var(--header-h)-var(--bottom-nav-h)-2rem)] md:h-[calc(100vh-var(--header-h)-4rem)] -mx-4 sm:-mx-6 md:-mx-10 lg:-mx-14 bg-white border border-slate-100 overflow-hidden md:rounded-[3rem] animate-in fade-in duration-700 shadow-heavy relative">
      
      {/* 1. NODE LIST / CHAT LIST (Mobile Sidebar) */}
      <div className={`${view === 'chat' ? 'hidden md:flex' : 'flex'} w-full md:w-[380px] lg:w-[420px] border-r border-slate-50 flex-col bg-slate-50/40 relative z-10`}>
        <div className="p-6 lg:p-10 border-b border-slate-100 shrink-0 bg-white/50 backdrop-blur-md">
          <div className="flex items-center justify-between mb-8">
             <div>
               <h2 className="text-2xl lg:text-3xl font-black text-slate-950 tracking-tighter uppercase italic leading-none">Neural_Comms</h2>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mt-2">v2.6.GB Protocol</p>
             </div>
             <button 
               onClick={handleStartDiscovery}
               className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-90 group"
             >
               <div className="group-hover:rotate-90 transition-transform duration-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M12 4.5v15m7.5-7.5h-15" /></svg>
               </div>
             </button>
          </div>
          
          <div className="relative group">
             <input 
               type="text" placeholder="Filter Active Links..." 
               className="w-full bg-white border border-slate-200 rounded-2xl px-12 py-4 text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all shadow-inner italic"
             />
             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
               <ICONS.Search />
             </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar scroll-container p-4 space-y-2">
          {chats.length > 0 ? (
            chats.map(chat => {
              const pId = chat.participants.find(id => id !== currentUser.id);
              const pData = chat.participantData[pId || ''];
              const isActive = selectedChatId === chat.id;
              
              return (
                <button 
                  key={chat.id}
                  onClick={() => { setSelectedChatId(chat.id); setView('chat'); }}
                  className={`w-full flex items-center gap-4 p-5 rounded-[2rem] transition-all duration-300 group relative overflow-hidden ${isActive ? 'bg-white shadow-xl ring-1 ring-slate-100' : 'hover:bg-white/60'}`}
                >
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-600 rounded-r-full" />}
                  <div className="relative shrink-0">
                    <img src={pData?.avatarUrl} className={`w-14 h-14 rounded-2xl object-cover shadow-sm transition-transform duration-500 ${isActive ? 'scale-105' : 'group-hover:scale-105'}`} alt="" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
                  </div>
                  <div className="text-left overflow-hidden flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <p className={`font-black text-[12px] uppercase tracking-tighter truncate ${isActive ? 'text-indigo-700' : 'text-slate-900'}`}>{pData?.displayName}</p>
                      <span className="text-[8px] font-black text-slate-300 font-mono">
                        {chat.lastMessageTimestamp?.toDate ? chat.lastMessageTimestamp.toDate().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'NOW'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold truncate italic leading-none">{chat.lastMessage || 'Waiting for signal...'}</p>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="py-20 text-center opacity-20 flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-200 rounded-[1.8rem] flex items-center justify-center mb-4"><ICONS.Messages /></div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] font-mono">No_Links_Found</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. CHAT VIEWPORT (Main Interface) */}
      <div className={`${view === 'list' ? 'hidden md:flex' : 'flex'} flex-1 flex-col min-w-0 bg-white relative`}>
        {activeChat ? (
          <>
            {/* Thread Header */}
            <div className="p-6 md:p-10 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-md sticky top-0 z-20">
              <div className="flex items-center gap-4 lg:gap-6">
                <button 
                  onClick={() => setView('list')}
                  className="md:hidden p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 active:scale-90 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="relative">
                  <img src={otherParticipant?.avatarUrl} className="w-12 h-12 lg:w-16 lg:h-16 rounded-2xl shadow-lg border border-slate-100" alt="" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-lg" />
                </div>
                <div>
                  <h3 className="font-black text-slate-950 text-base lg:text-2xl uppercase tracking-tighter italic leading-none">{otherParticipant?.displayName}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest font-mono">Synchronized_Uplink</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                 <button className="hidden sm:flex p-3.5 bg-slate-50 text-slate-400 rounded-xl hover:text-indigo-600 hover:bg-white hover:shadow-lg transition-all active:scale-90 border border-transparent hover:border-indigo-100">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                 </button>
                 <button className="p-3.5 bg-slate-50 text-slate-400 rounded-xl hover:text-slate-900 transition-all active:scale-90">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5zM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5zM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z" /></svg>
                 </button>
              </div>
            </div>

            {/* Signal Feed */}
            <div 
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto no-scrollbar scroll-container p-6 lg:p-12 space-y-8 bg-white/40"
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-10 text-center scale-150">
                  <div className="w-20 h-20 bg-slate-100 rounded-[2.5rem] flex items-center justify-center mb-6"><ICONS.Explore /></div>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] font-mono">Establish_Initial_Ping</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.senderId === currentUser.id;
                  const nextIsMe = messages[idx+1]?.senderId === currentUser.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-500`}>
                      <div className={`max-w-[85%] md:max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`p-5 lg:p-7 rounded-[2.5rem] text-sm lg:text-base font-bold leading-relaxed shadow-float ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100'}`}>
                          {msg.text}
                        </div>
                        <div className={`flex items-center gap-2 mt-2 px-4 transition-opacity duration-500 ${nextIsMe ? 'opacity-0' : 'opacity-40'}`}>
                           <span className="text-[8px] font-black text-slate-400 font-mono">
                             {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'SYNCING'}
                           </span>
                           {isMe && (
                             <div className="flex gap-0.5">
                               <div className="w-1 h-1 bg-indigo-500 rounded-full" />
                               <div className="w-1 h-1 bg-indigo-500 rounded-full" />
                             </div>
                           )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Console */}
            <div className="p-6 md:p-10 border-t border-slate-100 bg-white/50 backdrop-blur-md shrink-0">
              <form onSubmit={handleSendMessage} className="flex gap-4 lg:gap-6 relative">
                <button 
                  type="button"
                  className="p-5 bg-slate-50 text-slate-400 rounded-2xl hover:text-indigo-600 hover:bg-white hover:shadow-lg transition-all active:scale-90 border border-transparent"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M12 4.5v15m7.5-7.5h-15" /></svg>
                </button>
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Broadcast your frequency..."
                  className="flex-1 bg-slate-50 border border-slate-100 rounded-[2rem] px-8 py-5 text-sm lg:text-lg font-black italic outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-inner placeholder:text-slate-200"
                />
                <button 
                  disabled={!newMessage.trim() || isSending}
                  className="px-8 lg:px-12 bg-slate-950 text-white rounded-[2rem] font-black text-[10px] lg:text-[12px] uppercase tracking-[0.4em] hover:bg-black transition-all active:scale-90 disabled:opacity-20 shadow-heavy italic flex items-center justify-center gap-3"
                >
                  {isSending ? '...' : (
                    <>
                      TRANSMIT
                      <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </>
                  )}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/20">
            <div className="relative mb-12">
               <div className="absolute inset-0 bg-indigo-500/5 blur-[100px] rounded-full animate-pulse" />
               <div className="w-32 h-32 lg:w-44 lg:h-44 bg-white rounded-[4rem] flex items-center justify-center shadow-2xl relative z-10 border border-slate-100 group">
                 <div className="scale-[2.5] text-slate-100 group-hover:text-indigo-500/20 transition-colors duration-1000">
                    <ICONS.Messages />
                 </div>
               </div>
            </div>
            <h3 className="text-3xl lg:text-5xl font-black text-slate-950 tracking-tighter uppercase italic mb-4">Neural_Silence</h3>
            <p className="text-[12px] lg:text-[14px] font-black text-slate-400 uppercase tracking-[0.6em] font-mono max-w-sm mx-auto leading-loose italic">Awaiting primary data synchronization with active grid nodes.</p>
            <button 
              onClick={handleStartDiscovery}
              className="mt-12 px-12 py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(79,70,229,0.3)] hover:bg-indigo-700 transition-all active:scale-95 italic"
            >
              ESTABLISH_NEW_LINK
            </button>
          </div>
        )}
      </div>

      {/* 3. DISCOVERY MODAL OVERLAY */}
      {isDiscoveryOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl" onClick={() => setIsDiscoveryOpen(false)}></div>
           <div className="relative bg-white w-full max-w-2xl h-[80vh] md:h-auto md:max-h-[70vh] rounded-[3.5rem] shadow-[0_60px_150px_-30px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden border border-white/20 animate-in zoom-in-95 duration-500">
              
              <div className="p-8 md:p-12 border-b border-slate-50 bg-white sticky top-0 z-10">
                 <div className="flex justify-between items-center mb-10">
                    <div>
                      <h2 className="text-3xl font-black text-slate-950 tracking-tighter uppercase italic leading-none">Node_Search</h2>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mt-3">Registry Protocol: v2.6.GRID</p>
                    </div>
                    <button 
                      onClick={() => setIsDiscoveryOpen(false)}
                      className="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all active:scale-90"
                    >
                       <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                 </div>
                 
                 <div className="relative group">
                    <input 
                      autoFocus type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Identify node by alias or handle..." 
                      className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] px-14 py-6 text-base font-black italic outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 focus:bg-white transition-all shadow-inner" 
                    />
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors">
                       {isSearching ? <div className="w-5 h-5 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" /> : <ICONS.Search />}
                    </div>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-12 space-y-4 bg-white/40 scroll-container">
                 {foundUsers.length > 0 ? (
                   foundUsers.map(user => (
                     <button 
                       key={user.id}
                       onClick={() => initiateUplink(user)}
                       className="w-full flex items-center justify-between p-6 bg-slate-50 hover:bg-white hover:shadow-2xl hover:border-indigo-100 rounded-[2.2rem] transition-all border border-transparent group active:scale-[0.98]"
                     >
                       <div className="flex items-center gap-6">
                          <img src={user.avatarUrl} className="w-16 h-16 rounded-[1.5rem] object-cover border-2 border-white shadow-md transition-transform group-hover:scale-110" alt="" />
                          <div className="text-left">
                             <p className="text-lg font-black text-slate-950 uppercase italic tracking-tighter leading-none mb-1.5">{user.displayName}</p>
                             <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest font-mono">@{user.username}</p>
                          </div>
                       </div>
                       <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
                       </div>
                     </button>
                   ))
                 ) : searchQuery && !isSearching ? (
                   <div className="py-20 text-center opacity-20 flex flex-col items-center">
                     <div className="w-20 h-20 bg-slate-100 rounded-[2.5rem] flex items-center justify-center mb-6 scale-150"><ICONS.Search /></div>
                     <p className="text-[12px] font-black uppercase tracking-[0.4em] font-mono italic">No_Nodes_In_Range</p>
                   </div>
                 ) : !searchQuery && (
                   <div className="py-20 text-center opacity-10 flex flex-col items-center">
                     <p className="text-[10px] font-black uppercase tracking-[0.6em] font-mono italic">Initiate Registry Query...</p>
                   </div>
                 )}
              </div>

              <div className="p-10 border-t border-slate-50 bg-slate-50/50 flex justify-between items-center shrink-0">
                 <div className="flex gap-2">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse shadow-indigo-200" />
                    <div className="w-2 h-2 bg-indigo-600/30 rounded-full" />
                    <div className="w-2 h-2 bg-indigo-600/10 rounded-full" />
                 </div>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono italic">GRID_STATUS: ENCRYPTED</span>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
