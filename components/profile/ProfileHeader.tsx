
import React from 'react';
import { User, PresenceStatus } from '../../types';
import { ICONS } from '../../constants';

interface ProfileHeaderProps {
  userData: User;
  onEdit: () => void;
  addToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  isOwnProfile?: boolean;
  activeTab: string;
  onTabChange: (tab: any) => void;
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
  'Syncing': 'bg-blue-400'
};

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  userData, 
  onEdit, 
  isOwnProfile,
  activeTab,
  onTabChange,
  isFollowing,
  onFollowToggle
}) => {
  const navTabs = [
    { id: 'broadcasting', label: 'Timeline' },
    { id: 'connections', label: 'Friends' }, // New Tab
    { id: 'identity', label: 'About' },
    { id: 'visuals', label: 'Photos' },
    { id: 'resonance', label: 'Resonance' },
    { id: 'chronology', label: 'Archive' },
  ];

  return (
    <div className="w-full bg-white shadow-sm border-b border-slate-200">
      {/* 1. COVER PHOTO */}
      <div className="max-w-[2560px] mx-auto relative h-[25vh] md:h-[420px] bg-slate-100 md:rounded-b-[2.5rem] overflow-hidden group">
        <img 
          src={userData.coverUrl || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80'} 
          className="w-full h-full object-cover transition-transform duration-[5s] group-hover:scale-105" 
          alt="Cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        
        {isOwnProfile && (
          <button 
            onClick={onEdit}
            className="absolute bottom-6 right-6 bg-white/10 backdrop-blur-md hover:bg-white text-white hover:text-slate-900 px-6 py-3 rounded-2xl flex items-center gap-2 transition-all font-black text-[9px] uppercase tracking-widest shadow-xl active:scale-95 border border-white/20"
          >
            <ICONS.Create /> Edit Cover
          </button>
        )}
      </div>

      {/* 2. IDENTITY OVERLAP & ACTIONS */}
      <div className="max-w-[2560px] mx-auto px-6 sm:px-10 lg:px-14">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10 -mt-20 md:-mt-24 pb-8">
          {/* Avatar Area */}
          <div className="relative group">
            <div className="p-2 bg-white rounded-full shadow-2xl">
              <img 
                src={userData.avatarUrl} 
                className="w-32 h-32 md:w-48 md:h-48 rounded-full object-cover border-[6px] border-slate-50 transition-transform duration-500 group-hover:scale-[1.02]" 
                alt={userData.displayName} 
              />
            </div>
            <div className="absolute bottom-4 right-4 w-8 h-8 md:w-12 md:h-12 bg-white rounded-full p-1.5 shadow-xl flex items-center justify-center border-[4px] border-slate-50">
              <div className={`w-full h-full rounded-full ${PRESENCE_DOTS[userData.presenceStatus || 'Online']} animate-pulse`} />
            </div>
          </div>

          {/* Text Identity */}
          <div className="flex-1 text-center md:text-left md:pb-6">
            <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tighter leading-none">
                {userData.displayName}
              </h1>
              {userData.verifiedHuman && <div className="text-indigo-500 scale-125"><ICONS.Verified /></div>}
              {userData.statusEmoji && <span className="text-3xl ml-1">{userData.statusEmoji}</span>}
            </div>
            
            <div className="flex items-center justify-center md:justify-start gap-6">
              <p className="text-slate-400 font-bold font-mono text-sm tracking-wide">@{userData.username}</p>
              <div className="h-4 w-px bg-slate-300" />
              <div className="flex gap-6 text-sm">
                 <div className="flex items-center gap-1.5">
                    <span className="font-black text-slate-900">{userData.following || 0}</span> 
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Following</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                    <span className="font-black text-slate-900">{userData.followers || 0}</span> 
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Followers</span>
                 </div>
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3 md:pb-6 w-full md:w-auto">
            {isOwnProfile ? (
              <button 
                onClick={onEdit}
                className="flex-1 md:flex-none h-14 px-8 bg-slate-950 text-white rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all active:scale-95 shadow-lg border border-transparent"
              >
                <ICONS.Create /> Edit Profile
              </button>
            ) : (
              <>
                <button 
                  onClick={onFollowToggle}
                  className={`flex-1 md:flex-none h-14 px-10 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${isFollowing ? 'bg-white border border-slate-200 text-slate-900 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'}`}
                >
                  {isFollowing ? 'Linked' : 'Connect'}
                </button>
                <button className="h-14 w-14 bg-white border border-slate-200 text-slate-400 rounded-[1.8rem] flex items-center justify-center hover:text-indigo-600 hover:border-indigo-200 transition-all active:scale-90 shadow-sm">
                  <ICONS.Messages />
                </button>
              </>
            )}
          </div>
        </div>

        {/* 3. STICKY NAV BAR */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-slate-100 pt-1">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] font-mono transition-all relative whitespace-nowrap ${
                activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
