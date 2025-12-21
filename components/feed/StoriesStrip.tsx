
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { User, Story } from '../../types';

interface StoriesStripProps {
  userData: User | null;
  onTransmit: (file: File) => void;
  onGoLive: () => void;
}

export const StoriesStrip: React.FC<StoriesStripProps> = ({ userData, onTransmit, onGoLive }) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!db) return;

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onTransmit(file);
      e.target.value = '';
    }
    setShowOptions(false);
  };

  return (
    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
      {/* 1. Universal Transmit Hub */}
      <div className="relative shrink-0">
        <button 
          onClick={() => setShowOptions(!showOptions)}
          className="flex-shrink-0 w-32 h-44 md:w-40 md:h-56 rounded-[2.5rem] bg-white border border-slate-100 overflow-hidden relative group shadow-sm transition-all hover:shadow-xl hover:border-indigo-100 touch-active"
        >
          <img 
            src={userData?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=neutral`} 
            className="w-full h-2/3 object-cover opacity-80 group-hover:scale-110 transition-transform duration-700" 
            alt="" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
          <div className="absolute bottom-5 left-0 right-0 flex flex-col items-center">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-2 shadow-lg ring-4 ring-white transition-all duration-300 ${showOptions ? 'bg-indigo-600 rotate-45' : 'bg-slate-900 group-hover:bg-indigo-600'}`}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4.5v15m7.5-7.5h-15" strokeWidth="2.5" strokeLinecap="round" /></svg>
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-900 font-mono italic">Transmit</span>
          </div>
        </button>

        {showOptions && (
          <>
            <div className="fixed inset-0 z-[100]" onClick={() => setShowOptions(false)}></div>
            <div className="absolute left-0 bottom-[calc(100%+12px)] w-48 bg-white rounded-3xl shadow-2xl border border-slate-100 z-[110] overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
               <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-all text-left group"
               >
                 <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Fragment</span>
               </button>
               <button 
                  onClick={() => { onGoLive(); setShowOptions(false); }}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-rose-50 transition-all text-left border-t border-slate-50 group"
               >
                 <div className="p-2 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-110 transition-transform">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">Go Live</span>
               </button>
            </div>
          </>
        )}
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
      </div>

      {/* 2. Real-Time Peer Fragments */}
      {loading ? (
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
            <div className="absolute bottom-5 left-5 right-5 text-left">
               <p className="text-white text-[11px] font-black uppercase tracking-widest truncate italic">{story.authorName}</p>
               <div className="flex items-center gap-1.5 mt-1.5">
                 <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                 <span className="text-[7px] font-black text-emerald-400 uppercase tracking-widest font-mono">Synced</span>
               </div>
            </div>
          </button>
        ))
      )}

      {!loading && stories.length === 0 && (
        <div className="flex-shrink-0 flex flex-col items-center justify-center w-32 h-44 md:w-40 md:h-56 rounded-[2.5rem] bg-slate-50 border border-dashed border-slate-200 p-6 text-center">
           <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest font-mono italic">No Active Peer Signals Detected</p>
        </div>
      )}
    </div>
  );
};
