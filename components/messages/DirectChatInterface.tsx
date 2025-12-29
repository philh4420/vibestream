
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  orderBy, 
  limit, 
  updateDoc, 
  doc, 
  deleteDoc,
  writeBatch,
  where,
  getDocs
} = Firestore as any;
import { User, Message, Chat } from '../../types';
import { ICONS } from '../../constants';
import { EmojiPicker } from '../ui/EmojiPicker';
import { GiphyPicker } from '../ui/GiphyPicker';
import { DeleteConfirmationModal } from '../ui/DeleteConfirmationModal';
import { uploadToCloudinary } from '../../services/cloudinary';
import { GiphyGif } from '../../services/giphy';
import { extractUrls } from '../../lib/textUtils';
import { LinkPreview } from '../ui/LinkPreview';
import { RichTextEditor, RichTextEditorRef } from '../ui/RichTextEditor';

interface DirectChatInterfaceProps {
  chatId: string;
  currentUser: User;
  allUsers: User[];
  onBack: () => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  chatData: Chat;
}

export const DirectChatInterface: React.FC<DirectChatInterfaceProps> = ({ chatId, currentUser, allUsers, onBack, addToast, chatData }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isGiphyPickerOpen, setIsGiphyPickerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedGif, setSelectedGif] = useState<GiphyGif | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  
  const [terminationTarget, setTerminationTarget] = useState<{ id: string, label: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<RichTextEditorRef>(null);

  useEffect(() => {
    if (!db || !chatId || !currentUser.id) return;
    if (currentUser.settings?.privacy?.readReceipts === false) return;
    const markRead = async () => {
        try {
            const q = query(collection(db, 'chats', chatId, 'messages'), where('isRead', '==', false), where('senderId', '!=', currentUser.id));
            const snap = await getDocs(q);
            if (!snap.empty) {
                const batch = writeBatch(db);
                snap.docs.forEach((d: any) => batch.update(d.ref, { isRead: true }));
                await batch.commit();
            }
        } catch (e) { console.error(e); }
    };
    markRead();
  }, [chatId, messages.length, currentUser.id, currentUser.settings?.privacy?.readReceipts]);

  useEffect(() => {
    if (!db || !chatId) return;
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp', 'asc'), limit(50));
    const unsub = onSnapshot(q, (snap: any) => {
      const fetched = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Message));
      setMessages(fetched);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 300);
    });
    return () => unsub();
  }, [chatId]);

  const handleExecuteTermination = async () => {
    if (!terminationTarget || !db) return;
    try {
      await deleteDoc(doc(db, 'chats', terminationTarget.id));
      addToast("Link Terminated Successfully", "success");
      setTerminationTarget(null);
      onBack();
    } catch (e) {
      addToast("Termination Protocol Failed", "error");
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile && !selectedGif) || !chatId || isSending) return;
    setIsSending(true);
    let mediaItems: { type: 'image' | 'video', url: string }[] = [];
    try {
      if (selectedFile) {
        const url = await uploadToCloudinary(selectedFile);
        mediaItems.push({ type: selectedFile.type.startsWith('video/') ? 'video' : 'image', url });
      } else if (selectedGif) {
        mediaItems.push({ type: 'image', url: selectedGif.images.original.url });
      }
      const msgText = newMessage.trim();
      const payload: any = { senderId: currentUser.id, text: msgText, timestamp: serverTimestamp(), isRead: false };
      if (mediaItems.length > 0) payload.media = mediaItems;
      await addDoc(collection(db, 'chats', chatId, 'messages'), payload);
      const lastMsgText = mediaItems.length > 0 ? (msgText ? `📎 ${msgText}` : '📎 Artifact') : msgText;
      await updateDoc(doc(db, 'chats', chatId), { lastMessage: lastMsgText, lastMessageTimestamp: serverTimestamp() });
      setNewMessage(''); editorRef.current?.clear(); if (mediaPreview && selectedFile) URL.revokeObjectURL(mediaPreview);
      setSelectedFile(null); setSelectedGif(null); setMediaPreview(null);
    } catch (e) { addToast("Transmission Interrupted", "error"); } finally { setIsSending(false); }
  };

  const otherParticipantId = chatData.participants.find(id => id !== currentUser.id);
  const otherParticipant = chatData.participantData?.[otherParticipantId || ''];
  const targetUserFull = allUsers.find(u => u.id === otherParticipantId);
  const showActivity = targetUserFull?.settings?.privacy?.activityStatus !== false;

  return (
    <div className="flex flex-col h-full relative animate-in fade-in duration-500 bg-[#020617]">
      <div className="relative z-20 px-8 py-5 border-b border-slate-900 bg-black/80 backdrop-blur-3xl flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="md:hidden w-11 h-11 bg-slate-900 text-slate-500 rounded-2xl flex items-center justify-center transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3.5}><path d="M15 19l-7-7 7-7" /></svg></button>
          <div className="flex items-center gap-4">
            <div onClick={() => window.dispatchEvent(new CustomEvent('vibe-navigate', { detail: { route: 'profile', userId: otherParticipantId } }))} className="relative shrink-0 w-14 h-14 rounded-[1.4rem] cursor-pointer group transition-transform hover:scale-105">
              <img src={otherParticipant?.avatarUrl} className="w-full h-full rounded-[1.4rem] object-cover border-2 border-slate-900 shadow-premium" alt="" />
              {showActivity && targetUserFull?.presenceStatus === 'Online' && <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-[3px] border-black bg-emerald-500 shadow-[0_0_12px_#10b981]" />}
            </div>
            <div>
              <h3 className="font-black text-xl text-white uppercase tracking-tight italic leading-none">{otherParticipant?.displayName}</h3>
              <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest font-mono mt-1.5">{showActivity ? (targetUserFull?.presenceStatus || 'OFFLINE') : 'ENCRYPTED'}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={() => setTerminationTarget({ id: chatId, label: otherParticipant?.displayName || 'Link' })} className="w-12 h-12 bg-slate-900 text-slate-500 hover:text-rose-500 rounded-2xl flex items-center justify-center transition-all border border-slate-800"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-10 py-10 space-y-1 relative">
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === currentUser.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group/msg animate-in fade-in slide-in-from-bottom-1 duration-300 mt-0.5`}>
              <div className={`p-4 md:p-5 text-sm md:text-[15px] font-bold shadow-sm relative transition-all duration-300 rounded-[2rem] ${isMe ? 'bg-white text-slate-950 shadow-white/5' : 'bg-slate-900 text-white border border-slate-800'}`}>
                {msg.media && msg.media.map((item, mIdx) => (
                    <div key={mIdx} className="mb-4 rounded-[1.8rem] overflow-hidden shadow-lg border border-slate-800"><img src={item.url} alt="" className="w-full h-auto max-h-[300px] object-cover" /></div>
                ))}
                <div className="leading-[1.5]" dangerouslySetInnerHTML={{ __html: msg.text }} />
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} className="h-10" />
      </div>

      <div className="px-6 md:px-10 pb-8 pt-4 relative z-30">
        <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-[3rem] p-2.5 shadow-heavy">
          <div className="flex gap-2 items-end">
            <div className="flex gap-1.5 pb-1 pl-1">
              <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 rounded-2xl bg-black border border-slate-800 text-slate-500 flex items-center justify-center hover:text-white transition-all"><ICONS.Create /></button>
            </div>
            <div className="flex-1 pb-1">
                <RichTextEditor ref={editorRef} content={newMessage} onChange={setNewMessage} onSubmit={() => handleSendMessage()} placeholder="Type_Signal_Buffer..." className="w-full bg-black/60 rounded-[2.2rem] px-2 py-1 text-white shadow-inner" minHeight="52px" />
            </div>
            <button onClick={() => handleSendMessage()} disabled={(!newMessage.trim() && !selectedFile && !selectedGif) || isSending} className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center transition-all active:scale-95 group mb-1 shrink-0"><svg className="w-8 h-8 rotate-90 ml-1 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3.5}><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg></button>
          </div>
        </div>
      </div>
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={(e) => { const f = e.target.files?.[0]; if(f){ setSelectedFile(f); setMediaPreview(URL.createObjectURL(f)); } }} />
      <DeleteConfirmationModal isOpen={!!terminationTarget} title="TERMINATE_LINK" description={`Sever active handshake with ${terminationTarget?.label}?`} onConfirm={handleExecuteTermination} onCancel={() => setTerminationTarget(null)} />
    </div>
  );
};
