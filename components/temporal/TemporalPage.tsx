
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
    <div className="w-full max-w-[2400px] mx-auto h-full flex flex-col pb-24 animate-in fade-in duration-700">
      
      {/* 1. Temporal Header */}
      <div className="px-6 py-8 flex flex-col md:flex-row md:items-end justify-between gap-8 shrink-0">
        <div className="space-y-4">
           <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full backdrop-blur-md border bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 shadow-sm">
              <div className={`p-1.5 rounded-lg ${activeMode === 'FLUX' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-amber-500/10 text-amber-500'}`}>
                 <ICONS.Temporal />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-[0.3em] font-mono ${activeMode === 'FLUX' ? 'text-indigo-600 dark:text-indigo-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {activeMode === 'FLUX' ? 'Live_Cycle' : 'Deep_Storage'}
              </span>
           </div>
           
           <div>
             <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none mb-2">
               Temporal_Grid
             </h1>
             <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
               Ephemeral data fragments. {activeMode === 'FLUX' ? 'Current broadcast stream (24h).' : 'Archived neural patterns.'}
             </p>
           </div>
        </div>

        {/* Mode Switcher */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-1.5 flex shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 w-full md:w-auto">
           <button 
             onClick={() => setActiveMode('FLUX')}
             className={`flex-1 md:flex-none px-8 py-4 rounded-[1.6rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                activeMode === 'FLUX' 
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md' 
                  : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300'
             }`}
           >
             FLUX
           </button>
           <button 
             onClick={() => setActiveMode('STASIS')}
             className={`flex-1 md:flex-none px-8 py-4 rounded-[1.6rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                activeMode === 'STASIS' 
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' 
                  : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300'
             }`}
           >
             STASIS
           </button>
        </div>
      </div>

      {/* 2. Content Matrix */}
      <div className="flex-1 px-4 md:px-6">
         {loading ? (
           <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
             {Array.from({length: 8}).map((_, i) => (
               <div key={i} className="break-inside-avoid aspect-[9/16] rounded-[2.5rem] bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700" />
             ))}
           </div>
         ) : stories.length > 0 ? (
           <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4 pb-20">
             {stories.map((story, idx) => (
               <div 
                 key={story.id}
                 onClick={() => handleOpenStory(idx)}
                 className="break-inside-avoid relative rounded-[2.5rem] overflow-hidden group cursor-pointer border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 hover:-translate-y-2 hover:z-10"
               >
                 {story.type === 'video' ? (
                   <video 
                     src={story.coverUrl} 
                     className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-700" 
                     muted 
                     loop 
                     playsInline
                     onMouseOver={e => e.currentTarget.play().catch(() => {})}
                     onMouseOut={e => e.currentTarget.pause()}
                   />
                 ) : (
                   <img src={story.coverUrl} className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-700" alt="" />
                 )}
                 
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                 
                 <div className="absolute top-4 left-4">
                    <div className={`w-2 h-2 rounded-full ${activeMode === 'FLUX' ? 'bg-indigo-500 animate-pulse shadow-[0_0_10px_#6366f1]' : 'bg-amber-500'}`} />
                 </div>

                 {story.isArchivedStream && (
                    <div className="absolute top-4 right-4 bg-rose-600/90 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest border border-white/10">
                       REC
                    </div>
                 )}

                 <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <div className="flex items-center gap-3">
                       <div className="p-0.5 bg-white/20 backdrop-blur-sm rounded-full">
                         <img src={story.authorAvatar} className="w-8 h-8 rounded-full border border-white/30" alt="" />
                       </div>
                       <div className="min-w-0">
                          <p className="text-[9px] font-black text-white uppercase tracking-widest truncate shadow-sm">{story.authorName}</p>
                          <p className="text-[8px] font-mono text-white/60">
                            {story.timestamp?.toDate ? new Date(story.timestamp.toDate()).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : 'SYNC'}
                          </p>
                       </div>
                    </div>
                 </div>
               </div>
             ))}
           </div>
         ) : (
           <div className="flex flex-col items-center justify-center py-40 opacity-60 bg-slate-50/50 dark:bg-slate-900/50 rounded-[4rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
              <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center mb-6 text-slate-300 dark:text-slate-600 shadow-sm border border-slate-100 dark:border-slate-700">
                 <ICONS.Temporal />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-widest italic">Time_Void</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] font-mono mt-3 text-slate-400 dark:text-slate-500">
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
