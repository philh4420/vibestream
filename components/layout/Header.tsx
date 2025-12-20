
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

  const NavButton = ({ route, icon: Icon, label }: { route: AppRoute, icon: any, label: string }) => {
    const isActive = activeRoute === route;
    return (
      <button 
        onClick={() => onNavigate(route)}
        className={`relative flex flex-col items-center justify-center h-full px-8 md:px-10 transition-all group ${isActive ? 'text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:rounded-xl'}`}
        title={label}
      >
        <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
          <Icon />
        </div>
        {isActive && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full shadow-[0_-2px_8px_rgba(79,70,229,0.3)] animate-in slide-in-from-bottom-1" />
        )}
      </button>
    );
  };

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-[200] glass-panel border-b border-precision flex items-center shadow-sm" 
      style={{ 
        height: 'var(--header-h)',
        paddingLeft: 'max(1rem, var(--sal))',
        paddingRight: 'max(1rem, var(--sar))'
      }}
    >
      <div className="flex items-center justify-between w-full max-w-[2560px] mx-auto h-full">
        
        {/* LEFT: Branding & Search (FB Style) */}
        <div className="flex items-center gap-2 md:gap-4 flex-1">
          <div 
            className="w-10 h-10 md:w-11 md:h-11 bg-slate-900 rounded-full flex items-center justify-center shadow-lg cursor-pointer active:scale-95 transition-all shrink-0"
            onClick={() => onNavigate(AppRoute.FEED)}
          >
            <span className="text-white font-black italic text-xl">V</span>
          </div>

          <div className={`relative flex items-center transition-all duration-300 rounded-full ${isSearchFocused ? 'w-full max-w-sm' : 'w-10 h-10 md:w-auto'}`}>
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-full transition-all ${isSearchFocused ? 'bg-white border-indigo-400 shadow-xl ring-4 ring-indigo-50 w-full' : 'bg-slate-100 md:w-64'}`}>
              <div className={`shrink-0 transition-colors ${isSearchFocused ? 'text-indigo-600' : 'text-slate-400'}`}>
                <ICONS.Search />
              </div>
              <input 
                type="text" 
                placeholder="Search Grid..." 
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className={`bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-900 placeholder:text-slate-400 transition-all ${isSearchFocused ? 'w-full opacity-100' : 'hidden md:block w-full'}`}
              />
            </div>
          </div>
        </div>

        {/* CENTER: Primary Navigation (Hidden on Mobile/Portrait) */}
        <div className="hidden lg:flex items-center justify-center h-full flex-1">
          <div className="flex items-center h-full">
            <NavButton route={AppRoute.FEED} icon={ICONS.Home} label="Home" />
            <NavButton route={AppRoute.EXPLORE} icon={ICONS.Explore} label="Explore" />
            <NavButton route={AppRoute.MESSAGES} icon={ICONS.Messages} label="Messenger" />
            <NavButton route={AppRoute.PROFILE} icon={ICONS.Profile} label="Profile" />
            {userRole === 'admin' && <NavButton route={AppRoute.ADMIN} icon={ICONS.Admin} label="Admin" />}
          </div>
        </div>

        {/* RIGHT: Controls & Profile */}
        <div className="flex items-center gap-2 md:gap-3 flex-1 justify-end">
          {/* Action Icons */}
          <div className="hidden sm:flex items-center gap-2 mr-2">
            <button className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-all active:scale-90" title="Notifications">
              <ICONS.Bell />
            </button>
            <button 
              onClick={() => onNavigate(AppRoute.MESSAGES)}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-all active:scale-90" title="Messenger"
            >
              <ICONS.Messages />
            </button>
          </div>

          {/* Account Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsSystemMenuOpen(!isSystemMenuOpen)}
              className="flex items-center gap-2 p-1 pl-1 pr-3 rounded-full hover:bg-slate-100 transition-all duration-300 active:scale-95 border border-slate-100 shadow-sm"
            >
              <div className="relative shrink-0">
                <img src={userData?.avatarUrl} className="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover shadow-sm ring-1 ring-white" alt="User" />
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${PRESENCE_DOTS[userData?.presenceStatus || 'Online']}`} />
              </div>
              <p className="hidden md:block text-[11px] font-black text-slate-800 tracking-tight truncate max-w-[80px]">
                {userData?.displayName.split(' ')[0]}
              </p>
              <svg className={`w-3 h-3 text-slate-400 transition-transform ${isSystemMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
            </button>

            {/* System Context Menu */}
            {isSystemMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsSystemMenuOpen(false)}></div>
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-[1.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] border border-precision overflow-hidden z-20 animate-in zoom-in-95 slide-in-from-top-4 duration-300">
                  <div className="p-4 bg-slate-50/50">
                    <button 
                      onClick={() => { onNavigate(AppRoute.PROFILE); setIsSystemMenuOpen(false); }}
                      className="w-full flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-slate-100"
                    >
                      <img src={userData?.avatarUrl} className="w-12 h-12 rounded-full object-cover" alt="" />
                      <div className="text-left">
                        <p className="font-black text-slate-900 text-sm tracking-tight">{userData?.displayName}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">See your profile</p>
                      </div>
                    </button>
                  </div>
                  
                  <div className="p-2 space-y-1">
                    <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Region Settings</div>
                    <div className="grid grid-cols-1">
                      {regions.map(r => (
                        <button 
                          key={r.code}
                          onClick={() => { onRegionChange(r.code); setIsSystemMenuOpen(false); }}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-all ${currentRegion === r.code ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-50 text-slate-600'}`}
                        >
                          <span className="flex items-center gap-3"><span>{r.flag}</span> {r.name}</span>
                          {currentRegion === r.code && <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-2 border-t border-precision">
                    <button 
                      onClick={() => { onLogout(); setIsSystemMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-3 text-rose-500 hover:bg-rose-50 rounded-lg transition-all font-bold text-xs"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
                      Log Out
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
