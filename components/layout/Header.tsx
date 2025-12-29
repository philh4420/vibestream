
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db, auth } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { doc, updateDoc } = Firestore as any;
import { ICONS, IDENTITY_SIGNALS, PULSE_FREQUENCIES } from '../../constants';
import { UserRole, Region, User as VibeUser, AppRoute, PresenceStatus, AppNotification } from '../../types';

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
  onDeleteNotification,
  currentRegion, 
  onRegionChange, 
  onLogout,
  activeRoute,
  onNavigate,
  onSearch,
  onOpenSettings
}) => {
  const [isSystemMenuOpen, setIsSystemMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsSystemMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const borderClass = userData?.cosmetics?.activeBorder ? `cosmetic-border-${userData.cosmetics.activeBorder}` : '';

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
          <button 
            onClick={() => onNavigate(AppRoute.MARKETPLACE)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-100 dark:border-cyan-800 text-cyan-600 dark:text-cyan-400 font-black text-[10px] uppercase transition-all hover:shadow-md"
          >
             <div className="w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center text-[10px] text-white shadow-sm animate-pulse"><ICONS.Marketplace /></div>
             <span className="font-mono">{userData?.resonance?.toLocaleString() || '0'}</span>
          </button>

          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsSystemMenuOpen(!isSystemMenuOpen)}
              className="flex items-center gap-3 p-1.5 rounded-[1.4rem] bg-white dark:bg-slate-900 border border-slate-200 border-slate-800 shadow-sm transition-all active:scale-95"
            >
              <div className={`relative w-8 h-8 md:w-9 md:h-9 rounded-[1rem] ${borderClass}`}>
                <img src={userData?.avatarUrl} className="w-full h-full rounded-[1rem] object-cover bg-slate-100" alt="" />
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${PRESENCE_DOTS[userData?.presenceStatus || 'Online']}`} />
              </div>
              <span className="hidden md:block text-[13px] font-black text-slate-900 dark:text-white">{(userData?.displayName || 'Node').split(' ')[0]}</span>
            </button>

            {isSystemMenuOpen && (
              <div className="absolute right-0 top-full mt-4 w-64 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-2xl p-4 z-[1100] animate-in zoom-in-95 duration-200">
                <button onClick={() => { onOpenSettings?.(); setIsSystemMenuOpen(false); }} className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all text-left">
                  <ICONS.Settings /> <span className="text-xs font-black uppercase tracking-widest">Settings</span>
                </button>
                <button onClick={onLogout} className="w-full flex items-center gap-3 p-4 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 rounded-2xl transition-all text-left mt-2">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                   <span className="text-xs font-black uppercase tracking-widest">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
