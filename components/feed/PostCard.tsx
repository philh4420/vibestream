
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
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const handleDelete = async () => {
    if (!isAuthor || !db) return;
    if (!window.confirm("PROTOCOL ALERT: Terminate this transmission permanently?")) return;
    
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
      navigator.clipboard.writeText(`${post.content} - Sent via VibeStream`);
    }
  };

  if (isDeleting) return null;

  return (
    <div className="group bg-white border-precision rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] mb-8">
      <div className="p-6 md:p-8">
        {/* Header Block */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative group/avatar cursor-pointer">
              <img 
                src={post.authorAvatar} 
                alt={post.authorName} 
                className="w-12 h-12 md:w-14 md:h-14 rounded-[1.4rem] object-cover ring-4 ring-slate-50 transition-all group-hover/avatar:ring-indigo-100" 
              />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-[2.5px] border-white rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-slate-950 text-sm md:text-base tracking-tight leading-none italic uppercase">{post.authorName}</h3>
                <ICONS.Verified />
                {post.audience === 'mesh' && (
                  <div className="p-1 bg-slate-100 rounded-md text-slate-400" title="Visible to Mesh Only">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                 <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest font-mono">
                   {post.createdAt}
                 </p>
                 {post.location && (
                   <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 rounded-full">
                     <svg className="w-2.5 h-2.5 text-indigo-500" fill="currentColor" viewBox="0 0 24 24"><path d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3.75 3.75 0 110-7.5 3.75 3.75 0 010 7.5z" /></svg>
                     <span className="text-[8px] font-black text-indigo-600 uppercase tracking-tight">{post.location}</span>
                   </div>
                 )}
              </div>
            </div>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowOptions(!showOptions)}
              className="p-2.5 text-slate-300 hover:text-slate-900 transition-all hover:bg-slate-50 rounded-xl active:scale-90"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>
            </button>
            {showOptions && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowOptions(false)}></div>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 z-20 overflow-hidden animate-in zoom-in-95 duration-200">
                  {isAuthor && (
                    <button onClick={handleDelete} className="w-full flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-50 transition-all text-[10px] font-black uppercase tracking-widest font-mono">
                      Purge_Signal
                    </button>
                  )}
                  <button onClick={handleShare} className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 transition-all text-[10px] font-black uppercase tracking-widest font-mono border-t border-slate-50">
                    Broadcast_Sync
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Content Block */}
        <p className="text-slate-800 text-base md:text-lg leading-relaxed mb-6 font-medium whitespace-pre-wrap tracking-tight">
          {post.content}
        </p>

        {/* Media Carousel Block */}
        {post.media && post.media.length > 0 && (
          <div className="relative rounded-[2rem] overflow-hidden mb-6 bg-slate-50 border-precision shadow-inner group/carousel">
            <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentMediaIndex * 100}%)` }}>
              {post.media.map((item, idx) => (
                <div key={idx} className="min-w-full flex items-center justify-center bg-slate-950">
                  {item.type === 'image' ? (
                    <img 
                      src={item.url} 
                      alt="" 
                      className="w-full h-auto max-h-[600px] object-contain" 
                      loading="lazy" 
                    />
                  ) : (
                    <video src={item.url} className="w-full h-auto max-h-[600px]" controls playsInline />
                  )}
                </div>
              ))}
            </div>

            {post.media.length > 1 && (
              <>
                <button 
                  onClick={() => setCurrentMediaIndex(Math.max(0, currentMediaIndex - 1))}
                  className={`absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/20 hover:bg-black/40 backdrop-blur-md text-white rounded-2xl transition-all opacity-0 group-hover/carousel:opacity-100 ${currentMediaIndex === 0 ? 'pointer-events-none opacity-0' : ''}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                </button>
                <button 
                  onClick={() => setCurrentMediaIndex(Math.min(post.media.length - 1, currentMediaIndex + 1))}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/20 hover:bg-black/40 backdrop-blur-md text-white rounded-2xl transition-all opacity-0 group-hover/carousel:opacity-100 ${currentMediaIndex === post.media.length - 1 ? 'pointer-events-none opacity-0' : ''}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                </button>
                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5">
                  {post.media.map((_, idx) => (
                    <div key={idx} className={`h-1 rounded-full transition-all duration-300 ${currentMediaIndex === idx ? 'w-4 bg-white' : 'w-1 bg-white/40'}`} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-5 border-t border-slate-50">
          <div className="flex gap-6 md:gap-10">
            <button 
              onClick={(e) => { e.stopPropagation(); onLike(post.id); }} 
              className={`flex items-center gap-2.5 transition-all touch-active group/btn ${post.isLiked ? 'text-rose-500 scale-105' : 'text-slate-400 hover:text-rose-500'}`}
            >
              <div className={`p-2.5 rounded-full transition-all duration-300 ${post.isLiked ? 'bg-rose-50 shadow-lg shadow-rose-100' : 'group-hover/btn:bg-rose-50'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill={post.isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                  <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
              </div>
              <span className="text-sm font-black tracking-tighter">{post.likes.toLocaleString(locale)}</span>
            </button>

            <button className="flex items-center gap-2.5 text-slate-400 hover:text-indigo-600 transition-all touch-active group/btn">
              <div className="p-2.5 rounded-full group-hover/btn:bg-indigo-50 transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785 0.596.596 0 0 0 .21.685 0.59.59 0 0 0 .44.03 6.041 6.041 0 0 0 2.986-1.334c.451.06.91.09 1.378.09Z" /></svg>
              </div>
              <span className="text-sm font-black tracking-tighter">{post.comments.toLocaleString(locale)}</span>
            </button>
          </div>

          <button 
            onClick={handleShare}
            className="p-2.5 text-slate-300 hover:text-slate-950 transition-all touch-active hover:bg-slate-50 rounded-full"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};
