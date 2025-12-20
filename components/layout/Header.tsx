
import React, { useState } from 'react';
import { ICONS } from '../../constants';
import { UserRole, Region, User as VibeUser, AppRoute, PresenceStatus } from '../../types';

interface HeaderProps {
  userRole: UserRole;
  userData: VibeUser | null;
  currentRegion: Region;
  onRegionChange: (region: Region) => void;
  onLogout: () => void;
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
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

export const Header: React.FC<HeaderProps> = ({ 
  userRole, 
  userData,
  currentRegion, 
  onRegionChange, 
  onLogout,
  activeRoute,
  onNavigate
}) => {
  const [isSystemMenuOpen, setIsSystemMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const regions: { code: Region, name: string, flag: string }[] = [
    { code: 'en-GB', name: 'London Node', flag: '🇬🇧' },
    { code: 'en-US', name: 'New York Node', flag: '🇺🇸' },
    { code: 'de-DE', name: 'Berlin Node', flag: '🇩🇪' },
    { code: 'fr-FR', name: 'Paris Node', flag: '🇫🇷' },
    { code: 'ja-JP', name: 'Tokyo Node', flag: '🇯🇵' },
  ];

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-[200] glass-panel border-b border-precision flex items-end transition-all pb-4 shadow-sm" 
      style={{ 
        height: 'var(--header-h)',
        paddingLeft: 'max(1.5rem, var(--sal))',
        paddingRight: 'max(1.5rem, var(--sar))'
      }}
    >
      <div className="flex items-center justify-between w-full max-w-[2560px] mx-auto gap-4 md:gap-12 mb-0.5">
        
        {/* Branding Cluster */}
        <div className="flex items-center gap-4 shrink-0 cursor-pointer group" onClick={() => onNavigate(AppRoute.FEED)}>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-900 rounded-[1.25rem] flex items-center justify-center shadow-xl ring-2 ring-white group-active:scale-90 transition-all duration-300">
            <span className="text-white font-black italic text-2xl">V</span>
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-base md:text-lg font-black tracking-tighter text-slate-900 leading-none">VibeStream</span>
            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.4em] mt-1.5 flex items-center gap-2 font-mono">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              NODE_{currentRegion.split('-')[1]}
            </span>
          </div>
        </div>

        {/* Neural Search Hub */}
        <div className={`relative flex-1 max-w-lg transition-all duration-500 ${isSearchFocused ? 'max-w-xl' : ''}`}>
          <div className={`flex items-center gap-4 px-6 py-3 rounded-2xl border transition-all ${isSearchFocused ? 'bg-white border-indigo-400 shadow-2xl ring-4 ring-indigo-50' : 'bg-slate-100/50 border-transparent'}`}>
            <div className={`transition-colors duration-300 ${isSearchFocused ? 'text-indigo-600' : 'text-slate-400'}`}>
              <ICONS.Search />
            </div>
            <input 
              type="text" 
              placeholder="Search Grid..." 
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="bg-transparent border-none focus:ring-0 w-full text-slate-900 placeholder:text-slate-400 font-bold text-sm md:text-base tracking-tight"
            />
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-slate-200/50 rounded-lg text-[10px] font-black text-slate-400 font-mono">
              ⌘K
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3 md:gap-6">
          <button className="hidden md:flex p-3 text-slate-400 hover:text-indigo-600 transition-all rounded-2xl hover:bg-indigo-50 group">
            <div className="group-hover:rotate-12 transition-transform duration-300">
              <ICONS.Bell />
            </div>
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setIsSystemMenuOpen(!isSystemMenuOpen)}
              className="flex items-center gap-3 p-1 rounded-2xl hover:bg-white transition-all duration-300 touch-active ring-1 ring-slate-100 bg-slate-50 relative pr-4 shadow-sm"
            >
              <div className="relative">
                <img src={userData?.avatarUrl} className="w-10 h-10 md:w-11 md:h-11 rounded-xl object-cover ring-2 ring-white shadow-md" alt="User" />
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-[3px] border-white shadow-lg ${PRESENCE_DOTS[userData?.presenceStatus || 'Online']}`} />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-[11px] font-black text-slate-900 leading-none">@{userData?.username.toLowerCase()}</p>
                <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1 font-mono">{userData?.presenceStatus || 'Online'}</p>
              </div>
            </button>

            {/* System Context Menu */}
            {isSystemMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsSystemMenuOpen(false)}></div>
                <div className="absolute right-0 mt-4 w-72 bg-white rounded-[2rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.15)] border border-precision overflow-hidden z-20 animate-in zoom-in-95 slide-in-from-top-4 duration-300">
                  <div className="p-6 border-b border-precision bg-slate-50/50">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2 font-mono">SYSTEM_IDENTITY_NODE</p>
                    <p className="text-lg font-black text-slate-900 tracking-tighter leading-none italic">{userData?.displayName}</p>
                  </div>
                  
                  <div className="p-3">
                    <p className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono">Region_Routing</p>
                    <div className="grid grid-cols-1 gap-1">
                      {regions.map(r => (
                        <button 
                          key={r.code}
                          onClick={() => { onRegionChange(r.code); setIsSystemMenuOpen(false); }}
                          className={`flex items-center justify-between px-4 py-3 rounded-xl text-[12px] transition-all duration-300 ${currentRegion === r.code ? 'bg-indigo-600 text-white font-black shadow-lg shadow-indigo-100' : 'hover:bg-slate-50 text-slate-600 font-bold'}`}
                        >
                          <span className="flex items-center gap-3"><span>{r.flag}</span> {r.name}</span>
                          {currentRegion === r.code && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 border-t border-precision bg-slate-50/20">
                    <button 
                      onClick={() => { onNavigate(AppRoute.PROFILE); setIsSystemMenuOpen(false); }}
                      className="w-full flex items-center gap-4 px-4 py-4 text-slate-700 hover:bg-white hover:shadow-sm rounded-xl transition-all font-black text-[11px] uppercase tracking-[0.2em] font-mono"
                    >
                      <ICONS.Profile /> CALIBRATE_ID
                    </button>
                    <button 
                      onClick={() => { onLogout(); setIsSystemMenuOpen(false); }}
                      className="w-full flex items-center gap-4 px-4 py-4 text-rose-500 hover:bg-rose-50 rounded-xl transition-all font-black text-[11px] uppercase tracking-[0.2em] font-mono"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
                      TERMINATE_SESSION
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
