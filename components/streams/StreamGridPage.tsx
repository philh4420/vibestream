
import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { collection, query, onSnapshot, orderBy, limit } = Firestore as any;
import { LiveStream, Region } from '../../types';
import { ICONS } from '../../constants';

interface StreamGridPageProps {
  locale: Region;
  onJoinStream: (stream: LiveStream) => void;
  onGoLive: () => void;
}

export const StreamGridPage: React.FC<StreamGridPageProps> = ({ locale, onJoinStream, onGoLive }) => {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;

    const q = query(
      collection(db, 'streams'),
      orderBy('viewerCount', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot: any) => {
      const streamData = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      } as LiveStream));
      setStreams(streamData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="w-full h-full space-y-8 animate-in fade-in duration-700">
      
      {/* 1. HERO COMMAND HEADER */}
      <div className="relative rounded-[3rem] bg-slate-900 p-8 md:p-12 text-white shadow-heavy border border-white/5 overflow-hidden group">
         {/* Dynamic Atmosphere */}
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-600/20 blur-[120px] rounded-full translate-x-1/4 -translate-y-1/4 group-hover:bg-rose-500/30 transition-colors duration-1000" />
         <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />

         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div className="space-y-4 max-w-xl">
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                  <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse shadow-[0_0_10px_#f43f5e]" />
                  <span className="text-[9px] font-black text-white uppercase tracking-[0.3em] font-mono">Live_Grid_v3</span>
               </div>
               <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none text-white">
                 Neural_Stream
               </h1>
               <p className="text-xs font-medium text-slate-300 leading-relaxed">
                 Real-time visual frequencies. Connect to nodes broadcasting live from across the Citadel.
               </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
               <div className="px-6 py-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-[1.5rem] flex flex-col items-center justify-center min-w-[120px]">
                  <span className="text-2xl font-black text-white leading-none tracking-tighter">{streams.length}</span>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Active_Signals</span>
               </div>
               <button 
                 onClick={onGoLive}
                 className="px-8 py-4 bg-white text-slate-950 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_50px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group/btn"
               >
                 <div className="w-2 h-2 bg-rose-600 rounded-full animate-ping" />
                 INITIATE_BROADCAST
               </button>
            </div>
         </div>
      </div>

      {/* 2. LIVE GRID */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="aspect-[9/14] rounded-[2.5rem] bg-slate-100 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : streams.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
          {streams.map((stream, idx) => (
            <button 
              key={stream.id}
              onClick={() => onJoinStream(stream)}
              className="group relative aspect-[9/14] rounded-[2.5rem] overflow-hidden bg-slate-900 shadow-sm hover:shadow-2xl hover:shadow-indigo-900/20 transition-all duration-500 hover:scale-[1.02] cursor-pointer text-left ring-1 ring-black/5"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {/* Image Layer */}
              <img 
                src={stream.thumbnailUrl} 
                className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-[8s] ease-out" 
                alt="" 
              />
              
              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30 opacity-60 group-hover:opacity-80 transition-all" />

              {/* Live Badge */}
              <div className="absolute top-4 left-4">
                <div className="bg-rose-600/90 backdrop-blur-xl text-white px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-white/10 shadow-lg">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  LIVE
                </div>
              </div>

              {/* View Count */}
              <div className="absolute top-4 right-4">
                 <div className="bg-black/30 backdrop-blur-md text-white px-2 py-1 rounded-lg text-[8px] font-black font-mono border border-white/10 flex items-center gap-1">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    {stream.viewerCount}
                 </div>
              </div>

              {/* Info Layer */}
              <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <div className="relative">
                     <img src={stream.authorAvatar} className="w-8 h-8 rounded-xl border border-white/30 object-cover" alt="" />
                     <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-black rounded-full" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest truncate">{stream.authorName}</p>
                    <h3 className="text-sm font-bold text-white leading-tight truncate tracking-tight">{stream.title || 'Untitled_Broadcast'}</h3>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="py-40 flex flex-col items-center justify-center text-center opacity-60 bg-slate-50/50 rounded-[4rem] border-2 border-dashed border-slate-200">
           <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center mb-6 text-slate-300 shadow-sm border border-slate-100">
              <ICONS.Streams />
           </div>
           <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest italic leading-none">Grid_Silence</h3>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mt-3 max-w-xs leading-relaxed">
             No active signal transmissions detected.
           </p>
           <button 
             onClick={onGoLive}
             className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.3em] shadow-lg hover:bg-indigo-700 transition-all active:scale-95"
           >
             Initialize_First_Node
           </button>
        </div>
      )}
    </div>
  );
};
