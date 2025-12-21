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
  onOpenCreate, 
  userRole,
  userData,
  notifications = []
}) => {
  
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const NavItem = ({ route, icon: Icon, label, customIcon, collapsed = false, badge }: { 
    route?: AppRoute, 
    icon?: React.FC, 
    label: string, 
    customIcon?: React.ReactNode,
    collapsed?: boolean,
    badge?: string | number
  }) => {
    const isActive = route && activeRoute === route;
    return (
      <button 
        onClick={() => route && onNavigate(route)}
        title={collapsed ? label : undefined}
        className={`flex items-center transition-all duration-200 tap-feedback group relative w-full rounded-2xl ${
          collapsed 
            ? 'p-3 justify-center' 
            : 'gap-4 px-3 py-2'
        } ${
          isActive 
            ? 'bg-white text-indigo-600 shadow-sm border-sharp' 
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <div className={`relative z-10 transition-all duration-300 flex items-center justify-center shrink-0 ${isActive ? 'scale-105' : 'group-hover:scale-110'}`}>
          {Icon ? <Icon /> : customIcon}
        </div>
        
        {!collapsed && (
          <div className="flex-1 flex items-center justify-between min-w-0">
            <span className={`text-[13px] font-bold tracking-tight truncate ${isActive ? 'text-indigo-800' : 'text-slate-700'}`}>
              {label}
            </span>
            {badge !== undefined && (typeof badge === 'number' ? badge > 0 : badge !== '') && (
              <span className="bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md animate-pulse">
                {badge}
              </span>
            )}
          </div>
        )}

        {isActive && !collapsed && (
          <div className="absolute left-0 w-1 h-5 bg-indigo-600 rounded-r-full" />
        )}
      </button>
    );
  };

  const ProtocolGroup = ({ title, children, collapsed }: { title: string, children: React.ReactNode, collapsed: boolean }) => (
    <div className="space-y-1 w-full">
      {!collapsed && (
        <p className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2 mt-4 font-mono">
          {title}
        </p>
      )}
      {children}
    </div>
  );

  const sidebarContent = (collapsed: boolean) => (
    <div className={`flex flex-col gap-4 w-full h-full ${collapsed ? 'items-center' : ''}`}>
      
      {/* 1. IDENTITY BLOCK */}
      <div className="w-full px-1">
        <button 
          onClick={() => onNavigate(AppRoute.PROFILE)}
          className={`flex items-center transition-all duration-300 w-full rounded-2xl group border border-transparent ${
            collapsed ? 'p-1 justify-center' : 'gap-4 px-3 py-2.5 hover:bg-white hover:border-slate-100 hover:shadow-xl hover:shadow-slate-200/40'
          } ${activeRoute === AppRoute.PROFILE ? 'bg-white border-slate-100 shadow-md shadow-indigo-500/5' : ''}`}
        >
          <div className={`shrink-0 transition-all duration-500 relative ${activeRoute === AppRoute.PROFILE ? 'scale-110' : 'group-hover:scale-110 group-hover:rotate-3'}`}>
            <img 
              src={userData?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.currentUser?.uid}`} 
              className={`rounded-xl object-cover border-2 border-white shadow-sm ${collapsed ? 'w-11 h-11' : 'w-10 h-10'}`} 
              alt="Me" 
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
          </div>
          {!collapsed && (
            <div className="text-left overflow-hidden flex-1">
              <p className={`text-sm font-black tracking-tight truncate ${activeRoute === AppRoute.PROFILE ? 'text-indigo-700' : 'text-slate-900'}`}>
                {(userData?.displayName || 'Identity Node').split(' ')[0]}
              </p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono opacity-60">Verified Member</p>
            </div>
          )}
        </button>
      </div>

      {/* 2. CORE GRID NAVIGATION */}
      <ProtocolGroup title="Grid_Core" collapsed={collapsed}>
        <NavItem route={AppRoute.FEED} icon={ICONS.Home} label="Central Hub" collapsed={collapsed} />
        <NavItem route={AppRoute.EXPLORE} icon={ICONS.Explore} label="Discover Grid" collapsed={collapsed} />
        <NavItem route={AppRoute.MESSAGES} icon={ICONS.Messages} label="Neural Comms" collapsed={collapsed} />
        <NavItem route={AppRoute.NOTIFICATIONS} icon={ICONS.Bell} label="Alerts Center" collapsed={collapsed} badge={unreadCount} />
      </ProtocolGroup>

      {/* 3. IDENTITY CLUSTERS */}
      <ProtocolGroup title="Identity_Clusters" collapsed={collapsed}>
        <NavItem route={AppRoute.MESH} icon={ICONS.Profile} label="Your Mesh" collapsed={collapsed} />
        <NavItem route={AppRoute.CLUSTERS} icon={ICONS.Clusters} label="Neural Clusters" collapsed={collapsed} />
        <NavItem route={AppRoute.VERIFIED_NODES} icon={ICONS.Verified} label="Verified Nodes" collapsed={collapsed} />
      </ProtocolGroup>

      {/* 4. MEDIA STREAM GRID */}
      <ProtocolGroup title="Stream_Archive" collapsed={collapsed}>
        <NavItem route={AppRoute.STREAM_GRID} icon={ICONS.Streams} label="Stream Grid" collapsed={collapsed} badge="LIVE" />
        <NavItem route={AppRoute.SAVED} icon={ICONS.Saved} label="Saved Signals" collapsed={collapsed} />
      </ProtocolGroup>

      {/* 5. TEMPORAL PROTOCOLS */}
      <ProtocolGroup title="Temporal_Vault" collapsed={collapsed}>
        <NavItem route={AppRoute.TEMPORAL} icon={ICONS.Temporal} label="Temporal Fragments" collapsed={collapsed} />
        <NavItem route={AppRoute.GATHERINGS} icon={ICONS.Gatherings} label="Gatherings" collapsed={collapsed} />
      </ProtocolGroup>

      {/* 6. COMPUTE NODES */}
      <ProtocolGroup title="Compute_Hub" collapsed={collapsed}>
        <NavItem route={AppRoute.SIMULATIONS} icon={ICONS.Simulations} label="Simulations" collapsed={collapsed} />
        <NavItem route={AppRoute.RESILIENCE} icon={ICONS.Resilience} label="Resilience Support" collapsed={collapsed} />
        {userRole === 'admin' && (
          <NavItem route={AppRoute.ADMIN} icon={ICONS.Admin} label="Citadel Command" collapsed={collapsed} />
        )}
      </ProtocolGroup>

      {/* UPLINK CTA */}
      {!collapsed && (
        <div className="mt-4 mb-2 px-1">
          <button 
            onClick={onOpenCreate}
            className="w-full bg-slate-950 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <div className="scale-100 group-hover:rotate-12 transition-transform duration-500 shrink-0">
              <ICONS.Create />
            </div>
            <span className="uppercase tracking-[0.3em] text-[9px] font-black relative z-10 italic">Publish Signal</span>
          </button>
        </div>
      )}

      {/* SIDEBAR FOOTER */}
      {!collapsed && (
        <div className="mt-auto pt-4 pb-2 px-4 border-t border-slate-50 opacity-40 hover:opacity-100 transition-opacity">
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px] font-black text-slate-800 uppercase tracking-widest font-mono">
            <button onClick={() => onNavigate(AppRoute.PRIVACY)} className="hover:text-indigo-600">Privacy</button>
            <button onClick={() => onNavigate(AppRoute.TERMS)} className="hover:text-indigo-600">Terms</button>
            <button onClick={() => onNavigate(AppRoute.COOKIES)} className="hover:text-indigo-600">Cookies</button>
            <span className="text-[9px] text-slate-800">|</span>
            <span>VIBE_OS v2.6 © 2026</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <aside 
        className="hidden lg:flex flex-col w-[300px] shrink-0 border-r border-precision bg-[#fcfcfd] p-4 pt-[calc(var(--header-h)+1.5rem)] scroll-viewport h-full sticky top-0"
        style={{ paddingLeft: 'max(1rem, var(--sal))' }}
      >
        {sidebarContent(false)}
      </aside>

      <aside 
        className="hidden md:flex lg:hidden flex-col shrink-0 border-r border-precision bg-[#fcfcfd] py-6 items-center pt-[calc(var(--header-h)+1.5rem)] h-full scroll-viewport" 
        style={{ 
          width: 'calc(5.5rem + var(--sal))',
          paddingLeft: 'var(--sal)'
        }}
      >
        {sidebarContent(true)}
      </aside>
    </>
  );
};