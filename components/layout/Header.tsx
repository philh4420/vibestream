
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const regions: { code: Region, name: string, flag: string }[] = [
    { code: 'en-GB', name: 'UK (London)', flag: '🇬🇧' },
    { code: 'en-US', name: 'USA (New York)', flag: '🇺🇸' },
    { code: 'de-DE', name: 'Germany (Berlin)', flag: '🇩🇪' },
    { code: 'fr-FR', name: 'France (Paris)', flag: '🇫🇷' },
    { code: 'ja-JP', name: 'Japan (Tokyo)', flag: '🇯🇵' },
  ];

  const isAdmin = userRole === 'admin';

  const NavItem = ({ route, icon: Icon, label }: { route: AppRoute, icon: React.FC, label: string }) => {
    const isActive = activeRoute === route;
    return (
      <button 
        onClick={() => {
          onNavigate(route);
          setIsMobileMenuOpen(false);
        }}
        className={`w-full flex items-center gap-4 px-6 py-5 rounded-[1.5rem] transition-all duration-300 active:scale-95 ${isActive ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 font-black' : 'text-slate-500 hover:bg-slate-50 font-bold'}`}
      >
        <Icon />
        <span className="text-lg uppercase tracking-tight">{label}</span>
      </button>
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] h-20 md:h-24 bg-white/70 backdrop-blur-[32px] border-b border-slate-200/50 safe-top flex items-center px-4 md:px-8 lg:px-12 transition-all duration-500">
      <div className="flex items-center justify-between w-full max-w-[2560px] mx-auto gap-4 md:gap-8">
        
        <div className="flex items-center gap-3 lg:gap-6 shrink-0">
          {/* MOBILE MENU TRIGGER */}
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-3 bg-slate-100 rounded-2xl text-slate-600 active:scale-90 transition-transform"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          <div className="relative group cursor-pointer hidden sm:block">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
            <div className="relative w-12 h-12 md:w-14 md:h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-200 ring-1 ring-white/20">
              <span className="text-white font-black text-2xl md:text-3xl italic font-outfit">V</span>
            </div>
          </div>
          <div className="hidden lg:flex flex-col">
            <span className="text-xl font-black tracking-tighter text-slate-900 font-outfit">VibeStream</span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Neural Protocol 2.6.4</span>
          </div>
        </div>

        <div className={`relative flex-1 max-w-xl transition-all duration-500 ease-out ${isSearchFocused ? 'md:max-w-2xl' : ''}`}>
          <div className={`flex items-center gap-3 px-6 py-3.5 rounded-[1.5rem] border transition-all duration-300 ${isSearchFocused ? 'bg-white border-indigo-400 shadow-2xl shadow-indigo-100 ring-4 ring-indigo-50' : 'bg-slate-100/50 border-transparent hover:bg-slate-100'}`}>
            <ICONS.Search />
            <input 
              type="text" 
              placeholder="Query Neural Hub..." 
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="bg-transparent border-none focus:ring-0 w-full text-slate-800 placeholder:text-slate-400 font-semibold text-base md:text-lg"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 lg:gap-6">
          <div className="relative">
            <button 
              onClick={() => setIsRegionMenuOpen(!isRegionMenuOpen)}
              className={`p-3 md:p-4 rounded-2xl transition-all active:scale-90 flex items-center gap-2 ${isRegionMenuOpen ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
              aria-label="Change Region"
            >
              <ICONS.Globe />
              <span className="hidden sm:inline text-xs font-black uppercase tracking-widest">{currentRegion.split('-')[1]}</span>
            </button>

            {isRegionMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsRegionMenuOpen(false)}></div>
                <div className="absolute right-0 mt-4 w-64 bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden z-20 animate-in slide-in-from-top-4 duration-300">
                  <div className="p-5 border-b border-slate-50 bg-slate-50/50">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Infrastructure Node</h4>
                  </div>
                  <div className="p-2">
                    {regions.map(r => (
                      <button 
                        key={r.code}
                        onClick={() => { onRegionChange(r.code); setIsRegionMenuOpen(false); }}
                        className={`w-full flex items-center justify-between px-5 py-4 rounded-xl transition-all ${currentRegion === r.code ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-600'}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{r.flag}</span>
                          <span className="font-bold text-sm tracking-tight">{r.name}</span>
                        </div>
                        {currentRegion === r.code && <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <button className="relative p-3 md:p-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all active:scale-90">
            <ICONS.Bell />
            <div className="absolute top-3.5 right-3.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></div>
          </button>

          <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-slate-200">
            <img 
              src={userData?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${userData?.displayName}`} 
              className="w-10 h-10 md:w-12 md:h-12 rounded-2xl border-2 border-white shadow-md ring-1 ring-slate-100 object-cover" 
              alt="Profile" 
            />
          </div>
        </div>
      </div>

      {/* MOBILE DRAWER MENU */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[600] lg:hidden">
          <div 
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="absolute left-0 top-0 bottom-0 w-[85vw] max-w-sm bg-white shadow-2xl p-8 flex flex-col animate-in slide-in-from-left duration-400">
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                  <span className="text-white font-black text-2xl italic font-outfit">V</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black text-slate-900 font-outfit">VibeStream</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Neural Link Active</span>
                </div>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-3 bg-slate-50 rounded-2xl text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 space-y-2">
              <h4 className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Central Matrix</h4>
              <NavItem route={AppRoute.FEED} icon={ICONS.Home} label="Central Feed" />
              <NavItem route={AppRoute.EXPLORE} icon={ICONS.Explore} label="Discovery Hub" />
              <NavItem route={AppRoute.MESSAGES} icon={ICONS.Messages} label="Neural Comms" />
              <NavItem route={AppRoute.PROFILE} icon={ICONS.Profile} label="Neural Identity" />
              {isAdmin && <NavItem route={AppRoute.ADMIN} icon={ICONS.Admin} label="Citadel Command" />}
            </div>

            <div className="mt-auto pt-8 border-t border-slate-100">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-[2rem] mb-6">
                <img src={userData?.avatarUrl} className="w-12 h-12 rounded-xl object-cover" alt="" />
                <div className="flex-1 overflow-hidden">
                  <p className="font-black text-slate-900 truncate">{userData?.displayName}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Node Verified</p>
                </div>
              </div>
              <button 
                onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-4 py-5 bg-rose-50 text-rose-600 rounded-[1.5rem] font-black uppercase tracking-widest text-sm active:scale-95 transition-all shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                </svg>
                Terminate Link
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
