
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
  const [isRegionMenuOpen, setIsRegionMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const regions: { code: Region, name: string, flag: string }[] = [
    { code: 'en-GB', name: 'London Node', flag: '🇬🇧' },
    { code: 'en-US', name: 'New York Node', flag: '🇺🇸' },
    { code: 'de-DE', name: 'Berlin Node', flag: '🇩🇪' },
    { code: 'fr-FR', name: 'Paris Node', flag: '🇫🇷' },
    { code: 'ja-JP', name: 'Tokyo Node', flag: '🇯🇵' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] h-20 md:h-24 glass-panel border-b border-precision flex items-center px-4 md:px-12 transition-all">
      <div className="flex items-center justify-between w-full max-w-[2560px] mx-auto gap-8">
        
        {/* Branding */}
        <div className="flex items-center gap-4 shrink-0 cursor-pointer" onClick={() => onNavigate(AppRoute.FEED)}>
          <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center shadow-lg ring-1 ring-white/10">
            <span className="text-white font-black italic text-xl">V</span>
          </div>
          <div className="hidden lg:flex flex-col">
            <span className="text-lg font-bold tracking-tight text-slate-900 leading-none">VibeStream</span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Live: {currentRegion}
            </span>
          </div>
        </div>

        {/* Pro Search */}
        <div className={`relative flex-1 max-w-lg transition-all duration-300 ${isSearchFocused ? 'max-w-xl' : ''}`}>
          <div className={`flex items-center gap-3 px-5 py-2.5 rounded-xl border transition-all ${isSearchFocused ? 'bg-white border-indigo-400 shadow-xl shadow-indigo-50 ring-2 ring-indigo-50' : 'bg-slate-100/50 border-transparent hover:bg-slate-100'}`}>
            <ICONS.Search />
            <input 
              type="text" 
              placeholder="Search the grid... (Ctrl+K)" 
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="bg-transparent border-none focus:ring-0 w-full text-slate-800 placeholder:text-slate-400 font-medium text-sm"
            />
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3 md:gap-5">
          <div className="relative">
            <button 
              onClick={() => setIsRegionMenuOpen(!isRegionMenuOpen)}
              className={`px-4 py-2 rounded-xl transition-all active:scale-95 flex items-center gap-2 border-precision ${isRegionMenuOpen ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <span className="text-xs font-bold uppercase tracking-widest">{currentRegion.split('-')[1]}</span>
              <ICONS.Globe />
            </button>

            {isRegionMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsRegionMenuOpen(false)}></div>
                <div className="absolute right-0 mt-4 w-60 bg-white rounded-xl shadow-2xl border border-precision overflow-hidden z-20 route-transition">
                  <div className="p-3">
                    {regions.map(r => (
                      <button 
                        key={r.code}
                        onClick={() => { onRegionChange(r.code); setIsRegionMenuOpen(false); }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-all ${currentRegion === r.code ? 'bg-indigo-50 text-indigo-600 font-bold' : 'hover:bg-slate-50 text-slate-600 font-medium'}`}
                      >
                        <span className="flex items-center gap-3"><span>{r.flag}</span> {r.name}</span>
                        {currentRegion === r.code && <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <button className="relative p-3 text-slate-400 hover:text-slate-900 transition-all touch-active">
            <ICONS.Bell />
            <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-indigo-500 rounded-full ring-2 ring-white"></div>
          </button>

          <div className="flex items-center gap-2 pl-4 border-l border-precision">
             <img src={userData?.avatarUrl} className="w-9 h-9 rounded-lg border-precision object-cover shadow-sm" alt="Me" />
          </div>
        </div>
      </div>
    </header>
  );
};
