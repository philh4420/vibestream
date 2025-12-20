
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

  // System Time & Uptime Logic
  useEffect(() => {
    const sessionStart = parseInt(localStorage.getItem('vibestream_session_start_timestamp') || Date.now().toString(), 10);
    
    const timer = setInterval(() => {
      const now = new Date();
      setSystemTime(now);
      
      const diff = Math.floor((now.getTime() - sessionStart) / 1000);
      const h = Math.floor(diff / 3600).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
      const s = (diff % 60).toString().padStart(2, '0');
      setUptime(`${h}:${m}:${s}`);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Weather & Data Fetching
  useEffect(() => {
    if (!db) return;
    setIsLoading(true);

    const loadAtmosphericData = async () => {
      const weatherData = await fetchWeather({ query: userData?.location || 'London' });
      setWeather(weatherData);
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
    <aside className="hidden xl:flex flex-col w-[400px] shrink-0 bg-[#f8fafc] border-l border-precision h-full pt-[calc(var(--header-h)+1rem)] pb-8 overflow-hidden">
      
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 space-y-10 pb-10">
        
        {/* SECTION: SYSTEM MONITOR WIDGET */}
        <div className="relative group overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-500/10 transition-all duration-500 hover:shadow-indigo-500/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] font-mono mb-1">Grid_Uptime</p>
              <p className="text-2xl font-black font-mono tracking-tighter text-white">{uptime}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono mb-1">Local_Node</p>
              <p className="text-sm font-bold text-slate-200">GB-LON-026</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 relative z-10">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest font-mono mb-2 text-center">Neural_Time</p>
              <p className="text-lg font-black text-center text-white font-mono">
                {systemTime.toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest font-mono mb-2 text-center">Atmospherics</p>
              {weather ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg font-black text-white font-mono">{weather.temp}°C</span>
                  <img src={`https://openweathermap.org/img/wn/${weather.icon}.png`} className="w-6 h-6 object-contain brightness-200" alt="" />
                </div>
              ) : (
                <p className="text-xs font-bold text-slate-500 text-center animate-pulse">SYNCING...</p>
              )}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6 relative z-10">
             <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
               <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest font-mono">Kernel_Optimised</span>
             </div>
             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono">v2.6.4_LTS</span>
          </div>
        </div>

        {/* SECTION: TRENDING SIGNALS */}
        {trendingPosts.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Trending_Signals</h4>
              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
            </div>
            <div className="space-y-4">
              {trendingPosts.map((post, idx) => (
                <div key={post.id} className="group relative flex gap-5 p-4 bg-white rounded-[2rem] border border-slate-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 cursor-pointer">
                  <div className="absolute -top-2 -left-2 w-7 h-7 bg-slate-900 text-white text-[10px] font-black flex items-center justify-center rounded-lg shadow-lg group-hover:bg-indigo-600 transition-colors">
                    {idx + 1}
                  </div>
                  <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-precision shadow-sm bg-slate-50">
                    {post.media?.[0]?.url ? (
                      <img src={post.media[0].url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-200 bg-slate-50"><ICONS.Explore /></div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center min-w-0 flex-1">
                    <p className="text-[13px] font-extrabold text-slate-900 leading-snug mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2 italic">
                      {post.content || "Neural Signal Entry..."}
                    </p>
                    <div className="flex items-center justify-between">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] font-mono">
                         {post.likes.toLocaleString('en-GB')} PULSES
                       </span>
                       <div className="flex -space-x-2">
                          <div className="w-5 h-5 rounded-full border-2 border-white bg-indigo-100" />
                          <div className="w-5 h-5 rounded-full border-2 border-white bg-slate-100" />
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION: ACTIVE GRID (CONTACTS) */}
        <div className="space-y-6">
           <div className="flex items-center justify-between px-2">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Neural_Mesh_Nodes</h4>
              <button className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-white rounded-xl transition-all"><ICONS.Search /></button>
           </div>

           <div className="space-y-1.5">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 animate-pulse bg-slate-50 rounded-2xl">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl" />
                    <div className="space-y-2 flex-1">
                      <div className="h-2 bg-slate-100 rounded w-1/2" />
                      <div className="h-1.5 bg-slate-100 rounded w-1/3" />
                    </div>
                  </div>
                ))
              ) : activeContacts.map(node => (
                <button 
                  key={node.id}
                  className="w-full flex items-center justify-between p-4 bg-white/50 hover:bg-white border border-transparent hover:border-precision rounded-[1.8rem] transition-all duration-300 group active:scale-95 hover:shadow-lg hover:shadow-slate-200/50"
                >
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="relative shrink-0">
                      <div className="p-1 bg-white rounded-2xl shadow-sm border border-slate-100 transition-transform group-hover:rotate-3">
                        <img src={node.avatarUrl} className="w-11 h-11 rounded-xl object-cover" alt="" />
                      </div>
                      <div className="absolute -bottom-1 -right-1">
                         <div className={`w-3.5 h-3.5 rounded-full border-[3px] border-white shadow-sm ${node.presenceStatus ? PRESENCE_DOTS[node.presenceStatus] : 'bg-slate-300'} ${node.presenceStatus === 'Online' ? 'animate-pulse' : ''}`} />
                      </div>
                    </div>
                    <div className="text-left overflow-hidden">
                       <p className="text-sm font-black text-slate-900 truncate tracking-tight group-hover:text-indigo-600 transition-colors">
                         {node.displayName}
                       </p>
                       <div className="flex items-center gap-1.5 mt-0.5">
                         <span className="text-[10px]">{node.statusEmoji || '⚡'}</span>
                         <p className="text-[10px] text-slate-400 font-bold truncate tracking-tight font-mono italic opacity-80">
                           {node.statusMessage || (node.presenceStatus ? node.presenceStatus.toUpperCase() : 'OFFLINE')}
                         </p>
                       </div>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <ICONS.Messages />
                  </div>
                </button>
              ))}
           </div>
           
           <button className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono hover:text-indigo-600 transition-colors bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 hover:border-indigo-200">
             Load_More_Nodes...
           </button>
        </div>

        {/* FOOTER MINI INFO */}
        <div className="px-2 pt-10 pb-4 border-t border-slate-100 flex flex-col gap-4">
           <div className="flex items-center gap-4">
             <div className="flex-1 h-px bg-slate-100" />
             <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] font-mono">Infrastructure</span>
             <div className="flex-1 h-px bg-slate-100" />
           </div>
           <p className="text-[9px] text-center text-slate-400 font-bold leading-relaxed px-4 opacity-60">
             VibeStream Node 2.6 Synchronisation Active. Local UK routing cluster operational via GB-LON-CENTRAL.
           </p>
        </div>
      </div>
    </aside>
  );
};
