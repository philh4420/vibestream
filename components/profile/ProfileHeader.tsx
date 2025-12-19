
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
      const weatherData = await fetchWeather({ query: userData.location || 'London' });
      setWeather(weatherData);
    };
    getAtmosphere();
  }, [userData.location]);

  const currentPresence = PRESENCE_CONFIG[userData.presenceStatus || 'Online'];

  return (
    <div className="relative rounded-[4rem] overflow-hidden mb-12 shadow-[0_40px_100px_rgba(0,0,0,0.12)] bg-white border border-slate-100 group/header">
      {/* Immersive Cover Area */}
      <div className="h-[45rem] md:h-[55rem] relative overflow-hidden bg-slate-950">
        {/* Dynamic Abstract Background Elements */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute -top-20 -left-20 w-[60rem] h-[60rem] bg-indigo-600/10 rounded-full blur-[150px] animate-pulse" />
          <div className="absolute -bottom-40 -right-40 w-[50rem] h-[50rem] bg-emerald-600/10 rounded-full blur-[150px]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay" />
        </div>

        {userData.coverUrl && (
          <img 
            src={userData.coverUrl} 
            className="w-full h-full object-cover mix-blend-soft-light opacity-50 transition-transform duration-[20s] group-hover/header:scale-105" 
            alt="" 
          />
        )}
        
        {/* Top Floating Telemetry Hub */}
        <div className="absolute top-10 right-10 md:top-16 md:right-16 z-20 flex gap-4">
          <div className="glass-panel bg-black/20 border-white/10 px-8 py-5 rounded-[2.5rem] flex items-center gap-8 shadow-2xl">
            <div className="flex flex-col border-r border-white/10 pr-8">
              <span className="text-xl font-black text-white tracking-widest font-mono leading-none">{time}</span>
              <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.4em] mt-3 font-mono flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                {userData.location?.toUpperCase() || 'NODE_OFFLINE'}
              </span>
            </div>
            {weather && (
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-3xl font-black text-white tracking-tighter leading-none">{weather.temp}°</p>
                  <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.3em] mt-2 font-mono">{weather.condition}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Identity Typography (The Hero Look) */}
        <div className="absolute left-12 md:left-24 bottom-32 md:bottom-48 z-10 max-w-4xl space-y-10">
          <div className="space-y-4">
             <div className="flex items-center gap-6 animate-in fade-in slide-in-from-left-10 duration-1000">
                <div className="px-6 py-2 bg-white text-slate-900 rounded-full font-black text-[10px] uppercase tracking-[0.3em] italic shadow-2xl">
                  {userData.role?.toUpperCase() || 'MEMBER'}
                </div>
                {userData.verifiedHuman && <div className="text-blue-400 drop-shadow-lg"><ICONS.Verified /></div>}
             </div>
             <h1 className="text-8xl md:text-[12rem] font-black text-white tracking-tighter leading-[0.85] drop-shadow-[0_20px_60px_rgba(0,0,0,0.6)] animate-in fade-in slide-in-from-bottom-12 duration-1000">
               {userData.displayName.split(' ').map((part, i) => (
                 <React.Fragment key={i}>
                   {part}{i === 0 && <br />}
                 </React.Fragment>
               ))}
             </h1>
          </div>

          <div className="flex items-center gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-3xl border border-white/10 pl-5 pr-8 py-4 rounded-2xl shadow-2xl">
              <span className="text-2xl">{userData.statusEmoji || '⚡'}</span>
              <div>
                <p className="text-[11px] font-black text-white tracking-widest uppercase leading-none mb-1">Status_Signal</p>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider line-clamp-1">{userData.statusMessage || 'AWAITING INPUT...'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Metrics & Actions */}
      <div className="px-12 md:px-24 py-16 flex flex-col md:flex-row justify-between items-end gap-12 relative bg-white">
        
        {/* Floating Pro Avatar */}
        <div className="absolute left-12 md:left-24 -top-32 md:-top-56 z-30 group/avatar">
           <div className="relative">
              <div className={`absolute -inset-10 rounded-[6.5rem] transition-all duration-[1.5s] ${currentPresence.pulse}`} />
              <div className="w-64 h-64 md:w-96 md:h-96 bg-white rounded-[6rem] p-4 shadow-[0_60px_120px_rgba(0,0,0,0.2)] border border-slate-50 transition-all hover:scale-[1.02] cursor-pointer ring-1 ring-slate-100/50">
                 <img src={userData.avatarUrl} className="w-full h-full rounded-[5.2rem] object-cover" alt="" />
                 
                 {/* Precision Status Dot */}
                 <div className="absolute bottom-10 right-10 w-20 h-20 bg-white rounded-full p-3 shadow-2xl border border-slate-50">
                    <div className={`w-full h-full rounded-full ${currentPresence.color} shadow-inner transition-colors duration-500`} />
                 </div>
              </div>
           </div>
        </div>

        {/* Dynamic Stats Row */}
        <div className="flex-1 flex flex-col md:flex-row gap-12 md:gap-20 md:ml-[28rem] mb-6">
           {[
             { label: 'Transmissions', value: postCount },
             { label: 'Connections', value: userData.followers },
             { label: 'Following', value: userData.following }
           ].map(stat => (
             <div key={stat.label} className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono leading-none">{stat.label}</p>
                <p className="text-4xl font-black text-slate-950 tracking-tighter">{stat.value.toLocaleString('en-GB')}</p>
             </div>
           ))}
        </div>

        {/* Global Action Interface */}
        <div className="flex items-center gap-6 pb-4">
           {isOwnProfile && (
             <button 
                onClick={onEdit}
                className="px-14 py-6 bg-slate-950 text-white rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl hover:bg-black transition-all active:scale-95 flex items-center gap-6 group/btn"
             >
               <div className="group-hover/btn:rotate-180 transition-transform duration-700"><ICONS.Settings /></div>
               Calibrate_ID
             </button>
           )}
           <button className="p-7 bg-indigo-50 text-indigo-600 rounded-[2.5rem] hover:bg-indigo-100 transition-all active:scale-95 shadow-lg border border-indigo-100/50">
             <ICONS.Messages />
           </button>
        </div>
      </div>
    </div>
  );
};
