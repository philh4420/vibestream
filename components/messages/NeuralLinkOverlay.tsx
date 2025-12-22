
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/firebase';
import { 
  doc, 
  updateDoc, 
  serverTimestamp, 
  onSnapshot, 
  collection, 
  addDoc,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { CallSession, User } from '../../types';

interface NeuralLinkOverlayProps {
  session: CallSession;
  userData: User;
  onEnd: () => void;
}

const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const NeuralLinkOverlay: React.FC<NeuralLinkOverlayProps> = ({ session, userData, onEnd }) => {
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(session.type === 'voice');
  const [callStatus, setCallStatus] = useState(session.status);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  
  // Audio Assets
  const ringSoundRef = useRef<HTMLAudioElement | null>(null);
  const ringbackSoundRef = useRef<HTMLAudioElement | null>(null);

  const isCaller = session.callerId === userData.id;

  useEffect(() => {
    // Initialise Sound Objects (British Eng. Professional Tones)
    // Using royalty-free high-tech tone URLs
    ringSoundRef.current = new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_273187216a.mp3?filename=phone-calling-101183.mp3');
    ringSoundRef.current.loop = true;
    
    ringbackSoundRef.current = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_c584735c0a.mp3?filename=ringing-101183.mp3');
    ringbackSoundRef.current.loop = true;

    const setupMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: session.type === 'video',
          audio: true
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Hardware Sync Error:", err);
      }
    };

    setupMedia();

    // Listen for call state updates (rejected/ended)
    const unsub = onSnapshot(doc(db, 'calls', session.id), (snap) => {
      if (!snap.exists()) {
        onEnd();
        return;
      }
      const data = snap.data();
      setCallStatus(data.status);
      if (data.status === 'rejected' || data.status === 'ended') {
        cleanup();
      }
      if (data.status === 'connected' && pcRef.current?.remoteDescription === null && !isCaller) {
        // Handshake already happening via the accept button
      }
    });

    return () => {
      unsub();
      cleanup();
    };
  }, []);

  // Handle Audio based on status
  useEffect(() => {
    if (callStatus === 'ringing') {
      if (isCaller) ringbackSoundRef.current?.play().catch(() => {});
      else ringSoundRef.current?.play().catch(() => {});
    } else {
      ringSoundRef.current?.pause();
      ringbackSoundRef.current?.pause();
    }
  }, [callStatus]);

  useEffect(() => {
    let timer: number;
    if (callStatus === 'connected') {
      timer = window.setInterval(() => setDuration(prev => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [callStatus]);

  const cleanup = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
    ringSoundRef.current?.pause();
    ringbackSoundRef.current?.pause();
    onEnd();
  };

  const handleAccept = async () => {
    if (!db || !localStreamRef.current) return;
    setCallStatus('connected');
    
    const pc = new RTCPeerConnection(rtcConfig);
    pcRef.current = pc;

    localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current!));

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(collection(db, 'calls', session.id, 'receiverCandidates'), event.candidate.toJSON());
      }
    };

    // Signalling Listeners
    onSnapshot(doc(db, 'calls', session.id), async (snap) => {
      const data = snap.data();
      if (data?.offer && !pc.currentRemoteDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await updateDoc(doc(db, 'calls', session.id), { 
          answer: { type: answer.type, sdp: answer.sdp },
          status: 'connected'
        });
      }
    });

    onSnapshot(collection(db, 'calls', session.id, 'callerCandidates'), (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'added') {
          pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
        }
      });
    });
  };

  // Caller side initialization
  useEffect(() => {
    if (isCaller && db && localStreamRef.current) {
      const initCaller = async () => {
        const pc = new RTCPeerConnection(rtcConfig);
        pcRef.current = pc;

        localStreamRef.current!.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current!));

        pc.ontrack = (event) => {
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            addDoc(collection(db, 'calls', session.id, 'callerCandidates'), event.candidate.toJSON());
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await updateDoc(doc(db, 'calls', session.id), {
          offer: { type: offer.type, sdp: offer.sdp }
        });

        onSnapshot(doc(db, 'calls', session.id), async (snap) => {
          const data = snap.data();
          if (data?.answer && !pc.currentRemoteDescription) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          }
        });

        onSnapshot(collection(db, 'calls', session.id, 'receiverCandidates'), (snap) => {
          snap.docChanges().forEach((change) => {
            if (change.type === 'added') {
              pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
            }
          });
        });
      };
      initCaller();
    }
  }, [localStreamRef.current]);

  const handleDecline = async () => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'calls', session.id), { status: 'rejected' });
    } finally { cleanup(); }
  };

  const handleTerminate = async () => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'calls', session.id), { status: 'ended' });
    } finally { cleanup(); }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isIncoming = session.receiverId === userData.id && callStatus === 'ringing';

  return (
    <div className="fixed inset-0 z-[3500] bg-[#020617] flex flex-col items-center justify-center p-4 md:p-10 selection:bg-indigo-500 overflow-hidden font-sans">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 left-0 w-full h-full transition-all duration-1000 ${callStatus === 'ringing' ? 'bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.2),transparent_60%)]' : 'bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_60%)]'}`} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay" />
      </div>

      <div className="relative z-10 w-full max-w-5xl h-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-700">
        
        {/* Main Viewport */}
        <div className="relative w-full aspect-video rounded-[3rem] md:rounded-[4rem] bg-slate-900 border border-white/10 overflow-hidden shadow-2xl mb-8 flex items-center justify-center group">
           
           {/* Remote Video */}
           <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className={`w-full h-full object-cover transition-opacity duration-1000 ${callStatus === 'connected' ? 'opacity-100' : 'opacity-0'}`} 
           />

           {/* Placeholder / Ringing UI */}
           {callStatus !== 'connected' && (
             <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 md:gap-10 p-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500/20 blur-3xl animate-pulse scale-150" />
                  <img 
                    src={isCaller ? (isIncoming ? session.callerAvatar : session.receiverId) : session.callerAvatar} 
                    className="relative w-32 h-32 md:w-56 md:h-56 rounded-full object-cover border-4 md:border-8 border-white/10 shadow-2xl transition-transform group-hover:scale-105 duration-700" 
                    alt="" 
                    onError={(e) => {
                      // Fallback for missing ID to Avatar mapping
                      e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.receiverId}`;
                    }}
                  />
                </div>
                <div className="text-center">
                  <h2 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter uppercase mb-2 md:mb-4">
                    {isCaller ? "Establishing Link..." : session.callerName}
                  </h2>
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
                    <p className="text-[10px] md:text-[12px] font-black text-indigo-400 uppercase tracking-[0.8em] font-mono animate-pulse">
                      {isIncoming ? 'INCOMING_HANDSHAKE' : 'SEARCHING_PEER_ID'}
                    </p>
                  </div>
                </div>
             </div>
           )}

           {/* Local Mirror (PiP) */}
           <div className={`absolute bottom-6 right-6 w-24 md:w-48 aspect-[4/3] rounded-2xl md:rounded-3xl bg-slate-950/80 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden transition-all duration-700 ${callStatus === 'connected' ? 'scale-100' : 'scale-0 opacity-0'}`}>
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror" />
              <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-black/40 rounded-lg">
                 <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                 <span className="text-[6px] md:text-[8px] font-black text-white/60 uppercase font-mono tracking-widest">LOCAL</span>
              </div>
           </div>
        </div>

        {/* Dynamic Control Bar */}
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-6 md:gap-12 bg-white/5 backdrop-blur-3xl border border-white/10 p-5 md:p-8 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl">
             {isIncoming ? (
               <>
                 <button 
                  onClick={handleDecline} 
                  className="w-16 h-16 md:w-24 md:h-24 bg-rose-600 text-white rounded-2xl md:rounded-[2rem] flex items-center justify-center shadow-2xl hover:bg-rose-500 transition-all active:scale-90"
                 >
                    <svg className="w-7 h-7 md:w-10 md:h-10 rotate-[135deg]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                 </button>
                 <button 
                  onClick={handleAccept} 
                  className="w-20 h-20 md:w-32 md:h-32 bg-emerald-600 text-white rounded-[1.8rem] md:rounded-[2.5rem] flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.4)] hover:bg-emerald-500 transition-all active:scale-95 animate-bounce"
                 >
                    <svg className="w-10 h-10 md:w-14 md:h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                 </button>
               </>
             ) : (
               <>
                 <button 
                  onClick={() => setIsMuted(!isMuted)} 
                  className={`w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-3xl flex items-center justify-center transition-all active:scale-90 border-2 ${isMuted ? 'bg-white text-slate-950 border-white' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}
                 >
                    <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
                 </button>
                 <button 
                  onClick={handleTerminate} 
                  className="w-16 h-16 md:w-28 md:h-28 bg-rose-600 text-white rounded-2xl md:rounded-[2.2rem] flex items-center justify-center shadow-2xl hover:bg-rose-500 transition-all active:scale-95 group"
                 >
                    <svg className="w-8 h-8 md:w-12 md:h-12 rotate-[135deg] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3.5"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                 </button>
                 <button 
                  onClick={() => setIsVideoOff(!isVideoOff)} 
                  className={`w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-3xl flex items-center justify-center transition-all active:scale-90 border-2 ${isVideoOff ? 'bg-white text-slate-950 border-white' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}
                 >
                    <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>
                 </button>
               </>
             )}
          </div>
          
          {callStatus === 'connected' && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-2.5 rounded-full backdrop-blur-md">
              <span className="text-[11px] font-black font-mono text-emerald-400 tracking-[0.4em] uppercase">
                {formatTime(duration)}
              </span>
            </div>
          )}
        </div>

        <div className="mt-12 text-center opacity-20">
          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.5em] font-mono italic">PEER_SYNC_ENCRYPTED_AES256</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .mirror { transform: scaleX(-1); }
      `}} />
    </div>
  );
};
