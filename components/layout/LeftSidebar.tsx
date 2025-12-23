
import React from 'react';
import { ICONS } from '../../constants';
import { AppRoute, UserRole, User as VibeUser, AppNotification } from '../../types';
import { auth } from '../../services/firebase';

interface LeftSidebarProps {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onOpenCreate: () => void;
  userRole: UserRole;
  userData: VibeUser | null;
  notifications?: AppNotification[];
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ 
  activeRoute, 
  onNavigate, 
  userRole,
  userData,
  notifications = []
}) => {
  
  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  // Determine verification status
  const isVerified = userData?.verifiedHuman || ['verified', 'creator', 'admin'].includes(userData?.role || '');

  const NavItem = ({ route, icon: Icon, label, customIcon, collapsed = false, badge, isSubItem = false }: { 
    route?: AppRoute, 
    icon?: React.FC, 
    label: string, 
    customIcon?: React.ReactNode,
    collapsed?: boolean,
    badge?: string | number,
    isSubItem?: boolean
  }) => {
    const isActive = route && activeRoute === route;
    return (
      <button 
        onClick={() => route && onNavigate(route)}
        title={collapsed ? label : undefined}
        className={`group relative flex items-center w-full transition-all duration-300 ease-out outline-none tap-feedback ${
          collapsed 
            ? 'justify-center p-3 rounded-2xl' 
            : `px-4 py-3 gap-4 rounded-2xl ${isSubItem ? 'ml-2 w-[calc(100%-0.5rem)]' : ''}`
        } ${
          isActive 
            ? 'bg-slate-900 text-white shadow-xl shadow-indigo-900/10' 
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        {/* Active Indicator Glow */}
        {isActive && !collapsed && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full shadow-[0_0_12px_rgba(99,102,241,0.6)]" />
        )}

        <div className={`relative z-10 flex items-center justify-center transition-transform duration-300 ${isActive ? 'scale-100' : 'group-hover:scale-110'}`}>
          {Icon ? <Icon /> : customIcon}
        </div>
        
        {!collapsed && (
          <div className="flex-1 flex items-center justify-between min-w-0">
            <span className={`text-[13px] font-bold tracking-tight truncate ${isActive ? 'text-white' : 'text-slate-600 group-hover:text-slate-900'}`}>
              {label}
            </span>
            {badge !== undefined && (typeof badge === 'number' ? badge > 0 : badge !== '') && (
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ml-2 shadow-sm ${isActive ? 'bg-white text-slate-900' : 'bg-indigo-100 text-indigo-700'}`}>
                {badge}
              </span>
            )}
          </div>
        )}
      </button>
    );
  };

  const ProtocolGroup = ({ title, children, collapsed }: { title: string, children: React.ReactNode, collapsed: boolean }) => (
    <div className="space-y-1 w-full mt-6 first:mt-0">
      {!collapsed && (
        <div className="px-5 mb-3 flex items-center gap-2 opacity-50">
          <div className="w-1 h-1 rounded-full bg-slate-400" />
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono leading-none">
            {title}
          </p>
        </div>
      )}
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );

  const sidebarContent = (collapsed: boolean) => (
    <div className={`flex flex-col h-full ${collapsed ? 'items-center px-2' : 'px-4'}`}>
      
      {/* 1. IDENTITY NODE CARD */}
      <div className="w-full mb-8 pt-2">
        <button 
          onClick={() => onNavigate(AppRoute.PROFILE)}
          className={`relative w-full overflow-hidden transition-all duration-500 group border ${
            collapsed 
              ? 'aspect-square rounded-[1.5rem] border-transparent hover:border-slate-200 hover:shadow-lg p-1' 
              : 'p-3 rounded-[1.8rem] bg-white border-slate-100 hover:border-indigo-100 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.06)] flex items-center gap-4 text-left'
          } ${activeRoute === AppRoute.PROFILE ? 'ring-2 ring-indigo-500/20 border-indigo-500/30' : ''}`}
        >
          <div className={`relative shrink-0 transition-transform duration-500 ${collapsed ? 'w-full h-full' : 'w-12 h-12'} ${activeRoute === AppRoute.PROFILE ? 'scale-105' : 'group-hover:scale-105'}`}>
            <img 
              src={userData?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.currentUser?.uid}`} 
              className={`w-full h-full object-cover shadow-sm ${collapsed ? 'rounded-2xl' : 'rounded-2xl'}`}
              alt="User" 
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-[2.5px] border-white rounded-full z-10" />
          </div>
          
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-sm font-black text-slate-900 tracking-tight truncate leading-none">
                  {(userData?.displayName || 'Unknown Node').split(' ')[0]}
                </p>
                {isVerified && <div className="text-indigo-500 scale-[0.65]"><ICONS.Verified /></div>}
              </div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono truncate opacity-80 group-hover:opacity-100 transition-opacity group-hover:text-indigo-500">
                {userData?.role === 'admin' ? 'System Admin' : 'Grid Node'}
              </p>
            </div>
          )}
          
          {!collapsed && (
             <div className="opacity-0 group-hover:opacity-100 transition-opacity -ml-2 text-slate-300">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
             </div>
          )}
        </button>
      </div>

      {/* NAVIGATION SCROLL AREA */}
      <div className="flex-1 overflow-y-auto custom-scrollbar w-full space-y-1 pb-4">
        {/* Core Protocols */}
        <ProtocolGroup title="Core_Uplink" collapsed={collapsed}>
          <NavItem route={AppRoute.FEED} icon={ICONS.Home} label="Central Hub" collapsed={collapsed} />
          <NavItem route={AppRoute.EXPLORE} icon={ICONS.Explore} label="Discovery" collapsed={collapsed} />
          <NavItem route={AppRoute.MESSAGES} icon={ICONS.Messages} label="Neural Comms" collapsed={collapsed} />
          <NavItem route={AppRoute.NOTIFICATIONS} icon={ICONS.Bell} label="Alerts" collapsed={collapsed} badge={unreadCount} />
        </ProtocolGroup>

        {/* Identity Clusters */}
        <ProtocolGroup title="Network" collapsed={collapsed}>
          <NavItem route={AppRoute.MESH} icon={ICONS.Profile} label="My Mesh" collapsed={collapsed} />
          <NavItem route={AppRoute.CLUSTERS} icon={ICONS.Clusters} label="Hive Clusters" collapsed={collapsed} />
          <NavItem route={AppRoute.VERIFIED_NODES} icon={ICONS.Verified} label="Verified Tier" collapsed={collapsed} />
        </ProtocolGroup>

        {/* Media & Archive */}
        <ProtocolGroup title="Media_Stream" collapsed={collapsed}>
          <NavItem route={AppRoute.STREAM_GRID} icon={ICONS.Streams} label="Live Grid" collapsed={collapsed} badge="ON_AIR" />
          <NavItem route={AppRoute.SAVED} icon={ICONS.Saved} label="Data Vault" collapsed={collapsed} />
        </ProtocolGroup>

        {/* Advanced Modules */}
        <ProtocolGroup title="Modules" collapsed={collapsed}>
          <NavItem route={AppRoute.TEMPORAL} icon={ICONS.Temporal} label="Temporal" collapsed={collapsed} />
          <NavItem route={AppRoute.GATHERINGS} icon={ICONS.Gatherings} label="Gatherings" collapsed={collapsed} />
          <NavItem route={AppRoute.SIMULATIONS} icon={ICONS.Simulations} label="Simulations" collapsed={collapsed} />
          <NavItem route={AppRoute.RESILIENCE} icon={ICONS.Resilience} label="Resilience" collapsed={collapsed} />
        </ProtocolGroup>

        {userRole === 'admin' && (
          <ProtocolGroup title="System" collapsed={collapsed}>
            <NavItem route={AppRoute.ADMIN} icon={ICONS.Admin} label="Command Deck" collapsed={collapsed} />
          </ProtocolGroup>
        )}
      </div>

      {/* FOOTER META */}
      {!collapsed && (
        <div className="mt-auto pt-6 pb-2 px-2 border-t border-slate-100/50 w-full">
          <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center text-[9px] font-black text-slate-300 uppercase tracking-[0.15em] font-mono">
            <button onClick={() => onNavigate(AppRoute.PRIVACY)} className="hover:text-slate-600 transition-colors">Privacy</button>
            <button onClick={() => onNavigate(AppRoute.TERMS)} className="hover:text-slate-600 transition-colors">Terms</button>
            <button onClick={() => onNavigate(AppRoute.COOKIES)} className="hover:text-slate-600 transition-colors">Cookies</button>
          </div>
          <p className="text-[8px] text-slate-200 font-black text-center mt-3 uppercase tracking-widest font-mono select-none">
            VIBE_OS v2.6.4 [STABLE]
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Expanded) */}
      <aside 
        className="hidden lg:flex flex-col w-[280px] xl:w-[300px] shrink-0 border-r border-precision bg-[#fcfcfd]/50 backdrop-blur-xl pt-6 h-full relative z-30"
        style={{ paddingLeft: 'max(0.5rem, var(--sal))' }}
      >
        {sidebarContent(false)}
      </aside>

      {/* Tablet Sidebar (Collapsed) */}
      <aside 
        className="hidden md:flex lg:hidden flex-col shrink-0 w-[90px] border-r border-precision bg-[#fcfcfd]/50 backdrop-blur-xl pt-6 h-full items-center relative z-30" 
        style={{ paddingLeft: 'var(--sal)' }}
      >
        {sidebarContent(true)}
      </aside>
    </>
  );
};
