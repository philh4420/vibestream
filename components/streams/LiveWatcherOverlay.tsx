
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
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isPulseExpanded, setIsPulseExpanded] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const connectionIdRef = useRef<string>(`viewer_${auth.currentUser?.uid || 'anon'}_${Math.random().toString(36).substring(2, 10)}`);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // WebRTC Stream Connection Logic
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

    // Comms & Meta Listeners
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
    } catch (e) { console.error("Neural Comms Interrupted"); }
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
    } catch (e) { console.error("Pulse Failed"); }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black flex items-stretch justify-center overflow-hidden selection:bg-indigo-500">
      <div className="relative w-full h-full bg-slate-950 flex flex-col md:flex-row">
        
        {/* Cinematic Primary Viewport */}
        <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
          <video 
            ref={videoRef} autoPlay playsInline 
            muted={isMuted}
            className={`w-full h-full object-cover transition-all duration-1000 ${status === 'established' ? 'opacity-100 scale-100' : 'opacity-0 scale-110 blur-3xl'}`} 
          />
          
          {/* Establish Connection Overlay */}
          {status !== 'established' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-12 bg-slate-950/80 backdrop-blur-3xl z-50 p-12 text-center animate-in fade-in duration-700">
               <div className="w-32 h-32 bg-white/5 rounded-[3.5rem] border border-white/10 flex items-center justify-center shadow-2xl relative">
                  <div className="absolute inset-0 rounded-[3.5rem] bg-indigo-500/20 animate-pulse" />
                  <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
               </div>
               <div className="space-y-6">
                  <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">{stream.authorName}'s SIGNAL</h2>
                  <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.6em] font-mono animate-pulse">Establishing_Neural_Sync</p>
                  <button onClick={onLeave} className="mt-8 px-12 py-5 bg-white/5 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-white/10 transition-all active:scale-95">ABORT_CONNECTION</button>
               </div>
            </div>
          )}

          {/* Neural Pulse Reaction Monitor */}
          <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
             {reactions.map(r => (
               <div 
                 key={r.id} 
                 className="absolute bottom-40 text-6xl animate-float-up opacity-0"
                 style={{ left: `${r.left}%` }}
               >
                 {r.emoji}
               </div>
             ))}
          </div>

          {/* TOP HUD NAV */}
          <div className="absolute top-0 left-0 right-0 p-8 md:p-12 flex justify-between items-start z-[60] pointer-events-none">
            <div className="flex gap-4 pointer-events-auto">
              <div className="bg-rose-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 shadow-2xl border border-white/10">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-white" />
                LIVE_SIGNAL
              </div>
              <div className="bg-black/60 backdrop-blur-3xl text-white px-6 py-3 rounded-2xl text-[11px] font-black font-mono border border-white/10 shadow-2xl flex items-center gap-3">
                <svg className="w-4 h-4 text-rose-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                {currentViewers.toLocaleString('en-GB')}
              </div>
            </div>
            
            <div className="flex gap-4 pointer-events-auto">
              <button onClick={() => setIsMuted(!isMuted)} className="p-4 bg-black/40 backdrop-blur-3xl text-white rounded-2xl border border-white/10 hover:bg-white/20 transition-all active:scale-90 shadow-xl">
                {isMuted ? (
                  <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" strokeWidth="3" /></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                )}
              </button>
              <button onClick={onLeave} className="px-10 py-3 bg-white/10 hover:bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 backdrop-blur-3xl shadow-xl active:scale-95">EXIT_SYNC</button>
            </div>
          </div>

          {/* LOWER IDENTITY CARD */}
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent z-[50]">
             <div className="flex items-center gap-8 max-w-5xl">
                <div className="relative shrink-0 pointer-events-auto">
                  <div className="p-1.5 bg-gradient-to-tr from-indigo-500 to-emerald-500 rounded-[2.5rem] shadow-2xl">
                    <img src={stream.authorAvatar} className="w-20 h-20 md:w-28 md:h-28 rounded-[2rem] border-4 border-slate-950 object-cover" alt="" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-indigo-600 rounded-xl w-8 h-8 flex items-center justify-center border-4 border-slate-950 shadow-xl"><ICONS.Verified /></div>
                </div>
                <div className="flex-1 min-w-0 pointer-events-none">
                   <p className="text-[12px] font-black text-white/40 uppercase tracking-[0.5em] font-mono mb-2 truncate italic">UPLINK_ORIGIN: {stream.authorName}</p>
                   <h1 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none truncate drop-shadow-2xl">{stream.title}</h1>
                </div>
             </div>
          </div>
        </div>

        {/* NEURAL COMMS MESH (Chat Sidebar/Overlay) */}
        <div className={`flex flex-col w-full md:w-[420px] lg:w-[480px] bg-slate-950/80 backdrop-blur-3xl border-l border-white/10 relative transition-all duration-700 z-[70] ${orientation === 'portrait' ? 'h-[40vh]' : 'h-full'}`}>
           <div className="p-8 border-b border-white/10 flex items-center justify-between bg-black/40">
              <div>
                <h3 className="text-white text-xl font-black uppercase italic tracking-tighter">NEURAL_CHAT</h3>
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest font-mono">ENCRYPTED_GRID_BUFFER</p>
              </div>
              <div className="flex items-center gap-4">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-emerald-500/50" />
                 <span className="text-[8px] font-black text-white/40 uppercase tracking-widest font-mono">NOMINAL</span>
              </div>
           </div>

           <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-5">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-10 text-center px-10">
                   <div className="w-20 h-20 bg-white/5 rounded-3xl mb-6 flex items-center justify-center border border-white/5"><ICONS.Messages /></div>
                   <p className="text-[11px] font-black uppercase tracking-[0.4em] font-mono italic leading-relaxed">AWAITING_SIGNAL_INJECTION_FROM_PEER_MESH</p>
                </div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className="flex gap-4 animate-in slide-in-from-right-4 duration-400">
                     <img src={msg.senderAvatar} className="w-10 h-10 rounded-xl shrink-0 object-cover border border-white/10 shadow-lg" alt="" />
                     <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-2">{msg.senderName}</p>
                        <p className="text-[14px] text-white/90 font-bold leading-relaxed bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/5 shadow-inner">
                          {msg.text}
                        </p>
                     </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
           </div>

           <div className="p-8 border-t border-white/10 bg-black/60 relative">
              {/* Pulse Multi-Emoji Selector */}
              {isPulseExpanded && (
                <div className="absolute bottom-full left-8 right-8 mb-6 p-4 bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom-6 flex justify-around items-center backdrop-blur-3xl">
                   {['❤️', '🔥', '🙌', '🎯', '🚀', '🧠'].map(e => (
                     <button key={e} onClick={() => triggerReaction(e)} className="text-3xl hover:scale-125 transition-transform active:scale-90 p-2">{e}</button>
                   ))}
                </div>
              )}

              <form onSubmit={handleSendMessage} className="relative flex gap-4">
                 <button 
                   type="button"
                   onClick={() => setIsPulseExpanded(!isPulseExpanded)}
                   className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-xl transition-all active:scale-90 border-2 ${isPulseExpanded ? 'bg-rose-600 border-white text-white rotate-45' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                 >
                   ❤️
                 </button>
                 <input 
                   type="text" 
                   value={chatInput}
                   onChange={(e) => setChatInput(e.target.value)}
                   placeholder="Transmit pulse to grid..."
                   className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-8 py-5 text-white font-bold text-sm focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all placeholder:text-white/10 shadow-inner"
                 />
                 <button 
                   disabled={!chatInput.trim()}
                   className="w-16 h-16 bg-white text-slate-950 rounded-2xl hover:bg-indigo-50 transition-all disabled:opacity-20 active:scale-90 shadow-2xl flex items-center justify-center"
                 >
                   <svg className="w-7 h-7 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                 </button>
              </form>
           </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float-up {
          0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(-600px) scale(2.5) rotate(15deg); opacity: 0; }
        }
        .animate-float-up {
          animation: float-up 2.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </div>
  );
};
