
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/firebase';
// Fixed: Using namespaced import for firebase/firestore to resolve "no exported member" errors
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

    const unsubStories = onSnapshot(storyQ, (snapshot: any) => {
      setStories(snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Story)));
      setLoading(false);
    });

    const unsubStreams = onSnapshot(streamQ, (snapshot: any) => {
      setActiveStreams(snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as LiveStream)));
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

  const handleViewStory = (story: Story) => {
    // Currently FeedPage doesn't have a way to open the TemporalViewer directly from here easily 
    // without lifting state up or using an event. For now, we'll dispatch an event similar to toasts.
    // However, since TemporalViewer is page-specific in this architecture, 
    // a simple navigation to the Temporal Page is a robust fallback for the MVP.
    // Or we could trigger a custom event that App.tsx listens to, but App doesn't render TemporalViewer.
    // The Temporal Page is where the viewer lives.
    
    // Dispatching event for 'vibe-view-story' which could be caught if implemented globally, 
    // but standard behavior here: navigate to Temporal route.
    const event = new CustomEvent('vibe-navigate', { detail: { route: 'temporal' } });
    window.dispatchEvent(event);
  };

  return (
    <div className="relative group/strip">
      <div className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar pb-6 px-4 -mx-4 md:px-0 md:mx-0 snap-x snap-mandatory">
        
        {/* 1. Signal Injection Module (Create) */}
        <div className="relative shrink-0 snap-start">
          <button 
            onClick={() => setIsSelectionOpen(true)}
            className="flex flex-col justify-end w-[100px] h-[160px] md:w-[120px] md:h-[200px] rounded-[1.8rem] bg-white border border-slate-100 overflow-hidden relative group shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-500 active:scale-95"
          >
            <img 
              src={userData?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=neutral`} 
              className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-500 grayscale group-hover:grayscale-0" 
              alt="" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
            
            <div className="relative z-10 flex flex-col items-center pb-4 w-full">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white group-hover:bg-indigo-600 flex items-center justify-center shadow-lg mb-2 transition-colors duration-300 ring-4 ring-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4.5v15m7.5-7.5h-15" strokeWidth="3" strokeLinecap="round" /></svg>
              </div>
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-900 font-mono">Inject</span>
            </div>
          </button>
        </div>

        {/* 1.5 Quick Stream Setup */}
        <div className="relative shrink-0 snap-start">
          <button 
            onClick={onGoLive}
            className="flex flex-col justify-end w-[100px] h-[160px] md:w-[120px] md:h-[200px] rounded-[1.8rem] bg-slate-900 border border-slate-800 overflow-hidden relative group shadow-lg hover:shadow-rose-500/20 hover:border-rose-500/30 transition-all duration-500 active:scale-95"
          >
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-t from-rose-900/80 via-transparent to-transparent opacity-60" />
            
            <div className="relative z-10 flex flex-col items-center pb-4 w-full">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-rose-500 flex items-center justify-center shadow-lg mb-2 transition-all duration-300 group-hover:scale-110 group-hover:bg-rose-600 group-hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>
              </div>
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white font-mono group-hover:text-rose-400 transition-colors">Go_Live</span>
            </div>
          </button>
        </div>

        {/* 2. LIVE SIGNALS (Priority Highlighting) */}
        {activeStreams.map(stream => (
          <div key={stream.id} className="relative shrink-0 snap-start">
            <button 
              onClick={() => onJoinStream(stream)}
              className="w-[100px] h-[160px] md:w-[120px] md:h-[200px] rounded-[1.8rem] bg-slate-900 overflow-hidden relative group shadow-lg ring-2 ring-rose-500 ring-offset-2 ring-offset-[#fcfcfd] transition-all hover:scale-[1.02] active:scale-95"
            >
              <img 
                src={stream.thumbnailUrl} 
                className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-[5s]" 
                alt="" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-rose-950/90 via-transparent to-transparent" />
              
              <div className="absolute top-3 left-0 right-0 flex justify-center">
                <div className="bg-rose-600 text-white px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg border border-rose-400/50 animate-pulse">
                  <div className="w-1 h-1 bg-white rounded-full" />
                  LIVE
                </div>
              </div>

              <div className="absolute bottom-3 left-3 right-3 text-left">
                 <p className="text-white text-[9px] font-black uppercase tracking-tight truncate leading-none mb-1">{stream.authorName}</p>
                 <p className="text-rose-200 text-[7px] font-bold font-mono truncate opacity-80">
                   {stream.viewerCount} NODES
                 </p>
              </div>
            </button>
          </div>
        ))}

        {/* 3. Temporal Peer Fragments (Stories) */}
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="shrink-0 snap-start w-[100px] h-[160px] md:w-[120px] md:h-[200px] rounded-[1.8rem] bg-slate-100 animate-pulse border border-slate-50" />
          ))
        ) : (
          stories.map(story => (
            <div key={story.id} className="relative shrink-0 snap-start">
              <button 
                onClick={() => handleViewStory(story)}
                className="w-[100px] h-[160px] md:w-[120px] md:h-[200px] rounded-[1.8rem] bg-slate-800 overflow-hidden relative group shadow-sm hover:shadow-xl transition-all active:scale-95"
              >
                {story.type === 'video' ? (
                  <video 
                    src={story.coverUrl} 
                    className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-[5s]" 
                    muted 
                    loop 
                    playsInline // Important for iOS
                    onMouseOver={e => e.currentTarget.play().catch(() => {})}
                    onMouseOut={e => e.currentTarget.pause()}
                  />
                ) : (
                  <img 
                    src={story.coverUrl} 
                    className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-[5s]" 
                    alt="" 
                  />
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                
                <div className="absolute top-3 left-3 p-0.5 rounded-full border border-indigo-400 shadow-sm bg-black/20 backdrop-blur-sm">
                  <img src={story.authorAvatar} className="w-6 h-6 rounded-full object-cover" alt="" />
                </div>

                {story.isArchivedStream && (
                    <div className="absolute top-3 right-3 bg-rose-600 w-2 h-2 rounded-full shadow-sm" title="Archived Broadcast" />
                )}

                <div className="absolute bottom-3 left-3 right-3 text-left">
                   <p className="text-white text-[9px] font-black uppercase tracking-tight truncate leading-none mb-1">{story.authorName}</p>
                   <div className="flex items-center gap-1.5">
                     <div className="w-1 h-1 bg-emerald-400 rounded-full shadow-[0_0_5px_#34d399]" />
                     <span className="text-[7px] font-black text-emerald-400 uppercase tracking-widest font-mono">SYNC</span>
                   </div>
                </div>
              </button>
            </div>
          ))
        )}

        {/* Empty State Indicator */}
        {!loading && stories.length === 0 && activeStreams.length === 0 && (
          <div className="shrink-0 snap-start flex flex-col items-center justify-center w-[100px] h-[160px] md:w-[120px] md:h-[200px] rounded-[1.8rem] bg-slate-50 border border-dashed border-slate-200 p-4 text-center group cursor-default">
             <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center mb-3 text-slate-300 shadow-sm group-hover:scale-110 transition-transform">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2.5" strokeLinecap="round" /></svg>
             </div>
             <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest font-mono leading-relaxed">Grid_Silence<br/>Detected</p>
          </div>
        )}
      </div>

      {/* Protocol Selection Modal */}
      {isSelectionOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-transparent" onClick={() => setIsSelectionOpen(false)}></div>
          <div className="relative bg-white w-full max-w-sm rounded-[3rem] p-8 md:p-10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500 overflow-hidden border border-white/20">
             {/* Decorative Top Bar */}
             <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500" />
             
             <div className="mb-8 text-center">
               <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 text-slate-900 shadow-sm border border-slate-100">
                  <ICONS.Create />
               </div>
               <h3 className="text-2xl font-black text-slate-950 tracking-tighter uppercase italic mb-2">Uplink_Protocol</h3>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono">Select Transmission Type</p>
             </div>

             <div className="space-y-4">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-5 p-5 bg-slate-50 hover:bg-white hover:shadow-xl hover:border-indigo-100 rounded-[2rem] transition-all border border-transparent group active:scale-95"
                >
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-indigo-200">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z" /></svg>
                  </div>
                  <div className="text-left">
                    <p className="font-black text-slate-900 text-xs uppercase tracking-wide mb-0.5">Temporal Fragment</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest font-mono">24h Visibility • Image/Video</p>
                  </div>
                </button>

                <button 
                  onClick={() => { onGoLive(); setIsSelectionOpen(false); }}
                  className="w-full flex items-center gap-5 p-5 bg-slate-50 hover:bg-white hover:shadow-xl hover:border-rose-100 rounded-[2rem] transition-all border border-transparent group active:scale-95"
                >
                  <div className="w-12 h-12 bg-rose-600 text-white rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-rose-200">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  </div>
                  <div className="text-left">
                    <p className="font-black text-rose-600 text-xs uppercase tracking-wide mb-0.5">Live Broadcast</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest font-mono">Real-Time Grid Sync</p>
                  </div>
                </button>
             </div>
             
             <button 
               onClick={() => setIsSelectionOpen(false)}
               className="w-full mt-8 py-4 text-slate-400 hover:text-slate-900 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] transition-all active:scale-95"
             >
               Abort_Sequence
             </button>
          </div>
        </div>
      )}
      
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
    </div>
  );
};
