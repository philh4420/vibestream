
import React, { useState } from 'react';
import { ICONS, MOCK_USER } from '../../constants';
import { UserRole, Region } from '../../types';

interface HeaderProps {
  userRole: UserRole;
  currentRegion: Region;
  onRegionChange: (region: Region) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  userRole, 
  currentRegion, 
  onRegionChange, 
  onLogout 
}) => {
  const [isRegionMenuOpen, setIsRegionMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const regions: { code: Region, name: string, flag: string }[] = [
    { code: 'en-GB', name: 'UK (London)', flag: '🇬🇧' },
    { code: 'en-US', name: 'USA (New York)', flag: '🇺🇸' },
    { code: 'de-DE', name: 'Germany (Berlin)', flag: '🇩🇪' },
    { code: 'fr-FR', name: 'France (Paris)', flag: '🇫🇷' },
    { code: 'ja-JP', name: 'Japan (Tokyo)', flag: '🇯🇵' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] h-20 md:h-24 bg-white/70 backdrop-blur-[32px] border-b border-slate-200/50 safe-top flex items-center px-4 md:px-8 lg:px-12 transition-all duration-500">
      {/* 8K/4K Scaling Context */}
      <div className="flex items-center justify-between w-full max-w-[2560px] mx-auto gap-4 md:gap-8">
        
        {/* Logo & Status Section */}
        <div className="flex items-center gap-4 lg:gap-6 shrink-0">
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
            <div className="relative w-12 h-12 md:w-14 md:h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-200 ring-1 ring-white/20">
              <span className="text-white font-black text-2xl md:text-3xl italic font-outfit">V</span>
            </div>
            {/* Neural Pulse Indicator */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm animate-pulse"></div>
          </div>
          <div className="hidden lg:flex flex-col">
            <span className="text-xl font-black tracking-tighter text-slate-900 font-outfit">VibeStream</span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Neural Protocol 2.6.4</span>
          </div>
        </div>

        {/* Tactile Search Bar */}
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
            <div className="hidden md:flex items-center gap-1.5 px-2 py-1 bg-slate-200/50 rounded-lg text-[10px] font-bold text-slate-500 border border-slate-300/50">
              <span>⌘</span><span>K</span>
            </div>
          </div>
        </div>

        {/* Action Node Hub */}
        <div className="flex items-center gap-2 md:gap-4 lg:gap-6">
          
          {/* Region Toggle */}
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
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Select Infrastructure Node</h4>
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

          {/* Notifications */}
          <button className="relative p-3 md:p-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all active:scale-90">
            <ICONS.Bell />
            <div className="absolute top-3.5 right-3.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></div>
          </button>

          {/* User Profile Hub */}
          <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-slate-200">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-900 tracking-tight">{MOCK_USER.displayName}</span>
                <ICONS.Verified />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${userRole === 'admin' ? 'bg-rose-500 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                {userRole}
              </span>
            </div>
            <img 
              src={MOCK_USER.avatarUrl} 
              className="w-10 h-10 md:w-12 md:h-12 rounded-2xl border-2 border-white shadow-md ring-1 ring-slate-100 object-cover cursor-pointer hover:scale-105 transition-transform" 
              alt="Profile" 
            />
          </div>

          {/* Mobile Profile Trigger (smaller screens) */}
          <img 
            src={MOCK_USER.avatarUrl} 
            className="sm:hidden w-10 h-10 rounded-xl border-2 border-white shadow-sm ring-1 ring-slate-100 object-cover" 
            alt="Profile" 
          />
        </div>
      </div>
    </header>
  );
};
