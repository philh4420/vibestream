
import React, { useState, useEffect } from 'react';
import { User, WeatherInfo, Region } from '../../types';
import { ICONS, PRESENCE_CONFIG } from '../../constants';
import { fetchWeather } from '../../services/weather';

interface ProfileHeaderProps {
  userData: User;
  onEdit: () => void;
  postCount?: number;
  addToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  isOwnProfile?: boolean;
  activeTab: string;
  onTabChange: (tab: any) => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  userData, 
  onEdit, 
  postCount = 0, 
  addToast, 
  isOwnProfile,
  activeTab,
  onTabChange
}) => {
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
      }
    };
    getAtmosphere();
  }, [userData.location]);

  const currentPresence = PRESENCE_CONFIG[userData.presenceStatus || 'Online'];

  const navTabs = [
    { id: 'broadcasting', label: 'Timeline' },
    { id: 'identity', label: 'About' },
    { id: 'visuals', label: 'Photos' },
    { id: 'resonance', label: 'Resonance' },
    { id: 'chronology', label: 'Archive' },
  ];

  return (
    <div className="w-full bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-[120rem] mx-auto relative">
        
        {/* COVER PHOTO ARCHITECTURE */}
        <div className="relative h-64 md:h-[450px] w-full overflow-hidden rounded-b-[2rem] bg-slate-100 group">
          <img 
            src={userData.coverUrl || 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80'} 
            className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-105" 
            alt="Cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          
          {/* Floating Atmospheric Telemetry (Top Right Overlay) */}
          <div className="absolute top-8 right-8 flex gap-4 animate-in fade-in slide-in-from-right-4 duration-1000">
            <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-3 flex items-center gap-4 text-white shadow-2xl">
              <span className="text-2xl font-black italic tracking-tighter font-mono">{time}</span>
              <div className="w-px h-6 bg-white/20" />
              {weather ? (
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold">{weather.temp}°</span>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{weather.condition}</span>
                </div>
              ) : (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              )}
            </div>
          </div>

          {isOwnProfile && (
            <button className="absolute bottom-6 right-8 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white px-6 py-3 rounded-2xl flex items-center gap-3 transition-all font-black text-[10px] uppercase tracking-widest shadow-xl">
              <ICONS.Create /> Edit Cover Photo
            </button>
          )}
        </div>

        {/* IDENTITY ANCHOR (Avatar Overlap) */}
        <div className="px-6 md:px-12 pb-6">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10 -mt-16 md:-mt-24 relative z-20">
            {/* Massive Avatar */}
            <div className="relative shrink-0">
              <div className="p-1.5 bg-white rounded-[4.5rem] shadow-2xl">
                <img 
                  src={userData.avatarUrl} 
                  className="w-40 h-40 md:w-56 md:h-56 rounded-[4rem] object-cover border-4 border-slate-50 shadow-inner group-hover:scale-[1.02] transition-transform duration-700" 
                  alt={userData.displayName} 
                />
              </div>
              <div className="absolute bottom-4 right-4 w-12 h-12 bg-white rounded-2xl p-1 shadow-2xl flex items-center justify-center border-4 border-white z-30">
                <div className={`w-4 h-4 rounded-full ${currentPresence.color} animate-pulse shadow-[0_0_15px_rgba(0,0,0,0.1)]`} />
              </div>
            </div>

            {/* Identity Info */}
            <div className="flex-1 text-center md:text-left md:pb-6">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-4 mb-2">
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none italic uppercase">
                  {userData.displayName}
                </h1>
                {userData.verifiedHuman && <div className="scale-150 mb-1"><ICONS.Verified /></div>}
              </div>
              <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                <p className="text-lg font-bold text-slate-400">@{userData.username}</p>
                <span className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                <p className="text-lg font-black text-indigo-600 uppercase tracking-widest italic">{userData.followers} Signals</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 md:pb-6">
              {isOwnProfile ? (
                <button 
                  onClick={onEdit}
                  className="h-16 px-10 bg-slate-950 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.4em] shadow-xl hover:bg-black transition-all flex items-center gap-4 group active:scale-95"
                >
                  <div className="group-hover:rotate-90 transition-transform duration-700"><ICONS.Settings /></div>
                  Calibrate_ID
                </button>
              ) : (
                <>
                  <button className="h-16 px-10 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.4em] shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-4 active:scale-95">
                    <ICONS.Create /> Follow Node
                  </button>
                  <button className="h-16 w-16 bg-slate-100 text-slate-900 rounded-2xl flex items-center justify-center hover:bg-slate-200 transition-all active:scale-95 border border-slate-200">
                    <ICONS.Messages />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* TABS ARCHITECTURE (Integrated Nav) */}
        <div className="border-t border-slate-100 px-6 md:px-12 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {navTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-8 py-8 text-[11px] font-black uppercase tracking-[0.4em] font-mono transition-all relative whitespace-nowrap ${
                  activeTab === tab.id ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-indigo-600 rounded-full" />
                )}
              </button>
            ))}
          </div>
          
          <button className="hidden xl:flex items-center gap-3 px-6 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">
             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Grid_Status: Sync_OK</span>
          </button>
        </div>

      </div>
    </div>
  );
};
