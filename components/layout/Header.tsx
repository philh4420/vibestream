
import React, { useState, useEffect } from 'react';
import { db, auth } from '../../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ICONS, IDENTITY_SIGNALS } from '../../constants';
import { UserRole, Region, User as VibeUser, AppRoute, PresenceStatus, AppNotification } from '../../types';

interface HeaderProps {
  userRole: UserRole;
  userData: VibeUser | null;
  notifications: AppNotification[];
  onMarkRead: () => void;
  currentRegion: Region;
  onRegionChange: (region: Region) => void;
  onLogout: () => void;
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

const PRESENCE_DOTS: Record<PresenceStatus, string> = {
  'Online': 'bg-[#10b981]',
  'Focus': 'bg-[#f59e0b]',
  'Deep Work': 'bg-[#e11d48]',
  'In-Transit': 'bg-[#6366f1]',
  'Away': 'bg-[#94a3b8]',
  'Invisible': 'bg-[#334155]',
  'Syncing': 'bg-[#60a5fa]'
};

const STATUS_EMOJI_MAP: Record<PresenceStatus, string> = {
  'Online': '⚡',
  'Focus': '🎯',
  'Deep Work': '🧱',
  'In-Transit': '✈️',
  'Away': '☕',
  'Invisible': '👻',
  'Syncing': '🛰️'
};

const NotificationItem = ({ notif }: { notif: AppNotification }) => {
  const iconMap: Record<string, any> = {
    like: <div className="p-2 bg-rose-50 text-rose-500 rounded-lg scale-75"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg></div>,
    follow: <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg scale-75"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M19 7.5v9m-4.5-4.5h9M3 13.5h9m-9-4.5h9m-9-4.5h9" /></svg></div>,
    system: <div className="p-2 bg-slate-900 text-white rounded-lg scale-75"><ICONS.Admin /></div>,
  };

  return (
    <div className={`flex gap-4 p-4 hover:bg-slate-50 transition-all cursor-pointer border-l-4 ${notif.isRead ? 'border-transparent' : 'border-indigo-500 bg-indigo-50/10'}`}>
      <img src={notif.fromUserAvatar} className="w-10 h-10 rounded-xl object-cover shrink-0" alt="" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-900 leading-tight">
          <span className="font-black">{notif.fromUserName}</span> {notif.text}
        </p>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5 font-mono">
          {notif.timestamp?.toDate ? notif.timestamp.toDate().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'NOW'}
        </p>
      </div>
      <div className="shrink-0">
        {iconMap[notif.type] || iconMap.system}
      </div>
    </div>
  );
};

export const Header: React.FC<HeaderProps> = ({ 
  userRole, 
  userData,
  notifications,
  onMarkRead,
  currentRegion, 
  onRegionChange, 
  onLogout,
  activeRoute,
  onNavigate
}) => {
  const [isSystemMenuOpen, setIsSystemMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isHubOpen, setIsHubOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

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

  const DropdownNavItem = ({ route, icon: Icon, label, badge }: { route: AppRoute, icon: React.FC, label: string, badge?: string }) => {
    const isActive = activeRoute === route;
    return (
      <button 
        onClick={() => { onNavigate(route); setIsSystemMenuOpen(false); }}
        className={`flex items-center gap-3 p-3 rounded-2xl transition-all active:scale-95 ${isActive ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-50 text-slate-600 border border-transparent hover:bg-slate-100'}`}
      >
        <div className={`shrink-0 ${isActive ? 'scale-110' : ''}`}>
          <Icon />
        </div>
        <div className="flex-1 text-left flex items-center justify-between min-w-0">
          <span className="text-[11px] font-black uppercase tracking-tight truncate">{label}</span>
          {badge && <span className="text-[7px] font-black bg-rose-500 text-white px-1 py-0.5 rounded-md leading-none">{badge}</span>}
        </div>
      </button>
    );
  };

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-[200] glass-panel border-b border-precision flex items-center shadow-sm" 
      style={{ 
        height: 'var(--header-h)',
        paddingLeft: 'max(1rem, var(--sal))',
        paddingRight: 'max(1rem, var(--sar))'
      }}
    >
      <div className="flex items-center justify-between w-full max-w-[2560px] mx-auto h-full px-4 md:px-6">
        
        {/* LEFT: Branding & Search */}
        <div className="flex items-center gap-4 flex-1">
          <div 
            className="w-10 h-10 md:w-11 md:h-11 bg-slate-900 rounded-full flex items-center justify-center shadow-lg cursor-pointer active:scale-95 transition-all shrink-0"
            onClick={() => onNavigate(AppRoute.FEED)}
          >
            <span className="text-white font-black italic text-xl">V</span>
          </div>

          <div className={`relative flex items-center transition-all duration-300 rounded-full ${isSearchFocused ? 'w-full max-w-xs md:max-w-sm' : 'w-10 h-10 md:w-auto'}`}>
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-full transition-all ${isSearchFocused ? 'bg-white border-indigo-400 shadow-xl ring-4 ring-indigo-50 w-full' : 'bg-slate-100 md:w-48 lg:w-56'}`}>
              <div className={`shrink-0 transition-colors ${isSearchFocused ? 'text-indigo-600' : 'text-slate-400'}`}>
                <ICONS.Search />
              </div>
              <input 
                type="text" 
                placeholder="Find..." 
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className={`bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-900 placeholder:text-slate-400 transition-all ${isSearchFocused ? 'w-full opacity-100' : 'hidden md:block w-full'}`}
              />
            </div>
          </div>
        </div>

        {/* RIGHT: Notifications & Master Pill */}
        <div className="flex items-center gap-2 md:gap-5 justify-end">
          
          {/* NOTIFICATION HUB */}
          <div className="relative">
            <button 
              onClick={() => { setIsNotifOpen(!isNotifOpen); if(!isNotifOpen) onMarkRead(); }}
              className={`p-3 rounded-2xl transition-all relative touch-active ${isNotifOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <ICONS.Bell />
              {unreadCount > 0 && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-rose-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                  {unreadCount}
                </div>
              )}
            </button>

            {isNotifOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsNotifOpen(false)}></div>
                <div className="absolute right-0 md:right-[-120px] mt-4 w-[min(90vw,400px)] bg-white rounded-[2.5rem] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.3)] border border-precision overflow-hidden z-20 animate-in zoom-in-95 slide-in-from-top-4 duration-500 flex flex-col max-h-[80vh]">
                   <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                     <div>
                       <h3 className="text-lg font-black text-slate-900 tracking-tighter uppercase italic">Neural_Alerts</h3>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Real-time Handshake Logs</p>
                     </div>
                     <button onClick={() => setIsNotifOpen(false)} className="p-2 hover:bg-slate-50 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2.5" /></svg></button>
                   </div>
                   <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
                     {notifications.length > 0 ? (
                       notifications.map(n => <NotificationItem key={n.id} notif={n} />)
                     ) : (
                       <div className="py-20 text-center flex flex-col items-center opacity-30">
                          <div className="scale-150 mb-6"><ICONS.Bell /></div>
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] font-mono">No new signals in buffer</p>
                       </div>
                     )}
                   </div>
                </div>
              </>
            )}
          </div>

          <div className="relative">
            {/* MASTER PILL - Complete Identity Mirror */}
            <button 
              onClick={() => setIsSystemMenuOpen(!isSystemMenuOpen)}
              className="flex items-center gap-4 p-1.5 pr-6 rounded-full bg-white border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-300 active:scale-95 group"
            >
              <div className="relative shrink-0">
                <img 
                  src={userData?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.currentUser?.uid}`} 
                  className="w-10 h-10 md:w-11 md:h-11 rounded-full object-cover shadow-sm ring-1 ring-slate-50" 
                  alt="User" 
                />
                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-[2.5px] border-white shadow-sm ${PRESENCE_DOTS[userData?.presenceStatus || 'Online']}`} />
              </div>
              
              <div className="hidden xs:flex flex-col text-left overflow-hidden">
                <div className="flex items-center gap-1.5 leading-none mb-0.5">
                  <span className="text-[15px] font-black text-[#0f172a] tracking-tight">
                    {(userData?.displayName || 'Node').split(' ')[0]}
                  </span>
                  <span className="text-[12px]">{userData?.statusEmoji || '⚡'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-bold text-slate-400 truncate max-w-[160px] leading-none tracking-tight">
                    {userData?.statusMessage || 'Establish signal...'}
                  </p>
                  <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest font-mono leading-none border-l border-slate-100 pl-2">
                    {userData?.presenceStatus || 'OFFLINE'}
                  </span>
                </div>
              </div>

              <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${isSystemMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M19 9l-7 7-7-7" /></svg>
            </button>

            {isSystemMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsSystemMenuOpen(false)}></div>
                <div className="absolute right-0 mt-3 w-[min(90vw,380px)] bg-white rounded-[2.5rem] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.25)] border border-precision overflow-hidden z-20 animate-in zoom-in-95 slide-in-from-top-4 duration-500 flex flex-col max-h-[85vh]">
                  
                  {/* SCROLLABLE CONTENT */}
                  <div className="flex-1 overflow-y-auto no-scrollbar py-5">
                    
                    {/* Integrated Status Toggle Block */}
                    <div className="px-5 mb-6">
                      <button 
                        onClick={() => { setIsHubOpen(true); setIsSystemMenuOpen(false); }}
                        className="w-full flex items-center gap-4 p-5 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all text-left border border-slate-200 group"
                      >
                        <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-4xl shadow-sm border border-slate-100 shrink-0">
                           {userData?.statusEmoji || '⚡'}
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono mb-0.5">Neural_Broadcast</p>
                           <p className="text-[13px] font-bold text-slate-900 truncate tracking-tight italic">
                             "{userData?.statusMessage || 'Establishing broadcast...'}"
                           </p>
                           <div className="flex items-center gap-1.5 mt-1.5">
                              <span className={`w-2 h-2 rounded-full ${PRESENCE_DOTS[userData?.presenceStatus || 'Online']}`} />
                              <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest font-mono leading-none">
                                {userData?.presenceStatus || 'OFFLINE'}
                              </p>
                           </div>
                        </div>
                        <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100 text-indigo-600 group-hover:scale-110 transition-transform">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </div>
                      </button>
                    </div>

                    {/* MOBILE-ONLY NAVIGATION GRID (SIDEBAR MIRROR) */}
                    <div className="lg:hidden px-5 pb-8 space-y-4">
                      <div className="px-4 py-2 text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] font-mono border-t border-slate-50 pt-6 mb-2">Grid_Protocols</div>
                      <div className="grid grid-cols-2 gap-2">
                        <DropdownNavItem route={AppRoute.FEED} icon={ICONS.Home} label="Central Hub" />
                        <DropdownNavItem route={AppRoute.EXPLORE} icon={ICONS.Explore} label="Discover" />
                        <DropdownNavItem route={AppRoute.MESSAGES} icon={ICONS.Messages} label="Neural Comms" />
                        <DropdownNavItem route={AppRoute.MESH} icon={ICONS.Profile} label="Your Mesh" />
                        <DropdownNavItem route={AppRoute.CLUSTERS} icon={ICONS.Clusters} label="Clusters" />
                        <DropdownNavItem route={AppRoute.VERIFIED_NODES} icon={ICONS.Verified} label="Nodes" />
                        <DropdownNavItem route={AppRoute.STREAM_GRID} icon={ICONS.Streams} label="Streams" badge="LIVE" />
                        <DropdownNavItem route={AppRoute.TEMPORAL} icon={ICONS.Temporal} label="Temporal" />
                        <DropdownNavItem route={AppRoute.GATHERINGS} icon={ICONS.Gatherings} label="Gatherings" />
                        <DropdownNavItem route={AppRoute.SAVED} icon={ICONS.Saved} label="Saved Signals" />
                        <DropdownNavItem route={AppRoute.SIMULATIONS} icon={ICONS.Simulations} label="Sims" />
                        <DropdownNavItem route={AppRoute.RESILIENCE} icon={ICONS.Resilience} label="Resilience" />
                        {userRole === 'admin' && (
                          <div className="col-span-2 mt-2">
                             <DropdownNavItem route={AppRoute.ADMIN} icon={ICONS.Admin} label="Citadel Command" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* SHARED ACTIONS */}
                    <div className="px-5 pb-5">
                      <button 
                        onClick={() => { onNavigate(AppRoute.PROFILE); setIsSystemMenuOpen(false); }}
                        className="w-full flex items-center gap-3 p-4 bg-[#4f46e5] text-white rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all group"
                      >
                        <img src={userData?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.currentUser?.uid}`} className="w-10 h-10 rounded-xl object-cover border border-white/20" alt="" />
                        <div className="text-left overflow-hidden">
                          <p className="font-black text-sm tracking-tight truncate">{userData?.displayName || 'Unknown Node'}</p>
                          <p className="text-[9px] font-bold uppercase tracking-widest font-mono opacity-80">Full Control Node</p>
                        </div>
                      </button>
                    </div>
                    
                    <div className="px-5 pb-5 space-y-1">
                      <div className="px-4 py-2 text-[10px] font-black text-slate-300 uppercase tracking-widest font-mono border-t border-slate-50 pt-6 mb-2">Region_Infrastructure</div>
                      <div className="space-y-1">
                        {regions.map(r => (
                          <button 
                            key={r.code}
                            onClick={() => { onRegionChange(r.code); setIsSystemMenuOpen(false); }}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs transition-all ${currentRegion === r.code ? 'bg-indigo-50 text-indigo-700 font-extrabold' : 'hover:bg-slate-50 text-slate-600'}`}
                          >
                            <span className="flex items-center gap-3"><span>{r.flag}</span> {r.name}</span>
                            {currentRegion === r.code && <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                  
                  {/* STICKY FOOTER */}
                  <div className="p-3 border-t border-slate-50 bg-white shrink-0">
                    <button 
                      onClick={() => { onLogout(); setIsSystemMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-4 text-rose-500 hover:bg-rose-50 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest"
                    >
                      Terminate Session
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* NEURAL STATUS HUB */}
      {isHubOpen && (
        <div className="fixed inset-0 z-[600] flex items-start justify-center p-6 pt-[calc(var(--header-h)+3.5rem)] animate-in fade-in duration-400">
           {/* Dismiss Backdrop */}
           <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-3xl" onClick={() => setIsHubOpen(false)}></div>
           
           <div className="relative bg-white w-full max-w-2xl rounded-[4rem] p-10 md:p-14 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border border-white animate-in zoom-in-95 slide-in-from-top-12 duration-500 overflow-hidden max-h-[85vh] flex flex-col">
              <div className="relative z-10 overflow-y-auto no-scrollbar pb-6 flex-1">
                 {/* Current Status Message Entry */}
                 <div className="flex items-center gap-8 mb-12 pt-4">
                    <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-[2.5rem] flex items-center justify-center text-6xl shadow-inner shrink-0 transition-transform active:scale-90">
                      {localStatus.statusEmoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <input 
                        autoFocus
                        type="text"
                        value={localStatus.statusMessage}
                        onChange={(e) => setLocalStatus(prev => ({ ...prev, statusMessage: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && updateNeuralStatus({})}
                        placeholder="Update neural broadcast..."
                        className="w-full bg-transparent border-none p-0 text-3xl font-black text-slate-900 focus:ring-0 placeholder:text-slate-100 tracking-tighter"
                      />
                    </div>
                 </div>

                 {/* GRID MODALITY */}
                 <div className="space-y-6 mb-14">
                    <h4 className="text-[12px] font-black text-[#94a3b8] uppercase tracking-[0.4em] font-mono ml-1">Grid_Modality</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {(['Online', 'Focus', 'Deep Work', 'Away', 'In-Transit', 'Invisible', 'Syncing'] as const).map(status => (
                        <button 
                          key={status}
                          onClick={() => setLocalStatus(prev => ({ 
                            ...prev, 
                            presenceStatus: status,
                            statusEmoji: STATUS_EMOJI_MAP[status] || prev.statusEmoji
                          }))}
                          className={`h-16 rounded-[2.2rem] border transition-all flex items-center gap-3 px-5 active:scale-95 ${localStatus.presenceStatus === status ? 'bg-[#0f172a] border-[#0f172a] text-white shadow-xl' : 'bg-white border-slate-100 text-[#94a3b8] hover:border-slate-200 shadow-sm'}`}
                        >
                          <div className={`w-2.5 h-2.5 rounded-full ${PRESENCE_DOTS[status]}`} />
                          <span className="text-[10px] font-black uppercase tracking-widest font-mono">
                            {status}
                          </span>
                        </button>
                      ))}
                    </div>
                 </div>

                 {/* Signal cortex */}
                 <div className="space-y-6 mb-14 pt-8 border-t border-slate-50">
                    <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] font-mono ml-1">Signal_Cortex</h4>
                    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-11 gap-4">
                      {IDENTITY_SIGNALS.map(signal => (
                        <button 
                          key={signal}
                          onClick={() => setLocalStatus(prev => ({ ...prev, statusEmoji: signal }))}
                          className={`aspect-square rounded-full flex items-center justify-center text-2xl transition-all active:scale-90 ${localStatus.statusEmoji === signal ? 'bg-indigo-50 border-indigo-200 text-indigo-600 scale-110 ring-2 ring-indigo-500/20 shadow-md' : 'bg-white border border-slate-50 text-slate-400 hover:bg-slate-50 shadow-sm'}`}
                        >
                          {signal}
                        </button>
                      ))}
                    </div>
                 </div>

                 {/* SYNCHRONISE BUTTON */}
                 <button 
                  onClick={() => { updateNeuralStatus({}); setIsHubOpen(false); }}
                  className="w-full py-6 bg-[#4f46e5] text-white rounded-[2.5rem] font-black text-[13px] uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(79,70,229,0.35)] hover:bg-[#4338ca] transition-all active:scale-95 mt-4"
                 >
                   {isUpdatingStatus ? 'Synchronising...' : 'Synchronise_Grid_State'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </header>
  );
};
