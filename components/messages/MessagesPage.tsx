
import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { collection, query, where, onSnapshot, orderBy } = Firestore as any;
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

export const MessagesPage: React.FC<MessagesPageProps> = ({ currentUser, locale, addToast, weather, allUsers = [], blockedIds }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'chat'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  // Fix: Add missing loading state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !currentUser.id) return;
    const q = query(
      collection(db, 'chats'), 
      where('participants', 'array-contains', currentUser.id), 
      orderBy('lastMessageTimestamp', 'desc')
    );
    const unsub = onSnapshot(q, (snap: any) => {
      setChats(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Chat)).filter(c => !c.isCluster));
      // Fix: Update loading state once snapshot resolves
      setLoading(false);
    }, (err: any) => {
      console.error("Messages sync failure:", err);
      setLoading(false);
    });
    return () => unsub();
  }, [currentUser.id]);

  const activeChat = chats.find(c => c.id === selectedChatId);

  const filteredChats = chats.filter(chat => {
    const pId = chat.participants.find(id => id !== currentUser.id);
    const pData = chat.participantData[pId || ''];
    return pData?.displayName?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex h-full w-full bg-white dark:bg-slate-900 rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] transition-all duration-500">
      
      {/* SIDEBAR: CONVERSATION INDEX */}
      <div className={`${view === 'chat' ? 'hidden md:flex' : 'flex'} w-full md:w-[380px] lg:w-[440px] border-r border-slate-100 dark:border-slate-800 flex-col bg-white dark:bg-slate-900 shrink-0 relative z-20`}>
        
        {/* Sidebar Header */}
        <div className="p-8 pb-4 space-y-8">
           <div className="flex items-center justify-between">
              <div className="space-y-1">
                 <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none">Messages</h2>
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono">Neural_Comms_v4.0</span>
                 </div>
              </div>
           </div>

           <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors pointer-events-none scale-110">
                 <ICONS.Search />
              </div>
              <input 
                type="text" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                placeholder="Scan neural links..." 
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-transparent rounded-[1.8rem] pl-14 pr-6 py-5 text-sm font-bold outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-indigo-500/5 focus:border-slate-200 dark:focus:border-slate-700 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-inner" 
              />
           </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-12 pt-4">
          <div className="space-y-2">
            {filteredChats.map(chat => {
              const pId = chat.participants.find(id => id !== currentUser.id);
              const pData = chat.participantData[pId || ''];
              const peer = allUsers.find(u => u.id === pId);
              const borderClass = peer?.cosmetics?.activeBorder ? `cosmetic-border-${peer.cosmetics.activeBorder}` : '';
              const isActive = selectedChatId === chat.id;

              return (
                <button 
                  key={chat.id} 
                  onClick={() => { setSelectedChatId(chat.id); setView('chat'); }} 
                  className={`w-full flex items-center gap-5 p-5 rounded-[2.2rem] transition-all relative group border ${
                    isActive 
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl border-transparent' 
                      : 'bg-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-transparent'
                  }`}
                >
                  <div className={`relative shrink-0 w-15 h-15 rounded-[1.4rem] ${borderClass}`}>
                    <img src={pData?.avatarUrl} className={`w-full h-full rounded-[1.4rem] object-cover border-2 transition-all ${isActive ? 'border-white/20' : 'border-white dark:border-slate-800 shadow-sm'}`} alt="" />
                    {peer?.presenceStatus === 'Online' && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-[3px] border-white dark:border-slate-800 bg-emerald-500 shadow-lg" />
                    )}
                  </div>
                  
                  <div className="text-left overflow-hidden flex-1 space-y-1">
                    <div className="flex justify-between items-baseline">
                      <p className={`font-black text-base uppercase tracking-tight truncate ${isActive ? 'text-white dark:text-slate-900' : 'text-slate-900 dark:text-white'}`}>
                        {pData?.displayName}
                      </p>
                      {chat.lastMessageTimestamp && (
                        <span className={`text-[8px] font-mono font-black uppercase opacity-40 ml-2 whitespace-nowrap ${isActive ? 'text-white' : ''}`}>
                          {new Date(chat.lastMessageTimestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs truncate font-medium ${isActive ? 'opacity-80 text-white' : 'opacity-60 text-slate-500 dark:text-slate-400'}`}>
                      {chat.lastMessage || 'No transmissions.'}
                    </p>
                  </div>

                  {isActive && (
                     <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-full shadow-[0_0_15px_#6366f1]" />
                  )}
                </button>
              );
            })}

            {!loading && filteredChats.length === 0 && (
              <div className="py-20 text-center flex flex-col items-center">
                 <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-200 dark:text-slate-700 mb-4">
                    <ICONS.Messages />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] font-mono text-slate-300 dark:text-slate-600 italic">Sector_Empty</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* VIEWPORT: ACTIVE HANDSHAKE */}
      <div className={`${view === 'list' ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-[#fdfdfe] dark:bg-slate-950 relative overflow-hidden transition-colors duration-500`}>
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
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center relative overflow-hidden bg-slate-50/30 dark:bg-slate-950">
             <div className="absolute inset-0 pointer-events-none opacity-5 dark:opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px' }} />
             
             <div className="w-32 h-32 bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl flex items-center justify-center mb-10 scale-110 relative group">
                <div className="absolute inset-0 bg-indigo-500/5 rounded-[3.5rem] animate-pulse" />
                <div className="scale-150 text-slate-200 dark:text-slate-700 group-hover:scale-125 group-hover:text-indigo-500 transition-all duration-700">
                   <ICONS.Messages />
                </div>
             </div>
             
             <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">Standby_Mode</h3>
             <p className="text-[10px] font-black uppercase tracking-[0.5em] font-mono mt-4 text-slate-400 dark:text-slate-600 max-w-sm leading-loose">
               Select a verified node from the grid registry to initiate a secure point-to-point transmission sequence.
             </p>
          </div>
        )}
      </div>
    </div>
  );
};
