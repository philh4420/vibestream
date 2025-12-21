
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/firebase';
import { collection, doc, onSnapshot, updateDoc, addDoc } from 'firebase/firestore';
import { User } from '../../types';

interface LiveBroadcastOverlayProps {
  userData: User;
  onStart: (title: string) => void;
  onEnd: () => void;
  activeStreamId: string | null;
}

const servers = {
  iceServers: [
    { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] },
  ],
};

export const LiveBroadcastOverlay: React.FC<LiveBroadcastOverlayProps> = ({ 
  userData, 
  onStart, 
  onEnd, 
  activeStreamId 
}) => {
  // INTERNAL STATE: Always start at setup, ignore parent activeStreamId until manual trigger
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
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, 
          audio: true 
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
      Object.values(pcInstances.current).forEach(pc => pc.close());
    };
  }, []);

  // BROADCAST GATE: Only start listeners once activeStreamId is established by parent
  useEffect(() => {
    if (activeStreamId && db) {
      setIsLiveReady(true);
      const timerInt = window.setInterval(() => setTimer(prev => prev + 1), 1000);
      
      const connectionsRef = collection(db, 'streams', activeStreamId, 'connections');
      const unsub = onSnapshot(connectionsRef, (snapshot) => {
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

      return () => { clearInterval(timerInt); unsub(); };
    }
  }, [activeStreamId]);

  const setupPeer = async (id: string, offer: any, streamId: string) => {
    if (!streamRef.current) return;
    const pc = new RTCPeerConnection(servers);
    pcInstances.current[id] = pc;
    const peerCandidateQueue: RTCIceCandidateInit[] = [];

    streamRef.current.getTracks().forEach(track => pc.addTrack(track, streamRef.current!));

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        addDoc(collection(db, 'streams', streamId, 'connections', id, 'hostCandidates'), e.candidate.toJSON());
      }
    };

    const peerCandRef = collection(db, 'streams', streamId, 'connections', id, 'peerCandidates');
    onSnapshot(peerCandRef, (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const cand = change.doc.data() as RTCIceCandidateInit;
          if (pc.remoteDescription) {
            pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
          } else {
            peerCandidateQueue.push(cand);
          }
        }
      });
    });

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await updateDoc(doc(db, 'streams', streamId, 'connections', id), { 
        answer: { type: answer.type, sdp: answer.sdp } 
      });

      while (peerCandidateQueue.length > 0) {
        const cand = peerCandidateQueue.shift();
        if (cand) pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
      }
    } catch (err) {
      pc.close();
      delete pcInstances.current[id];
    }
  };

  const handleCommitStart = () => {
    if (!streamTitle.trim() || hwStatus !== 'ready') return;
    onStart(streamTitle);
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black flex items-center justify-center overflow-hidden selection:bg-rose-500 selection:text-white">
      <div className="relative w-full h-full flex flex-col">
        {/* PREVIEW: Blur heavily during setup to avoid "Jump" confusion */}
        <video 
          ref={videoRef} autoPlay playsInline muted 
          className={`w-full h-full object-cover transition-all duration-1000 mirror ${isLiveReady ? 'opacity-80 blur-0' : 'opacity-40 blur-2xl scale-110'}`} 
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

        {/* STEP 1: GATED SETUP INTERFACE */}
        {!isLiveReady && (
          <div className="relative z-10 flex flex-col items-center justify-center h-full p-8 text-center bg-black/50 backdrop-blur-2xl animate-in fade-in duration-500">
             <div className="w-20 h-20 bg-rose-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl animate-pulse relative">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M12 4.5v15m7.5-7.5h-15" /></svg>
                {hwStatus === 'ready' && <div className="absolute -top-2 -right-2 bg-emerald-500 w-6 h-6 rounded-full border-4 border-black flex items-center justify-center shadow-lg"><svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg></div>}
             </div>
             
             <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic mb-2">Establish Uplink</h2>
             <p className="text-[10px] font-black text-rose-500/60 uppercase tracking-[0.4em] font-mono mb-10">Grid_Broadcasting_Module v2.6.GB</p>
             
             <div className="w-full max-w-sm space-y-4">
                <div className="space-y-2 text-left">
                   <label className="text-[9px] font-black text-white/40 uppercase tracking-widest font-mono ml-4">Channel_Name</label>
                   <input 
                     autoFocus
                     type="text" 
                     placeholder="Name your broadcast..." 
                     value={streamTitle}
                     onChange={(e) => setStreamTitle(e.target.value)}
                     className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white font-bold outline-none text-center focus:ring-2 focus:ring-rose-500/50 transition-all placeholder:text-white/10 text-lg"
                   />
                </div>
                
                <button 
                  onClick={handleCommitStart}
                  disabled={!streamTitle.trim() || hwStatus !== 'ready'}
                  className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl shadow-rose-900/20 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
                >
                  {hwStatus === 'ready' ? 'Start_Broadcast' : 'Hardware_Syncing...'}
                </button>
                <button onClick={onEnd} className="w-full py-4 text-white/40 font-bold uppercase text-[9px] tracking-widest hover:text-white transition-colors">Abort_Protocol</button>
             </div>

             <div className="mt-12 flex gap-8 opacity-40">
                <div className="flex items-center gap-2">
                   <div className={`w-1.5 h-1.5 rounded-full ${hwStatus === 'ready' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} />
                   <span className="text-[8px] font-black text-white uppercase tracking-widest font-mono">OPTIC_READY</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className={`w-1.5 h-1.5 rounded-full ${hwStatus === 'ready' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} />
                   <span className="text-[8px] font-black text-white uppercase tracking-widest font-mono">AUDIO_READY</span>
                </div>
             </div>
          </div>
        )}

        {/* STEP 2: ACTIVE LIVE INTERFACE */}
        {isLiveReady && (
          <div className="relative z-10 flex flex-col h-full p-8 pointer-events-none animate-in fade-in slide-in-from-bottom-10 duration-1000">
             <div className="flex justify-between items-start pointer-events-auto">
                <div className="flex gap-3">
                   <div className="bg-rose-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2.5 shadow-2xl border border-rose-500/50">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-white" />
                      Live
                   </div>
                   <div className="bg-black/60 backdrop-blur-md text-white px-5 py-2.5 rounded-xl text-[10px] font-black font-mono border border-white/10 shadow-xl">
                      {Math.floor(timer/60)}:{(timer%60).toString().padStart(2, '0')}
                   </div>
                </div>
                <button onClick={onEnd} className="bg-white/10 hover:bg-rose-600 text-white px-7 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest pointer-events-auto transition-all active:scale-95 border border-white/10 shadow-2xl backdrop-blur-md">Terminate</button>
             </div>
             
             <div className="mt-auto flex items-end justify-between">
                <div className="flex items-center gap-6">
                   <div className="relative">
                      <img src={userData.avatarUrl} className="w-20 h-20 rounded-[2.5rem] border-4 border-white shadow-2xl transition-transform hover:scale-110" alt="" />
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-rose-600 rounded-xl border-2 border-black flex items-center justify-center shadow-lg"><svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5z"/></svg></div>
                   </div>
                   <div className="text-left">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] font-mono mb-2 italic">Neural_Broadcast_Uplink</p>
                      <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">{streamTitle}</h3>
                   </div>
                </div>
                <div className="text-right hidden lg:block">
                   <p className="text-[9px] font-black text-rose-500 uppercase tracking-[0.4em] font-mono mb-3">ENCRYPTED_P2P_MESH_ACTIVE</p>
                   <p className="text-[11px] font-black text-white/20 uppercase font-mono tracking-tighter">NODE: {activeStreamId?.slice(0, 16).toUpperCase()}</p>
                </div>
             </div>
          </div>
        )}

        <style dangerouslySetInnerHTML={{ __html: `.mirror { transform: scaleX(-1); }` }} />
      </div>
    </div>
  );
};
