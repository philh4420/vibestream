
import React from 'react';
import { User, Region, PresenceStatus } from '../../types';
import { ICONS, PRESENCE_CONFIG } from '../../constants';

interface ProfileHeaderProps {
  userData: User;
  onEdit: () => void;
  postCount?: number;
  addToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  isOwnProfile?: boolean;
  activeTab: string;
  onTabChange: (tab: any) => void;
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
  postCount = 0, 
  isOwnProfile,
  activeTab,
  onTabChange
}) => {
  const currentPresence = PRESENCE_CONFIG[userData.presenceStatus || 'Online'];

  const navTabs = [
    { id: 'broadcasting', label: 'Timeline' },
    { id: 'identity', label: 'About' },
    { id: 'visuals', label: 'Photos' },
    { id: 'resonance', label: 'Resonance' },
    { id: 'chronology', label: 'Archive' },
  ];

  return (
    <div className="w-full bg-white shadow-sm">
      {/* 1. COVER PHOTO SECTION */}
      <div className="max-w-6xl mx-auto relative h-[25vh] md:h-[400px] bg-slate-100 md:rounded-b-2xl overflow-hidden group">
        <img 
          src={userData.coverUrl || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80'} 
          className="w-full h-full object-cover transition-transform duration-[5s] group-hover:scale-105" 
          alt="Cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        
        {isOwnProfile && (
          <button className="absolute bottom-4 right-4 bg-white hover:bg-slate-50 text-slate-900 px-4 py-2 rounded-xl flex items-center gap-2 transition-all font-bold text-xs shadow-xl active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
            </svg>
            Edit Cover
          </button>
        )}
      </div>

      {/* 2. IDENTITY & ACTIONS OVERLAY */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6 -mt-12 md:-mt-20 pb-6 border-b border-slate-100">
          {/* Avatar Container */}
          <div className="relative group">
            <div className="p-1 bg-white rounded-full shadow-lg">
              <img 
                src={userData.avatarUrl} 
                className="w-32 h-32 md:w-44 md:h-44 rounded-full object-cover border-4 border-white transition-transform duration-500 group-hover:scale-[1.02]" 
                alt={userData.displayName} 
              />
            </div>
            <div className="absolute bottom-2 right-2 w-8 h-8 md:w-10 md:h-10 bg-white rounded-full p-1 shadow-xl flex items-center justify-center border-4 border-white">
              <div className={`w-full h-full rounded-full ${PRESENCE_DOTS[userData.presenceStatus || 'Online']} animate-pulse`} />
            </div>
          </div>

          {/* User Details */}
          <div className="flex-1 text-center md:text-left md:pb-4">
            <div className="flex flex-col md:flex-row items-center gap-2 mb-1">
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                {userData.displayName}
              </h1>
              {userData.verifiedHuman && <ICONS.Verified />}
            </div>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <p className="text-slate-500 font-bold text-sm">@{userData.username}</p>
              <span className="text-slate-300">•</span>
              <p className="text-slate-500 font-bold text-sm">{userData.followers.toLocaleString('en-GB')} Signals</p>
            </div>
          </div>

          {/* Action Hub */}
          <div className="flex items-center gap-2 md:pb-4 w-full md:w-auto">
            {isOwnProfile ? (
              <>
                <button 
                  onClick={onEdit}
                  className="flex-1 md:flex-none h-10 px-6 bg-indigo-600 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                  </svg>
                  Edit Profile
                </button>
              </>
            ) : (
              <>
                <button className="flex-1 md:flex-none h-10 px-6 bg-indigo-600 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all active:scale-95">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Follow
                </button>
                <button className="flex-1 md:flex-none h-10 px-6 bg-slate-100 text-slate-900 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-200 transition-all active:scale-95">
                  <ICONS.Messages />
                  Message
                </button>
              </>
            )}
            <button className="h-10 w-10 flex items-center justify-center bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          </div>
        </div>

        {/* 3. NAVIGATION TABS SECTION */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 md:px-6 py-4 text-sm font-bold transition-all relative whitespace-nowrap ${
                activeTab === tab.id ? 'text-indigo-600' : 'text-slate-500 hover:bg-slate-50'
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
