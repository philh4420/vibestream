
import React, { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, setDoc, doc } = Firestore as any;
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

  useEffect(() => {
    if (!db || !currentUser.id) return;
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', currentUser.id), orderBy('lastMessageTimestamp', 'desc'));
    const unsub = onSnapshot(q, (snap: any) => {
      setChats(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Chat)).filter(c => !c.isCluster));
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
    <div className="flex h-full w-full bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-2xl transition-all duration-500">
      {/* Sidebar */}
      <div className={`${view === 'chat' ? 'hidden md:flex' : 'flex'} w-full md:w-[360px] lg:w-[400px] border-r border-slate-100 dark:border-slate-800 flex-col bg-white dark:bg-slate-900 shrink-0`}>
        <div className="p-6 md:p-8 space-y-6">
           <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none">Neural_Comms</h2>
              <div className="flex gap-2">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
              </div>
           </div>

           <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"><ICONS.Search /></div>
              <input 
                type="text" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                placeholder="Scan grid nodes..." 
                className="w-full bg-slate-50 dark:bg-slate-800 border border-transparent rounded-[1.4rem] pl-12 pr-6 py-4 text-xs font-black uppercase tracking-widest outline-none focus:bg-white dark:focus:bg-slate-700 focus:ring-4 focus:ring-indigo-500/5 transition-all text-slate-900 dark:text-white" 
              />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-1">
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
                className={`w-full flex items-center gap-4 p-4 rounded-[2rem] transition-all border group relative ${isActive ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl border-transparent' : 'bg-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 border-transparent'}`}
              >
                <div className={`relative shrink-0 w-13 h-13 rounded-[1.4rem] ${borderClass}`}>
                  <img src={pData?.avatarUrl} className="w-full h-full rounded-[1.4rem] object-cover border-2 border-white dark:border-slate-800 shadow-sm" alt="" />
                  {peer?.presenceStatus === 'Online' && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-[2.5px] border-white dark:border-slate-800 bg-emerald-500 shadow-sm" />
                  )}
                </div>
                <div className="text-left overflow-hidden flex-1">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <p className={`font-black text-sm uppercase tracking-tight truncate ${isActive ? 'text-white dark:text-slate-900' : 'text-slate-900 dark:text-white'}`}>{pData?.displayName}</p>
                    {chat.lastMessageTimestamp && (
                      <span className="text-[7px] font-mono opacity-40 ml-2">
                        {new Date(chat.lastMessageTimestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </span>
                    )}
                  </div>
                  <p className={`text-[10px] truncate ${isActive ? 'opacity-80' : 'opacity-60'} font-medium`}>
                    {chat.lastMessage}
                  </p>
                </div>
                {isActive && (
                   <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-indigo-500 rounded-r-full shadow-[0_0_15px_#6366f1]" />
                )}
              </button>
            );
          })}
          {filteredChats.length === 0 && searchQuery && (
             <div className="p-10 text-center opacity-30">
                <p className="text-[10px] font-black uppercase tracking-widest font-mono italic">No frequencies matched.</p>
             </div>
          )}
        </div>
      </div>

      {/* Chat Viewport */}
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
             <div className="absolute inset-0 pointer-events-none opacity-5 dark:opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }} />
             
             <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-2xl flex items-center justify-center mb-8 scale-110 relative group">
                <div className="absolute inset-0 bg-indigo-500/5 dark:bg-indigo-400/5 rounded-[3rem] animate-pulse" />
                <div className="scale-150 text-slate-300 dark:text-slate-600 group-hover:scale-125 group-hover:text-indigo-500 transition-all duration-700"><ICONS.Messages /></div>
             </div>
             
             <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">Neural_Bridge_Inactive</h3>
             <p className="text-[10px] font-black uppercase tracking-[0.4em] font-mono mt-3 text-slate-400 dark:text-slate-500 max-w-xs leading-loose">
               Select a node from the registry to initiate a secure encrypted synchronization protocol.
             </p>
          </div>
        )}
      </div>
    </div>
  );
};
