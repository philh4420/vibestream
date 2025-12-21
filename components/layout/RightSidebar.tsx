
import React, { useState, useEffect } from 'react';
import { db, auth } from '../../services/firebase';
import { 
  collection, 
  query, 
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { User as VibeUser, PresenceStatus, Post, WeatherInfo } from '../../types';
import { ICONS } from '../../constants';
import { fetchWeather } from '../../services/weather';

interface RightSidebarProps {
  userData: VibeUser | null;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ userData }) => {
  const [activeContacts, setActiveContacts] = useState<VibeUser[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [systemTime, setSystemTime] = useState(new Date());
  const [uptime, setUptime] = useState('00:00:00');
  const [gpsLock, setGpsLock] = useState(false);

  // System Time & Uptime Logic
  useEffect(() => {
    const sessionStartValue = localStorage.getItem('vibestream_session_start_timestamp');
    const sessionStart = sessionStartValue ? parseInt(sessionStartValue, 10) : Date.now();
    
    const timer = setInterval(() => {
      const now = new Date();
      setSystemTime(now);
      
      const diff = Math.floor((now.getTime() - sessionStart) / 1000);
      if (isNaN(diff)) return;

      const h = Math.floor(diff / 3600).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
      const s = (diff % 60).toString().padStart(2, '0');
      setUptime(`${h}:${m}:${s}`);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Weather & Geolocation Logic
  useEffect(() => {
    if (!db) return;
    setIsLoading(true);

    const loadAtmosphericData = async () => {
      try {
        // First try precision GPS lock
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              const weatherData = await fetchWeather({ coords: { lat: latitude, lon: longitude } });
              setWeather(weatherData);
              setGpsLock(true);
            },
            async (error) => {
              // Fallback to profile location if GPS fails or is denied
              const weatherData = await fetchWeather({ query: userData?.location || 'London' });
              setWeather(weatherData);
              setGpsLock(false);
            },
            { timeout: 10000 }
          );
        } else {
          const weatherData = await fetchWeather({ query: userData?.location || 'London' });
          setWeather(weatherData);
        }
      } catch (err) {
        console.warn("Atmospheric sync interrupted");
        setWeather(null);
      }
    };
    
    loadAtmosphericData();
    
    const usersQuery = query(collection(db, 'users'), limit(12), orderBy('joinedAt', 'desc'));
    const unsubUsers = onSnapshot(usersQuery, (snap) => {
      const fetched = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as VibeUser))
        .filter(user => user.id !== auth.currentUser?.uid);
      setActiveContacts(fetched);
      setIsLoading(false);
    });

    const trendingQuery = query(collection(db, 'posts'), orderBy('likes', 'desc'), limit(3));
    const unsubTrending = onSnapshot(trendingQuery, (snap) => {
      setTrendingPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Post)));
    });

    return () => {
      unsubUsers();
      unsubTrending();
    };
  }, [userData?.id, userData?.location]);

  const PRESENCE_DOTS: Record<PresenceStatus, string> = {
    'Online': 'bg-[#10b981]',
    'Focus': 'bg-[#f59e0b]',
    'Deep Work': 'bg-[#e11d48]',
    'In-Transit': 'bg-[#6366f1]',
    'Away': 'bg-[#94a3b8]',
    'Invisible': 'bg-[#334155]',
    'Syncing': 'bg-[#60a5fa]'
  };

  return (
    <aside className="hidden xl:flex flex-col w-[380px] shrink-0 bg-[#f8fafc] border-l border-precision h-full pt-[calc(var(--header-h)+1rem)] pb-8 overflow-hidden">
      
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 space-y-8 pb-10">
        
        {/* SECTION: SYSTEM MONITOR WIDGET */}
        <div className="relative group overflow-hidden bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl shadow-indigo-500/10 transition-all duration-500 hover:shadow-indigo-500/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.4em] font-mono mb-1">Grid_Uptime</p>
              <p className="text-xl font-black font-mono tracking-tighter text-white">{uptime}</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] font-mono mb-1">Local_Node</p>
              <p className="text-[11px] font-bold text-slate-200">{gpsLock ? 'GPS_LOCK_READY' : 'GB-LON-026'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 relative z-10">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md">
              <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest font-mono mb-1.5 text-center">Neural_Time</p>
              <p className="text-base font-black text-center text-white font-mono">
                {systemTime.toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md">
              <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest font-mono mb-1.5 text-center">Atmospherics</p>
              {weather ? (
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-base font-black text-white font-mono">{weather.temp}°C</span>
                  {weather.icon ? (
                    <img 
                      src={`https://openweathermap.org/img/wn/${weather.icon}.png`} 
                      className="w-5 h-5 object-contain brightness-200" 
                      alt="" 
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  ) : null}
                </div>
              ) : (
                <p className="text-[10px] font-bold text-slate-600 text-center animate-pulse">SYNCING</p>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-5 relative z-10">
             <div className="flex items-center gap-1.5">
               <div className={`w-1 h-1 ${gpsLock ? 'bg-indigo-400' : 'bg-emerald-500'} rounded-full animate-pulse`} />
               <span className={`text-[8px] font-black ${gpsLock ? 'text-indigo-400' : 'text-emerald-400'} uppercase tracking-widest font-mono`}>
                 {gpsLock ? 'GPS_Precision_Active' : 'Kernel_Optimised'}
               </span>
             </div>
             <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest font-mono">v2.6.4</span>
          </div>
        </div>

        {/* SECTION: TRENDING SIGNALS */}
        {trendingPosts.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Trending_Signals</h4>
              <div className="w-1 h-1 bg-rose-500 rounded-full animate-ping" />
            </div>
            <div className="space-y-3">
              {trendingPosts.map((post, idx) => (
                <div key={post.id} className="group relative flex gap-4 p-3 bg-white rounded-[1.8rem] border border-slate-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 cursor-pointer">
                  <div className="absolute -top-1.5 -left-1.5 w-6 h-6 bg-slate-900 text-white text-[9px] font-black flex items-center justify-center rounded-lg shadow-lg group-hover:bg-indigo-600 transition-colors">
                    {idx + 1}
                  </div>
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border-precision shadow-sm bg-slate-50">
                    {post.media?.[0]?.url ? (
                      <img src={post.media[0].url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-200 bg-slate-50 scale-75"><ICONS.Explore /></div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center min-w-0 flex-1">
                    <p className="text-[11px] font-extrabold text-slate-900 leading-snug mb-1 group-hover:text-indigo-600 transition-colors line-clamp-2 italic tracking-tight">
                      {post.content || "Neural Signal Entry..."}
                    </p>
                    <div className="flex items-center justify-between">
                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] font-mono">
                         {(post.likes || 0).toLocaleString('en-GB')} PULSES
                       </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION: ACTIVE GRID (CONTACTS) */}
        <div className="space-y-4">
           <div className="flex items-center justify-between px-2">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Neural_Mesh</h4>
              <button className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-white rounded-lg transition-all scale-75"><ICONS.Search /></button>
           </div>

           <div className="space-y-1">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 animate-pulse bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-1.5 bg-slate-100 rounded w-1/2" />
                      <div className="h-1 bg-slate-100 rounded w-1/3" />
                    </div>
                  </div>
                ))
              ) : activeContacts.map(node => (
                <button 
                  key={node.id}
                  className="w-full flex items-center justify-between p-3 bg-white/40 hover:bg-white border border-transparent hover:border-precision rounded-[1.5rem] transition-all duration-300 group active:scale-95 hover:shadow-md"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="relative shrink-0">
                      <div className="p-0.5 bg-white rounded-xl shadow-sm border border-slate-100 transition-transform group-hover:rotate-3">
                        <img src={node.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${node.id}`} className="w-9 h-9 rounded-lg object-cover" alt="" />
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5">
                         <div className={`w-3 h-3 rounded-full border-[2.5px] border-white shadow-sm ${node.presenceStatus ? PRESENCE_DOTS[node.presenceStatus] : 'bg-slate-300'} ${node.presenceStatus === 'Online' ? 'animate-pulse' : ''}`} />
                      </div>
                    </div>
                    <div className="text-left overflow-hidden">
                       <p className="text-[12px] font-black text-slate-900 truncate tracking-tight group-hover:text-indigo-600 transition-colors">
                         {node.displayName || 'Unknown Node'}
                       </p>
                       <div className="flex items-center gap-1 mt-0.5">
                         <span className="text-[9px]">{node.statusEmoji || '⚡'}</span>
                         <p className="text-[9px] text-slate-400 font-bold truncate tracking-tight font-mono italic opacity-80">
                           {node.statusMessage || (node.presenceStatus ? node.presenceStatus.toUpperCase() : 'OFFLINE')}
                         </p>
                       </div>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-indigo-50 text-indigo-600 rounded-lg scale-75">
                    <ICONS.Messages />
                  </div>
                </button>
              ))}
           </div>
           
           <button className="w-full py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono hover:text-indigo-600 transition-colors bg-slate-50/50 rounded-xl border border-dashed border-slate-200 hover:border-indigo-200">
             Load_More_Nodes...
           </button>
        </div>

        {/* FOOTER MINI INFO */}
        <div className="px-2 pt-8 pb-4 border-t border-slate-100 flex flex-col gap-3">
           <div className="flex items-center gap-3">
             <div className="flex-1 h-px bg-slate-100" />
             <span className="text-[8px] font-black text-slate-800 uppercase tracking-[0.5em] font-mono">Infrastructure</span>
             <div className="flex-1 h-px bg-slate-100" />
           </div>
           <p className="text-[8px] text-center text-slate-800 font-bold leading-relaxed px-4 opacity-50">
             VibeStream Node 2.6 Synchronisation Active. Local UK routing cluster operational via GB-LON-CENTRAL.
           </p>
        </div>
      </div>
    </aside>
  );
};
