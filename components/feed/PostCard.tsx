
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
    if (!window.confirm("PROTOCOL ALERT: Terminate this transmission from the grid permanently?")) return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'posts', post.id));
    } catch (e) {
      console.error("Purge Error:", e);
      setIsDeleting(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'VibeStream Signal',
        text: post.content,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(post.content);
    }
  };

  if (isDeleting) return null;

  return (
    <div className="group bg-white border-precision rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:border-indigo-200 hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] mb-8">
      <div className="p-7 md:p-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-5">
            <div className="relative group/avatar cursor-pointer">
              <div className="absolute inset-0 bg-indigo-500/10 rounded-[1.8rem] blur-xl opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-500" />
              <img 
                src={post.authorAvatar} 
                alt={post.authorName} 
                className="w-12 h-12 md:w-16 md:h-16 rounded-[1.6rem] object-cover ring-4 ring-slate-50 relative z-10 transition-all group-hover/avatar:ring-indigo-50" 
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-[3.5px] border-white rounded-full z-20 shadow-sm animate-pulse"></div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-950 text-base md:text-xl tracking-tighter leading-none italic uppercase">{post.authorName}</h3>
                <div className="scale-90"><ICONS.Verified /></div>
              </div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-2 font-mono flex items-center gap-2">
                <span className="w-1 h-1 bg-slate-200 rounded-full" />
                {post.createdAt} 
                <span className="text-[8px] opacity-50 px-1.5 py-0.5 bg-slate-50 rounded border border-slate-100">GB_NODE</span>
              </p>
            </div>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowOptions(!showOptions)}
              className="p-3 text-slate-300 hover:text-slate-900 transition-all hover:bg-slate-50 rounded-2xl active:scale-90"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
            </button>
            
            {showOptions && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowOptions(false)}></div>
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-[1.8rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-slate-100 z-20 overflow-hidden animate-in zoom-in-95 slide-in-from-top-2 duration-300">
                  {isAuthor && (
                    <button 
                      onClick={() => { handleDelete(); setShowOptions(false); }}
                      className="w-full flex items-center gap-4 px-5 py-4 text-rose-500 hover:bg-rose-50 transition-all text-[11px] font-black uppercase tracking-[0.2em] font-mono"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="m14.74 9-.344 12.142m-4.762 0L9.26 9m9.968-3.21c.342.053.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                      Purge_Signal
                    </button>
                  )}
                  <button 
                    onClick={() => { handleShare(); setShowOptions(false); }}
                    className="w-full flex items-center gap-4 px-5 py-4 text-slate-700 hover:bg-slate-50 transition-all text-[11px] font-black uppercase tracking-[0.2em] font-mono border-t border-slate-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314" /></svg>
                    Broadcast_Sync
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <p className="text-slate-800 text-lg md:text-2xl leading-[1.4] mb-8 font-medium whitespace-pre-wrap tracking-tight">
          {post.content}
        </p>

        {post.media && post.media.length > 0 && (
          <div className="rounded-[2.5rem] overflow-hidden mb-8 bg-slate-50 border-precision relative group/media max-h-[75vh] shadow-inner">
            {post.media[0].type === 'image' ? (
              <img 
                src={post.media[0].url} 
                alt="" 
                className="w-full h-auto max-h-[700px] object-cover transition-transform duration-[1.5s] ease-out group-hover/media:scale-105" 
                loading="lazy" 
              />
            ) : post.media[0].type === 'video' ? (
              <video 
                src={post.media[0].url} 
                className="w-full h-auto max-h-[700px] object-cover" 
                controls 
                playsInline
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover/media:opacity-100 transition-opacity duration-700 pointer-events-none" />
          </div>
        )}

        <div className="flex items-center justify-between pt-8 border-t border-slate-100">
          <div className="flex gap-10">
            <button 
              onClick={(e) => { e.stopPropagation(); onLike(post.id); }} 
              className={`flex items-center gap-3.5 transition-all touch-active group/btn ${post.isLiked ? 'text-rose-500 scale-105' : 'text-slate-400 hover:text-rose-500'}`}
            >
              <div className={`p-3.5 rounded-full transition-all duration-300 ${post.isLiked ? 'bg-rose-50 shadow-[0_10px_25px_-5px_rgba(244,63,94,0.3)]' : 'group-hover/btn:bg-rose-50'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill={post.isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 md:w-7 md:h-7">
                  <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-black tracking-tighter leading-none">{post.likes.toLocaleString(locale)}</span>
                <span className="text-[8px] font-black uppercase tracking-[0.2em] font-mono opacity-50">Pulses</span>
              </div>
            </button>

            <button className="flex items-center gap-3.5 text-slate-400 hover:text-indigo-600 transition-all touch-active group/btn">
              <div className="p-3.5 rounded-full group-hover/btn:bg-indigo-50 transition-all duration-300">
                <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785 0.596.596 0 0 0 .21.685 0.59.59 0 0 0 .44.03 6.041 6.041 0 0 0 2.986-1.334c.451.06.91.09 1.378.09Z" /></svg>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-black tracking-tighter leading-none">{post.comments.toLocaleString(locale)}</span>
                <span className="text-[8px] font-black uppercase tracking-[0.2em] font-mono opacity-50">Syncs</span>
              </div>
            </button>
          </div>

          <button 
            onClick={handleShare}
            className="p-3.5 text-slate-300 hover:text-slate-950 transition-all touch-active hover:bg-slate-50 rounded-full active:scale-90"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};
