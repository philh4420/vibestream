
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
    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-4 md:gap-5 mb-10 auto-rows-fr">
      
      {/* Tile 1: Core Identity (Large Bento) */}
      <div className="md:col-span-3 lg:col-span-8 bg-white border border-precision rounded-[2.5rem] p-6 md:p-10 shadow-sm relative overflow-hidden flex flex-col justify-between group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row gap-6 md:gap-8 items-start sm:items-center relative z-10">
          <div className="relative shrink-0">
            <div className={`absolute -inset-2 rounded-[2.2rem] opacity-20 blur-xl ${currentPresence.pulse}`} />
            <img 
              src={userData.avatarUrl} 
              className="w-24 h-24 md:w-36 md:h-36 rounded-3xl object-cover border-4 border-white shadow-xl relative z-10" 
              alt={userData.displayName} 
            />
            <div className={`absolute -bottom-1 -right-1 w-9 h-9 bg-white rounded-xl p-1.5 shadow-lg z-20 border border-slate-50`}>
              <div className={`w-full h-full rounded-md ${currentPresence.color}`} />
            </div>
          </div>

          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter italic leading-none">{userData.displayName}</h1>
              {userData.verifiedHuman && <div className="text-blue-500 scale-125"><ICONS.Verified /></div>}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-slate-100 text-[9px] font-black uppercase tracking-widest rounded-lg text-slate-500 font-mono">@{userData.username}</span>
              <span className="px-3 py-1 bg-indigo-50 text-[9px] font-black uppercase tracking-widest rounded-lg text-indigo-600 font-mono italic">{userData.role?.toUpperCase()}</span>
              <span className="px-3 py-1 bg-emerald-50 text-[9px] font-black uppercase tracking-widest rounded-lg text-emerald-600 font-mono">TIER_{userData.trustTier || 'ALPHA'}</span>
            </div>
            <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed max-w-xl line-clamp-2">
              {userData.bio}
            </p>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-3 relative z-10">
          {isOwnProfile && (
            <button 
              onClick={onEdit}
              className="px-8 py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-black transition-all active:scale-95 flex items-center gap-3 group/btn"
            >
              <div className="group-hover/btn:rotate-180 transition-transform duration-700"><ICONS.Settings /></div>
              Calibrate_ID
            </button>
          )}
          <button className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all active:scale-95 border border-indigo-100 shadow-sm">
            <ICONS.Messages />
          </button>
        </div>
      </div>

      {/* Tile 2: Transmission Stats */}
      <div className="md:col-span-1 lg:col-span-4 bg-slate-950 rounded-[2.5rem] p-8 text-white flex flex-col justify-around shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent opacity-50 pointer-events-none" />
        {[
          { label: 'Signals', val: postCount },
          { label: 'Connections', val: userData.followers },
          { label: 'Following', val: userData.following }
        ].map((stat, i) => (
          <div key={stat.label} className={`flex justify-between items-end ${i !== 2 ? 'border-b border-white/5 pb-4' : ''}`}>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] font-mono">{stat.label}</p>
            <p className="text-3xl font-black tracking-tighter leading-none">{stat.val.toLocaleString('en-GB')}</p>
          </div>
        ))}
      </div>

      {/* Tile 3: Telemetry (Weather/Time) */}
      <div className="md:col-span-2 lg:col-span-6 bg-white border border-precision rounded-[2.5rem] p-8 flex justify-between items-center group shadow-sm hover:border-indigo-500/20 transition-all">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono leading-none mb-2">Temporal_Node</p>
          <p className="text-5xl font-black text-slate-900 tracking-tighter">{time}</p>
          <p className="text-[11px] font-bold text-indigo-600 font-mono tracking-tight">{userData.location?.toUpperCase()}</p>
        </div>
        
        {weather && (
          <div className="text-right">
             <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-2 mx-auto">
                <img src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} className="w-12 h-12" alt="" />
             </div>
             <p className="text-3xl font-black text-slate-900 tracking-tighter">{weather.temp}°C</p>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">{weather.condition}</p>
          </div>
        )}
      </div>

      {/* Tile 4: Neural Status Cluster */}
      <div className="md:col-span-2 lg:col-span-6 bg-indigo-600 rounded-[2.5rem] p-8 text-white flex flex-col justify-between group shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-20"><ICONS.Globe /></div>
        
        <div className="flex items-center gap-4">
           <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shadow-inner">
             {userData.statusEmoji || '⚡'}
           </div>
           <div>
              <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.4em] font-mono mb-1">Signal_State</p>
              <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${currentPresence.color} animate-pulse shadow-[0_0_10px_white]`} />
                 <span className="text-sm font-black uppercase tracking-widest">{userData.presenceStatus || 'Online'}</span>
              </div>
           </div>
        </div>

        <div className="mt-6 pt-6 border-t border-white/10">
           <p className="text-xs font-bold italic text-white/90 line-clamp-2">
             "{userData.statusMessage || 'System online. Monitoring grid parameters...'}"
           </p>
        </div>
      </div>

    </div>
  );
};
