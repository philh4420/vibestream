
import React from 'react';
import { ICONS, MOCK_USER } from '../../constants';
import { AppRoute } from '../../types';

interface LayoutProps {
  children: React.ReactNode;
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onOpenCreate: () => void;
  onLogout?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeRoute, onNavigate, onOpenCreate, onLogout }) => {
  const NavItem = ({ route, icon: Icon, label }: { route: AppRoute, icon: React.FC, label: string }) => {
    const isActive = activeRoute === route;
    return (
      <button 
        onClick={() => onNavigate(route)}
        className={`flex flex-col md:flex-row items-center gap-1 md:gap-4 p-2 md:px-6 md:py-3 rounded-2xl transition-all duration-300 ${isActive ? 'text-indigo-600 md:bg-indigo-50 font-bold' : 'text-slate-400 hover:text-slate-600 md:hover:bg-slate-50 font-medium'}`}
      >
        <Icon />
        <span className="text-[10px] md:text-base md:block">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full w-full max-w-[1920px] mx-auto overflow-hidden">
      <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-slate-100 bg-white/80 backdrop-blur-md z-30 sticky top-0">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <span className="text-white font-bold text-xl italic">V</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800 font-outfit">VibeStream</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all text-sm font-bold"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
            <span className="hidden lg:inline">Sign Out</span>
          </button>
          <img src={MOCK_USER.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-100" />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="hidden lg:flex flex-col w-72 border-r border-slate-100 bg-white p-6 gap-2">
          <NavItem route={AppRoute.FEED} icon={ICONS.Home} label="Feed" />
          <NavItem route={AppRoute.EXPLORE} icon={ICONS.Explore} label="Explore" />
          <NavItem route={AppRoute.PROFILE} icon={ICONS.Profile} label="Profile" />
          
          <button 
            onClick={onOpenCreate}
            className="mt-6 w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <ICONS.Create />
            <span>New Post</span>
          </button>

          <div className="mt-auto pt-6 border-t border-slate-100">
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-4 px-6 py-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all font-medium group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 transition-transform group-hover:translate-x-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
              <span>Secure Sign Out</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 h-full overflow-y-auto scroll-smooth bg-slate-50 pb-24 md:pb-0">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
            {children}
          </div>
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-50 safe-bottom">
        <div className="flex items-center justify-around py-3 px-2">
          <NavItem route={AppRoute.FEED} icon={ICONS.Home} label="Home" />
          <NavItem route={AppRoute.EXPLORE} icon={ICONS.Explore} label="Explore" />
          <button 
            onClick={onOpenCreate}
            className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 active:scale-90 transition-transform -translate-y-2 border-4 border-white"
          >
            <ICONS.Create />
          </button>
          <NavItem route={AppRoute.PROFILE} icon={ICONS.Profile} label="Me" />
          <button 
            onClick={onLogout}
            className="flex flex-col items-center gap-1 p-2 text-slate-400 active:text-rose-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
            <span className="text-[10px]">Exit</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
