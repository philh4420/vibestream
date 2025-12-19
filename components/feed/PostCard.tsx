
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
    <div className="group bg-white border-precision rounded-2xl overflow-hidden transition-all hover:border-slate-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-4">
      <div className="p-5 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src={post.authorAvatar} 
                alt={post.authorName} 
                className="w-10 h-10 md:w-11 md:h-11 rounded-lg object-cover ring-1 ring-slate-100" 
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <h3 className="font-bold text-slate-900 text-sm tracking-tight">{post.authorName}</h3>
                <ICONS.Verified />
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{post.createdAt}</p>
            </div>
          </div>
          <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
          </button>
        </div>

        <p className="text-slate-800 text-[15px] md:text-[16px] leading-relaxed mb-5 font-normal">
          {post.content}
        </p>

        {post.media && post.media.length > 0 && (
          <div className="rounded-xl overflow-hidden mb-5 bg-slate-50 border-precision relative aspect-video md:aspect-auto">
            {post.media[0].type === 'image' ? (
              <img src={post.media[0].url} alt="" className="w-full h-auto max-h-[500px] object-cover" loading="lazy" />
            ) : post.media[0].type === 'video' ? (
              <video src={post.media[0].url} className="w-full h-auto max-h-[500px] object-cover" controls />
            ) : null}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-precision">
          <div className="flex gap-6">
            <button 
              onClick={(e) => { e.stopPropagation(); onLike(post.id); }} 
              className={`flex items-center gap-2 transition-all touch-active ${post.isLiked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill={post.isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
              <span className="text-xs font-bold">{post.likes.toLocaleString(locale)}</span>
            </button>

            <button className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785 0.596.596 0 0 0 .21.685 0.59.59 0 0 0 .44.03 6.041 6.041 0 0 0 2.986-1.334c.451.06.91.09 1.378.09Z" /></svg>
              <span className="text-xs font-bold">{post.comments.toLocaleString(locale)}</span>
            </button>
          </div>

          <button className="text-slate-300 hover:text-slate-900 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};
