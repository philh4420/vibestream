
import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../../services/firebase';
import { doc, onSnapshot, collection, setDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { LiveStream } from '../../types';

interface LiveWatcherOverlayProps {
  stream: LiveStream;
  onLeave: () => void;
}

const servers = {
  iceServers: [
    { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] },
  ],
  iceCandidatePoolSize: 10,
};

export const LiveWatcherOverlay: React.FC<LiveWatcherOverlayProps> = ({ stream, onLeave }) => {
  const [currentViewers, setCurrentViewers] = useState(stream.viewerCount);
  const [status, setStatus] = useState<'connecting' | 'established' | 'offline'>('connecting');
  const [signalQuality, setSignalQuality] = useState(100);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const connectionIdRef = useRef<string>(Math.random().toString(36).substring(2, 15));

  useEffect(() => {
    const establishConnection = async () => {
      if (!db || !auth.currentUser) return;

      const pc = new RTCPeerConnection(servers);
      pcRef.current = pc;

      // Handle Remote Tracks (The real-time video)
      const remoteStream = new MediaStream();
      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach(track => {
          remoteStream.addTrack(track);
        });
        if (videoRef.current) {
          videoRef.current.srcObject = remoteStream;
          setStatus('established');
        }
      };

      // Handle ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const candidatesRef = collection(db, 'streams', stream.id, 'connections', connectionIdRef.current, 'candidates');
          addDoc(candidatesRef, event.candidate.toJSON());
        }
      };

      // Create Connection Document
      const connectionDoc = doc(db, 'streams', stream.id, 'connections', connectionIdRef.current);
      
      // Create Offer
      const offerDescription = await pc.createOffer();
      await pc.setLocalDescription(offerDescription);

      const offer = {
        sdp: offerDescription.sdp,
        type: offerDescription.type,
      };

      await setDoc(connectionDoc, { offer, createdAt: new Date() });

      // Listen for Answer from Broadcaster
      onSnapshot(connectionDoc, (docSnap) => {
        const data = docSnap.data();
        if (data?.answer && !pc.currentRemoteDescription) {
          const answerDescription = new RTCSessionDescription(data.answer);
          pc.setRemoteDescription(answerDescription);
        }
      });

      // Listen for ICE Candidates from Broadcaster
      const candidatesRef = collection(db, 'streams', stream.id, 'connections', connectionIdRef.current, 'candidates');
      onSnapshot(candidatesRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            pc.addIceCandidate(new RTCIceCandidate(data));
          }
        });
      });
    };

    establishConnection();

    // Monitor stream status & viewer count
    const unsubStream = onSnapshot(doc(db, 'streams', stream.id), (docSnap) => {
      if (docSnap.exists()) {
        setCurrentViewers(docSnap.data().viewerCount);
        setSignalQuality(95 + Math.floor(Math.random() * 5));
      } else {
        onLeave();
      }
    });

    return () => {
      unsubStream();
      if (pcRef.current) pcRef.current.close();
      // Attempt to clean up signaling doc
      if (db) deleteDoc(doc(db, 'streams', stream.id, 'connections', connectionIdRef.current));
    };
  }, [stream.id]);

  return (
    <div className="fixed inset-0 z-[2000] bg-black flex items-center justify-center p-0 md:p-6 animate-in fade-in duration-500">
      <div className="relative w-full h-full max-w-5xl bg-slate-950 md:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col">
        
        {/* Master Viewport */}
        <div className="absolute inset-0">
           <div className="w-full h-full bg-slate-900 flex items-center justify-center overflow-hidden">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className={`w-full h-full object-cover transition-all duration-[800ms] ${status === 'established' ? 'opacity-100 scale-100' : 'opacity-0 scale-110 blur-3xl'}`} 
              />
              
              {/* Signaling Matrix Overlay */}
              {status === 'connecting' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 bg-black/80 backdrop-blur-3xl z-30">
                   <div className="w-24 h-24 bg-white/5 rounded-[2.5rem] border border-white/10 flex items-center justify-center shadow-2xl animate-pulse">
                      <div className="w-8 h-8 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
                   </div>
                   <div className="text-center">
                     <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em] font-mono mb-2">P2P_HANDSHAKE_INIT</p>
                     <p className="text-xl font-black text-white tracking-tighter uppercase italic">Synchronizing Node: {stream.id.slice(0, 8)}</p>
                   </div>
                </div>
              )}
              
              {/* Scanlines & Grain (Subtle for 2026 feel) */}
              <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
           </div>
           
           <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none z-10" />
        </div>

        {/* INTERFACE LAYER */}
        <div className="relative z-40 flex flex-col h-full p-6 md:p-10 pointer-events-none">
           <div className="flex justify-between items-start pointer-events-auto">
              <div className="flex items-center gap-3">
                 <div className="bg-rose-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    Live • Realtime
                 </div>
                 <div className="bg-black/60 backdrop-blur-md border border-white/10 text-white px-4 py-2 rounded-xl text-[10px] font-black font-mono">
                    {currentViewers.toLocaleString()} NODES
                 </div>
                 <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-emerald-400 px-3 py-2 rounded-xl text-[9px] font-black font-mono uppercase hidden sm:block">
                    Signal: {signalQuality}%
                 </div>
              </div>
              <button onClick={onLeave} className="bg-white/10 hover:bg-rose-600/40 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/10 transition-all active:scale-95">Disconnect</button>
           </div>

           <div className="mt-auto flex items-end justify-between pointer-events-auto">
              <div className="flex items-center gap-6">
                 <div className="relative">
                    <img src={stream.authorAvatar} className="w-16 h-16 md:w-20 md:h-20 rounded-[2rem] border-4 border-white/20 shadow-2xl" alt="" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-slate-950 rounded-full animate-pulse" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest font-mono mb-1">Source_Identity</p>
                    <h3 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter uppercase leading-none mb-2">{stream.authorName}</h3>
                    <p className="text-xs text-white/60 font-medium tracking-tight italic">"{stream.title}"</p>
                 </div>
              </div>
              <div className="hidden md:flex flex-col items-end gap-3">
                 <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.4em] font-mono">Neural_P2P_Cluster</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
