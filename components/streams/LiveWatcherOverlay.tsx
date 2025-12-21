
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
    let unsubCandidates: () => void;

    const connect = async () => {
      if (!db || !auth.currentUser) return;
      const pc = new RTCPeerConnection(servers);
      pcRef.current = pc;

      pc.ontrack = (event) => {
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
          setStatus('established');
          videoRef.current.play().catch(() => {});
        }
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          addDoc(collection(db, 'streams', stream.id, 'connections', connectionIdRef.current, 'candidates'), e.candidate.toJSON());
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'connected') setStatus('established');
        if (pc.iceConnectionState === 'failed') setStatus('failed');
      };

      // Create Offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await setDoc(doc(db, 'streams', stream.id, 'connections', connectionIdRef.current), { 
        offer: { sdp: offer.sdp, type: offer.type },
        createdAt: new Date()
      });
      setStatus('p2p_sync');

      // Listen for Answer
      unsubAnswer = onSnapshot(doc(db, 'streams', stream.id, 'connections', connectionIdRef.current), async (snap) => {
        const data = snap.data();
        if (data?.answer && !pc.currentRemoteDescription) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
      });

      // Listen for Candidates
      unsubCandidates = onSnapshot(collection(db, 'streams', stream.id, 'connections', connectionIdRef.current, 'candidates'), (snap) => {
        snap.docChanges().forEach(async (change) => {
          if (change.type === 'added' && pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
          }
        });
      });
    };

    connect();

    return () => {
      if (unsubAnswer) unsubAnswer();
      if (unsubCandidates) unsubCandidates();
      if (pcRef.current) pcRef.current.close();
      if (db) deleteDoc(doc(db, 'streams', stream.id, 'connections', connectionIdRef.current));
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
