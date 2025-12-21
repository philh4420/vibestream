import React from 'react';
import { Post } from '../../types';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface AdminContentProps {
  signals: Post[];
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdminContent: React.FC<AdminContentProps> = ({ signals, addToast }) => {
  const handlePurge = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'posts', id));
      addToast('Signal Purged Successfully', 'success');
    } catch (e) {
      addToast('Purge Interrupted: Kernel Lock', 'error');
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 px-4">
        <div>
          <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Signal_Interceptor</h3>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] mt-3 font-mono italic">Global Packet Buffer Inspection • Layer 7 Analysis</p>
        </div>
        <button className="px-10 py-5 bg-slate-950 text-white rounded-[1.8rem] text-[11px] font-black font-mono uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all border border-white/10 hover:bg-black">Flush_Infrastructure_Buffer</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
        {signals.map(post => (
          <div key={post.id} className="bg-white border-precision rounded-[3.5rem] p-6 group hover:border-indigo-400 hover:shadow-[0_50px_100px_-20px_rgba(79,70,229,0.12)] transition-all duration-700 flex flex-col h-full relative">
            <div className="absolute top-6 right-6 z-20">
              <button 
                onClick={() => handlePurge(post.id)}
                className="p-4 bg-rose-600 text-white rounded-[1.2rem] opacity-0 group-hover:opacity-100 transition-all shadow-2xl active:scale-90 hover:bg-rose-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="relative aspect-square rounded-[2.5rem] overflow-hidden mb-6 bg-slate-50 border border-slate-100 shrink-0 shadow-inner group-hover:rotate-1 transition-transform">
              {post.media?.[0]?.url ? (
                <img src={post.media[0].url} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" alt="" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[10px] text-slate-200 font-black uppercase text-center p-12 italic">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl mb-4 flex items-center justify-center">
                    <svg className="w-6 h-6 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  Packet_Void_Detected
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-50">
                <img src={post.authorAvatar} className="w-10 h-10 rounded-[1rem] object-cover border border-slate-100" alt="" />
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-slate-900 truncate tracking-tight uppercase italic">{post.authorName}</p>
                  <p className="text-[8px] font-mono text-slate-300 uppercase tracking-widest mt-1">NODE_{post.authorId.slice(0, 10)}</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed italic px-1 font-medium italic">
                "{post.content || "Empty_Pulse_Sequence"}"
              </p>
              
              <div className="mt-auto pt-4 flex justify-between items-center text-[8px] font-black font-mono text-slate-300 uppercase tracking-widest">
                <span>Likes: {post.likes}</span>
                <span>Type: {post.media?.[0]?.type || 'Text'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
