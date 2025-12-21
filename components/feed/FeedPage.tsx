
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Post, User, Region, LiveStream, SignalAudience } from '../../types';
import { StoriesStrip } from './StoriesStrip';
import { CreateSignalBox } from './CreateSignalBox';
import { FeedProtocols } from './FeedProtocols';
import { PostCard } from './PostCard';

interface FeedPageProps {
  posts: Post[];
  userData: User | null;
  onLike: (id: string, freq?: string) => void;
  onViewPost: (post: Post) => void;
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
  onViewPost,
  onOpenCreate,
  onTransmitStory,
  onGoLive,
  onJoinStream,
  locale 
}) => {
  const [activeProtocol, setActiveProtocol] = useState<'mesh' | 'pulse' | 'recent'>('mesh');
  const [frequency, setFrequency] = useState<number>(50); // 0: Private, 50: Local, 100: Global
  const feedRef = useRef<HTMLDivElement>(null);

  const activeAudience = useMemo((): SignalAudience => {
    if (frequency < 33) return 'private';
    if (frequency > 66) return 'global';
    return 'mesh';
  }, [frequency]);

  const filteredPosts = useMemo(() => {
    let result = posts.filter(p => !p.audience || p.audience === activeAudience || activeAudience === 'global');
    
    switch (activeProtocol) {
      case 'pulse': return [...result].sort((a, b) => (b.likes || 0) - (a.likes || 0));
      case 'recent': return result; 
      case 'mesh':
      default: return result;
    }
  }, [posts, activeProtocol, activeAudience]);

  // Handle Stacking Effect Logic via Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLElement;
          const ratio = entry.intersectionRatio;
          if (ratio < 1) {
            target.style.transform = `scale(${0.9 + (ratio * 0.1)}) translateY(${-(1 - ratio) * 20}px)`;
            target.style.opacity = `${0.5 + (ratio * 0.5)}`;
          } else {
            target.style.transform = 'scale(1) translateY(0)';
            target.style.opacity = '1';
          }
        });
      },
      { threshold: Array.from({ length: 100 }, (_, i) => i / 100) }
    );

    const cards = document.querySelectorAll('.stack-card');
    cards.forEach(c => observer.observe(c));
    return () => observer.disconnect();
  }, [filteredPosts]);

  return (
    <div className="space-y-10 md:space-y-14 animate-in fade-in slide-in-from-bottom-8 duration-1000 relative">
      <section>
        <StoriesStrip 
          userData={userData} 
          onTransmit={onTransmitStory} 
          onGoLive={onGoLive} 
          onJoinStream={onJoinStream} 
        />
      </section>

      <section className="max-w-3xl mx-auto w-full">
        <CreateSignalBox userData={userData} onOpen={onOpenCreate} />
      </section>

      <section className="max-w-3xl mx-auto w-full sticky top-[var(--header-h)] z-[100] py-2 bg-[#fcfcfd]/80 backdrop-blur-md">
        <FeedProtocols active={activeProtocol} onChange={setActiveProtocol} />
      </section>

      <section className="max-w-3xl mx-auto w-full space-y-10 pb-32">
        {filteredPosts.length > 0 ? (
          filteredPosts.map(post => (
            <div key={post.id} className="snap-signal">
              <div className="stack-card w-full">
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
            </div>
          ))
        ) : (
          <div className="py-48 text-center bg-white rounded-[4rem] border-precision shadow-sm flex flex-col items-center justify-center">
             <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-10 text-slate-200 shadow-inner">
                <svg className="w-10 h-10 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             </div>
             <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] font-mono italic px-12 leading-loose max-w-sm">No signals in this frequency.</p>
          </div>
        )}
      </section>

      {/* Frequency Tuner - Fixed UI Component */}
      <div className="fixed bottom-[var(--bottom-nav-h)] left-1/2 -translate-x-1/2 w-full max-w-md px-6 z-[400] pb-6">
        <div className="glass-panel p-4 rounded-[2rem] border-precision shadow-[0_30px_60px_-12px_rgba(0,0,0,0.2)] flex flex-col gap-3">
          <div className="flex justify-between items-center px-2">
            <span className={`text-[8px] font-black uppercase tracking-widest font-mono transition-colors ${activeAudience === 'private' ? 'text-indigo-600' : 'text-slate-300'}`}>Private_Mesh</span>
            <span className={`text-[8px] font-black uppercase tracking-widest font-mono transition-colors ${activeAudience === 'mesh' ? 'text-emerald-600' : 'text-slate-300'}`}>Local_Node</span>
            <span className={`text-[8px] font-black uppercase tracking-widest font-mono transition-colors ${activeAudience === 'global' ? 'text-rose-600' : 'text-slate-300'}`}>Global_Spec</span>
          </div>
          <div className="relative h-10 bg-slate-100/50 rounded-2xl flex items-center px-1">
            <input 
              type="range" min="0" max="100" step="50"
              value={frequency}
              onChange={(e) => setFrequency(parseInt(e.target.value))}
              className="w-full h-full opacity-0 absolute inset-0 z-10 cursor-pointer"
            />
            <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden absolute left-0 px-4 pointer-events-none">
              <div className={`h-full transition-all duration-500 ${activeAudience === 'private' ? 'bg-indigo-500 w-0' : activeAudience === 'mesh' ? 'bg-emerald-500 w-1/2' : 'bg-rose-500 w-full'}`} />
            </div>
            <div 
              className={`w-8 h-8 rounded-xl shadow-xl border-2 border-white transition-all duration-300 pointer-events-none flex items-center justify-center ${activeAudience === 'private' ? 'bg-indigo-600 translate-x-0' : activeAudience === 'mesh' ? 'bg-emerald-600 left-1/2 -translate-x-4' : 'bg-rose-600 right-1 translate-x-0 ml-auto'}`}
              style={{ position: 'relative' }}
            >
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
