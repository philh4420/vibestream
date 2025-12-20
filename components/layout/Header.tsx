
import React, { useState, useEffect } from 'react';
import { db, auth } from '../../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ICONS, IDENTITY_SIGNALS } from '../../constants';
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

        {/* RIGHT: Status & Profile Dropdown */}
        <div className="flex items-center gap-3 md:gap-4 justify-end">
          
          {/* Signal Node Pill (Image 1 Refined Positioning) */}
          <button 
            onClick={() => setIsHubOpen(true)}
            className="flex items-center gap-3 p-1.5 pr-4 bg-white border border-slate-100 rounded-2xl hover:shadow-md transition-all active:scale-95 group shrink-0"
          >
            <div className="relative">
              <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-xl shadow-inner">
                {userData?.statusEmoji || '⚡'}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${PRESENCE_DOTS[userData?.presenceStatus || 'Online']}`} />
            </div>
            <div className="text-left hidden xs:block">
              <p className="text-[11px] font-black text-[#1e293b] leading-tight truncate max-w-[80px] md:max-w-[120px]">
                {userData?.statusMessage || 'Establish Signal'}
              </p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono mt-0.5">
                {userData?.presenceStatus}
              </p>
            </div>
          </button>

          <div className="relative">
            {/* PROFILE TRIGGER PILL (Image 3 Style: 'Phil') */}
            <button 
              onClick={() => setIsSystemMenuOpen(!isSystemMenuOpen)}
              className="flex items-center gap-3 p-1.5 pr-4 rounded-full bg-white border border-slate-100 shadow-[0_2px_15px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-300 active:scale-95"
            >
              <div className="relative shrink-0">
                <img 
                  src={userData?.avatarUrl} 
                  className="w-10 h-10 rounded-full object-cover shadow-sm ring-1 ring-slate-50" 
                  alt="User" 
                />
                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-[2.5px] border-white shadow-sm ${PRESENCE_DOTS[userData?.presenceStatus || 'Online']}`} />
              </div>
              <span className="hidden xs:block text-[15px] font-black text-[#0f172a] tracking-tight">
                {userData?.displayName.split(' ')[0]}
              </span>
              <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${isSystemMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M19 9l-7 7-7-7" /></svg>
            </button>

            {isSystemMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsSystemMenuOpen(false)}></div>
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-[2.5rem] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.25)] border border-precision overflow-hidden z-20 animate-in zoom-in-95 slide-in-from-top-4 duration-500">
                  <div className="p-5 space-y-3">
                    {/* Active Status Display in Dropdown (Visible when Right Sidebar is Hidden) */}
                    <button 
                      onClick={() => { setIsHubOpen(true); setIsSystemMenuOpen(false); }}
                      className="w-full flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl hover:bg-slate-50 transition-all text-left border border-slate-100 group"
                    >
                      <div className="relative shrink-0">
                         <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm border border-slate-200">
                           {userData?.statusEmoji}
                         </div>
                         <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${PRESENCE_DOTS[userData?.presenceStatus || 'Online']}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono mb-0.5">Active_Signal</p>
                         <p className="text-[12px] font-bold text-slate-900 truncate tracking-tight italic">
                           {userData?.statusMessage || 'Establishing broadcast...'}
                         </p>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                           {userData?.presenceStatus}
                         </p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                         <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M9 5l7 7-7 7" /></svg>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => { onNavigate(AppRoute.PROFILE); setIsSystemMenuOpen(false); }}
                      className="w-full flex items-center gap-3 p-4 bg-[#4f46e5] text-white rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all group"
                    >
                      <img src={userData?.avatarUrl} className="w-10 h-10 rounded-xl object-cover border border-white/20" alt="" />
                      <div className="text-left overflow-hidden">
                        <p className="font-black text-sm tracking-tight truncate">{userData?.displayName}</p>
                        <p className="text-[9px] font-bold uppercase tracking-widest font-mono opacity-80">Full Profile Access</p>
                      </div>
                    </button>
                  </div>
                  
                  <div className="px-5 pb-5 space-y-1">
                    <div className="px-4 py-2 text-[10px] font-black text-slate-300 uppercase tracking-widest font-mono">Infrastructure Nodes</div>
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

                  <div className="p-3 border-t border-slate-50">
                    <button 
                      onClick={() => { onLogout(); setIsSystemMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-4 text-rose-500 hover:bg-rose-50 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest"
                    >
                      Terminate Grid Session
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* NEURAL STATUS HUB (Overlay UI - Matches Grid Modality Screenshot) */}
      {isHubOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 animate-in fade-in duration-400">
           <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-3xl" onClick={() => setIsHubOpen(false)}></div>
           
           <div className="relative bg-white w-full max-w-sm rounded-[3.5rem] p-8 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border border-white animate-in zoom-in-95 slide-in-from-bottom-12 duration-500 overflow-hidden">
              <div className="relative z-10">
                 {/* Status Message Entry */}
                 <div className="flex items-center gap-6 mb-12 pt-4">
                    <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-[2rem] flex items-center justify-center text-5xl shadow-inner shrink-0">
                      {localStatus.statusEmoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <input 
                        autoFocus
                        type="text"
                        value={localStatus.statusMessage}
                        onChange={(e) => setLocalStatus(prev => ({ ...prev, statusMessage: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && setIsHubOpen(false)}
                        placeholder="Neural broadcast..."
                        className="w-full bg-transparent border-none p-0 text-2xl font-black text-slate-900 focus:ring-0 placeholder:text-slate-100 tracking-tighter"
                      />
                    </div>
                 </div>

                 {/* Modality Section (Exact Image 4 Style) */}
                 <div className="space-y-6 mb-12">
                    <h4 className="text-[11px] font-black text-[#94a3b8] uppercase tracking-[0.4em] font-mono ml-1">Grid_Modality</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {(['Online', 'Focus', 'Deep Work', 'Invisible'] as const).map(status => (
                        <button 
                          key={status}
                          onClick={() => setLocalStatus(prev => ({ ...prev, presenceStatus: status }))}
                          className={`h-16 rounded-[2rem] border transition-all flex items-center gap-3 px-6 active:scale-95 ${localStatus.presenceStatus === status ? 'bg-[#0f172a] border-[#0f172a] text-white shadow-xl' : 'bg-white border-slate-100 text-[#94a3b8] hover:border-slate-200'}`}
                        >
                          <div className={`w-2.5 h-2.5 rounded-full ${PRESENCE_DOTS[status]}`} />
                          <span className="text-[11px] font-black uppercase tracking-widest font-mono">
                            {status}
                          </span>
                        </button>
                      ))}
                    </div>
                 </div>

                 {/* Confirm Button (Exact Image 4 Style) */}
                 <button 
                  onClick={() => { updateNeuralStatus({ statusMessage: localStatus.statusMessage, presenceStatus: localStatus.presenceStatus as PresenceStatus }); setIsHubOpen(false); }}
                  className="w-full py-6 bg-[#4f46e5] text-white rounded-[2rem] font-black text-[12px] uppercase tracking-[0.4em] shadow-2xl hover:bg-indigo-700 transition-all active:scale-95"
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
