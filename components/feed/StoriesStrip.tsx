
import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { User, Story } from '../../types';

interface StoriesStripProps {
  userData: User | null;
}

export const StoriesStrip: React.FC<StoriesStripProps> = ({ userData }) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;

    // Fetch stories from the last 24 hours
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    const q = query(
      collection(db, 'stories'),
      where('timestamp', '>=', yesterday),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const storyData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Story));
      setStories(storyData);
      setLoading(false);
    }, (error) => {
      console.error("Story Stream Interrupted:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
      {/* 1. Self Signal Capture Trigger */}
      <button className="flex-shrink-0 w-32 h-44 md:w-40 md:h-56 rounded-[2.5rem] bg-white border border-slate-100 overflow-hidden relative group shadow-sm transition-all hover:shadow-xl hover:border-indigo-100 touch-active">
        <img 
          src={userData?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=neutral`} 
          className="w-full h-2/3 object-cover opacity-80 group-hover:scale-110 transition-transform duration-700" 
          alt="" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
        <div className="absolute bottom-5 left-0 right-0 flex flex-col items-center">
          <div className="w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center mb-2 shadow-lg ring-4 ring-white group-hover:bg-indigo-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4.5v15m7.5-7.5h-15" strokeWidth="2.5" strokeLinecap="round" /></svg>
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-900 font-mono italic">Transmit</span>
        </div>
      </button>

      {/* 2. Real-Time Peer Fragments */}
      {loading ? (
        // Skeleton Loaders
        [1, 2, 3].map(i => (
          <div key={i} className="flex-shrink-0 w-32 h-44 md:w-40 md:h-56 rounded-[2.5rem] bg-slate-100 animate-pulse border border-slate-50" />
        ))
      ) : (
        stories.map(story => (
          <button 
            key={story.id} 
            className="flex-shrink-0 w-32 h-44 md:w-40 md:h-56 rounded-[2.5rem] bg-slate-900 overflow-hidden relative group shadow-sm transition-all hover:shadow-2xl active:scale-95 touch-active"
          >
            <img 
              src={story.coverUrl} 
              className="w-full h-full object-cover opacity-60 transition-transform duration-[4s] group-hover:scale-125" 
              alt="" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
            
            <div className="absolute top-5 left-5">
              <div className="p-0.5 rounded-2xl border-2 border-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.4)] bg-white/10 backdrop-blur-md">
                <img src={story.authorAvatar} className="w-9 h-9 rounded-xl object-cover" alt="" />
              </div>
            </div>
            
            <div className="absolute bottom-5 left-5 right-5">
               <p className="text-white text-[11px] font-black uppercase tracking-widest truncate italic">{story.authorName}</p>
               <div className="flex items-center gap-1.5 mt-1.5">
                 <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                 <span className="text-[7px] font-black text-emerald-400 uppercase tracking-widest font-mono">Synced</span>
               </div>
            </div>
          </button>
        ))
      )}

      {/* Empty Mesh State */}
      {!loading && stories.length === 0 && (
        <div className="flex-shrink-0 flex flex-col items-center justify-center w-32 h-44 md:w-40 md:h-56 rounded-[2.5rem] bg-slate-50 border border-dashed border-slate-200 p-6 text-center">
           <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest font-mono italic">No Active Peer Signals Detected</p>
        </div>
      )}
    </div>
  );
};
