import React, { useState } from 'react';
import { ICONS } from '../../constants';
import { UserRole, Region, User as VibeUser, AppRoute } from '../../types';

interface HeaderProps {
  userRole: UserRole;
  userData: VibeUser | null;
  currentRegion: Region;
  onRegionChange: (region: Region) => void;
  onLogout: () => void;
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

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
    <header className="fixed top-0 left-0 right-0 z-[200] h-16 md:h-20 glass-panel border-b border-precision flex items-center px-4 md:px-8 transition-all">
      <div className="flex items-center justify-between w-full max-w-[2560px] mx-auto gap-4 md:gap-8">
        
        {/* Branding */}
        <div className="flex items-center gap-3 shrink-0 cursor-pointer group" onClick={() => onNavigate(AppRoute.FEED)}>
          <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-900 rounded-lg flex items-center justify-center shadow-lg ring-1 ring-white/10 group-active:scale-95 transition-transform">
            <span className="text-white font-black italic text-lg md:text-xl">V</span>
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-sm md:text-base font-bold tracking-tight text-slate-900 leading-none">VibeStream</span>
            <span className="text-[7px] md:text-[8px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1 flex items-center gap-1.5 font-mono">
              <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
              Node: {currentRegion}
            </span>
          </div>
        </div>

        {/* Universal Search / Command Bar */}
        <div className={`relative flex-1 max-w-md transition-all duration-300 ${isSearchFocused ? 'max-w-lg' : ''}`}>
          <div className={`flex items-center gap-2 px-4 py-1.5 md:py-2 rounded-xl border transition-all ${isSearchFocused ? 'bg-white border-indigo-400 shadow-lg ring-2 ring-indigo-50' : 'bg-slate-100/50 border-transparent'}`}>
            <div className="text-slate-400 scale-75 md:scale-100"><ICONS.Search /></div>
            <input 
              type="text" 
              placeholder="Search..." 
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="bg-transparent border-none focus:ring-0 w-full text-slate-800 placeholder:text-slate-400 font-medium text-xs md:text-sm"
            />
          </div>
        </div>

        {/* Precision Controls */}
        <div className="flex items-center gap-2 md:gap-4">
          <button className="hidden md:flex p-2 text-slate-400 hover:text-slate-900 transition-all">
            <ICONS.Bell />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setIsSystemMenuOpen(!isSystemMenuOpen)}
              className="flex items-center gap-2 p-0.5 rounded-xl hover:bg-slate-100 transition-all touch-active ring-1 ring-slate-200"
            >
              <img src={userData?.avatarUrl} className="w-8 h-8 md:w-9 md:h-9 rounded-lg object-cover" alt="System" />
              <div className="hidden md:block pr-2 text-left">
                <p className="text-[10px] font-bold text-slate-900 leading-none">@{userData?.username}</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{userRole}</p>
              </div>
            </button>

            {/* System Menu Overlay */}
            {isSystemMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsSystemMenuOpen(false)}></div>
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-precision overflow-hidden z-20 route-transition">
                  <div className="p-4 border-b border-precision bg-slate-50/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Infrastructure Node</p>
                    <p className="text-xs font-bold text-slate-900">{userData?.displayName}</p>
                  </div>
                  
                  <div className="p-2">
                    <p className="px-3 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Region Link</p>
                    <div className="grid grid-cols-1 gap-1">
                      {regions.map(r => (
                        <button 
                          key={r.code}
                          onClick={() => { onRegionChange(r.code); setIsSystemMenuOpen(false); }}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-[11px] transition-all ${currentRegion === r.code ? 'bg-indigo-50 text-indigo-600 font-bold' : 'hover:bg-slate-50 text-slate-600 font-medium'}`}
                        >
                          <span className="flex items-center gap-2"><span>{r.flag}</span> {r.name}</span>
                          {currentRegion === r.code && <div className="w-1 h-1 bg-indigo-600 rounded-full" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-2 border-t border-precision">
                    <button 
                      onClick={() => { onNavigate(AppRoute.PROFILE); setIsSystemMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-all font-bold text-[11px] uppercase tracking-wider"
                    >
                      <ICONS.Profile /> Identity Config
                    </button>
                    <button 
                      onClick={() => { onLogout(); setIsSystemMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all font-bold text-[11px] uppercase tracking-wider"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
                      Terminate Session
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