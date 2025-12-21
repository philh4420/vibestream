
import React, { useState, useEffect } from 'react';
import { ICONS } from '../../constants';
import { AppRoute, UserRole, Region, User as VibeUser } from '../../types';
import { Header } from './Header';
import { RightSidebar } from './RightSidebar';
import { LeftSidebar } from './LeftSidebar';

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
    typeof window !== 'undefined' ? (window.innerHeight > window.innerWidth ? 'portrait' : 'landscape') : 'portrait'
  );

  useEffect(() => {
    const handleResize = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        
        {/* Dynamic Left Navigation System */}
        <LeftSidebar 
          activeRoute={activeRoute}
          onNavigate={onNavigate}
          onOpenCreate={onOpenCreate}
          userRole={userRole}
          userData={userData}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 relative overflow-hidden flex flex-col pt-[var(--header-h)]">
          <div className="flex-1 scroll-container px-4 sm:px-6 md:px-10 lg:px-14 py-6" style={{ paddingLeft: 'max(1.25rem, var(--sal))', paddingRight: 'max(1.25rem, var(--sar))' }}>
            <div className="max-w-[1920px] mx-auto w-full pb-[calc(var(--bottom-nav-h)+2.5rem)] md:pb-16">
              {children}
            </div>
          </div>
        </main>

        {/* Refined Right Sidebar */}
        <RightSidebar userData={userData} />
      </div>

      {/* Portrait Mobile Tab Bar */}
      <nav className={`${orientation === 'landscape' ? 'hidden' : 'md:hidden'} fixed bottom-0 left-0 right-0 glass-panel border-t border-precision z-[150]`} style={{ height: 'var(--bottom-nav-h)', paddingBottom: 'var(--sab)' }}>
        <div className="flex items-center justify-around h-full px-2">
          <button onClick={() => onNavigate(AppRoute.FEED)} className={`p-3 rounded-xl transition-all touch-active relative ${activeRoute === AppRoute.FEED ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}>
            <ICONS.Home />
          </button>
          <button onClick={() => onNavigate(AppRoute.STREAM_GRID)} className={`p-3 rounded-xl transition-all touch-active relative ${activeRoute === AppRoute.STREAM_GRID ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}>
            <ICONS.Streams />
            <div className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
          </button>
          <button 
            onClick={onOpenCreate}
            className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-2xl active:scale-90 transition-transform -translate-y-5 ring-[6px] ring-[#fcfcfd] group"
          >
            <div className="group-active:rotate-90 transition-transform duration-300">
              <ICONS.Create />
            </div>
          </button>
          <button onClick={() => onNavigate(AppRoute.CLUSTERS)} className={`p-3 rounded-xl transition-all touch-active relative ${activeRoute === AppRoute.CLUSTERS ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}>
            <ICONS.Clusters />
          </button>
          <button onClick={() => onNavigate(AppRoute.PROFILE)} className={`p-3 rounded-xl transition-all touch-active ${activeRoute === AppRoute.PROFILE ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}>
            <div className="w-6 h-6 rounded-lg overflow-hidden border border-current p-0.5">
              <img src={userData?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=user`} className="w-full h-full object-cover rounded-sm grayscale group-active:grayscale-0" alt="" />
            </div>
          </button>
        </div>
      </nav>
    </div>
  );
};
