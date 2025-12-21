
import React, { useState, useMemo } from 'react';
import { Post, User, Region } from '../../types';
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
  locale: Region;
}

export const FeedPage: React.FC<FeedPageProps> = ({ 
  posts, 
  userData, 
  onLike, 
  onOpenCreate,
  onTransmitStory,
  locale 
}) => {
  const [activeProtocol, setActiveProtocol] = useState<'mesh' | 'pulse' | 'recent'>('mesh');

  const filteredPosts = useMemo(() => {
    let result = [...posts];
    
    switch (activeProtocol) {
      case 'pulse':
        // Sort by likes descending
        return result.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      case 'recent':
        // Already sorted by timestamp desc from App.tsx, but ensuring it here
        return result; 
      case 'mesh':
      default:
        // In a real app, this would filter by followed users. 
        // For now, we show the main feed as the 'Neural Mesh'.
        return result;
    }
  }, [posts, activeProtocol]);

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* 1. Temporal Fragments (Stories) */}
      <StoriesStrip userData={userData} onTransmit={onTransmitStory} />

      {/* 2. Primary Signal Ingress (Create Box) */}
      <CreateSignalBox userData={userData} onOpen={onOpenCreate} />

      {/* 3. Feed Navigation & Filters */}
      <FeedProtocols active={activeProtocol} onChange={setActiveProtocol} />

      {/* 4. Neural Transmission Feed */}
      <div className="space-y-6">
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
          <div className="py-32 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm">
             <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-200">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono italic px-10">
               No signals detected in local buffer for {activeProtocol.toUpperCase()}. Synchronise your neural mesh to establish data flow.
             </p>
          </div>
        )}
      </div>
    </div>
  );
};
