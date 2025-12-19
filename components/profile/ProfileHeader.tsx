
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
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 lg:gap-8 mb-10 max-w-[2560px] mx-auto">
      
      {/* Identity Bento Cluster (Primary) */}
      <div className="md:col-span-12 lg:col-span-8 xl:col-span-9 bg-white border border-precision rounded-[3rem] p-6 md:p-12 shadow-sm relative overflow-hidden flex flex-col justify-between group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row gap-8 md:gap-12 items-start sm:items-center relative z-10">
          <div className="relative shrink-0">
            <div className={`absolute -inset-4 rounded-[3rem] opacity-20 blur-3xl ${currentPresence.pulse}`} />
            <img 
              src={userData.avatarUrl} 
              className="w-32 h-32 md:w-48 md:h-48 rounded-[2.5rem] object-cover border-4 border-white shadow-2xl relative z-10" 
              alt={userData.displayName} 
            />
            <div className={`absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-2xl p-2 shadow-xl z-20 border border-slate-50`}>
              <div className={`w-full h-full rounded-lg ${currentPresence.color}`} />
            </div>
          </div>

          <div className="space-y-5 flex-1">
            <div className="flex items-center gap-5 flex-wrap">
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter italic leading-none">{userData.displayName}</h1>
              {userData.verifiedHuman && <div className="text-blue-500 scale-150"><ICONS.Verified /></div>}
            </div>
            
            <div className="flex flex-wrap gap-3">
              <span className="px-4 py-2 bg-slate-100 text-[11px] font-black uppercase tracking-widest rounded-xl text-slate-500 font-mono">@{userData.username}</span>
              <span className="px-4 py-2 bg-indigo-50 text-[11px] font-black uppercase tracking-widest rounded-xl text-indigo-600 font-mono italic">{userData.role?.toUpperCase()}</span>
              {userData.trustTier && <span className="px-4 py-2 bg-emerald-50 text-[11px] font-black uppercase tracking-widest rounded-xl text-emerald-600 font-mono">TIER_{userData.trustTier.toUpperCase()}</span>}
              {userData.pronouns && <span className="px-4 py-2 bg-slate-900 text-[11px] font-black uppercase tracking-widest rounded-xl text-white font-mono">{userData.pronouns.toUpperCase()}</span>}
            </div>

            <p className="text-slate-500 text-base md:text-lg font-medium leading-relaxed max-w-4xl line-clamp-2">
              {userData.bio || "No identity signature established for this node."}
            </p>
          </div>
        </div>

        <div className="mt-12 flex items-center gap-5 relative z-10">
          {isOwnProfile && (
            <button 
              onClick={onEdit}
              className="px-12 py-6 bg-slate-950 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl hover:bg-black transition-all active:scale-95 flex items-center gap-5 group/btn"
            >
              <div className="group-hover/btn:rotate-180 transition-transform duration-700"><ICONS.Settings /></div>
              Calibrate_ID
            </button>
          )}
          <button className="p-6 bg-indigo-50 text-indigo-600 rounded-[2rem] hover:bg-indigo-100 transition-all active:scale-95 border border-indigo-100 shadow-sm">
            <ICONS.Messages />
          </button>
        </div>
      </div>

      {/* Telemetry Strip Bento Tile */}
      <div className="md:col-span-12 lg:col-span-4 xl:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 md:gap-6">
        
        {/* Metric Hub */}
        <div className="bg-slate-950 rounded-[3rem] p-10 text-white flex justify-around items-center shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent opacity-50 pointer-events-none" />
          {[
            { label: 'Signals', val: postCount },
            { label: 'Conn', val: userData.followers },
            { label: 'Follow', val: userData.following }
          ].map((stat) => (
            <div key={stat.label} className="text-center relative z-10">
              <p className="text-4xl font-black tracking-tighter leading-none mb-2">{stat.val.toLocaleString('en-GB')}</p>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] font-mono">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Atmospheric Node */}
        <div className="bg-white border border-precision rounded-[3rem] p-10 flex justify-between items-center group shadow-sm hover:border-indigo-500/20 transition-all overflow-hidden relative">
          <div className="space-y-1 relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono leading-none mb-3">Atmospheric_Link</p>
            <p className="text-6xl font-black text-slate-900 tracking-tighter italic">{time}</p>
            <p className="text-[12px] font-black text-indigo-600 font-mono tracking-tight uppercase">{userData.location || 'London_Grid'}</p>
          </div>
          
          {weather && (
            <div className="text-right relative z-10">
               <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-3 mx-auto ring-1 ring-slate-100 shadow-inner">
                  <img src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} className="w-16 h-16" alt="" />
               </div>
               <p className="text-3xl font-black text-slate-900 tracking-tighter">{weather.temp}°C</p>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">{weather.condition.toUpperCase()}</p>
            </div>
          )}
        </div>

      </div>

      {/* Global Status Bento Bar */}
      <div className="md:col-span-12 bg-indigo-600 rounded-[3rem] p-10 text-white flex flex-col md:flex-row items-center justify-between group shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none"><ICONS.Globe /></div>
        
        <div className="flex items-center gap-8 mb-6 md:mb-0">
           <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-[1.8rem] flex items-center justify-center text-5xl shadow-inner border border-white/20">
             {userData.statusEmoji || '⚡'}
           </div>
           <div>
              <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.4em] font-mono mb-2">Neural_Signal</p>
              <p className="text-2xl font-black italic tracking-tight leading-none text-white/95">
                "{userData.statusMessage || 'Tracking core resonance...'}"
              </p>
           </div>
        </div>

        <div className="flex items-center gap-8 px-10 py-4 bg-black/10 rounded-2xl border border-white/5 backdrop-blur-md">
           <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${currentPresence.color} animate-pulse shadow-[0_0_20px_white]`} />
              <span className="text-sm font-black uppercase tracking-[0.25em]">{userData.presenceStatus?.toUpperCase() || 'ONLINE'}</span>
           </div>
           <div className="w-px h-6 bg-white/20" />
           <p className="text-[11px] font-black uppercase tracking-[0.3em] opacity-70 font-mono">GB_SYNC_STABLE</p>
        </div>
      </div>

    </div>
  );
};
