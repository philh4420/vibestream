
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
  const [status, setStatus] = useState<'connecting' | 'established'>('connecting');

  useEffect(() => {
    // 1. Establish Neural Handshake Simulation
    const timer = setTimeout(() => setStatus('established'), 2500);

    // 2. Real-time Viewer Sync
    const unsub = onSnapshot(doc(db, 'streams', stream.id), (docSnap) => {
      if (docSnap.exists()) {
        setCurrentViewers(docSnap.data().viewerCount);
      } else {
        // Broadcaster ended stream
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
           {/* Simulated Video Node */}
           <div className="w-full h-full bg-slate-900 flex items-center justify-center overflow-hidden">
              <img 
                src={stream.thumbnailUrl} 
                className={`w-full h-full object-cover transition-all duration-[10s] blur-md scale-110 opacity-40 ${status === 'established' ? 'blur-none scale-100 opacity-80' : ''}`} 
                alt="" 
              />
              
              {status === 'connecting' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 bg-black/40 backdrop-blur-3xl z-20">
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
           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />
           <div className="absolute inset-0 pointer-events-none opacity-[0.02]">
              <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] w-full h-full">
                {Array.from({ length: 400 }).map((_, i) => (
                  <div key={i} className="border-t border-l border-white h-full" />
                ))}
              </div>
            </div>
        </div>

        {/* UI Overlay Layer */}
        <div className="relative z-10 flex flex-col h-full p-6 md:p-10">
           {/* Header Context */}
           <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                 <div className="bg-rose-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl ring-4 ring-rose-500/20">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    Live
                 </div>
                 <div className="bg-black/60 backdrop-blur-md border border-white/10 text-white px-4 py-2 rounded-xl text-[10px] font-black font-mono">
                    {currentViewers.toLocaleString()} NODES_SYNCED
                 </div>
              </div>
              <button 
                onClick={onLeave}
                className="bg-white/10 hover:bg-rose-600/20 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/10 transition-all active:scale-95"
              >
                Exit Signal
              </button>
           </div>

           {/* Broadcaster Context */}
           <div className="mt-auto flex items-end justify-between">
              <div className="flex items-center gap-6">
                 <div className="relative">
                    <img src={stream.authorAvatar} className="w-16 h-16 md:w-20 md:h-20 rounded-[2rem] border-4 border-white/20 shadow-2xl" alt="" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-slate-950 rounded-full animate-pulse" />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest font-mono mb-1">Source_Identity</p>
                    <h3 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter uppercase leading-none mb-2">{stream.authorName}</h3>
                    <p className="text-xs text-white/60 font-medium tracking-tight max-w-md line-clamp-1">{stream.title}</p>
                 </div>
              </div>

              <div className="hidden md:flex flex-col items-end gap-3">
                 <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center text-[8px] font-black text-white">
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-slate-950 bg-indigo-600 flex items-center justify-center text-[8px] font-black text-white">
                      +{Math.max(0, currentViewers - 4)}
                    </div>
                 </div>
                 <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.4em] font-mono">Neural_Cluster_Participation</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
