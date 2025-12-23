
import React, { useState, useEffect, useRef } from 'react';
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
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
};

export const LiveWatcherOverlay: React.FC<LiveWatcherOverlayProps> = ({ stream, onLeave }) => {
  const [currentViewers, setCurrentViewers] = useState(stream.viewerCount);
  const [status, setStatus] = useState<'handshaking' | 'p2p_sync' | 'established' | 'failed'>('handshaking');
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [showChatMobile, setShowChatMobile] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const connectionIdRef = useRef<string>(`viewer_${auth.currentUser?.uid || 'anon'}_${Math.random().toString(36).substring(2, 10)}`);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // WebRTC & Data Listeners
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
          setStatus('established');
          videoRef.current.play().catch(() => {
            if (videoRef.current) videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current?.play().catch(console.error);
          });
        }
      };

      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        if (state === 'connected' || state === 'completed') setStatus('established');
        if (state === 'failed' || state === 'closed') setStatus('failed');
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
        
        // Register viewer connection
        await setDoc(doc(db, 'streams', stream.id, 'connections', connectionIdRef.current), { 
          offer: { sdp: offer.sdp, type: offer.type },
          viewerId: auth.currentUser.uid,
          createdAt: serverTimestamp()
        });
        
        setStatus('p2p_sync');

        // Listen for Answer
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

        // Listen for Host ICE Candidates
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

    // Stream Metadata Listener
    const unsubStream = onSnapshot(doc(db, 'streams', stream.id), (snap: any) => {
      if (snap.exists()) setCurrentViewers(snap.data().viewerCount);
      else onLeave(); // Stream ended
    });

    // Chat Listener
    const chatQuery = query(collection(db, 'streams', stream.id, 'messages'), orderBy('timestamp', 'asc'), limit(50));
    const unsubChat = onSnapshot(chatQuery, (snap: any) => {
      setMessages(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as StreamMessage)));
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    // Reaction Listener
    const reactQuery = query(collection(db, 'streams', stream.id, 'reactions'), orderBy('timestamp', 'desc'), limit(1));
    const unsubReact = onSnapshot(reactQuery, (snap: any) => {
      snap.docChanges().forEach((change: any) => {
        if (change.type === 'added') {
          const id = Math.random().toString(36).substring(7);
          const left = Math.floor(Math.random() * 80) + 10;
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
    try {
      await addDoc(collection(db, 'streams', stream.id, 'messages'), {
        senderId: auth.currentUser.uid,
        senderName: auth.currentUser.displayName || 'Unnamed Node',
        senderAvatar: auth.currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.currentUser.uid}`,
        text,
        timestamp: serverTimestamp()
      });
    } catch (e) { console.error("Neural Comms Error"); }
  };

  const triggerReaction = async (emoji: string = '❤️') => {
    if (!db || !auth.currentUser) return;
    // Local Optimistic Update
    const id = Math.random().toString(36).substring(7);
    const left = Math.floor(Math.random() * 80) + 10;
    setReactions(prev => [...prev, { id, emoji, left }]);
    setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 2500);

    try {
      await addDoc(collection(db, 'streams', stream.id, 'reactions'), {
        userId: auth.currentUser.uid,
        emoji,
        timestamp: serverTimestamp()
      });
    } catch (e) { console.error("Pulse Error"); }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black flex flex-col lg:flex-row items-stretch justify-center overflow-hidden selection:bg-indigo-500 font-sans">
      
      {/* Cinematic Viewport */}
      <div className="relative flex-1 bg-black flex items-center justify-center min-h-0 group/video">
        <video 
          ref={videoRef} autoPlay playsInline muted={isMuted}
          className={`w-full h-full object-cover transition-all duration-1000 ${status === 'established' ? 'opacity-100 scale-100' : 'opacity-0 scale-105 blur-2xl'}`} 
        />
        
        {/* Establishing Link Overlay */}
        {status !== 'established' && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-8 bg-slate-950/90 backdrop-blur-3xl text-center">
             <div className="w-24 h-24 md:w-32 md:h-32 bg-white/5 rounded-[3rem] border border-white/10 flex items-center justify-center shadow-2xl relative mb-10">
                <div className="absolute inset-0 rounded-[3rem] bg-indigo-500/20 animate-pulse" />
                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
             </div>
             <div className="space-y-4">
                <div className="flex items-center justify-center gap-3 opacity-60">
                   <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
                   <span className="text-[9px] font-black font-mono tracking-widest uppercase">ENCRYPTED_HANDSHAKE</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none">{stream.authorName}</h2>
                <p className="text-[10px] md:text-xs font-black text-indigo-400 uppercase tracking-[0.6em] font-mono animate-pulse italic">DECRYPTING_SIGNAL...</p>
                <button onClick={onLeave} className="mt-12 px-10 py-4 bg-white/5 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-white/10 transition-all active:scale-95 italic">Abort_Link</button>
             </div>
          </div>
        )}

        {/* Reaction Layer */}
        <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
           {reactions.map(r => (
             <div key={r.id} className="absolute bottom-1/3 text-6xl animate-float-up" style={{ left: `${r.left}%` }}>
               {r.emoji}
             </div>
           ))}
        </div>

        {/* TOP HUD - Autohide on idle if needed, but keeping visible for pro feel */}
        <div className="absolute top-0 left-0 right-0 p-4 md:p-8 flex justify-between items-start z-[60] pointer-events-none transition-opacity duration-300">
           <div className="flex gap-3 pointer-events-auto">
              <div className="bg-rose-600/90 backdrop-blur-md text-white px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl border border-white/10">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-white" />
                LIVE
              </div>
              <div className="bg-black/60 backdrop-blur-md text-white px-4 py-2.5 rounded-xl text-[10px] font-black font-mono border border-white/10 shadow-xl flex items-center gap-2">
                 <svg className="w-3 h-3 text-rose-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                 {currentViewers.toLocaleString()}
              </div>
           </div>
           
           <div className="flex gap-3 pointer-events-auto">
              <button onClick={() => setIsMuted(!isMuted)} className="p-3 bg-black/40 hover:bg-white/10 backdrop-blur-md rounded-xl text-white border border-white/10 transition-all active:scale-90">
                 {isMuted ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>}
              </button>
              <button onClick={onLeave} className="p-3 bg-white/10 hover:bg-rose-600 hover:text-white text-white rounded-xl backdrop-blur-md border border-white/10 transition-all active:scale-90 shadow-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
           </div>
        </div>

        {/* BOTTOM HUD - Mobile Only */}
        <div className="lg:hidden absolute bottom-0 left-0 right-0 p-4 z-[60] bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-24 pointer-events-none">
           <div className="pointer-events-auto">
              {/* Reactions Bar */}
              <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar py-1">
                 {['🔥', '❤️', '👏', '🚀'].map(emoji => (
                   <button key={emoji} onClick={() => triggerReaction(emoji)} className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-lg active:scale-90 transition-transform shadow-lg">
                     {emoji}
                   </button>
                 ))}
              </div>

              <div className="flex items-end gap-3">
                 <div className="flex-1">
                    <form onSubmit={handleSendMessage} className="relative">
                       <input 
                         type="text" 
                         value={chatInput}
                         onChange={(e) => setChatInput(e.target.value)}
                         placeholder="Broadcast frequency..."
                         className="w-full bg-white/10 border border-white/10 rounded-2xl pl-5 pr-12 py-3.5 text-white text-sm font-bold placeholder:text-white/40 focus:bg-white/20 outline-none backdrop-blur-md transition-all shadow-lg"
                       />
                       <button 
                         type="submit" 
                         disabled={!chatInput.trim()}
                         className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-xl disabled:opacity-50 active:scale-90 transition-transform shadow-md"
                       >
                         <svg className="w-4 h-4 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                       </button>
                    </form>
                 </div>
                 <button 
                   onClick={() => setShowChatMobile(!showChatMobile)}
                   className={`p-3.5 rounded-2xl backdrop-blur-xl border transition-all active:scale-95 shadow-lg ${showChatMobile ? 'bg-white text-slate-900 border-white' : 'bg-white/10 text-white border-white/10'}`}
                 >
                   <ICONS.Messages />
                 </button>
              </div>
           </div>
        </div>

        {/* MOBILE CHAT OVERLAY */}
        {showChatMobile && (
          <div className="lg:hidden absolute bottom-28 left-4 right-4 h-48 overflow-y-auto no-scrollbar z-[55] mask-linear-fade pointer-events-none">
             <div className="flex flex-col justify-end min-h-full space-y-2 pb-2">
               {messages.map((msg) => (
                 <div key={msg.id} className="flex items-start gap-2 animate-in slide-in-from-bottom-4 duration-300">
                    <img src={msg.senderAvatar} className="w-6 h-6 rounded-lg object-cover border border-white/10 shadow-md" alt="" />
                    <div className="flex flex-col items-start max-w-[85%]">
                       <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl rounded-tl-none border border-white/5 shadow-sm">
                          <span className="text-[9px] font-black text-indigo-300 uppercase tracking-wide mr-2">{msg.senderName}</span>
                          <span className="text-white text-xs font-medium">{msg.text}</span>
                       </div>
                    </div>
                 </div>
               ))}
               <div ref={chatEndRef} />
             </div>
          </div>
        )}
      </div>

      {/* DESKTOP SIDEBAR - Professional Comms Panel */}
      <div className="hidden lg:flex w-[420px] xl:w-[480px] bg-slate-950 border-l border-white/10 flex-col z-[2000] relative shadow-2xl">
         {/* Sidebar Header */}
         <div className="p-8 border-b border-white/5 bg-white/5 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-5 mb-5">
               <div className="relative">
                  <img src={stream.authorAvatar} className="w-16 h-16 rounded-[1.5rem] object-cover border-2 border-slate-700 shadow-xl" alt="" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse" />
               </div>
               <div>
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none mb-1.5">{stream.authorName}</h3>
                  <div className="flex gap-2">
                     <span className="px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/30 rounded-md text-[8px] font-black text-indigo-400 uppercase tracking-widest font-mono">HOST_NODE</span>
                     <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono">UK_LON</span>
                  </div>
               </div>
            </div>
            <h4 className="text-sm font-bold text-slate-300 leading-relaxed line-clamp-2 italic border-l-2 border-rose-500 pl-4">"{stream.title}"</h4>
         </div>

         {/* Chat Stream */}
         <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-5 bg-black/20">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                 <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/5"><ICONS.Messages /></div>
                 <p className="text-[10px] font-black text-white uppercase tracking-widest font-mono">Signal_Quiet</p>
                 <p className="text-[8px] text-slate-500 mt-2 font-mono">Be the first to transmit.</p>
              </div>
            ) : messages.map((msg) => (
              <div key={msg.id} className="flex gap-4 animate-in slide-in-from-right-4 duration-300 group">
                 <img src={msg.senderAvatar} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white/5 opacity-80 group-hover:opacity-100 transition-opacity bg-slate-900" alt="" />
                 <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-1.5">
                       <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest truncate">{msg.senderName}</span>
                       <span className="text-[8px] font-mono text-slate-600">{msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span>
                    </div>
                    <p className="text-sm text-slate-200 font-medium leading-relaxed bg-white/5 p-3.5 rounded-2xl rounded-tl-none border border-white/5 shadow-sm group-hover:bg-white/10 transition-colors">{msg.text}</p>
                 </div>
              </div>
            ))}
            <div ref={chatEndRef} />
         </div>

         {/* Desktop Input Area */}
         <div className="p-6 border-t border-white/5 bg-white/5 backdrop-blur-md shrink-0">
            <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-2">
               {['🔥', '❤️', '👏', '🚀', '🧠', '⚡', '💎'].map(emoji => (
                 <button 
                   key={emoji} 
                   onClick={() => triggerReaction(emoji)}
                   className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/20 border border-white/5 flex items-center justify-center text-lg transition-all active:scale-90 hover:-translate-y-1 shadow-sm"
                 >
                   {emoji}
                 </button>
               ))}
            </div>
            <form onSubmit={handleSendMessage} className="relative group">
               <input 
                 type="text" 
                 value={chatInput}
                 onChange={(e) => setChatInput(e.target.value)}
                 placeholder="Transmit into the mesh..."
                 className="w-full bg-black/40 border border-white/10 rounded-2xl pl-5 pr-14 py-4 text-white text-sm font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-600 group-hover:bg-black/60 shadow-inner"
               />
               <button 
                 type="submit" 
                 disabled={!chatInput.trim()}
                 className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl disabled:opacity-50 disabled:bg-slate-800 hover:bg-indigo-500 transition-all active:scale-90 shadow-lg"
               >
                 <svg className="w-4 h-4 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
               </button>
            </form>
         </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .mask-linear-fade {
          mask-image: linear-gradient(to top, black 0%, black 80%, transparent 100%);
          -webkit-mask-image: linear-gradient(to top, black 0%, black 80%, transparent 100%);
        }
        @keyframes float-up {
          0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-500px) scale(1.5) rotate(20deg); opacity: 0; }
        }
        .animate-float-up {
          animation: float-up 3s ease-out forwards;
        }
      `}} />
    </div>
  );
};
