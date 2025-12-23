
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { 
  collection, 
  doc, 
  onSnapshot, 
  updateDoc, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  limit,
} = Firestore as any;
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
      const unsubConns = onSnapshot(connectionsRef, (snapshot: any) => {
        snapshot.docChanges().forEach(async (change: any) => {
          if (change.type === 'added') {
            const connectionId = change.doc.id;
            const data = change.doc.data();
            if (data.offer && !pcInstances.current[connectionId]) {
              await setupPeer(connectionId, data.offer, activeStreamId);
            }
          }
        });
      });

      const unsubMeta = onSnapshot(doc(db, 'streams', activeStreamId), (snap: any) => {
        if (snap.exists()) setViewerCount(snap.data().viewerCount || 0);
      });

      const chatQuery = query(collection(db, 'streams', activeStreamId, 'messages'), orderBy('timestamp', 'asc'), limit(50));
      const unsubChat = onSnapshot(chatQuery, (snap: any) => {
        setMessages(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as StreamMessage)));
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      });

      const reactQuery = query(collection(db, 'streams', activeStreamId, 'reactions'), orderBy('timestamp', 'desc'), limit(1));
      const unsubReact = onSnapshot(reactQuery, (snap: any) => {
        snap.docChanges().forEach((change: any) => {
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
    <div className="fixed inset-0 z-[2500] bg-black flex flex-col lg:flex-row overflow-hidden selection:bg-rose-500 font-sans">
      
      {/* Cinematic Viewport Container */}
      <div className="relative flex-1 bg-black flex items-center justify-center min-h-0">
        <video 
          ref={videoRef} autoPlay playsInline muted 
          className="w-full h-full object-cover transition-all duration-1000 mirror opacity-100 scale-100" 
        />
        
        {/* Floating Reactions Layer */}
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
           {reactions.map(r => (
             <div key={r.id} className="absolute bottom-1/4 text-5xl md:text-7xl animate-float-up" style={{ left: `${r.left}%` }}>
               {r.emoji}
             </div>
           ))}
        </div>

        {/* SETUP SCREEN - COMPLETELY TRANSPARENT BACKGROUND */}
        {!isLive && (
          <div className="absolute inset-0 z-[2600] flex flex-col justify-between p-6 pointer-events-none">
            
            {/* Top Bar - Minimal */}
            <div className="flex justify-between items-start pointer-events-auto">
               <button onClick={onEnd} className="px-4 py-2 bg-black/40 backdrop-blur-md rounded-xl text-white text-xs font-black uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all">
                 Cancel
               </button>
               <div className="px-4 py-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${hwStatus === 'ready' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-amber-500 animate-pulse'}`} />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest font-mono">
                    {hwStatus === 'ready' ? 'CAMERA_ONLINE' : 'INITIALIZING...'}
                  </span>
               </div>
            </div>

            {/* Bottom HUD Control Panel */}
            <div className="w-full max-w-lg mx-auto pointer-events-auto animate-in slide-in-from-bottom-10 duration-500">
               <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden">
                  {/* Decorative Elements */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50" />
                  
                  <div className="space-y-6">
                     <div className="text-center">
                        <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-1">Prepare_Signal</h2>
                        <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Configure broadcast parameters</p>
                     </div>

                     <div className="relative group">
                        <input 
                          type="text" 
                          placeholder="Enter transmission title..." 
                          value={streamTitle} 
                          onChange={(e) => setStreamTitle(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold text-center placeholder:text-white/20 focus:bg-white/10 focus:border-white/30 focus:ring-0 outline-none transition-all"
                          autoFocus
                        />
                     </div>

                     <button 
                       onClick={() => { setIsInitializing(true); onStart(streamTitle); }}
                       disabled={!streamTitle.trim() || hwStatus !== 'ready' || isInitializing}
                       className="w-full py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-slate-200 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100 flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                     >
                       {isInitializing ? (
                         <>
                           <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                           INITIALIZING...
                         </>
                       ) : (
                         <>
                           <div className="w-3 h-3 bg-rose-600 rounded-full animate-pulse" />
                           GO_LIVE
                         </>
                       )}
                     </button>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* LIVE BROADCAST HUD */}
        {isLive && (
          <div className="absolute inset-0 z-40 p-4 md:p-8 flex flex-col pointer-events-none">
             {/* Top Control Bar */}
             <div className="flex justify-between items-start pointer-events-auto">
                <div className="flex flex-wrap gap-2 md:gap-3 max-w-[70%]">
                   <div className="bg-rose-600/90 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg border border-white/10">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                   </div>
                   <div className="bg-black/40 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl text-[10px] font-black font-mono border border-white/10">
                      {Math.floor(timer/60)}:{(timer%60).toString().padStart(2, '0')}
                   </div>
                   <div className="bg-black/40 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-white/10">
                      <svg className="w-3 h-3 text-rose-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                      {viewerCount}
                   </div>
                </div>
                <button 
                  onClick={onEnd} 
                  className="bg-black/40 hover:bg-rose-600/90 text-white px-6 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-white/10 backdrop-blur-md transition-all active:scale-95 shadow-lg"
                >
                  END
                </button>
             </div>

             {/* Bottom Profile Identity Block - Left Aligned */}
             <div className="mt-auto flex items-end justify-between pointer-events-none pb-safe">
                <div className="bg-black/40 backdrop-blur-xl p-4 rounded-[2rem] border border-white/10 shadow-lg max-w-[80%] flex items-center gap-4">
                   <img src={userData.avatarUrl} className="w-12 h-12 rounded-[1.2rem] object-cover border border-white/20" alt="" />
                   <div className="min-w-0">
                      <h3 className="text-sm font-black text-white uppercase italic tracking-wide truncate leading-none mb-1">{streamTitle}</h3>
                      <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest font-mono truncate">{userData.username}</p>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Responsive Chat Command Center - Desktop Sidebar / Mobile Drawer */}
      <div className={`flex flex-col bg-slate-950 transition-all duration-700 h-[40vh] lg:h-full lg:w-[400px] xl:w-[450px] border-t lg:border-t-0 lg:border-l border-white/10 absolute bottom-0 left-0 right-0 lg:relative lg:translate-y-0 z-50 ${!isLive ? 'hidden' : 'flex'}`}>
         
         {/* Chat Header */}
         <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5 backdrop-blur-md shrink-0">
            <div>
              <h3 className="text-white text-sm font-black uppercase italic tracking-tighter">COMMS_MATRIX</h3>
              <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em] font-mono mt-0.5">SECURE_CHANNEL</p>
            </div>
            <button 
              onClick={() => setIsChatVisible(!isChatVisible)}
              className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-white/60 hover:text-white transition-all active:scale-90"
            >
              <ICONS.Messages />
            </button>
         </div>

         {/* Messages Area */}
         <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4 bg-slate-950/80">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                 <div className="w-16 h-16 bg-white/5 rounded-[2rem] mb-4 border-2 border-white/5 animate-pulse" />
                 <p className="text-[9px] font-black uppercase tracking-[0.3em] font-mono italic text-slate-500">SIGNAL_QUIET</p>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className="flex gap-3 animate-in slide-in-from-right-4 duration-300">
                   <img src={msg.senderAvatar} className="w-8 h-8 rounded-lg object-cover shrink-0 border border-white/10 bg-slate-800" alt="" />
                   <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-baseline mb-1">
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none truncate">{msg.senderName}</p>
                        <span className="text-[7px] font-black text-slate-600 font-mono">
                           {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'NOW'}
                        </span>
                      </div>
                      <p className="text-[12px] text-slate-200 font-bold leading-relaxed bg-white/5 p-2.5 rounded-xl rounded-tl-none border border-white/5">
                         {msg.text}
                      </p>
                   </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
         </div>

         {/* Footer Info */}
         <div className="p-4 border-t border-white/10 bg-black/40 shrink-0">
            <div className="flex items-center justify-between text-white/30">
               <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] font-mono">MONITORED</p>
               </div>
               <span className="text-[7px] font-black font-mono">VIBE_OS v2.6</span>
            </div>
         </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .mirror { transform: scaleX(-1); }
        .pb-safe { padding-bottom: max(1rem, env(safe-area-inset-bottom)); }
        @keyframes float-up {
          0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateY(-600px) scale(1.5) rotate(15deg); opacity: 0; }
        }
        .animate-float-up {
          animation: float-up 3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </div>
  );
};
