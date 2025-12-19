
import React, { useState, useEffect, useRef } from 'react';
import { User, WeatherInfo, PresenceStatus } from '../../types';
import { ICONS } from '../../constants';
import { fetchWeather } from '../../services/weather';
import { db } from '../../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface ProfileHeaderProps {
  userData: User;
  onEdit: () => void;
  postCount?: number;
  addToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  isOwnProfile?: boolean;
}

const PRESENCE_CONFIG: Record<PresenceStatus, { color: string, pulse: string, label: string }> = {
  'Online': { color: 'bg-[#10b981]', pulse: 'pulse-active-emerald', label: 'ONLINE' },
  'Focus': { color: 'bg-[#f59e0b]', pulse: 'pulse-active-amber', label: 'FOCUS' },
  'Deep Work': { color: 'bg-[#e11d48]', pulse: 'pulse-active-indigo', label: 'DEEP WORK' },
  'In-Transit': { color: 'bg-[#6366f1]', pulse: 'pulse-active-indigo', label: 'IN-TRANSIT' },
  'Away': { color: 'bg-[#94a3b8]', pulse: '', label: 'AWAY' },
  'Invisible': { color: 'bg-[#334155]', pulse: '', label: 'INVISIBLE' },
  'Syncing': { color: 'bg-[#60a5fa]', pulse: 'pulse-active-emerald', label: 'SYNCING' }
};

const IDENTITY_SIGNALS = ['⚡', '🔋', '🚀', '🧠', '🎧', '✈️', '💻', '☕', '🌟', '🛡️', '🛰️'];

const PRONOUN_OPTIONS = [
  'Not Specified', 'They/Them', 'He/Him', 'She/Her', 'He/They', 'She/They',
  'Fluid', 'Private/Encrypted'
];

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ userData, onEdit, postCount = 0, addToast, isOwnProfile }) => {
  const [time, setTime] = useState<string>(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [isNeuralHubOpen, setIsNeuralHubOpen] = useState(false);
  
  // Local state for the Neural Hub to allow "committing" changes
  const [localStatus, setLocalStatus] = useState({
    presenceStatus: userData.presenceStatus || 'Online',
    statusEmoji: userData.statusEmoji || '⚡',
    statusMessage: userData.statusMessage || '',
    pronouns: userData.pronouns || 'Not Specified'
  });

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

  const commitNeuralUpdate = async () => {
    if (!db || !isOwnProfile) return;
    try {
      await updateDoc(doc(db, 'users', userData.id), localStatus);
      if (addToast) addToast(`Neural Identity Synchronised`, 'success');
      setIsNeuralHubOpen(false);
    } catch (e) {
      if (addToast) addToast("Sync Interrupted: Link Lost", "error");
    }
  };

  const currentPresence = PRESENCE_CONFIG[userData.presenceStatus || 'Online'];

  return (
    <div className="relative rounded-[3.5rem] overflow-hidden mb-12 shadow-[0_30px_100px_rgba(0,0,0,0.08)] bg-white border border-slate-100">
      {/* Dark Cover Section (Refined 2026 Pro Aesthetic) */}
      <div className="h-96 md:h-[40rem] relative overflow-hidden bg-[#0a0c12]">
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
          <div className="absolute top-10 -left-20 w-[30rem] h-[30rem] rounded-full border-[40px] border-white/[0.03]" />
          <div className="absolute bottom-20 right-[-10%] w-[35rem] h-[35rem] rounded-full border-[60px] border-white/[0.04]" />
        </div>

        {userData.coverUrl && (
          <img 
            src={userData.coverUrl} 
            className="w-full h-full object-cover mix-blend-overlay opacity-40 transition-transform duration-[15s] hover:scale-105" 
            alt="" 
          />
        )}
        
        {/* Telemetry Hub (Top-Right) */}
        <div className="absolute top-8 right-8 md:top-12 md:right-12 z-20">
          <div className="bg-black/20 backdrop-blur-[50px] border border-white/10 pl-10 pr-6 py-4 rounded-[4rem] flex items-center gap-8 shadow-2xl">
            <div className="flex flex-col items-start pr-8 border-r border-white/10">
              <span className="text-[16px] font-black text-white tracking-[0.2em] font-mono leading-none">{time}</span>
              <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.4em] mt-3 font-mono flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                {userData.location || 'PARK STREET, UK'}
              </span>
            </div>
            {weather && (
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-3xl font-black text-white leading-none tracking-tighter">{weather.temp}°</p>
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-2">SKY_{weather.condition.toUpperCase()}</p>
                </div>
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/5 shadow-inner">
                  <div className="w-4 h-4 bg-white/50 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Identity Cluster (Facebook-inspired bottom alignment) */}
        <div className="absolute left-10 md:left-24 bottom-32 md:bottom-48 space-y-8 z-10">
          <div className="space-y-0">
            <h1 className="text-7xl md:text-[10rem] font-black text-white tracking-tighter leading-[0.8] drop-shadow-[0_15px_60px_rgba(0,0,0,0.8)]">
              {userData.displayName.split(' ').map((part, i) => (
                <React.Fragment key={i}>
                  {part}
                  {i === 0 && <br />}
                </React.Fragment>
              ))}
            </h1>
            <p className="text-[14px] md:text-[20px] font-black text-white/20 uppercase tracking-[1em] font-mono mt-12 drop-shadow-xl">
              @{userData.username.toUpperCase()}
            </p>
          </div>

          {/* Floating Live Status Pill */}
          <div 
            onClick={() => isOwnProfile && setIsNeuralHubOpen(true)}
            className="inline-flex items-center gap-6 bg-black/40 backdrop-blur-[60px] border border-white/10 pl-6 pr-10 py-4 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] cursor-pointer hover:bg-black/50 transition-all group active:scale-95"
          >
            <span className="text-3xl group-hover:scale-110 transition-transform">{userData.statusEmoji || '⚡'}</span>
            <p className="text-[11px] font-black text-white/90 uppercase tracking-[0.3em] leading-none whitespace-nowrap">
              {userData.statusMessage || 'SYNCING WITH GRID...'}
            </p>
          </div>
        </div>
      </div>

      {/* Profile Base Section */}
      <div className="px-6 md:px-24 py-14 flex flex-col md:flex-row justify-between items-end gap-12 relative bg-white">
        
        {/* The Hub-integrated Avatar Interaction */}
        <div className="absolute left-10 md:left-24 -top-32 md:-top-56 group z-30">
          <div className="relative">
            <div className={`absolute -inset-8 rounded-[6rem] transition-all duration-[1.5s] ${currentPresence.pulse}`}></div>
            <div 
              onClick={() => isOwnProfile && setIsNeuralHubOpen(!isNeuralHubOpen)}
              className="w-64 h-64 md:w-96 md:h-96 bg-white rounded-[5.5rem] p-4 shadow-[0_60px_120px_rgba(0,0,0,0.15)] border border-slate-50 transition-all hover:scale-[1.01] cursor-pointer"
            >
              <img 
                src={userData.avatarUrl} 
                className="w-full h-full rounded-[4.8rem] object-cover" 
                alt={userData.displayName} 
              />
              
              {/* Pro Presence Toggle Dot */}
              <div className="absolute bottom-12 right-12 w-16 h-16 rounded-full border-[12px] border-white bg-white shadow-2xl flex items-center justify-center overflow-hidden">
                <div className={`w-full h-full ${currentPresence.color} transition-colors duration-1000 shadow-inner`} />
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* NEURAL IDENTITY HUB - Matching Reference UI */}
            {isNeuralHubOpen && (
              <>
                <div className="fixed inset-0 z-[100] bg-slate-950/20 backdrop-blur-sm" onClick={() => setIsNeuralHubOpen(false)}></div>
                <div className="absolute left-full ml-12 top-0 w-96 bg-white rounded-[3.5rem] shadow-[0_80px_150px_rgba(0,0,0,0.25)] border border-slate-100 z-[110] p-10 overflow-hidden animate-in zoom-in-95 slide-in-from-left-8 duration-500">
                  <div className="space-y-10">
                    
                    {/* Identity Signal Grid */}
                    <section>
                      <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] font-mono mb-8">Identity Signal</h4>
                      <div className="grid grid-cols-4 gap-4">
                        {IDENTITY_SIGNALS.map(emoji => (
                          <button 
                            key={emoji}
                            onClick={() => setLocalStatus({...localStatus, statusEmoji: emoji})}
                            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all ${localStatus.statusEmoji === emoji ? 'bg-indigo-600 shadow-[0_10px_25px_rgba(79,110,247,0.4)] scale-110 text-white' : 'bg-slate-50 hover:bg-slate-100 text-slate-800'}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </section>

                    {/* Status Message Overlay */}
                    <section>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mb-5">Status Message Overlay</h4>
                      <div className="relative">
                        <input 
                          type="text"
                          value={localStatus.statusMessage}
                          onChange={(e) => setLocalStatus({...localStatus, statusMessage: e.target.value})}
                          placeholder="Just updating features on VibeStream"
                          className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-8 py-5 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-300"
                        />
                      </div>
                    </section>

                    {/* Presence Mode Selection */}
                    <section>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mb-5">Presence Mode</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {(Object.keys(PRESENCE_CONFIG) as PresenceStatus[]).map(status => (
                          <button 
                            key={status}
                            onClick={() => setLocalStatus({...localStatus, presenceStatus: status})}
                            className={`flex items-center gap-3 px-5 py-4 rounded-2xl transition-all text-[10px] font-black uppercase tracking-wider ${localStatus.presenceStatus === status ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-50 border border-transparent text-slate-500 hover:bg-slate-100'}`}
                          >
                            <div className={`w-2.5 h-2.5 rounded-full ${PRESENCE_CONFIG[status].color}`} />
                            {status}
                          </button>
                        ))}
                      </div>
                    </section>

                    {/* Biometric ID Preference */}
                    <section>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mb-5">Biometric ID Preference</h4>
                      <select 
                        value={localStatus.pronouns} 
                        onChange={(e) => setLocalStatus({...localStatus, pronouns: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-8 py-4 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                      >
                        {PRONOUN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </section>

                    {/* Hub Action Footer */}
                    <div className="pt-4 flex gap-4">
                      <button onClick={() => setIsNeuralHubOpen(false)} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all">Abort</button>
                      <button onClick={commitNeuralUpdate} className="flex-2 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95 transition-all">Commit Neural Sync</button>
                    </div>

                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Global Action Bar (Reference Alignment) */}
        <div className="flex-1 flex justify-end items-center gap-6 pb-6">
          <button 
            onClick={onEdit}
            className="px-14 py-6 bg-white text-slate-900 border border-slate-100 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-[0_20px_60px_rgba(0,0,0,0.04)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.1)] hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-5 group"
          >
            <div className="group-hover:rotate-180 transition-transform duration-700 ease-in-out"><ICONS.Settings /></div>
            CALIBRATE
          </button>
          <button className="p-7 bg-[#4F6EF7] text-white rounded-[2.5rem] hover:bg-[#3F5ED7] transition-all active:scale-95 shadow-2xl shadow-indigo-200/50 flex items-center justify-center">
            <ICONS.Messages />
          </button>
        </div>
      </div>
    </div>
  );
};
