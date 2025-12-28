
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

  // 1. Sync Existing Chats
  useEffect(() => {
    if (!db || !currentUser.id) return;
    const q = query(
      collection(db, 'chats'), 
      where('participants', 'array-contains', currentUser.id), 
      orderBy('lastMessageTimestamp', 'desc')
    );
    const unsub = onSnapshot(q, (snap: any) => {
      setChats(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Chat)).filter(c => !c.isCluster));
      setLoading(false);
    });
    return () => unsub();
  }, [currentUser.id]);

  // 2. Fetch Contacts (Followers & Following)
  useEffect(() => {
    const fetchContacts = async () => {
      if (!db || !currentUser.id) return;
      try {
        // Fetch users the current user follows
        const followingSnap = await getDocs(collection(db, 'users', currentUser.id, 'following'));
        const followingIds = followingSnap.docs.map((d: any) => d.id);
        
        // Fetch users who follow the current user
        const followersSnap = await getDocs(collection(db, 'users', currentUser.id, 'followers'));
        const followerIds = followersSnap.docs.map((d: any) => d.id);

        const uniqueIds = Array.from(new Set([...followingIds, ...followerIds]));
        
        // Resolve full user objects
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

  const activeChat = chats.find(c => c.id === selectedChatId);

  // 3. Logic to Start or Open a Chat
  const startNewChat = async (targetUser: VibeUser) => {
    if (!db || !currentUser) return;

    // Check if chat already exists
    const existing = chats.find(c => c.participants.includes(targetUser.id));
    if (existing) {
      setSelectedChatId(existing.id);
      setView('chat');
      setSidebarMode('chats');
      return;
    }

    // Create new handshake
    const chatId = [currentUser.id, targetUser.id].sort().join('_');
    try {
      const participantData = {
        [currentUser.id]: { displayName: currentUser.displayName, avatarUrl: currentUser.avatarUrl },
        [targetUser.id]: { displayName: targetUser.displayName, avatarUrl: targetUser.avatarUrl, activeBorder: targetUser.cosmetics?.activeBorder }
      };

      await setDoc(doc(db, 'chats', chatId), {
        id: chatId,
        participants: [currentUser.id, targetUser.id],
        participantData,
        lastMessage: 'Neural link established. Awaiting first packet...',
        lastMessageTimestamp: serverTimestamp(),
        isCluster: false
      });

      setSelectedChatId(chatId);
      setView('chat');
      setSidebarMode('chats');
      addToast(`Handshake Secured with ${targetUser.displayName}`, "success");
    } catch (e) {
      addToast("Uplink Protocol Failed", "error");
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
      
      {/* SIDEBAR: NAVIGATION PANEL */}
      <div className={`${view === 'chat' ? 'hidden md:flex' : 'flex'} w-full md:w-[380px] lg:w-[440px] border-r border-slate-100 dark:border-slate-800 flex-col bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shrink-0 relative z-20`}>
        
        <div className="p-8 pb-4 space-y-8">
           <div className="flex items-center justify-between">
              <div className="space-y-1">
                 <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none">Neural_Comms</h2>
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono">Signal_Secure_v4</span>
                 </div>
              </div>
           </div>

           {/* Mode Toggles */}
           <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
              <button 
                onClick={() => setSidebarMode('chats')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sidebarMode === 'chats' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Conversations
              </button>
              <button 
                onClick={() => setSidebarMode('contacts')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sidebarMode === 'contacts' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Grid Registry
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
                placeholder={sidebarMode === 'chats' ? "Search active links..." : "Scan followers..."} 
                className="w-full bg-slate-50 dark:bg-slate-800/40 border border-transparent rounded-[1.8rem] pl-14 pr-6 py-5 text-sm font-bold outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-500/5 transition-all text-slate-900 dark:text-white shadow-inner" 
              />
           </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-12 pt-4">
          <div className="space-y-1.5">
            {sidebarMode === 'chats' ? (
              filteredItems.map(chat => {
                const pId = chat.participants.find(id => id !== currentUser.id);
                const pData = chat.participantData[pId || ''];
                const peer = allUsers.find(u => u.id === pId);
                const borderClass = peer?.cosmetics?.activeBorder ? `cosmetic-border-${peer.cosmetics.activeBorder}` : '';
                const isActive = selectedChatId === chat.id;

                return (
                  <button 
                    key={chat.id} 
                    onClick={() => { setSelectedChatId(chat.id); setView('chat'); }} 
                    className={`w-full flex items-center gap-4 p-4 rounded-[2rem] transition-all border group relative ${
                      isActive 
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl border-transparent' 
                        : 'bg-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-transparent'
                    }`}
                  >
                    <div className={`relative shrink-0 w-14 h-14 rounded-[1.4rem] ${borderClass}`}>
                      <img src={pData?.avatarUrl} className={`w-full h-full rounded-[1.4rem] object-cover border-2 transition-all ${isActive ? 'border-white/20' : 'border-white dark:border-slate-800 shadow-sm'}`} alt="" />
                      {peer?.presenceStatus === 'Online' && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-[2.5px] border-white dark:border-slate-800 bg-emerald-500 shadow-lg" />
                      )}
                    </div>
                    <div className="text-left overflow-hidden flex-1 space-y-1">
                      <div className="flex justify-between items-baseline">
                        <p className={`font-black text-sm uppercase tracking-tight truncate ${isActive ? 'text-white dark:text-slate-900' : 'text-slate-900 dark:text-white'}`}>{pData?.displayName}</p>
                        {chat.lastMessageTimestamp && (
                          <span className={`text-[7px] font-mono font-black uppercase opacity-40 ml-2 ${isActive ? 'text-white' : ''}`}>
                            {new Date(chat.lastMessageTimestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                          </span>
                        )}
                      </div>
                      <p className={`text-[10px] truncate font-medium ${isActive ? 'opacity-80 text-white' : 'opacity-60 text-slate-500 dark:text-slate-400'}`}>
                        {chat.lastMessage}
                      </p>
                    </div>
                    {isActive && (
                       <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-full shadow-[0_0_15px_#6366f1]" />
                    )}
                  </button>
                );
              })
            ) : (
              filteredItems.map(contact => {
                const peer = contact as VibeUser;
                const borderClass = peer.cosmetics?.activeBorder ? `cosmetic-border-${peer.cosmetics.activeBorder}` : '';
                
                return (
                  <button 
                    key={peer.id} 
                    onClick={() => startNewChat(peer)} 
                    className="w-full flex items-center gap-4 p-4 rounded-[2rem] bg-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                  >
                    <div className={`relative shrink-0 w-14 h-14 rounded-[1.4rem] ${borderClass}`}>
                      <img src={peer.avatarUrl} className="w-full h-full rounded-[1.4rem] object-cover border-2 border-white dark:border-slate-800 shadow-sm" alt="" />
                      {peer.presenceStatus === 'Online' && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-[2.5px] border-white dark:border-slate-800 bg-emerald-500 shadow-lg" />
                      )}
                    </div>
                    <div className="text-left overflow-hidden flex-1">
                       <p className="font-black text-sm uppercase tracking-tight truncate text-slate-900 dark:text-white">{peer.displayName}</p>
                       <p className="text-[8px] font-mono text-indigo-500 dark:text-indigo-400 font-bold tracking-widest uppercase">@{peer.username}</p>
                    </div>
                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    </div>
                  </button>
                );
              })
            )}

            {!loading && filteredItems.length === 0 && (
              <div className="py-20 text-center flex flex-col items-center opacity-30">
                 <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4 scale-125">
                    <ICONS.Explore />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] font-mono italic">Sector_Empty</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* VIEWPORT: ACTIVE HANDSHAKE */}
      <div className={`${view === 'list' ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-slate-50 dark:bg-slate-950 relative overflow-hidden transition-colors duration-500`}>
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
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center relative overflow-hidden">
             <div className="absolute inset-0 pointer-events-none opacity-5 dark:opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px' }} />
             
             <div className="w-32 h-32 bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl flex items-center justify-center mb-10 scale-110 relative group">
                <div className="absolute inset-0 bg-indigo-500/5 rounded-[3.5rem] animate-pulse" />
                <div className="scale-150 text-slate-200 dark:text-slate-700 group-hover:scale-125 group-hover:text-indigo-500 transition-all duration-700">
                   <ICONS.Messages />
                </div>
             </div>
             
             <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">Neural_Comms_Standby</h3>
             <p className="text-[10px] font-black uppercase tracking-[0.5em] font-mono mt-4 text-slate-400 dark:text-slate-600 max-w-sm leading-loose">
               Select a node from your link registry to initiate a secure encrypted synchronization protocol.
             </p>

             <button 
               onClick={() => setSidebarMode('contacts')}
               className="mt-12 px-10 py-5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-indigo-600 dark:hover:bg-indigo-400 dark:hover:text-white transition-all active:scale-95 flex items-center gap-4 italic"
             >
                <ICONS.Profile /> Access_Grid_Registry
             </button>
          </div>
        )}
      </div>
    </div>
  );
};
