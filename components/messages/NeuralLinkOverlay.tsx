import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/firebase';
import { 
  doc, 
  updateDoc, 
  onSnapshot, 
  collection, 
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { CallSession, User } from '../../types';
import { ICONS } from '../../constants';

interface NeuralLinkOverlayProps {
  session: CallSession;
  userData: User;
  onEnd: () => void;
}

const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const NeuralLinkOverlay: React.FC<NeuralLinkOverlayProps> = ({ session, userData, onEnd }) => {
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(session.type === 'voice');
  const [callStatus, setCallStatus] = useState(session.status);
  const [signalStrength, setSignalStrength] = useState(98);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  
  const ringSoundRef = useRef<HTMLAudioElement | null>(null);
  const ringbackSoundRef = useRef<HTMLAudioElement | null>(null);

  const isCaller = session.callerId === userData.id;
  const targetAvatar = isCaller ? session.receiverAvatar : session.callerAvatar;
  const targetName = isCaller ? session.receiverName : session.callerName;

  useEffect(() => {
    ringSoundRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    ringSoundRef.current.loop = true;
    ringbackSoundRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/135/135-preview.mp3');
    ringbackSoundRef.current.loop = true;

    const setupMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: session.type === 'video', 
          audio: true
        });
        localStreamRef.current = stream;
        if (localVideoRef.current && session.type === 'video') {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Neural_Hardware_Failure:", err);
      }
    };

    setupMedia();

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
    });

    return () => {
      unsub();
      cleanup();
    };
  }, []);

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
      timer = window.setInterval(() => {
        setDuration(prev => prev + 1);
        setSignalStrength(prev => Math.min(100, Math.max(92, prev + (Math.random() > 0.5 ? 1 : -1))));
      }, 1000);
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
  };

  const handleTerminate = async () => {
    if (!db) return;
    try { await updateDoc(doc(db, 'calls', session.id), { status: 'ended' }); } finally { cleanup(); }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[4000] bg-slate-950 text-white flex flex-col overflow-hidden animate-in fade-in duration-500 font-sans">
      
      {/* 1. CINEMATIC BACKGROUND LAYER */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {session.type === 'video' ? (
          <video 
            ref={remoteVideoRef} 
            autoPlay playsInline 
            className={`w-full h-full object-cover transition-all duration-1000 ${callStatus === 'connected' ? 'opacity-40 scale-100' : 'opacity-0 scale-110'}`} 
          />
        ) : (
          <div className="w-full h-full bg-[#020617]" />
        )}
        <div className={`absolute inset-0 transition-colors duration-1000 ${callStatus === 'ringing' ? 'bg-indigo-950/60 backdrop-blur-3xl' : 'bg-slate-950/80 backdrop-blur-2xl'}`} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay" />
      </div>

      {/* 2. TOP TELEMETRY HUD */}
      <div className="relative z-10 p-6 md:p-10 flex justify-between items-start w-full">
        <div className="flex flex-col gap-4">
           <div className="flex items-center gap-3">
              <div className={`px-4 py-2 rounded-2xl border backdrop-blur-xl flex items-center gap-3 shadow-2xl transition-all ${callStatus === 'connected' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
                <div className={`w-2 h-2 rounded-full ${callStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500 animate-ping'}`} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] font-mono italic">
                  {callStatus === 'ringing' ? 'HANDSHAKE_INIT' : 'LINK_ESTABLISHED'}
                </span>
              </div>
              {callStatus === 'connected' && (
                <div className="bg-black/40 border border-white/5 px-4 py-2 rounded-2xl backdrop-blur-md">
                   <span className="text-[11px] font-black font-mono text-white tracking-widest">{formatTime(duration)}</span>
                </div>
              )}
           </div>
           
           {callStatus === 'connected' && (
             <div className="flex items-center gap-6 opacity-40 hover:opacity-100 transition-opacity">
                <div className="flex flex-col">
                   <span className="text-[7px] font-black uppercase tracking-widest font-mono text-slate-500">Signal_Integrity</span>
                   <span className="text-xs font-black font-mono">{signalStrength}%</span>
                </div>
                <div className="flex flex-col border-l border-white/10 pl-4">
                   <span className="text-[7px] font-black uppercase tracking-widest font-mono text-slate-500">Protocol_Ref</span>
                   <span className="text-xs font-black font-mono">GB-NOD-26</span>
                </div>
             </div>
           )}
        </div>

        <div className="hidden md:flex flex-col items-end">
           <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white/20">VibeStream_Neural_Comms</h1>
           <p className="text-[8px] font-mono font-bold text-white/10 uppercase tracking-[0.4em]">Grid_Auth_v7.2_Stable</p>
        </div>
      </div>

      {/* 3. CORE IDENTITY CENTER */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center">
         <div className="relative mb-10 group">
            {/* Visual Pulsing Auras */}
            <div className={`absolute inset-0 rounded-full blur-[80px] transition-all duration-1000 scale-150 ${callStatus === 'ringing' ? 'bg-indigo-500/20' : 'bg-emerald-500/10'}`} />
            
            <div className={`relative p-2 rounded-full border-2 transition-all duration-700 ${callStatus === 'ringing' ? 'border-indigo-500/40' : 'border-emerald-500/20'}`}>
              <img 
                src={targetAvatar} 
                className={`w-32 h-32 md:w-56 md:h-56 rounded-full object-cover shadow-2xl transition-all duration-1000 ${callStatus === 'ringing' ? 'animate-pulse scale-100' : 'scale-95 grayscale-[0.2]'}`} 
                alt="" 
              />
              <div className="absolute -bottom-2 -right-2 bg-indigo-600 p-2 md:p-3 rounded-2xl shadow-2xl border-4 border-slate-950">
                <ICONS.Verified />
              </div>
            </div>

            {callStatus === 'ringing' && (
              <div className="absolute -inset-8 pointer-events-none">
                 <div className="w-full h-full border border-indigo-500/20 rounded-full animate-[ping_3s_infinite]" />
              </div>
            )}
         </div>

         <div className="space-y-4 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <h2 className="text-3xl md:text-6xl font-black text-white italic tracking-tighter uppercase leading-none">
              {callStatus === 'ringing' ? (isCaller ? 'Establishing Link...' : 'Incoming Sync...') : targetName}
            </h2>
            <p className={`text-[10px] md:text-xs font-black uppercase tracking-[0.6em] font-mono italic transition-colors ${callStatus === 'connected' ? 'text-emerald-400' : 'text-indigo-400 animate-pulse'}`}>
              {callStatus === 'ringing' ? (isCaller ? 'WAITING_FOR_PEER_SYNC' : 'NEURAL_HANDSHAKE_REQUEST') : 'SECURE_CHANNEL_ACTIVE'}
            </p>
         </div>
      </div>

      {/* 4. LOCAL PREVIEW (Floating) */}
      {session.type === 'video' && (
        <div className={`absolute bottom-32 md:bottom-12 right-6 md:right-12 w-32 md:w-64 aspect-[4/3] rounded-[2rem] md:rounded-[3rem] bg-black/40 backdrop-blur-3xl border border-white/10 shadow-2xl overflow-hidden transition-all duration-1000 group ${callStatus === 'connected' ? 'scale-100 opacity-100 translate-y-0' : 'scale-0 opacity-0 translate-y-10'}`}>
           <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror opacity-80" />
           <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/60 rounded-xl border border-white/5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[8px] font-black text-white/40 uppercase tracking-widest font-mono">CORE_NODE_LOCAL</span>
           </div>
        </div>
      )}

      {/* 5. IMMERSIVE CONTROL DECK */}
      <div className="relative z-20 pb-[max(2rem,var(--sab)+1rem)] px-6">
        <div className="max-w-xl mx-auto bg-white/5 backdrop-blur-3xl border border-white/10 p-4 md:p-6 rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] flex items-center justify-around gap-4 animate-in slide-in-from-bottom-8 duration-700">
           
           {callStatus === 'ringing' && !isCaller ? (
             <>
               <button 
                 onClick={handleTerminate}
                 className="w-16 h-16 md:w-24 md:h-24 bg-rose-600 text-white rounded-[1.8rem] md:rounded-[2.5rem] flex items-center justify-center shadow-xl hover:bg-rose-500 transition-all active:scale-90 group"
               >
                 <svg className="w-8 h-8 md:w-12 md:h-12 rotate-[135deg] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3.5"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
               </button>
               <button 
                 onClick={handleAccept}
                 className="w-20 h-20 md:w-32 md:h-32 bg-emerald-600 text-white rounded-[2rem] md:rounded-[3rem] flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.4)] hover:bg-emerald-500 transition-all active:scale-95 animate-bounce"
               >
                 <svg className="w-10 h-10 md:w-16 md:h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
               </button>
             </>
           ) : (
             <>
               <button 
                 onClick={() => setIsMuted(!isMuted)} 
                 className={`w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-[2rem] flex flex-col items-center justify-center transition-all active:scale-90 border-2 ${isMuted ? 'bg-white text-slate-950 border-white' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}
               >
                 <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
                 <span className="hidden md:block text-[7px] font-black uppercase mt-2 tracking-widest opacity-40">Mute</span>
               </button>

               <button 
                 onClick={handleTerminate} 
                 className="w-16 h-16 md:w-28 md:h-28 bg-rose-600 text-white rounded-[1.8rem] md:rounded-[2.5rem] flex items-center justify-center shadow-2xl hover:bg-rose-500 transition-all active:scale-95 group"
               >
                 <svg className="w-8 h-8 md:w-14 md:h-14 rotate-[135deg] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3.5"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
               </button>

               <button 
                 disabled={session.type === 'voice'} 
                 onClick={() => setIsVideoOff(!isVideoOff)} 
                 className={`w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-[2rem] flex flex-col items-center justify-center transition-all active:scale-90 border-2 ${session.type === 'voice' ? 'opacity-10 grayscale' : (isVideoOff ? 'bg-white text-slate-950 border-white' : 'bg-white/5 text-white border-white/10 hover:bg-white/10')}`}
               >
                 <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M15.75 10.5l4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25z" /></svg>
                 <span className="hidden md:block text-[7px] font-black uppercase mt-2 tracking-widest opacity-40">Camera</span>
               </button>
             </>
           )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .mirror { transform: scaleX(-1); }
        @keyframes ring-pulse {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 0.8; }
        }
      `}} />
    </div>
  );
};