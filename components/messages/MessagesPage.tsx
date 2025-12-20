
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
  getDocs,
  Timestamp,
  // Fix: Added missing updateDoc import
  updateDoc
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      if (chatData.length > 0 && !selectedChatId) {
        setSelectedChatId(chatData[0].id);
      }
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
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => unsub();
  }, [selectedChatId]);

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
      
    } catch (e) {
      addToast("Comms Link Failed", "error");
    } finally {
      setIsSending(false);
    }
  };

  const activeChat = chats.find(c => c.id === selectedChatId);
  const otherParticipantId = activeChat?.participants.find(id => id !== currentUser.id);
  const otherParticipant = activeChat?.participantData[otherParticipantId || ''];

  return (
    <div className="flex h-full -mx-4 sm:-mx-6 md:-mx-10 lg:-mx-14 bg-white border-precision overflow-hidden rounded-[3rem] animate-in fade-in duration-500">
      {/* Sidebar List */}
      <div className="w-20 md:w-80 border-r border-precision flex flex-col bg-slate-50/30">
        <div className="p-8 border-b border-precision shrink-0">
          <h2 className="hidden md:block text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Comms_Feed</h2>
          <div className="md:hidden flex justify-center"><ICONS.Messages /></div>
        </div>
        <div className="flex-1 overflow-y-auto scroll-container p-3 space-y-2">
          {chats.map(chat => {
            const pId = chat.participants.find(id => id !== currentUser.id);
            const pData = chat.participantData[pId || ''];
            return (
              <button 
                key={chat.id}
                onClick={() => setSelectedChatId(chat.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${selectedChatId === chat.id ? 'bg-white shadow-xl ring-1 ring-slate-100' : 'hover:bg-white/50'}`}
              >
                <img src={pData?.avatarUrl} className="w-12 h-12 rounded-xl object-cover shrink-0" alt="" />
                <div className="hidden md:block text-left overflow-hidden">
                  <p className="font-black text-slate-900 text-[11px] uppercase tracking-widest truncate">{pData?.displayName}</p>
                  <p className="text-[9px] text-slate-400 font-bold truncate mt-1">{chat.lastMessage || 'Establish signal...'}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {activeChat ? (
          <>
            <div className="p-6 md:p-8 border-b border-precision flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <img src={otherParticipant?.avatarUrl} className="w-10 h-10 md:w-12 md:h-12 rounded-xl" alt="" />
                <div>
                  <h3 className="font-black text-slate-900 text-sm md:text-lg uppercase tracking-tight">{otherParticipant?.displayName}</h3>
                  <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest font-mono">Neural_Uplink_Active</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scroll-container p-8 space-y-6">
              {messages.map((msg, idx) => {
                const isMe = msg.senderId === currentUser.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`max-w-[80%] p-5 rounded-[2rem] text-sm font-medium ${isMe ? 'bg-indigo-600 text-white rounded-tr-none shadow-xl shadow-indigo-100' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
                      {msg.text}
                      <div className={`text-[8px] font-black uppercase mt-2 opacity-50 ${isMe ? 'text-right' : 'text-left'}`}>
                        {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-6 md:p-8 border-t border-precision bg-slate-50/50 shrink-0">
              <div className="flex gap-4">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Transmit signal..."
                  className="flex-1 bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-inner"
                />
                <button 
                  disabled={!newMessage.trim() || isSending}
                  className="p-4 md:px-8 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all active:scale-90 disabled:opacity-50 shadow-xl"
                >
                  {isSending ? '...' : <svg className="w-6 h-6 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-30">
            <div className="w-24 h-24 bg-slate-100 rounded-[2.5rem] flex items-center justify-center mb-6">
              <ICONS.Messages />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.4em] font-mono">Select_Node_For_Comms</p>
          </div>
        )}
      </div>
    </div>
  );
};
