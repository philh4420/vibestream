import React from 'react';
import { ICONS } from '../../constants';
import { AppRoute, UserRole, Region, User as VibeUser } from '../../types';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onOpenCreate: () => void;
  onLogout: () => void;
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
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 touch-active group ${
          isActive 
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
            : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900'
        }`}
      >
        <div className={`${isActive ? 'scale-110' : 'group-hover:scale-105'} transition-transform`}>
          <Icon />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
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
        onLogout={onLogout} 
        activeRoute={activeRoute}
        onNavigate={onNavigate}
      />

      <div className="flex flex-1 overflow-hidden pt-16 md:pt-20">
        {/* Navigation Sidebar (Desktop Only) */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-precision bg-white/50 backdrop-blur-xl p-4 gap-6">
          <div className="space-y-1">
            <p className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4 font-mono">Core_Systems</p>
            <NavItem route={AppRoute.FEED} icon={ICONS.Home} label="Central" />
            <NavItem route={AppRoute.EXPLORE} icon={ICONS.Explore} label="Discover" />
            <NavItem route={AppRoute.MESSAGES} icon={ICONS.Messages} label="Neural" />
            <NavItem route={AppRoute.PROFILE} icon={ICONS.Profile} label="Identity" />
            {userRole === 'admin' && <NavItem route={AppRoute.ADMIN} icon={ICONS.Admin} label="Citadel" />}
          </div>

          <button 
            onClick={onOpenCreate}
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2 touch-active group"
          >
            <div className="scale-90 group-hover:rotate-90 transition-transform"><ICONS.Create /></div>
            <span className="uppercase tracking-[0.3em] text-[10px]">New_Signal</span>
          </button>
        </aside>

        {/* Viewport Content Container */}
        <main className="flex-1 relative overflow-hidden flex flex-col">
          <div className="flex-1 scroll-container px-4 md:px-10 lg:px-14 py-6">
            <div className="max-w-3xl mx-auto w-full pb-24 md:pb-8">
              {children}
            </div>
          </div>
        </main>

        {/* Resilience Rail (Large Desktop Only) */}
        <aside className="hidden xl:flex flex-col w-72 shrink-0 border-l border-precision bg-white/30 p-6 gap-6">
           <div className="bg-white/50 border-precision rounded-2xl p-5 backdrop-blur-sm">
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-5 font-mono">Grid_Resonance</h4>
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="flex gap-4 items-center group cursor-pointer hover:translate-x-1 transition-transform">
                    <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-black text-[11px] font-mono border-precision">#{i}</div>
                    <div>
                      <p className="text-[11px] font-black text-slate-900 leading-none tracking-tight">Protocol_Delt_0{i}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-1.5 font-mono">1.{i}k Nodes Active</p>
                    </div>
                  </div>
                ))}
              </div>
           </div>
           
           <div className="mt-auto p-4 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-100 relative overflow-hidden group cursor-help">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2 transition-transform group-hover:scale-150" />
              <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-1 font-mono">System_Status</p>
              <p className="text-xs font-bold leading-tight">All GB-LON nodes operating at optimal latency.</p>
           </div>
        </aside>
      </div>

      {/* High-Fidelity Mobile Navigation Tab-Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-precision z-[150] safe-bottom">
        <div className="flex items-center justify-around py-2.5 px-2">
          <button onClick={() => onNavigate(AppRoute.FEED)} className={`p-3 rounded-xl transition-all touch-active ${activeRoute === AppRoute.FEED ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}>
            <ICONS.Home />
          </button>
          <button onClick={() => onNavigate(AppRoute.EXPLORE)} className={`p-3 rounded-xl transition-all touch-active ${activeRoute === AppRoute.EXPLORE ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}>
            <ICONS.Explore />
          </button>
          <button 
            onClick={onOpenCreate}
            className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-2xl active:scale-90 transition-transform -translate-y-3 ring-[6px] ring-white"
          >
            <ICONS.Create />
          </button>
          <button onClick={() => onNavigate(AppRoute.MESSAGES)} className={`p-3 rounded-xl transition-all touch-active ${activeRoute === AppRoute.MESSAGES ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}>
            <ICONS.Messages />
          </button>
          <button onClick={() => onNavigate(AppRoute.PROFILE)} className={`p-3 rounded-xl transition-all touch-active ${activeRoute === AppRoute.PROFILE ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}>
            <ICONS.Profile />
          </button>
        </div>
      </nav>
    </div>
  );
};