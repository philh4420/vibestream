
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
  const pcInstances = useRef<Record<string, RTCPeerConnection>>({});

  // 1. Hardware Interface Initialization
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
          audio: true 
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        setStep('error');
        setErrorMessage('Hardware Bypass Failed: Camera/Mic permissions restricted.');
      }
    };

    initHardware();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      Object.values(pcInstances.current).forEach(pc => pc.close());
    };
  }, []);

  // 2. Signaling Hub Controller
  useEffect(() => {
    let timerInterval: number;

    if (activeStreamId && db) {
      setStep('broadcasting');
      timerInterval = window.setInterval(() => setTimer(prev => prev + 1), 1000);

      // Listen for Peer Invitations (WebRTC Offers)
      const connectionsRef = collection(db, 'streams', activeStreamId, 'connections');
      const unsub = onSnapshot(connectionsRef, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const connectionId = change.doc.id;
            const data = change.doc.data();
            
            // Initiate Handshake Answer if offer exists and peer is new
            if (data.offer && !pcInstances.current[connectionId]) {
              await processPeerHandshake(connectionId, data.offer, activeStreamId);
            }
          }
        });
      });

      return () => {
        clearInterval(timerInterval);
        unsub();
      };
    }
  }, [activeStreamId]);

  const processPeerHandshake = async (id: string, offer: any, streamId: string) => {
    if (!streamRef.current) return;

    const pc = new RTCPeerConnection(servers);
    pcInstances.current[id] = pc;

    // Direct Stream Injection
    streamRef.current.getTracks().forEach(track => {
      pc.addTrack(track, streamRef.current!);
    });

    // ICE Relay
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        const cRef = collection(db, 'streams', streamId, 'connections', id, 'candidates');
        addDoc(cRef, e.candidate.toJSON());
      }
    };

    // Remote Session Recognition
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    
    // Create & Transmit Answer
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    const answerPayload = {
      type: answer.type,
      sdp: answer.sdp,
    };

    await updateDoc(doc(db, 'streams', streamId, 'connections', id), { answer: answerPayload });
  };

  const handleStart = () => {
    onStart(streamTitle || `${userData.displayName}'s Neural Stream`);
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black flex items-center justify-center animate-in fade-in duration-500 overflow-hidden">
      <div className="relative w-full h-full bg-slate-900 flex flex-col">
        
        {/* Real-time Hardware Viewport */}
        <div className="absolute inset-0 bg-black">
           <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover opacity-80 mirror"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        </div>

        {step === 'setup' && (
          <div className="relative z-10 flex flex-col items-center justify-center h-full p-8 text-center bg-black/40 backdrop-blur-xl animate-in zoom-in-95">
             <div className="w-20 h-20 bg-rose-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl animate-pulse">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4.5v15m7.5-7.5h-15" /></svg>
             </div>
             <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic mb-2">Initiate Uplink</h2>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mb-12">Synchronizing Camera Interface...</p>
             
             <div className="w-full max-w-sm space-y-6">
                <input 
                  type="text" autoFocus placeholder="Name your broadcast..." value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:ring-4 focus:ring-rose-500/20 transition-all text-center"
                />
                <div className="flex gap-4">
                   <button onClick={onEnd} className="flex-1 py-4 bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Cancel</button>
                   <button onClick={handleStart} className="flex-[2] py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Go Live</button>
                </div>
             </div>
          </div>
        )}

        {step === 'broadcasting' && (
          <div className="relative z-10 flex flex-col h-full p-8 pointer-events-none">
             <div className="flex justify-between items-start pointer-events-auto">
                <div className="flex gap-3">
                   <div className="bg-rose-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      Live
                   </div>
                   <div className="bg-black/60 backdrop-blur-md text-white px-4 py-1.5 rounded-lg text-[10px] font-black font-mono">
                      {Math.floor(timer/60).toString().padStart(2, '0')}:{(timer%60).toString().padStart(2, '0')}
                   </div>
                </div>
                <button onClick={onEnd} className="bg-white/10 hover:bg-rose-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/10 transition-all active:scale-95">Stop</button>
             </div>

             <div className="mt-auto flex items-end justify-between pointer-events-auto">
                <div className="flex items-center gap-4">
                   <img src={userData.avatarUrl} className="w-14 h-14 rounded-2xl border-2 border-white shadow-2xl" alt="" />
                   <div>
                      <p className="text-[10px] font-black text-white/60 uppercase tracking-widest font-mono mb-1">Broadcasting</p>
                      <h3 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">{userData.displayName}</h3>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-white font-black font-mono text-[10px] uppercase tracking-tighter mb-1">P2P_MESH_READY</p>
                   <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] font-mono">NEURAL_TRANSCEIVER_STABLE</p>
                </div>
             </div>
          </div>
        )}

        {step === 'error' && (
          <div className="relative z-10 flex flex-col items-center justify-center h-full p-8 text-center bg-slate-950 animate-in fade-in">
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">Sync Error</h2>
            <p className="text-slate-400 text-sm mb-10">{errorMessage}</p>
            <button onClick={onEnd} className="px-10 py-4 bg-white text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest">Return</button>
          </div>
        )}

        <style dangerouslySetInnerHTML={{ __html: `.mirror { transform: scaleX(-1); }` }} />
      </div>
    </div>
  );
};
