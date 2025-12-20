
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
    <div className="flex flex-col gap-12 w-full max-w-[160rem] mx-auto animate-in fade-in duration-1000 px-4 md:px-0">
      
      {/* 2026 NEURAL DASHBOARD ARCHITECTURE */}
      <div className="flex flex-col lg:flex-row gap-12 items-stretch">
        
        {/* SECTION_01: IDENTITY_FOCAL (The "Hero" Node) */}
        <div className="flex-1 relative flex flex-col justify-center">
          {/* Background Neural Bloom */}
          <div className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="flex flex-col md:flex-row gap-12 md:gap-20 items-center md:items-start relative z-10">
            {/* Avatar - High Depth Construction */}
            <div className="relative group shrink-0">
              <div className="absolute -inset-8 bg-indigo-50/50 rounded-[5rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              <div className="relative">
                <img 
                  src={userData.avatarUrl} 
                  className="w-48 h-48 md:w-72 md:h-72 rounded-[4.5rem] object-cover border-[12px] border-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] relative z-10 transition-transform duration-700 hover:scale-105" 
                  alt={userData.displayName} 
                />
                <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-slate-900 rounded-3xl p-1 shadow-2xl z-20 border-[6px] border-white flex items-center justify-center">
                  <div className={`w-5 h-5 rounded-full ${currentPresence.color} shadow-[0_0_20px_rgba(255,255,255,0.4)] animate-pulse`} />
                </div>
              </div>
            </div>

            {/* Typography Engine */}
            <div className="flex-1 flex flex-col text-center md:text-left pt-4">
              <div className="relative mb-8">
                <h1 className="text-7xl md:text-[clamp(5rem,9vw,11rem)] font-black text-slate-950 tracking-[-0.05em] italic leading-[0.85] uppercase">
                  {userData.displayName.split(' ').map((word, i) => (
                    <span key={i} className="block">{word}</span>
                  ))}
                </h1>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-8">
                  <span className="px-6 py-3 bg-slate-950 text-white text-[11px] font-black uppercase tracking-[0.4em] rounded-2xl font-mono shadow-xl">@{userData.username.toUpperCase()}</span>
                  <span className="px-6 py-3 bg-indigo-50 text-indigo-600 text-[11px] font-black uppercase tracking-[0.4em] rounded-2xl font-mono italic border border-indigo-100">{userData.role?.toUpperCase()}</span>
                  <span className="px-6 py-3 bg-slate-100 text-slate-400 text-[11px] font-black uppercase tracking-[0.4em] rounded-2xl font-mono">{userData.pronouns?.toUpperCase() || 'HE/HIM'}</span>
                </div>
              </div>

              <p className="text-slate-400 text-2xl md:text-4xl font-medium leading-tight italic max-w-2xl mx-auto md:mx-0 opacity-90 tracking-tight">
                {userData.bio || "A aspiring frontend web designer that loves to learn new things"}
              </p>

              <div className="flex items-center justify-center md:justify-start gap-8 mt-12">
                {isOwnProfile && (
                  <button 
                    onClick={onEdit}
                    className="h-24 px-16 bg-slate-950 text-white rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.5em] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.3)] hover:bg-black hover:-translate-y-1 transition-all active:scale-95 flex items-center gap-8 group"
                  >
                    <div className="scale-125 group-hover:rotate-90 transition-transform duration-700"><ICONS.Settings /></div>
                    CALIBRATE_ID
                  </button>
                )}
                <button className="w-24 h-24 bg-white text-indigo-600 rounded-[2.5rem] hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center border-2 border-slate-100 shadow-xl group">
                  <div className="scale-[1.8] group-hover:scale-110 transition-transform"><ICONS.Messages /></div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION_02: TELEMETRY_BELT (The Data Strip) */}
        <div className="lg:w-[450px] flex flex-col gap-10">
          
          {/* STATS_CLUSTER: Deep Matte Finish */}
          <div className="bg-slate-950 rounded-[4.5rem] p-16 text-white flex flex-col justify-between shadow-[0_50px_100px_-30px_rgba(0,0,0,0.4)] relative overflow-hidden h-[340px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full" />
            
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.6em] font-mono mb-8 relative z-10">NETWORK_METRICS</p>
            
            <div className="flex justify-between items-end relative z-10">
              {[
                { label: 'SIGNALS', val: postCount },
                { label: 'CONN', val: userData.followers },
                { label: 'FOLLOW', val: userData.following }
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center">
                  <p className="text-6xl md:text-7xl font-black tracking-[-0.06em] leading-none mb-3">{stat.val}</p>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] font-mono">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ATMOSPHERIC_STRIP: High-Precision Telemetry */}
          <div className="bg-white border-2 border-slate-100 rounded-[4.5rem] p-14 shadow-[0_20px_80px_-20px_rgba(0,0,0,0.05)] relative overflow-hidden h-[340px] flex flex-col justify-between">
            
            {/* Anchored Meta-Labels */}
            <div className="flex justify-between items-start relative z-20">
              <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.6em] font-mono leading-none">
                ATMOSPHERIC_LINK
              </p>
              {weather && (
                <div className="flex flex-col items-end">
                  <p className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.4em] font-mono leading-none mb-2">LOCAL_PRECISION</p>
                  <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.6em] font-mono leading-none">{weather.condition.toUpperCase()}</p>
                </div>
              )}
            </div>

            {/* Central Data Engine */}
            <div className="flex items-center justify-between w-full relative z-10 px-2">
              <p className="text-[clamp(6rem,11vw,12rem)] font-black text-slate-950 tracking-[-0.06em] italic leading-none select-none">
                {time}
              </p>
              
              {weather ? (
                <div className="flex flex-col items-end">
                  <div className="flex items-start">
                    <span className="text-[clamp(6rem,11vw,11rem)] font-black text-slate-950 tracking-[-0.06em] leading-none">{weather.temp}</span>
                    <span className="text-5xl font-black text-slate-300 mt-4">°</span>
                  </div>
                </div>
              ) : (
                <div className="w-20 h-20 border-4 border-slate-100 border-t-indigo-500 rounded-full animate-spin" />
              )}
            </div>

            {/* Background Artifact */}
            {weather && (
               <img 
                 src={`https://openweathermap.org/img/wn/${weather.icon}@4x.png`} 
                 className="absolute -bottom-10 -right-10 w-64 h-64 opacity-[0.04] grayscale blur-[2px] pointer-events-none" 
                 alt="" 
               />
            )}
          </div>
        </div>
      </div>

      {/* SECTION_03: PROTOCOL_BAR (Footer Status) */}
      <div className="w-full bg-indigo-600 rounded-[4rem] p-10 md:p-14 text-white flex flex-col lg:flex-row items-center justify-between group shadow-[0_40px_100px_-20px_rgba(79,70,229,0.35)] relative overflow-hidden mt-6">
        {/* Aesthetic Layers */}
        <div className="absolute top-0 right-0 p-24 opacity-10 pointer-events-none scale-[2] group-hover:rotate-45 transition-transform duration-[10s]"><ICONS.Globe /></div>
        
        <div className="flex items-center gap-12 mb-10 lg:mb-0 w-full lg:w-auto relative z-10">
           <div className="w-24 h-24 md:w-36 md:h-36 bg-white/15 backdrop-blur-3xl rounded-[3.5rem] flex items-center justify-center text-7xl shadow-inner border border-white/20 shrink-0 group-hover:scale-105 transition-all duration-700">
             {userData.statusEmoji || '⚡'}
           </div>
           <div className="flex-1">
              <p className="text-[12px] font-black text-indigo-200 uppercase tracking-[0.6em] font-mono mb-4 opacity-70 italic">PROTOCOL_SIGNAL_LIVE</p>
              <p className="text-4xl md:text-[clamp(2.5rem,4vw,5.5rem)] font-black italic tracking-[-0.03em] leading-[0.9] text-white">
                "{userData.statusMessage || 'Updating features on VibeStream'}"
              </p>
           </div>
        </div>

        {/* Hardware Status Pod */}
        <div className="flex items-center gap-12 px-14 py-8 bg-black/25 rounded-[3rem] border border-white/10 backdrop-blur-2xl shadow-2xl w-full lg:w-auto justify-between lg:justify-start relative z-10 group/pod">
           <div className="flex items-center gap-6">
              <div className={`w-6 h-6 rounded-full ${currentPresence.color} animate-pulse shadow-[0_0_40px_rgba(255,255,255,0.8)]`} />
              <span className="text-base md:text-lg font-black uppercase tracking-[0.5em] font-mono">{userData.presenceStatus?.toUpperCase() || 'INVISIBLE'}</span>
           </div>
           <div className="w-px h-16 bg-white/10 hidden md:block" />
           <p className="text-[12px] font-black uppercase tracking-[0.4em] opacity-60 font-mono hidden md:block">GB_NODE_V3.0</p>
        </div>
      </div>

    </div>
  );
};
