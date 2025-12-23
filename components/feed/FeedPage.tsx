
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
  onBookmark: (id: string) => void;
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
  onBookmark,
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
    <div className="relative min-h-screen pb-32 w-full max-w-2xl mx-auto">
      
      {/* 1. Temporal Strip (Stories) */}
      <section className="pt-2 pb-6 animate-in fade-in slide-in-from-top-4 duration-700">
        <StoriesStrip 
          userData={userData} 
          onTransmit={onTransmitStory} 
          onGoLive={onGoLive} 
          onJoinStream={onJoinStream} 
        />
      </section>

      {/* 2. Signal Composer */}
      <section className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
        <CreateSignalBox 
          userData={userData} 
          onOpen={() => onOpenCreate()} 
          onFileSelect={(file) => onOpenCreate([file])} 
        />
      </section>

      {/* 3. Sticky Protocol Interface */}
      <section className="sticky top-[calc(var(--header-h)+1rem)] z-30 mb-8">
        <div className="py-2 bg-[#fcfcfd]/90 backdrop-blur-xl rounded-[2.5rem] border border-white/50 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] transition-all">
           <FeedProtocols active={activeProtocol} onChange={setActiveProtocol} />
        </div>
      </section>

      {/* 4. Transmission Stream */}
      <section className="space-y-6 min-h-[400px]">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post, idx) => (
            <div key={post.id} className="animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-backwards" style={{ animationDelay: `${idx * 50}ms` }}>
              <PostCard 
                post={post} 
                onLike={onLike} 
                onBookmark={onBookmark}
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
