
import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { LiveStream } from '../../types';

interface LiveWatcherOverlayProps {
  stream: LiveStream;
  onLeave: () => void;
}

export const LiveWatcherOverlay: React.FC<LiveWatcherOverlayProps> = ({ stream, onLeave }) => {
  const [currentViewers, setCurrentViewers] = useState(stream.viewerCount);
  const [liveFrame, setLiveFrame] = useState<string | null>(null);
  const [status, setStatus] = useState<'connecting' | 'established'>('connecting');
  const [signalQuality, setSignalQuality] = useState(100);

  useEffect(() => {
    // 1. Establish Neural Handshake Simulation
    const timer = setTimeout(() => setStatus('established'), 2500);

    // 2. Real-time Stream Monitoring & Frame Sync
    const unsub = onSnapshot(doc(db, 'streams', stream.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCurrentViewers(data.viewerCount);
        if (data.liveSnapshot) {
          setLiveFrame(data.liveSnapshot);
          // Randomly fluctuate signal quality for realism
          setSignalQuality(Math.floor(Math.random() * (100 - 85 + 1)) + 85);
        }
      } else {
        // Broadcaster decommissioned node
        onLeave();
      }
    });

    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, [stream.id, onLeave]);

  return (
    <div className="fixed inset-0 z-[2000] bg-black flex items-center justify-center p-0 md:p-6 animate-in fade-in duration-500">
      <div className="relative w-full h-full max-w-5xl bg-slate-950 md:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col">
        
        {/* Main Viewport */}
        <div className="absolute inset-0">
           {/* Cinematic Neural Feed Processor */}
           <div className="w-full h-full bg-slate-900 flex items-center justify-center overflow-hidden">
              {/* Fallback/Starting Visual */}
              <img 
                src={stream.thumbnailUrl} 
                className={`absolute inset-0 w-full h-full object-cover blur-3xl opacity-20 scale-110 transition-opacity duration-1000 ${liveFrame ? 'opacity-40' : 'opacity-20'}`} 
                alt="" 
              />

              {/* LIVE SIGNAL FRAME */}
              <img 
                src={liveFrame || stream.thumbnailUrl} 
                className={`w-full h-full object-cover transition-all duration-[800ms] ease-in-out ${status === 'established' ? 'opacity-80 scale-100 grayscale-[0.2]' : 'opacity-30 blur-xl scale-110'}`} 
                alt="Neural Stream" 
              />
              
              {/* Scanline & Noise Overlay (Masks frame rate jitter) */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                 <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-20" />
                 <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-20" />
                 <div className="absolute top-0 left-0 w-full h-1 bg-white/10 shadow-[0_0_15px_white] animate-[scan_8s_linear_infinite] z-20" />
              </div>

              {status === 'connecting' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 bg-black/60 backdrop-blur-3xl z-30">
                   <div className="w-24 h-24 bg-white/10 rounded-[2.5rem] border border-white/20 flex items-center justify-center shadow-2xl animate-pulse">
                      <div className="w-8 h-8 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
                   </div>
                   <div className="text-center">
                     <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em] font-mono mb-2">Establishing_Neural_Sync</p>
                     <p className="text-xl font-black text-white tracking-tighter uppercase italic">Handshaking Node: {stream.id.slice(0, 8)}</p>
                   </div>
                </div>
              )}
           </div>
           
           {/* Neural Interference Overlay */}
           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none z-10" />
           <div className="absolute inset-0 pointer-events-none opacity-[0.02] z-10">
              <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] w-full h-full">
                {Array.from({ length: 400 }).map((_, i) => (
                  <div key={i} className="border-t border-l border-white h-full" />
                ))}
              </div>
            </div>
        </div>

        {/* UI Overlay Layer */}
        <div className="relative z-40 flex flex-col h-full p-6 md:p-10 pointer-events-none">
           {/* Header Context */}
           <div className="flex justify-between items-start pointer-events-auto">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                 <div className="flex items-center gap-2">
                    <div className="bg-rose-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl ring-4 ring-rose-500/20">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        Live
                    </div>
                    <div className="bg-black/60 backdrop-blur-md border border-white/10 text-white px-4 py-2 rounded-xl text-[10px] font-black font-mono">
                        {currentViewers.toLocaleString()} NODES_SYNCED
                    </div>
                 </div>
                 <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-lg text-[9px] font-black font-mono uppercase tracking-widest hidden md:block">
                    Signal: {signalQuality}% • Nom_Uplink
                 </div>
              </div>
              <button 
                onClick={onLeave}
                className="bg-white/10 hover:bg-rose-600/40 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/10 transition-all active:scale-95"
              >
                Exit Signal
              </button>
           </div>

           {/* Broadcaster Context */}
           <div className="mt-auto flex items-end justify-between pointer-events-auto">
              <div className="flex items-center gap-6">
                 <div className="relative">
                    <img src={stream.authorAvatar} className="w-16 h-16 md:w-20 md:h-20 rounded-[2rem] border-4 border-white/20 shadow-2xl" alt="" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-slate-950 rounded-full animate-pulse" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest font-mono mb-1">Source_Identity</p>
                    <h3 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter uppercase leading-none mb-2">{stream.authorName}</h3>
                    <p className="text-xs text-white/60 font-medium tracking-tight max-w-md line-clamp-1 italic">"{stream.title}"</p>
                 </div>
              </div>

              <div className="hidden md:flex flex-col items-end gap-3">
                 <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center text-[8px] font-black text-white shadow-lg overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 77}`} className="w-full h-full object-cover" alt="" />
                      </div>
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-slate-950 bg-indigo-600 flex items-center justify-center text-[8px] font-black text-white shadow-lg">
                      +{Math.max(0, currentViewers - 4)}
                    </div>
                 </div>
                 <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.4em] font-mono">Neural_Cluster_Participation</p>
              </div>
           </div>
        </div>

        {/* Keyframe Scanline Animation */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes scan {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100vh); }
          }
        `}} />
      </div>
    </div>
  );
};
