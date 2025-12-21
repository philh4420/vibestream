
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  updateDoc, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { User } from '../../types';
import { ICONS } from '../../constants';

interface LiveBroadcastOverlayProps {
  userData: User;
  onStart: (title: string) => void;
  onEnd: () => void;
  activeStreamId: string | null;
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

export const LiveBroadcastOverlay: React.FC<LiveBroadcastOverlayProps> = ({ 
  userData, 
  onStart, 
  onEnd, 
  activeStreamId 
}) => {
  const [streamTitle, setStreamTitle] = useState('');
  const [timer, setTimer] = useState(0);
  const [viewerCount, setViewerCount] = useState(0);
  const [hwStatus, setHwStatus] = useState<'checking' | 'ready' | 'failed'>('checking');
  const [isInitializing, setIsInitializing] = useState(false);
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [showChat, setShowChat] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pcInstances = useRef<Record<string, RTCPeerConnection>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 1. Initialize Hardware
  useEffect(() => {
    const initHardware = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user', 
            width: { ideal: 1920 }, 
            height: { ideal: 1080 },
            frameRate: { ideal: 30 } 
          }, 
          audio: { echoCancellation: true, noiseSuppression: true } 
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setHwStatus('ready');
      } catch (err) { 
        setHwStatus('failed');
      }
    };
    initHardware();

    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      Object.values(pcInstances.current).forEach(pc => {
        pc.close();
      });
    };
  }, []);

  // 2. Monitoring & Signaling
  useEffect(() => {
    if (activeStreamId && db) {
      const timerInt = window.setInterval(() => setTimer(prev => prev + 1), 1000);
      
      // Listener: Connections (WebRTC)
      const connectionsRef = collection(db, 'streams', activeStreamId, 'connections');
      const unsubConns = onSnapshot(connectionsRef, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const connectionId = change.doc.id;
            const data = change.doc.data();
            if (data.offer && !pcInstances.current[connectionId]) {
              await setupPeer(connectionId, data.offer, activeStreamId);
            }
          }
        });
      });

      // Listener: Metadata (Viewer Count)
      const unsubMeta = onSnapshot(doc(db, 'streams', activeStreamId), (snap) => {
        if (snap.exists()) setViewerCount(snap.data().viewerCount || 0);
      });

      // Listener: Chat Messages
      const chatQuery = query(collection(db, 'streams', activeStreamId, 'messages'), orderBy('timestamp', 'asc'), limit(50));
      const unsubChat = onSnapshot(chatQuery, (snap) => {
        setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as StreamMessage)));
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      });

      // Listener: Pulse Reactions
      const reactQuery = query(collection(db, 'streams', activeStreamId, 'reactions'), orderBy('timestamp', 'desc'), limit(5));
      const unsubReact = onSnapshot(reactQuery, (snap) => {
        snap.docChanges().forEach(change => {
          if (change.type === 'added') {
            const id = Math.random().toString(36).substring(7);
            const left = Math.floor(Math.random() * 70) + 15;
            setReactions(prev => [...prev, { id, emoji: '❤️', left }]);
            setTimeout(() => {
              setReactions(prev => prev.filter(r => r.id !== id));
            }, 2000);
          }
        });
      });

      return () => { 
        clearInterval(timerInt); 
        unsubConns();
        unsubMeta();
        unsubChat();
        unsubReact();
      };
    }
  }, [activeStreamId]);

  const setupPeer = async (id: string, offer: any, streamId: string) => {
    if (!streamRef.current) return;
    const pc = new RTCPeerConnection(rtcConfig);
    pcInstances.current[id] = pc;

    streamRef.current.getTracks().forEach(track => pc.addTrack(track, streamRef.current!));

    pc.onicecandidate = (e) => {
      if (e.candidate) addDoc(collection(db, 'streams', streamId, 'connections', id, 'hostCandidates'), e.candidate.toJSON());
    };

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await updateDoc(doc(db, 'streams', streamId, 'connections', id), { 
        answer: { type: answer.type, sdp: answer.sdp },
        respondedAt: serverTimestamp()
      });
    } catch (e) { pc.close(); delete pcInstances.current[id]; }
  };

  const isLive = !!activeStreamId;

  return (
    <div className="fixed inset-0 z-[2500] bg-slate-950 flex flex-col md:flex-row items-stretch overflow-hidden selection:bg-rose-500">
      
      {/* Primary Visual Viewport */}
      <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
        <video 
          ref={videoRef} autoPlay playsInline muted 
          className={`w-full h-full object-cover transition-all duration-1000 mirror ${isLive ? 'opacity-100 scale-100' : 'opacity-30 blur-2xl scale-110'}`} 
        />
        
        {/* Floating Reactions Monitor */}
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
           {reactions.map(r => (
             <div key={r.id} className="absolute bottom-40 text-5xl animate-float-up" style={{ left: `${r.left}%` }}>{r.emoji}</div>
           ))}
        </div>

        {/* SETUP LAYER */}
        {!isLive && (
          <div className="absolute inset-0 z-[2600] flex flex-col items-center justify-center p-8 bg-slate-950/60 backdrop-blur-2xl animate-in fade-in duration-700">
            <div className="w-full max-w-xl space-y-12 text-center">
               <div className="flex flex-col items-center gap-8">
                 <div className="w-24 h-24 bg-rose-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl relative">
                    <div className="absolute inset-0 rounded-[2.5rem] bg-rose-500 animate-ping opacity-20" />
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                 </div>
                 <h2 className="text-5xl font-black text-white tracking-tighter uppercase italic leading-none">Signal Preparation</h2>
               </div>

               <div className="space-y-4">
                 <input 
                   autoFocus type="text" placeholder="Signal Identity..." 
                   value={streamTitle} onChange={(e) => setStreamTitle(e.target.value)}
                   className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] px-10 py-8 text-white font-black text-3xl outline-none text-center focus:ring-4 focus:ring-rose-500/30 transition-all placeholder:text-white/5 italic"
                 />
                 <div className="flex justify-center gap-6">
                    <div className="px-6 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-black text-emerald-400 uppercase tracking-widest font-mono flex items-center gap-2">
                       <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Optics_Ready
                    </div>
                    <div className="px-6 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-black text-emerald-400 uppercase tracking-widest font-mono flex items-center gap-2">
                       <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Signal_Clear
                    </div>
                 </div>
               </div>

               <div className="flex flex-col gap-4">
                 <button 
                   onClick={() => { setIsInitializing(true); onStart(streamTitle); }}
                   disabled={!streamTitle.trim() || hwStatus !== 'ready' || isInitializing}
                   className="w-full py-8 bg-rose-600 text-white rounded-[2.5rem] font-black text-[13px] uppercase tracking-[0.5em] shadow-2xl hover:bg-rose-500 active:scale-95 transition-all disabled:opacity-20"
                 >
                   {isInitializing ? 'Establishing_Node...' : 'Go_Live_Now'}
                 </button>
                 <button onClick={onEnd} className="text-white/20 hover:text-white font-black uppercase text-[10px] tracking-widest transition-colors italic">Abort_Link</button>
               </div>
            </div>
          </div>
        )}

        {/* LIVE HUD COMMANDER */}
        {isLive && (
          <div className="absolute inset-0 z-40 p-8 md:p-12 flex flex-col pointer-events-none">
             <div className="flex justify-between items-start pointer-events-auto">
                <div className="flex gap-4">
                   <div className="bg-rose-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 shadow-2xl">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" /> Live_Broadcast
                   </div>
                   <div className="bg-black/60 backdrop-blur-xl text-white px-6 py-3 rounded-2xl text-[10px] font-black font-mono border border-white/10 shadow-2xl">
                      {Math.floor(timer/60)}:{(timer%60).toString().padStart(2, '0')}
                   </div>
                   <div className="bg-white text-slate-950 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                      {viewerCount.toLocaleString()} Nodes
                   </div>
                </div>
                <button 
                  onClick={onEnd} 
                  className="bg-white/10 hover:bg-rose-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 backdrop-blur-xl transition-all active:scale-95"
                >
                  End_Broadcast
                </button>
             </div>

             <div className="mt-auto flex items-end justify-between">
                <div className="flex items-center gap-8">
                   <div className="p-1.5 bg-white rounded-[2.5rem] shadow-2xl border-4 border-white/10">
                      <img src={userData.avatarUrl} className="w-20 h-20 md:w-32 md:h-32 rounded-[2rem] object-cover" alt="" />
                   </div>
                   <div className="text-left">
                      <p className="text-[12px] font-black text-rose-500 uppercase tracking-[0.4em] font-mono mb-2 italic">Transmitting_Identity</p>
                      <h3 className="text-4xl md:text-7xl font-black text-white uppercase italic tracking-tighter leading-none drop-shadow-2xl">{streamTitle}</h3>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Broadcaster Side Console (Chat Monitor) */}
      <div className={`flex flex-col w-full md:w-[380px] lg:w-[440px] bg-slate-950 border-l border-white/10 transition-all duration-700 ${!isLive ? 'hidden' : 'flex'}`}>
         <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/20">
            <div>
              <h3 className="text-white font-black uppercase italic tracking-tighter">Transmission_Log</h3>
              <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest font-mono">Neural_Comms_Ready</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10"><ICONS.Messages /></div>
         </div>

         <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-6 bg-slate-950">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-10 text-center px-10">
                 <div className="w-20 h-20 bg-white/5 rounded-[2.5rem] mb-6 animate-pulse" />
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] font-mono italic">Awaiting grid response...</p>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className="flex gap-4 animate-in slide-in-from-right-4 duration-300">
                   <img src={msg.senderAvatar} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white/10" alt="" />
                   <div className="min-w-0">
                      <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-none mb-2">{msg.senderName}</p>
                      <p className="text-[14px] text-white/90 font-bold leading-relaxed bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/5">{msg.text}</p>
                   </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
         </div>

         <div className="p-8 border-t border-white/5 bg-black/40">
            <div className="flex items-center gap-4 text-white/40">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
               <p className="text-[9px] font-black uppercase tracking-[0.3em] font-mono italic">Encryption: Citadel-Active-Stable</p>
            </div>
         </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .mirror { transform: scaleX(-1); }
        @keyframes float-up {
          0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-400px) scale(1.5) rotate(20deg); opacity: 0; }
        }
        .animate-float-up {
          animation: float-up 2.5s ease-out forwards;
        }
      `}} />
    </div>
  );
};
