
import React from 'react';
import { ICONS } from '../../constants';
import { AppRoute, UserRole, Region, User as VibeUser } from '../../types';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onOpenCreate: () => void;
  onLogout?: () => void;
  userRole?: UserRole;
  userData: VibeUser | null;
  currentRegion: Region;
  onRegionChange: (region: Region) => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeRoute, 
  onNavigate, 
  onOpenCreate, 
  onLogout,
  userRole = 'member',
  userData,
  currentRegion,
  onRegionChange
}) => {
  const NavItem = ({ route, icon: Icon, label }: { route: AppRoute, icon: React.FC, label: string }) => {
    const isActive = activeRoute === route;
    return (
      <button 
        onClick={() => onNavigate(route)}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 touch-active group ${
          isActive 
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
            : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900'
        }`}
      >
        <div className={`${isActive ? 'scale-110' : 'group-hover:scale-105'} transition-transform`}>
          <Icon />
        </div>
        <span className="text-sm font-semibold tracking-tight uppercase tracking-wider text-[11px]">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#fcfcfd] overflow-hidden">
      <Header 
        userRole={userRole} 
        userData={userData}
        currentRegion={currentRegion} 
        onRegionChange={onRegionChange} 
        onLogout={onLogout || (() => {})} 
        activeRoute={activeRoute}
        onNavigate={onNavigate}
      />

      <div className="flex flex-1 overflow-hidden pt-20 md:pt-24">
        {/* Navigation Rail / Sidebar */}
        <aside className="hidden lg:flex flex-col w-72 shrink-0 border-r border-precision bg-white/50 backdrop-blur-xl p-6 gap-8">
          <div className="space-y-1">
            <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Core Systems</p>
            <NavItem route={AppRoute.FEED} icon={ICONS.Home} label="Central Stream" />
            <NavItem route={AppRoute.EXPLORE} icon={ICONS.Explore} label="Discovery" />
            <NavItem route={AppRoute.MESSAGES} icon={ICONS.Messages} label="Comms" />
            <NavItem route={AppRoute.PROFILE} icon={ICONS.Profile} label="Identity" />
            {userRole === 'admin' && <NavItem route={AppRoute.ADMIN} icon={ICONS.Admin} label="Admin" />}
          </div>

          <button 
            onClick={onOpenCreate}
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 touch-active"
          >
            <ICONS.Create />
            <span className="uppercase tracking-widest text-[11px]">New Signal</span>
          </button>

          <div className="mt-auto pt-6 border-t border-precision">
            <div className="flex items-center gap-3 px-4 mb-6">
              <img src={userData?.avatarUrl} className="w-10 h-10 rounded-lg object-cover border-precision" alt="" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{userData?.displayName}</p>
                <p className="text-[10px] text-slate-400 font-medium">@{userData?.username}</p>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-rose-600 rounded-xl transition-all font-bold text-[11px] uppercase tracking-wider"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
              Terminate Session
            </button>
          </div>
        </aside>

        {/* Main Fluid Container */}
        <main className="flex-1 relative overflow-hidden flex flex-col">
          <div className="flex-1 scroll-container px-4 md:px-8 lg:px-12 py-6">
            <div className="max-w-4xl mx-auto w-full pb-24 md:pb-6">
              {children}
            </div>
          </div>
        </main>

        {/* Right Info Panel (Desktop Only) */}
        <aside className="hidden xl:flex flex-col w-80 shrink-0 border-l border-precision bg-white/30 p-8 gap-8">
           <div className="bg-white/50 border-precision rounded-2xl p-6">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Grid Resonance</h4>
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="flex gap-3 items-center group cursor-pointer">
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-xs group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      #{i}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Precision Protocol</p>
                      <p className="text-[10px] text-slate-400">1.2k Signals</p>
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </aside>
      </div>

      {/* High-Fidelity Mobile Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-precision z-[150] safe-bottom">
        <div className="flex items-center justify-around py-2 px-1">
          <button onClick={() => onNavigate(AppRoute.FEED)} className={`p-3 rounded-xl transition-all ${activeRoute === AppRoute.FEED ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}>
            <ICONS.Home />
          </button>
          <button onClick={() => onNavigate(AppRoute.EXPLORE)} className={`p-3 rounded-xl transition-all ${activeRoute === AppRoute.EXPLORE ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}>
            <ICONS.Explore />
          </button>
          <button 
            onClick={onOpenCreate}
            className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-xl active:scale-90 transition-transform -translate-y-2"
          >
            <ICONS.Create />
          </button>
          <button onClick={() => onNavigate(AppRoute.MESSAGES)} className={`p-3 rounded-xl transition-all ${activeRoute === AppRoute.MESSAGES ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}>
            <ICONS.Messages />
          </button>
          <button onClick={() => onNavigate(AppRoute.PROFILE)} className={`p-3 rounded-xl transition-all ${activeRoute === AppRoute.PROFILE ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}>
            <ICONS.Profile />
          </button>
        </div>
      </nav>
    </div>
  );
};
