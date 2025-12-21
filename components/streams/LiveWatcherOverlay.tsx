
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
  limit 
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
  const [showChat, setShowChat] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const connectionIdRef = useRef<string>(`viewer_${auth.currentUser?.uid || 'anon'}_${Math.random().toString(36).substring(2, 10)}`);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // WebRTC & Stream Lifecycle
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
              if (pc.remoteDescription) {
                pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
              } else {
                hostCandidateQueue.push(cand);
              }
            }
          });
        });
      } catch (err) {
        setStatus('failed');
      }
    };

    connect();

    // Stream metadata & chat sync
    const unsubStream = onSnapshot(doc(db, 'streams', stream.id), (snap) => {
      if (snap.exists()) setCurrentViewers(snap.data().viewerCount);
      else onLeave();
    });

    const chatQuery = query(collection(db, 'streams', stream.id, 'messages'), orderBy('timestamp', 'asc'), limit(50));
    const unsubChat = onSnapshot(chatQuery, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as StreamMessage)));
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => {
      if (unsubAnswer) unsubAnswer();
      if (unsubHostCandidates) unsubHostCandidates();
      unsubStream();
      unsubChat();
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
        senderName: auth.currentUser.displayName || 'Node',
        senderAvatar: auth.currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.currentUser.uid}`,
        text,
        timestamp: serverTimestamp()
      });
    } catch (e) { console.error("Chat failure"); }
  };

  const triggerReaction = (emoji: string = '❤️') => {
    const id = Math.random().toString(36).substring(7);
    const left = Math.floor(Math.random() * 80) + 10; // 10% to 90%
    setReactions(prev => [...prev, { id, emoji, left }]);
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id));
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black flex items-center justify-center overflow-hidden">
      <div className="relative w-full h-full bg-slate-950 flex flex-col md:flex-row">
        
        {/* Main Viewport Container */}
        <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
          <video 
            ref={videoRef} autoPlay playsInline 
            muted={isMuted}
            className={`w-full h-full object-cover transition-all duration-1000 ${status === 'established' ? 'opacity-100 scale-100' : 'opacity-0 scale-105 blur-2xl'}`} 
          />
          
          {/* Status Overlays */}
          {status !== 'established' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-10 bg-black/60 backdrop-blur-3xl z-50 p-12 text-center animate-in fade-in duration-500">
               <div className="w-28 h-28 bg-white/5 rounded-[3rem] border border-white/10 flex items-center justify-center">
                  <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
               </div>
               <div className="space-y-4">
                  <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.5em] font-mono animate-pulse">Establishing_Sync</p>
                  <h2 className="text-3xl font-black text-white uppercase italic">{stream.authorName}'s SIGNAL</h2>
                  <button onClick={onLeave} className="mt-8 px-10 py-4 bg-white/5 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl">Abort_Link</button>
               </div>
            </div>
          )}

          {/* Floating Reactions Layer */}
          <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
             {reactions.map(r => (
               <div 
                 key={r.id} 
                 className="absolute bottom-20 text-4xl animate-float-up"
                 style={{ left: `${r.left}%` }}
               >
                 {r.emoji}
               </div>
             ))}
          </div>

          {/* HUD Top Bar */}
          <div className="absolute top-0 left-0 right-0 p-6 md:p-10 flex justify-between items-start z-40 pointer-events-none">
            <div className="flex gap-4 pointer-events-auto">
              <div className="bg-rose-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 shadow-2xl">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                Live
              </div>
              <div className="bg-black/60 backdrop-blur-xl text-white px-5 py-2.5 rounded-2xl text-[10px] font-black font-mono border border-white/10 shadow-2xl flex items-center gap-2">
                <svg className="w-4 h-4 text-white/60" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                {currentViewers.toLocaleString()}
              </div>
            </div>
            
            <div className="flex gap-3 pointer-events-auto">
              <button onClick={() => setIsMuted(!isMuted)} className="p-3 bg-black/40 backdrop-blur-xl text-white rounded-2xl border border-white/10 hover:bg-black/60 transition-all">
                {isMuted ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                )}
              </button>
              <button onClick={onLeave} className="px-6 py-2.5 bg-white/10 hover:bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 backdrop-blur-xl">Exit</button>
            </div>
          </div>

          {/* Stream Info Header */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 bg-gradient-to-t from-black/80 to-transparent z-40">
             <div className="flex items-center gap-6">
                <div className="relative shrink-0">
                  <img src={stream.authorAvatar} className="w-16 h-16 md:w-20 md:h-20 rounded-2xl border-2 border-white/20 object-cover" alt="" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center border-2 border-black"><ICONS.Verified /></div>
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] font-mono mb-1 truncate">Origin: {stream.authorName}</p>
                   <h1 className="text-2xl md:text-4xl font-black text-white uppercase italic tracking-tighter leading-none truncate">{stream.title}</h1>
                </div>
                <button 
                  onClick={() => triggerReaction()} 
                  className="w-14 h-14 md:w-16 md:h-16 bg-rose-600 rounded-[1.5rem] flex items-center justify-center text-2xl shadow-2xl active:scale-90 transition-all hover:bg-rose-500 group pointer-events-auto"
                >
                  <span className="group-hover:scale-125 transition-transform">❤️</span>
                </button>
             </div>
          </div>
        </div>

        {/* Chat Sidebar/Overlay */}
        <div className={`flex flex-col w-full md:w-[360px] lg:w-[420px] bg-slate-950/80 backdrop-blur-3xl border-l border-white/10 relative transition-transform duration-500 ${showChat ? 'translate-x-0' : 'translate-x-full hidden md:flex'}`}>
           <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-white font-black uppercase italic tracking-tighter">Neural_Chat</h3>
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest font-mono">Real-time Buffer v2.6</p>
              </div>
              <button onClick={() => setShowChat(false)} className="md:hidden text-white/40"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="3" /></svg></button>
           </div>

           <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-5">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center px-10">
                   <ICONS.Messages />
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] font-mono mt-4 italic">Awaiting first transmission packet...</p>
                </div>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className="flex gap-3 animate-in slide-in-from-right-2 duration-300">
                     <img src={msg.senderAvatar} className="w-8 h-8 rounded-lg shrink-0 object-cover" alt="" />
                     <div className="min-w-0">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">{msg.senderName}</p>
                        <p className="text-[13px] text-white/90 font-medium leading-relaxed bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/5">{msg.text}</p>
                     </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
           </div>

           <div className="p-6 md:p-8 border-t border-white/5 bg-black/40">
              <form onSubmit={handleSendMessage} className="relative flex gap-3">
                 <input 
                   type="text" 
                   value={chatInput}
                   onChange={(e) => setChatInput(e.target.value)}
                   placeholder="Transmit to grid..."
                   className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold text-sm focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all placeholder:text-white/20"
                 />
                 <button 
                   disabled={!chatInput.trim()}
                   className="p-4 bg-white text-slate-950 rounded-2xl hover:bg-indigo-50 transition-all disabled:opacity-20 active:scale-95"
                 >
                   <svg className="w-6 h-6 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                 </button>
              </form>
           </div>
        </div>
      </div>
    </div>
  );
};
