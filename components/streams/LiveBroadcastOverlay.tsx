
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/firebase';
import { collection, doc, onSnapshot, updateDoc, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
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
  iceCandidatePoolSize: 10,
};

export const LiveBroadcastOverlay: React.FC<LiveBroadcastOverlayProps> = ({ 
  userData, 
  onStart, 
  onEnd, 
  activeStreamId 
}) => {
  const [step, setStep] = useState<'setup' | 'broadcasting' | 'error'>('setup');
  const [streamTitle, setStreamTitle] = useState('');
  const [timer, setTimer] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});

  // 1. Core Camera Capture
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user', 
            width: { ideal: 1920 }, 
            height: { ideal: 1080 },
            frameRate: { ideal: 30 }
          }, 
          audio: true 
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.error("Hardware bypass failed:", err);
        setStep('error');
        setErrorMessage('Neural camera access denied. Check system permissions.');
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      // Cleanup all peer connections on end
      Object.values(peerConnections.current).forEach(pc => pc.close());
    };
  }, []);

  // 2. Broadcast Controller & WebRTC Signaling Hub
  useEffect(() => {
    let timerInterval: number;

    if (activeStreamId && db) {
      setStep('broadcasting');
      
      timerInterval = window.setInterval(() => setTimer(prev => prev + 1), 1000);

      // Listen for incoming viewer connection attempts (Offers)
      const connectionsRef = collection(db, 'streams', activeStreamId, 'connections');
      const unsubSignals = onSnapshot(connectionsRef, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const connectionId = change.doc.id;
            const data = change.doc.data();
            
            if (data.offer && !peerConnections.current[connectionId]) {
              await handleIncomingOffer(connectionId, data.offer, activeStreamId);
            }
          }
        });
      });

      return () => {
        clearInterval(timerInterval);
        unsubSignals();
      };
    }
  }, [activeStreamId]);

  const handleIncomingOffer = async (connectionId: string, offer: RTCSessionDescriptionInit, streamId: string) => {
    if (!streamRef.current) return;

    const pc = new RTCPeerConnection(servers);
    peerConnections.current[connectionId] = pc;

    // Add local stream tracks to the peer connection
    streamRef.current.getTracks().forEach(track => {
      pc.addTrack(track, streamRef.current!);
    });

    // Handle ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const candidatesRef = collection(db, 'streams', streamId, 'connections', connectionId, 'candidates');
        addDoc(candidatesRef, event.candidate.toJSON());
      }
    };

    // Set remote description (The viewer's offer)
    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    // Create Answer
    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);

    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };

    // Send answer back to the viewer
    await updateDoc(doc(db, 'streams', streamId, 'connections', connectionId), { answer });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartBroadcast = () => {
    onStart(streamTitle || `${userData.displayName}'s Neural Broadcast`);
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black flex items-center justify-center p-0 md:p-6 animate-in fade-in duration-500">
      <div className="relative w-full h-full max-w-5xl bg-slate-900 md:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col">
        
        {/* Hardware-Accelerated Viewport */}
        <div className="absolute inset-0 bg-slate-950">
           <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover opacity-90 transition-opacity duration-1000 mirror"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
        </div>

        {/* SETUP UI */}
        {step === 'setup' && (
          <div className="relative z-10 flex flex-col items-center justify-center h-full p-8 text-center bg-black/40 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
             <div className="w-20 h-20 bg-white/10 rounded-[2rem] border border-white/20 flex items-center justify-center mb-8 backdrop-blur-xl">
                <div className="w-4 h-4 bg-rose-500 rounded-full animate-ping shadow-[0_0_15px_rgba(244,63,94,0.8)]" />
             </div>
             <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic mb-2">Initiate Uplink</h2>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mb-10">Syncing local node with global grid</p>
             
             <div className="w-full max-w-sm space-y-6">
                <input 
                  type="text" autoFocus placeholder="Broadcast Protocol Name..." value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm font-bold placeholder:text-slate-600 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all"
                />
                <div className="flex gap-4">
                   <button onClick={onEnd} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">Abort</button>
                   <button onClick={handleStartBroadcast} className="flex-[2] py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all active:scale-95">Establish Link</button>
                </div>
             </div>
          </div>
        )}

        {/* BROADCASTING UI */}
        {step === 'broadcasting' && (
          <div className="relative z-10 flex flex-col h-full p-6 md:p-10 pointer-events-none">
             <div className="flex justify-between items-start pointer-events-auto">
                <div className="flex items-center gap-4">
                   <div className="bg-rose-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg ring-2 ring-rose-500/20">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      Live • Realtime
                   </div>
                   <div className="bg-black/60 backdrop-blur-md border border-white/10 text-white px-4 py-1.5 rounded-lg text-[10px] font-black font-mono">
                      {formatTime(timer)}
                   </div>
                </div>
                <button onClick={onEnd} className="bg-white/10 hover:bg-rose-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/10 transition-all active:scale-95">Decommission</button>
             </div>

             <div className="mt-auto flex items-end justify-between pointer-events-auto">
                <div className="flex items-center gap-4">
                   <div className="relative">
                      <img src={userData.avatarUrl} className="w-14 h-14 rounded-2xl border-2 border-white/20 shadow-2xl" alt="" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-white/60 uppercase tracking-widest font-mono mb-1">Grid_Source</p>
                      <h3 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">{userData.displayName}</h3>
                   </div>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-white font-black font-mono text-[10px] uppercase tracking-tighter mb-1">Broadcasting 1080p_60fps</span>
                   <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] font-mono">P2P_UPLINK_STABLE</p>
                </div>
             </div>
          </div>
        )}

        {/* ERROR UI */}
        {step === 'error' && (
          <div className="relative z-10 flex flex-col items-center justify-center h-full p-8 text-center bg-slate-950 animate-in fade-in duration-500">
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">Protocol Failure</h2>
            <p className="text-slate-400 text-sm mb-10">{errorMessage}</p>
            <button onClick={onEnd} className="px-10 py-4 bg-white text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">Return</button>
          </div>
        )}

        <style dangerouslySetInnerHTML={{ __html: `.mirror { transform: scaleX(-1); }` }} />
      </div>
    </div>
  );
};
