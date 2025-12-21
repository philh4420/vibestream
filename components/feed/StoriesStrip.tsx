
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { User, Story, LiveStream } from '../../types';

interface StoriesStripProps {
  userData: User | null;
  onTransmit: (file: File) => void;
  onGoLive: () => void;
  onJoinStream: (stream: LiveStream) => void;
}

export const StoriesStrip: React.FC<StoriesStripProps> = ({ userData, onTransmit, onGoLive, onJoinStream }) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [activeStreams, setActiveStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!db) return;

    // Fetch Temporal Fragments (Stories) from the last 24 hours
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    const storyQ = query(
      collection(db, 'stories'),
      where('timestamp', '>=', yesterday),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    // Fetch active Live Streams
    const streamQ = query(
      collection(db, 'streams'),
      orderBy('startedAt', 'desc'),
      limit(10)
    );

    const unsubStories = onSnapshot(storyQ, (snapshot) => {
      setStories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Story)));
      setLoading(false);
    });

    const unsubStreams = onSnapshot(streamQ, (snapshot) => {
      setActiveStreams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LiveStream)));
    });

    return () => {
      unsubStories();
      unsubStreams();
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onTransmit(file);
      e.target.value = '';
    }
    setIsSelectionOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex gap-5 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        
        {/* 1. Universal Transmit Hub */}
        <div className="relative shrink-0">
          <button 
            onClick={() => setIsSelectionOpen(true)}
            className="flex-shrink-0 w-32 h-44 md:w-44 md:h-60 rounded-[3rem] bg-white border border-slate-100 overflow-hidden relative group shadow-sm transition-all hover:shadow-2xl hover:border-indigo-100 active:scale-95 touch-active"
          >
            <img 
              src={userData?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=neutral`} 
              className="w-full h-2/3 object-cover opacity-80 group-hover:scale-110 transition-transform duration-700 grayscale group-hover:grayscale-0" 
              alt="" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />
            <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-950 group-hover:bg-indigo-600 flex items-center justify-center mb-3 shadow-xl ring-4 ring-white transition-all duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4.5v15m7.5-7.5h-15" strokeWidth="3" strokeLinecap="round" /></svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-950 font-mono italic">Establish</span>
            </div>
          </button>
        </div>

        {/* 2. LIVE SIGNALS (Priority Display) */}
        {activeStreams.map(stream => (
          <button 
            key={stream.id} 
            onClick={() => onJoinStream(stream)}
            className="flex-shrink-0 w-32 h-44 md:w-44 md:h-60 rounded-[3rem] bg-slate-950 overflow-hidden relative group shadow-xl ring-4 ring-rose-500/20 transition-all hover:scale-[1.03] active:scale-95 touch-active animate-in zoom-in duration-500"
          >
            <img 
              src={stream.thumbnailUrl} 
              className="w-full h-full object-cover opacity-60 transition-transform duration-[6s] group-hover:scale-125" 
              alt="" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-rose-950/90 via-transparent to-transparent" />
            
            <div className="absolute top-5 left-5">
              <div className="bg-rose-600 text-white px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.3em] flex items-center gap-2 shadow-2xl border border-rose-500/50">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-white" />
                Live
              </div>
            </div>

            <div className="absolute bottom-6 left-6 right-6 text-left">
               <div className="flex items-center gap-2 mb-1.5">
                  <p className="text-white text-[12px] font-black uppercase tracking-tight truncate italic">{stream.authorName}</p>
                  <div className="w-1 h-1 bg-white/40 rounded-full shrink-0" />
               </div>
               <div className="flex items-center gap-2">
                 <span className="text-[8px] font-black text-white/60 uppercase tracking-[0.2em] font-mono truncate italic leading-none">{stream.title}</span>
               </div>
            </div>
          </button>
        ))}

        {/* 3. Temporal Peer Fragments (Stories) */}
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="flex-shrink-0 w-32 h-44 md:w-44 md:h-60 rounded-[3rem] bg-slate-100 animate-pulse border border-slate-50" />
          ))
        ) : (
          stories.map(story => (
            <button 
              key={story.id} 
              className="flex-shrink-0 w-32 h-44 md:w-44 md:h-60 rounded-[3rem] bg-slate-900 overflow-hidden relative group shadow-sm transition-all hover:shadow-2xl active:scale-95 touch-active"
            >
              <img 
                src={story.coverUrl} 
                className="w-full h-full object-cover opacity-70 transition-transform duration-[8s] group-hover:scale-125" 
                alt="" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent" />
              <div className="absolute top-6 left-6">
                <div className="p-1 rounded-2xl border-2 border-indigo-500 shadow-2xl bg-white/20 backdrop-blur-md">
                  <img src={story.authorAvatar} className="w-10 h-10 rounded-xl object-cover" alt="" />
                </div>
              </div>
              <div className="absolute bottom-6 left-6 right-6 text-left">
                 <p className="text-white text-[12px] font-black uppercase tracking-tight truncate italic leading-none mb-2">{story.authorName}</p>
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                   <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest font-mono">Temporal_Synced</span>
                 </div>
              </div>
            </button>
          ))
        )}

        {!loading && stories.length === 0 && activeStreams.length === 0 && (
          <div className="flex-shrink-0 flex flex-col items-center justify-center w-32 h-44 md:w-44 md:h-60 rounded-[3rem] bg-slate-50 border border-dashed border-slate-200 p-8 text-center">
             <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mb-4 text-slate-300">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2.5" strokeLinecap="round" /></svg>
             </div>
             <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] font-mono italic">Awaiting_Neural_Sync</p>
          </div>
        )}
      </div>

      {/* Protocol Selection Modal (Improved 2026 UI) */}
      {isSelectionOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl" onClick={() => setIsSelectionOpen(false)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-[3.5rem] p-10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500 overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-rose-500 to-emerald-500" />
             
             <div className="mb-10 text-center">
               <h3 className="text-2xl font-black text-slate-950 tracking-tighter uppercase italic mb-2">Uplink Protocol</h3>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Establish Grid Presence</p>
             </div>

             <div className="space-y-4">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-6 p-6 bg-slate-50 hover:bg-white hover:shadow-2xl hover:border-indigo-100 rounded-[2rem] transition-all border border-transparent group active:scale-95"
                >
                  <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl shadow-indigo-100">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z" /></svg>
                  </div>
                  <div className="text-left">
                    <p className="font-black text-slate-900 text-sm uppercase tracking-tight mb-1">Temporal Fragment</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">24h Signal Visibility</p>
                  </div>
                </button>

                <button 
                  onClick={() => { onGoLive(); setIsSelectionOpen(false); }}
                  className="w-full flex items-center gap-6 p-6 bg-slate-50 hover:bg-white hover:shadow-2xl hover:border-rose-100 rounded-[2rem] transition-all border border-transparent group active:scale-95"
                >
                  <div className="w-14 h-14 bg-rose-600 text-white rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl shadow-rose-100">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </div>
                  <div className="text-left">
                    <p className="font-black text-rose-600 text-sm uppercase tracking-tight mb-1">Live Broadcast</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">High-Bandwidth Sync</p>
                  </div>
                </button>
             </div>
             
             <button 
               onClick={() => setIsSelectionOpen(false)}
               className="w-full mt-10 py-5 text-slate-400 hover:text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all active:scale-95 italic"
             >
               Discard_Selection
             </button>
          </div>
        </div>
      )}
      
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
    </div>
  );
};
