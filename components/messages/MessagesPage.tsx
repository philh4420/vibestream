
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
        u.settings?.privacy?.allowTagging !== false && // Respect privacy setting
        (u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
         u.username.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const activeChat = chats.find(c => c.id === selectedChatId);
  
  const PRESENCE_AURA: Record<string, string> = {
    'Online': 'bg-emerald-500 shadow-[0_0_8px_#10b981]',
    'Focus': 'bg-amber-500 shadow-[0_0_8px_#f59e0b]',
    'Deep Work': 'bg-rose-500 shadow-[0_0_8px_#e11d48]',
    'Away': 'bg-slate-400',
    'Syncing': 'bg-blue-400 animate-pulse'
  };

  return (
    <div className="flex h-full w-full bg-slate-50 dark:bg-slate-900 rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-sm border border-slate-200/60 dark:border-slate-800 relative animate-in fade-in duration-500">
      
      {/* SIDEBAR: CONTACTS FEED (1-to-1 Only) */}
      <div className={`${view === 'chat' ? 'hidden md:flex' : 'flex'} w-full md:w-[360px] lg:w-[400px] border-r border-slate-100 dark:border-slate-800 flex-col bg-white dark:bg-slate-900 shrink-0 z-20 relative overflow-hidden`}>
        {/* Header Area */}
        <div className="px-6 py-6 pb-2 shrink-0">
          <div className="flex items-center justify-between mb-6">
             <div>
               <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none">Comms_Log</h2>
               <div className="flex items-center gap-2 mt-1.5">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] font-mono">Secure_Uplink</p>
               </div>
             </div>
             <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-300">
               <ICONS.Messages />
             </div>
          </div>
          
          <div className="relative group mb-2">
             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors"><ICONS.Search /></div>
             <input 
               type="text" 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="Scan nodes..." 
               className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[1.2rem] pl-11 pr-4 py-3.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-100 dark:focus:border-indigo-900 transition-all placeholder:text-slate-400 text-slate-900 dark:text-white" 
             />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-3 pb-4 space-y-1">
          {searchQuery.trim() ? (
            // SEARCH RESULTS VIEW
            filteredUsers.length > 0 ? (
              <>
                <p className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Directory_Results</p>
                {filteredUsers.map(user => (
                  <button 
                    key={user.id} 
                    onClick={() => handleStartChat(user)}
                    disabled={isCreating}
                    className="w-full flex items-center gap-3 p-3 rounded-[1.5rem] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-300 group text-left active:scale-[0.98]"
                  >
                    <div className="relative shrink-0">
                      <img src={user.avatarUrl} className="w-12 h-12 object-cover rounded-[1.2rem] border border-slate-100 dark:border-slate-700 bg-slate-100 dark:bg-slate-800" alt="" />
                      {user.settings?.privacy?.activityStatus !== false && (
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${PRESENCE_AURA[user.presenceStatus || 'Online']}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm text-slate-900 dark:text-white truncate tracking-tight">{user.displayName}</p>
                      <p className="text-[10px] font-mono text-slate-400 truncate">@{user.username}</p>
                    </div>
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    </div>
                  </button>
                ))}
              </>
            ) : (
              <div className="py-12 text-center opacity-40">
                <p className="text-[10px] font-black uppercase tracking-widest font-mono text-slate-400">No nodes found in sector.</p>
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
                const showActivity = peerUser?.settings?.privacy?.activityStatus !== false;

                return (
                  <button 
                    key={chat.id} 
                    onClick={() => { setSelectedChatId(chat.id); setView('chat'); }} 
                    className={`w-full flex items-center gap-3.5 p-3.5 rounded-[1.8rem] transition-all duration-300 relative group active:scale-[0.99] border ${isActive ? 'bg-slate-900 dark:bg-slate-700 border-slate-900 dark:border-slate-600 shadow-xl shadow-slate-900/10' : 'bg-white dark:bg-slate-900 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    <div className="relative shrink-0">
                      <img src={pData?.avatarUrl} className={`w-12 h-12 object-cover border-2 shadow-sm rounded-[1.2rem] ${isActive ? 'border-slate-700 dark:border-slate-500' : 'border-white dark:border-slate-800'}`} alt="" />
                      {showActivity && peerUser?.presenceStatus && (
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-[2.5px] ${isActive ? 'border-slate-900 dark:border-slate-700' : 'border-white dark:border-slate-900'} ${PRESENCE_AURA[peerUser.presenceStatus] || 'bg-slate-300'}`} />
                      )}
                    </div>
                    <div className="text-left overflow-hidden flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <p className={`font-black text-[13px] uppercase tracking-tight truncate ${isActive ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{pData?.displayName}</p>
                        <span className={`text-[9px] font-black font-mono tracking-wide ${isActive ? 'text-slate-500 dark:text-slate-400' : 'text-slate-300 dark:text-slate-600'}`}>
                          {chat.lastMessageTimestamp?.toDate ? chat.lastMessageTimestamp.toDate().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'NOW'}
                        </span>
                      </div>
                      <p className={`text-[11px] font-bold truncate leading-relaxed ${isActive ? 'text-slate-400 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                        {chat.lastMessage}
                      </p>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-24 text-center flex flex-col items-center opacity-40 px-6">
                 <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] flex items-center justify-center mb-6 text-slate-300">
                    <ICONS.Messages />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] font-mono leading-relaxed text-slate-400">Buffer Empty.<br/>Initiate new link.</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* MAIN VIEWPORT: CHAT STREAM */}
      <div className={`${view === 'list' ? 'hidden md:flex' : 'flex'} flex-1 flex-col min-w-0 bg-[#f8fafc] dark:bg-[#0f172a] relative z-10`}>
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
               <div className="relative group cursor-default">
                 <div className="absolute inset-0 bg-indigo-500/10 blur-[60px] rounded-full animate-pulse" />
                 <div className="relative w-32 h-32 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-[2.5rem] border border-white dark:border-slate-700 shadow-xl flex items-center justify-center text-slate-300 mb-8 transform group-hover:scale-105 transition-transform duration-500">
                   <ICONS.Messages />
                 </div>
               </div>
               <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none mb-3">Neural_Comms_Ready</h3>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono italic max-w-xs leading-loose">
                 Select a node from the registry to establish a secure p2p frequency.
               </p>
            </div>
          )}
        </AtmosphericBackground>
      </div>
    </div>
  );
};
