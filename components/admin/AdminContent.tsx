
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
    if (!confirm('Confirm signal purge from the grid?')) return;
    try {
      await deleteDoc(doc(db, 'posts', id));
      addToast('Signal successfully purged', 'success');
    } catch (e) {
      addToast('Purge protocol failed', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Signal_Audit</h3>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5 font-mono">Live Packet Inspection • Buffer Size: {signals.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {signals.map(post => (
          <div key={post.id} className="bg-white border border-slate-100 rounded-2xl p-3 group hover:border-indigo-400 hover:shadow-xl transition-all duration-300 flex flex-col relative overflow-hidden">
            <div className="absolute top-1.5 right-1.5 z-20">
              <button 
                onClick={() => handlePurge(post.id)}
                className="p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg active:scale-90"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="aspect-square rounded-xl overflow-hidden mb-2.5 bg-slate-50 border border-slate-100 relative shadow-inner">
              {post.media?.[0]?.url ? (
                <img src={post.media[0].url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[7px] text-slate-300 font-black uppercase text-center p-2">
                  TEXT_PACKET
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-center gap-1.5 mb-1.5 pb-1.5 border-b border-slate-50">
                <img src={post.authorAvatar} className="w-5 h-5 rounded-md object-cover" alt="" />
                <p className="text-[8px] font-black text-slate-900 truncate tracking-tight uppercase italic">{post.authorName}</p>
              </div>
              <p className="text-[10px] text-slate-600 line-clamp-3 leading-tight font-medium italic mb-2">
                "{post.content || "VOID"}"
              </p>
              <div className="mt-auto pt-1.5 flex justify-between items-center text-[7px] font-black font-mono text-slate-300 uppercase tracking-widest">
                <span>PULSES: {post.likes}</span>
                <span>ID: {post.id.slice(0, 4)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
