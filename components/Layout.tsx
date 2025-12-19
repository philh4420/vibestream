
import React from 'react';
import { ICONS, MOCK_USER } from '../constants';
import { AppRoute } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onOpenCreate: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeRoute, onNavigate, onOpenCreate }) => {
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
      {/* Top Header - Desktop only */}
      <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-slate-100 bg-white/80 backdrop-blur-md z-30 sticky top-0">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <span className="text-white font-bold text-xl italic">V</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800 font-outfit">VibeStream</span>
        </div>
        
        <div className="flex-1 max-w-xl mx-12">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <ICONS.Explore />
            </div>
            <input 
              type="text" 
              placeholder="Search VibeStream..." 
              className="w-full bg-slate-50 border-none rounded-2xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2.5 bg-slate-50 text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
          </button>
          <img src={MOCK_USER.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-100" />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-72 border-r border-slate-100 bg-white p-6 gap-2">
          <NavItem route={AppRoute.FEED} icon={ICONS.Home} label="Feed" />
          <NavItem route={AppRoute.EXPLORE} icon={ICONS.Explore} label="Explore" />
          <NavItem route={AppRoute.MESSAGES} icon={ICONS.Messages} label="Messages" />
          <NavItem route={AppRoute.COMMUNITIES} icon={ICONS.Communities} label="Communities" />
          <NavItem route={AppRoute.PROFILE} icon={ICONS.Profile} label="Profile" />

          <button 
            onClick={onOpenCreate}
            className="mt-6 w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <ICONS.Create />
            <span>New Post</span>
          </button>

          <div className="mt-auto p-4 bg-slate-50 rounded-2xl">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Trending Groups</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center font-bold text-xs">UK</div>
                <span className="text-sm font-medium text-slate-700">Tech London</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs">AI</div>
                <span className="text-sm font-medium text-slate-700">Future Minds</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 h-full overflow-y-auto scroll-smooth bg-slate-50 pb-24 md:pb-0">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
            {children}
          </div>
        </main>

        {/* Right Sidebar - Desktop Large Screens */}
        <aside className="hidden xl:flex flex-col w-80 border-l border-slate-100 bg-white p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Who to follow</h3>
          <div className="space-y-4 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={`https://picsum.photos/100/100?random=${i+10}`} className="w-10 h-10 rounded-full" alt="Suggested" />
                  <div>
                    <p className="text-sm font-bold text-slate-900 leading-tight">User {i}</p>
                    <p className="text-xs text-slate-500">@user_{i}</p>
                  </div>
                </div>
                <button className="text-indigo-600 text-xs font-bold hover:underline">Follow</button>
              </div>
            ))}
          </div>
          
          <h3 className="text-lg font-bold text-slate-900 mb-4">Latest Media</h3>
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-square rounded-xl bg-slate-100 overflow-hidden">
                <img src={`https://picsum.photos/200/200?random=${i+20}`} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity cursor-pointer" alt="Media" />
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* Bottom Nav - Mobile only */}
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
          <NavItem route={AppRoute.MESSAGES} icon={ICONS.Messages} label="Chat" />
          <NavItem route={AppRoute.PROFILE} icon={ICONS.Profile} label="Me" />
        </div>
      </nav>
    </div>
  );
};
