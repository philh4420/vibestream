
import React, { useState, useEffect } from 'react';
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
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
  );

  useEffect(() => {
    const handleResize = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const NavItem = ({ route, icon: Icon, label, collapsed = false }: { route: AppRoute, icon: React.FC, label: string, collapsed?: boolean }) => {
    const isActive = activeRoute === route;
    return (
      <button 
        onClick={() => onNavigate(route)}
        title={collapsed ? label : undefined}
        className={`flex items-center transition-all duration-300 touch-active group relative ${
          collapsed 
            ? 'p-3 justify-center' 
            : 'gap-3 px-4 py-3'
        } ${
          isActive 
            ? 'text-indigo-600' 
            : 'text-slate-400 hover:text-slate-900'
        }`}
      >
        <div className={`relative z-10 ${isActive ? 'scale-110' : 'group-hover:scale-105'} transition-transform`}>
          <Icon />
        </div>
        {!collapsed && <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>}
        {isActive && collapsed && (
          <div className="absolute left-0 w-1 h-6 bg-indigo-600 rounded-r-full" />
        )}
        {isActive && !collapsed && (
          <div className="absolute inset-y-2 left-2 right-2 bg-indigo-50 -z-0 rounded-xl" />
        )}
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

      <div className="flex flex-1 overflow-hidden">
        
        {/* Navigation Sidebar: Expanded (Desktop Lg) */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-precision bg-white/50 backdrop-blur-xl p-4 gap-6 pt-[calc(var(--sat)+5rem)]">
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

        {/* Navigation Rail: Collapsed (Tablets & Mobile Landscape) */}
        {/* Added rail-safe-left to prevent landscape notch collision */}
        <aside className="hidden md:flex lg:hidden flex-col w-[calc(5rem+var(--sal))] shrink-0 border-r border-precision bg-white/50 backdrop-blur-xl py-6 items-center gap-8 pt-[calc(var(--sat)+5rem)] rail-safe-left">
          <div className="flex flex-col gap-2 w-full">
            <NavItem route={AppRoute.FEED} icon={ICONS.Home} label="Central" collapsed />
            <NavItem route={AppRoute.EXPLORE} icon={ICONS.Explore} label="Discover" collapsed />
            <NavItem route={AppRoute.MESSAGES} icon={ICONS.Messages} label="Neural" collapsed />
            <NavItem route={AppRoute.PROFILE} icon={ICONS.Profile} label="Identity" collapsed />
            {userRole === 'admin' && <NavItem route={AppRoute.ADMIN} icon={ICONS.Admin} label="Citadel" collapsed />}
          </div>
          
          <button 
            onClick={onOpenCreate}
            className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg hover:shadow-indigo-100 hover:bg-black transition-all touch-active group"
          >
            <ICONS.Create />
          </button>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 relative overflow-hidden flex flex-col pt-[calc(var(--sat)+4.5rem)]">
          <div className="flex-1 scroll-container px-4 sm:px-6 md:px-10 lg:px-14 py-6">
            <div className="max-w-4xl mx-auto w-full pb-[calc(var(--sab)+5rem)] md:pb-8">
              {children}
            </div>
          </div>
        </main>

        {/* Info Rail (Ultra Wide Desktop Only) */}
        <aside className="hidden xl:flex flex-col w-80 shrink-0 border-l border-precision bg-white/30 p-6 gap-6 pt-[calc(var(--sat)+5.5rem)]">
           <div className="bg-white/50 border-precision rounded-3xl p-6 backdrop-blur-sm shadow-sm">
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-6 font-mono">Grid_Resonance</h4>
              <div className="space-y-6">
                {[1,2,3].map(i => (
                  <div key={i} className="flex gap-4 items-start group cursor-pointer hover:translate-x-1 transition-transform">
                    <div className="shrink-0 w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-[11px] font-mono border-precision">0{i}</div>
                    <div className="overflow-hidden">
                      <p className="text-[11px] font-black text-slate-900 truncate tracking-tight">Signal_Burst_TX-0{i}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-1.5 font-mono">Encrypted Feed</p>
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </aside>
      </div>

      {/* Portrait Mobile Tab Bar - respects Home Indicator (SAB) */}
      <nav className={`${orientation === 'landscape' ? 'hidden' : 'md:hidden'} fixed bottom-0 left-0 right-0 glass-panel border-t border-precision z-[150] tab-safe-bottom`}>
        <div className="flex items-center justify-around py-2 px-2">
          <button onClick={() => onNavigate(AppRoute.FEED)} className={`p-3 rounded-xl transition-all touch-active ${activeRoute === AppRoute.FEED ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}>
            <ICONS.Home />
          </button>
          <button onClick={() => onNavigate(AppRoute.EXPLORE)} className={`p-3 rounded-xl transition-all touch-active ${activeRoute === AppRoute.EXPLORE ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}>
            <ICONS.Explore />
          </button>
          
          <button 
            onClick={onOpenCreate}
            className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-2xl active:scale-90 transition-transform -translate-y-5 ring-[6px] ring-[#fcfcfd]"
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

      {/* Compact Landscape Rail (Floating) - respects Side Notch (SAL) */}
      {orientation === 'landscape' && (
        <div className="md:hidden fixed left-[calc(var(--sal)+1rem)] top-1/2 -translate-y-1/2 flex flex-col gap-4 z-[300]">
           <div className="glass-panel p-2 rounded-2xl flex flex-col gap-1 border-precision shadow-2xl">
              <button onClick={() => onNavigate(AppRoute.FEED)} className={`p-2.5 rounded-xl transition-all touch-active ${activeRoute === AppRoute.FEED ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}>
                <ICONS.Home />
              </button>
              <button onClick={() => onNavigate(AppRoute.EXPLORE)} className={`p-2.5 rounded-xl transition-all touch-active ${activeRoute === AppRoute.EXPLORE ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}>
                <ICONS.Explore />
              </button>
              <button onClick={() => onNavigate(AppRoute.MESSAGES)} className={`p-2.5 rounded-xl transition-all touch-active ${activeRoute === AppRoute.MESSAGES ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}>
                <ICONS.Messages />
              </button>
              <button onClick={() => onNavigate(AppRoute.PROFILE)} className={`p-2.5 rounded-xl transition-all touch-active ${activeRoute === AppRoute.PROFILE ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}>
                <ICONS.Profile />
              </button>
           </div>
           <button 
            onClick={onOpenCreate}
            className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200 active:scale-90 transition-transform"
          >
            <ICONS.Create />
          </button>
        </div>
      )}
    </div>
  );
};
