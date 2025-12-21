
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
  activeRoute,
  onNavigate
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-[500] pointer-events-none p-4 md:p-6" style={{ paddingTop: 'calc(var(--sat) + 1.5rem)' }}>
      <div className="max-w-[1920px] mx-auto w-full">
        {/* Main Floating Container */}
        <div className="glass-panel citadel-pill w-full h-24 md:h-28 flex items-center justify-between px-6 md:px-12 pointer-events-auto">
          
          {/* LEFT: Branding & Title */}
          <div className="flex items-center gap-6 md:gap-10">
            <div 
              className="w-16 h-16 md:w-20 md:h-20 bg-[#050509] rounded-full flex items-center justify-center shadow-2xl transition-transform active:scale-90 cursor-pointer"
              onClick={() => onNavigate(AppRoute.FEED)}
            >
              <span className="text-white font-citadel text-4xl md:text-5xl translate-x-0.5">V</span>
            </div>

            <div className="flex flex-col select-none">
              <h1 className="font-citadel text-3xl md:text-5xl text-[#050509] uppercase leading-none">
                {activeRoute === AppRoute.ADMIN ? 'COMMAND' : activeRoute.toUpperCase()}
              </h1>
              <p className="text-[10px] md:text-[12px] font-black text-[#cbd5e1] uppercase tracking-[0.4em] font-mono mt-2 md:mt-3 ml-1 italic opacity-80">
                VIBESTREAM_CITADEL_OS_V5.2.LTS
              </p>
            </div>
          </div>

          {/* RIGHT: High-Fidelity Navigation Tabs */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="glass-panel citadel-pill p-1.5 flex items-center gap-1.5 border-[#f1f5f9] bg-white/50">
              
              {/* Dashboard Tab */}
              <button 
                onClick={() => onNavigate(AppRoute.FEED)}
                className={`relative flex items-center gap-3 px-8 py-3.5 rounded-full transition-all duration-500 group ${activeRoute === AppRoute.FEED ? 'bg-[#050509] text-white shadow-xl' : 'text-[#94a3b8] hover:text-[#475569]'}`}
              >
                <div className={`${activeRoute === AppRoute.FEED ? 'text-white' : 'text-[#94a3b8] opacity-60'}`}>
                  <ICONS.Home />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] font-mono italic">Dashboard</span>
                {activeRoute === AppRoute.FEED && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-indigo-500 rounded-full" />
                )}
              </button>

              {/* Identity/Profile Tab */}
              <button 
                onClick={() => onNavigate(AppRoute.PROFILE)}
                className={`relative flex items-center gap-3 px-8 py-3.5 rounded-full transition-all duration-500 group ${activeRoute === AppRoute.PROFILE ? 'bg-[#050509] text-white shadow-xl' : 'text-[#94a3b8] hover:text-[#475569]'}`}
              >
                <div className={`${activeRoute === AppRoute.PROFILE ? 'text-white' : 'text-[#94a3b8] opacity-60'}`}>
                  <ICONS.Profile />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] font-mono italic">Identity</span>
                {activeRoute === AppRoute.PROFILE && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-indigo-500 rounded-full" />
                )}
              </button>

              {/* Comms/Messages Tab */}
              <button 
                onClick={() => onNavigate(AppRoute.MESSAGES)}
                className={`relative flex items-center gap-3 px-8 py-3.5 rounded-full transition-all duration-500 group ${activeRoute === AppRoute.MESSAGES ? 'bg-[#050509] text-white shadow-xl' : 'text-[#94a3b8] hover:text-[#475569]'}`}
              >
                <div className={`${activeRoute === AppRoute.MESSAGES ? 'text-white' : 'text-[#94a3b8] opacity-60'}`}>
                  <ICONS.Messages />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] font-mono italic">Protocols</span>
                {activeRoute === AppRoute.MESSAGES && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-indigo-500 rounded-full" />
                )}
              </button>
            </div>

            {/* Global Settings/User Hub */}
            <div className="glass-panel citadel-pill p-1.5 flex items-center border-[#f1f5f9] bg-white/50 ml-4">
              <button 
                className="w-14 h-14 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all active:scale-90"
                onClick={() => onNavigate(AppRoute.ADMIN)}
              >
                <ICONS.Settings />
              </button>
            </div>
          </div>

          {/* MOBILE TOGGLE (Tablet/Mobile Only) */}
          <div className="lg:hidden">
            <button className="w-16 h-16 bg-[#050509] text-white rounded-full flex items-center justify-center shadow-xl">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7" /></svg>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
