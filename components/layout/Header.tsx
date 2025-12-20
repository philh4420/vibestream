
import React, { useState, useEffect } from 'react';
import { db, auth } from '../../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ICONS, IDENTITY_SIGNALS, PRESENCE_CONFIG } from '../../constants';
import { UserRole, Region, User as VibeUser, AppRoute, PresenceStatus } from '../../types';

interface HeaderProps {
  userRole: UserRole;
  userData: VibeUser | null;
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

export const Header: React.FC<HeaderProps> = ({ 
  userRole, 
  userData,
  currentRegion, 
  onRegionChange, 
  onLogout,
  activeRoute,
  onNavigate
}) => {
  const [isSystemMenuOpen, setIsSystemMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isHubOpen, setIsHubOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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

  const NavButton = ({ route, icon: Icon, label }: { route: AppRoute, icon: any, label: string }) => {
    const isActive = activeRoute === route;
    return (
      <button 
        onClick={() => onNavigate(route)}
        className={`relative flex flex-col items-center justify-center h-full px-8 md:px-10 transition-all group ${isActive ? 'text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:rounded-xl'}`}
        title={label}
      >
        <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
          <Icon />
        </div>
        {isActive && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full shadow-[0_-2px_8px_rgba(79,70,229,0.3)] animate-in slide-in-from-bottom-1" />
        )}
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
      <div className="flex items-center justify-between w-full max-w-[2560px] mx-auto h-full">
        
        {/* LEFT: Branding & Status Node */}
        <div className="flex items-center gap-3 md:gap-4 flex-1">
          <div 
            className="w-10 h-10 md:w-11 md:h-11 bg-slate-900 rounded-full flex items-center justify-center shadow-lg cursor-pointer active:scale-95 transition-all shrink-0"
            onClick={() => onNavigate(AppRoute.FEED)}
          >
            <span className="text-white font-black italic text-xl">V</span>
          </div>

          {/* Compact Signal Node in Header */}
          <button 
            onClick={() => setIsHubOpen(true)}
            className="hidden sm:flex items-center gap-2.5 p-1.5 pr-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-md transition-all active:scale-95 group shrink-0"
          >
            <div className="relative">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-lg shadow-sm">
                {userData?.statusEmoji || '⚡'}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${PRESENCE_DOTS[userData?.presenceStatus || 'Online']}`} />
            </div>
            <div className="text-left hidden md:block">
              <p className="text-[10px] font-black text-slate-900 leading-none truncate max-w-[100px]">{userData?.statusMessage || 'Syncing...'}</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest font-mono mt-0.5">{userData?.presenceStatus}</p>
            </div>
          </button>

          <div className={`relative flex items-center transition-all duration-300 rounded-full ${isSearchFocused ? 'w-full max-w-sm' : 'w-10 h-10 md:w-auto'}`}>
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-full transition-all ${isSearchFocused ? 'bg-white border-indigo-400 shadow-xl ring-4 ring-indigo-50 w-full' : 'bg-slate-100 md:w-56'}`}>
              <div className={`shrink-0 transition-colors ${isSearchFocused ? 'text-indigo-600' : 'text-slate-400'}`}>
                <ICONS.Search />
              </div>
              <input 
                type="text" 
                placeholder="Find Node..." 
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className={`bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-900 placeholder:text-slate-400 transition-all ${isSearchFocused ? 'w-full opacity-100' : 'hidden md:block w-full'}`}
              />
            </div>
          </div>
        </div>

        {/* CENTER: Primary Navigation */}
        <div className="hidden lg:flex items-center justify-center h-full flex-1">
          <div className="flex items-center h-full">
            <NavButton route={AppRoute.FEED} icon={ICONS.Home} label="Home" />
            <NavButton route={AppRoute.EXPLORE} icon={ICONS.Explore} label="Explore" />
            <NavButton route={AppRoute.MESSAGES} icon={ICONS.Messages} label="Messenger" />
            <NavButton route={AppRoute.PROFILE} icon={ICONS.Profile} label="Profile" />
            {userRole === 'admin' && <NavButton route={AppRoute.ADMIN} icon={ICONS.Admin} label="Admin" />}
          </div>
        </div>

        {/* RIGHT: Controls & Profile */}
        <div className="flex items-center gap-2 md:gap-3 flex-1 justify-end">
          <div className="hidden sm:flex items-center gap-2 mr-2">
            <button className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-all active:scale-90" title="Notifications">
              <ICONS.Bell />
            </button>
          </div>

          <div className="relative">
            <button 
              onClick={() => setIsSystemMenuOpen(!isSystemMenuOpen)}
              className="flex items-center gap-2 p-1 pl-1 pr-3 rounded-full hover:bg-slate-100 transition-all duration-300 active:scale-95 border border-slate-100 shadow-sm"
            >
              <div className="relative shrink-0">
                <img src={userData?.avatarUrl} className="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover shadow-sm ring-1 ring-white" alt="User" />
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${PRESENCE_DOTS[userData?.presenceStatus || 'Online']}`} />
              </div>
              <p className="hidden md:block text-[11px] font-black text-slate-800 tracking-tight truncate max-w-[80px]">
                {userData?.displayName.split(' ')[0]}
              </p>
              <svg className={`w-3 h-3 text-slate-400 transition-transform ${isSystemMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
            </button>

            {isSystemMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsSystemMenuOpen(false)}></div>
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-[1.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] border border-precision overflow-hidden z-20 animate-in zoom-in-95 slide-in-from-top-4 duration-300">
                  <div className="p-4 bg-slate-50/50">
                    <button 
                      onClick={() => { onNavigate(AppRoute.PROFILE); setIsSystemMenuOpen(false); }}
                      className="w-full flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-slate-100 mb-3"
                    >
                      <img src={userData?.avatarUrl} className="w-12 h-12 rounded-full object-cover" alt="" />
                      <div className="text-left">
                        <p className="font-black text-slate-900 text-sm tracking-tight">{userData?.displayName}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">See your profile</p>
                      </div>
                    </button>

                    {/* Quick Status Block in Dropdown */}
                    <button 
                      onClick={() => { setIsHubOpen(true); setIsSystemMenuOpen(false); }}
                      className="w-full flex items-center justify-between p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all text-white group"
                    >
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-2xl">
                           {userData?.statusEmoji}
                         </div>
                         <div className="text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest font-mono opacity-80">Calibrate Signal</p>
                            <p className="text-[11px] font-bold truncate max-w-[140px]">{userData?.statusMessage || userData?.presenceStatus}</p>
                         </div>
                      </div>
                      <div className="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                      </div>
                    </button>
                  </div>
                  
                  <div className="p-2 space-y-1">
                    <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Region Settings</div>
                    <div className="grid grid-cols-1">
                      {regions.map(r => (
                        <button 
                          key={r.code}
                          onClick={() => { onRegionChange(r.code); setIsSystemMenuOpen(false); }}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-all ${currentRegion === r.code ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-50 text-slate-600'}`}
                        >
                          <span className="flex items-center gap-3"><span>{r.flag}</span> {r.name}</span>
                          {currentRegion === r.code && <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-2 border-t border-precision">
                    <button 
                      onClick={() => { onLogout(); setIsSystemMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-3 text-rose-500 hover:bg-rose-50 rounded-lg transition-all font-bold text-xs"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
                      Log Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* NEURAL STATUS OVERLAY (Shared Hub) */}
      {isHubOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-2xl" onClick={() => setIsHubOpen(false)}></div>
           
           <div className="relative bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] border border-white/20 animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              
              <div className="relative z-10">
                 <div className="flex items-center gap-6 mb-10">
                    <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-[1.5rem] flex items-center justify-center text-5xl shadow-inner">
                      {localStatus.statusEmoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <input 
                        autoFocus
                        type="text"
                        value={localStatus.statusMessage}
                        onChange={(e) => setLocalStatus(prev => ({ ...prev, statusMessage: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && setIsHubOpen(false)}
                        placeholder="Current signal..."
                        className="w-full bg-transparent border-none p-0 text-2xl font-black text-slate-900 focus:ring-0 placeholder:text-slate-200 tracking-tighter italic"
                      />
                      <div className="flex items-center gap-2 mt-2">
                         <div className={`w-2 h-2 rounded-full ${PRESENCE_DOTS[localStatus.presenceStatus as PresenceStatus]}`} />
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono">
                           {localStatus.presenceStatus}
                         </span>
                      </div>
                    </div>
                 </div>

                 <div className="space-y-4 mb-10">
                   <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] font-mono ml-1">Quick_Transmissions</h4>
                   <div className="grid grid-cols-6 gap-3">
                     {IDENTITY_SIGNALS.map(signal => (
                       <button 
                         key={signal}
                         onClick={() => updateNeuralStatus({ statusEmoji: signal })}
                         className={`aspect-square rounded-full flex items-center justify-center text-xl transition-all active:scale-90 relative ${localStatus.statusEmoji === signal ? 'bg-indigo-600 shadow-[0_10px_30px_rgba(79,70,229,0.4)] scale-110 z-10' : 'bg-slate-50 hover:bg-slate-100 text-slate-400'}`}
                       >
                         {signal}
                       </button>
                     ))}
                   </div>
                 </div>

                 <div className="space-y-4 pt-8 border-t border-slate-50">
                    <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] font-mono ml-1">Signal_Modality</h4>
                    <div className="flex flex-wrap gap-2">
                      {['Online', 'Focus', 'Deep Work', 'Invisible'].map(status => (
                        <button 
                          key={status}
                          onClick={() => updateNeuralStatus({ presenceStatus: status as PresenceStatus })}
                          className={`px-5 py-3 rounded-full border transition-all flex items-center gap-3 ${localStatus.presenceStatus === status ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                        >
                          <div className={`w-2 h-2 rounded-full ${PRESENCE_DOTS[status as PresenceStatus]}`} />
                          <span className="text-[10px] font-black uppercase tracking-widest font-mono">
                            {status}
                          </span>
                        </button>
                      ))}
                    </div>
                 </div>

                 <button 
                  onClick={() => { updateNeuralStatus({ statusMessage: localStatus.statusMessage }); setIsHubOpen(false); }}
                  className="w-full mt-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3"
                 >
                   {isUpdatingStatus ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Confirm_Neural_Sync'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </header>
  );
};
