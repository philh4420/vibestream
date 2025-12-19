
import React from 'react';
import { User } from '../../../types';
import { ICONS } from '../../../constants';

interface IdentityTileProps {
  userData: User;
  identityHash: string;
  onEdit: () => void;
}

export const IdentityTile: React.FC<IdentityTileProps> = ({ userData, identityHash, onEdit }) => (
  <div className="md:col-span-2 md:row-span-2 glass-panel rounded-[2.5rem] overflow-hidden flex flex-col relative group">
    <div className="h-32 md:h-48 bg-slate-100 relative overflow-hidden">
       <img src={userData.coverUrl} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" alt="" />
       <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent" />
    </div>
    <div className="px-6 md:px-10 pb-8 -mt-12 relative z-10 flex flex-col h-full">
      <div className="flex items-end gap-6 mb-6">
        <div className="relative shrink-0">
          <img src={userData.avatarUrl} className="w-24 h-24 md:w-32 md:h-32 rounded-3xl object-cover border-4 border-white shadow-2xl ring-1 ring-slate-100" alt="" />
          {userData.verifiedHuman && (
            <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-1.5 rounded-xl shadow-xl border-2 border-white scale-110">
              <ICONS.Verified />
            </div>
          )}
        </div>
        <div className="pb-2">
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter leading-none mb-2">{userData.displayName}</h1>
          <div className="flex items-center gap-2">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">@{userData.username}</span>
             <span className="w-1 h-1 bg-slate-300 rounded-full" />
             <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-[0.2em] font-mono">{userData.role}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4">
         <p className="text-slate-600 text-sm md:text-base leading-relaxed font-medium line-clamp-3">
           {userData.bio}
         </p>
         <div className="flex flex-wrap gap-3">
           <span className="px-3 py-1.5 bg-slate-100/50 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono flex items-center gap-2">
              <ICONS.Globe /> {userData.location}
           </span>
           <span className="px-3 py-1.5 bg-indigo-50 rounded-lg text-[9px] font-black text-indigo-600 uppercase tracking-widest font-mono flex items-center gap-2">
              <ICONS.Verified /> ID: {identityHash}
           </span>
         </div>
      </div>

      <div className="mt-8">
         <button 
            onClick={onEdit}
            className="w-full py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3"
         >
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 12H13.5" /></svg>
           Calibrate_Core
         </button>
      </div>
    </div>
  </div>
);
