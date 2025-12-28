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
    let result = posts.filter(p => !blockedIds?.has(p.authorId));
    switch (activeProtocol) {
      case 'pulse': return result.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      case 'recent': return [...result].sort((a, b) => {
          const tA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
          const tB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
          return tB - tA;
      }); 
      case 'mesh':
      default: return result;
    }
  }, [posts, activeProtocol, blockedIds]);

  return (
    <div className="relative min-h-screen pb-32 w-full max-w-5xl mx-auto space-y-10">
      {/* Dynamic Grid Background Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.07] z-0 overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '48px 48px' }} />
      </div>

      <div className="relative z-10 space-y-10">
        {/* Temporal Fragment Zone */}
        <section className="animate-in fade-in slide-in-from-top-6 duration-1000">
          <div className="flex items-center gap-3 mb-4 px-4 md:px-0">
             <div className="w-1 h-4 bg-indigo-500 rounded-full" />
             <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500 font-mono">Temporal_Fragments</h2>
          </div>
          <StoriesStrip 
            userData={userData} 
            onTransmit={onTransmitStory} 
            onGoLive={onGoLive} 
            onJoinStream={onJoinStream} 
          />
        </section>

        {/* Sonic Resonance Zone */}
        <section className="animate-in fade-in slide-in-from-right-6 duration-1000 delay-150">
           <SonicEchoStrip userData={userData} />
        </section>

        {/* Signal Creation Interface */}
        <section className="px-2 md:px-0 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
          <CreateSignalBox 
            userData={userData} 
            onOpen={() => onOpenCreate()} 
            onFileSelect={(file) => onOpenCreate([file])} 
          />
        </section>

        {/* Protocol Control Center */}
        <section className="sticky top-[calc(var(--header-h)+0.5rem)] z-[100] px-2 md:px-0 transition-all duration-500">
          <div className="p-1.5 bg-white/80 dark:bg-slate-900/90 backdrop-blur-3xl rounded-[2.8rem] border border-slate-200/50 dark:border-white/10 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)]">
             <FeedProtocols active={activeProtocol} onChange={setActiveProtocol} />
          </div>
        </section>

        {/* Transmission Stream */}
        <section className="space-y-8 min-h-[600px] px-2 md:px-0 pb-20">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post, idx) => (
              <div 
                key={post.id} 
                className="animate-in fade-in slide-in-from-bottom-12 duration-1000 fill-mode-backwards" 
                style={{ animationDelay: `${idx * 80}ms` }}
              >
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
            <div className="py-40 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-700 bg-white/40 dark:bg-slate-900/20 rounded-[4rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
               <div className="w-32 h-32 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] flex items-center justify-center mb-8 text-slate-200 dark:text-slate-700 shadow-inner relative group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="scale-150"><ICONS.Explore /></div>
               </div>
               <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none mb-4">Signal_Stagnation</h3>
               <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.5em] font-mono italic max-w-sm leading-loose">
                 Deciphering local frequency... No active broadcasts found in this protocol sector.
               </p>
               <button 
                  onClick={() => onOpenCreate()}
                  className="mt-10 px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95"
               >
                  INITIALIZE_UPLINK
               </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};