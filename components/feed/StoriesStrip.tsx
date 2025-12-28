
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
    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6 px-4 -mx-4 md:px-0 md:mx-0 snap-x">
      <button onClick={() => onGoLive()} className="shrink-0 w-24 h-40 rounded-[1.8rem] bg-slate-900 border border-white/10 flex flex-col items-center justify-center group relative overflow-hidden">
         <img src={userData?.avatarUrl} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" alt="" />
         <div className="relative z-10 w-10 h-10 rounded-xl bg-white text-slate-900 flex items-center justify-center shadow-xl"><ICONS.Create /></div>
         <span className="relative z-10 text-[8px] font-black uppercase text-white mt-3 tracking-widest font-mono">BROADCAST</span>
      </button>

      {stories.map(story => {
        // Fallback or explicit check for author's border if available in story doc
        // For standard story author avatars in the list:
        return (
          <div key={story.id} className="relative shrink-0 snap-start">
            <button onClick={() => window.dispatchEvent(new CustomEvent('vibe-navigate', { detail: { route: 'temporal' } }))} className="w-24 h-40 rounded-[1.8rem] bg-slate-800 border border-slate-100 dark:border-slate-800 overflow-hidden relative group shadow-sm hover:shadow-xl transition-all">
               <img src={story.coverUrl} className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-500" alt="" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
               <div className="absolute top-3 left-3 w-8 h-8 rounded-full border-2 border-indigo-500 p-0.5 bg-black/20 backdrop-blur-sm">
                  <img src={story.authorAvatar} className="w-full h-full rounded-full object-cover" alt="" />
               </div>
               <div className="absolute bottom-3 left-3 right-3 text-left">
                  <p className="text-white text-[9px] font-black uppercase tracking-tight truncate leading-none">{story.authorName}</p>
               </div>
            </button>
          </div>
        );
      })}
    </div>
  );
};
