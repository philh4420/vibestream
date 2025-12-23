
import React, { useState, useMemo } from 'react';
import { Post, User, Region, LiveStream } from '../../types';
import { StoriesStrip } from './StoriesStrip';
import { CreateSignalBox } from './CreateSignalBox';
import { FeedProtocols } from './FeedProtocols';
import { PostCard } from './PostCard';
import { ICONS } from '../../constants';

interface FeedPageProps {
  posts: Post[];
  userData: User | null;
  onLike: (id: string) => void;
  onViewPost: (post: Post) => void;
  onOpenCreate: (initialFiles?: File[]) => void;
  onTransmitStory: (file: File) => void;
  onGoLive: () => void;
  onJoinStream: (stream: LiveStream) => void;
  locale: Region;
}

export const FeedPage: React.FC<FeedPageProps> = ({ 
  posts, 
  userData, 
  onLike, 
  onViewPost,
  onOpenCreate,
  onTransmitStory,
  onGoLive,
  onJoinStream,
  locale 
}) => {
  const [activeProtocol, setActiveProtocol] = useState<'mesh' | 'pulse' | 'recent'>('mesh');

  const filteredPosts = useMemo(() => {
    let result = [...posts];
    switch (activeProtocol) {
      case 'pulse': return result.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      case 'recent': return result; 
      case 'mesh':
      default: return result;
    }
  }, [posts, activeProtocol]);

  return (
    <div className="relative min-h-screen pb-24">
      {/* Atmospheric Underlay */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-900/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* 1. Live Grid & Temporal Strip */}
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 pt-2">
        <div className="flex items-center justify-between mb-4 px-2">
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
              <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono">Live_Signal_Grid</h2>
           </div>
           <span className="text-[8px] font-black text-indigo-300 font-mono bg-indigo-50/50 px-2 py-0.5 rounded border border-indigo-50">SYNC_OK</span>
        </div>
        <StoriesStrip 
          userData={userData} 
          onTransmit={onTransmitStory} 
          onGoLive={onGoLive} 
          onJoinStream={onJoinStream} 
        />
      </section>

      {/* 2. Signal Initialization Node (Composer) */}
      <section className="max-w-3xl mx-auto w-full mt-8 md:mt-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <CreateSignalBox 
          userData={userData} 
          onOpen={() => onOpenCreate()} 
          onFileSelect={(file) => onOpenCreate([file])} 
        />
      </section>

      {/* 3. Sticky Protocol Layer (Filters) */}
      <section className="sticky top-[calc(var(--header-h)-1px)] z-30 pt-8 pb-6 -mx-4 px-4 md:mx-0 md:px-0 max-w-3xl mx-auto w-full">
        <div className="absolute inset-0 bg-[#fcfcfd]/80 backdrop-blur-xl border-b border-slate-100/50 -mx-4 md:-mx-10 md:rounded-b-[2rem] shadow-sm mask-linear-fade" style={{ clipPath: 'inset(0 -100vmax 0 -100vmax)' }} />
        <div className="relative z-10">
           <FeedProtocols active={activeProtocol} onChange={setActiveProtocol} />
        </div>
      </section>

      {/* 4. Transmission Stream */}
      <section className="max-w-3xl mx-auto w-full space-y-8 min-h-[400px]">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post, idx) => (
            <div key={post.id} className="animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: `${idx * 50}ms` }}>
              <PostCard 
                post={post} 
                onLike={onLike} 
                onViewPost={onViewPost}
                locale={locale} 
                isAuthor={userData?.id === post.authorId}
                userData={userData}
                addToast={(msg, type) => {
                   window.dispatchEvent(new CustomEvent('vibe-toast', { detail: { msg, type } }));
                }}
              />
            </div>
          ))
        ) : (
          <div className="py-32 md:py-48 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
             <div className="relative group cursor-default">
                <div className="absolute inset-0 bg-slate-100 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="w-28 h-28 bg-white border border-slate-100 rounded-[2.5rem] flex items-center justify-center mb-8 text-slate-200 shadow-sm relative z-10">
                   <ICONS.Explore />
                </div>
             </div>
             
             <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-3">System_Idle</h3>
             <div className="h-px w-16 bg-slate-200 mb-3" />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono italic max-w-xs leading-loose">
               No active signals detected in this sector.<br/>
               Initiate a broadcast to wake the grid.
             </p>
             
             <button 
               onClick={() => onOpenCreate()}
               className="mt-10 px-10 py-4 bg-slate-950 text-white rounded-2xl font-black text-[9px] uppercase tracking-[0.3em] shadow-xl hover:bg-indigo-600 transition-all active:scale-95 group"
             >
               Start_Transmission
             </button>
          </div>
        )}
        
        {/* End of Stream Indicator */}
        {filteredPosts.length > 0 && (
          <div className="py-12 flex items-center justify-center gap-4 opacity-30">
             <div className="h-px w-12 bg-slate-300" />
             <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">BUFFER_END</span>
             <div className="h-px w-12 bg-slate-300" />
          </div>
        )}
      </section>
    </div>
  );
};
