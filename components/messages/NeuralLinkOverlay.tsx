import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/firebase';
import { 
  doc, 
  updateDoc, 
  onSnapshot, 
  collection, 
  addDoc,
  serverTimestamp,
  deleteDoc
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
  const [signalStrength, setSignalStrength] = useState(99);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  
  const ringSoundRef = useRef<HTMLAudioElement | null>(null);
  const ringbackSoundRef = useRef<HTMLAudioElement | null>(null);

  const isCaller = session.callerId === userData.id;
  const targetAvatar = isCaller ? session.receiverAvatar : session.callerAvatar;
  const targetName = isCaller ? session.receiverName : session.callerName;

  // 1. Initial Media & Audio Setup
  useEffect(() => {
    // High-fidelity minimalist technical ringtones
    ringSoundRef.current = new Audio('https://cdn.pixabay.com/download/audio/2022/03/10/audio_f535870f90.mp3'); // Minimalist Tech
    ringSoundRef.current.loop = true;
    ringbackSoundRef.current = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_0300300a2d.mp3'); // Soft Echo
    ringbackSoundRef.current.loop = true;

    const setupMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: session.type === 'video', 
          audio: true
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        
        // IF CALLER: Create Offer Immediately
        if (isCaller) {
          const pc = new RTCPeerConnection(rtcConfig);
          pcRef.current = pc;
          stream.getTracks().forEach(t => pc.addTrack(t, stream));
          
          pc.onicecandidate = (e) => {
            if (e.candidate) addDoc(collection(db, 'calls', session.id, 'callerCandidates'), e.candidate.toJSON());
          };

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await updateDoc(doc(db, 'calls', session.id), {
            offer: { type: offer.type, sdp: offer.sdp }
          });

          // Listen for Answer
          onSnapshot(doc(db, 'calls', session.id), async (snap) => {
            const data = snap.data();
            if (data?.answer && !pc.currentRemoteDescription) {
              await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            }
          });

          // Listen for Receiver ICE
          onSnapshot(collection(db, 'calls', session.id, 'receiverCandidates'), (snap) => {
            snap.docChanges().forEach(change => {
              if (change.type === 'added') pc.addIceCandidate(new RTCIceCandidate(change.doc.data())).catch(() => {});
            });
          });
          
          pc.ontrack = (e) => {
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
          };
        }
      } catch (err) {
        console.error("HARDWARE_INIT_ERROR:", err);
      }
    };

    setupMedia();

    const unsub = onSnapshot(doc(db, 'calls', session.id), (snap) => {
      if (!snap.exists()) { onEnd(); return; }
      const data = snap.data();
      setCallStatus(data.status);
      if (data.status === 'rejected' || data.status === 'ended') cleanup();
    });

    return () => { unsub(); cleanup(); };
  }, []);

  // 2. Audio State Controller
  useEffect(() => {
    if (callStatus === 'ringing') {
      if (isCaller) ringbackSoundRef.current?.play().catch(() => {});
      else ringSoundRef.current?.play().catch(() => {});
    } else {
      ringSoundRef.current?.pause();
      ringbackSoundRef.current?.pause();
    }
  }, [callStatus]);

  // 3. Duration & Signal Logic
  useEffect(() => {
    let timer: number;
    if (callStatus === 'connected') {
      timer = window.setInterval(() => {
        setDuration(prev => prev + 1);
        setSignalStrength(prev => Math.min(100, Math.max(94, prev + (Math.random() > 0.5 ? 1 : -1))));
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
    
    const pc = new RTCPeerConnection(rtcConfig);
    pcRef.current = pc;
    localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current!));

    pc.onicecandidate = (e) => {
      if (e.candidate) addDoc(collection(db, 'calls', session.id, 'receiverCandidates'), e.candidate.toJSON());
    };

    pc.ontrack = (e) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
    };

    // Listen for Caller ICE
    onSnapshot(collection(db, 'calls', session.id, 'callerCandidates'), (snap) => {
      snap.docChanges().forEach(change => {
        if (change.type === 'added') pc.addIceCandidate(new RTCIceCandidate(change.doc.data())).catch(() => {});
      });
    });

    // Process Offer and create Answer
    const snap = await onSnapshot(doc(db, 'calls', session.id), async (docSnap) => {
      const data = docSnap.data();
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

  const isConnected = callStatus === 'connected';

  return (
    <div className="fixed inset-0 z-[5000] bg-[#020617] text-white flex flex-col items-center justify-center overflow-hidden animate-in fade-in duration-500 font-sans p-4 md:p-10">
      
      {/* 1. CINEMATIC BACKGROUND */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {isConnected && session.type === 'video' ? (
          <video 
            ref={remoteVideoRef} autoPlay playsInline 
            className="w-full h-full object-cover opacity-30 scale-105 blur-sm" 
          />
        ) : (
          <div className="w-full h-full bg-[#020617]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/40 via-transparent to-slate-950/80 backdrop-blur-3xl" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay" />
      </div>

      {/* 2. COMPACT POD (RINGING STATE) */}
      <div className={`relative z-10 w-full transition-all duration-1000 flex flex-col items-center ${isConnected ? 'max-w-6xl flex-1' : 'max-w-md'}`}>
        
        {/* Identity Section */}
        <div className={`flex flex-col items-center text-center transition-all duration-700 ${isConnected ? 'mb-8 mt-12' : 'mb-16'}`}>
          <div className="relative mb-8 group">
            <div className={`absolute inset-0 rounded-full blur-[60px] transition-all duration-1000 scale-150 ${isConnected ? 'bg-emerald-500/10' : 'bg-indigo-500/20'}`} />
            <div className={`relative p-1 rounded-full border-2 transition-all duration-700 ${isConnected ? 'border-emerald-500/20' : 'border-indigo-500/40 animate-neural-pulse'}`}>
              <img 
                src={targetAvatar} 
                className={`w-28 h-28 md:w-40 md:h-40 rounded-full object-cover shadow-2xl transition-all duration-1000 ${!isConnected ? 'grayscale-[0.2]' : ''}`} 
                alt="" 
              />
              <div className="absolute -bottom-1 -right-1 bg-indigo-600 p-2 rounded-xl shadow-2xl border-4 border-slate-950 scale-75">
                <ICONS.Verified />
              </div>
            </div>
          </div>

          <h2 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-none mb-4">
            {!isConnected ? (isCaller ? 'Syncing...' : 'Link Request') : targetName}
          </h2>
          
          <div className="flex items-center gap-3">
             <div className={`px-4 py-1.5 rounded-full border backdrop-blur-xl flex items-center gap-3 transition-all ${isConnected ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500 animate-ping'}`} />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] font-mono italic">
                  {isConnected ? formatTime(duration) : (isCaller ? 'Wait_Sequence' : 'Handshake_Init')}
                </span>
             </div>
          </div>
        </div>

        {/* Remote Video (Connected View) */}
        {isConnected && session.type === 'video' && (
          <div className="w-full flex-1 min-h-0 rounded-[3rem] overflow-hidden border border-white/10 shadow-heavy bg-black relative animate-in zoom-in duration-700">
             <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
             <div className="absolute top-6 left-6 flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/5">
                <span className="text-[10px] font-black font-mono text-white/60">SIGNAL: {signalStrength}%</span>
                <div className="w-1 h-3 flex gap-0.5 items-end">
                   {[1,2,3].map(i => <div key={i} className={`w-0.5 bg-emerald-500 rounded-full`} style={{height: `${40 + i*20}%`}} />)}
                </div>
             </div>
          </div>
        )}

        {/* Voice Sync Visualiser (Connected Voice Only) */}
        {isConnected && session.type === 'voice' && (
          <div className="w-full flex-1 flex items-center justify-center">
             <div className="flex items-center gap-2 h-16">
                {Array.from({length: 12}).map((_, i) => (
                  <div key={i} className="w-1.5 bg-indigo-500/40 rounded-full animate-voice-bar" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
             </div>
          </div>
        )}
      </div>

      {/* 3. LOCAL PREVIEW (PiP) */}
      {session.type === 'video' && (
        <div className={`absolute bottom-[160px] md:bottom-32 right-6 w-24 md:w-48 aspect-[3/4] rounded-3xl bg-black/40 backdrop-blur-3xl border border-white/10 shadow-2xl overflow-hidden transition-all duration-1000 z-50 ${isConnected ? 'scale-100' : 'scale-0'}`}>
           <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror opacity-80" />
           <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-black/60 rounded-lg">
              <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[7px] font-black text-white/40 font-mono">LOCAL</span>
           </div>
        </div>
      )}

      {/* 4. MOBILE-OPTIMIZED CONTROL DOCK */}
      <div className="fixed bottom-0 left-0 right-0 p-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+0.5rem))] z-[6000] animate-in slide-in-from-bottom-10 duration-700">
        <div className="max-w-lg mx-auto bg-white/5 backdrop-blur-2xl border border-white/10 p-3 md:p-5 rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] flex items-center justify-around gap-2">
           
           {!isConnected && !isCaller ? (
             <>
               <button 
                 onClick={handleTerminate}
                 className="flex-1 h-14 md:h-20 bg-rose-600/20 text-rose-500 rounded-[2rem] flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all active:scale-90"
               >
                 <svg className="w-6 h-6 rotate-[135deg]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3.5"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
               </button>
               <button 
                 onClick={handleAccept}
                 className="flex-[1.5] h-14 md:h-20 bg-emerald-600 text-white rounded-[2rem] flex items-center justify-center shadow-xl hover:bg-emerald-500 transition-all active:scale-95 animate-bounce-subtle"
               >
                 <svg className="w-8 h-8 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                 <span className="font-black text-xs uppercase tracking-widest">Accept</span>
               </button>
             </>
           ) : (
             <>
               <button 
                 onClick={() => setIsMuted(!isMuted)} 
                 className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex flex-col items-center justify-center transition-all active:scale-90 border-2 ${isMuted ? 'bg-white text-slate-950 border-white' : 'bg-white/5 text-white border-white/10'}`}
               >
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
               </button>

               <button 
                 onClick={handleTerminate} 
                 className="flex-1 h-14 md:h-16 bg-rose-600 text-white rounded-[2rem] flex items-center justify-center shadow-xl hover:bg-rose-500 transition-all active:scale-95 group mx-4"
               >
                 <svg className="w-7 h-7 rotate-[135deg]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3.5"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                 <span className="ml-3 font-black text-xs uppercase tracking-[0.2em] hidden md:block">Terminate</span>
               </button>

               <button 
                 disabled={session.type === 'voice'} 
                 onClick={() => setIsVideoOff(!isVideoOff)} 
                 className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex flex-col items-center justify-center transition-all active:scale-90 border-2 ${session.type === 'voice' ? 'opacity-10 grayscale' : (isVideoOff ? 'bg-white text-slate-950 border-white' : 'bg-white/5 text-white border-white/10')}`}
               >
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M15.75 10.5l4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25z" /></svg>
               </button>
             </>
           )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .mirror { transform: scaleX(-1); }
        @keyframes voice-bar {
          0%, 100% { height: 10px; }
          50% { height: 40px; }
        }
        .animate-voice-bar { animation: voice-bar 0.8s ease-in-out infinite; }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-subtle { animation: bounce-subtle 2s infinite; }
      `}} />
    </div>
  );
};