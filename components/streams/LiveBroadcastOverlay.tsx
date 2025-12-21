
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/firebase';
import { collection, doc, onSnapshot, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { User } from '../../types';

interface LiveBroadcastOverlayProps {
  userData: User;
  onStart: (title: string) => void;
  onEnd: () => void;
  activeStreamId: string | null;
}

// Advanced ICE configuration for 2026 infrastructure
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
  const [isLiveReady, setIsLiveReady] = useState(false);
  const [streamTitle, setStreamTitle] = useState('');
  const [timer, setTimer] = useState(0);
  const [hwStatus, setHwStatus] = useState<'checking' | 'ready' | 'failed'>('checking');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pcInstances = useRef<Record<string, RTCPeerConnection>>({});

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
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setHwStatus('ready');
      } catch (err) { 
        console.error("Hardware Init Error:", err);
        setHwStatus('failed');
      }
    };
    initHardware();
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      Object.values(pcInstances.current).forEach(pc => {
        pc.onicecandidate = null;
        pc.ontrack = null;
        pc.close();
      });
    };
  }, []);

  useEffect(() => {
    if (activeStreamId && db) {
      setIsLiveReady(true);
      const timerInt = window.setInterval(() => setTimer(prev => prev + 1), 1000);
      
      // Listen for incoming viewer connection offers
      const connectionsRef = collection(db, 'streams', activeStreamId, 'connections');
      const unsub = onSnapshot(connectionsRef, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const connectionId = change.doc.id;
            const data = change.doc.data();
            // Critical: Only respond to documents that have an offer and haven't been processed
            if (data.offer && !pcInstances.current[connectionId]) {
              await setupPeer(connectionId, data.offer, activeStreamId);
            }
          }
        });
      });

      return () => { 
        clearInterval(timerInt); 
        unsub(); 
      };
    }
  }, [activeStreamId]);

  const setupPeer = async (id: string, offer: any, streamId: string) => {
    if (!streamRef.current) return;
    
    const pc = new RTCPeerConnection(rtcConfig);
    pcInstances.current[id] = pc;

    // Add local tracks to the peer connection
    streamRef.current.getTracks().forEach(track => {
      pc.addTrack(track, streamRef.current!);
    });

    // Handle ICE candidates from the broadcaster to the viewer
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        addDoc(collection(db, 'streams', streamId, 'connections', id, 'hostCandidates'), e.candidate.toJSON());
      }
    };

    // Listen for ICE candidates from the viewer
    const peerCandRef = collection(db, 'streams', streamId, 'connections', id, 'peerCandidates');
    const unsubPeerCand = onSnapshot(peerCandRef, (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const cand = change.doc.data() as RTCIceCandidateInit;
          pc.addIceCandidate(new RTCIceCandidate(cand)).catch(e => console.warn("Candidate sync skipped", e));
        }
      });
    });

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Send the answer back to the viewer via Firestore
      await updateDoc(doc(db, 'streams', streamId, 'connections', id), { 
        answer: { type: answer.type, sdp: answer.sdp },
        respondedAt: serverTimestamp()
      });

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
          unsubPeerCand();
          pc.close();
          delete pcInstances.current[id];
        }
      };
    } catch (err) {
      console.error("Peer Setup Error:", err);
      unsubPeerCand();
      pc.close();
      delete pcInstances.current[id];
    }
  };

  const handleCommitStart = () => {
    if (!streamTitle.trim() || hwStatus !== 'ready') return;
    onStart(streamTitle);
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black flex items-center justify-center overflow-hidden">
      <div className="relative w-full h-full flex flex-col">
        <video 
          ref={videoRef} autoPlay playsInline muted 
          className={`w-full h-full object-cover transition-all duration-1000 mirror ${isLiveReady ? 'opacity-90 blur-0 scale-100' : 'opacity-40 blur-3xl scale-110'}`} 
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40" />

        {!isLiveReady && (
          <div className="relative z-10 flex flex-col items-center justify-center h-full p-8 text-center bg-black/40 backdrop-blur-3xl animate-in fade-in duration-700">
             <div className="w-24 h-24 bg-rose-600 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-[0_0_50px_rgba(225,29,72,0.4)] animate-pulse relative">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
             </div>
             
             <div className="mb-12">
               <h2 className="text-5xl md:text-6xl font-black text-white tracking-tighter uppercase italic mb-3">Broadcast Setup</h2>
               <p className="text-[11px] font-black text-rose-500 uppercase tracking-[0.5em] font-mono">Neural Interface Node v2.6.GB</p>
             </div>
             
             <div className="w-full max-w-md space-y-6">
                <div className="space-y-3 text-left">
                   <label className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em] font-mono ml-4">Transmission_Identity</label>
                   <input 
                     autoFocus
                     type="text" 
                     placeholder="SIGNAL_LABEL_ALPHA..." 
                     value={streamTitle}
                     onChange={(e) => setStreamTitle(e.target.value)}
                     className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-8 py-6 text-white font-black outline-none text-center focus:ring-4 focus:ring-rose-500/30 focus:bg-white/10 transition-all placeholder:text-white/10 text-xl md:text-2xl italic tracking-tight"
                   />
                </div>
                
                <div className="pt-4 space-y-4">
                  <button 
                    onClick={handleCommitStart}
                    disabled={!streamTitle.trim() || hwStatus !== 'ready'}
                    className="w-full py-6 bg-rose-600 text-white rounded-[2rem] font-black text-[12px] uppercase tracking-[0.4em] shadow-2xl shadow-rose-900/40 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale group"
                  >
                    <span className="group-hover:tracking-[0.5em] transition-all">Establish_Uplink</span>
                  </button>
                  <button onClick={onEnd} className="w-full py-4 text-white/30 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors italic">Abort_Sequence</button>
                </div>
             </div>

             <div className="mt-16 flex gap-10">
                <div className="flex flex-col items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${hwStatus === 'ready' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]' : 'bg-rose-500'}`} />
                   <span className="text-[9px] font-black text-white/40 uppercase tracking-widest font-mono">OPTICS</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${hwStatus === 'ready' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]' : 'bg-rose-500'}`} />
                   <span className="text-[9px] font-black text-white/40 uppercase tracking-widest font-mono">SONICS</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                   <div className={`w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)]`} />
                   <span className="text-[9px] font-black text-white/40 uppercase tracking-widest font-mono">P2P_MESH</span>
                </div>
             </div>
          </div>
        )}

        {isLiveReady && (
          <div className="relative z-10 flex flex-col h-full p-8 md:p-12 pointer-events-none animate-in fade-in duration-1000">
             <div className="flex justify-between items-start pointer-events-auto">
                <div className="flex gap-4">
                   <div className="bg-rose-600 text-white px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3 shadow-2xl border border-rose-500/50">
                      <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                      Live_Signal
                   </div>
                   <div className="bg-black/60 backdrop-blur-xl text-white px-6 py-3 rounded-2xl text-[11px] font-black font-mono border border-white/10 shadow-2xl">
                      {Math.floor(timer/60)}:{(timer%60).toString().padStart(2, '0')}
                   </div>
                </div>
                <button 
                  onClick={onEnd} 
                  className="bg-white/10 hover:bg-rose-600 text-white px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] pointer-events-auto transition-all active:scale-95 border border-white/10 shadow-2xl backdrop-blur-xl"
                >
                  Terminate_Node
                </button>
             </div>
             
             <div className="mt-auto flex items-end justify-between gap-8">
                <div className="flex items-center gap-8">
                   <div className="relative">
                      <img src={userData.avatarUrl} className="w-24 h-24 md:w-32 md:h-32 rounded-[3rem] border-4 border-white shadow-[0_20px_60px_rgba(0,0,0,0.5)] transition-transform hover:scale-110" alt="" />
                      <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-rose-600 rounded-2xl border-4 border-black flex items-center justify-center shadow-xl">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                      </div>
                   </div>
                   <div className="text-left">
                      <p className="text-[12px] font-black text-rose-500 uppercase tracking-[0.4em] font-mono mb-3 italic">Broadcast_Master_Active</p>
                      <h3 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter leading-none drop-shadow-2xl">{streamTitle}</h3>
                      <div className="flex gap-4 mt-4">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest font-mono">GB_NODE_ALPHA</span>
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest font-mono">|</span>
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest font-mono">NEURAL_ID: {userData.username}</span>
                      </div>
                   </div>
                </div>
                <div className="text-right hidden xl:block mb-4">
                   <div className="p-6 bg-black/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 inline-flex flex-col gap-2">
                     <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] font-mono text-center">Encryption_Stable</p>
                     <p className="text-[9px] font-black text-white/20 uppercase font-mono tracking-[0.2em]">{activeStreamId?.toUpperCase()}</p>
                   </div>
                </div>
             </div>
          </div>
        )}

        <style dangerouslySetInnerHTML={{ __html: `.mirror { transform: scaleX(-1); }` }} />
      </div>
    </div>
  );
};
