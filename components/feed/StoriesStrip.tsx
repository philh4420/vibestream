import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { collection, query, where, onSnapshot, orderBy, limit } = Firestore as any;
import { User, Story, LiveStream } from '../../types';
import { ICONS } from '../../constants';

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

  useEffect(() => {
    if (!db) return;
    const yesterday = new Date(); yesterday.setHours(yesterday.getHours() - 24);
    const storyQ = query(collection(db, 'stories'), where('timestamp', '>=', yesterday), orderBy('timestamp', 'desc'), limit(20));
    const streamQ = query(collection(db, 'streams'), orderBy('startedAt', 'desc'), limit(10));
    const unsubStories = onSnapshot(storyQ, (snapshot: any) => { setStories(snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Story))); setLoading(false); });
    const unsubStreams = onSnapshot(streamQ, (snapshot: any) => { setActiveStreams(snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as LiveStream))); });
    return () => { unsubStories(); unsubStreams(); };
  }, []);

  return (
    <div className="flex gap-5 overflow-x-auto no-scrollbar pb-6 px-4 -mx-4 md:px-0 md:mx-0 snap-x scroll-smooth">
      <button 
        onClick={() => onGoLive()} 
        className="shrink-0 w-24 h-40 rounded-[2rem] bg-slate-900 border border-white/10 flex flex-col items-center justify-center group relative overflow-hidden shadow-xl active:scale-95 transition-all"
      >
         <img src={userData?.avatarUrl} className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale group-hover:opacity-50 group-hover:scale-110 group-hover:grayscale-0 transition-all duration-700" alt="" />
         <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/60 to-transparent pointer-events-none" />
         <div className="relative z-10 w-11 h-11 rounded-[1.1rem] bg-white text-slate-950 flex items-center justify-center shadow-2xl group-hover:shadow-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
           <ICONS.Create />
         </div>
         <span className="relative z-10 text-[9px] font-black uppercase text-white mt-3.5 tracking-[0.2em] font-mono group-hover:text-indigo-300 transition-colors">BROADCAST</span>
      </button>

      {stories.map(story => {
        const isArchived = story.isArchivedStream;
        return (
          <div key={story.id} className="relative shrink-0 snap-start">
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('vibe-navigate', { detail: { route: 'temporal' } }))} 
              className="w-24 h-40 rounded-[2rem] bg-slate-800 border border-slate-100 dark:border-slate-800 overflow-hidden relative group shadow-lg hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 active:scale-95 hover:-translate-y-1"
            >
               <img src={story.coverUrl} className="w-full h-full object-cover opacity-90 group-hover:scale-115 transition-transform duration-[10s] ease-out" alt="" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
               
               <div className="absolute top-3.5 left-3.5 w-9 h-9 rounded-xl border-2 border-indigo-500 p-0.5 bg-black/30 backdrop-blur-md shadow-xl group-hover:scale-110 transition-transform">
                  <img src={story.authorAvatar} className="w-full h-full rounded-lg object-cover" alt="" />
               </div>

               {isArchived && (
                 <div className="absolute top-3.5 right-3.5 bg-rose-600/90 backdrop-blur-md text-white px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest border border-rose-400/30">
                   REC
                 </div>
               )}

               <div className="absolute bottom-4 left-3.5 right-3.5 text-left">
                  <p className="text-white text-[9px] font-black uppercase tracking-tight truncate leading-tight drop-shadow-md">{story.authorName}</p>
               </div>
            </button>
          </div>
        );
      })}

      {loading && Array.from({length: 6}).map((_, i) => (
        <div key={i} className="shrink-0 w-24 h-40 rounded-[2rem] bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700" />
      ))}
    </div>
  );
};