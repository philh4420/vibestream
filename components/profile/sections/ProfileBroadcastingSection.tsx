
import React from 'react';
import { Post, Region, User } from '../../../types';
import { PostCard } from '../../feed/PostCard';

interface ProfileBroadcastingSectionProps {
  posts: Post[];
  locale: Region;
  userData: User | null;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onViewPost: (post: Post) => void;
  onLike?: (id: string, freq?: string) => void;
  onBookmark?: (id: string) => void;
}

export const ProfileBroadcastingSection: React.FC<ProfileBroadcastingSectionProps> = ({ 
  posts, 
  locale,
  userData,
  addToast,
  onViewPost,
  onLike,
  onBookmark
}) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[2560px] mx-auto">
      {/* Transmission Flow */}
      {posts.length > 0 ? (
        posts.map(post => (
          <PostCard 
            key={post.id} 
            post={post} 
            onLike={(id, freq) => onLike?.(id, freq)} 
            onBookmark={(id) => onBookmark?.(id)}
            onViewPost={onViewPost}
            locale={locale} 
            userData={userData}
            addToast={addToast}
            isAuthor={userData?.id === post.authorId}
          />
        ))
      ) : (
        <div className="py-32 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center opacity-50">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] font-mono italic">Awaiting primary transmission sequence establishment...</p>
        </div>
      )}
    </div>
  );
};
