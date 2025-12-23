
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

const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
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
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [showChat, setShowChat] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pcInstances = useRef<Record<string, RTCPeerConnection>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Hardware Init
  useEffect(() => {
    const initHardware = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user', 
            width: { ideal: 1280 }, 
            height: { ideal: 720 },
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

  // Live Logic
  useEffect(() => {
    if (activeStreamId && db) {
      const timerInt = window.setInterval(() => setTimer(prev => prev + 1), 1000);
      
      // WebRTC Connection Handling
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

      // Meta & Chat
      const unsubMeta = onSnapshot(doc(db, 'streams', activeStreamId), (snap: any) => {
        if (snap.exists()) setViewerCount(snap.data().viewerCount || 0);
      });

      const chatQuery = query(collection(db, 'streams', activeStreamId, 'messages'), orderBy('timestamp', 'asc'), limit(50));
      const unsubChat = onSnapshot(chatQuery, (snap: any) => {
        setMessages(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as StreamMessage)));
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      });

      return () => { 
        clearInterval(timerInt); 
        unsubConns(); unsubMeta(); unsubChat();
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
    <div className="fixed inset-0 z-[5000] bg-black text-white font-sans overflow-hidden flex flex-col">
      
      {/* VIDEO LAYER */}
      <video 
        ref={videoRef} 
        autoPlay playsInline muted 
        className="absolute inset-0 w-full h-full object-cover mirror" 
      />
      
      {/* OVERLAY - GRADIENTS FOR READABILITY */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/60 via-transparent to-black/60" />

      {/* --- PRE-FLIGHT (SETUP) MODE --- */}
      {!isLive && (
        <div className="relative z-10 flex flex-col h-full items-center justify-center p-6">
           <button onClick={onEnd} className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center transition-all border border-white/10">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg>
           </button>

           <div className="w-full max-w-md bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-8 shadow-2xl animate-in zoom-in-95 duration-500">
              <div className="text-center mb-8">
                 <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                    {hwStatus === 'ready' ? (
                       <div className="text-emerald-400 animate-pulse"><ICONS.Verified /></div>
                    ) : (
                       <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                 </div>
                 <h2 className="text-2xl font-black uppercase italic tracking-tighter">Broadcast_Prep</h2>
                 <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mt-2">Check Lighting & Audio</p>
              </div>

              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest ml-3 text-slate-300">Signal_Title</label>
                    <input 
                      type="text" 
                      value={streamTitle}
                      onChange={(e) => setStreamTitle(e.target.value)}
                      placeholder="Enter transmission title..."
                      className="w-full bg-white/10 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold placeholder:text-white/30 focus:bg-white/20 outline-none transition-all text-sm"
                    />
                 </div>
                 
                 <button 
                   disabled={!streamTitle.trim() || hwStatus !== 'ready'}
                   onClick={() => onStart(streamTitle)}
                   className="w-full py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-rose-500 hover:text-white hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                 >
                   GO_LIVE
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* --- LIVE COCKPIT MODE --- */}
      {isLive && (
        <div className="relative z-10 flex flex-col h-full pointer-events-none">
           
           {/* TOP HUD */}
           <div className="flex items-start justify-between p-4 md:p-6 pointer-events-auto">
              <div className="flex flex-wrap gap-2">
                 <div className="px-3 py-1.5 bg-rose-600/90 backdrop-blur-md rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg border border-white/10">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                 </div>
                 <div className="px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-lg text-[10px] font-black font-mono border border-white/10">
                    {Math.floor(timer/60)}:{(timer%60).toString().padStart(2, '0')}
                 </div>
                 <div className="px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-lg text-[10px] font-black font-mono border border-white/10 flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-rose-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    {viewerCount}
                 </div>
              </div>

              <div className="flex gap-2">
                 <button onClick={() => setShowChat(!showChat)} className={`p-2.5 rounded-xl border backdrop-blur-md transition-all ${showChat ? 'bg-white text-black border-white' : 'bg-black/40 text-white border-white/10'}`}>
                    <ICONS.Messages />
                 </button>
                 <button onClick={onEnd} className="px-5 py-2.5 bg-white/10 hover:bg-rose-600 border border-white/10 backdrop-blur-md rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">
                    END_SIGNAL
                 </button>
              </div>
           </div>

           {/* CHAT OVERLAY (Ghost Mode) */}
           <div className="flex-1 flex flex-col justify-end px-4 md:px-6 pb-6 overflow-hidden">
              {showChat && (
                <div className="w-full max-w-sm pointer-events-auto mask-gradient-b">
                   <div className="h-[300px] overflow-y-auto no-scrollbar flex flex-col justify-end space-y-2 pb-2">
                      {messages.map((msg) => (
                        <div key={msg.id} className="flex items-start gap-2 animate-in slide-in-from-left-4 duration-300">
                           <div className="bg-black/30 backdrop-blur-md px-3 py-2 rounded-xl rounded-tl-none border border-white/5 shadow-sm max-w-[90%]">
                              <span className="text-[9px] font-black text-rose-300 uppercase tracking-wide mr-2">{msg.senderName}:</span>
                              <span className="text-xs font-medium text-white/90">{msg.text}</span>
                           </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                   </div>
                </div>
              )}
           </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .mirror { transform: scaleX(-1); }
        .mask-gradient-b { mask-image: linear-gradient(to top, black 80%, transparent 100%); }
      `}} />
    </div>
  );
};
