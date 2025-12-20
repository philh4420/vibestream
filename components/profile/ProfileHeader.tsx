
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
    <div className="flex flex-col gap-16 w-full max-w-[320rem] mx-auto animate-in fade-in duration-1000 px-6 md:px-12">
      
      {/* SPATIAL ARCHITECTURE: Identity Hub */}
      <div className="relative flex flex-col xl:flex-row items-center xl:items-end justify-between gap-12 xl:gap-20">
        
        {/* NODE 01: IDENTITY SQUARE */}
        <div className="relative shrink-0 z-30">
          <div className="absolute -inset-10 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative">
            <img 
              src={userData.avatarUrl} 
              className="w-56 h-56 md:w-80 md:h-80 xl:w-[32rem] xl:h-[32rem] rounded-[5rem] object-cover border-[16px] border-white shadow-[0_60px_120px_-20px_rgba(0,0,0,0.18)] transition-transform duration-1000 hover:scale-[1.02]" 
              alt={userData.displayName} 
            />
            {/* Presence Floating Badge */}
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-slate-950 rounded-[2.5rem] p-1 shadow-2xl z-40 border-[8px] border-white flex items-center justify-center">
              <div className={`w-6 h-6 rounded-full ${currentPresence.color} shadow-[0_0_30px_rgba(255,255,255,0.5)] animate-pulse`} />
            </div>
          </div>
        </div>

        {/* NODE 02: BRAND TYPOGRAPHY (The Core Anchor) */}
        <div className="flex-1 text-center xl:text-left relative z-10">
          <div className="space-y-4">
             <h1 className="text-8xl md:text-[clamp(8rem,18vw,26rem)] font-black text-slate-950 tracking-[-0.06em] italic leading-[0.75] uppercase select-none">
                {userData.displayName.split(' ').map((word, i) => (
                  <span key={i} className="block last:text-indigo-600/5 last:absolute last:top-0 last:left-0 last:-z-10 last:blur-[2px]">{word}</span>
                ))}
             </h1>
             
             <div className="flex flex-wrap justify-center xl:justify-start gap-6 mt-12">
                <span className="px-8 py-4 bg-slate-950 text-white text-[13px] font-black uppercase tracking-[0.5em] rounded-3xl font-mono shadow-2xl">@{userData.username.toUpperCase()}</span>
                <span className="px-8 py-4 bg-indigo-50 text-indigo-600 text-[13px] font-black uppercase tracking-[0.5em] rounded-3xl font-mono italic border-2 border-indigo-100">{userData.role?.toUpperCase()}</span>
                <span className="px-8 py-4 bg-slate-100 text-slate-400 text-[13px] font-black uppercase tracking-[0.5em] rounded-3xl font-mono">{userData.pronouns?.toUpperCase() || 'HE/HIM'}</span>
             </div>
          </div>
        </div>

        {/* NODE 03: TELEMETRY PODS (Vertical Stack on Wide) */}
        <div className="flex flex-col gap-10 w-full xl:w-[500px] shrink-0 z-20">
          
          {/* STATS POD: Deep Matte */}
          <div className="bg-slate-950 rounded-[5rem] p-16 text-white flex flex-col justify-between shadow-[0_80px_160px_-40px_rgba(0,0,0,0.5)] relative overflow-hidden h-[380px] group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 blur-[150px] rounded-full group-hover:scale-150 transition-transform duration-1000" />
            
            <p className="text-[12px] font-black text-slate-600 uppercase tracking-[0.8em] font-mono mb-12 relative z-10">NETWORK_METRICS_LIVE</p>
            
            <div className="flex justify-between items-end relative z-10">
              {[
                { label: 'SIGNALS', val: postCount },
                { label: 'CONN', val: userData.followers },
                { label: 'FOLLOW', val: userData.following }
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center">
                  <p className="text-7xl md:text-9xl font-black tracking-[-0.08em] leading-none mb-4">{stat.val}</p>
                  <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.5em] font-mono">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ATMOSPHERIC POD: High Precision */}
          <div className="bg-white border-[3px] border-slate-50 rounded-[5rem] p-16 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.08)] relative overflow-hidden h-[380px] flex flex-col justify-between group">
            
            <div className="flex justify-between items-start relative z-20">
              <p className="text-[12px] font-black text-slate-300 uppercase tracking-[0.8em] font-mono leading-none">
                ATMOSPHERIC_LINK
              </p>
              {weather && (
                <div className="flex flex-col items-end">
                  <p className="text-[12px] font-black text-indigo-500 uppercase tracking-[0.5em] font-mono leading-none mb-3">LOCAL_PRECISION</p>
                  <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.6em] font-mono leading-none">{weather.condition.toUpperCase()}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between w-full relative z-10">
              <p className="text-[clamp(8rem,14vw,14rem)] font-black text-slate-950 tracking-[-0.07em] italic leading-none select-none group-hover:scale-105 transition-transform duration-700 origin-left">
                {time}
              </p>
              
              {weather ? (
                <div className="flex flex-col items-end">
                  <div className="flex items-start">
                    <span className="text-[clamp(8rem,14vw,13rem)] font-black text-slate-950 tracking-[-0.07em] leading-none select-none">{weather.temp}</span>
                    <span className="text-6xl font-black text-slate-200 mt-6 select-none">°</span>
                  </div>
                </div>
              ) : (
                <div className="w-24 h-24 border-[8px] border-slate-50 border-t-indigo-500 rounded-full animate-spin" />
              )}
            </div>

            {weather && (
               <img 
                 src={`https://openweathermap.org/img/wn/${weather.icon}@4x.png`} 
                 className="absolute -bottom-20 -right-20 w-[30rem] h-[30rem] opacity-[0.03] grayscale blur-[4px] pointer-events-none group-hover:opacity-[0.05] transition-opacity duration-1000" 
                 alt="" 
               />
            )}
          </div>
        </div>
      </div>

      {/* MID SECTION: Identity Bio (Fluid Floating Text) */}
      <div className="w-full max-w-7xl mx-auto xl:mx-0">
        <p className="text-slate-400 text-3xl md:text-6xl font-medium leading-[1.1] italic tracking-tight opacity-85 selection:bg-indigo-500/20">
          {userData.bio || "A aspiring frontend web designer that loves to learn new things"}
        </p>
        
        <div className="flex items-center gap-10 mt-16">
          {isOwnProfile && (
            <button 
              onClick={onEdit}
              className="h-28 px-20 bg-slate-950 text-white rounded-[3rem] font-black text-sm uppercase tracking-[0.6em] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.35)] hover:bg-black hover:-translate-y-2 transition-all active:scale-95 flex items-center gap-10 group"
            >
              <div className="scale-150 group-hover:rotate-180 transition-transform duration-1000"><ICONS.Settings /></div>
              CALIBRATE_ID
            </button>
          )}
          <button className="w-28 h-28 bg-white text-indigo-600 rounded-[3rem] hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center border-[3px] border-slate-100 shadow-2xl group">
            <div className="scale-[2.2] group-hover:scale-125 transition-transform"><ICONS.Messages /></div>
          </button>
        </div>
      </div>

      {/* FOOTER_COMMAND: Status Ribbon (High Intensity) */}
      <div className="w-full bg-indigo-600 rounded-[5.5rem] p-12 md:p-20 text-white flex flex-col xl:flex-row items-center justify-between group shadow-[0_60px_120px_-30px_rgba(79,70,229,0.45)] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 opacity-[0.07] pointer-events-none scale-[3] group-hover:rotate-90 transition-transform duration-[15s]"><ICONS.Globe /></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="flex items-center gap-12 md:gap-20 mb-12 xl:mb-0 w-full xl:w-auto relative z-10">
           <div className="w-32 h-32 md:w-44 md:h-44 bg-white/20 backdrop-blur-[100px] rounded-[4.5rem] flex items-center justify-center text-8xl shadow-inner border-[2px] border-white/30 shrink-0 transition-all duration-1000 group-hover:scale-105 group-hover:rotate-6">
             {userData.statusEmoji || '⚡'}
           </div>
           <div className="flex-1">
              <p className="text-[14px] font-black text-indigo-200 uppercase tracking-[0.8em] font-mono mb-6 opacity-60 italic">PROTOCOL_SIGNAL_OVR_v3.2</p>
              <p className="text-5xl md:text-[clamp(3.5rem,6vw,8rem)] font-black italic tracking-[-0.04em] leading-[0.85] text-white">
                "{userData.statusMessage || 'Updating features on VibeStream'}"
              </p>
           </div>
        </div>

        {/* Dynamic Hardware Status */}
        <div className="flex items-center gap-14 px-20 py-10 bg-black/30 rounded-[4rem] border-[2px] border-white/10 backdrop-blur-[80px] shadow-3xl w-full xl:w-auto justify-between xl:justify-start relative z-10 group/pod hover:bg-black/40 transition-colors">
           <div className="flex items-center gap-8">
              <div className={`w-8 h-8 rounded-full ${currentPresence.color} animate-pulse shadow-[0_0_60px_rgba(255,255,255,1)]`} />
              <span className="text-lg md:text-xl font-black uppercase tracking-[0.6em] font-mono">{userData.presenceStatus?.toUpperCase() || 'INVISIBLE'}</span>
           </div>
           <div className="w-px h-20 bg-white/20 hidden md:block" />
           <p className="text-[14px] font-black uppercase tracking-[0.5em] opacity-50 font-mono hidden md:block select-none">GB_NODE_8K_PRIMARY</p>
        </div>
      </div>

    </div>
  );
};
