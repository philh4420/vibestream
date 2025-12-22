import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/firebase';
import { 
  doc, 
  updateDoc, 
  onSnapshot, 
  collection, 
  addDoc,
  serverTimestamp,
  getDoc
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
  
  const ringSoundRef = useRef<HTMLAudioElement | null>(null);
  const ringbackSoundRef = useRef<HTMLAudioElement | null>(null);

  const isCaller = session.callerId === userData.id;
  const targetAvatar = isCaller ? session.receiverAvatar : session.callerAvatar;
  const targetName = isCaller ? session.receiverName : session.callerName;

  // 1. Initial Setup & Hardware
  useEffect(() => {
    // High-fidelity technical audio (Reliable CDN)
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
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        if (isCaller) {
          await initiateCallerHandshake(stream);
        }
      } catch (err) {
        console.error("Neural_Uplink_Hardware_Failure:", err);
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

  // 2. WebRTC Handshake Logic
  const initiateCallerHandshake = async (stream: MediaStream) => {
    const pc = new RTCPeerConnection(rtcConfig);
    pcRef.current = pc;
    stream.getTracks().forEach(t => pc.addTrack(t, stream));

    pc.onicecandidate = (e) => {
      if (e.candidate) addDoc(collection(db, 'calls', session.id, 'callerCandidates'), e.candidate.toJSON());
    };

    pc.ontrack = (e) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await updateDoc(doc(db, 'calls', session.id), { offer: { type: offer.type, sdp: offer.sdp } });

    // Watch for Answer
    onSnapshot(doc(db, 'calls', session.id), async (snap) => {
      const data = snap.data();
      if (data?.answer && !pc.currentRemoteDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    });

    // Watch for Receiver ICE
    onSnapshot(collection(db, 'calls', session.id, 'receiverCandidates'), (snap) => {
      snap.docChanges().forEach(change => {
        if (change.type === 'added') pc.addIceCandidate(new RTCIceCandidate(change.doc.data())).catch(() => {});
      });
    });
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
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = e.streams[0];
        // Force play to ensure audio is heard
        remoteVideoRef.current.play().catch(console.error);
      }
    };

    // Watch for Caller ICE
    onSnapshot(collection(db, 'calls', session.id, 'callerCandidates'), (snap) => {
      snap.docChanges().forEach(change => {
        if (change.type === 'added') pc.addIceCandidate(new RTCIceCandidate(change.doc.data())).catch(() => {});
      });
    });

    // Process Offer & Create Answer
    const snap = await getDoc(doc(db, 'calls', session.id));
    const data = snap.data();
    if (data?.offer) {
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await updateDoc(doc(db, 'calls', session.id), { 
        answer: { type: answer.type, sdp: answer.sdp },
        status: 'connected'
      });
    }
  };

  // 3. Audio & Timer Controllers
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
    let timerInt: number;
    if (callStatus === 'connected') {
      timerInt = window.setInterval(() => setDuration(prev => prev + 1), 1000);
    }
    return () => clearInterval(timerInt);
  }, [callStatus]);

  const cleanup = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
    ringSoundRef.current?.pause();
    ringbackSoundRef.current?.pause();
    onEnd();
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
    <div className="fixed inset-0 z-[5000] bg-slate-950/80 backdrop-blur-3xl flex items-center justify-center p-4 selection:bg-indigo-500 font-sans">
      
      {/* 1. COMPACT NEURAL POD */}
      <div className={`relative bg-slate-900 border border-white/10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)] transition-all duration-700 overflow-hidden flex flex-col items-center ${isConnected ? 'w-full max-w-6xl h-[85dvh] rounded-[3.5rem]' : 'w-full max-w-sm rounded-[3rem] py-12 px-8'}`}>
        
        {/* Background Visual Layer for Connected State */}
        {isConnected && (
          <div className="absolute inset-0 z-0">
             {session.type === 'video' ? (
               <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover opacity-60" />
             ) : (
               <div className="w-full h-full bg-indigo-950/20 flex items-center justify-center">
                  <div className="flex items-end gap-1.5 h-20">
                     {Array.from({length: 15}).map((_, i) => (
                       <div key={i} className="w-1.5 bg-indigo-500/40 rounded-full animate-voice-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                     ))}
                  </div>
               </div>
             )}
             <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-transparent to-slate-900/90" />
          </div>
        )}

        {/* Remote Audio Track (Hidden but active) */}
        <video ref={remoteVideoRef} autoPlay playsInline className="hidden" />

        <div className="relative z-10 flex flex-col items-center w-full h-full">
           
           {/* Identity Section */}
           <div className={`flex flex-col items-center text-center transition-all duration-700 ${isConnected ? 'mt-12' : ''}`}>
              <div className="relative mb-6">
                <div className={`absolute inset-0 rounded-full blur-3xl opacity-20 transition-colors ${isConnected ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                <div className={`relative p-1.5 rounded-full border-2 transition-all ${isConnected ? 'border-emerald-500/20' : 'border-indigo-500/40 animate-neural-pulse'}`}>
                   <img src={targetAvatar} className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover shadow-2xl" alt="" />
                </div>
                {isConnected && (
                  <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-2 rounded-xl shadow-lg border-4 border-slate-900">
                    <ICONS.Verified />
                  </div>
                )}
              </div>
              
              <h2 className="text-2xl md:text-4xl font-black text-white italic tracking-tighter uppercase mb-2">
                {isConnected ? targetName : (isCaller ? 'Establishing Link...' : 'Signal_Incoming')}
              </h2>
              
              <div className="flex items-center gap-3">
                 <div className={`px-4 py-1.5 rounded-full border backdrop-blur-xl flex items-center gap-2.5 transition-all ${isConnected ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500 animate-ping'}`} />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] font-mono italic text-white/80">
                      {isConnected ? formatTime(duration) : 'Handshake_Phase_v2.6'}
                    </span>
                 </div>
              </div>
           </div>

           {/* Call Controls Dock (MOBILE FIRST) */}
           <div className={`mt-auto w-full max-w-lg transition-all duration-500 px-6 ${isConnected ? 'pb-10' : 'pt-10'}`}>
              <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-3 md:p-5 rounded-[2.5rem] flex items-center justify-around gap-4 shadow-2xl">
                 
                 {!isConnected && !isCaller ? (
                   <>
                     <button onClick={handleTerminate} className="flex-1 h-14 md:h-16 bg-rose-600/20 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all active:scale-90">
                        <svg className="w-6 h-6 rotate-[135deg]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3.5"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                     </button>
                     <button onClick={handleAccept} className="flex-[2] h-14 md:h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:bg-emerald-500 transition-all active:scale-95 animate-pulse">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        <span className="font-black text-xs uppercase tracking-widest">Accept_Link</span>
                     </button>
                   </>
                 ) : (
                   <>
                     <button onClick={() => setIsMuted(!isMuted)} className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all active:scale-90 border-2 ${isMuted ? 'bg-white text-slate-900 border-white' : 'bg-white/5 text-white border-white/10'}`}>
                        {isMuted ? (
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>
                        ) : (
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
                        )}
                     </button>
                     
                     <button onClick={handleTerminate} className="flex-1 h-14 md:h-16 bg-rose-600 text-white rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:bg-rose-500 transition-all active:scale-95 group">
                        <svg className="w-7 h-7 rotate-[135deg]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3.5"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        <span className="hidden md:block font-black text-xs uppercase tracking-[0.2em]">TERMINATE</span>
                     </button>

                     <button disabled={session.type === 'voice'} onClick={() => setIsVideoOff(!isVideoOff)} className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all active:scale-90 border-2 ${session.type === 'voice' ? 'opacity-10 grayscale' : (isVideoOff ? 'bg-white text-slate-900 border-white' : 'bg-white/5 text-white border-white/10')}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M15.75 10.5l4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25z" /></svg>
                     </button>
                   </>
                 )}
              </div>
              <div className="mt-4 flex justify-center pb-[env(safe-area-inset-bottom)]">
                 <p className="text-[7px] font-black text-white/20 uppercase tracking-[0.6em] font-mono italic">GB_NOD_26_SECURE_SYNC</p>
              </div>
           </div>

        </div>

        {/* Local Preview (PiP) */}
        {isConnected && session.type === 'video' && (
          <div className="absolute top-10 right-10 w-24 md:w-48 aspect-[3/4] rounded-3xl overflow-hidden border border-white/20 shadow-2xl z-50">
             <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror opacity-90" />
             <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/60 rounded-lg">
                <span className="text-[7px] font-black text-white uppercase font-mono tracking-widest">Local</span>
             </div>
          </div>
        )}

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .mirror { transform: scaleX(-1); }
        @keyframes voice-pulse {
          0%, 100% { height: 8px; opacity: 0.3; }
          50% { height: 60px; opacity: 1; }
        }
        .animate-voice-pulse { animation: voice-pulse 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        @keyframes ring-pod-pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.4); }
          70% { transform: scale(1.05); box-shadow: 0 0 40px 20px rgba(79, 70, 229, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
        }
        .animate-neural-pulse { animation: ring-pod-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
      `}} />
    </div>
  );
};