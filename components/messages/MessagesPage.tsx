
import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  addDoc,
  serverTimestamp
} = Firestore as any;
import { User as VibeUser, Chat, Region, WeatherInfo } from '../../types';
import { ICONS } from '../../constants';
import { AtmosphericBackground } from './AtmosphericBackground';
import { DirectChatInterface } from './DirectChatInterface';

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
  const [view, setView] = useState<'list' | 'chat'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!db || !currentUser.id) return;
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', currentUser.id), orderBy('lastMessageTimestamp', 'desc'));
    const unsub = onSnapshot(q, (snap: any) => {
      // STRICT FILTER: Only allow non-cluster chats (1-to-1) in Neural Comms
      const fetchedChats = snap.docs
        .map((d: any) => ({ id: d.id, ...d.data() } as Chat))
        .filter((c: Chat) => !c.isCluster);
        
      setChats(fetchedChats);
    });
    return () => unsub();
  }, [currentUser.id]);

  const handleStartChat = async (targetUser: VibeUser) => {
    // 1. Check local state for existing chat
    const existingChat = chats.find(c => c.participants.includes(targetUser.id));
    
    if (existingChat) {
      setSelectedChatId(existingChat.id);
      setSearchQuery(''); // Clear search
      setView('chat');
      return;
    }

    // 2. Create new chat if none exists
    setIsCreating(true);
    try {
      const participantData = {
        [currentUser.id]: { displayName: currentUser.displayName, avatarUrl: currentUser.avatarUrl },
        [targetUser.id]: { displayName: targetUser.displayName, avatarUrl: targetUser.avatarUrl }
      };

      const docRef = await addDoc(collection(db, 'chats'), {
        participants: [currentUser.id, targetUser.id],
        participantData,
        lastMessage: 'Link established.',
        lastMessageTimestamp: serverTimestamp(),
        isCluster: false
      });

      // Optimistically select the new chat ID (Firestore listener will catch up shortly)
      setSelectedChatId(docRef.id);
      setSearchQuery('');
      setView('chat');
      addToast("Neural Link Established", "success");
    } catch (error) {
      addToast("Failed to establish link", "error");
    } finally {
      setIsCreating(false);
    }
  };

  const filteredUsers = searchQuery.trim() 
    ? allUsers.filter(u => 
        u.id !== currentUser.id && 
        (u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
         u.username.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const activeChat = chats.find(c => c.id === selectedChatId);
  
  const PRESENCE_AURA: Record<string, string> = {
    'Online': 'shadow-[0_0_15px_rgba(16,185,129,0.4)] bg-[#10b981]',
    'Focus': 'shadow-[0_0_15px_rgba(245,158,11,0.4)] bg-[#f59e0b]',
    'Deep Work': 'shadow-[0_0_15px_rgba(225,29,72,0.4)] bg-[#e11d48]',
    'Away': 'bg-[#94a3b8]',
    'Syncing': 'bg-[#60a5fa] animate-pulse'
  };

  return (
    <div className="flex h-[calc(100vh-var(--header-h)-var(--bottom-nav-h)-1rem)] md:h-[calc(100vh-var(--header-h)-3rem)] -mx-4 sm:-mx-6 md:-mx-10 lg:-mx-14 bg-[#fcfcfd] md:rounded-[3.5rem] overflow-hidden shadow-heavy relative border border-slate-100 animate-in fade-in duration-700">
      
      {/* SIDEBAR: CONTACTS FEED (1-to-1 Only) */}
      <div className={`${view === 'chat' ? 'hidden md:flex' : 'flex'} w-full md:w-[380px] lg:w-[420px] border-r border-slate-50 flex-col bg-white shrink-0 z-20 relative overflow-hidden`}>
        <div className="p-8 pb-4">
          <div className="flex items-center justify-between mb-8">
             <div className="flex flex-col">
               <h2 className="text-3xl font-black text-slate-950 tracking-tighter uppercase italic leading-none">Neural_Comms</h2>
               <div className="flex items-center gap-2 mt-2">
                 <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(79,70,229,0.8)]" />
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Secure_P2P_Link</p>
               </div>
             </div>
          </div>
          <div className="relative group">
             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 scale-90"><ICONS.Search /></div>
             <input 
               type="text" 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="Scan private nodes..." 
               className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all shadow-inner placeholder:text-slate-300" 
             />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-2">
          {searchQuery.trim() ? (
            // SEARCH RESULTS VIEW
            filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <button 
                  key={user.id} 
                  onClick={() => handleStartChat(user)}
                  disabled={isCreating}
                  className="w-full flex items-center gap-4 p-4 rounded-[2rem] hover:bg-slate-50 transition-all duration-300 group text-left"
                >
                  <div className="relative shrink-0">
                    <img src={user.avatarUrl} className="w-12 h-12 object-cover rounded-[1.4rem] border border-slate-100" alt="" />
                    <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${PRESENCE_AURA[user.presenceStatus || 'Online']}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-slate-900 truncate">{user.displayName}</p>
                    <p className="text-[10px] font-mono text-slate-400 truncate">@{user.username}</p>
                  </div>
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                  </div>
                </button>
              ))
            ) : (
              <div className="py-10 text-center opacity-40">
                <p className="text-[10px] font-black uppercase tracking-widest font-mono">No nodes found in sector.</p>
              </div>
            )
          ) : (
            // EXISTING CHATS VIEW
            chats.length > 0 ? (
              chats.map(chat => {
                const pId = chat.participants.find(id => id !== currentUser.id);
                const pData = chat.participantData[pId || ''];
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
                      <img src={pData?.avatarUrl} className={`w-14 h-14 object-cover border-2 border-white shadow-sm rounded-[1.8rem]`} alt="" />
                      {peerUser?.presenceStatus && (
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
              })
            ) : (
              <div className="py-20 text-center flex flex-col items-center opacity-40 px-6">
                 <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mb-6 text-slate-300">
                    <ICONS.Messages />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] font-mono leading-relaxed">Local comms buffer empty.<br/>Use search to establish new links.</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* MAIN VIEWPORT: CHAT STREAM */}
      <div className={`${view === 'list' ? 'hidden md:flex' : 'flex'} flex-1 flex-col min-w-0 bg-[#fdfdfe] relative`}>
        <AtmosphericBackground weather={weather}>
          {selectedChatId && activeChat ? (
            <DirectChatInterface 
                chatId={selectedChatId} 
                currentUser={currentUser} 
                allUsers={allUsers} 
                onBack={() => { setView('list'); setSelectedChatId(null); }}
                addToast={addToast}
                chatData={activeChat}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
               <div className="relative group">
                 <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-full scale-150 animate-pulse" />
                 <div className="relative w-32 h-32 md:w-48 md:h-48 bg-white rounded-[4rem] border-sharp shadow-heavy flex items-center justify-center text-slate-200 scale-110 mb-12"><ICONS.Messages /></div>
               </div>
               <h3 className="text-2xl font-black text-slate-950 tracking-tighter uppercase italic leading-none mb-4">Neural_Wait_State</h3>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] font-mono italic max-w-xs leading-loose">Select a secure node link to establish private frequency transmission.</p>
            </div>
          )}
        </AtmosphericBackground>
      </div>
    </div>
  );
};
