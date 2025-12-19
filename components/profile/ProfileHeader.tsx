
import React from 'react';
import { User } from '../../types';
import { ICONS } from '../../constants';

interface ProfileHeaderProps {
  userData: User;
  onEdit: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ userData, onEdit }) => {
  return (
    <div className="relative glass-panel rounded-[3rem] overflow-hidden mb-8 shadow-2xl border-white/20">
      {/* Cover Image with Depth Effect */}
      <div className="h-48 md:h-72 relative overflow-hidden">
        <img 
          src={userData.coverUrl} 
          className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105" 
          alt="" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      {/* Content Area */}
      <div className="px-6 md:px-12 pb-10 -mt-16 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <img 
                src={userData.avatarUrl} 
                className="relative w-32 h-32 md:w-44 md:h-44 rounded-[2.2rem] object-cover border-4 border-white shadow-2xl" 
                alt={userData.displayName} 
              />
              {userData.verifiedHuman && (
                <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2 rounded-2xl shadow-xl border-4 border-white scale-125">
                  <ICONS.Verified />
                </div>
              )}
            </div>
            <div className="pb-2 space-y-1">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">
                  {userData.displayName}
                </h1>
                <span className="hidden md:block px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg uppercase tracking-widest border border-indigo-100">
                  {userData.role}
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.4em] font-mono">
                @{userData.username} • {userData.trustTier || 'Alpha'}-Class Node
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-center md:pb-2">
            <button 
              onClick={onEdit}
              className="flex-1 md:flex-none px-8 py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 12H13.5" /></svg>
              Calibrate
            </button>
            <button className="p-4 bg-slate-100 text-slate-900 rounded-2xl hover:bg-slate-200 transition-all active:scale-95">
              <ICONS.Messages />
            </button>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-100 flex flex-wrap justify-center md:justify-start gap-8">
           <div className="flex flex-col">
              <span className="text-xl font-black text-slate-900 leading-none">{(userData.followers || 0).toLocaleString()}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Resonators</span>
           </div>
           <div className="flex flex-col">
              <span className="text-xl font-black text-slate-900 leading-none">{(userData.following || 0).toLocaleString()}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Following</span>
           </div>
           <div className="flex flex-col">
              <span className="text-xl font-black text-slate-900 leading-none">2.4k</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Transmissions</span>
           </div>
        </div>
      </div>
    </div>
  );
};
