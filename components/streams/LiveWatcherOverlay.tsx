
import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../../services/firebase';
import { 
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
  Timestamp 
} from 'firebase/firestore';
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
  timestamp: Timestamp;
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
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
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
  const [isPulseExpanded, setIsPulseExpanded] = useState(false);
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
        await setDoc(doc(db, 'streams', stream.id, 'connections', connectionIdRef.current), { 
          offer: { sdp: offer.sdp, type: offer.type },
          viewerId: auth.currentUser.uid,
          createdAt: serverTimestamp()
        });
        setStatus('p2p_sync');
        unsubAnswer = onSnapshot(doc(db, 'streams', stream.id, 'connections', connectionIdRef.current), async (snap) => {
          const data = snap.data();
          if (data?.answer && !pc.currentRemoteDescription) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            while (hostCandidateQueue.length > 0) {
              const cand = hostCandidateQueue.shift();
              if (cand) pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
            }
          }
        });
        unsubHostCandidates = onSnapshot(collection(db, 'streams', stream.id, 'connections', connectionIdRef.current, 'hostCandidates'), (snap) => {
          snap.docChanges().forEach(async (change) => {
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

    const unsubStream = onSnapshot(doc(db, 'streams', stream.id), (snap) => {
      if (snap.exists()) setCurrentViewers(snap.data().viewerCount);
      else onLeave();
    });

    const chatQuery = query(collection(db, 'streams', stream.id, 'messages'), orderBy('timestamp', 'asc'), limit(50));
    const unsubChat = onSnapshot(chatQuery, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as StreamMessage)));
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    const reactQuery = query(collection(db, 'streams', stream.id, 'reactions'), orderBy('timestamp', 'desc'), limit(1));
    const unsubReact = onSnapshot(reactQuery, (snap) => {
      snap.docChanges().forEach(change => {
        if (change.type === 'added') {
          const id = Math.random().toString(36).substring(7);
          const left = Math.floor(Math.random() * 60) + 20;
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
    setIsPulseExpanded(false);
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
      <div className="relative flex-1 bg-black flex items-center justify-center min-h-0">
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
                <h2 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none">{stream.authorName}'s SIGNAL</h2>
                <p className="text-[10px] md:text-xs font-black text-indigo-400 uppercase tracking-[0.6em] font-mono animate-pulse italic">Synchronizing_Neural_Frequencies</p>
                <button onClick={onLeave} className="mt-12 px-10 py-4 bg-white/5 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-white/10 transition-all active:scale-95 italic">Abort_Sync</button>
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

        {/* TOP HUD */}
        <div className="absolute top-0 left-0 right-0 p-4 md:p-10 flex justify-between items-start z-[60] pointer-events-none">
           <div className="flex gap-2 md:gap-4 pointer-events-auto">
              <div className="bg-rose-600 text-white px-3 md:px-5 py-2 md:py-3 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl border border-white/5">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-white" /> LIVE
              </div>
              <div className="bg-black/60 backdrop-blur-3xl text-white px-3 md:px-5 py-2 md:py-3 rounded-xl md:rounded-2xl text-[9px] md:text-[11px] font-black font-mono border border-white/10 shadow-2xl flex items-center gap-2">
                <svg className="w-3 md:w-4 h-3 md:h-4 text-rose-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                {currentViewers}
              </div>
           </div>
           
           <div className="flex gap-2 md:gap-4 pointer-events-auto">
              <button onClick={() => setIsMuted(!isMuted)} className="p-2.5 md:p-4 bg-black/40 backdrop-blur-3xl text-white rounded-xl md:rounded-2xl border border-white/10 hover:bg-white/20 transition-all active:scale-90 shadow-xl">
                {isMuted ? (
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                ) : (
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                )}
              </button>
              <button onClick={onLeave} className="px-5 md:px-10 py-2.5 md:py-4 bg-white/10 hover:bg-rose-600 text-white rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 backdrop-blur-3xl shadow-xl active:scale-95">EXIT</button>
           </div>
        </div>

        {/* BOTTOM IDENTITY HUB */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-10 bg-gradient-to-t from-black via-black/40 to-transparent z-[50]">
           <div className="flex items-center gap-4 md:gap-8 max-w-full">
              <div className="relative shrink-0 pointer-events-auto">
                <div className="p-1 bg-gradient-to-tr from-indigo-500 to-emerald-500 rounded-[1.5rem] md:rounded-[2.2rem] shadow-2xl">
                  <img src={stream.authorAvatar} className="w-14 h-14 md:w-24 md:h-24 rounded-[1.2rem] md:rounded-[1.8rem] border-2 border-black object-cover" alt="" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-indigo-600 rounded-lg w-6 h-6 flex items-center justify-center border-2 border-black shadow-lg"><ICONS.Verified /></div>
              </div>
              <div className="flex-1 min-w-0 pointer-events-none">
                 <p className="text-[8px] md:text-[11px] font-black text-white/40 uppercase tracking-[0.4em] font-mono mb-1 truncate italic">NODE_SYNC: {stream.authorName.toUpperCase()}</p>
                 <h1 className="text-xl md:text-4xl font-black text-white uppercase italic tracking-tighter leading-none truncate pr-4">{stream.title}</h1>
              </div>
           </div>
        </div>
      </div>

      {/* WATCHER COMMS PANEL (Responsive Sidebar/Bottom Drawer) */}
      <div className={`flex flex-col bg-slate-950/90 backdrop-blur-3xl lg:w-[420px] xl:w-[480px] border-t lg:border-t-0 lg:border-l border-white/10 relative transition-all duration-700 z-[70] ${showChatMobile ? 'h-[40vh] lg:h-full' : 'h-14 lg:h-full'}`}>
         
         <div className="p-4 lg:p-8 border-b border-white/10 flex items-center justify-between bg-black/40 shrink-0">
            <div className="flex items-center gap-3">
              <h3 className="text-white text-xs lg:text-xl font-black uppercase italic tracking-tighter">NEURAL_CHAT</h3>
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-emerald-500/50" />
            </div>
            <button 
              onClick={() => setShowChatMobile(!showChatMobile)}
              className="lg:hidden p-2 text-white/40 hover:text-white"
            >
              <svg className={`w-5 h-5 transition-transform ${showChatMobile ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="3" /></svg>
            </button>
         </div>

         <div className={`flex-1 overflow-y-auto no-scrollbar p-5 lg:p-8 space-y-4 lg:space-y-6 bg-slate-950/40 ${!showChatMobile ? 'hidden lg:block' : ''}`}>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-10 text-center px-10">
                 <div className="w-14 h-14 lg:w-20 lg:h-20 bg-white/5 rounded-2xl lg:rounded-3xl mb-4 lg:mb-6 flex items-center justify-center border border-white/5 animate-pulse"><ICONS.Messages /></div>
                 <p className="text-[9px] lg:text-[11px] font-black uppercase tracking-[0.4em] font-mono italic">AWAITING_SIGNALS...</p>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className="flex gap-4 animate-in slide-in-from-right-4 duration-400 group">
                   <img src={msg.senderAvatar} className="w-9 h-9 lg:w-11 lg:h-11 rounded-xl shrink-0 object-cover border border-white/10 shadow-lg" alt="" />
                   <div className="min-w-0 flex-1">
                      <p className="text-[9px] lg:text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 truncate">{msg.senderName}</p>
                      <p className="text-[13px] lg:text-[15px] text-white/90 font-bold leading-relaxed bg-white/5 p-3 lg:p-4 rounded-xl rounded-tl-none border border-white/5 shadow-inner">
                        {msg.text}
                      </p>
                   </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
         </div>

         <div className={`p-4 lg:p-8 border-t border-white/10 bg-black/60 relative shrink-0 ${!showChatMobile ? 'hidden lg:block' : ''}`}>
            {/* Reaction Matrix */}
            {isPulseExpanded && (
              <div className="absolute bottom-full left-4 right-4 mb-4 p-4 bg-slate-900 border border-white/10 rounded-[2rem] shadow-2xl animate-in slide-in-from-bottom-6 flex justify-around items-center backdrop-blur-3xl z-50">
                 {['❤️', '🔥', '🙌', '🎯', '🚀', '🧠'].map(e => (
                   <button key={e} onClick={() => triggerReaction(e)} className="text-2xl md:text-3xl hover:scale-125 transition-transform active:scale-90 p-2">{e}</button>
                 ))}
              </div>
            )}

            <form onSubmit={handleSendMessage} className="relative flex gap-3">
               <button 
                 type="button"
                 onClick={() => setIsPulseExpanded(!isPulseExpanded)}
                 className={`w-12 h-12 lg:w-16 lg:h-16 rounded-xl lg:rounded-2xl flex items-center justify-center text-xl lg:text-2xl shadow-xl transition-all active:scale-90 border-2 ${isPulseExpanded ? 'bg-indigo-600 border-white text-white rotate-45' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
               >
                 ❤️
               </button>
               <input 
                 type="text" 
                 value={chatInput}
                 onChange={(e) => setChatInput(e.target.value)}
                 placeholder="Signal message..."
                 className="flex-1 bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl px-5 lg:px-8 py-3 lg:py-5 text-white font-bold text-xs lg:text-sm focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-white/10 shadow-inner"
               />
               <button 
                 disabled={!chatInput.trim()}
                 className="w-12 h-12 lg:w-16 lg:h-16 bg-white text-slate-950 rounded-xl lg:rounded-2xl hover:bg-indigo-50 transition-all disabled:opacity-20 active:scale-90 shadow-2xl flex items-center justify-center shrink-0"
               >
                 <svg className="w-5 h-5 lg:w-7 lg:h-7 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
               </button>
            </form>
         </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float-up {
          0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateY(-600px) scale(2.8) rotate(10deg); opacity: 0; }
        }
        .animate-float-up {
          animation: float-up 2.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </div>
  );
};
