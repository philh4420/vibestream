
import React, { useState } from 'react';
import { Post } from '../../types';
import { ICONS } from '../../constants';
import { db } from '../../services/firebase';
import { deleteDoc, doc } from 'firebase/firestore';

interface PostCardProps {
  post: Post;
  onLike: (id: string) => void;
  locale?: string;
  isAuthor?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onLike, locale = 'en-GB', isAuthor = false }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleDelete = async () => {
    if (!isAuthor || !db) return;
    if (!window.confirm("Terminate this signal from the grid permanently?")) return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'posts', post.id));
      // Toast is handled via parent if we had a callback, but we'll assume the real-time sync removes it
    } catch (e) {
      console.error("Purge Error:", e);
      setIsDeleting(false);
    }
  };

  const handleShare = () => {
    // In a real app, this would use the Web Share API
    if (navigator.share) {
      navigator.share({
        title: 'VibeStream Signal',
        text: post.content,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(post.content);
      // We would use addToast here if passed down, but for now we'll rely on the interaction feedback
    }
  };

  if (isDeleting) return null;

  return (
    <div className="group bg-white border-precision rounded-[2rem] overflow-hidden transition-all hover:border-slate-300 hover:shadow-[0_20px_50px_rgb(0,0,0,0.04)] mb-6">
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative group/avatar cursor-pointer">
              <img 
                src={post.authorAvatar} 
                alt={post.authorName} 
                className="w-11 h-11 md:w-14 md:h-14 rounded-2xl object-cover ring-2 ring-slate-50 transition-all group-hover/avatar:ring-indigo-100" 
              />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-[3px] border-white rounded-full"></div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-slate-900 text-sm md:text-base tracking-tight leading-none">{post.authorName}</h3>
                <ICONS.Verified />
              </div>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1.5 font-mono">{post.createdAt}</p>
            </div>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowOptions(!showOptions)}
              className="p-2.5 text-slate-300 hover:text-slate-600 transition-colors hover:bg-slate-50 rounded-xl active:scale-90"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
            </button>
            
            {showOptions && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowOptions(false)}></div>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 z-20 overflow-hidden animate-in zoom-in-95 duration-200">
                  {isAuthor && (
                    <button 
                      onClick={() => { handleDelete(); setShowOptions(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-50 transition-all text-[10px] font-black uppercase tracking-widest"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="m14.74 9-.344 12.142m-4.762 0L9.26 9m9.968-3.21c.342.053.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                      Purge Signal
                    </button>
                  )}
                  <button 
                    onClick={() => { handleShare(); setShowOptions(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 transition-all text-[10px] font-black uppercase tracking-widest border-t border-slate-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314" /></svg>
                    Re-Broadcast
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <p className="text-slate-800 text-base md:text-lg leading-relaxed mb-6 font-medium whitespace-pre-wrap">
          {post.content}
        </p>

        {post.media && post.media.length > 0 && (
          <div className="rounded-3xl overflow-hidden mb-6 bg-slate-50 border-precision relative group/media max-h-[70vh]">
            {post.media[0].type === 'image' ? (
              <img 
                src={post.media[0].url} 
                alt="" 
                className="w-full h-auto max-h-[600px] object-cover transition-transform duration-700 group-hover/media:scale-105" 
                loading="lazy" 
              />
            ) : post.media[0].type === 'video' ? (
              <video 
                src={post.media[0].url} 
                className="w-full h-auto max-h-[600px] object-cover" 
                controls 
                playsInline
              />
            ) : null}
            <div className="absolute inset-0 bg-black/0 group-hover/media:bg-black/5 transition-colors pointer-events-none" />
          </div>
        )}

        <div className="flex items-center justify-between pt-6 border-t border-precision">
          <div className="flex gap-8">
            <button 
              onClick={(e) => { e.stopPropagation(); onLike(post.id); }} 
              className={`flex items-center gap-3 transition-all touch-active group/btn ${post.isLiked ? 'text-rose-500 scale-105' : 'text-slate-400 hover:text-rose-500'}`}
            >
              <div className={`p-2.5 rounded-full transition-all ${post.isLiked ? 'bg-rose-50' : 'group-hover/btn:bg-rose-50'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill={post.isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                  <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
              </div>
              <span className="text-sm font-bold tracking-tight">{post.likes.toLocaleString(locale)}</span>
            </button>

            <button className="flex items-center gap-3 text-slate-400 hover:text-indigo-600 transition-all touch-active group/btn">
              <div className="p-2.5 rounded-full group-hover/btn:bg-indigo-50 transition-all">
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785 0.596.596 0 0 0 .21.685 0.59.59 0 0 0 .44.03 6.041 6.041 0 0 0 2.986-1.334c.451.06.91.09 1.378.09Z" /></svg>
              </div>
              <span className="text-sm font-bold tracking-tight">{post.comments.toLocaleString(locale)}</span>
            </button>
          </div>

          <button 
            onClick={handleShare}
            className="p-2.5 text-slate-300 hover:text-slate-900 transition-all touch-active hover:bg-slate-50 rounded-full active:scale-90"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24"><path d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};
