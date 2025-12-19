
import React from 'react';
import { Post } from '../../types';
import { ICONS } from '../../constants';

interface PostCardProps {
  post: Post;
  onLike: (id: string) => void;
  // Added locale support to fix the TypeScript error and support regional formatting for 2026+ standards
  locale?: string;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onLike, locale = 'en-GB' }) => {
  return (
    <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <img src={post.authorAvatar} alt={post.authorName} className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-50" />
          <div>
            <div className="flex items-center gap-1">
              <h3 className="font-bold text-slate-900 leading-tight">{post.authorName}</h3>
              <ICONS.Verified />
            </div>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{post.createdAt}</p>
          </div>
        </div>
      </div>

      <p className="text-slate-700 text-[16px] leading-relaxed mb-5 whitespace-pre-wrap px-1">
        {post.content}
      </p>

      {post.media && post.media.length > 0 && (
        <div className="rounded-3xl overflow-hidden mb-5 bg-slate-50 border border-slate-50">
          {post.media[0].type === 'image' ? (
            <img src={post.media[0].url} alt="Post content" className="w-full h-auto max-h-[500px] object-cover" loading="lazy" />
          ) : post.media[0].type === 'video' ? (
            <video src={post.media[0].url} className="w-full h-auto max-h-[500px] object-cover" controls playsInline />
          ) : null}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
        <div className="flex items-center gap-8">
          <button onClick={() => onLike(post.id)} className="flex items-center gap-2.5 group">
            <div className={`p-2.5 rounded-full transition-all duration-300 ${post.isLiked ? 'bg-rose-50 text-rose-500 scale-110' : 'group-hover:bg-rose-50 group-hover:text-rose-400 text-slate-400'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill={post.isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
            </div>
            {/* Format numbers based on provided locale for global accessibility */}
            <span className={`text-sm font-bold ${post.isLiked ? 'text-rose-600' : 'text-slate-500'}`}>{post.likes.toLocaleString(locale)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
