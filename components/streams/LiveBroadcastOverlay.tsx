
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pcInstances = useRef<Record<string, RTCPeerConnection>>({});

  useEffect(() => {
    const initHardware = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, 
          audio: true 
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) { setStep('error'); }
    };
    initHardware();
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      Object.values(pcInstances.current).forEach(pc => pc.close());
    };
  }, []);

  useEffect(() => {
    if (activeStreamId && db) {
      setStep('broadcasting');
      const timerInt = window.setInterval(() => setTimer(prev => prev + 1), 1000);
      
      const connectionsRef = collection(db, 'streams', activeStreamId, 'connections');
      const unsub = onSnapshot(connectionsRef, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const connectionId = change.doc.id;
            const data = change.doc.data();
            if (data.offer && !pcInstances.current[connectionId]) {
              await setupPeer(connectionId, data.offer, activeStreamId);
            }
          }
        });
      });

      return () => { clearInterval(timerInt); unsub(); };
    }
  }, [activeStreamId]);

  const setupPeer = async (id: string, offer: any, streamId: string) => {
    if (!streamRef.current) return;
    const pc = new RTCPeerConnection(servers);
    pcInstances.current[id] = pc;

    streamRef.current.getTracks().forEach(track => pc.addTrack(track, streamRef.current!));

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        addDoc(collection(db, 'streams', streamId, 'connections', id, 'candidates'), e.candidate.toJSON());
      }
    };

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    await updateDoc(doc(db, 'streams', streamId, 'connections', id), { 
      answer: { type: answer.type, sdp: answer.sdp } 
    });

    // Handle candidates sent by viewer AFTER handshake
    const cRef = collection(db, 'streams', streamId, 'connections', id, 'candidates');
    onSnapshot(cRef, (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'added' && pc.remoteDescription) {
          pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
        }
      });
    });
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black flex items-center justify-center overflow-hidden">
      <div className="relative w-full h-full flex flex-col">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-80 mirror" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

        {step === 'setup' && (
          <div className="relative z-10 flex flex-col items-center justify-center h-full p-8 text-center bg-black/40 backdrop-blur-xl">
             <div className="w-20 h-20 bg-rose-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl animate-pulse">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4.5v15m7.5-7.5h-15" strokeWidth="2.5"/></svg>
             </div>
             <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic mb-8">Establish Uplink</h2>
             <div className="w-full max-w-sm space-y-4">
                <input 
                  type="text" placeholder="Channel Name..." value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none text-center"
                />
                <button onClick={() => onStart(streamTitle)} className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Go Live</button>
                <button onClick={onEnd} className="w-full py-4 text-white/40 font-bold uppercase text-[9px] tracking-widest">Abort</button>
             </div>
          </div>
        )}

        {step === 'broadcasting' && (
          <div className="relative z-10 flex flex-col h-full p-8 pointer-events-none">
             <div className="flex justify-between items-start pointer-events-auto">
                <div className="flex gap-3">
                   <div className="bg-rose-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2">Live</div>
                   <div className="bg-black/60 backdrop-blur-md text-white px-4 py-1.5 rounded-lg text-[10px] font-black font-mono">
                      {Math.floor(timer/60)}:{(timer%60).toString().padStart(2, '0')}
                   </div>
                </div>
                <button onClick={onEnd} className="bg-white/10 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest pointer-events-auto">End</button>
             </div>
             <div className="mt-auto flex items-end justify-between">
                <div className="flex items-center gap-4">
                   <img src={userData.avatarUrl} className="w-14 h-14 rounded-2xl border-2 border-white shadow-2xl" alt="" />
                   <h3 className="text-xl font-black text-white uppercase italic">{userData.displayName}</h3>
                </div>
                <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] font-mono">NEURAL_P2P_MESH_OK</p>
             </div>
          </div>
        )}

        <style dangerouslySetInnerHTML={{ __html: `.mirror { transform: scaleX(-1); }` }} />
      </div>
    </div>
  );
};
