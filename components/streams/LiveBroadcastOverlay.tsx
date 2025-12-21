
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
  limit,
  Timestamp 
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
  const [isChatVisible, setIsChatVisible] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pcInstances = useRef<Record<string, RTCPeerConnection>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Hardware Initialization
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
      Object.values(pcInstances.current).forEach(pc => pc.close());
    };
  }, []);

  // Data Monitoring & WebRTC
  useEffect(() => {
    if (activeStreamId && db) {
      const timerInt = window.setInterval(() => setTimer(prev => prev + 1), 1000);
      
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

      const unsubMeta = onSnapshot(doc(db, 'streams', activeStreamId), (snap) => {
        if (snap.exists()) setViewerCount(snap.data().viewerCount || 0);
      });

      const chatQuery = query(collection(db, 'streams', activeStreamId, 'messages'), orderBy('timestamp', 'asc'), limit(50));
      const unsubChat = onSnapshot(chatQuery, (snap) => {
        setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as StreamMessage)));
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      });

      const reactQuery = query(collection(db, 'streams', activeStreamId, 'reactions'), orderBy('timestamp', 'desc'), limit(1));
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
        clearInterval(timerInt); 
        unsubConns(); unsubMeta(); unsubChat(); unsubReact();
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
    <div className="fixed inset-0 z-[2500] bg-slate-950 flex flex-col lg:flex-row overflow-hidden selection:bg-rose-500 font-sans">
      
      {/* Cinematic Viewport Container */}
      <div className="relative flex-1 bg-black flex items-center justify-center min-h-0">
        <video 
          ref={videoRef} autoPlay playsInline muted 
          className={`w-full h-full object-cover transition-all duration-1000 mirror ${isLive ? 'opacity-100 scale-100' : 'opacity-40 blur-2xl scale-110'}`} 
        />
        
        {/* Floating Reactions Layer */}
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
           {reactions.map(r => (
             <div key={r.id} className="absolute bottom-1/4 text-5xl md:text-7xl animate-float-up" style={{ left: `${r.left}%` }}>
               {r.emoji}
             </div>
           ))}
        </div>

        {/* SETUP SCREEN */}
        {!isLive && (
          <div className="absolute inset-0 z-[2600] flex flex-col items-center justify-center p-6 bg-slate-950/90 backdrop-blur-3xl overflow-y-auto no-scrollbar">
            <div className="w-full max-w-2xl space-y-10 text-center animate-in fade-in zoom-in-95 duration-700">
               <div className="flex flex-col items-center gap-6">
                 <div className="relative w-20 h-20 md:w-28 md:h-28 bg-rose-600 rounded-[2.5rem] flex items-center justify-center shadow-[0_0_50px_rgba(225,29,72,0.4)] border-4 border-white/10">
                    <div className="absolute inset-0 rounded-[2.5rem] bg-rose-500 animate-ping opacity-20" />
                    <svg className="w-8 h-8 md:w-12 md:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                 </div>
                 <div className="space-y-2">
                    <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-none">Broadcasting_Node</h2>
                    <p className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-[0.5em] font-mono italic">Protocol: Neural_Broadcast_v2.6.GB</p>
                 </div>
               </div>

               <div className="space-y-6">
                 <div className="relative group">
                    <input 
                      autoFocus type="text" placeholder="Signal Identity Label..." 
                      value={streamTitle} onChange={(e) => setStreamTitle(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-8 py-6 md:py-8 text-white font-black text-2xl md:text-4xl outline-none text-center focus:ring-4 focus:ring-rose-500/30 transition-all placeholder:text-white/10 italic"
                    />
                 </div>
                 <div className="flex flex-wrap justify-center gap-4">
                    <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[9px] font-black text-emerald-400 uppercase tracking-widest font-mono flex items-center gap-2">
                       <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> OPTICS_READY
                    </div>
                    <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[9px] font-black text-emerald-400 uppercase tracking-widest font-mono flex items-center gap-2">
                       <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> GRID_UPLINK_LIVE
                    </div>
                 </div>
               </div>

               <div className="flex flex-col gap-5 max-w-md mx-auto">
                 <button 
                   onClick={() => { setIsInitializing(true); onStart(streamTitle); }}
                   disabled={!streamTitle.trim() || hwStatus !== 'ready' || isInitializing}
                   className="w-full py-6 md:py-8 bg-rose-600 text-white rounded-[2.2rem] font-black text-xs md:text-sm uppercase tracking-[0.6em] shadow-2xl hover:bg-rose-500 active:scale-95 transition-all disabled:opacity-20 flex items-center justify-center gap-4 group"
                 >
                   {isInitializing ? 'INITIALIZING...' : 'START_BROADCAST'}
                   {!isInitializing && <svg className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>}
                 </button>
                 <button onClick={onEnd} className="text-white/30 hover:text-white font-black uppercase text-[10px] tracking-widest transition-colors italic py-2">Exit_Node_Prep</button>
               </div>
            </div>
          </div>
        )}

        {/* LIVE BROADCAST HUD */}
        {isLive && (
          <div className="absolute inset-0 z-40 p-4 md:p-10 flex flex-col pointer-events-none">
             {/* Top Control Bar */}
             <div className="flex justify-between items-start pointer-events-auto">
                <div className="flex flex-wrap gap-2 md:gap-4 max-w-[70%]">
                   <div className="bg-rose-600 text-white px-3 md:px-5 py-2 md:py-3 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 md:gap-3 shadow-2xl">
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full animate-pulse" /> LIVE
                   </div>
                   <div className="bg-black/60 backdrop-blur-xl text-white px-3 md:px-5 py-2 md:py-3 rounded-xl md:rounded-2xl text-[9px] md:text-[11px] font-black font-mono border border-white/10 shadow-2xl flex items-center gap-2">
                      {Math.floor(timer/60)}:{(timer%60).toString().padStart(2, '0')}
                   </div>
                   <div className="bg-white text-slate-950 px-3 md:px-5 py-2 md:py-3 rounded-xl md:rounded-2xl text-[9px] md:text-[11px] font-black uppercase tracking-widest flex items-center gap-2 md:gap-3 shadow-2xl">
                      <svg className="w-3 md:w-4 h-3 md:h-4 text-rose-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                      {viewerCount}
                   </div>
                </div>
                <button 
                  onClick={onEnd} 
                  className="bg-rose-600 md:bg-white/10 hover:bg-rose-700 text-white px-4 md:px-8 py-2 md:py-3 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-white/10 backdrop-blur-xl transition-all active:scale-95 shadow-xl"
                >
                  END
                </button>
             </div>

             {/* Bottom Profile Identity Block */}
             <div className="mt-auto flex items-end justify-between pointer-events-none">
                <div className="flex items-center gap-4 md:gap-8 bg-black/50 backdrop-blur-2xl p-4 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-white/10 shadow-2xl max-w-full">
                   <div className="relative shrink-0 hidden sm:block">
                      <div className="p-1 bg-gradient-to-tr from-rose-500 to-indigo-600 rounded-[1.8rem] shadow-xl">
                         <img src={userData.avatarUrl} className="w-16 h-16 md:w-28 md:h-28 rounded-[1.5rem] object-cover border-2 border-slate-950" alt="" />
                      </div>
                   </div>
                   <div className="text-left min-w-0">
                      <p className="text-[9px] md:text-[11px] font-black text-rose-500 uppercase tracking-[0.4em] font-mono mb-1 md:mb-2 italic truncate">BROADCAST_ID: {userData.username.toUpperCase()}</p>
                      <h3 className="text-xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none truncate pr-4">{streamTitle}</h3>
                      <div className="flex gap-2 md:gap-4 mt-3 md:mt-5">
                         <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-[7px] md:text-[8px] font-black text-white/30 uppercase tracking-widest font-mono">SECURE_SYNC</div>
                         <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-[7px] md:text-[8px] font-black text-white/30 uppercase tracking-widest font-mono">NODE_GB_LON</div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Responsive Chat Command Center */}
      <div className={`flex flex-col bg-slate-950 transition-all duration-700 h-[35vh] lg:h-full lg:w-[400px] xl:w-[480px] border-t lg:border-t-0 lg:border-l border-white/5 ${!isLive ? 'hidden' : 'flex'}`}>
         <div className="p-5 lg:p-8 border-b border-white/10 flex items-center justify-between bg-black/20 shrink-0">
            <div>
              <h3 className="text-white text-sm lg:text-xl font-black uppercase italic tracking-tighter">COMMS_MONITOR</h3>
              <p className="text-[8px] lg:text-[9px] font-black text-rose-500 uppercase tracking-widest font-mono">NEURAL_GRID_FEED</p>
            </div>
            <button 
              onClick={() => setIsChatVisible(!isChatVisible)}
              className="p-3 bg-white/5 rounded-xl border border-white/10 text-white/40 hover:text-white transition-all active:scale-90"
            >
              <ICONS.Messages />
            </button>
         </div>

         <div className="flex-1 overflow-y-auto no-scrollbar p-5 lg:p-8 space-y-5 lg:space-y-6 bg-slate-950/40">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-10 text-center">
                 <div className="w-16 h-16 lg:w-24 lg:h-24 bg-white/5 rounded-[2rem] lg:rounded-[3rem] mb-6 border-2 border-white/5 animate-pulse" />
                 <p className="text-[9px] lg:text-[11px] font-black uppercase tracking-[0.4em] font-mono italic">AWAITING_PEER_SIGNALS...</p>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className="flex gap-4 lg:gap-5 animate-in slide-in-from-right-4 duration-300">
                   <img src={msg.senderAvatar} className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl object-cover shrink-0 border border-white/10 shadow-lg" alt="" />
                   <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-center mb-1 lg:mb-2">
                        <p className="text-[9px] lg:text-[10px] font-black text-rose-500 uppercase tracking-widest leading-none truncate">{msg.senderName}</p>
                        <span className="text-[7px] lg:text-[8px] font-black text-white/20 font-mono">
                           {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'NOW'}
                        </span>
                      </div>
                      <p className="text-[13px] lg:text-[15px] text-white/80 font-bold leading-relaxed bg-white/5 p-3 lg:p-5 rounded-2xl rounded-tl-none border border-white/5">
                         {msg.text}
                      </p>
                   </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
         </div>

         <div className="p-4 lg:p-8 border-t border-white/10 bg-black/40 shrink-0">
            <div className="flex items-center justify-between text-white/20">
               <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <p className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.3em] font-mono italic">GRID_SAFE_ENABLED</p>
               </div>
               <span className="text-[7px] lg:text-[9px] font-black font-mono">CITADEL_v2.6</span>
            </div>
         </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .mirror { transform: scaleX(-1); }
        @keyframes float-up {
          0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateY(-700px) scale(2.2) rotate(20deg); opacity: 0; }
        }
        .animate-float-up {
          animation: float-up 2.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </div>
  );
};
