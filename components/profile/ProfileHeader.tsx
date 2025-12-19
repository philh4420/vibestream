
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

const PRESENCE_CONFIG: Record<PresenceStatus, { color: string, pulse: string, label: string, dot: string }> = {
  'Online': { color: 'bg-emerald-500', pulse: 'pulse-active-emerald', label: 'Live Pulse', dot: 'bg-emerald-400' },
  'Focus': { color: 'bg-amber-500', pulse: 'pulse-active-amber', label: 'In Focus', dot: 'bg-amber-400' },
  'Deep Work': { color: 'bg-rose-600', pulse: 'pulse-active-indigo', label: 'Deep Work', dot: 'bg-rose-400' },
  'In-Transit': { color: 'bg-indigo-600', pulse: 'pulse-active-indigo', label: 'Travelling', dot: 'bg-indigo-400' },
  'Away': { color: 'bg-slate-400', pulse: '', label: 'Away', dot: 'bg-slate-300' },
  'Invisible': { color: 'bg-slate-700', pulse: '', label: 'Hidden', dot: 'bg-slate-500' },
  'Syncing': { color: 'bg-blue-400', pulse: 'pulse-active-emerald', label: 'Syncing', dot: 'bg-blue-300' }
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
    <div className="relative rounded-[3rem] overflow-hidden mb-8 shadow-2xl bg-white border border-slate-100">
      {/* Cover Image Area */}
      <div className="h-80 md:h-[30rem] relative overflow-hidden bg-black">
        {/* Geometric Background Circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-10 -left-10 w-64 h-64 rounded-full border-[30px] border-white/5 shadow-[0_0_80px_rgba(255,255,255,0.05)]" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full border-[50px] border-white/5 shadow-[0_0_100px_rgba(255,255,255,0.1)]" />
          <div className="absolute top-1/2 left-1/4 w-32 h-32 rounded-full border-[10px] border-white/5" />
        </div>

        {userData.coverUrl && (
          <img 
            src={userData.coverUrl} 
            className="w-full h-full object-cover mix-blend-overlay opacity-60 transition-transform duration-[10s] hover:scale-110" 
            alt="" 
          />
        )}
        
        {/* Deep Contrast Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Top-Right Telemetry Widget (from reference image) */}
        <div className="absolute top-6 right-6 md:top-10 md:right-10">
          <div className="glass-panel pl-8 pr-4 py-3 rounded-[3rem] border-white/10 backdrop-blur-[40px] flex items-center gap-6 shadow-2xl ring-1 ring-white/10">
            <div className="flex flex-col items-start pr-6 border-r border-white/10">
              <span className="text-sm font-black text-white tracking-[0.2em] font-mono leading-none">{time}</span>
              <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.3em] mt-2 font-mono flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${isUsingGPS ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`} />
                {userData.location || 'London, UK'}
              </span>
            </div>
            {weather && (
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xl font-black text-white leading-none">{weather.temp}°</p>
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-1.5">{weather.condition}</p>
                </div>
                <div className="w-10 h-10 bg-slate-400/30 rounded-full flex items-center justify-center border border-white/10">
                  <img src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} className="w-8 h-8 brightness-125" alt="" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Identity Text Hub (Name & Status) */}
        <div className="absolute left-10 md:left-24 bottom-24 md:bottom-32 space-y-4">
          <div className="space-y-1">
            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-none drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
              {userData.displayName.split(' ').map((part, i) => (
                <React.Fragment key={i}>
                  {part}
                  <br className="md:hidden" />
                  {i === 0 && <span className="hidden md:inline"> </span>}
                </React.Fragment>
              ))}
            </h1>
            <p className="text-[12px] md:text-[14px] font-black text-white/40 uppercase tracking-[0.6em] font-mono mt-4">
              @{userData.username}
            </p>
          </div>

          {/* Real-time Status Pill (from reference image) */}
          <div 
            onClick={() => isOwnProfile && setIsStatusMenuOpen(true)}
            className="inline-flex items-center gap-4 bg-white/10 backdrop-blur-3xl border border-white/20 pl-4 pr-6 py-2.5 rounded-2xl shadow-2xl cursor-pointer hover:bg-white/20 transition-all group"
          >
            <span className="text-xl group-hover:scale-125 transition-transform">{userData.statusEmoji || '⚡'}</span>
            <p className="text-[11px] font-bold text-white tracking-tight leading-none">
              {userData.statusMessage || 'Synchronising with the Grid...'}
            </p>
          </div>
        </div>
      </div>

      {/* Profile Lower Action Bar */}
      <div className="px-6 md:px-24 py-8 relative bg-white min-h-[140px]">
        {/* Presence Selector Menu */}
        {isStatusMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsStatusMenuOpen(false)}></div>
            <div className="absolute left-10 md:left-24 bottom-full mb-4 w-64 bg-white rounded-[2rem] shadow-[0_30px_100px_rgba(0,0,0,0.2)] border border-precision z-50 p-2 overflow-hidden animate-in zoom-in-95 duration-300">
              <p className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Neural Hub Presence</p>
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

        {/* Squircle Avatar Overlay */}
        <div className="absolute left-10 md:left-24 -top-24 md:-top-32 group">
          <div className={`absolute -inset-4 rounded-[3.5rem] transition-all duration-1000 ${currentPresence.pulse}`}></div>
          <div className="relative z-10">
            <div className="w-48 h-48 md:w-64 md:h-64 bg-white rounded-[3.5rem] p-3 shadow-2xl">
              <img 
                src={userData.avatarUrl} 
                className="w-full h-full rounded-[2.8rem] object-cover transition-transform duration-500 group-hover:scale-105" 
                alt={userData.displayName} 
              />
            </div>
            {/* Status Dot */}
            <div className="absolute bottom-6 right-6 w-12 h-12 rounded-full border-[8px] border-white bg-slate-300 shadow-xl flex items-center justify-center overflow-hidden">
               <div className={`w-full h-full ${currentPresence.color} border-[4px] border-white/20`} />
            </div>
          </div>
        </div>

        {/* Buttons (from reference image) */}
        <div className="flex justify-end items-center gap-4">
          <button 
            onClick={onEdit}
            className="px-10 py-5 bg-white text-slate-900 border border-slate-100 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:shadow-2xl hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-3"
          >
            <ICONS.Settings />
            CALIBRATE
          </button>
          <button className="p-5 bg-[#4F6EF7] text-white rounded-3xl hover:bg-[#3F5ED7] transition-all active:scale-95 shadow-xl shadow-indigo-100 flex items-center justify-center">
            <ICONS.Messages />
          </button>
        </div>
      </div>

      {/* Optional: Stats Matrix if needed for context, usually below the header in Layout */}
    </div>
  );
};
