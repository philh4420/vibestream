
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
  const [time, setTime] = useState<string>(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
  const [weather, setWeather] = useState<WeatherInfo | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const getAtmosphere = async () => {
      const weatherData = await fetchWeather({ query: userData.location || 'London' });
      setWeather(weatherData);
    };
    getAtmosphere();
  }, [userData.location]);

  const currentPresence = PRESENCE_CONFIG[userData.presenceStatus || 'Online'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5 mb-10">
      
      {/* Primary Identity Bento: Avatar + Bio (Large) */}
      <div className="md:col-span-12 lg:col-span-8 bg-white border border-precision rounded-[2.5rem] p-6 md:p-10 shadow-sm relative overflow-hidden flex flex-col justify-between group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row gap-6 md:gap-10 items-start sm:items-center relative z-10">
          <div className="relative shrink-0">
            <div className={`absolute -inset-3 rounded-[2.5rem] opacity-20 blur-2xl ${currentPresence.pulse}`} />
            <img 
              src={userData.avatarUrl} 
              className="w-28 h-28 md:w-44 md:h-44 rounded-[2.2rem] object-cover border-4 border-white shadow-2xl relative z-10" 
              alt={userData.displayName} 
            />
            <div className={`absolute -bottom-1 -right-1 w-10 h-10 bg-white rounded-xl p-1.5 shadow-xl z-20 border border-slate-50`}>
              <div className={`w-full h-full rounded-lg ${currentPresence.color}`} />
            </div>
          </div>

          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-4 flex-wrap">
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter italic leading-none">{userData.displayName}</h1>
              {userData.verifiedHuman && <div className="text-blue-500 scale-125"><ICONS.Verified /></div>}
            </div>
            
            <div className="flex flex-wrap gap-2.5">
              <span className="px-3 py-1.5 bg-slate-100 text-[10px] font-black uppercase tracking-widest rounded-lg text-slate-500 font-mono">@{userData.username}</span>
              <span className="px-3 py-1.5 bg-indigo-50 text-[10px] font-black uppercase tracking-widest rounded-lg text-indigo-600 font-mono italic">{userData.role?.toUpperCase()}</span>
              {userData.trustTier && <span className="px-3 py-1.5 bg-emerald-50 text-[10px] font-black uppercase tracking-widest rounded-lg text-emerald-600 font-mono">TIER_{userData.trustTier.toUpperCase()}</span>}
              {userData.pronouns && <span className="px-3 py-1.5 bg-slate-50 text-[10px] font-black uppercase tracking-widest rounded-lg text-slate-400 font-mono">{userData.pronouns.toUpperCase()}</span>}
            </div>

            <p className="text-slate-500 text-sm md:text-base font-medium leading-relaxed max-w-2xl line-clamp-2 italic">
              {userData.bio || "No identity signature established."}
            </p>
          </div>
        </div>

        <div className="mt-10 flex items-center gap-4 relative z-10">
          {isOwnProfile && (
            <button 
              onClick={onEdit}
              className="px-10 py-5 bg-slate-950 text-white rounded-[1.8rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-xl hover:bg-black transition-all active:scale-95 flex items-center gap-4 group/btn"
            >
              <div className="group-hover/btn:rotate-180 transition-transform duration-700"><ICONS.Settings /></div>
              Calibrate_ID
            </button>
          )}
          <button className="p-5 bg-indigo-50 text-indigo-600 rounded-[1.8rem] hover:bg-indigo-100 transition-all active:scale-95 border border-indigo-100 shadow-sm">
            <ICONS.Messages />
          </button>
        </div>
      </div>

      {/* Telemetry Strip Bento Tile */}
      <div className="md:col-span-12 lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 md:gap-5">
        
        {/* Metric Cluster */}
        <div className="bg-slate-950 rounded-[2.5rem] p-8 text-white flex justify-around items-center shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-50 pointer-events-none" />
          {[
            { label: 'Signals', val: postCount },
            { label: 'Conn', val: userData.followers },
            { label: 'Follow', val: userData.following }
          ].map((stat) => (
            <div key={stat.label} className="text-center relative z-10">
              <p className="text-3xl font-black tracking-tighter leading-none mb-2">{stat.val.toLocaleString('en-GB')}</p>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] font-mono">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Environment Node (Time/Weather) */}
        <div className="bg-white border border-precision rounded-[2.5rem] p-8 flex justify-between items-center group shadow-sm hover:border-indigo-500/20 transition-all">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono leading-none mb-2">Environment_Node</p>
            <p className="text-5xl font-black text-slate-900 tracking-tighter">{time}</p>
            <p className="text-[11px] font-bold text-indigo-600 font-mono tracking-tight">{userData.location?.toUpperCase()}</p>
          </div>
          
          {weather && (
            <div className="text-right">
               <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-2 mx-auto ring-1 ring-slate-100">
                  <img src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} className="w-12 h-12" alt="" />
               </div>
               <p className="text-2xl font-black text-slate-900 tracking-tighter">{weather.temp}°C</p>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">{weather.condition}</p>
            </div>
          )}
        </div>

      </div>

      {/* Status Signal Bento Tile (Wide on desktop) */}
      <div className="md:col-span-12 bg-indigo-600 rounded-[2.5rem] p-8 text-white flex flex-col sm:flex-row items-center justify-between group shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none"><ICONS.Globe /></div>
        
        <div className="flex items-center gap-6 mb-4 sm:mb-0">
           <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-4xl shadow-inner border border-white/20">
             {userData.statusEmoji || '⚡'}
           </div>
           <div>
              <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.4em] font-mono mb-1">Current_Signal</p>
              <p className="text-lg font-black italic tracking-tight leading-none text-white/90 truncate max-w-md">
                "{userData.statusMessage || 'Establish signal...'}"
              </p>
           </div>
        </div>

        <div className="flex items-center gap-6 px-8 py-3 bg-black/10 rounded-2xl border border-white/5 backdrop-blur-sm">
           <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${currentPresence.color} animate-pulse shadow-[0_0_15px_white]`} />
              <span className="text-xs font-black uppercase tracking-[0.2em]">{userData.presenceStatus || 'Online'}</span>
           </div>
           <div className="w-px h-4 bg-white/20" />
           <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Grid_Stable</p>
        </div>
      </div>

    </div>
  );
};
