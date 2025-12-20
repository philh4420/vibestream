
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
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-1000">
      
      {/* Top Section: Main Identity + Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* BLOCK 1: IDENTITY PANEL (Matches left side of image) */}
        <div className="lg:col-span-8 bg-white border border-precision rounded-[4rem] p-10 md:p-16 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.04)] relative overflow-hidden flex flex-col justify-center">
          <div className="flex flex-col md:flex-row gap-12 items-center md:items-start relative z-10">
            {/* Avatar Cluster */}
            <div className="relative shrink-0">
              <div className="absolute -inset-4 bg-slate-100/50 rounded-[3.5rem] blur-xl opacity-50" />
              <img 
                src={userData.avatarUrl} 
                className="w-40 h-40 md:w-56 md:h-56 rounded-[3.2rem] object-cover border-8 border-white shadow-2xl relative z-10" 
                alt={userData.displayName} 
              />
              <div className="absolute bottom-2 right-2 w-14 h-14 bg-slate-900 rounded-2xl p-1 shadow-2xl z-20 border-4 border-white flex items-center justify-center">
                <div className={`w-3.5 h-3.5 rounded-full ${currentPresence.color} shadow-[0_0_10px_rgba(255,255,255,0.5)] animate-pulse`} />
              </div>
            </div>

            {/* Identity Info */}
            <div className="flex-1 space-y-8 text-center md:text-left">
              <div className="space-y-4">
                <div className="flex items-center justify-center md:justify-start gap-4 flex-wrap">
                  <h1 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter italic leading-none">
                    {userData.displayName.split(' ').map((word, i) => (
                      <span key={i} className="block">{word}</span>
                    ))}
                  </h1>
                </div>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
                  <span className="px-5 py-2.5 bg-slate-50 text-[10px] font-black uppercase tracking-[0.3em] rounded-xl text-slate-400 font-mono border border-slate-100">@{userData.username}</span>
                  <span className="px-5 py-2.5 bg-indigo-50 text-[10px] font-black uppercase tracking-[0.3em] rounded-xl text-indigo-500 font-mono italic border border-indigo-100/50">{userData.role?.toUpperCase()}</span>
                  <span className="px-5 py-2.5 bg-slate-900 text-[10px] font-black uppercase tracking-[0.3em] rounded-xl text-white font-mono">{userData.pronouns?.toUpperCase() || 'HE/HIM'}</span>
                </div>
              </div>

              <p className="text-slate-500 text-xl md:text-2xl font-medium leading-relaxed italic max-w-xl mx-auto md:mx-0">
                {userData.bio || "A aspiring frontend web designer that loves to learn new things"}
              </p>

              <div className="flex items-center justify-center md:justify-start gap-5 pt-4">
                {isOwnProfile && (
                  <button 
                    onClick={onEdit}
                    className="h-20 px-12 bg-slate-950 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl shadow-slate-200 hover:bg-black transition-all active:scale-95 flex items-center gap-6 group"
                  >
                    <ICONS.Settings />
                    CALIBRATE_ID
                  </button>
                )}
                <button className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] hover:bg-indigo-100 transition-all active:scale-95 flex items-center justify-center border border-indigo-100 group">
                  <div className="scale-125"><ICONS.Messages /></div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BLOCK 2 & 3: RIGHT TELEMETRY STACK */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          
          {/* STATS HUB (Matches Top-Right block) */}
          <div className="bg-slate-950 rounded-[4rem] p-12 text-white flex justify-between items-center shadow-2xl relative overflow-hidden flex-1 min-h-[240px]">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
            {[
              { label: 'SIGNALS', val: postCount },
              { label: 'CONN', val: userData.followers },
              { label: 'FOLLOW', val: userData.following }
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center relative z-10 text-center flex-1">
                <p className="text-6xl md:text-7xl font-black tracking-tighter leading-none mb-4">{stat.val}</p>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] font-mono">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* ATMOSPHERIC LINK (Matches Bottom-Right block) */}
          <div className="bg-white border border-precision rounded-[4rem] p-12 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.03)] overflow-hidden relative flex-1 min-h-[240px] flex flex-col justify-center">
            
            {/* Meta Labels - Precise Corner Anchoring */}
            <p className="absolute top-12 left-12 text-[11px] font-black text-slate-300 uppercase tracking-[0.6em] font-mono leading-none">
              ATMOSPHERIC_LINK
            </p>

            <p className="absolute bottom-12 left-12 text-[11px] font-black text-indigo-500 uppercase tracking-[0.4em] font-mono leading-none">
              LOCAL_PRECISION
            </p>

            {weather && (
              <p className="absolute bottom-12 right-12 text-[11px] font-black text-slate-300 uppercase tracking-[0.6em] font-mono leading-none">
                {weather.condition.toUpperCase()}
              </p>
            )}

            {/* Primary Telemetry */}
            <div className="flex items-center justify-between w-full">
              <div className="pt-2">
                <p className="text-8xl md:text-9xl font-black text-slate-900 tracking-tighter italic leading-none select-none">
                  {time}
                </p>
              </div>
              
              <div className="flex flex-col items-end pt-2">
                {weather ? (
                  <>
                    <img 
                      src={`https://openweathermap.org/img/wn/${weather.icon}@4x.png`} 
                      className="w-24 h-24 md:w-32 md:h-32 -mb-4 -mr-4 opacity-10 blur-[1px] absolute top-8 right-8" 
                      alt="" 
                    />
                    <div className="relative z-10 flex items-start">
                      <span className="text-8xl md:text-9xl font-black text-slate-900 tracking-tighter leading-none">{weather.temp}</span>
                      <span className="text-4xl md:text-5xl font-black text-slate-900 mt-2">°</span>
                    </div>
                  </>
                ) : (
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center animate-pulse border border-slate-100">
                    <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Persistent Status Bar (Bottom Layout) */}
      <div className="w-full bg-indigo-600 rounded-[3.5rem] p-8 md:p-10 text-white flex flex-col lg:flex-row items-center justify-between group shadow-2xl relative overflow-hidden mt-2">
        <div className="absolute top-0 right-0 p-16 opacity-10 pointer-events-none scale-150"><ICONS.Globe /></div>
        
        <div className="flex items-center gap-8 md:gap-12 mb-8 lg:mb-0 w-full lg:w-auto">
           <div className="w-20 h-20 md:w-24 md:h-24 bg-white/10 backdrop-blur-3xl rounded-[2rem] flex items-center justify-center text-5xl shadow-inner border border-white/20 shrink-0">
             {userData.statusEmoji || '⚡'}
           </div>
           <div className="flex-1">
              <p className="text-[11px] font-black text-indigo-200 uppercase tracking-[0.5em] font-mono mb-3 opacity-80">NEURAL_SIGNAL</p>
              <p className="text-2xl md:text-4xl font-black italic tracking-tight leading-none text-white selection:bg-white/20">
                "{userData.statusMessage || 'Updating features on VibeStream'}"
              </p>
           </div>
        </div>

        <div className="flex items-center gap-10 px-12 py-6 bg-black/15 rounded-[2.5rem] border border-white/10 backdrop-blur-md shadow-lg w-full lg:w-auto justify-between lg:justify-start">
           <div className="flex items-center gap-5">
              <div className={`w-4 h-4 rounded-full ${currentPresence.color} animate-pulse shadow-[0_0_25px_white]`} />
              <span className="text-xs md:text-sm font-black uppercase tracking-[0.4em] font-mono">{userData.presenceStatus?.toUpperCase() || 'INVISIBLE'}</span>
           </div>
           <div className="w-px h-10 bg-white/20 hidden md:block" />
           <p className="text-[11px] font-black uppercase tracking-[0.4em] opacity-80 font-mono hidden md:block">NODE_STABLE_GB</p>
        </div>
      </div>

    </div>
  );
};
