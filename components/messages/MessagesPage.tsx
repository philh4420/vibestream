
import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp } = Firestore as any;
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
  const PRESENCE_AURA: Record<string, string> = {
    'Online': 'bg-emerald-500 shadow-[0_0_8px_#10b981]', 'Away': 'bg-slate-400', 'Offline': 'bg-slate-300'
  };

  return (
    <div className="flex h-full w-full bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-slate-800">
      <div className={`${view === 'chat' ? 'hidden md:flex' : 'flex'} w-full md:w-[360px] lg:w-[400px] border-r border-slate-100 dark:border-slate-800 flex-col bg-white dark:bg-slate-900 shrink-0`}>
        <div className="p-6">
           <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none mb-6">Neural_Comms</h2>
           <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Filter grid..." className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-xs font-bold outline-none text-slate-900 dark:text-white" />
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar px-3 space-y-1">
          {chats.map(chat => {
            const pId = chat.participants.find(id => id !== currentUser.id);
            const pData = chat.participantData[pId || ''];
            const peer = allUsers.find(u => u.id === pId);
            const borderClass = peer?.cosmetics?.activeBorder ? `cosmetic-border-${peer.cosmetics.activeBorder}` : '';
            return (
              <button key={chat.id} onClick={() => { setSelectedChatId(chat.id); setView('chat'); }} className={`w-full flex items-center gap-3.5 p-3.5 rounded-[1.8rem] transition-all border ${selectedChatId === chat.id ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 border-transparent'}`}>
                <div className={`relative shrink-0 w-12 h-12 rounded-[1.2rem] ${borderClass}`}>
                  <img src={pData?.avatarUrl} className="w-full h-full rounded-[1.2rem] object-cover border-2 border-white dark:border-slate-800" alt="" />
                  {peer?.presenceStatus === 'Online' && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 bg-emerald-500" />}
                </div>
                <div className="text-left overflow-hidden flex-1">
                  <p className="font-black text-sm uppercase tracking-tight truncate">{pData?.displayName}</p>
                  <p className="text-[10px] truncate opacity-70">{chat.lastMessage}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div className={`${view === 'list' ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-slate-50 dark:bg-slate-950`}>
        {selectedChatId && activeChat ? (
          <DirectChatInterface chatId={selectedChatId} currentUser={currentUser} allUsers={allUsers} onBack={() => setView('list')} addToast={addToast} chatData={activeChat} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-30"><div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center mb-6 scale-125"><ICONS.Messages /></div><h3 className="text-xl font-black uppercase italic tracking-tighter">Neural_Sync_Ready</h3></div>
        )}
      </div>
    </div>
  );
};
