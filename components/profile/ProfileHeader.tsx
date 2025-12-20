
import React, { useState, useEffect } from 'react';
import { User, WeatherInfo } from '../../types';
import { ICONS, PRESENCE_CONFIG } from '../../constants';
import { fetchWeather } from '../../services/weather';

interface ProfileHeaderProps {
  userData: User;
  onEdit: () => void;
  postCount?: number;
  addToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  isOwnProfile?: boolean;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ userData, onEdit, postCount = 0, addToast, isOwnProfile }) => {
  const [time, setTime] = useState<string>(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }));
  const [weather, setWeather] = useState<WeatherInfo | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }));
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const getAtmosphere = async () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const weatherData = await fetchWeather({ coords: { lat: position.coords.latitude, lon: position.coords.longitude } });
            if (weatherData) setWeather(weatherData);
          },
          async () => {
            const weatherData = await fetchWeather({ query: userData.location || 'London' });
            setWeather(weatherData);
          }
        );
      } else {
        const weatherData = await fetchWeather({ query: userData.location || 'London' });
        setWeather(weatherData);
      }
    };
    getAtmosphere();
  }, [userData.location]);

  const currentPresence = PRESENCE_CONFIG[userData.presenceStatus || 'Online'];

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-top-4 duration-1000">
      
      {/* Top Grid: Identity Cluster + Metrics + Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        
        {/* Main Identity Panel (Matches Top Left in Image) */}
        <div className="lg:col-span-8 bg-white border border-precision rounded-[3rem] p-8 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] relative overflow-hidden flex flex-col justify-center min-h-[340px] md:min-h-[420px]">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/30 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          
          <div className="flex flex-col md:flex-row gap-8 md:gap-14 items-center md:items-start relative z-10">
            {/* Profile Image & Presence Overlay */}
            <div className="relative group shrink-0">
              <div className={`absolute -inset-4 rounded-[3.2rem] opacity-20 blur-2xl transition-all duration-700 ${currentPresence.pulse}`} />
              <div className="relative">
                <img 
                  src={userData.avatarUrl} 
                  className="w-32 h-32 md:w-44 md:h-44 rounded-[2.8rem] object-cover border-[6px] border-white shadow-2xl relative z-10 transition-transform duration-700 group-hover:scale-105" 
                  alt={userData.displayName} 
                />
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-slate-800 rounded-2xl p-1 shadow-2xl z-20 border-[3px] border-white flex items-center justify-center">
                  <div className={`w-3 h-3 rounded-full ${currentPresence.color} ${currentPresence.pulse}`} />
                </div>
              </div>
            </div>

            <div className="space-y-6 flex-1 text-center md:text-left">
              <div className="space-y-4">
                <div className="flex items-center justify-center md:justify-start gap-4 flex-wrap">
                  <h1 className="text-4xl md:text-7xl font-black text-slate-900 tracking-tighter italic leading-none">{userData.displayName}</h1>
                  {userData.verifiedHuman && (
                    <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-100 scale-125">
                      <ICONS.Verified />
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  <span className="px-4 py-2 bg-slate-50 text-[10px] font-black uppercase tracking-[0.25em] rounded-xl text-slate-400 font-mono border border-slate-100">@{userData.username.toUpperCase()}</span>
                  <span className="px-4 py-2 bg-indigo-50 text-[10px] font-black uppercase tracking-[0.25em] rounded-xl text-indigo-500 font-mono italic border border-indigo-100/50">{userData.role?.toUpperCase()}</span>
                  {userData.pronouns && <span className="px-4 py-2 bg-slate-900 text-[10px] font-black uppercase tracking-[0.25em] rounded-xl text-white font-mono">{userData.pronouns.toUpperCase()}</span>}
                </div>
              </div>

              <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed italic max-w-2xl mx-auto md:mx-0">
                {userData.bio || "Initialising neural signal..."}
              </p>

              <div className="flex items-center justify-center md:justify-start gap-5 pt-4">
                {isOwnProfile && (
                  <button 
                    onClick={onEdit}
                    className="h-16 px-10 bg-slate-950 text-white rounded-[1.8rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-slate-200 hover:bg-black transition-all active:scale-95 flex items-center gap-5 group"
                  >
                    <div className="group-hover:rotate-90 transition-transform duration-500"><ICONS.Settings /></div>
                    CALIBRATE_ID
                  </button>
                )}
                <button className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-[1.8rem] hover:bg-indigo-100 transition-all active:scale-95 flex items-center justify-center border border-indigo-100 group">
                  <div className="group-hover:scale-110 transition-transform"><ICONS.Messages /></div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column Stack (Matches Image Layout) */}
        <div className="lg:col-span-4 flex flex-col gap-6 h-full">
          
          {/* Stats Hub (Dark Block in Image) */}
          <div className="bg-slate-950 rounded-[3rem] p-10 text-white flex justify-between items-center shadow-2xl relative overflow-hidden h-[180px] md:h-1/2">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
            {[
              { label: 'Signals', val: postCount },
              { label: 'Conn', val: userData.followers },
              { label: 'Follow', val: userData.following }
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center relative z-10 text-center flex-1">
                <p className="text-4xl md:text-5xl font-black tracking-tighter leading-none mb-3">{stat.val.toLocaleString('en-GB')}</p>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] font-mono">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Time & Weather Node (White Block in Image) */}
          <div className="bg-white border border-precision rounded-[3rem] p-10 flex justify-between items-center group shadow-sm hover:border-indigo-500/15 transition-all overflow-hidden relative h-[180px] md:h-1/2">
            <div className="space-y-2 relative z-10">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] font-mono leading-none mb-3">ATMOSPHERIC_LINK</p>
              <p className="text-6xl md:text-7xl font-black text-slate-900 tracking-tighter italic leading-none select-none">{time}</p>
              <p className="text-[10px] font-black text-indigo-600 font-mono tracking-widest uppercase">LOCAL_PRECISION</p>
            </div>
            
            {weather && (
              <div className="text-right relative z-10 shrink-0 flex flex-col items-end">
                 <div className="relative">
                   <div className="absolute inset-0 bg-amber-500/10 blur-xl rounded-full scale-150 animate-pulse" />
                   <img src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} className="w-20 h-20 md:w-24 md:h-24 relative z-10" alt="" />
                 </div>
                 <div className="mt-2">
                   <p className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">{weather.temp}°C</p>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono mt-2">{weather.condition.toUpperCase()}</p>
                 </div>
              </div>
            )}
            
            {!weather && (
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center animate-pulse border border-slate-100">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Persistent Neural Status Bar (Bottom Blue Bar in Image) */}
      <div className="w-full bg-indigo-600 rounded-[3rem] p-6 md:p-8 text-white flex flex-col lg:flex-row items-center justify-between group shadow-2xl relative overflow-hidden min-h-[120px]">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none scale-150"><ICONS.Globe /></div>
        
        <div className="flex items-center gap-6 md:gap-10 mb-6 lg:mb-0 w-full lg:w-auto">
           <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 backdrop-blur-xl rounded-[1.8rem] flex items-center justify-center text-4xl shadow-inner border border-white/20 shrink-0 group-hover:scale-110 transition-transform duration-700">
             {userData.statusEmoji || '⚡'}
           </div>
           <div className="flex-1">
              <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.4em] font-mono mb-2 opacity-80">NEURAL_SIGNAL</p>
              <p className="text-xl md:text-3xl font-black italic tracking-tight leading-none text-white selection:bg-white/20 truncate">
                "{userData.statusMessage || 'Updating features on VibeStream'}"
              </p>
           </div>
        </div>

        <div className="flex items-center gap-8 px-10 py-5 bg-black/15 rounded-[2rem] border border-white/10 backdrop-blur-md shadow-lg w-full lg:w-auto justify-between lg:justify-start">
           <div className="flex items-center gap-4">
              <div className={`w-3.5 h-3.5 rounded-full ${currentPresence.color} animate-pulse shadow-[0_0_20px_white]`} />
              <span className="text-[11px] md:text-xs font-black uppercase tracking-[0.3em] font-mono">{userData.presenceStatus?.toUpperCase() || 'INVISIBLE'}</span>
           </div>
           <div className="w-px h-8 bg-white/20 hidden md:block" />
           <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70 font-mono hidden md:block">NODE_STABLE_GB</p>
        </div>
      </div>

    </div>
  );
};
