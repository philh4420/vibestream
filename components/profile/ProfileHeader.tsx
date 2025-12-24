
import React from 'react';
import { User, PresenceStatus } from '../../types';
import { ICONS } from '../../constants';

interface ProfileHeaderProps {
  userData: User;
  onEdit: () => void;
  addToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  isOwnProfile?: boolean;
  isFollowing?: boolean;
  onFollowToggle?: () => void;
}

const PRESENCE_DOTS: Record<PresenceStatus, string> = {
  'Online': 'bg-emerald-500',
  'Focus': 'bg-amber-500',
  'Deep Work': 'bg-rose-600',
  'In-Transit': 'bg-indigo-600',
  'Away': 'bg-slate-400',
  'Invisible': 'bg-slate-700',
  'Syncing': 'bg-blue-400',
  'Offline': 'bg-slate-300'
};

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  userData, 
  onEdit, 
  isOwnProfile,
  isFollowing,
  onFollowToggle
}) => {
  return (
    <div className="w-full bg-white shadow-sm relative z-20">
      {/* 1. COVER PHOTO */}
      <div className="max-w-[2560px] mx-auto relative h-[30vh] md:h-[480px] bg-slate-100 md:rounded-b-[3.5rem] overflow-hidden group">
        <img 
          src={userData.coverUrl || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80'} 
          className="w-full h-full object-cover transition-transform duration-[8s] group-hover:scale-105" 
          alt="Cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {isOwnProfile && (
          <button 
            onClick={onEdit}
            className="absolute bottom-8 right-8 bg-black/30 backdrop-blur-xl hover:bg-white text-white hover:text-slate-900 px-6 py-3 rounded-2xl flex items-center gap-3 transition-all font-black text-[9px] uppercase tracking-widest shadow-xl active:scale-95 border border-white/20 hover:border-white"
          >
            <ICONS.Create /> Edit_Signal_Visual
          </button>
        )}
      </div>

      {/* 2. IDENTITY OVERLAP & ACTIONS */}
      <div className="max-w-[2560px] mx-auto px-6 sm:px-10 lg:px-14">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-8 md:gap-12 -mt-24 md:-mt-32 pb-10">
          
          {/* Avatar Area */}
          <div className="relative group shrink-0">
            <div className="p-2.5 bg-white rounded-[2.5rem] shadow-2xl">
              <img 
                src={userData.avatarUrl} 
                className="w-36 h-36 md:w-56 md:h-56 rounded-[2rem] object-cover bg-slate-50 transition-transform duration-500 group-hover:scale-[1.02]" 
                alt={userData.displayName} 
              />
            </div>
            <div className="absolute bottom-5 right-5 w-10 h-10 md:w-14 md:h-14 bg-white rounded-2xl p-1.5 shadow-xl flex items-center justify-center">
              <div className={`w-full h-full rounded-xl ${PRESENCE_DOTS[userData.presenceStatus || 'Online']} animate-pulse`} />
            </div>
          </div>

          {/* Text Identity */}
          <div className="flex-1 text-center md:text-left md:pb-4 min-w-0">
            <div className="flex flex-col md:flex-row items-center md:items-baseline gap-3 mb-3">
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none uppercase italic truncate max-w-full">
                {userData.displayName}
              </h1>
              {userData.verifiedHuman && <div className="text-indigo-500 scale-125 drop-shadow-sm"><ICONS.Verified /></div>}
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 mb-6">
               <div className="px-4 py-1.5 bg-slate-100 rounded-lg border border-slate-200">
                 <p className="text-slate-500 font-bold font-mono text-xs tracking-wide">@{userData.username}</p>
               </div>
               
               {userData.statusMessage && (
                 <p className="text-sm font-medium text-slate-600 italic">"{userData.statusMessage}"</p>
               )}
            </div>

            <div className="flex items-center justify-center md:justify-start gap-8">
              <div className="flex flex-col items-center md:items-start">
                 <span className="text-2xl font-black text-slate-900 leading-none">{userData.following || 0}</span> 
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono mt-1">Following</span>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div className="flex flex-col items-center md:items-start">
                 <span className="text-2xl font-black text-slate-900 leading-none">{userData.followers || 0}</span> 
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono mt-1">Followers</span>
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3 md:pb-4 w-full md:w-auto">
            {isOwnProfile ? (
              <button 
                onClick={onEdit}
                className="flex-1 md:flex-none h-16 px-10 bg-slate-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all active:scale-95 shadow-xl shadow-slate-200"
              >
                <ICONS.Create /> Edit_Profile
              </button>
            ) : (
              <>
                <button 
                  onClick={onFollowToggle}
                  className={`flex-1 md:flex-none h-16 px-10 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl ${isFollowing ? 'bg-white border border-slate-200 text-slate-900 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'}`}
                >
                  {isFollowing ? 'LINKED' : 'CONNECT'}
                </button>
                <button className="h-16 w-16 bg-white border border-slate-200 text-slate-400 rounded-[2rem] flex items-center justify-center hover:text-indigo-600 hover:border-indigo-200 transition-all active:scale-90 shadow-lg">
                  <ICONS.Messages />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};