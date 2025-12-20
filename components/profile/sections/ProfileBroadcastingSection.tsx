
import React from 'react';
import { Post, User, Region } from '../../../types';
import { PostCard } from '../../feed/PostCard';

interface ProfileBroadcastingSectionProps {
  userData: User;
  posts: Post[];
  sessionStartTime: number;
  locale: Region;
}

export const ProfileBroadcastingSection: React.FC<ProfileBroadcastingSectionProps> = ({ 
  posts, 
  locale 
}) => {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Transmission Flow */}
      {posts.length > 0 ? (
        posts.map(post => <PostCard key={post.id} post={post} onLike={() => {}} locale={locale} />)
      ) : (
        <div className="py-20 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-bold text-slate-400 italic">Awaiting primary transmission sequence establishment...</p>
        </div>
      )}
    </div>
  );
};
