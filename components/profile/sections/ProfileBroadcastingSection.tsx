
import React from 'react';
import { Post, Region, User } from '../../../types';
import { PostCard } from '../../feed/PostCard';

interface ProfileBroadcastingSectionProps {
  posts: Post[];
  locale: Region;
  userData: User | null;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onViewPost: (post: Post) => void;
}

export const ProfileBroadcastingSection: React.FC<ProfileBroadcastingSectionProps> = ({ 
  posts, 
  locale,
  userData,
  addToast,
  onViewPost
}) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Transmission Flow */}
      {posts.length > 0 ? (
        posts.map(post => (
          <PostCard 
            key={post.id} 
            post={post} 
            onLike={() => {}} 
            onViewPost={onViewPost}
            locale={locale} 
            userData={userData}
            addToast={addToast}
            isAuthor={userData?.id === post.authorId}
          />
        ))
      ) : (
        <div className="py-32 text-center bg-white rounded-[3rem] border-precision shadow-sm">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] font-mono italic">Awaiting primary transmission sequence establishment...</p>
        </div>
      )}
    </div>
  );
};
