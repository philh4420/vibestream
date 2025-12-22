
import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
// Fixed: Using namespaced import for firebase/firestore to resolve "no exported member" errors
import * as Firestore from 'firebase/firestore';
const { collection, query, onSnapshot, orderBy, limit } = Firestore as any;
import { LiveStream, Region } from '../../types';

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
    <div className="animate-in fade-in duration-700 space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Stream_Grid</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mt-3">Live Neural Transmissions • Active_Nodes: {streams.length}</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
           <div className="px-5 py-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest font-mono">Status: All_Nodes_Nominal</span>
           </div>
           
           <button 
             onClick={onGoLive}
             className="px-6 py-3 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-100 hover:bg-rose-700 transition-all active:scale-95 flex items-center gap-3 group"
           >
              <div className="group-hover:rotate-12 transition-transform duration-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </div>
              Start_Broadcast
           </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="aspect-video rounded-[3rem] bg-slate-100 animate-pulse border border-slate-50" />
          ))}
        </div>
      ) : streams.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {streams.map(stream => (
            <button 
              key={stream.id}
              onClick={() => onJoinStream(stream)}
              className="group relative aspect-video rounded-[3rem] overflow-hidden bg-slate-900 shadow-xl transition-all hover:shadow-2xl hover:scale-[1.02] touch-active text-left"
            >
              <img 
                src={stream.thumbnailUrl} 
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-[4s]" 
                alt="" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              
              <div className="absolute top-6 left-6 flex items-center gap-3">
                <div className="bg-rose-600 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  Live
                </div>
                <div className="bg-black/40 backdrop-blur-md text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/10">
                  {stream.viewerCount.toLocaleString(locale)} Nodes
                </div>
              </div>

              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center gap-4 mb-3">
                  <img src={stream.authorAvatar} className="w-10 h-10 rounded-xl border border-white/20 object-cover" alt="" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest truncate">{stream.authorName}</p>
                    <h3 className="text-lg font-black text-white leading-none truncate tracking-tight">{stream.title}</h3>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-lg text-[8px] font-black text-white/80 uppercase tracking-widest border border-white/5">
                    #{stream.category}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="py-40 text-center bg-white rounded-[4rem] border border-slate-100 shadow-sm flex flex-col items-center">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-8 text-slate-200">
             <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Grid_Darkness</h2>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mt-3 px-10">No active signal transmissions detected in local cluster. Be the first to broadcast.</p>
          <button 
             onClick={onGoLive}
             className="mt-10 px-12 py-5 bg-rose-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-rose-700 transition-all active:scale-95 italic"
          >
             INITIATE_FIRST_TRANSMISSION
          </button>
        </div>
      )}
    </div>
  );
};
