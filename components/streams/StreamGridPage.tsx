
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
      limit(24)
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
    <div className="w-full max-w-[2400px] mx-auto space-y-8 pb-24 animate-in fade-in duration-700">
      
      {/* 1. Command Header */}
      <div className="relative overflow-hidden rounded-[3rem] bg-slate-950 p-10 md:p-12 text-white shadow-2xl border border-white/10 group">
         {/* Atmospheric Background Effects */}
         <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/20 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3 group-hover:bg-rose-500/30 transition-colors duration-1000" />
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3" />
         
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-500/10 backdrop-blur-md rounded-xl border border-rose-500/20 text-rose-400 animate-pulse">
                     <div className="w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_10px_#f43f5e]" />
                  </div>
                  <span className="text-[10px] font-black text-rose-400 uppercase tracking-[0.4em] font-mono">Live_Protocol_Active</span>
               </div>
               <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase leading-none text-white">
                 Global_Stream_Grid
               </h1>
               <p className="text-xs md:text-sm font-medium text-slate-400 max-w-lg leading-relaxed">
                 Real-time neural broadcasts from across the VibeStream network. Connect to live frequency nodes.
               </p>
            </div>

            <div className="flex gap-4 w-full md:w-auto">
               <div className="flex-1 md:flex-none px-6 py-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col items-center justify-center min-w-[120px] hover:bg-white/10 transition-colors">
                  <span className="text-3xl font-black text-white leading-none tracking-tighter">{streams.length}</span>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Active_Signals</span>
               </div>
               <button 
                 onClick={onGoLive}
                 className="flex-1 md:flex-none px-8 py-4 bg-white text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group/btn"
               >
                 <div className="w-2 h-2 bg-rose-600 rounded-full animate-ping" />
                 INITIATE_BROADCAST
               </button>
            </div>
         </div>
      </div>

      {/* 2. Stream Grid */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="aspect-[9/16] sm:aspect-video rounded-[2.5rem] bg-slate-50 animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : streams.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {streams.map((stream, idx) => (
              <button 
                key={stream.id}
                onClick={() => onJoinStream(stream)}
                className="group relative aspect-[9/16] sm:aspect-video rounded-[2.5rem] overflow-hidden bg-slate-900 shadow-lg hover:shadow-2xl hover:shadow-indigo-900/20 transition-all duration-500 hover:scale-[1.02] cursor-pointer text-left ring-1 ring-white/10 hover:ring-indigo-500/50 animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Thumbnail Layer */}
                <img 
                  src={stream.thumbnailUrl} 
                  className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-[8s] ease-out" 
                  alt="" 
                />
                
                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent opacity-60" />

                {/* Top HUD */}
                <div className="absolute top-5 left-5 right-5 flex justify-between items-start">
                  <div className="bg-rose-600/90 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 border border-white/10">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    LIVE
                  </div>
                  <div className="bg-black/40 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-rose-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    {stream.viewerCount.toLocaleString(locale)}
                  </div>
                </div>

                {/* Bottom HUD */}
                <div className="absolute bottom-0 left-0 right-0 p-6 pt-12 bg-gradient-to-t from-slate-950 to-transparent translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative">
                       <img src={stream.authorAvatar} className="w-10 h-10 rounded-xl border-2 border-white/20 object-cover" alt="" />
                       <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest truncate mb-0.5">{stream.authorName}</p>
                      <h3 className="text-sm font-bold text-white leading-tight truncate tracking-tight group-hover:text-indigo-300 transition-colors">{stream.title || 'Untitled Signal'}</h3>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                    <span className="px-2 py-1 bg-white/10 backdrop-blur-sm rounded-md text-[7px] font-black text-slate-300 uppercase tracking-widest border border-white/5">
                      #{stream.category || 'Global'}
                    </span>
                    <span className="px-2 py-1 bg-white/10 backdrop-blur-sm rounded-md text-[7px] font-black text-slate-300 uppercase tracking-widest border border-white/5">
                      HQ_SYNC
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="py-40 flex flex-col items-center justify-center text-center opacity-60 bg-slate-50/50 rounded-[4rem] border border-dashed border-slate-200">
             <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mb-8 text-slate-300 shadow-sm border border-slate-100 relative overflow-hidden group">
                <div className="absolute inset-0 bg-slate-100/50 scale-0 group-hover:scale-100 rounded-[2.5rem] transition-transform duration-500" />
                <div className="relative z-10 scale-110">
                   <ICONS.Streams />
                </div>
             </div>
             <h3 className="text-2xl font-black text-slate-900 uppercase tracking-widest italic leading-none">Grid_Silence</h3>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mt-3 max-w-sm leading-relaxed">
               No active signal transmissions detected in this sector.
             </p>
             <button 
               onClick={onGoLive}
               className="mt-10 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-[0.3em] shadow-xl hover:bg-indigo-700 transition-all active:scale-95"
             >
               Initialize_First_Node
             </button>
          </div>
        )}
      </div>
    </div>
  );
};
