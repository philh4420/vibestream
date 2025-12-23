
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
    <div className="relative min-h-screen pb-32">
      {/* 1. Temporal Strip (Stories) - Clean & Native-like */}
      <section className="pt-6 pb-2 animate-in fade-in slide-in-from-top-4 duration-700">
        <StoriesStrip 
          userData={userData} 
          onTransmit={onTransmitStory} 
          onGoLive={onGoLive} 
          onJoinStream={onJoinStream} 
        />
      </section>

      {/* 2. Signal Composer */}
      <section className="max-w-2xl mx-auto w-full px-4 md:px-0 mt-6 mb-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
        <CreateSignalBox 
          userData={userData} 
          onOpen={() => onOpenCreate()} 
          onFileSelect={(file) => onOpenCreate([file])} 
        />
      </section>

      {/* 3. Sticky Protocol Interface */}
      {/* This container ensures the protocols look floating and professional while sticking */}
      <section className="sticky top-[var(--header-h)] z-30 mb-8 -mx-4 md:mx-0">
        <div className="px-4 py-4 bg-[#fcfcfd]/85 backdrop-blur-2xl border-y border-slate-200/40 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] transition-all">
           <div className="max-w-2xl mx-auto">
             <FeedProtocols active={activeProtocol} onChange={setActiveProtocol} />
           </div>
        </div>
      </section>

      {/* 4. Transmission Stream */}
      <section className="max-w-2xl mx-auto w-full px-4 md:px-0 space-y-6 min-h-[400px]">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post, idx) => (
            <div key={post.id} className="animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-backwards" style={{ animationDelay: `${idx * 50}ms` }}>
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
          <div className="py-24 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500 px-6">
             <div className="w-24 h-24 bg-white border border-slate-100 rounded-[2.5rem] flex items-center justify-center mb-6 text-slate-300 shadow-sm relative z-10">
                <ICONS.Explore />
             </div>
             
             <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-3">Signal_Void</h3>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono italic max-w-xs leading-relaxed">
               No active transmissions in this sector.
             </p>
             
             <button 
               onClick={() => onOpenCreate()}
               className="mt-8 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[9px] uppercase tracking-[0.3em] shadow-xl hover:bg-indigo-600 transition-all active:scale-95"
             >
               Initialize_Signal
             </button>
          </div>
        )}
        
        {/* End of Stream Indicator */}
        {filteredPosts.length > 0 && (
          <div className="py-12 flex flex-col items-center justify-center gap-3 opacity-40">
             <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
             <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">BUFFER_LIMIT_REACHED</span>
          </div>
        )}
      </section>
    </div>
  );
};
