
import React, { useState, useEffect, useRef } from 'react';
import { User, WeatherInfo, PresenceStatus } from '../../types';
import { ICONS } from '../../constants';
import { fetchWeather } from '../../services/weather';
import { db } from '../../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface ProfileHeaderProps {
  userData: User;
  onEdit: () => void;
  postCount?: number;
  addToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  isOwnProfile?: boolean;
}

const PRESENCE_CONFIG: Record<PresenceStatus, { color: string, pulse: string, label: string }> = {
  'Online': { color: 'bg-[#10b981]', pulse: 'pulse-active-emerald', label: 'ONLINE' },
  'Focus': { color: 'bg-[#f59e0b]', pulse: 'pulse-active-amber', label: 'FOCUS' },
  'Deep Work': { color: 'bg-[#e11d48]', pulse: 'pulse-active-indigo', label: 'DEEP WORK' },
  'In-Transit': { color: 'bg-[#6366f1]', pulse: 'pulse-active-indigo', label: 'IN-TRANSIT' },
  'Away': { color: 'bg-[#94a3b8]', pulse: '', label: 'AWAY' },
  'Invisible': { color: 'bg-[#334155]', pulse: '', label: 'INVISIBLE' },
  'Syncing': { color: 'bg-[#60a5fa]', pulse: 'pulse-active-emerald', label: 'SYNCING' }
};

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ userData, onEdit, postCount = 0, addToast, isOwnProfile }) => {
  const [time, setTime] = useState<string>(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const getAtmosphere = async () => {
      const weatherData = await fetchWeather({ query: userData.location || 'London' });
      setWeather(weatherData);
    };
    getAtmosphere();
  }, [userData.location]);

  const updatePresence = async (status: PresenceStatus) => {
    if (!db || !isOwnProfile) return;
    try {
      await updateDoc(doc(db, 'users', userData.id), { presenceStatus: status });
      if (addToast) addToast(`Neural Presence Synchronised: ${status}`, 'success');
      setIsStatusMenuOpen(false);
    } catch (e) {
      if (addToast) addToast("Sync Interrupted", "error");
    }
  };

  const currentPresence = PRESENCE_CONFIG[userData.presenceStatus || 'Online'];

  return (
    <div className="relative rounded-[3.5rem] overflow-hidden mb-12 shadow-[0_30px_100px_rgba(0,0,0,0.1)] bg-white border border-slate-100">
      {/* Dark Cover Section */}
      <div className="h-96 md:h-[36rem] relative overflow-hidden bg-[#0a0c12]">
        {/* Geometric Art Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
          <div className="absolute top-10 -left-20 w-[30rem] h-[30rem] rounded-full border-[40px] border-white/[0.03]" />
          <div className="absolute bottom-20 right-[-10%] w-[35rem] h-[35rem] rounded-full border-[60px] border-white/[0.04]" />
          <div className="absolute top-1/2 left-1/4 w-40 h-40 rounded-full border-[10px] border-white/[0.02]" />
        </div>

        {userData.coverUrl && (
          <img 
            src={userData.coverUrl} 
            className="w-full h-full object-cover mix-blend-overlay opacity-40 transition-transform duration-[15s] hover:scale-110" 
            alt="" 
          />
        )}
        
        {/* Telemetry Widget (Top-Right) */}
        <div className="absolute top-8 right-8 md:top-12 md:right-12 z-20">
          <div className="bg-black/20 backdrop-blur-[40px] border border-white/10 pl-8 pr-5 py-3.5 rounded-[3rem] flex items-center gap-6 shadow-2xl">
            <div className="flex flex-col items-start pr-6 border-r border-white/10">
              <span className="text-[15px] font-black text-white tracking-[0.2em] font-mono leading-none">{time}</span>
              <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.4em] mt-2 font-mono flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                {userData.location || 'PARK STREET, UK'}
              </span>
            </div>
            {weather && (
              <div className="flex items-center gap-5">
                <div className="text-right">
                  <p className="text-2xl font-black text-white leading-none tracking-tighter">{weather.temp}°</p>
                  <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mt-1.5">{weather.condition}</p>
                </div>
                <div className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center border border-white/5">
                  <div className="w-4 h-4 bg-white/60 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Identity Cluster (Centered Left) */}
        <div className="absolute left-10 md:left-24 bottom-28 md:bottom-40 space-y-6 z-10">
          <div className="space-y-0">
            <h1 className="text-6xl md:text-[8.5rem] font-black text-white tracking-tighter leading-[0.85] drop-shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
              {userData.displayName.split(' ').map((part, i) => (
                <React.Fragment key={i}>
                  {part}
                  {i === 0 && <br />}
                </React.Fragment>
              ))}
            </h1>
            <p className="text-[12px] md:text-[18px] font-black text-white/30 uppercase tracking-[0.8em] font-mono mt-10 drop-shadow-lg">
              @{userData.username.toUpperCase()}
            </p>
          </div>

          {/* Floating Status Pill (Match Reference) */}
          <div 
            onClick={() => isOwnProfile && onEdit()}
            className="inline-flex items-center gap-5 bg-black/30 backdrop-blur-3xl border border-white/10 pl-5 pr-8 py-3.5 rounded-2xl shadow-2xl cursor-pointer hover:bg-black/40 transition-all group active:scale-95"
          >
            <span className="text-2xl group-hover:rotate-12 transition-transform">{userData.statusEmoji || '⚡'}</span>
            <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em] leading-none">
              {userData.statusMessage || 'JUST UPDATING FEATURES ON VIDESTREAM'}
            </p>
          </div>
        </div>
      </div>

      {/* White Action Bar Section */}
      <div className="px-6 md:px-24 py-12 flex flex-col md:flex-row justify-between items-end gap-10 relative bg-white">
        
        {/* Profile Squircle (Reference Match) */}
        <div className="absolute left-10 md:left-24 -top-28 md:-top-44 group z-30">
          <div className="relative">
            <div className={`absolute -inset-6 rounded-[5rem] transition-all duration-1000 ${currentPresence.pulse}`}></div>
            <div className="w-56 h-56 md:w-80 md:h-80 bg-white rounded-[4.5rem] p-3 shadow-[0_50px_100px_rgba(0,0,0,0.12)] border border-slate-50 overflow-hidden">
              <img 
                src={userData.avatarUrl} 
                className="w-full h-full rounded-[4rem] object-cover transition-transform duration-700 group-hover:scale-105" 
                alt={userData.displayName} 
              />
              
              {/* Presence Dot Trigger */}
              <button 
                onClick={() => isOwnProfile && setIsStatusMenuOpen(!isStatusMenuOpen)}
                className="absolute bottom-10 right-10 w-14 h-14 rounded-full border-[10px] border-white bg-slate-200 shadow-2xl flex items-center justify-center overflow-hidden active:scale-90 transition-transform"
              >
                <div className={`w-full h-full ${currentPresence.color} transition-colors duration-500`} />
              </button>
            </div>

            {/* Neural Presence Menu (Reference Match) */}
            {isStatusMenuOpen && (
              <>
                <div className="fixed inset-0 z-[60]" onClick={() => setIsStatusMenuOpen(false)}></div>
                <div className="absolute left-full ml-10 top-0 w-72 bg-white rounded-[2.5rem] shadow-[0_40px_120px_rgba(0,0,0,0.25)] border border-slate-100 z-[70] p-4 overflow-hidden animate-in zoom-in-95 slide-in-from-left-4 duration-300">
                  <p className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] border-b border-slate-50 mb-3 font-mono text-center">Neural Interface Presence</p>
                  <div className="space-y-1">
                    {(Object.keys(PRESENCE_CONFIG) as PresenceStatus[]).map(status => (
                      <button 
                        key={status}
                        onClick={() => updatePresence(status)}
                        className={`w-full flex items-center gap-5 px-6 py-4 rounded-[1.5rem] transition-all text-[11px] font-black uppercase tracking-widest ${userData.presenceStatus === status ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-600'}`}
                      >
                        <div className={`w-3 h-3 rounded-full ${PRESENCE_CONFIG[status].color} shadow-sm`} />
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Global Action Controls */}
        <div className="flex-1 flex justify-end items-center gap-6 pb-4">
          <button 
            onClick={onEdit}
            className="px-14 py-5 bg-white text-slate-900 border border-slate-100 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-[0_20px_40px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.1)] hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-4 group"
          >
            <div className="group-hover:rotate-180 transition-transform duration-700"><ICONS.Settings /></div>
            CALIBRATE
          </button>
          <button className="p-6 bg-[#4F6EF7] text-white rounded-[2rem] hover:bg-[#3F5ED7] transition-all active:scale-95 shadow-2xl shadow-indigo-200/50 flex items-center justify-center">
            <ICONS.Messages />
          </button>
        </div>
      </div>
    </div>
  );
};
