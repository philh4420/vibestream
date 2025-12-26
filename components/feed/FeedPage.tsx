
import React, { useState, useMemo } from 'react';
import { Post, User, Region, LiveStream } from '../../types';
import { StoriesStrip } from './StoriesStrip';
import { SonicEchoStrip } from '../echoes/SonicEchoStrip';
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
  blockedIds?: Set<string>;
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
  locale,
  blockedIds
}) => {
  const [activeProtocol, setActiveProtocol] = useState<'mesh' | 'pulse' | 'recent'>('mesh');

  const filteredPosts = useMemo(() => {
    // Also filter here just in case parent didn't
    let result = posts.filter(p => !blockedIds?.has(p.authorId));
    switch (activeProtocol) {
      case 'pulse': return result.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      case 'recent': return result; 
      case 'mesh':
      default: return result;
    }
  }, [posts, activeProtocol, blockedIds]);

  return (
    <div className="relative min-h-screen pb-32 w-full max-w-2xl mx-auto">
      <section className="pt-2 pb-2 animate-in fade-in slide-in-from-top-4 duration-700">
        <StoriesStrip 
          userData={userData} 
          onTransmit={onTransmitStory} 
          onGoLive={onGoLive} 
          onJoinStream={onJoinStream} 
        />
      </section>

      <section className="mb-4 animate-in fade-in slide-in-from-right-4 duration-700 delay-100">
         <SonicEchoStrip userData={userData} />
      </section>

      <section className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
        <CreateSignalBox 
          userData={userData} 
          onOpen={() => onOpenCreate()} 
          onFileSelect={(file) => onOpenCreate([file])} 
        />
      </section>

      <section className="sticky top-[calc(var(--header-h)+1rem)] z-30 mb-8">
        <div className="py-2 bg-[#fcfcfd]/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[2.5rem] border border-white/50 dark:border-white/10 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] transition-all">
           <FeedProtocols active={activeProtocol} onChange={setActiveProtocol} />
        </div>
      </section>

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
                addToast={(msg, type) => window.dispatchEvent(new CustomEvent('vibe-toast', { detail: { msg, type } }))}
                blockedIds={blockedIds}
              />
            </div>
          ))
        ) : (
          <div className="py-24 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500 px-6">
             <div className="w-24 h-24 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] flex items-center justify-center mb-6 text-slate-300 dark:text-slate-600 shadow-sm relative z-10">
                <ICONS.Explore />
             </div>
             <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none mb-3">Signal_Void</h3>
             <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] font-mono italic max-w-xs leading-relaxed">No active transmissions.</p>
          </div>
        )}
      </section>
    </div>
  );
};
