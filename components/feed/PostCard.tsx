
import React from 'react';
import { Post } from '../../types';
import { ICONS } from '../../constants';

interface PostCardProps {
  post: Post;
  onLike: (id: string) => void;
  locale?: string;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onLike, locale = 'en-GB' }) => {
  return (
    <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-200/50 hover:shadow-md transition-all active:scale-[0.99] touch-manipulation mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img 
              src={post.authorAvatar} 
              alt={post.authorName} 
              className="w-12 h-12 md:w-14 md:h-14 rounded-[1.2rem] object-cover ring-4 ring-slate-50" 
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-black text-slate-900 leading-none tracking-tight md:text-lg">{post.authorName}</h3>
              <ICONS.Verified />
            </div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.1em] mt-1">{post.createdAt}</p>
          </div>
        </div>
        <button className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl text-slate-300 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
          </svg>
        </button>
      </div>

      <p className="text-slate-700 text-[17px] md:text-lg leading-relaxed mb-6 whitespace-pre-wrap font-medium">
        {post.content}
      </p>

      {post.media && post.media.length > 0 && (
        <div className="rounded-[2rem] overflow-hidden mb-6 bg-slate-100 border border-slate-100 relative group">
          {post.media[0].type === 'image' ? (
            <img src={post.media[0].url} alt="Post content" className="w-full h-auto max-h-[600px] object-cover" loading="lazy" />
          ) : post.media[0].type === 'video' ? (
            <video src={post.media[0].url} className="w-full h-auto max-h-[600px] object-cover" controls playsInline />
          ) : null}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div className="flex items-center gap-4 md:gap-8">
          <button 
            onClick={(e) => { e.stopPropagation(); onLike(post.id); }} 
            className="flex items-center gap-3 group px-3 py-2 rounded-xl hover:bg-rose-50 transition-all"
          >
            <div className={`transition-all duration-300 ${post.isLiked ? 'text-rose-500 scale-110' : 'text-slate-400 group-hover:text-rose-400'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill={post.isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-6 h-6 md:w-7 md:h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
            </div>
            <span className={`text-sm md:text-base font-black ${post.isLiked ? 'text-rose-600' : 'text-slate-500'}`}>
              {post.likes.toLocaleString(locale)}
            </span>
          </button>

          <button className="flex items-center gap-3 group px-3 py-2 rounded-xl hover:bg-indigo-50 transition-all">
            <div className="text-slate-400 group-hover:text-indigo-500 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-6 h-6 md:w-7 md:h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785 0.596.596 0 0 0 .21.685 0.59.59 0 0 0 .44.03 6.041 6.041 0 0 0 2.986-1.334c.451.06.91.09 1.378.09Z" />
              </svg>
            </div>
            <span className="text-sm md:text-base font-black text-slate-500">
              {post.comments.toLocaleString(locale)}
            </span>
          </button>
        </div>

        <button className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded-xl transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0-10.628a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5m0 10.628a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5" />
          </svg>
        </button>
      </div>
    </div>
  );
};
