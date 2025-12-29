
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
  const [isScanning, setIsScanning] = useState(false);
  
  const [optimisticChat, setOptimisticChat] = useState<Chat | null>(null);

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
      } catch (e) { console.error(e); }
    };
    fetchContacts();
  }, [currentUser.id, blockedIds]);

  const activeChat = chats.find(c => c.id === selectedChatId) || (selectedChatId === optimisticChat?.id ? optimisticChat : null);

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setSidebarMode('contacts');
    }, 1200);
  };

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
      [targetUser.id]: { displayName: targetUser.displayName, avatarUrl: targetUser.avatarUrl, activeBorder: targetUser.cosmetics?.activeBorder || null }
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
        id: chatId, participants: [currentUser.id, targetUser.id], participantData, lastMessage: 'Neural link established.', lastMessageTimestamp: serverTimestamp(), isCluster: false
      });
    } catch (e) {
      console.error(e);
      setOptimisticChat(null);
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
    <div className="flex h-full w-full bg-[#020617] md:rounded-[3rem] overflow-hidden border border-slate-900 shadow-heavy transition-all duration-500 relative z-10 min-h-0">
      <div className={`${view === 'chat' ? 'hidden md:flex' : 'flex'} w-full md:w-[380px] lg:w-[420px] border-r border-slate-900 flex-col bg-[#050b1a] shrink-0 relative z-20 h-full`}>
        <div className="p-8 pb-4 space-y-8 shrink-0">
           <div className="flex items-center justify-between">
              <div>
                 <h2 className="text-3xl font-black text-white uppercase italic leading-none tracking-tighter">NEURAL_COMMS</h2>
                 <div className="flex items-center gap-2 mt-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono">V3.1_ACTIVE_SYNC</span>
                 </div>
              </div>
           </div>
           <div className="flex p-1 bg-slate-900/50 rounded-2xl border border-slate-800">
              <button onClick={() => setSidebarMode('chats')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sidebarMode === 'chats' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>SYNCS</button>
              <button onClick={() => setSidebarMode('contacts')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sidebarMode === 'contacts' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>NODES</button>
           </div>
           <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors pointer-events-none">
                 <ICONS.Search />
              </div>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search sync logs..." className="w-full bg-[#0a1224] border border-slate-800 rounded-[1.8rem] pl-14 pr-6 py-4 text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-white shadow-inner" />
           </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-12 pt-4">
          <div className="space-y-1">
            {sidebarMode === 'chats' ? (
                filteredItems.map(chat => {
                  const pId = chat.participants.find(id => id !== currentUser.id);
                  const pData = chat.participantData[pId || ''];
                  const isActive = selectedChatId === chat.id;
                  return (
                    <button key={chat.id} onClick={() => { setSelectedChatId(chat.id); setView('chat'); }} className={`w-full flex items-center gap-4 p-4 rounded-[2.2rem] transition-all relative group ${isActive ? 'bg-white text-slate-950 shadow-xl' : 'bg-transparent text-slate-500 hover:bg-slate-900/50'}`}>
                      <div className={`relative shrink-0 w-14 h-14 rounded-[1.5rem] ${chat?.participantData?.[pId || '']?.activeBorder ? `cosmetic-border-${chat.participantData[pId!].activeBorder}` : ''}`}>
                        <img src={pData?.avatarUrl} className="w-full h-full rounded-[1.5rem] object-cover border-2 border-slate-900" alt="" />
                      </div>
                      <div className="text-left overflow-hidden flex-1">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <p className={`font-black text-[13px] uppercase tracking-tight truncate ${isActive ? 'text-slate-950' : 'text-white'}`}>{pData?.displayName}</p>
                          {chat.lastMessageTimestamp && <span className="text-[7px] font-mono font-black uppercase opacity-40">{new Date(chat.lastMessageTimestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>}
                        </div>
                        <p className={`text-[10px] truncate font-medium ${isActive ? 'text-slate-500' : 'text-slate-500'} italic`}>{chat.lastMessage || 'Signal initialized.'}</p>
                      </div>
                      {isActive && <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-indigo-600 rounded-full shadow-[0_0_15px_#4f46e5]" />}
                    </button>
                  );
                })
            ) : (
              filteredItems.map(contact => (
                <button key={contact.id} onClick={() => startNewChat(contact as VibeUser)} className="w-full flex items-center gap-4 p-4 rounded-[2.2rem] bg-transparent text-slate-500 hover:bg-slate-900/50 transition-all group">
                    <img src={contact.avatarUrl} className="w-14 h-14 rounded-[1.5rem] object-cover border-2 border-slate-900" alt="" />
                    <div className="text-left overflow-hidden flex-1">
                       <p className="font-black text-[13px] uppercase tracking-tight truncate text-white">{contact.displayName}</p>
                       <p className="text-[8px] font-mono text-indigo-400 font-bold tracking-widest uppercase">@{contact.username}</p>
                    </div>
                </button>
              ))
            )}
            {!loading && filteredItems.length === 0 && (
              <div className="py-20 text-center opacity-30 flex flex-col items-center">
                 <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center text-slate-500 mb-4 scale-75 animate-pulse"><ICONS.Search /></div>
                 <p className="text-[9px] font-black uppercase tracking-[0.4em] font-mono">SECTOR_EMPTY</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`${view === 'list' ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-[#020617] relative overflow-hidden h-full min-h-0`}>
        {selectedChatId && activeChat ? (
          <DirectChatInterface chatId={selectedChatId} currentUser={currentUser} allUsers={allUsers} onBack={() => setView('list')} addToast={addToast} chatData={activeChat} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center relative h-full">
             <div className="absolute inset-0 pointer-events-none opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #312e81 1px, transparent 0)', backgroundSize: '48px 48px' }} />
             <div className="w-32 h-32 bg-[#050b1a] rounded-full border border-indigo-900/30 flex items-center justify-center mb-10 relative group overflow-hidden shadow-2xl">
                <div className={`absolute inset-0 bg-indigo-500/10 ${isScanning ? 'animate-pulse scale-150' : 'opacity-0'} transition-all duration-1000`} />
                <div className={`scale-[1.8] text-indigo-900/40 group-hover:text-indigo-500/20 transition-all duration-700 ${isScanning ? 'animate-spin' : ''}`}>
                   <ICONS.Messages />
                </div>
             </div>
             <h3 className="text-5xl font-black uppercase italic tracking-tighter text-white mb-4">STANDBY_MODE</h3>
             <p className="text-[10px] font-black uppercase tracking-[0.6em] font-mono text-slate-600 max-w-sm leading-[2] border-t border-slate-900 pt-6">
               SELECT AN ACTIVE NODE FROM THE COMMUNICATION REGISTRY TO INITIATE HIGH-FIDELITY SIGNAL EXCHANGE.
             </p>
             <button 
               onClick={handleScan}
               disabled={isScanning}
               className="mt-16 px-12 py-5 bg-white text-slate-950 rounded-full font-black text-[11px] uppercase tracking-[0.4em] shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.25)] hover:scale-105 active:scale-95 transition-all flex items-center gap-6 italic"
             >
                <div className={isScanning ? 'animate-spin' : ''}><ICONS.Search /></div> 
                {isScanning ? 'SCANNING_GRID...' : 'SCAN_LOCAL_NODES'}
             </button>
          </div>
        )}
      </div>
    </div>
  );
};
