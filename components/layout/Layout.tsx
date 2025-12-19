
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
        className={`flex flex-col md:flex-row items-center gap-1 md:gap-4 p-2 md:px-6 md:py-3.5 rounded-2xl transition-all duration-200 active:scale-95 ${isActive ? 'text-indigo-600 md:bg-indigo-50/80 font-black' : 'text-slate-400 hover:text-slate-600 md:hover:bg-slate-50 font-bold'}`}
      >
        <Icon />
        <span className="text-[10px] md:text-[14px] uppercase tracking-tighter md:tracking-normal">{label}</span>
      </button>
    );
  };

  const isAdmin = userRole === 'admin';

  return (
    <div className="flex flex-col min-h-screen w-full bg-slate-50 relative">
      {/* FIXED HEADER - NOW WITH NAV PROPS */}
      <Header 
        userRole={userRole} 
        userData={userData}
        currentRegion={currentRegion} 
        onRegionChange={onRegionChange} 
        onLogout={onLogout || (() => {})} 
        activeRoute={activeRoute}
        onNavigate={onNavigate}
      />

      <div className="flex flex-1 pt-20 md:pt-24 relative">
        {/* DESKTOP SIDEBAR - STICKY POSITIONING */}
        <aside className="hidden lg:flex flex-col w-80 shrink-0 h-[calc(100vh-6rem)] sticky top-24 border-r border-slate-200/60 bg-white p-8 gap-3">
          <div className="mb-6">
            <h4 className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Neural Grid</h4>
            <div className="space-y-1">
              <NavItem route={AppRoute.FEED} icon={ICONS.Home} label="Central Feed" />
              <NavItem route={AppRoute.EXPLORE} icon={ICONS.Explore} label="Discovery Hub" />
              <NavItem route={AppRoute.MESSAGES} icon={ICONS.Messages} label="Neural Comms" />
              <NavItem route={AppRoute.PROFILE} icon={ICONS.Profile} label="Neural Identity" />
              {isAdmin && <NavItem route={AppRoute.ADMIN} icon={ICONS.Admin} label="Citadel Command" />}
            </div>
          </div>
          
          <button 
            onClick={onOpenCreate}
            className="mt-4 w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            <ICONS.Create />
            <span className="uppercase tracking-widest text-sm">New Broadcast</span>
          </button>

          <div className="mt-auto pt-6 border-t border-slate-100">
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-4 px-6 py-4 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all font-bold group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
              <span className="uppercase tracking-widest text-xs">Terminate Link</span>
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT AREA - NATURAL SCROLLING */}
        <main className="flex-1 min-h-full bg-slate-50">
          <div className="max-w-4xl mx-auto px-4 md:px-12 py-8 md:py-10 pb-32 md:pb-12">
            {children}
          </div>
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION - FIXED AT BOTTOM */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-[20px] border-t border-slate-200/80 z-[150] safe-bottom">
        <div className="flex items-center justify-around py-3 px-2">
          <NavItem route={AppRoute.FEED} icon={ICONS.Home} label="Feed" />
          <NavItem route={AppRoute.EXPLORE} icon={ICONS.Explore} label="Explore" />
          
          <button 
            onClick={onOpenCreate}
            className="w-12 h-12 bg-indigo-600 text-white rounded-[1.2rem] flex items-center justify-center shadow-xl shadow-indigo-200 active:scale-90 transition-transform -translate-y-4 border-4 border-white"
          >
            <ICONS.Create />
          </button>
          
          <NavItem route={AppRoute.MESSAGES} icon={ICONS.Messages} label="Chat" />
          <NavItem route={AppRoute.PROFILE} icon={ICONS.Profile} label="Me" />
        </div>
      </nav>
    </div>
  );
};
