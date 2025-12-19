
import React from 'react';
import { ICONS } from '../../constants';
import { AppRoute, UserRole } from '../../types';

interface LeftSidebarProps {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onOpenCreate: () => void;
  userRole: UserRole;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ 
  activeRoute, 
  onNavigate, 
  onOpenCreate, 
  userRole 
}) => {
  
  const NavItem = ({ route, icon: Icon, label, collapsed = false }: { 
    route: AppRoute, 
    icon: React.FC, 
    label: string, 
    collapsed?: boolean 
  }) => {
    const isActive = activeRoute === route;
    return (
      <button 
        onClick={() => onNavigate(route)}
        title={collapsed ? label : undefined}
        className={`flex items-center transition-all duration-300 touch-active group relative w-full ${
          collapsed 
            ? 'p-4 justify-center' 
            : 'gap-4 px-5 py-3.5'
        } ${
          isActive 
            ? 'text-indigo-600' 
            : 'text-slate-400 hover:text-slate-900'
        }`}
      >
        <div className={`relative z-10 transition-all duration-500 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(79,70,229,0.3)]' : 'group-hover:scale-110'}`}>
          <Icon />
        </div>
        
        {!collapsed && (
          <span className="text-[10px] font-black uppercase tracking-[0.25em] font-mono whitespace-nowrap">
            {label}
          </span>
        )}

        {/* Active Indicators */}
        {isActive && (
          <>
            <div className={`absolute inset-y-1.5 rounded-2xl bg-indigo-50/50 -z-0 transition-all duration-500 ${collapsed ? 'inset-x-2' : 'inset-x-3'}`} />
            <div className="absolute left-0 w-1 h-6 bg-indigo-600 rounded-r-full shadow-[0_0_12px_rgba(79,70,229,0.5)]" />
          </>
        )}
      </button>
    );
  };

  const navLinks = [
    { route: AppRoute.FEED, icon: ICONS.Home, label: 'Central_Hub' },
    { route: AppRoute.EXPLORE, icon: ICONS.Explore, label: 'Discover_Grid' },
    { route: AppRoute.MESSAGES, icon: ICONS.Messages, label: 'Neural_Comms' },
    { route: AppRoute.PROFILE, icon: ICONS.Profile, label: 'Identity_Link' },
  ];

  return (
    <>
      {/* Desktop Sidebar: Expanded (lg+) */}
      <aside 
        className="hidden lg:flex flex-col w-72 shrink-0 border-r border-precision bg-white/50 backdrop-blur-xl p-6 gap-8 pt-[calc(var(--header-h)+2rem)]"
        style={{ paddingLeft: 'max(1.5rem, var(--sal))' }}
      >
        <div className="space-y-2">
          <p className="px-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-6 font-mono opacity-60">System_Directives</p>
          <div className="space-y-1">
            {navLinks.map(link => (
              <NavItem key={link.route} {...link} />
            ))}
            {userRole === 'admin' && (
              <NavItem route={AppRoute.ADMIN} icon={ICONS.Admin} label="Citadel_Access" />
            )}
          </div>
        </div>

        <div className="px-3">
          <button 
            onClick={onOpenCreate}
            className="w-full bg-slate-900 text-white font-bold py-5 rounded-[1.5rem] shadow-2xl hover:bg-black hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all flex items-center justify-center gap-4 touch-active group"
          >
            <div className="scale-110 group-hover:rotate-90 transition-transform duration-500">
              <ICONS.Create />
            </div>
            <span className="uppercase tracking-[0.3em] text-[10px] font-black">Publish_Signal</span>
          </button>
        </div>

        {/* Capacity Indicator Mockup */}
        <div className="mt-auto p-5 glass-panel rounded-3xl border-slate-100 bg-slate-50/30">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono">Neural_Load</span>
            <span className="text-[8px] font-black text-indigo-600 font-mono">24%</span>
          </div>
          <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 w-[24%] rounded-full" />
          </div>
        </div>
      </aside>

      {/* Tablet Rail: Compact (md to lg) */}
      <aside 
        className="hidden md:flex lg:hidden flex-col shrink-0 border-r border-precision bg-white/50 backdrop-blur-xl py-8 items-center gap-10 pt-[calc(var(--header-h)+2rem)]" 
        style={{ 
          width: 'calc(5.5rem + var(--sal))',
          paddingLeft: 'var(--sal)',
          paddingRight: '0.5rem'
        }}
      >
        <div className="flex flex-col gap-4 w-full items-center">
          {navLinks.map(link => (
            <NavItem key={link.route} {...link} collapsed />
          ))}
          {userRole === 'admin' && (
            <NavItem route={AppRoute.ADMIN} icon={ICONS.Admin} label="Citadel" collapsed />
          )}
        </div>
        
        <button 
          onClick={onOpenCreate}
          className="w-14 h-14 bg-slate-900 text-white rounded-[1.25rem] flex items-center justify-center shadow-xl hover:bg-black transition-all active:scale-90 group"
        >
          <div className="group-hover:rotate-90 transition-transform duration-500">
            <ICONS.Create />
          </div>
        </button>
      </aside>
    </>
  );
};
