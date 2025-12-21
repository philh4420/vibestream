
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
};

export const LiveWatcherOverlay: React.FC<LiveWatcherOverlayProps> = ({ stream, onLeave }) => {
  const [currentViewers, setCurrentViewers] = useState(stream.viewerCount);
  const [status, setStatus] = useState<'handshaking' | 'p2p_sync' | 'established' | 'failed'>('handshaking');
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const connectionIdRef = useRef<string>(Math.random().toString(36).substring(2, 15));

  useEffect(() => {
    let unsubAnswer: () => void;
    let unsubHostCandidates: () => void;
    const hostCandidateQueue: RTCIceCandidateInit[] = [];

    const connect = async () => {
      if (!db || !auth.currentUser) return;
      const pc = new RTCPeerConnection(servers);
      pcRef.current = pc;

      // Track Management
      pc.ontrack = (event) => {
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
          setStatus('established');
          // Standard auto-play handling for 2026 browsers
          videoRef.current.play().catch(e => console.debug("Muted autoplay active"));
        }
      };

      // Reliability monitoring
      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        console.debug("ICE State Change:", state);
        if (state === 'connected' || state === 'completed') {
          setStatus('established');
        }
        if (state === 'failed' || state === 'closed') setStatus('failed');
      };

      // Transmit Peer Candidates to Broadcaster
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          addDoc(collection(db, 'streams', stream.id, 'connections', connectionIdRef.current, 'peerCandidates'), e.candidate.toJSON());
        }
      };

      try {
        // 1. Initial Handshake: Create Offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await setDoc(doc(db, 'streams', stream.id, 'connections', connectionIdRef.current), { 
          offer: { sdp: offer.sdp, type: offer.type },
          createdAt: new Date()
        });
        setStatus('p2p_sync');

        // 2. Response Monitoring: Listen for Host Answer
        unsubAnswer = onSnapshot(doc(db, 'streams', stream.id, 'connections', connectionIdRef.current), async (snap) => {
          const data = snap.data();
          if (data?.answer && !pc.currentRemoteDescription) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            
            // 3. Post-Handshake Sync: Flush candidates
            while (hostCandidateQueue.length > 0) {
              const cand = hostCandidateQueue.shift();
              if (cand) pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
            }
          }
        });

        // 4. Route Monitoring: Listen for Host Candidates
        const hostCandRef = collection(db, 'streams', stream.id, 'connections', connectionIdRef.current, 'hostCandidates');
        unsubHostCandidates = onSnapshot(hostCandRef, (snap) => {
          snap.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
              const cand = change.doc.data() as RTCIceCandidateInit;
              if (pc.remoteDescription) {
                pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
              } else {
                hostCandidateQueue.push(cand);
              }
            }
          });
        });
      } catch (err) {
        console.error("WebRTC Critical Initiation Failure:", err);
        setStatus('failed');
      }
    };

    connect();

    return () => {
      if (unsubAnswer) unsubAnswer();
      if (unsubHostCandidates) unsubHostCandidates();
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      if (db) {
        // Cleanup connection document on exit
        deleteDoc(doc(db, 'streams', stream.id, 'connections', connectionIdRef.current)).catch(() => {});
      }
    };
  }, [stream.id]);

  return (
    <div className="fixed inset-0 z-[2000] bg-black flex items-center justify-center overflow-hidden">
      <div className="relative w-full h-full bg-slate-950 flex flex-col">
        <video 
          ref={videoRef} autoPlay playsInline muted 
          className={`w-full h-full object-cover transition-opacity duration-1000 ${status === 'established' ? 'opacity-100' : 'opacity-0'}`} 
        />
        
        {status !== 'established' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 bg-black/80 backdrop-blur-3xl z-30 p-10 text-center">
             <div className="w-24 h-24 bg-rose-600/10 rounded-[2.5rem] border border-rose-600/20 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-rose-600/20 border-t-rose-600 rounded-full animate-spin" />
             </div>
             <div className="space-y-2">
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.5em] font-mono">
                  {status === 'handshaking' ? 'HANDSHAKE_INIT' : status === 'p2p_sync' ? 'NEGOTIATING_P2P_MESH' : 'SIGNAL_FAILURE'}
                </p>
                <p className="text-xl font-black text-white tracking-tighter uppercase italic">NODE: {stream.id.slice(0, 8)}</p>
                {status === 'failed' && <button onClick={onLeave} className="mt-8 px-6 py-3 bg-white text-black font-black uppercase rounded-xl">Retry Link</button>}
             </div>
          </div>
        )}

        <div className="relative z-40 flex flex-col h-full p-8 pointer-events-none">
           <div className="flex justify-between items-start pointer-events-auto">
              <div className="flex items-center gap-3">
                 <div className="bg-rose-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl">Live</div>
                 <div className="bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-xl text-[10px] font-black font-mono">{currentViewers} NODES</div>
              </div>
              <button onClick={onLeave} className="bg-white/10 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest pointer-events-auto">Exit</button>
           </div>
           <div className="mt-auto flex items-end justify-between">
              <div className="flex items-center gap-6">
                 <img src={stream.authorAvatar} className="w-16 h-16 rounded-[2rem] border-4 border-white/20 shadow-2xl" alt="" />
                 <div>
                    <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">{stream.authorName}</h3>
                    <p className="text-xs text-white/60 italic mt-2">"{stream.title}"</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
