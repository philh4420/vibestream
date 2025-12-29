
import React, { useState, useEffect } from 'react';
import { ICONS } from '../../constants';
import { AppRoute, UserRole, Region, User as VibeUser, AppNotification, WeatherInfo, SystemSettings } from '../../types';
import { Header } from './Header';
import { RightSidebar } from './RightSidebar';
import { LeftSidebar } from './LeftSidebar';
import { AtmosphericBackground } from '../messages/AtmosphericBackground';

interface LayoutProps {
  children: React.ReactNode;
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onOpenCreate: () => void;
  onLogout: () => void;
  userRole?: UserRole;
  userData: VibeUser | null;
  notifications: AppNotification[];
  onMarkRead: () => void;
  onDeleteNotification: (id: string) => void;
  currentRegion: Region;
  onRegionChange: (region: Region) => void;
  onSearch: (query: string) => void;
  weather?: WeatherInfo | null;
  systemSettings?: SystemSettings;
  onOpenSettings?: () => void;
  blockedIds?: Set<string>;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeRoute, 
  onNavigate, 
  onOpenCreate, 
  onLogout,
  userRole = 'member',
  userData,
  notifications,
  onMarkRead,
  onDeleteNotification,
  currentRegion, 
  onRegionChange, 
  onSearch,
  weather = null,
  systemSettings,
  onOpenSettings,
  blockedIds
}) => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    typeof window !== 'undefined' ? (window.innerHeight > window.innerWidth ? 'portrait' : 'landscape') : 'portrait'
  );

  useEffect(() => {
    const handleResize = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMessageView = activeRoute === AppRoute.MESSAGES;

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-slate-50 dark:bg-slate-950 overflow-hidden fixed inset-0">
      <Header 
        userRole={userRole} 
        userData={userData}
        notifications={notifications}
        onMarkRead={onMarkRead}
        onDeleteNotification={onDeleteNotification}
        currentRegion={currentRegion} 
        onRegionChange={onRegionChange} 
        onLogout={onLogout} 
        activeRoute={activeRoute}
        onNavigate={onNavigate}
        onSearch={onSearch}
        onOpenSettings={onOpenSettings}
      />

      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Navigation - Left Sidebar */}
        <div className="relative z-[100] h-full shrink-0">
          <LeftSidebar 
            activeRoute={activeRoute}
            onNavigate={onNavigate}
            onOpenCreate={onOpenCreate}
            userRole={userRole}
            userData={userData}
            systemSettings={systemSettings}
          />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 relative overflow-hidden flex flex-col min-w-0 z-10">
          <AtmosphericBackground weather={weather}>
            <div 
              className={`flex-1 relative z-10 w-full overflow-hidden flex flex-col ${
                isMessageView 
                  ? 'p-0 md:p-4' // Message view needs edge-to-edge for full card feel
                  : 'px-4 md:px-6 lg:px-8 xl:px-12 py-6 overflow-y-auto custom-scrollbar'
              }`} 
            >
              <div className="w-full h-full relative flex flex-col">
                {children}
              </div>
            </div>
          </AtmosphericBackground>
        </main>

        {/* Dynamic Nodes - Right Sidebar */}
        <div className="relative z-[100] h-full hidden xl:block shrink-0">
          <RightSidebar 
            userData={userData} 
            weather={weather} 
            onNavigate={onNavigate} 
            blockedIds={blockedIds}
          />
        </div>
      </div>

      {/* Tab bar for mobile portrait */}
      <nav className={`${orientation === 'landscape' ? 'hidden' : 'md:hidden'} shrink-0 glass-panel border-t border-precision z-[150] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]`} style={{ height: 'calc(var(--bottom-nav-h) + env(safe-area-inset-bottom))' }}>
        <div className="flex items-center justify-around h-[var(--bottom-nav-h)] px-2">
          <button onClick={() => onNavigate(AppRoute.FEED)} className={`p-3 rounded-xl transition-all tap-feedback relative ${activeRoute === AppRoute.FEED ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-400'}`}>
            <ICONS.Home />
          </button>

          <button onClick={() => onNavigate(AppRoute.STREAM_GRID)} className={`p-3 rounded-xl transition-all tap-feedback relative ${activeRoute === AppRoute.STREAM_GRID ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-400'}`}>
            <ICONS.Streams />
            <div className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
          </button>
          
          <div className="relative w-14 h-14">
            <button 
              onClick={onOpenCreate}
              className="absolute bottom-4 left-0 w-14 h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl flex items-center justify-center shadow-2xl active:scale-90 transition-transform ring-[6px] ring-[#fcfcfd] dark:ring-slate-950 group z-20"
            >
              <ICONS.Create />
            </button>
          </div>

          <button onClick={() => onNavigate(AppRoute.MESSAGES)} className={`p-3 rounded-xl transition-all tap-feedback relative ${activeRoute === AppRoute.MESSAGES ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 shadow-inner' : 'text-slate-400'}`}>
            <ICONS.Messages />
          </button>

          <button onClick={() => onNavigate(AppRoute.PROFILE)} className={`p-3 rounded-xl transition-all tap-feedback ${activeRoute === AppRoute.PROFILE ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 shadow-inner' : 'text-slate-400'}`}>
            <div className="w-6 h-6 rounded-lg overflow-hidden border border-current p-0.5">
              <img src={userData?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=user`} className="w-full h-full object-cover rounded-sm" alt="" />
            </div>
          </button>
        </div>
      </nav>
    </div>
  );
};
