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
  'Focus': 'bg-[#f59e0b] shadow-[0_0_8px_#f59e0b]',
  'Deep Work': 'bg-[#e11d48] shadow-[0_0_8px_#e11d48]',
  'In-Transit': 'bg-[#6366f1] shadow-[0_0_8px_#6366f1]',
  'Away': 'bg-[#94a3b8]',
  'Invisible': 'bg-[#334155]',
  'Syncing': 'bg-[#60a5fa] animate-pulse shadow-[0_0_8px_#60a5fa]',
  'Offline': 'bg-slate-300'
};

const getStatusStyle = (status?: string) => {
  return PRESENCE_DOTS[status || 'Online'] || PRESENCE_DOTS['Invisible'];
};

const STATUS_EMOJI_MAP: Record<string, string> = {
  'Online': '⚡',
  'Focus': '🎯',
  'Deep Work': '🧱',
  'In-Transit': '✈️',
  'Away': '☕',
  'Invisible': '👻',
  'Syncing': '🛰️',
  'Offline': '💤'
};

const getNotificationIcon = (type: string, pulseId?: string) => {
    const pulseConfig = PULSE_FREQUENCIES.find(f => f.id === pulseId);
    
    if (type === 'like' && pulseConfig) {
       return <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-sm border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 ${pulseConfig.color}`}>{pulseConfig.emoji}</div>;
    }

    const iconClasses = "w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md scale-90";

    switch (type) {
        case 'follow': return <div className={`${iconClasses} bg-indigo-600`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M19 7.5v9m-4.5-4.5h9M3 13.5h9m-9-4.5h9m-9-4.5h9" /></svg></div>;
        case 'broadcast': return <div className={`${iconClasses} bg-rose-600 animate-pulse`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></div>;
        case 'relay': return <div className={`${iconClasses} bg-emerald-500`}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg></div>;
        case 'message': return <div className={`${iconClasses} bg-indigo-500`}><ICONS.Messages /></div>;
        case 'like': return <div className="w-8 h-8 bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400 rounded-xl flex items-center justify-center border border-rose-100 dark:border-rose-900 shadow-sm scale-90">❤️</div>;
        case 'gathering_rsvp': return <div className={`${iconClasses} bg-purple-600`}><ICONS.Gatherings /></div>;
        case 'gathering_create': return <div className={`${iconClasses} bg-slate-900 dark:bg-white text-white dark:text-slate-900`}><ICONS.Gatherings /></div>;
        default: return <div className={`${iconClasses} bg-slate-700`}><ICONS.Bell /></div>;
    }
  };

const NotificationItem = ({ notif, onDelete }: { notif: AppNotification; onDelete: (id: string) => void }) => {
  return (
    <div 
      className={`group relative flex items-start gap-3 p-3 rounded-[1.5rem] transition-all duration-300 cursor-pointer overflow-hidden active:scale-[0.98] border focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none ${
        !notif.isRead 
          ? 'bg-white dark:bg-slate-900 border-indigo-100 dark:border-indigo-900/50 shadow-md z-10' 
          : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
      }`}
      tabIndex={0}
      role="listitem"
    >
      {/* Unread Indicator */}
      {!notif.isRead && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-indigo-500 rounded-full" />
      )}
      
      <div className="shrink-0 relative ml-2 mt-1">
        <img src={notif.fromUserAvatar} className="w-9 h-9 rounded-xl object-cover border border-slate-100 dark:border-slate-700 shadow-sm bg-white dark:bg-slate-800" alt="" />
        <div className="absolute -bottom-2 -right-2 scale-75 origin-top-left">
           {getNotificationIcon(notif.type, notif.pulseFrequency)}
        </div>
      </div>

      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex flex-wrap items-baseline gap-x-1.5 mb-0.5">
           <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{notif.fromUserName}</span>
           <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 leading-tight line-clamp-2">{notif.text}</span>
        </div>
        <p className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest font-mono">
          {notif.timestamp?.toDate ? notif.timestamp.toDate().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'NOW'}
        </p>
      </div>
      
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }}
        className="self-center p-2 text-slate-300 dark:text-slate-600 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all active:scale-90 opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="Delete notification"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
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
  const [isHubOpen, setIsHubOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  const [localSearch, setLocalSearch] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Derived Notification Groups
  const unreadNotifications = useMemo(() => notifications.filter(n => !n.isRead), [notifications]);
  const readNotifications = useMemo(() => notifications.filter(n => n.isRead), [notifications]);
  const unreadCount = unreadNotifications.length;

  const [localStatus, setLocalStatus] = useState({
    presenceStatus: userData?.presenceStatus || 'Online',
    statusEmoji: userData?.statusEmoji || '⚡',
    statusMessage: userData?.statusMessage || ''
  });

  useEffect(() => {
    if (userData) {
      setLocalStatus({
        presenceStatus: userData.presenceStatus || 'Online',
        statusEmoji: userData.statusEmoji || '⚡',
        statusMessage: userData.statusMessage || ''
      });
    }
  }, [userData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsSystemMenuOpen(false);
        setIsHubOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateNeuralStatus = async (updates: Partial<typeof localStatus>) => {
    if (!db || !auth.currentUser) return;
    setIsUpdatingStatus(true);
    const newStatus = { ...localStatus, ...updates };
    setLocalStatus(newStatus);
    
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), newStatus);
    } catch (e) {
      console.error("Status Sync Error:", e);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const regions: { code: Region, name: string, flag: string }[] = [
    { code: 'en-GB', name: 'London Node', flag: '🇬🇧' },
    { code: 'en-US', name: 'New York Node', flag: '🇺🇸' },
    { code: 'de-DE', name: 'Berlin Node', flag: '🇩🇪' },
    { code: 'fr-FR', name: 'Paris Node', flag: '🇫🇷' },
    { code: 'ja-JP', name: 'Tokyo Node', flag: '🇯🇵' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearch.trim()) {
      onSearch(localSearch.trim());
      setIsSearchFocused(false);
    }
  };

  return (
    <header 
      className="absolute top-0 left-0 right-0 z-[1000] glass-panel border-b border-slate-200/50 dark:border-slate-800/50 shadow-[0_4px_30px_rgba(0,0,0,0.03)] flex items-center transition-all duration-500 backdrop-blur-xl bg-white/70 dark:bg-slate-950/70 supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-950/60" 
      style={{ 
        height: 'var(--header-h)',
        paddingLeft: 'max(1rem, var(--sal))',
        paddingRight: 'max(1rem, var(--sar))'
      }}
      role="banner"
    >
      <div className="flex items-center justify-between w-full max-w-[2560px] mx-auto h-full px-4 md:px-6 relative">
        
        <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
          <button 
            className="w-10 h-10 md:w-11 md:h-11 bg-slate-950 dark:bg-white rounded-[1.2rem] flex items-center justify-center shadow-lg active:scale-95 transition-all shrink-0 hover:bg-indigo-600 dark:hover:bg-indigo-400 group relative overflow-hidden ring-2 ring-white dark:ring-slate-900 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={() => onNavigate(AppRoute.FEED)}
            aria-label="Go to Home Feed"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-white dark:text-slate-950 font-black italic text-xl group-hover:scale-110 transition-transform relative z-10">V</span>
          </button>

          <form 
            onSubmit={handleSearchSubmit}
            className={`relative flex items-center transition-all duration-500 ${isSearchFocused ? 'w-full max-w-md z-50' : 'w-10 md:w-64'}`}
            role="search"
          >
            <div className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[1.2rem] transition-all duration-300 ${isSearchFocused ? 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800 shadow-xl ring-4 ring-indigo-50 dark:ring-indigo-900/20 w-full' : 'bg-slate-100/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent w-full cursor-pointer md:cursor-text'}`}>
              <button type="submit" className={`shrink-0 transition-colors ${isSearchFocused ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} aria-label="Search Grid">
                <ICONS.Search />
              </button>
              <input 
                type="text" 
                placeholder="Scan grid nodes..." 
                aria-label="Search query"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => !localSearch && setIsSearchFocused(false)}
                className={`bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400/80 dark:placeholder:text-slate-600 transition-all w-full ${isSearchFocused ? 'opacity-100' : 'hidden md:block opacity-100'}`}
              />
            </div>
          </form>
        </div>

        <div className="flex items-center gap-3 md:gap-5 justify-end pl-2">
          
          {/* Resonance Points Display (Gamification) */}
          <button 
            onClick={() => onNavigate(AppRoute.MARKETPLACE)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 transition-all group focus:ring-2 focus:ring-indigo-500"
            aria-label="Open Marketplace"
          >
             <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-[10px] shadow-sm">
                <ICONS.Marketplace />
             </div>
             <span className="text-[10px] font-black font-mono text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
               {userData?.resonance?.toLocaleString() || '0'} PTS
             </span>
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className={`w-10 h-10 md:w-11 md:h-11 rounded-[1.2rem] flex items-center justify-center transition-all relative touch-active border focus:ring-2 focus:ring-indigo-500 ${isNotifOpen ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900' : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border-slate-200/60 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-300'}`}
              aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} new)` : ''}`}
              aria-expanded={isNotifOpen}
            >
              <ICONS.Bell />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-[3px] border-[#fcfcfd] dark:border-slate-950 animate-in zoom-in duration-300 shadow-sm">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div 
                className="absolute right-0 md:right-[-80px] top-full mt-6 w-[min(92vw,420px)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] border border-white/20 dark:border-white/10 ring-1 ring-slate-950/5 overflow-hidden z-[100] animate-in zoom-in-95 slide-in-from-top-4 duration-400 flex flex-col max-h-[85vh]"
                role="dialog"
                aria-label="Notification Center"
              >
                 <div className="p-6 pb-4 border-b border-slate-100/80 dark:border-slate-800/80 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 relative z-10 backdrop-blur-md">
                   <div>
                     <h3 className="text-lg font-black text-slate-950 dark:text-white tracking-tighter uppercase italic">Signal_Log</h3>
                     <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] font-mono mt-0.5">Encrypted Feed</p>
                   </div>
                   {unreadCount > 0 && (
                     <button 
                       onClick={() => onMarkRead()}
                       className="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all border border-indigo-100 dark:border-indigo-900 shadow-sm focus:ring-2 focus:ring-indigo-500"
                     >
                       MARK_ALL_READ
                     </button>
                   )}
                 </div>
                 
                 <div className="flex-1 overflow-y-auto no-scrollbar scroll-container bg-white/40 dark:bg-slate-900/40 p-4 space-y-6" role="list">
                   {notifications.length > 0 ? (
                     <>
                        {/* UNREAD SECTION */}
                        {unreadNotifications.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 px-2">
                                    <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] font-mono">Incoming_Signals</span>
                                </div>
                                {unreadNotifications.map(n => <NotificationItem key={n.id} notif={n} onDelete={onDeleteNotification} />)}
                            </div>
                        )}

                        {/* READ SECTION */}
                        {readNotifications.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 px-2 opacity-60">
                                    <div className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full" />
                                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] font-mono">Recent_Log</span>
                                </div>
                                {readNotifications.map(n => <NotificationItem key={n.id} notif={n} onDelete={onDeleteNotification} />)}
                            </div>
                        )}
                     </>
                   ) : (
                     <div className="py-24 text-center flex flex-col items-center opacity-30">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400 dark:text-slate-600"><ICONS.Bell /></div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] font-mono text-slate-900 dark:text-white">Buffer_Empty</p>
                     </div>
                   )}
                 </div>
                 
                 {/* Footer Link */}
                 <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-center">
                    <button onClick={() => { onNavigate(AppRoute.NOTIFICATIONS); setIsNotifOpen(false); }} className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg px-2">
                        View_Full_History
                    </button>
                 </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => { setIsSystemMenuOpen(!isSystemMenuOpen); setIsHubOpen(false); }}
              className="flex items-center gap-3 p-1.5 pr-1.5 md:pr-5 rounded-[1.4rem] bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 active:scale-95 group focus:ring-2 focus:ring-indigo-500"
              aria-label="User Menu"
              aria-expanded={isSystemMenuOpen}
            >
              <div className="relative shrink-0">
                <img 
                  src={userData?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.currentUser?.uid}`} 
                  className={`w-8 h-8 md:w-9 md:h-9 rounded-[1rem] object-cover shadow-sm bg-slate-100 dark:bg-slate-800 ${userData?.cosmetics?.activeBorder ? `cosmetic-border-${userData.cosmetics.activeBorder}` : ''}`} 
                  alt="" 
                />
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-[2px] border-white dark:border-slate-900 shadow-sm ${getStatusStyle(userData?.presenceStatus)}`} />
              </div>
              
              <div className="hidden md:flex flex-col text-left overflow-hidden min-w-[80px]">
                <span className="text-[13px] font-black text-slate-900 dark:text-white tracking-tight leading-none truncate">
                  {(userData?.displayName || 'Node').split(' ')[0]}
                </span>
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono mt-0.5 leading-none">
                  {userData?.statusEmoji || '⚡'} {userData?.presenceStatus || 'Ready'}
                </span>
              </div>
              
              <div className="hidden md:block text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors">
                 <svg className={`w-3 h-3 transition-transform duration-300 ${isSystemMenuOpen || isHubOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M19 9l-7 7-7-7" /></svg>
              </div>
            </button>

            {isSystemMenuOpen && !isHubOpen && (
              <div 
                className="absolute right-0 top-full mt-4 w-[min(90vw,360px)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_60px_120px_-30px_rgba(0,0,0,0.25)] border border-white/20 dark:border-white/10 ring-1 ring-slate-950/5 overflow-hidden z-[100] animate-in zoom-in-95 slide-in-from-top-4 duration-400 flex flex-col max-h-[85vh]"
                role="dialog"
                aria-label="System Menu"
              >
                  
                  {/* Status Hub Trigger */}
                  <div className="p-2 shrink-0">
                    <button 
                      onClick={() => { setIsHubOpen(true); setIsSystemMenuOpen(false); }}
                      className="w-full p-4 bg-slate-50/80 dark:bg-slate-800/80 rounded-[2rem] hover:bg-white dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-indigo-100 dark:hover:border-indigo-900 hover:shadow-lg transition-all text-left group flex items-start gap-4 focus:ring-2 focus:ring-indigo-500"
                      aria-label="Update Status"
                    >
                      <div className="w-14 h-14 bg-white dark:bg-slate-700 rounded-[1.4rem] flex items-center justify-center text-3xl shadow-sm border border-slate-100 dark:border-slate-600 shrink-0 group-hover:scale-110 transition-transform">
                         {userData?.statusEmoji || '⚡'}
                      </div>
                      <div className="flex-1 min-w-0 py-1">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1">Status_Beacon</p>
                         <p className="text-sm font-bold text-slate-900 dark:text-white truncate tracking-tight italic">
                           "{userData?.statusMessage || 'Transmitting...'}"
                         </p>
                         <div className="flex items-center gap-2 mt-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${getStatusStyle(userData?.presenceStatus).split(' ')[0]} animate-pulse`} />
                            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest font-mono">
                              {userData?.presenceStatus || 'OFFLINE'}
                            </p>
                         </div>
                      </div>
                    </button>
                  </div>

                  <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                    {/* Region Selector */}
                    <div className="space-y-3">
                      <p className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.3em] font-mono ml-1">Grid_Region</p>
                      <div className="grid grid-cols-1 gap-1">
                        {regions.map(r => (
                          <button 
                            key={r.code}
                            onClick={() => { onRegionChange(r.code); setIsSystemMenuOpen(false); }}
                            className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-[10px] font-bold transition-all ${currentRegion === r.code ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                          >
                            <span className="flex items-center gap-3"><span className="text-sm">{r.flag}</span> {r.name}</span>
                            {currentRegion === r.code && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col gap-2 shrink-0">
                    {onOpenSettings && (
                      <button 
                        onClick={() => { onOpenSettings(); setIsSystemMenuOpen(false); }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-4 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-[1.8rem] transition-all font-black text-[10px] uppercase tracking-widest active:scale-95"
                      >
                        <ICONS.Settings />
                        Settings
                      </button>
                    )}
                    <button 
                      onClick={() => { onLogout(); setIsSystemMenuOpen(false); }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-4 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-[1.8rem] transition-all font-black text-[10px] uppercase tracking-widest active:scale-95 hover:shadow-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Terminate_Session
                    </button>
                  </div>
              </div>
            )}

            {/* Hub Dropdown (Replacing Modal) */}
            {isHubOpen && (
              <div 
                className="absolute right-0 top-full mt-4 w-[min(92vw,400px)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_60px_120px_-30px_rgba(0,0,0,0.25)] border border-white/20 dark:border-white/10 ring-1 ring-slate-950/5 overflow-hidden z-[100] animate-in zoom-in-95 slide-in-from-top-4 duration-400 flex flex-col max-h-[85vh]"
                role="dialog"
                aria-label="Status Configuration"
              >
                  
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500" />
                  
                  <div className="flex justify-between items-start p-6 pb-2 shrink-0">
                     <div>
                       <h2 className="text-xl font-black text-slate-950 dark:text-white tracking-tighter uppercase italic leading-none">Neural_State</h2>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mt-1">Broadcast Config</p>
                     </div>
                     <button 
                        onClick={() => { setIsHubOpen(false); setIsSystemMenuOpen(true); }} 
                        className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
                        aria-label="Close Status Menu"
                     >
                       <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
                     </button>
                  </div>

                  <div className="space-y-6 p-6 pt-2 flex-1 overflow-y-auto no-scrollbar scroll-container">
                     <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-3 rounded-[1.8rem] border border-slate-100 dark:border-slate-700">
                        <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-[1.4rem] flex items-center justify-center text-4xl shadow-sm border border-slate-100 dark:border-slate-600 shrink-0">
                          {localStatus.statusEmoji}
                        </div>
                        <div className="flex-1">
                          <label className="text-[8px] font-black text-indigo-500 uppercase tracking-widest font-mono ml-1 mb-1 block">Signal_Message</label>
                          <input 
                            autoFocus
                            type="text"
                            value={localStatus.statusMessage}
                            onChange={(e) => setLocalStatus(prev => ({ ...prev, statusMessage: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && updateNeuralStatus({})}
                            className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-900 dark:text-white focus:ring-0 outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 italic"
                            placeholder="Status..."
                          />
                        </div>
                     </div>

                     <div>
                        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mb-3 ml-1">Mode</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {(['Online', 'Focus', 'Deep Work', 'Away', 'In-Transit', 'Invisible'] as const).map(status => (
                            <button 
                              key={status}
                              onClick={() => setLocalStatus(prev => ({ 
                                ...prev, 
                                presenceStatus: status,
                                statusEmoji: STATUS_EMOJI_MAP[status] || prev.statusEmoji
                              }))}
                              className={`p-3 rounded-xl border transition-all flex items-center gap-2 active:scale-95 ${localStatus.presenceStatus === status ? 'bg-slate-950 dark:bg-white border-slate-950 dark:border-white text-white dark:text-slate-950 shadow-md' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                            >
                              <div className={`w-2 h-2 rounded-full ${getStatusStyle(status).split(' ')[0]}`} />
                              <span className="text-[9px] font-black uppercase tracking-widest font-mono truncate">
                                {status}
                              </span>
                            </button>
                          ))}
                        </div>
                     </div>

                     <div>
                        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mb-3 ml-1">Glyphs</h4>
                        <div className="flex flex-wrap gap-2">
                          {IDENTITY_SIGNALS.map(signal => (
                            <button 
                              key={signal}
                              onClick={() => setLocalStatus(prev => ({ ...prev, statusEmoji: signal }))}
                              className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all active:scale-90 ${localStatus.statusEmoji === signal ? 'bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 shadow-md' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                            >
                              {signal}
                            </button>
                          ))}
                        </div>
                     </div>
                  </div>

                  <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 shrink-0">
                     <button 
                      onClick={() => { updateNeuralStatus({}); setIsHubOpen(false); }}
                      className="w-full py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-indigo-200/50 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                     >
                       {isUpdatingStatus ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ICONS.Verified />}
                       UPDATE_STATE
                     </button>
                  </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};