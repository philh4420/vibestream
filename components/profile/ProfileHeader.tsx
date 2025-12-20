
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
    <div className="flex flex-col gap-12 w-full max-w-[140rem] mx-auto animate-in fade-in duration-1000">
      
      {/* 2026 SPATIAL CORE: Identity & Telemetry */}
      <div className="relative flex flex-col xl:flex-row gap-10 items-stretch">
        
        {/* IDENTITY_NODE: Primary Focal Point */}
        <div className="flex-1 bg-white border border-slate-100 rounded-[4rem] p-10 md:p-14 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.06)] relative overflow-hidden flex flex-col justify-center min-h-[400px]">
          {/* Neural Gradient Accent */}
          <div className="absolute top-0 right-0 w-[60%] h-full bg-gradient-to-l from-indigo-50/30 to-transparent pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-center lg:items-start relative z-10">
            {/* Avatar Architecture */}
            <div className="relative group shrink-0">
              <div className="absolute -inset-6 bg-slate-100/50 rounded-[4.5rem] blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
              <img 
                src={userData.avatarUrl} 
                className="w-44 h-44 md:w-60 md:h-60 rounded-[4rem] object-cover border-[10px] border-white shadow-2xl relative z-10 transition-transform duration-500 hover:scale-[1.03]" 
                alt={userData.displayName} 
              />
              <div className="absolute bottom-4 right-4 w-14 h-14 bg-slate-900 rounded-3xl p-1 shadow-2xl z-20 border-4 border-white flex items-center justify-center">
                <div className={`w-3.5 h-3.5 rounded-full ${currentPresence.color} shadow-[0_0_15px_rgba(255,255,255,0.4)] animate-pulse`} />
              </div>
            </div>

            {/* Typography Stack */}
            <div className="flex-1 text-center lg:text-left pt-2">
              <h1 className="text-6xl md:text-[clamp(4.5rem,7vw,8.5rem)] font-black text-slate-950 tracking-[-0.05em] italic leading-[0.85] uppercase mb-8">
                {userData.displayName.split(' ').map((word, i) => (
                  <span key={i} className="block">{word}</span>
                ))}
              </h1>
              
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-10">
                <span className="px-5 py-2.5 bg-slate-950 text-white text-[10px] font-black uppercase tracking-[0.4em] rounded-2xl font-mono">@{userData.username.toUpperCase()}</span>
                <span className="px-5 py-2.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-[0.4em] rounded-2xl font-mono italic border border-indigo-100">{userData.role?.toUpperCase()}</span>
                <span className="px-5 py-2.5 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] rounded-2xl font-mono">{userData.pronouns?.toUpperCase() || 'HE/HIM'}</span>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-6">
                {isOwnProfile && (
                  <button 
                    onClick={onEdit}
                    className="h-20 px-12 bg-slate-950 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.4em] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] hover:bg-black transition-all active:scale-95 flex items-center gap-6 group"
                  >
                    <div className="scale-110 group-hover:rotate-90 transition-transform duration-700"><ICONS.Settings /></div>
                    CALIBRATE_ID
                  </button>
                )}
                <button className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl hover:bg-indigo-100 transition-all active:scale-95 flex items-center justify-center border border-indigo-100 group shadow-lg">
                  <div className="scale-[1.6] group-hover:scale-110 transition-transform"><ICONS.Messages /></div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* TELEMETRY_SATELLITES: Floating Data Nodes */}
        <div className="xl:w-[420px] flex flex-col gap-10">
          
          {/* STATS_NODE: Matte Intensity */}
          <div className="bg-slate-950 rounded-[4rem] p-12 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden flex-1 min-h-[240px]">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.6em] font-mono relative z-10">NETWORK_METRICS</p>
            
            <div className="flex justify-between items-end relative z-10">
              {[
                { label: 'SIGNALS', val: postCount },
                { label: 'CONN', val: userData.followers },
                { label: 'FOLLOW', val: userData.following }
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center">
                  <p className="text-6xl font-black tracking-[-0.06em] leading-none mb-3 italic">{stat.val}</p>
                  <p className="text-[9px] font-black text-slate-700 uppercase tracking-[0.4em] font-mono">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ATMOSPHERIC_NODE: Precision Chrono */}
          <div className="bg-white border border-slate-100 rounded-[4rem] p-12 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.04)] relative overflow-hidden flex-1 min-h-[240px] flex flex-col justify-between group">
            <div className="flex justify-between items-start relative z-20">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.8em] font-mono leading-none">ATMOSPHERIC_LINK</p>
              <div className="flex flex-col items-end">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] font-mono leading-none mb-2">LOCAL_PRECISION</p>
                {weather && <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.6em] font-mono leading-none">{weather.condition.toUpperCase()}</p>}
              </div>
            </div>

            <div className="flex items-center justify-between w-full relative z-10">
              <p className="text-8xl md:text-9xl font-black text-slate-950 tracking-[-0.07em] italic leading-none select-none group-hover:scale-105 transition-transform duration-700 origin-left">
                {time}
              </p>
              {weather && (
                <div className="flex items-start">
                  <span className="text-7xl font-black text-slate-950 tracking-[-0.05em] leading-none">{weather.temp}</span>
                  <span className="text-4xl font-black text-slate-200 mt-2">°</span>
                </div>
              )}
            </div>
            
            {weather && (
               <img 
                 src={`https://openweathermap.org/img/wn/${weather.icon}@4x.png`} 
                 className="absolute -bottom-8 -right-8 w-40 h-40 opacity-[0.03] grayscale blur-[2px] pointer-events-none" 
                 alt="" 
               />
            )}
          </div>
        </div>
      </div>

      {/* MID_PROTOCOL: Bio Anchor */}
      <div className="px-4 lg:px-0">
        <p className="text-slate-400 text-3xl md:text-5xl font-medium leading-[1.1] italic tracking-tight opacity-90 selection:bg-indigo-500/20 max-w-5xl">
          {userData.bio || "Establishing primary neural uplink..."}
        </p>
      </div>

      {/* FOOTER_RIBBON: High-Intensity Status */}
      <div className="w-full bg-indigo-600 rounded-[3.5rem] p-8 md:p-14 text-white flex flex-col xl:flex-row items-center justify-between group shadow-[0_50px_100px_-20px_rgba(79,70,229,0.4)] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-24 opacity-[0.08] pointer-events-none scale-[2.5] group-hover:rotate-12 transition-transform duration-[10s]"><ICONS.Globe /></div>
        
        <div className="flex items-center gap-10 mb-10 xl:mb-0 w-full xl:w-auto relative z-10">
           <div className="w-24 h-24 md:w-32 md:h-32 bg-white/10 backdrop-blur-3xl rounded-[2.5rem] flex items-center justify-center text-7xl shadow-inner border border-white/20 shrink-0">
             {userData.statusEmoji || '⚡'}
           </div>
           <div className="flex-1">
              <p className="text-[11px] font-black text-indigo-200 uppercase tracking-[0.6em] font-mono mb-4 opacity-70 italic">PROTOCOL_SIGNAL_LIVE</p>
              <p className="text-4xl md:text-[clamp(2.5rem,4.5vw,6rem)] font-black italic tracking-[-0.03em] leading-[0.85] text-white">
                "{userData.statusMessage || 'Updating features on VibeStream'}"
              </p>
           </div>
        </div>

        {/* Neural Pod */}
        <div className="flex items-center gap-10 px-12 py-8 bg-black/25 rounded-[2.5rem] border border-white/10 backdrop-blur-3xl shadow-2xl w-full xl:w-auto justify-between xl:justify-start relative z-10">
           <div className="flex items-center gap-6">
              <div className={`w-5 h-5 rounded-full ${currentPresence.color} animate-pulse shadow-[0_0_30px_white]`} />
              <span className="text-sm md:text-base font-black uppercase tracking-[0.5em] font-mono">{userData.presenceStatus?.toUpperCase() || 'INVISIBLE'}</span>
           </div>
           <div className="w-px h-12 bg-white/15 hidden md:block" />
           <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-50 font-mono hidden md:block">GB_NODE_V3.2</p>
        </div>
      </div>

    </div>
  );
};
