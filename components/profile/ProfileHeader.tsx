
import React, { useState, useEffect } from 'react';
import { User, WeatherInfo } from '../../types';
import { ICONS } from '../../constants';
import { fetchWeather } from '../../services/weather';

interface ProfileHeaderProps {
  userData: User;
  onEdit: () => void;
  postCount?: number;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ userData, onEdit, postCount = 0 }) => {
  const [time, setTime] = useState<string>(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [weather, setWeather] = useState<WeatherInfo | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const getAtmosphere = async () => {
      // Use location or fallback to a standard node for en-GB
      const query = userData.location || 'London';
      const data = await fetchWeather(query);
      setWeather(data);
    };
    getAtmosphere();
  }, [userData.location]);

  const getPulseClass = () => {
    switch (userData.presenceStatus) {
      case 'Online': return 'pulse-active-emerald';
      case 'Focus': return 'pulse-active-amber';
      case 'In-Transit': return 'pulse-active-indigo';
      default: return 'pulse-active-indigo opacity-50';
    }
  };

  const getStatusColor = () => {
    switch (userData.presenceStatus) {
      case 'Online': return 'bg-emerald-500';
      case 'Focus': return 'bg-amber-500';
      case 'In-Transit': return 'bg-indigo-600';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="relative glass-panel rounded-[3rem] overflow-hidden mb-8 shadow-2xl border-white/20">
      {/* Cover Image with Atmospheric Depth & Shimmer */}
      <div className="h-48 md:h-72 relative overflow-hidden glass-shimmer">
        <img 
          src={userData.coverUrl} 
          className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105" 
          alt="" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Environmental Overlay based on weather */}
        {weather?.condition === 'Rain' && (
           <div className="absolute inset-0 bg-indigo-900/10 backdrop-blur-[1px] pointer-events-none" />
        )}

        {/* Neural Clock & Weather Widget */}
        <div className="absolute top-6 right-6 md:top-8 md:right-8 flex items-center gap-3">
          <div className="glass-panel px-5 py-2.5 rounded-2xl border-white/20 backdrop-blur-3xl flex items-center gap-4 shadow-2xl">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-white uppercase tracking-widest font-mono leading-none">
                {time}
              </span>
              <span className="text-[8px] font-bold text-white/50 uppercase tracking-[0.2em] mt-1 font-mono">
                {userData.location || 'GB_NODE'}
              </span>
            </div>
            
            {weather && (
              <div className="flex items-center gap-2 pl-4 border-l border-white/10">
                <div className="text-right">
                  <p className="text-[10px] font-black text-white leading-none">{weather.temp}°C</p>
                  <p className="text-[8px] font-bold text-white/50 uppercase tracking-widest mt-1">{weather.condition}</p>
                </div>
                <img 
                  src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} 
                  className="w-8 h-8 filter brightness-110 drop-shadow-lg" 
                  alt="" 
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-6 md:px-12 pb-10 -mt-16 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
            <div className="relative group">
              {/* Dynamic Neural Pulse Ring */}
              <div className={`absolute -inset-2 rounded-[2.8rem] transition-all duration-1000 ${getPulseClass()}`}></div>
              <div className="relative">
                <img 
                  src={userData.avatarUrl} 
                  className="relative w-32 h-32 md:w-44 md:h-44 rounded-[2.2rem] object-cover border-4 border-white shadow-2xl z-10" 
                  alt={userData.displayName} 
                />
                {/* Status Indicator */}
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-[4px] border-white z-20 ${getStatusColor()} shadow-lg`}></div>
              </div>
              
              {userData.verifiedHuman && (
                <div className="absolute top-0 -right-2 bg-indigo-600 text-white p-2 rounded-2xl shadow-xl border-4 border-white scale-110 z-20">
                  <ICONS.Verified />
                </div>
              )}
            </div>
            <div className="pb-2 space-y-1">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">
                  {userData.displayName}
                </h1>
                <span className="hidden md:block px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg uppercase tracking-widest border border-indigo-100">
                  {userData.role}
                </span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.4em] font-mono">
                  @{userData.username} • {userData.trustTier || 'Alpha'}-Class Node
                </p>
                <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor()} animate-pulse shadow-sm`} />
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-center md:pb-2">
            <button 
              onClick={onEdit}
              className="flex-1 md:flex-none px-8 py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 12H13.5" /></svg>
              Calibrate
            </button>
            <button className="p-4 bg-slate-100 text-slate-900 rounded-2xl hover:bg-slate-200 transition-all active:scale-95">
              <ICONS.Messages />
            </button>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-100 flex flex-wrap justify-center md:justify-start gap-8">
           <div className="flex flex-col">
              <span className="text-xl font-black text-slate-900 leading-none">{(userData.followers || 0).toLocaleString()}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Resonators</span>
           </div>
           <div className="flex flex-col">
              <span className="text-xl font-black text-slate-900 leading-none">{(userData.following || 0).toLocaleString()}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Following</span>
           </div>
           <div className="flex flex-col">
              <span className="text-xl font-black text-slate-900 leading-none">{postCount.toLocaleString()}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Transmissions</span>
           </div>
        </div>
      </div>
    </div>
  );
};
