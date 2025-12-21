
import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../../services/firebase';
import { doc, onSnapshot, collection, setDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { LiveStream } from '../../types';

interface LiveWatcherOverlayProps {
  stream: LiveStream;
  onLeave: () => void;
}

// Advanced ICE configuration matching the broadcaster
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

export const LiveWatcherOverlay: React.FC<LiveWatcherOverlayProps> = ({ stream, onLeave }) => {
  const [currentViewers, setCurrentViewers] = useState(stream.viewerCount);
  const [status, setStatus] = useState<'handshaking' | 'p2p_sync' | 'established' | 'failed'>('handshaking');
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const connectionIdRef = useRef<string>(`viewer_${auth.currentUser?.uid || 'anon'}_${Math.random().toString(36).substring(2, 10)}`);

  useEffect(() => {
    let unsubAnswer: () => void;
    let unsubHostCandidates: () => void;
    const hostCandidateQueue: RTCIceCandidateInit[] = [];

    const connect = async () => {
      if (!db || !auth.currentUser) return;
      
      const pc = new RTCPeerConnection(rtcConfig);
      pcRef.current = pc;

      // Remote stream handling
      pc.ontrack = (event) => {
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
          setStatus('established');
          // Handle browsers that block autoplay
          videoRef.current.play().catch(() => {
            if (videoRef.current) videoRef.current.muted = true;
            videoRef.current?.play().catch(console.error);
          });
        }
      };

      // Reliability monitoring
      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        if (state === 'connected' || state === 'completed') setStatus('established');
        if (state === 'failed' || state === 'closed') setStatus('failed');
      };

      // Send local ICE candidates to the broadcaster
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          addDoc(collection(db, 'streams', stream.id, 'connections', connectionIdRef.current, 'peerCandidates'), e.candidate.toJSON());
        }
      };

      try {
        // Transceiver setup for reliable track reception
        pc.addTransceiver('video', { direction: 'recvonly' });
        pc.addTransceiver('audio', { direction: 'recvonly' });

        // Step 1: Create the WebRTC Offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Step 2: Push the offer to Firestore for the broadcaster to see
        await setDoc(doc(db, 'streams', stream.id, 'connections', connectionIdRef.current), { 
          offer: { sdp: offer.sdp, type: offer.type },
          viewerId: auth.currentUser.uid,
          createdAt: serverTimestamp()
        });
        
        setStatus('p2p_sync');

        // Step 3: Listen for the broadcaster's answer
        unsubAnswer = onSnapshot(doc(db, 'streams', stream.id, 'connections', connectionIdRef.current), async (snap) => {
          const data = snap.data();
          if (data?.answer && !pc.currentRemoteDescription) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            
            // Step 4: Flush any candidates received before the remote description was set
            while (hostCandidateQueue.length > 0) {
              const cand = hostCandidateQueue.shift();
              if (cand) pc.addIceCandidate(new RTCIceCandidate(cand)).catch(e => console.warn("ICE candidate sync error", e));
            }
          }
        });

        // Step 5: Listen for broadcaster (host) ICE candidates
        const hostCandRef = collection(db, 'streams', stream.id, 'connections', connectionIdRef.current, 'hostCandidates');
        unsubHostCandidates = onSnapshot(hostCandRef, (snap) => {
          snap.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
              const cand = change.doc.data() as RTCIceCandidateInit;
              if (pc.remoteDescription) {
                pc.addIceCandidate(new RTCIceCandidate(cand)).catch(e => console.warn("Host candidate sync error", e));
              } else {
                hostCandidateQueue.push(cand);
              }
            }
          });
        });
      } catch (err) {
        console.error("Critical Connection Failure:", err);
        setStatus('failed');
      }
    };

    connect();

    // Listen for stream data updates (viewer count)
    const unsubStream = onSnapshot(doc(db, 'streams', stream.id), (snap) => {
      if (snap.exists()) {
        setCurrentViewers(snap.data().viewerCount);
      } else {
        // Broadcaster terminated
        onLeave();
      }
    });

    return () => {
      if (unsubAnswer) unsubAnswer();
      if (unsubHostCandidates) unsubHostCandidates();
      unsubStream();
      if (pcRef.current) {
        pcRef.current.onicecandidate = null;
        pcRef.current.ontrack = null;
        pcRef.current.close();
      }
      // Cleanup signaling doc
      if (db) {
        deleteDoc(doc(db, 'streams', stream.id, 'connections', connectionIdRef.current)).catch(() => {});
      }
    };
  }, [stream.id]);

  return (
    <div className="fixed inset-0 z-[2000] bg-black flex items-center justify-center overflow-hidden">
      <div className="relative w-full h-full bg-slate-950 flex flex-col">
        {/* Main Viewport */}
        <video 
          ref={videoRef} autoPlay playsInline 
          className={`w-full h-full object-cover transition-all duration-1000 ${status === 'established' ? 'opacity-100 scale-100' : 'opacity-0 scale-105 blur-2xl'}`} 
        />
        
        {/* Handshake Overlay */}
        {status !== 'established' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-10 bg-black/60 backdrop-blur-3xl z-30 p-12 text-center animate-in fade-in duration-500">
             <div className="relative">
                <div className="w-28 h-28 bg-white/5 rounded-[3rem] border border-white/10 flex items-center justify-center">
                   <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin shadow-[0_0_20px_rgba(79,70,229,0.3)]" />
                </div>
                {status === 'failed' && (
                   <div className="absolute inset-0 bg-rose-600 rounded-[3rem] flex items-center justify-center animate-in zoom-in duration-300">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M6 18L18 6M6 6l12 12" /></svg>
                   </div>
                )}
             </div>

             <div className="space-y-4">
                <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.5em] font-mono animate-pulse">
                  {status === 'handshaking' ? 'INITIALIZING_NEURAL_LINK' : status === 'p2p_sync' ? 'SYNCING_P2P_DATAGRAMS' : 'SIGNAL_LOST'}
                </p>
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-none">
                  {stream.authorName}'s SIGNAL
                </h2>
                <div className="pt-8">
                  <button 
                    onClick={onLeave} 
                    className="px-10 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all"
                  >
                    {status === 'failed' ? 'Retry_Connection' : 'Abort_Link'}
                  </button>
                </div>
             </div>
          </div>
        )}

        {/* UI HUD Controls */}
        <div className="relative z-40 flex flex-col h-full p-8 md:p-12 pointer-events-none">
           <div className="flex justify-between items-start pointer-events-auto">
              <div className="flex items-center gap-4">
                 <div className="bg-rose-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2.5 shadow-2xl border border-rose-500/50">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-white" />
                    Live
                 </div>
                 <div className="bg-black/60 backdrop-blur-xl text-white px-5 py-2.5 rounded-xl text-[10px] font-black font-mono border border-white/10 shadow-2xl">
                    {currentViewers.toLocaleString()} NODES_TUNED
                 </div>
              </div>
              <button 
                onClick={onLeave} 
                className="bg-white/10 hover:bg-white/20 text-white px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest pointer-events-auto transition-all active:scale-95 border border-white/10 backdrop-blur-xl"
              >
                Disconnect
              </button>
           </div>
           
           <div className="mt-auto flex items-end justify-between gap-8 pointer-events-auto">
              <div className="flex items-center gap-8">
                 <div className="relative shrink-0">
                    <img src={stream.authorAvatar} className="w-20 h-20 md:w-24 md:h-24 rounded-[2.5rem] border-4 border-white/20 shadow-2xl transition-transform hover:scale-105" alt="" />
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-indigo-600 rounded-xl border-2 border-black flex items-center justify-center shadow-lg"><svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
                 </div>
                 <div className="text-left">
                    <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.4em] font-mono mb-2 italic">Signal_Origin: {stream.authorName}</p>
                    <h3 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-2xl">"{stream.title}"</h3>
                    <div className="flex gap-4 mt-4">
                       <span className="text-[9px] font-black bg-indigo-600/20 text-indigo-400 px-3 py-1 rounded-md uppercase tracking-widest font-mono border border-indigo-400/20">#{stream.category}</span>
                    </div>
                 </div>
              </div>
              
              <div className="hidden lg:block text-right mb-4">
                 <div className="p-6 bg-black/40 backdrop-blur-xl rounded-[2.5rem] border border-white/10 inline-flex flex-col gap-2">
                   <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.4em] font-mono text-center">Protocol_established</p>
                   <p className="text-[8px] font-black text-white/20 uppercase font-mono tracking-[0.2em]">{stream.id.toUpperCase()}</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
