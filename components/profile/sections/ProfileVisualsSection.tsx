
import React from 'react';
import { Post } from '../../../types';

interface ProfileVisualsSectionProps {
  posts: Post[];
}

export const ProfileVisualsSection: React.FC<ProfileVisualsSectionProps> = ({ posts }) => {
  const mediaPosts = posts.filter(p => p.media && p.media.length > 0);

  return (
    <div className="bg-white border-precision rounded-[3.5rem] p-10 md:p-14 animate-in fade-in slide-in-from-bottom-6 duration-700 max-w-[2560px] mx-auto shadow-sm">
      <div className="flex justify-between items-center mb-10 border-b border-slate-50 pb-8">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Visual_Asset_Archive</h3>
        <p className="text-[10px] font-black text-indigo-600 font-mono uppercase tracking-widest">{mediaPosts.length} Artifacts</p>
      </div>
      
      {mediaPosts.length === 0 ? (
        <div className="py-32 text-center bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
           <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em] font-mono italic">No visual signals recorded in local buffer...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {mediaPosts.map(post => (
            <div key={post.id} className="aspect-square rounded-[2.5rem] overflow-hidden border border-slate-100 bg-slate-100 group cursor-pointer relative shadow-sm">
               <img 
                 src={post.media[0].url} 
                 className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                 alt="" 
                 loading="lazy"
               />
               <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-[4px]">
                  <span className="text-white font-black text-[10px] uppercase tracking-[0.4em] font-mono">Sync_View</span>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
