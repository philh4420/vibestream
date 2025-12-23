
import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { collection, query, where, onSnapshot, orderBy, limit } = Firestore as any;
import { Story, User, Region } from '../../types';
import { ICONS } from '../../constants';
import { TemporalViewer } from './TemporalViewer';

interface TemporalPageProps {
  currentUser: User | null;
  locale: Region;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const TemporalPage: React.FC<TemporalPageProps> = ({ currentUser, locale, addToast }) => {
  const [activeMode, setActiveMode] = useState<'FLUX' | 'STASIS'>('FLUX');
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!db) return;
    setLoading(true);

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // FLUX: Stories from last 24h
    // STASIS: Older stories (Simulation of archive)
    const storyQ = activeMode === 'FLUX' 
      ? query(collection(db, 'stories'), where('timestamp', '>=', yesterday), orderBy('timestamp', 'desc'), limit(50))
      : query(collection(db, 'stories'), where('timestamp', '<', yesterday), orderBy('timestamp', 'desc'), limit(20));

    const unsub = onSnapshot(storyQ, (snapshot: any) => {
      setStories(snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Story)));
      setLoading(false);
    });

    return () => unsub();
  }, [activeMode]);

  const handleOpenStory = (index: number) => {
    setSelectedStoryIndex(index);
  };

  return (
    <div className="relative w-full h-full flex flex-col pb-20">
      
      {/* 1. Temporal Header */}
      <div className="px-6 py-6 flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-xl backdrop-blur-md border ${activeMode === 'FLUX' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
                 <ICONS.Temporal />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-[0.4em] font-mono ${activeMode === 'FLUX' ? 'text-indigo-500' : 'text-amber-500'}`}>
                {activeMode === 'FLUX' ? 'Live_Cycle' : 'Deep_Storage'}
              </span>
           </div>
           <h1 className="text-4xl md:text-6xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
             Temporal_Grid
           </h1>
        </div>

        {/* Mode Switcher */}
        <div className="bg-white rounded-[2rem] p-1.5 flex shadow-sm border border-slate-200">
           <button 
             onClick={() => setActiveMode('FLUX')}
             className={`px-8 py-3 rounded-[1.6rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeMode === 'FLUX' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
           >
             FLUX
           </button>
           <button 
             onClick={() => setActiveMode('STASIS')}
             className={`px-8 py-3 rounded-[1.6rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeMode === 'STASIS' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
           >
             STASIS
           </button>
        </div>
      </div>

      {/* 2. Content Matrix */}
      <div className="flex-1 overflow-y-auto no-scrollbar scroll-container px-4 md:px-6">
         {loading ? (
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
             {Array.from({length: 8}).map((_, i) => (
               <div key={i} className="aspect-[9/16] rounded-[2.5rem] bg-slate-100 animate-pulse border border-slate-200" />
             ))}
           </div>
         ) : stories.length > 0 ? (
           <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4 pb-20">
             {stories.map((story, idx) => (
               <div 
                 key={story.id}
                 onClick={() => handleOpenStory(idx)}
                 className="break-inside-avoid relative rounded-[2.5rem] overflow-hidden group cursor-pointer border border-slate-100 bg-slate-900 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:z-10"
               >
                 <img src={story.coverUrl} className="w-full h-auto object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700" alt="" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                 
                 <div className="absolute top-4 left-4">
                    <div className={`w-2 h-2 rounded-full ${activeMode === 'FLUX' ? 'bg-indigo-500 animate-pulse shadow-[0_0_10px_#6366f1]' : 'bg-amber-500'}`} />
                 </div>

                 <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <div className="flex items-center gap-3">
                       <img src={story.authorAvatar} className="w-8 h-8 rounded-full border border-white/30" alt="" />
                       <div className="min-w-0">
                          <p className="text-[9px] font-black text-white uppercase tracking-widest truncate">{story.authorName}</p>
                          <p className="text-[8px] font-mono text-white/50">
                            {story.timestamp?.toDate ? new Date(story.timestamp.toDate()).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : 'SYNC'}
                          </p>
                       </div>
                    </div>
                 </div>
               </div>
             ))}
           </div>
         ) : (
           <div className="flex flex-col items-center justify-center py-40 opacity-50 bg-slate-50/50 rounded-[4rem] border-2 border-dashed border-slate-200">
              <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mb-6 text-slate-300 shadow-sm">
                 <ICONS.Temporal />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest italic">Time_Void</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] font-mono mt-3 text-slate-400">
                {activeMode === 'FLUX' ? 'No active fragments in current cycle.' : 'Archive banks are empty.'}
              </p>
           </div>
         )}
      </div>

      {/* 3. Immersive Viewer Overlay */}
      {selectedStoryIndex !== null && currentUser && (
        <TemporalViewer 
          stories={stories}
          initialIndex={selectedStoryIndex}
          currentUser={currentUser}
          onClose={() => setSelectedStoryIndex(null)}
        />
      )}

    </div>
  );
};
