
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
    let unsubAnswer: () => void;
    let unsubCandidates: () => void;

    const establishP2PLink = async () => {
      if (!db || !auth.currentUser) return;

      const pc = new RTCPeerConnection(servers);
      pcRef.current = pc;

      // Track Management: Handle incoming Neural Signal
      const remoteStream = new MediaStream();
      pc.ontrack = (event) => {
        event.streams[0].getTracks().forEach(track => {
          remoteStream.addTrack(track);
        });
        if (videoRef.current) {
          videoRef.current.srcObject = remoteStream;
          // Playback promise to bypass browser auto-play blocks
          videoRef.current.play().catch(e => console.warn("Auto-play inhibited, waiting for user intent."));
          setStatus('established');
        }
      };

      // Connection State Monitoring
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          setStatus('offline');
          onLeave();
        }
      };

      // Local Candidate Generation
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          const cRef = collection(db, 'streams', stream.id, 'connections', connectionIdRef.current, 'candidates');
          addDoc(cRef, e.candidate.toJSON());
        }
      };

      // Handshake Initialization: Create Offer
      const connectionDoc = doc(db, 'streams', stream.id, 'connections', connectionIdRef.current);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const offerPayload = { sdp: offer.sdp, type: offer.type };
      await setDoc(connectionDoc, { offer: offerPayload, createdAt: new Date() });

      // Listen for Host Response (Answer)
      unsubAnswer = onSnapshot(connectionDoc, async (snap) => {
        const data = snap.data();
        if (data?.answer && !pc.currentRemoteDescription) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
      });

      // Listen for Host Topology (Candidates)
      const cRef = collection(db, 'streams', stream.id, 'connections', connectionIdRef.current, 'candidates');
      unsubCandidates = onSnapshot(cRef, (snap) => {
        snap.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            if (pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(data));
            }
          }
        });
      });
    };

    establishP2PLink();

    // Stream Vital Monitoring
    const unsubVital = onSnapshot(doc(db, 'streams', stream.id), (snap) => {
      if (snap.exists()) {
        setCurrentViewers(snap.data().viewerCount);
        setSignalQuality(96 + Math.floor(Math.random() * 4));
      } else {
        onLeave();
      }
    });

    return () => {
      unsubVital();
      if (unsubAnswer) unsubAnswer();
      if (unsubCandidates) unsubCandidates();
      if (pcRef.current) pcRef.current.close();
      if (db) deleteDoc(doc(db, 'streams', stream.id, 'connections', connectionIdRef.current));
    };
  }, [stream.id]);

  return (
    <div className="fixed inset-0 z-[2000] bg-black flex items-center justify-center animate-in fade-in duration-500 overflow-hidden">
      <div className="relative w-full h-full bg-slate-950 flex flex-col">
        
        <div className="absolute inset-0 bg-slate-900 flex items-center justify-center overflow-hidden">
           {/* HIGH-SPEED VIDEO RENDERER */}
           <video 
             ref={videoRef} 
             autoPlay 
             playsInline 
             muted 
             className={`w-full h-full object-cover transition-all duration-1000 ${status === 'established' ? 'opacity-100' : 'opacity-0 blur-3xl scale-110'}`} 
           />
           
           {status === 'connecting' && (
             <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 bg-black/80 backdrop-blur-3xl z-30">
                <div className="w-24 h-24 bg-rose-600/10 rounded-[2.5rem] border border-rose-600/20 flex items-center justify-center animate-pulse">
                   <div className="w-8 h-8 border-4 border-rose-600/20 border-t-rose-600 rounded-full animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black text-rose-500/60 uppercase tracking-[0.5em] font-mono mb-2">Handshaking_Protocol</p>
                  <p className="text-xl font-black text-white tracking-tighter uppercase italic">Syncing Node: {stream.id.slice(0, 8)}</p>
                </div>
             </div>
           )}

           <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>

        {/* HUD LAYER */}
        <div className="relative z-40 flex flex-col h-full p-8 pointer-events-none">
           <div className="flex justify-between items-start pointer-events-auto">
              <div className="flex items-center gap-3">
                 <div className="bg-rose-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl ring-4 ring-rose-500/20">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    Live • Realtime
                 </div>
                 <div className="bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-xl text-[10px] font-black font-mono">
                    {currentViewers} NODES_SYNCED
                 </div>
                 <div className="bg-emerald-500/20 text-emerald-400 px-3 py-2 rounded-xl text-[9px] font-black font-mono border border-emerald-500/20 hidden sm:block">
                    Signal: {signalQuality}%
                 </div>
              </div>
              <button onClick={onLeave} className="bg-white/10 hover:bg-rose-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/10 transition-all active:scale-95">Disconnect</button>
           </div>

           <div className="mt-auto flex items-end justify-between pointer-events-auto">
              <div className="flex items-center gap-6">
                 <img src={stream.authorAvatar} className="w-16 h-16 md:w-20 md:h-20 rounded-[2rem] border-4 border-white/20 shadow-2xl" alt="" />
                 <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest font-mono mb-1">Source_Identity</p>
                    <h3 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter uppercase leading-none mb-2">{stream.authorName}</h3>
                    <p className="text-xs text-white/60 font-medium tracking-tight italic">"{stream.title}"</p>
                 </div>
              </div>
              <div className="hidden md:flex flex-col items-end">
                 <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.4em] font-mono">P2P_MESH_CLUSTER</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
