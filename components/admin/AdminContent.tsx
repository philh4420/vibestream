
import React from 'react';
import { Post } from '../../types';
import * as Firestore from 'firebase/firestore';
const { deleteDoc, doc } = Firestore as any;
import { db } from '../../services/firebase';
import { ICONS } from '../../constants';

interface AdminContentProps {
  signals: Post[];
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdminContent: React.FC<AdminContentProps> = ({ signals, addToast }) => {
  const handlePurge = async (id: string) => {
    if (!confirm('Confirm signal purge from the grid?')) return;
    try {
      await deleteDoc(doc(db, 'posts', id));
      addToast('Signal successfully purged', 'success');
    } catch (e) {
      addToast('Purge protocol failed', 'error');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="bg-slate-950 dark:bg-black rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl border border-white/10 dark:border-slate-800 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-rose-600/20 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3" />
         
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6">
            <div>
               <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-rose-500/10 backdrop-blur-md rounded-xl border border-rose-500/20 text-rose-400">
                     <ICONS.Explore />
                  </div>
                  <span className="text-[9px] font-black text-rose-500 uppercase tracking-[0.3em] font-mono">Content_Moderation</span>
               </div>
               <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase leading-none text-white">
                 Signal_Audit
               </h1>
               <p className="text-xs text-slate-400 font-medium mt-2 max-w-lg">
                 Live stream of user-generated broadcasts. Inspect and purge corrupt or non-compliant data packets from the grid.
               </p>
            </div>
            
            <div className="px-6 py-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-[1.8rem] flex flex-col items-center justify-center min-w-[140px]">
               <span className="text-3xl font-black text-white leading-none tracking-tighter">{signals.length}</span>
               <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest mt-1.5">Queued_Signals</span>
            </div>
         </div>
      </div>

      {/* Signal Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {signals.map((post, idx) => (
          <div 
            key={post.id} 
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-4 group hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)] hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-300 flex flex-col relative overflow-hidden"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            {/* Visual Layer */}
            <div className="aspect-[4/3] rounded-[2rem] overflow-hidden mb-4 bg-slate-50 dark:bg-slate-800 border border-slate-50 dark:border-slate-800 relative">
              {post.media?.[0]?.url ? (
                <>
                  <img src={post.media[0].url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                  {post.media[0].type === 'video' && (
                     <div className="absolute top-3 left-3 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 text-[8px] font-black text-white uppercase tracking-widest">VIDEO</div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-6">
                  <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-3 text-slate-300 dark:text-slate-500 shadow-sm">
                     <ICONS.Messages />
                  </div>
                  <p className="text-[8px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest font-mono">Text_Packet</p>
                </div>
              )}
              
              {/* Purge Overlay */}
              <div className="absolute inset-0 bg-rose-900/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center z-10 duration-300">
                 <button 
                   onClick={() => handlePurge(post.id)}
                   className="px-6 py-3 bg-white text-rose-600 rounded-[1.5rem] font-black text-[9px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all"
                 >
                   PURGE_SIGNAL
                 </button>
              </div>
            </div>

            {/* Meta Data */}
            <div className="flex-1 flex flex-col px-1">
              <div className="flex items-center gap-3 mb-3">
                <img src={post.authorAvatar} className="w-8 h-8 rounded-[0.8rem] object-cover border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800" alt="" />
                <div className="min-w-0">
                   <p className="text-[10px] font-black text-slate-900 dark:text-white truncate tracking-tight uppercase italic">{post.authorName}</p>
                   <p className="text-[8px] font-mono text-slate-400 dark:text-slate-500">ID: {post.id.slice(0, 6)}</p>
                </div>
              </div>
              
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium line-clamp-3 leading-relaxed mb-4">
                {post.content || <span className="italic text-slate-300 dark:text-slate-600">No textual content.</span>}
              </p>
              
              <div className="mt-auto pt-3 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                   <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                   {post.likes}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
