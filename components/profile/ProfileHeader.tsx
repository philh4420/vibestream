
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
  'Online': { color: 'bg-emerald-500', pulse: 'pulse-active-emerald', label: 'Live Pulse' },
  'Focus': { color: 'bg-amber-500', pulse: 'pulse-active-amber', label: 'In Focus' },
  'Deep Work': { color: 'bg-rose-600', pulse: 'pulse-active-indigo', label: 'Deep Work' },
  'In-Transit': { color: 'bg-indigo-600', pulse: 'pulse-active-indigo', label: 'Travelling' },
  'Away': { color: 'bg-slate-400', pulse: '', label: 'Away' },
  'Invisible': { color: 'bg-slate-700', pulse: '', label: 'Hidden' },
  'Syncing': { color: 'bg-blue-400', pulse: 'pulse-active-emerald', label: 'Syncing' }
};

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ userData, onEdit, postCount = 0, addToast, isOwnProfile }) => {
  const [time, setTime] = useState<string>(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [isUsingGPS, setIsUsingGPS] = useState(false);
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const hasAlertedRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const getAtmosphere = async () => {
      let weatherData: WeatherInfo | null = null;
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
          });
          weatherData = await fetchWeather({ 
            coords: { lat: position.coords.latitude, lon: position.coords.longitude } 
          });
          if (weatherData) {
            setIsUsingGPS(true);
            if (addToast && !hasAlertedRef.current) {
              addToast("Neural-Geo Handshake Established", "success");
              hasAlertedRef.current = true;
            }
          }
        } catch (geoError) {
          console.debug("Geo-link refused.");
        }
      }
      if (!weatherData) {
        weatherData = await fetchWeather({ query: userData.location || 'London' });
        setIsUsingGPS(false);
      }
      setWeather(weatherData);
    };
    getAtmosphere();
  }, [userData.location, addToast]);

  const updatePresence = async (status: PresenceStatus) => {
    if (!db || !isOwnProfile) return;
    try {
      await updateDoc(doc(db, 'users', userData.id), { presenceStatus: status });
      if (addToast) addToast(`Neural Presence: ${status}`, 'success');
      setIsStatusMenuOpen(false);
    } catch (e) {
      if (addToast) addToast("Sync Interrupted", "error");
    }
  };

  const currentPresence = PRESENCE_CONFIG[userData.presenceStatus || 'Online'];

  return (
    <div className="relative glass-panel rounded-[3rem] overflow-hidden mb-8 shadow-2xl border-white/20">
      {/* Cover Image */}
      <div className="h-64 md:h-96 relative overflow-hidden glass-shimmer">
        <img 
          src={userData.coverUrl} 
          className="w-full h-full object-cover transition-transform duration-[3s] hover:scale-110" 
          alt="" 
        />
        {/* Deep Contrast Overlay for Dark Covers */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
        
        {/* Top-Right Telemetry */}
        <div className="absolute top-6 right-6 md:top-8 md:right-8 flex items-center gap-3">
          <div className="glass-panel px-6 py-3.5 rounded-[2rem] border-white/20 backdrop-blur-[40px] flex items-center gap-6 shadow-2xl ring-1 ring-white/10">
            <div className="flex flex-col items-end border-r border-white/10 pr-6">
              <span className="text-sm font-black text-white uppercase tracking-[0.2em] font-mono leading-none">{time}</span>
              <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.3em] mt-2 font-mono flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${isUsingGPS ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`} />
                {userData.location || 'London_Core'}
              </span>
            </div>
            {weather && (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-lg font-black text-white leading-none">{weather.temp}°</p>
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-1.5">{weather.condition}</p>
                </div>
                <img src={`https://openweathermap.org/img/wn/${weather.icon}@4x.png`} className="w-10 h-10 brightness-125" alt="" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Identity Hub Content */}
      <div className="px-6 md:px-12 pb-10 -mt-24 md:-mt-32 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-8 text-center md:text-left">
            
            {/* Avatar & Presence Trigger */}
            <div className="relative group">
              <div className={`absolute -inset-4 rounded-[3.5rem] transition-all duration-1000 ${currentPresence.pulse}`}></div>
              <div className="relative z-10 cursor-pointer" onClick={() => isOwnProfile && setIsStatusMenuOpen(!isStatusMenuOpen)}>
                <img 
                  src={userData.avatarUrl} 
                  className="w-40 h-40 md:w-56 md:h-56 rounded-[3rem] object-cover border-[8px] border-white shadow-2xl transition-transform duration-500 group-hover:scale-105" 
                  alt={userData.displayName} 
                />
                <div className={`absolute bottom-2 right-2 w-10 h-10 rounded-full border-[6px] border-white ${currentPresence.color} shadow-2xl flex items-center justify-center`}>
                   {isOwnProfile && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                </div>
              </div>
              
              {isStatusMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsStatusMenuOpen(false)}></div>
                  <div className="absolute left-1/2 md:left-full bottom-full md:bottom-auto md:top-1/2 -translate-x-1/2 md:translate-x-6 -translate-y-4 md:-translate-y-1/2 w-56 bg-white rounded-[2rem] shadow-2xl border border-precision z-50 p-2 overflow-hidden animate-in zoom-in-95 duration-300">
                    <p className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Set Presence_Mode</p>
                    {(Object.keys(PRESENCE_CONFIG) as PresenceStatus[]).map(status => (
                      <button 
                        key={status}
                        onClick={() => updatePresence(status)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-[11px] font-bold ${userData.presenceStatus === status ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-600'}`}
                      >
                        <div className={`w-2.5 h-2.5 rounded-full ${PRESENCE_CONFIG[status].color}`} />
                        {status}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Typography & Bio Context */}
            <div className="pb-3 space-y-4 flex-1">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-4">
                {/* Visual Fix: Contrast Shadow/Backdrop for Name */}
                <div className="relative group">
                  <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
                    {userData.displayName}
                  </h1>
                  <div className="flex items-center justify-center md:justify-start gap-2 mt-3">
                    <span className="text-[14px] font-black text-white/90 uppercase tracking-[0.4em] font-mono drop-shadow-md">
                      @{userData.username}
                    </span>
                    <span className="hidden md:inline px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg text-[9px] font-black text-white uppercase tracking-widest border border-white/20">
                      {userData.trustTier || 'Alpha'}_NODE
                    </span>
                  </div>
                </div>
              </div>

              {/* Real-time Status Bubble */}
              <div className="flex items-center justify-center md:justify-start gap-3">
                <div className="glass-panel px-5 py-2.5 rounded-2xl border-white/20 flex items-center gap-3 backdrop-blur-3xl shadow-xl">
                  <span className="text-xl">{userData.statusEmoji || '⚡'}</span>
                  <p className="text-xs font-bold text-white tracking-tight leading-tight max-w-xs line-clamp-1">
                    {userData.statusMessage || 'Synchronising with the Grid...'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center md:pb-6">
            <button 
              onClick={onEdit}
              className="px-10 py-5 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <ICONS.Settings /> Calibrate
            </button>
            <button className="p-5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-200">
              <ICONS.Messages />
            </button>
          </div>
        </div>

        {/* Global Stats Matrix */}
        <div className="mt-12 pt-10 border-t border-white/10 flex flex-wrap justify-center md:justify-start gap-12">
           <div className="flex flex-col group cursor-pointer">
              <span className="text-3xl font-black text-white leading-none">{(userData.followers || 0).toLocaleString()}</span>
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-3">Resonators</span>
           </div>
           <div className="flex flex-col group cursor-pointer">
              <span className="text-3xl font-black text-white leading-none">{(userData.following || 0).toLocaleString()}</span>
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-3">Following</span>
           </div>
           <div className="flex flex-col group cursor-pointer">
              <span className="text-3xl font-black text-white leading-none">{postCount.toLocaleString()}</span>
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-3">Signals</span>
           </div>
        </div>
      </div>
    </div>
  );
};
