
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { db, auth } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { 
  doc, 
  onSnapshot, 
  collection, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  limit,
} = Firestore as any;
import { LiveStream } from '../../types';
import { ICONS } from '../../constants';

interface LiveWatcherOverlayProps {
  stream: LiveStream;
  onLeave: () => void;
}

interface StreamMessage {
  id: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: any;
}

interface FloatingReaction {
  id: string;
  emoji: string;
  left: number;
}

const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const LiveWatcherOverlay: React.FC<LiveWatcherOverlayProps> = ({ stream, onLeave }) => {
  const [currentViewers, setCurrentViewers] = useState(stream.viewerCount);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'failed'>('connecting');
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [showChat, setShowChat] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const connectionIdRef = useRef<string>(`viewer_${auth.currentUser?.uid || 'anon'}_${Math.random().toString(36).substring(2, 10)}`);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- WebRTC Logic ---
  useEffect(() => {
    let unsubAnswer: () => void;
    let unsubHostCandidates: () => void;
    const hostCandidateQueue: RTCIceCandidateInit[] = [];

    const connect = async () => {
      if (!db || !auth.currentUser) return;
      const pc = new RTCPeerConnection(rtcConfig);
      pcRef.current = pc;

      pc.ontrack = (event) => {
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
          setStatus('connected');
          videoRef.current.play().catch(console.error);
        }
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          addDoc(collection(db, 'streams', stream.id, 'connections', connectionIdRef.current, 'peerCandidates'), e.candidate.toJSON());
        }
      };

      try {
        pc.addTransceiver('video', { direction: 'recvonly' });
        pc.addTransceiver('audio', { direction: 'recvonly' });
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        await setDoc(doc(db, 'streams', stream.id, 'connections', connectionIdRef.current), { 
          offer: { sdp: offer.sdp, type: offer.type },
          viewerId: auth.currentUser.uid,
          createdAt: serverTimestamp()
        });
        
        unsubAnswer = onSnapshot(doc(db, 'streams', stream.id, 'connections', connectionIdRef.current), async (snap: any) => {
          const data = snap.data();
          if (data?.answer && !pc.currentRemoteDescription) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            while (hostCandidateQueue.length > 0) {
              const cand = hostCandidateQueue.shift();
              if (cand) pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
            }
          }
        });

        unsubHostCandidates = onSnapshot(collection(db, 'streams', stream.id, 'connections', connectionIdRef.current, 'hostCandidates'), (snap: any) => {
          snap.docChanges().forEach(async (change: any) => {
            if (change.type === 'added') {
              const cand = change.doc.data() as RTCIceCandidateInit;
              if (pc.remoteDescription) pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
              else hostCandidateQueue.push(cand);
            }
          });
        });
      } catch (err) { setStatus('failed'); }
    };

    connect();

    const unsubStream = onSnapshot(doc(db, 'streams', stream.id), (snap: any) => {
      if (snap.exists()) setCurrentViewers(snap.data().viewerCount);
      else onLeave(); 
    });

    const chatQuery = query(collection(db, 'streams', stream.id, 'messages'), orderBy('timestamp', 'asc'), limit(50));
    const unsubChat = onSnapshot(chatQuery, (snap: any) => {
      setMessages(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as StreamMessage)));
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    const reactQuery = query(collection(db, 'streams', stream.id, 'reactions'), orderBy('timestamp', 'desc'), limit(1));
    const unsubReact = onSnapshot(reactQuery, (snap: any) => {
      snap.docChanges().forEach((change: any) => {
        if (change.type === 'added') {
          const id = Math.random().toString(36).substring(7);
          const left = Math.floor(Math.random() * 60) + 20; // Constrain to center-ish
          const emoji = change.doc.data().emoji || '❤️';
          setReactions(prev => [...prev, { id, emoji, left }]);
          setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 2500);
        }
      });
    });

    return () => {
      if (unsubAnswer) unsubAnswer();
      if (unsubHostCandidates) unsubHostCandidates();
      unsubStream(); unsubChat(); unsubReact();
      if (pcRef.current) pcRef.current.close();
      if (db) deleteDoc(doc(db, 'streams', stream.id, 'connections', connectionIdRef.current)).catch(() => {});
    };
  }, [stream.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !db || !auth.currentUser) return;
    const text = chatInput.trim();
    setChatInput('');
    await addDoc(collection(db, 'streams', stream.id, 'messages'), {
      senderId: auth.currentUser.uid,
      senderName: auth.currentUser.displayName || 'Anon',
      senderAvatar: auth.currentUser.photoURL,
      text,
      timestamp: serverTimestamp()
    });
  };

  const triggerReaction = async (emoji: string) => {
    if (!db || !auth.currentUser) return;
    const id = Math.random().toString(36).substring(7);
    const left = Math.floor(Math.random() * 30) + 60; // Float on right side
    setReactions(prev => [...prev, { id, emoji, left }]);
    setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 2500);
    
    await addDoc(collection(db, 'streams', stream.id, 'reactions'), {
      userId: auth.currentUser.uid,
      emoji,
      timestamp: serverTimestamp()
    });
  };

  // Render to Body (Portal)
  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black text-white font-sans overflow-hidden flex flex-col h-[100dvh] selection:bg-rose-500">
      
      {/* 1. CINEMATIC VIDEO LAYER */}
      <div className="absolute inset-0 z-0">
         <video 
           ref={videoRef} autoPlay playsInline 
           className={`w-full h-full object-contain bg-black transition-opacity duration-1000 ${status === 'connected' ? 'opacity-100' : 'opacity-0'}`} 
         />
         {status !== 'connected' && (
           <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
              <div className="flex flex-col items-center">
                 <img src={stream.thumbnailUrl} className="w-24 h-24 rounded-full object-cover mb-6 border-4 border-white/10 animate-pulse" alt="" />
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] font-mono animate-pulse">Establishing_Uplink...</p>
              </div>
           </div>
         )}
         {/* Gradients for readability */}
         <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
         <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
      </div>

      {/* 2. FLOATING REACTIONS (Right Side) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
         {reactions.map(r => (
           <div key={r.id} className="absolute bottom-32 text-5xl animate-float-up" style={{ left: `${r.left}%` }}>{r.emoji}</div>
         ))}
      </div>

      {/* 3. INTERFACE LAYER */}
      <div className="relative z-30 flex flex-col h-full pointer-events-none">
         
         {/* TOP HUD */}
         <div className="flex justify-between items-start p-4 md:p-6 pointer-events-auto pt-[max(1.5rem,env(safe-area-inset-top))]">
            <div className="flex items-center gap-3">
               <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-full pl-1 pr-4 py-1 border border-white/10">
                  <img src={stream.authorAvatar} className="w-8 h-8 rounded-full object-cover border border-white/20" alt="" />
                  <div>
                     <p className="text-[9px] font-black uppercase tracking-widest leading-none">{stream.authorName}</p>
                     <p className="text-[8px] font-mono text-white/60">BROADCASTING</p>
                  </div>
               </div>
               <div className="bg-rose-600 text-white px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg">LIVE</div>
               <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg text-[9px] font-black font-mono border border-white/10 flex items-center gap-1.5">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                  {currentViewers}
               </div>
            </div>
            
            <button onClick={onLeave} className="w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 transition-all active:scale-90">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg>
            </button>
         </div>

         {/* BOTTOM AREA: Chat & Controls */}
         <div className="mt-auto px-4 md:px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] flex flex-col gap-4 max-w-2xl pointer-events-auto">
            
            {/* Chat Messages */}
            {showChat && (
               <div className="h-64 overflow-y-auto no-scrollbar flex flex-col justify-end space-y-2 mask-gradient-top relative z-10">
                  {messages.map((msg) => (
                    <div key={msg.id} className="flex items-start gap-2 animate-in slide-in-from-left-4 duration-300">
                       <img src={msg.senderAvatar} className="w-6 h-6 rounded-full object-cover border border-white/20" alt="" />
                       <div className="flex flex-col items-start">
                          <span className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-0.5">{msg.senderName}</span>
                          <span className="text-xs font-bold text-white drop-shadow-md">{msg.text}</span>
                       </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
               </div>
            )}

            {/* Input Deck */}
            <div className="flex items-end gap-3 relative z-20">
               <form onSubmit={handleSendMessage} className="flex-1 relative">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Inject message..."
                    className="w-full bg-white/10 border border-white/20 rounded-full px-6 py-3.5 text-sm font-bold text-white placeholder:text-white/40 focus:bg-black/60 focus:border-white/40 outline-none backdrop-blur-md transition-all shadow-lg"
                  />
                  <button type="submit" disabled={!chatInput.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white text-black rounded-full disabled:opacity-0 transition-opacity">
                     <svg className="w-4 h-4 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  </button>
               </form>
               
               <div className="flex gap-2">
                  <button onClick={() => setShowChat(!showChat)} className={`w-12 h-12 rounded-full flex items-center justify-center border backdrop-blur-md transition-all active:scale-90 ${showChat ? 'bg-white text-black border-white' : 'bg-black/30 text-white border-white/20'}`}>
                     <ICONS.Messages />
                  </button>
                  <button onClick={() => triggerReaction('❤️')} className="w-12 h-12 bg-rose-600 border border-rose-500 rounded-full flex items-center justify-center text-xl shadow-lg active:scale-90 transition-transform">
                     ❤️
                  </button>
                  <button onClick={() => triggerReaction('🔥')} className="w-12 h-12 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-xl backdrop-blur-md active:scale-90 transition-transform">
                     🔥
                  </button>
               </div>
            </div>
         </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .mask-gradient-top { 
          -webkit-mask-image: linear-gradient(to top, black 80%, transparent 100%);
          mask-image: linear-gradient(to top, black 80%, transparent 100%);
        }
        @keyframes float-up {
          0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateY(-400px) scale(1.5) rotate(15deg); opacity: 0; }
        }
        .animate-float-up { animation: float-up 2.5s ease-out forwards; }
      `}} />
    </div>,
    document.body
  );
};
