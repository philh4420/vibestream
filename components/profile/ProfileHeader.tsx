
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
  'Online': { color: 'bg-emerald-500', pulse: 'pulse-active-emerald', label: 'Live' },
  'Focus': { color: 'bg-amber-500', pulse: 'pulse-active-amber', label: 'Focus' },
  'Deep Work': { color: 'bg-rose-600', pulse: 'pulse-active-indigo', label: 'Deep Work' },
  'In-Transit': { color: 'bg-indigo-600', pulse: 'pulse-active-indigo', label: 'Transit' },
  'Away': { color: 'bg-slate-400', pulse: '', label: 'Away' },
  'Invisible': { color: 'bg-slate-700', pulse: '', label: 'Ghost' },
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
      if (addToast) addToast(`Neural Presence Synchronised: ${status}`, 'success');
      setIsStatusMenuOpen(false);
    } catch (e) {
      if (addToast) addToast("Sync Interrupted", "error");
    }
  };

  const currentPresence = PRESENCE_CONFIG[userData.presenceStatus || 'Online'];

  return (
    <div className="relative rounded-[3rem] overflow-hidden mb-8 shadow-2xl bg-white border border-slate-100">
      {/* Cover Image Area */}
      <div className="h-80 md:h-[32rem] relative overflow-hidden bg-[#0A0C14]">
        {/* Geometric Background Circles (as per reference) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 -left-16 w-[28rem] h-[28rem] rounded-full border-[60px] border-white/[0.03] shadow-[0_0_120px_rgba(255,255,255,0.02)]" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[32rem] h-[32rem] rounded-full border-[80px] border-white/[0.04] shadow-[0_0_150px_rgba(255,255,255,0.05)]" />
          <div className="absolute top-1/2 left-1/3 w-40 h-40 rounded-full border-[15px] border-white/[0.02]" />
        </div>

        {userData.coverUrl && (
          <img 
            src={userData.coverUrl} 
            className="w-full h-full object-cover mix-blend-soft-light opacity-60 transition-transform duration-[12s] hover:scale-105" 
            alt="" 
          />
        )}
        
        {/* Top-Right Telemetry Widget (High Fidelity) */}
        <div className="absolute top-8 right-8 md:top-12 md:right-12 z-20">
          <div className="bg-white/10 backdrop-blur-[60px] border border-white/20 pl-10 pr-6 py-4 rounded-[3.5rem] flex items-center gap-8 shadow-2xl ring-1 ring-white/5">
            <div className="flex flex-col items-center pr-8 border-r border-white/10">
              <span className="text-sm font-black text-white tracking-[0.3em] font-mono leading-none">{time}</span>
              <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.4em] mt-3 font-mono flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${isUsingGPS ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-white/20'}`} />
                {userData.location || 'London, UK'}
              </span>
            </div>
            {weather && (
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-2xl font-black text-white leading-none tracking-tighter">{weather.temp}°</p>
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] mt-2">{weather.condition}</p>
                </div>
                <div className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                  <div className="w-3.5 h-3.5 bg-white/60 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Identity Text (Bottom-Left Alignment) */}
        <div className="absolute left-10 md:left-24 bottom-28 md:bottom-36 space-y-6 z-10">
          <div className="space-y-0">
            <h1 className="text-6xl md:text-[7.5rem] font-black text-white tracking-tighter leading-[0.9] drop-shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
              {userData.displayName.split(' ').map((part, i) => (
                <React.Fragment key={i}>
                  {part}
                  {i === 0 && <br />}
                </React.Fragment>
              ))}
            </h1>
            <p className="text-[12px] md:text-[16px] font-black text-white/30 uppercase tracking-[0.8em] font-mono mt-8 drop-shadow-md">
              @{userData.username.toUpperCase()}
            </p>
          </div>

          {/* Real-time Status Pill (Floating Professional) */}
          <div 
            onClick={() => isOwnProfile && setIsStatusMenuOpen(true)}
            className="inline-flex items-center gap-5 bg-white/5 backdrop-blur-[80px] border border-white/10 pl-5 pr-8 py-3 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] cursor-pointer hover:bg-white/15 transition-all group active:scale-95"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">{userData.statusEmoji || '⚡'}</span>
            <p className="text-[11px] font-black text-white/90 uppercase tracking-widest leading-none">
              {userData.statusMessage || 'Synchronising with the Grid...'}
            </p>
          </div>
        </div>
      </div>

      {/* Lower Profile Bar (White Section) */}
      <div className="px-6 md:px-24 py-10 flex flex-col md:flex-row justify-between items-end gap-8 relative bg-white">
        
        {/* Squircle Avatar with Presence Logic */}
        <div className="absolute left-10 md:left-24 -top-24 md:-top-40 group z-30">
          <div className="relative">
            <div className={`absolute -inset-5 rounded-[4.5rem] transition-all duration-1000 ${currentPresence.pulse}`}></div>
            <div 
              onClick={() => isOwnProfile && setIsStatusMenuOpen(!isStatusMenuOpen)}
              className="w-44 h-44 md:w-72 md:h-72 bg-white rounded-[4.2rem] p-3 shadow-[0_40px_80px_rgba(0,0,0,0.15)] ring-1 ring-slate-100 transition-transform hover:scale-[1.02] cursor-pointer"
            >
              <img 
                src={userData.avatarUrl} 
                className="w-full h-full rounded-[3.6rem] object-cover" 
                alt={userData.displayName} 
              />
              {/* Presence Indicator Dot (Reference Match) */}
              <div className="absolute bottom-8 right-8 w-14 h-14 rounded-full border-[10px] border-white bg-slate-200 shadow-2xl flex items-center justify-center overflow-hidden">
                 <div className={`w-full h-full ${currentPresence.color} transition-colors duration-500`} />
              </div>
            </div>

            {/* Presence Choice Menu */}
            {isStatusMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsStatusMenuOpen(false)}></div>
                <div className="absolute left-1/2 md:left-full bottom-[110%] md:bottom-auto md:top-1/2 -translate-x-1/2 md:translate-x-12 md:-translate-y-1/2 w-64 bg-white rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.2)] border border-slate-100 z-50 p-3 overflow-hidden animate-in zoom-in-95 duration-300">
                  <p className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-50 mb-2 font-mono">Neural Interface Presence</p>
                  {(Object.keys(PRESENCE_CONFIG) as PresenceStatus[]).map(status => (
                    <button 
                      key={status}
                      onClick={() => updatePresence(status)}
                      className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all text-[11px] font-black uppercase tracking-wider ${userData.presenceStatus === status ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50 text-slate-600'}`}
                    >
                      <div className={`w-2.5 h-2.5 rounded-full ${PRESENCE_CONFIG[status].color}`} />
                      {status}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Controls (Right Aligned) */}
        <div className="flex-1 flex justify-end items-center gap-6 pb-2">
          <button 
            onClick={onEdit}
            className="px-12 py-5 bg-white text-slate-900 border border-slate-100 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-xl hover:shadow-2xl hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-4 group"
          >
            <div className="group-hover:rotate-180 transition-transform duration-700"><ICONS.Settings /></div>
            CALIBRATE
          </button>
          <button className="p-6 bg-[#4F6EF7] text-white rounded-[2rem] hover:bg-[#3F5ED7] transition-all active:scale-95 shadow-2xl shadow-indigo-200 flex items-center justify-center">
            <ICONS.Messages />
          </button>
        </div>
      </div>
    </div>
  );
};
