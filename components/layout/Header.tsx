
import React, { useState, useEffect, useRef } from 'react';
import { ICONS } from '../../constants';
import { UserRole, Region, User as VibeUser, AppRoute, AppNotification } from '../../types';

interface HeaderProps {
  userRole: UserRole;
  userData: VibeUser | null;
  notifications: AppNotification[];
  onMarkRead: () => void;
  onDeleteNotification: (id: string) => void;
  currentRegion: Region;
  onRegionChange: (region: Region) => void;
  onLogout: () => void;
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onSearch: (query: string) => void;
  onOpenSettings?: () => void;
}

const PRESENCE_DOTS: Record<string, string> = {
  'Online': 'bg-[#10b981] shadow-[0_0_8px_#10b981]',
  'Focus': 'bg-[#f59e0b]',
  'Deep Work': 'bg-[#e11d48]',
  'Away': 'bg-[#94a3b8]',
  'Offline': 'bg-slate-300'
};

export const Header: React.FC<HeaderProps> = ({ 
  userRole,
  userData,
  notifications,
  onMarkRead,
  onLogout,
  activeRoute,
  onNavigate,
  onSearch,
  onOpenSettings
}) => {
  const [isSystemMenuOpen, setIsSystemMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  
  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsSystemMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotifClick = (n: AppNotification) => {
    setIsNotifOpen(false);
    if (n.type === 'message') {
        onNavigate(AppRoute.MESSAGES);
    } else {
        onNavigate(AppRoute.FEED);
    }
  };

  const borderClass = userData?.cosmetics?.activeBorder ? `cosmetic-border-${userData.cosmetics.activeBorder}` : '';

  const DropdownItem = ({ icon: Icon, label, onClick, colorClass = "text-slate-400 group-hover:text-white", isActive = false }: any) => (
    <button 
      onClick={() => { onClick(); setIsSystemMenuOpen(false); }} 
      className={`w-full flex items-center gap-4 px-5 py-3.5 hover:bg-white/5 transition-all text-left group active:scale-[0.98] relative ${isActive ? 'bg-white/5' : ''}`}
    >
      {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-indigo-500 rounded-r-full" />}
      <div className={`transition-all duration-300 scale-105 shrink-0 ${isActive ? 'text-indigo-400' : colorClass}`}>
        <Icon />
      </div>
      <span className={`text-[10px] font-black uppercase tracking-[0.2em] font-mono truncate ${isActive ? 'text-white' : colorClass}`}>
        {label}
      </span>
    </button>
  );

  const SectionHeader = ({ label }: { label: string }) => (
    <div className="px-6 pt-6 pb-3">
        <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] font-mono border-b border-white/5 pb-1">{label}</p>
    </div>
  );

  return (
    <header 
      className="relative z-[1000] border-b border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl bg-white/70 dark:bg-slate-950/70 shrink-0" 
      style={{ height: 'var(--header-h)' }}
    >
      <div className="flex items-center justify-between w-full max-w-[2560px] mx-auto h-full px-4 md:px-6">
        
        <div className="flex items-center gap-4 flex-1">
          <button 
            className="w-10 h-10 bg-slate-950 dark:bg-white rounded-[1.2rem] flex items-center justify-center text-white dark:text-slate-950 font-black italic text-xl shadow-lg active:scale-95 transition-all"
            onClick={() => onNavigate(AppRoute.FEED)}
          >V</button>

          <form onSubmit={(e) => { e.preventDefault(); onSearch(localSearch); }} className="relative hidden md:flex items-center w-64">
            <div className="flex items-center gap-3 px-3.5 py-2 rounded-[1.2rem] bg-slate-100/50 dark:bg-slate-900/50 border border-transparent w-full">
              <ICONS.Search />
              <input 
                type="text" placeholder="Scan grid..." value={localSearch} onChange={(e) => setLocalSearch(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-900 dark:text-white w-full"
              />
            </div>
          </form>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative" ref={notifRef}>
            <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all active:scale-90 relative ${isNotifOpen ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
            >
                <ICONS.Bell />
                {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white rounded-lg text-[9px] font-black flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-950">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isNotifOpen && (
                <div className="absolute right-0 top-full mt-4 w-[340px] md:w-[400px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.2rem] shadow-heavy z-[1100] animate-in zoom-in-95 slide-in-from-top-2 duration-200 overflow-hidden flex flex-col max-h-[500px]">
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white font-mono">Neural_Signals</h4>
                        <button onClick={onMarkRead} className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline">Mark_All</button>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                        {notifications.length === 0 ? (
                            <div className="py-12 text-center opacity-30 italic text-[10px] uppercase font-mono">Sector_Silent</div>
                        ) : (
                            notifications.slice(0, 5).map(n => (
                                <button key={n.id} onClick={() => handleNotifClick(n)} className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-indigo-900/10 transition-all text-left">
                                    <img src={n.fromUserAvatar} className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700" alt="" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate"><span className="uppercase font-black mr-1">{n.fromUserName}</span> {n.text}</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
          </div>

          <button onClick={() => onNavigate(AppRoute.MARKETPLACE)} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-100 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400 font-black text-[10px] uppercase transition-all hover:shadow-md">
             <div className="w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center text-white animate-pulse"><ICONS.Marketplace /></div>
             <span className="font-mono">{userData?.resonance?.toLocaleString() || '0'}</span>
          </button>

          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsSystemMenuOpen(!isSystemMenuOpen)}
              className="flex items-center gap-3 p-1.5 rounded-[1.4rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all active:scale-95"
            >
              <div className={`relative w-8 h-8 md:w-9 md:h-9 rounded-[1rem] ${borderClass}`}>
                <img src={userData?.avatarUrl} className="w-full h-full rounded-[1rem] object-cover bg-slate-100" alt="" />
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${PRESENCE_DOTS[userData?.presenceStatus || 'Online']}`} />
              </div>
              <span className="hidden md:block text-[13px] font-black text-slate-900 dark:text-white">{(userData?.displayName || 'Node').split(' ')[0]}</span>
            </button>

            {isSystemMenuOpen && (
              <div className="absolute right-0 top-full mt-4 w-[320px] bg-[#0a0f1d] border border-slate-800 rounded-[2.5rem] shadow-[0_40px_120px_rgba(0,0,0,0.9)] z-[1100] animate-in zoom-in-95 duration-300 flex flex-col h-[75vh] max-h-[800px] overflow-hidden ring-1 ring-white/5">
                <div className="px-8 py-6 border-b border-white/5 shrink-0 bg-black/20">
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono italic">BRIDGE_ACCESS</p>
                </div>
                
                <div className="flex-1 overflow-y-auto no-scrollbar scroll-container pb-8">
                    
                    <SectionHeader label="Neural_Node" />
                    <DropdownItem icon={ICONS.Profile} label="My Profile" onClick={() => onNavigate(AppRoute.PROFILE)} isActive={activeRoute === AppRoute.PROFILE} />
                    <DropdownItem icon={ICONS.Profile} label="My Mesh Network" onClick={() => onNavigate(AppRoute.MESH)} isActive={activeRoute === AppRoute.MESH} />
                    
                    <SectionHeader label="Core_Uplink" />
                    <DropdownItem icon={ICONS.Home} label="Central Hub" onClick={() => onNavigate(AppRoute.FEED)} isActive={activeRoute === AppRoute.FEED} />
                    <DropdownItem icon={ICONS.Explore} label="Signal Discovery" onClick={() => onNavigate(AppRoute.EXPLORE)} isActive={activeRoute === AppRoute.EXPLORE} />
                    <DropdownItem icon={ICONS.Messages} label="Neural Comms" onClick={() => onNavigate(AppRoute.MESSAGES)} isActive={activeRoute === AppRoute.MESSAGES} />
                    <DropdownItem icon={ICONS.Bell} label="Priority Alerts" onClick={() => onNavigate(AppRoute.NOTIFICATIONS)} isActive={activeRoute === AppRoute.NOTIFICATIONS} />
                    
                    <SectionHeader label="Network_Modules" />
                    <DropdownItem icon={ICONS.Clusters} label="Hive Clusters" onClick={() => onNavigate(AppRoute.CLUSTERS)} isActive={activeRoute === AppRoute.CLUSTERS} />
                    <DropdownItem icon={ICONS.Verified} label="Verified Tier" onClick={() => onNavigate(AppRoute.VERIFIED_NODES)} isActive={activeRoute === AppRoute.VERIFIED_NODES} />
                    <DropdownItem icon={ICONS.Gatherings} label="Grid Gatherings" onClick={() => onNavigate(AppRoute.GATHERINGS)} isActive={activeRoute === AppRoute.GATHERINGS} />
                    
                    <SectionHeader label="Media_Archive" />
                    <DropdownItem icon={ICONS.Streams} label="Live Signal Grid" onClick={() => onNavigate(AppRoute.STREAM_GRID)} isActive={activeRoute === AppRoute.STREAM_GRID} />
                    <DropdownItem icon={ICONS.Saved} label="Encrypted Vault" onClick={() => onNavigate(AppRoute.SAVED)} isActive={activeRoute === AppRoute.SAVED} />
                    <DropdownItem icon={ICONS.Temporal} label="Temporal Logs" onClick={() => onNavigate(AppRoute.TEMPORAL)} isActive={activeRoute === AppRoute.TEMPORAL} />
                    
                    <SectionHeader label="System_Tools" />
                    <DropdownItem icon={ICONS.Simulations} label="Reality Engine" onClick={() => onNavigate(AppRoute.SIMULATIONS)} isActive={activeRoute === AppRoute.SIMULATIONS} />
                    <DropdownItem icon={ICONS.Resilience} label="Resilience Hub" onClick={() => onNavigate(AppRoute.RESILIENCE)} isActive={activeRoute === AppRoute.RESILIENCE} />
                    <DropdownItem icon={ICONS.Marketplace} label="Cyber Marketplace" onClick={() => onNavigate(AppRoute.MARKETPLACE)} isActive={activeRoute === AppRoute.MARKETPLACE} />
                    <DropdownItem icon={ICONS.Support} label="Support Matrix" onClick={() => onNavigate(AppRoute.SUPPORT)} isActive={activeRoute === AppRoute.SUPPORT} />
                    
                    {userRole === 'admin' && (
                        <>
                            <SectionHeader label="Root_Authority" />
                            <DropdownItem icon={ICONS.Admin} label="Citadel Command" onClick={() => onNavigate(AppRoute.ADMIN)} colorClass="text-indigo-400 group-hover:text-white" isActive={activeRoute === AppRoute.ADMIN} />
                        </>
                    )}

                    <div className="mt-8 border-t border-white/5 pt-4">
                        <DropdownItem icon={ICONS.Settings} label="System Config" onClick={() => onOpenSettings?.()} />
                        <DropdownItem 
                        icon={() => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>} 
                        label="Disconnect" 
                        onClick={onLogout} 
                        colorClass="text-rose-500 group-hover:text-rose-400"
                        />
                    </div>
                </div>
                
                <div className="px-8 py-4 bg-black/60 text-center shrink-0 border-t border-white/5">
                    <span className="text-[7px] font-black text-slate-600 uppercase tracking-[0.5em] font-mono animate-pulse">CORE_STABLE_V2.6.4</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
