
import React from 'react';
import { Post } from '../../types';

interface ProfileMediaProps {
  posts: Post[];
}

export const ProfileMedia: React.FC<ProfileMediaProps> = ({ posts }) => {
  const mediaPosts = posts.filter(p => p.media && p.media.length > 0).slice(0, 8);

  return (
    <div className="bg-white border-precision rounded-[2.5rem] p-8 mb-8 shadow-sm">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Transmission_Visuals</h3>
        <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Expand_Archive →</button>
      </div>
      
      {mediaPosts.length === 0 ? (
        <div className="py-20 text-center bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200">
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest font-mono italic">No Visual Signals Recorded</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {mediaPosts.map(post => (
            <div key={post.id} className="aspect-square rounded-2xl overflow-hidden border-precision bg-slate-100 group cursor-pointer relative shadow-sm">
               <img 
                 src={post.media[0].url} 
                 className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                 alt="" 
               />
               <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-[2px]">
                  <span className="text-white font-black text-[10px] uppercase tracking-widest font-mono">View_Post</span>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
