
import React, { useState, useEffect, useRef } from 'react';
import { User, WeatherInfo } from '../../types';
import { ICONS } from '../../constants';
import { fetchWeather } from '../../services/weather';

interface ProfileHeaderProps {
  userData: User;
  onEdit: () => void;
  postCount?: number;
  addToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ userData, onEdit, postCount = 0, addToast }) => {
  const [time, setTime] = useState<string>(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [isUsingGPS, setIsUsingGPS] = useState(false);
  const hasAlertedRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const getAtmosphere = async () => {
      let weatherData: WeatherInfo | null = null;

      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
          });
          
          weatherData = await fetchWeather({ 
            coords: { 
              lat: position.coords.latitude, 
              lon: position.coords.longitude 
            } 
          });

          if (weatherData) {
            setIsUsingGPS(true);
            if (addToast && !hasAlertedRef.current) {
              addToast("Neural-Geo Handshake Established", "success");
              hasAlertedRef.current = true;
            }
          }
        } catch (geoError) {
          console.debug("Geo-link refused, falling back to identity string.");
        }
      }

      if (!weatherData) {
        weatherData = await fetchWeather({ query: userData.location || 'London' });
        if (!weatherData && userData.location) {
          weatherData = await fetchWeather({ query: 'London' });
        }
        setIsUsingGPS(false);
      }

      setWeather(weatherData);
    };

    getAtmosphere();
  }, [userData.location, addToast]);

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
      {/* Cover Image with Atmospheric Depth */}
      <div className="h-56 md:h-80 relative overflow-hidden glass-shimmer">
        <img 
          src={userData.coverUrl} 
          className="w-full h-full object-cover transition-transform duration-[3s] hover:scale-110" 
          alt="" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />
        
        {/* Aura-Link Atmospheric Widget */}
        <div className="absolute top-6 right-6 md:top-8 md:right-8 flex items-center gap-3">
          <div className="glass-panel px-6 py-3.5 rounded-[2rem] border-white/20 backdrop-blur-[40px] flex items-center gap-6 shadow-[0_30px_60px_rgba(0,0,0,0.4)] ring-1 ring-white/10 group transition-all hover:ring-indigo-500/50">
            {/* Precision Time & Node */}
            <div className="flex flex-col items-end border-r border-white/10 pr-6">
              <span className="text-sm font-black text-white uppercase tracking-[0.2em] font-mono leading-none drop-shadow-md">
                {time}
              </span>
              <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.3em] mt-2 font-mono flex items-center gap-2 drop-shadow-sm">
                <span className={`w-1.5 h-1.5 rounded-full ${isUsingGPS ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`} />
                {userData.location || 'London_Core'}
              </span>
            </div>
            
            {/* Dynamic Weather Analytics */}
            {weather ? (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-baseline gap-1 justify-end">
                    <p className="text-lg font-black text-white leading-none drop-shadow-lg">{weather.temp}°</p>
                    <p className="text-[10px] font-bold text-white/50">C</p>
                  </div>
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-1.5 drop-shadow-sm">{weather.condition}</p>
                </div>
                
                {/* Advanced Telemetry Hover State */}
                <div className="hidden group-hover:flex flex-col items-start gap-1 text-[8px] font-black text-white/40 uppercase tracking-widest transition-all duration-500 animate-in fade-in slide-in-from-right-4">
                  <span className="flex items-center gap-2"><span className="text-indigo-400">FL:</span> {weather.feelsLike}°</span>
                  <span className="flex items-center gap-2"><span className="text-indigo-400">HU:</span> {weather.humidity}%</span>
                </div>

                <div className="relative w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl border border-white/10 shadow-inner group-hover:scale-110 transition-transform">
                  <img 
                    src={`https://openweathermap.org/img/wn/${weather.icon}@4x.png`} 
                    className="w-10 h-10 filter brightness-125 drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]" 
                    alt="" 
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-white/10" />
                <div className="w-16 h-4 bg-white/5 rounded" />
              </div>
            )}
          </div>
        </div>

        {weather?.condition === 'Rain' && (
           <div className="absolute inset-0 bg-indigo-900/10 backdrop-blur-[1px] pointer-events-none mix-blend-overlay" />
        )}
      </div>

      {/* Profile Identity Content */}
      <div className="px-6 md:px-12 pb-10 -mt-20 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
            <div className="relative group">
              <div className={`absolute -inset-3 rounded-[3.2rem] transition-all duration-1000 ${getPulseClass()}`}></div>
              <div className="relative">
                <img 
                  src={userData.avatarUrl} 
                  className="relative w-36 h-36 md:w-48 md:h-48 rounded-[2.5rem] object-cover border-[6px] border-white shadow-[0_30px_100px_rgba(0,0,0,0.2)] z-10 transition-transform duration-500 group-hover:scale-105" 
                  alt={userData.displayName} 
                />
                <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full border-[5px] border-white z-20 ${getStatusColor()} shadow-2xl`}></div>
              </div>
              
              {userData.verifiedHuman && (
                <div className="absolute top-2 -right-3 bg-indigo-600 text-white p-2.5 rounded-2xl shadow-2xl border-[5px] border-white scale-125 z-20">
                  <ICONS.Verified />
                </div>
              )}
            </div>
            <div className="pb-3 space-y-2">
              <div className="flex items-center justify-center md:justify-start gap-4">
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none transition-all hover:text-indigo-600 cursor-default">
                  {userData.displayName}
                </h1>
                <span className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-xl uppercase tracking-widest border border-indigo-100 shadow-sm">
                  <div className="w-1 h-1 bg-indigo-600 rounded-full animate-ping" />
                  {userData.role}
                </span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-3">
                <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">
                  @{userData.username} • {userData.trustTier || 'Alpha'}_NODE
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center md:pb-4">
            <button 
              onClick={onEdit}
              className="flex-1 md:flex-none px-10 py-4.5 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(0,0,0,0.15)] hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3 group"
            >
              <svg className="w-4 h-4 transition-transform group-hover:rotate-180 duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 12H13.5" /></svg>
              Calibrate
            </button>
            <button className="p-5 bg-slate-100 text-slate-900 rounded-2xl hover:bg-slate-200 transition-all active:scale-95 shadow-sm">
              <ICONS.Messages />
            </button>
          </div>
        </div>

        <div className="mt-10 pt-10 border-t border-slate-100 flex flex-wrap justify-center md:justify-start gap-12">
           <div className="flex flex-col group cursor-default">
              <span className="text-2xl font-black text-slate-900 leading-none transition-colors group-hover:text-indigo-600">{(userData.followers || 0).toLocaleString()}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Resonators</span>
           </div>
           <div className="flex flex-col group cursor-default">
              <span className="text-2xl font-black text-slate-900 leading-none transition-colors group-hover:text-indigo-600">{(userData.following || 0).toLocaleString()}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Following</span>
           </div>
           <div className="flex flex-col group cursor-default">
              <span className="text-2xl font-black text-slate-900 leading-none transition-colors group-hover:text-indigo-600">{postCount.toLocaleString()}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Signals</span>
           </div>
        </div>
      </div>
    </div>
  );
};
