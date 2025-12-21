
import React, { useState, useMemo } from 'react';
import { Post, User, Region, LiveStream } from '../../types';
import { StoriesStrip } from './StoriesStrip';
import { CreateSignalBox } from './CreateSignalBox';
import { FeedProtocols } from './FeedProtocols';
import { PostCard } from './PostCard';

interface FeedPageProps {
  posts: Post[];
  userData: User | null;
  onLike: (id: string) => void;
  onOpenCreate: () => void;
  onTransmitStory: (file: File) => void;
  onGoLive: () => void;
  onJoinStream: (stream: LiveStream) => void;
  locale: Region;
}

export const FeedPage: React.FC<FeedPageProps> = ({ 
  posts, 
  userData, 
  onLike, 
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
      case 'pulse':
        return result.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      case 'recent':
        return result; 
      case 'mesh':
      default:
        return result;
    }
  }, [posts, activeProtocol]);

  return (
    <div className="space-y-10 md:space-y-14 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      {/* 1. Neural Sync Hub (Stories & Live Streams) */}
      <section>
        <StoriesStrip 
          userData={userData} 
          onTransmit={onTransmitStory} 
          onGoLive={onGoLive} 
          onJoinStream={onJoinStream} 
        />
      </section>

      {/* 2. Primary Signal Ingress (Create Box) */}
      <section className="max-w-3xl mx-auto w-full">
        <CreateSignalBox userData={userData} onOpen={onOpenCreate} />
      </section>

      {/* 3. Feed Navigation & Filters */}
      <section className="max-w-3xl mx-auto w-full">
        <FeedProtocols active={activeProtocol} onChange={setActiveProtocol} />
      </section>

      {/* 4. Neural Transmission Feed */}
      <section className="max-w-3xl mx-auto w-full space-y-10">
        {filteredPosts.length > 0 ? (
          filteredPosts.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              onLike={onLike} 
              locale={locale} 
              isAuthor={userData?.id === post.authorId}
            />
          ))
        ) : (
          <div className="py-48 text-center bg-white rounded-[4rem] border-precision shadow-sm flex flex-col items-center justify-center">
             <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-10 text-slate-200 shadow-inner">
                <svg className="w-10 h-10 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             </div>
             <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] font-mono italic px-12 leading-loose max-w-sm">
               No signals detected in local buffer for {activeProtocol.toUpperCase()}. Synchronise your neural mesh to establish data flow.
             </p>
             <button 
               onClick={onOpenCreate}
               className="mt-12 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all active:scale-95 italic"
             >
               Broadcast_First_Signal
             </button>
          </div>
        )}
      </section>
    </div>
  );
};
