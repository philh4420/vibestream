
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { User } from '../../types';

interface LiveBroadcastOverlayProps {
  userData: User;
  onStart: (title: string) => void;
  onEnd: () => void;
  activeStreamId: string | null;
}

export const LiveBroadcastOverlay: React.FC<LiveBroadcastOverlayProps> = ({ 
  userData, 
  onStart, 
  onEnd, 
  activeStreamId 
}) => {
  const [step, setStep] = useState<'setup' | 'broadcasting' | 'error'>('setup');
  const [streamTitle, setStreamTitle] = useState('');
  const [timer, setTimer] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 1. Camera Initialization
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, 
          audio: true 
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.error("Camera access denied:", err);
        setStep('error');
        setErrorMessage(err.message || 'Hardware access denied. Check camera permissions.');
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 2. Broadcast Lifecycle & Frame Capture Protocol
  useEffect(() => {
    let timerInterval: number;
    let captureInterval: number;

    if (activeStreamId && db) {
      setStep('broadcasting');
      
      // Timer for duration
      timerInterval = window.setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);

      // Frame Broadcast Heartbeat (Every 1.5s for "Live" effect via Firestore)
      captureInterval = window.setInterval(async () => {
        if (!videoRef.current || !canvasRef.current || !activeStreamId) return;

        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext('2d');

        if (context && video.videoWidth > 0) {
          // Downscale for low-latency grid broadcast (320px width)
          const ratio = video.videoHeight / video.videoWidth;
          canvas.width = 320;
          canvas.height = 320 * ratio;
          
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Low quality JPEG to keep payload small (< 15kb)
          const snapshot = canvas.toDataURL('image/jpeg', 0.5);
          
          try {
            await updateDoc(doc(db, 'streams', activeStreamId), {
              liveSnapshot: snapshot
            });
          } catch (e) {
            console.warn("Signal Sync Dropped:", e);
          }
        }
      }, 1500);
    }

    return () => {
      clearInterval(timerInterval);
      clearInterval(captureInterval);
    };
  }, [activeStreamId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartBroadcast = () => {
    onStart(streamTitle || `${userData.displayName}'s Neural Broadcast`);
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black flex items-center justify-center p-0 md:p-6 animate-in fade-in duration-500">
      <div className="relative w-full h-full max-w-5xl bg-slate-900 md:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col">
        
        {/* Hidden Frame Processor */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Live Video Preview */}
        <div className="absolute inset-0 bg-slate-950">
           <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover opacity-90 transition-opacity duration-1000"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
        </div>

        {/* UI Layer: Setup */}
        {step === 'setup' && (
          <div className="relative z-10 flex flex-col items-center justify-center h-full p-8 text-center bg-black/40 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
             <div className="w-20 h-20 bg-white/10 rounded-[2rem] border border-white/20 flex items-center justify-center mb-8 backdrop-blur-xl">
                <div className="w-4 h-4 bg-rose-500 rounded-full animate-ping shadow-[0_0_15px_rgba(244,63,94,0.8)]" />
             </div>
             <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic mb-2">Initiate Uplink</h2>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mb-10">Prepare your signal for grid-wide broadcast</p>
             
             <div className="w-full max-w-sm space-y-6">
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Signal Protocol Name..." 
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm font-bold placeholder:text-slate-600 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all"
                />
                <div className="flex gap-4">
                   <button 
                      onClick={onEnd}
                      className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                   >
                     Abort
                   </button>
                   <button 
                      onClick={handleStartBroadcast}
                      className="flex-[2] py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-900/20 transition-all active:scale-95"
                   >
                     Go Live Now
                   </button>
                </div>
             </div>
          </div>
        )}

        {/* UI Layer: Error State */}
        {step === 'error' && (
          <div className="relative z-10 flex flex-col items-center justify-center h-full p-8 text-center bg-slate-950 animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-rose-500/20 rounded-[2.5rem] flex items-center justify-center mb-8 border border-rose-500/30">
               <svg className="w-10 h-10 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">Hardware Failure</h2>
            <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.4em] font-mono mb-6 italic">Signal Blocked • Protocol Interrupted</p>
            <p className="text-slate-400 text-sm font-medium mb-10 max-w-xs">{errorMessage}</p>
            <button 
              onClick={onEnd}
              className="px-10 py-4 bg-white text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
            >
              Return to Hub
            </button>
          </div>
        )}

        {/* UI Layer: Broadcasting */}
        {step === 'broadcasting' && (
          <div className="relative z-10 flex flex-col h-full p-6 md:p-10 pointer-events-none">
             {/* Header */}
             <div className="flex justify-between items-start pointer-events-auto">
                <div className="flex items-center gap-4">
                   <div className="bg-rose-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg ring-2 ring-rose-500/20">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      Live
                   </div>
                   <div className="bg-black/60 backdrop-blur-md border border-white/10 text-white px-4 py-1.5 rounded-lg text-[10px] font-black font-mono">
                      {formatTime(timer)}
                   </div>
                </div>
                <button 
                  onClick={onEnd}
                  className="bg-white/10 hover:bg-rose-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/10 transition-all active:scale-95"
                >
                  End Signal
                </button>
             </div>

             {/* Footer Info */}
             <div className="mt-auto flex items-end justify-between pointer-events-auto">
                <div className="flex items-center gap-4">
                   <div className="relative">
                      <img src={userData.avatarUrl} className="w-14 h-14 rounded-2xl border-2 border-white/20 shadow-2xl" alt="" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-white/60 uppercase tracking-widest font-mono mb-1">Broadcasting_Identity</p>
                      <h3 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">{userData.displayName}</h3>
                   </div>
                </div>

                <div className="flex flex-col items-end">
                   <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                      <span className="text-white font-black font-mono text-[10px] uppercase tracking-tighter">Transmitting Signal...</span>
                   </div>
                   <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] font-mono">NEURAL_ENCODER_V2.6</p>
                </div>
             </div>
          </div>
        )}

        {/* Neural Overlay Grids */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
          <div className="grid grid-cols-12 w-full h-full">
            {Array.from({ length: 144 }).map((_, i) => (
              <div key={i} className="border border-white h-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
