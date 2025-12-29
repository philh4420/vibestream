
import React, { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  addDoc
} = Firestore as any;
import { User as VibeUser, Chat, Region, WeatherInfo } from '../../types';
import { ICONS } from '../../constants';
import { DirectChatInterface } from './DirectChatInterface';

interface MessagesPageProps {
  currentUser: VibeUser;
  locale: Region;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  weather: WeatherInfo | null;
  allUsers?: VibeUser[];
  blockedIds?: Set<string>;
}

type SidebarMode = 'chats' | 'contacts';

export const MessagesPage: React.FC<MessagesPageProps> = ({ currentUser, locale, addToast, weather, allUsers = [], blockedIds }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [contacts, setContacts] = useState<VibeUser[]>([]);
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('chats');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'chat'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [optimisticChat, setOptimisticChat] = useState<Chat | null>(null);

  // 1. Sync Existing Chats
  useEffect(() => {
    if (!db || !currentUser.id) return;
    const q = query(
      collection(db, 'chats'), 
      where('participants', 'array-contains', currentUser.id), 
      orderBy('lastMessageTimestamp', 'desc')
    );
    const unsub = onSnapshot(q, (snap: any) => {
      const fetchedChats = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Chat)).filter(c => !c.isCluster);
      setChats(fetchedChats);
      setLoading(false);
      
      if (optimisticChat && fetchedChats.find(c => c.id === optimisticChat.id)) {
        setOptimisticChat(null);
      }
    });
    return () => unsub();
  }, [currentUser.id, optimisticChat]);

  // 2. Fetch Contacts (Network)
  useEffect(() => {
    const fetchContacts = async () => {
      if (!db || !currentUser.id) return;
      try {
        const followingSnap = await getDocs(collection(db, 'users', currentUser.id, 'following'));
        const followingIds = followingSnap.docs.map((d: any) => d.id);
        
        const followersSnap = await getDocs(collection(db, 'users', currentUser.id, 'followers'));
        const followerIds = followersSnap.docs.map((d: any) => d.id);

        const uniqueIds = Array.from(new Set([...followingIds, ...followerIds]));
        
        const contactPromises = uniqueIds.map(id => getDoc(doc(db, 'users', id)));
        const snaps = await Promise.all(contactPromises);
        const resolvedContacts = snaps
          .map(s => s.exists() ? ({ id: s.id, ...s.data() } as VibeUser) : null)
          .filter(u => u !== null && !blockedIds?.has(u.id)) as VibeUser[];
          
        setContacts(resolvedContacts);
      } catch (e) {
        console.error("Contacts Sync Failed", e);
      }
    };
    fetchContacts();
  }, [currentUser.id, blockedIds]);

  const activeChat = chats.find(c => c.id === selectedChatId) || (selectedChatId === optimisticChat?.id ? optimisticChat : null);

  const startNewChat = async (targetUser: VibeUser) => {
    if (!db || !currentUser) return;

    const existing = chats.find(c => c.participants.includes(targetUser.id));
    if (existing) {
      setSelectedChatId(existing.id);
      setView('chat');
      setSidebarMode('chats');
      return;
    }

    const chatId = [currentUser.id, targetUser.id].sort().join('_');
    const participantData = {
      [currentUser.id]: { displayName: currentUser.displayName, avatarUrl: currentUser.avatarUrl },
      [targetUser.id]: { 
        displayName: targetUser.displayName, 
        avatarUrl: targetUser.avatarUrl, 
        activeBorder: targetUser.cosmetics?.activeBorder || null 
      }
    };

    const newChatObj: Chat = {
      id: chatId,
      participants: [currentUser.id, targetUser.id],
      participantData,
      lastMessage: 'Neural link established.',
      lastMessageTimestamp: { seconds: Date.now() / 1000, nanoseconds: 0 },
      isCluster: false
    };

    setOptimisticChat(newChatObj);
    setSelectedChatId(chatId);
    setView('chat');
    setSidebarMode('chats');

    try {
      await setDoc(doc(db, 'chats', chatId), {
        id: chatId,
        participants: [currentUser.id, targetUser.id],
        participantData,
        lastMessage: 'Neural link established.',
        lastMessageTimestamp: serverTimestamp(),
        isCluster: false
      });
      addToast(`Link secured with ${targetUser.displayName}`, "success");
    } catch (e) {
      console.error(e);
      addToast("Uplink Failed", "error");
      if (selectedChatId === chatId) {
        setSelectedChatId(null);
        setView('list');
        setOptimisticChat(null);
      }
    }
  };

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (sidebarMode === 'chats') {
      return chats.filter(chat => {
        const pId = chat.participants.find(id => id !== currentUser.id);
        const pData = chat.participantData[pId || ''];
        return pData?.displayName?.toLowerCase().includes(q);
      });
    } else {
      return contacts.filter(u => u.displayName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q));
    }
  }, [sidebarMode, chats, contacts, searchQuery, currentUser.id]);

  return (
    <div className="flex h-full w-full bg-white dark:bg-slate-950 rounded-[3rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-heavy transition-all duration-500">
      
      {/* SIDEBAR: NAV REGISTRY */}
      <div className={`${view === 'chat' ? 'hidden md:flex' : 'flex'} w-full md:w-[380px] lg:w-[420px] border-r border-slate-100 dark:border-slate-800 flex-col bg-slate-50/30 dark:bg-slate-900/30 backdrop-blur-3xl shrink-0 relative z-20`}>
        
        <div className="p-8 pb-4 space-y-8">
           <div className="flex items-center justify-between">
              <div>
                 <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none">Neural_Comms</h2>
                 <div className="flex items-center gap-2 mt-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono">v3.1_Active_Sync</span>
                 </div>
              </div>
           </div>

           <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
              <button 
                onClick={() => setSidebarMode('chats')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sidebarMode === 'chats' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Syncs
              </button>
              <button 
                onClick={() => setSidebarMode('contacts')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sidebarMode === 'contacts' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Nodes
              </button>
           </div>

           <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors pointer-events-none scale-110">
                 <ICONS.Search />
              </div>
              <input 
                type="text" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                placeholder={sidebarMode === 'chats' ? "Search sync logs..." : "Search local grid..."} 
                className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[1.8rem] pl-14 pr-6 py-4 text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-900 dark:text-white shadow-sm" 
              />
           </div>
        </div>

        {/* Sync Feed */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-12 pt-4">
          <div className="space-y-1">
            {sidebarMode === 'chats' ? (
              <>
                {optimisticChat && (
                   <div 
                    className="w-full flex items-center gap-4 p-4 rounded-[2rem] bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50 opacity-60 animate-pulse"
                  >
                    <div className="relative shrink-0 w-14 h-14 rounded-[1.4rem] bg-slate-200 dark:bg-slate-800 overflow-hidden" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                  </div>
                )}

                {filteredItems.map(chat => {
                  const pId = chat.participants.find(id => id !== currentUser.id);
                  const pData = chat.participantData[pId || ''];
                  const peer = allUsers.find(u => u.id === pId);
                  const isActive = selectedChatId === chat.id;
                  const borderClass = peer?.cosmetics?.activeBorder ? `cosmetic-border-${peer.cosmetics.activeBorder}` : '';

                  return (
                    <button 
                      key={chat.id} 
                      onClick={() => { setSelectedChatId(chat.id); setView('chat'); }} 
                      className={`w-full flex items-center gap-4 p-4 rounded-[2.2rem] transition-all relative group ${
                        isActive 
                          ? 'bg-white dark:bg-white text-slate-900 dark:text-slate-900 shadow-xl ring-1 ring-black/5' 
                          : 'bg-transparent text-slate-500 hover:bg-white/60 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className={`relative shrink-0 w-14 h-14 rounded-[1.5rem] ${borderClass}`}>
                        <img src={pData?.avatarUrl} className="w-full h-full rounded-[1.5rem] object-cover border-2 border-white dark:border-slate-800 shadow-sm" alt="" />
                        {peer?.presenceStatus === 'Online' && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-[3px] border-white dark:border-slate-800 bg-emerald-500 shadow-lg" />
                        )}
                      </div>
                      <div className="text-left overflow-hidden flex-1">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <p className={`font-black text-[13px] uppercase tracking-tight truncate ${isActive ? 'text-slate-950' : 'text-slate-900 dark:text-white'}`}>
                            {pData?.displayName}
                          </p>
                          {chat.lastMessageTimestamp && (
                            <span className="text-[7px] font-mono font-black uppercase opacity-40">
                              {new Date(chat.lastMessageTimestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </span>
                          )}
                        </div>
                        <p className={`text-[10px] truncate font-medium ${isActive ? 'text-slate-500' : 'text-slate-400 dark:text-slate-500'} italic`}>
                          {chat.lastMessage || 'Signal initialized.'}
                        </p>
                      </div>
                      {isActive && (
                         <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-indigo-600 rounded-full shadow-[0_0_15px_#4f46e5]" />
                      )}
                    </button>
                  );
                })}
              </>
            ) : (
              filteredItems.map(contact => {
                const peer = contact as VibeUser;
                const borderClass = peer.cosmetics?.activeBorder ? `cosmetic-border-${peer.cosmetics.activeBorder}` : '';
                
                return (
                  <button 
                    key={peer.id} 
                    onClick={() => startNewChat(peer)} 
                    className="w-full flex items-center gap-4 p-4 rounded-[2.2rem] bg-transparent text-slate-500 hover:bg-white dark:hover:bg-slate-800/40 transition-all group"
                  >
                    <div className={`relative shrink-0 w-14 h-14 rounded-[1.5rem] ${borderClass}`}>
                      <img src={peer.avatarUrl} className="w-full h-full rounded-[1.5rem] object-cover border-2 border-white dark:border-slate-800 shadow-sm" alt="" />
                      {peer.presenceStatus === 'Online' && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-[3px] border-white dark:border-slate-800 bg-emerald-500 shadow-lg" />
                      )}
                    </div>
                    <div className="text-left overflow-hidden flex-1">
                       <p className="font-black text-[13px] uppercase tracking-tight truncate text-slate-900 dark:text-white">{peer.displayName}</p>
                       <p className="text-[8px] font-mono text-indigo-500 dark:text-indigo-400 font-bold tracking-widest uppercase">@{peer.username}</p>
                    </div>
                    <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                       <ICONS.Create />
                    </div>
                  </button>
                );
              })
            )}

            {!loading && filteredItems.length === 0 && !optimisticChat && (
              <div className="py-20 text-center opacity-30 flex flex-col items-center">
                 <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4">
                    <ICONS.Explore />
                 </div>
                 <p className="text-[9px] font-black uppercase tracking-[0.4em] font-mono">SECTOR_EMPTY</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* VIEWPORT: ACTIVE COMMAND CHANNEL */}
      <div className={`${view === 'list' ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-white dark:bg-slate-950 relative overflow-hidden transition-colors duration-500`}>
        {selectedChatId && activeChat ? (
          <DirectChatInterface 
            chatId={selectedChatId} 
            currentUser={currentUser} 
            allUsers={allUsers} 
            onBack={() => setView('list')} 
            addToast={addToast} 
            chatData={activeChat} 
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center relative">
             <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '40px 40px' }} />
             
             <div className="w-40 h-40 bg-slate-50 dark:bg-slate-900 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-inner flex items-center justify-center mb-10 relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="scale-[2] text-slate-200 dark:text-slate-800 group-hover:text-indigo-500/20 transition-all duration-700">
                   <ICONS.Messages />
                </div>
             </div>
             
             <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">Standby_Mode</h3>
             <p className="text-[10px] font-black uppercase tracking-[0.5em] font-mono mt-4 text-slate-400 dark:text-slate-600 max-w-xs leading-loose">
               Select an active node from the communication registry to initiate high-fidelity signal exchange.
             </p>

             <button 
               onClick={() => setSidebarMode('contacts')}
               className="mt-12 px-10 py-5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-indigo-600 dark:hover:bg-indigo-400 dark:hover:text-white transition-all active:scale-95 flex items-center gap-4 italic"
             >
                <ICONS.Explore /> SCAN_LOCAL_NODES
             </button>
          </div>
        )}
      </div>
    </div>
  );
};
