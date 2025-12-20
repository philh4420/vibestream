
import React from 'react';
import { ICONS } from '../../constants';
import { AppRoute, UserRole, User as VibeUser } from '../../types';

interface LeftSidebarProps {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onOpenCreate: () => void;
  userRole: UserRole;
  userData: VibeUser | null;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ 
  activeRoute, 
  onNavigate, 
  onOpenCreate, 
  userRole,
  userData
}) => {
  
  const NavItem = ({ route, icon: Icon, label, customIcon, collapsed = false }: { 
    route?: AppRoute, 
    icon?: React.FC, 
    label: string, 
    customIcon?: React.ReactNode,
    collapsed?: boolean 
  }) => {
    const isActive = route && activeRoute === route;
    return (
      <button 
        onClick={() => route && onNavigate(route)}
        title={collapsed ? label : undefined}
        className={`flex items-center transition-all duration-200 touch-active group relative w-full rounded-xl ${
          collapsed 
            ? 'p-3 justify-center' 
            : 'gap-4 px-3 py-2.5'
        } ${
          isActive 
            ? 'bg-indigo-50 text-indigo-600' 
            : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        <div className={`relative z-10 transition-all duration-300 flex items-center justify-center ${isActive ? 'scale-105' : 'group-hover:scale-105'}`}>
          {Icon ? <Icon /> : customIcon}
        </div>
        
        {!collapsed && (
          <span className={`text-sm font-bold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis ${isActive ? 'text-indigo-700' : 'text-slate-800'}`}>
            {label}
          </span>
        )}

        {/* Subtle Indicator */}
        {isActive && !collapsed && (
          <div className="absolute left-0 w-1 h-6 bg-indigo-600 rounded-r-full" />
        )}
      </button>
    );
  };

  const navLinks = [
    { route: AppRoute.FEED, icon: ICONS.Home, label: 'Central Hub' },
    { route: AppRoute.EXPLORE, icon: ICONS.Explore, label: 'Discover Grid' },
    { route: AppRoute.MESSAGES, icon: ICONS.Messages, label: 'Neural Comms' },
  ];

  const sidebarContent = (collapsed: boolean) => (
    <div className={`flex flex-col gap-6 w-full ${collapsed ? 'items-center' : ''}`}>
      {/* Profile Link - Top Priority */}
      <div className="w-full">
        <button 
          onClick={() => onNavigate(AppRoute.PROFILE)}
          className={`flex items-center transition-all duration-200 w-full rounded-xl group ${
            collapsed ? 'p-1 justify-center' : 'gap-4 px-3 py-2'
          } ${activeRoute === AppRoute.PROFILE ? 'bg-indigo-50' : 'hover:bg-slate-100'}`}
        >
          <div className={`shrink-0 transition-transform duration-300 ${activeRoute === AppRoute.PROFILE ? 'scale-110' : 'group-hover:scale-110'}`}>
            <img 
              src={userData?.avatarUrl} 
              className={`rounded-full object-cover border-2 border-white shadow-sm ${collapsed ? 'w-10 h-10' : 'w-9 h-9'}`} 
              alt="Me" 
            />
          </div>
          {!collapsed && (
            <span className={`text-sm font-extrabold tracking-tight truncate ${activeRoute === AppRoute.PROFILE ? 'text-indigo-700' : 'text-slate-900'}`}>
              {userData?.displayName.split(' ')[0]}
            </span>
          )}
        </button>
      </div>

      {/* Main Grid Navigation */}
      <div className="space-y-1 w-full">
        {!collapsed && (
          <p className="px-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2 font-mono">Protocols</p>
        )}
        {navLinks.map(link => (
          <NavItem key={link.route} {...link} collapsed={collapsed} />
        ))}
        {userRole === 'admin' && (
          <NavItem route={AppRoute.ADMIN} icon={ICONS.Admin} label="Citadel Command" collapsed={collapsed} />
        )}
      </div>

      {/* Shortcuts Section */}
      <div className="space-y-1 w-full">
        {!collapsed && (
          <p className="px-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2 font-mono">Your Mesh</p>
        )}
        <NavItem 
          label="Neural Groups" 
          collapsed={collapsed}
          customIcon={<div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-[10px] font-black">GP</div>} 
        />
        <NavItem 
          label="Marketplace" 
          collapsed={collapsed}
          customIcon={<div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center text-[10px] font-black">MP</div>} 
        />
        <NavItem 
          label="Saved Signals" 
          collapsed={collapsed}
          customIcon={<div className="w-6 h-6 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center text-[10px] font-black">SV</div>} 
        />
      </div>

      {/* CTA Button */}
      {!collapsed && (
        <div className="mt-4 px-1">
          <button 
            onClick={onOpenCreate}
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95 group"
          >
            <div className="scale-90 group-hover:rotate-12 transition-transform duration-500">
              <ICONS.Create />
            </div>
            <span className="uppercase tracking-[0.2em] text-[9px] font-black">Uplink</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar: Expanded (lg+) */}
      <aside 
        className="hidden lg:flex flex-col w-[300px] shrink-0 border-r border-precision bg-[#fcfcfd] p-4 gap-8 pt-[calc(var(--header-h)+1.5rem)] overflow-y-auto no-scrollbar h-full"
        style={{ paddingLeft: 'max(1rem, var(--sal))' }}
      >
        {sidebarContent(false)}

        {/* Sidebar Footer */}
        <div className="mt-auto pt-8 px-3">
          <div className="space-y-3 opacity-40">
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">
              <span>Privacy</span>
              <span>Terms</span>
              <span>Cookies</span>
              <span>Infrastructure</span>
            </div>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">VibeStream Node 2.6 © 2026</p>
          </div>
        </div>
      </aside>

      {/* Tablet Rail: Compact (md to lg) */}
      <aside 
        className="hidden md:flex lg:hidden flex-col shrink-0 border-r border-precision bg-[#fcfcfd] py-6 items-center pt-[calc(var(--header-h)+1.5rem)] h-full" 
        style={{ 
          width: 'calc(5rem + var(--sal))',
          paddingLeft: 'var(--sal)'
        }}
      >
        {sidebarContent(true)}
        
        <button 
          onClick={onOpenCreate}
          className="mt-6 w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-black transition-all active:scale-90 group"
        >
          <ICONS.Create />
        </button>
      </aside>
    </>
  );
};
