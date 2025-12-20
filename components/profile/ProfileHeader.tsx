
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
    <div className="flex flex-col gap-10 w-full max-w-[160rem] mx-auto animate-in fade-in duration-1000">
      
      {/* GRID_CORE: 12-Column Responsive Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        
        {/* BLOCK_01: IDENTITY_CLUSTER (Col 1-8) */}
        <div className="lg:col-span-8 bg-white border border-precision rounded-[4.5rem] p-12 md:p-20 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.06)] relative overflow-hidden flex flex-col justify-center min-h-[450px]">
          {/* Subtle Neural Gradient Background */}
          <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-indigo-50/20 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          
          <div className="flex flex-col md:flex-row gap-16 items-center md:items-start relative z-10">
            {/* Avatar Architecture */}
            <div className="relative shrink-0">
              <div className="absolute -inset-6 bg-slate-100/40 rounded-[4.5rem] blur-2xl opacity-50" />
              <img 
                src={userData.avatarUrl} 
                className="w-48 h-48 md:w-64 md:h-64 rounded-[4rem] object-cover border-[10px] border-white shadow-2xl relative z-10" 
                alt={userData.displayName} 
              />
              <div className="absolute bottom-4 right-4 w-16 h-16 bg-slate-900 rounded-3xl p-1 shadow-2xl z-20 border-4 border-white flex items-center justify-center">
                <div className={`w-4 h-4 rounded-full ${currentPresence.color} shadow-[0_0_15px_rgba(255,255,255,0.4)] animate-pulse`} />
              </div>
            </div>

            {/* Identity Typography */}
            <div className="flex-1 space-y-10 text-center md:text-left">
              <div className="space-y-6">
                <h1 className="text-6xl md:text-[clamp(4rem,8vw,9rem)] font-black text-slate-950 tracking-[-0.04em] italic leading-[0.9] flex flex-col">
                  {userData.displayName.split(' ').map((word, i) => (
                    <span key={i}>{word}</span>
                  ))}
                </h1>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
                  <span className="px-6 py-3 bg-slate-50 text-[11px] font-black uppercase tracking-[0.4em] rounded-2xl text-slate-400 font-mono border border-slate-100">@{userData.username.toUpperCase()}</span>
                  <div className="relative group">
                    <span className="px-6 py-3 bg-indigo-50 text-[11px] font-black uppercase tracking-[0.4em] rounded-2xl text-indigo-500 font-mono italic border border-indigo-100/50 flex items-center gap-2">
                       {userData.role?.toUpperCase()}
                       <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
                    </span>
                  </div>
                  <span className="px-6 py-3 bg-slate-950 text-[11px] font-black uppercase tracking-[0.4em] rounded-2xl text-white font-mono">{userData.pronouns?.toUpperCase() || 'HE/HIM'}</span>
                </div>
              </div>

              <p className="text-slate-500 text-2xl md:text-3xl font-medium leading-relaxed italic max-w-2xl mx-auto md:mx-0 opacity-80">
                {userData.bio || "A aspiring frontend web designer that loves to learn new things"}
              </p>

              <div className="flex items-center justify-center md:justify-start gap-6 pt-6">
                {isOwnProfile && (
                  <button 
                    onClick={onEdit}
                    className="h-24 px-16 bg-slate-950 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] hover:bg-black transition-all active:scale-95 flex items-center gap-8 group"
                  >
                    <div className="scale-125 group-hover:rotate-90 transition-transform duration-700"><ICONS.Settings /></div>
                    CALIBRATE_ID
                  </button>
                )}
                <button className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2.5rem] hover:bg-indigo-100 transition-all active:scale-95 flex items-center justify-center border border-indigo-100 group shadow-lg shadow-indigo-100/50">
                  <div className="scale-[1.75] group-hover:scale-110 transition-transform"><ICONS.Messages /></div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BLOCK_02 & BLOCK_03: TELEMETRY_STACK (Col 9-12) */}
        <div className="lg:col-span-4 flex flex-col gap-10">
          
          {/* STATS_NODE: Dark Minimalist (Matches Image) */}
          <div className="bg-slate-950 rounded-[4.5rem] p-16 text-white flex justify-between items-center shadow-2xl relative overflow-hidden flex-1 min-h-[260px]">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/15 via-transparent to-transparent pointer-events-none" />
            {[
              { label: 'SIGNALS', val: postCount },
              { label: 'CONN', val: userData.followers },
              { label: 'FOLLOW', val: userData.following }
            ].map((stat) => (
              <div key={stat.label} className="flex flex-col items-center relative z-10 text-center flex-1 group/stat">
                <p className="text-7xl md:text-8xl font-black tracking-[-0.05em] leading-none mb-4 group-hover/stat:scale-110 transition-transform duration-500">{stat.val}</p>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] font-mono">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* ATMOSPHERIC_LINK: Surgical Precision Weather (Matches Image) */}
          <div className="bg-white border border-precision rounded-[4.5rem] p-16 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.04)] overflow-hidden relative flex-1 min-h-[320px] flex flex-col justify-center">
            
            {/* CORNER_ANCHORS: System Telemetry */}
            <p className="absolute top-16 left-16 text-[11px] font-black text-slate-300 uppercase tracking-[0.6em] font-mono leading-none select-none">
              ATMOSPHERIC_LINK
            </p>

            <p className="absolute bottom-16 left-16 text-[11px] font-black text-indigo-500 uppercase tracking-[0.5em] font-mono leading-none select-none">
              LOCAL_PRECISION
            </p>

            {weather && (
              <p className="absolute bottom-16 right-16 text-[11px] font-black text-slate-300 uppercase tracking-[0.6em] font-mono leading-none select-none">
                {weather.condition.toUpperCase()}
              </p>
            )}

            {/* CENTRAL_DATA: Time & Temperature (Fluid Scaling) */}
            <div className="flex items-center justify-between w-full relative z-10">
              <div className="pt-4">
                <p className="text-8xl md:text-[clamp(5rem,10vw,11rem)] font-black text-slate-950 tracking-[-0.05em] italic leading-none select-none">
                  {time}
                </p>
              </div>
              
              <div className="flex flex-col items-end pt-4">
                {weather ? (
                  <>
                    {/* Background Visual Artifact */}
                    <img 
                      src={`https://openweathermap.org/img/wn/${weather.icon}@4x.png`} 
                      className="w-32 h-32 md:w-48 md:h-48 -mb-6 -mr-6 opacity-[0.07] blur-[2px] absolute top-4 right-4 pointer-events-none select-none" 
                      alt="" 
                    />
                    <div className="relative flex items-start">
                      <span className="text-8xl md:text-[clamp(5rem,10vw,10rem)] font-black text-slate-950 tracking-[-0.05em] leading-none select-none">
                        {weather.temp}
                      </span>
                      <span className="text-5xl md:text-6xl font-black text-slate-950 mt-2 select-none">°</span>
                    </div>
                  </>
                ) : (
                  <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center animate-pulse border border-slate-100">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER_PROTOCOL: Neural Status Bar (Matches Bottom Section) */}
      <div className="w-full bg-indigo-600 rounded-[4.5rem] p-10 md:p-14 text-white flex flex-col lg:flex-row items-center justify-between group shadow-[0_50px_100px_-20px_rgba(79,70,229,0.3)] relative overflow-hidden">
        {/* Aesthetic Background Artifacts */}
        <div className="absolute top-0 right-0 p-24 opacity-10 pointer-events-none scale-[2] group-hover:rotate-12 transition-transform duration-[3s]"><ICONS.Globe /></div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
        
        <div className="flex items-center gap-10 md:gap-14 mb-10 lg:mb-0 w-full lg:w-auto relative z-10">
           <div className="w-24 h-24 md:w-32 md:h-32 bg-white/10 backdrop-blur-[60px] rounded-[3rem] flex items-center justify-center text-6xl shadow-inner border border-white/20 shrink-0 group-hover:scale-105 transition-all duration-700">
             {userData.statusEmoji || '⚡'}
           </div>
           <div className="flex-1">
              <p className="text-[12px] font-black text-indigo-200 uppercase tracking-[0.6em] font-mono mb-4 opacity-80">NEURAL_SIGNAL_OVR</p>
              <p className="text-3xl md:text-5xl font-black italic tracking-[-0.02em] leading-none text-white selection:bg-white/20">
                "{userData.statusMessage || 'Updating features on VibeStream'}"
              </p>
           </div>
        </div>

        {/* Status Telemetry Pod */}
        <div className="flex items-center gap-12 px-14 py-8 bg-black/20 rounded-[3rem] border border-white/10 backdrop-blur-3xl shadow-2xl w-full lg:w-auto justify-between lg:justify-start relative z-10 group/pod hover:bg-black/30 transition-colors">
           <div className="flex items-center gap-6">
              <div className={`w-5 h-5 rounded-full ${currentPresence.color} animate-pulse shadow-[0_0_30px_white]`} />
              <span className="text-sm md:text-base font-black uppercase tracking-[0.5em] font-mono">{userData.presenceStatus?.toUpperCase() || 'INVISIBLE'}</span>
           </div>
           <div className="w-px h-12 bg-white/20 hidden md:block" />
           <p className="text-[11px] font-black uppercase tracking-[0.5em] opacity-80 font-mono hidden md:block">NODE_STABLE_GB_v2.6</p>
        </div>
      </div>

    </div>
  );
};
