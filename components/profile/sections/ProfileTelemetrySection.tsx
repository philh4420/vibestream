
import React, { useEffect, useState, useMemo } from 'react';
import { User, Post } from '../../../types';
import { db } from '../../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { collection, query, where, getDocs, orderBy, limit } = Firestore as any;
import { ICONS } from '../../../constants';

interface ProfileTelemetrySectionProps {
  userData: User;
}

// Internal SVG Line Chart Component
const TelemetryGraph = ({ data, color = "#10b981" }: { data: number[], color?: string }) => {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (val / max) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative h-32 w-full overflow-hidden">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        {/* Gradient Fill */}
        <defs>
          <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`M0,100 ${points} 100,100`} fill={`url(#grad-${color})`} stroke="none" />
        {/* Line */}
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

// Internal Gauge Component
const VelocityGauge = ({ value }: { value: number }) => {
  // Value 0-100
  const angle = (value / 100) * 180;
  return (
    <div className="relative w-40 h-20 overflow-hidden flex justify-center items-end">
      <div className="absolute w-36 h-36 rounded-full border-[12px] border-slate-200 dark:border-slate-800 border-b-0 border-l-0 border-r-0" style={{ transform: 'rotate(-90deg)' }} />
      <div 
        className="absolute w-36 h-36 rounded-full border-[12px] border-cyan-500 border-b-0 border-l-0 border-r-0 origin-center transition-transform duration-1000 ease-out"
        style={{ transform: `rotate(${angle - 180}deg)` }}
      />
      <div className="absolute bottom-0 text-center">
        <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{Math.round(value)}</span>
        <span className="block text-[8px] font-black uppercase tracking-widest text-slate-400">Velo</span>
      </div>
    </div>
  );
};

export const ProfileTelemetrySection: React.FC<ProfileTelemetrySectionProps> = ({ userData }) => {
  const [metrics, setMetrics] = useState<{
    totalLikes: number;
    totalComments: number;
    velocityScore: number;
    engagementTrend: number[];
    peakHour: number;
    geoData: Record<string, number>;
  }>({
    totalLikes: 0,
    totalComments: 0,
    velocityScore: 0,
    engagementTrend: [] as number[],
    peakHour: 0,
    geoData: { 'US': 35, 'EU': 45, 'ASIA': 20 } // Simulated for demo, can be derived if location data exists
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !userData.id) return;

    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'posts'), where('authorId', '==', userData.id), orderBy('timestamp', 'desc'), limit(50));
        const snap = await getDocs(q);
        const posts = snap.docs.map((d: any) => d.data() as Post);

        let likes = 0;
        let comments = 0;
        const trendData: number[] = [];
        const hours: Record<number, number> = {};

        posts.forEach(p => {
          likes += p.likes || 0;
          comments += p.comments || 0;
          trendData.push((p.likes || 0) + (p.comments || 0));
          
          if (p.timestamp?.toDate) {
            const h = p.timestamp.toDate().getHours();
            hours[h] = (hours[h] || 0) + 1;
          }
        });

        // Peak Hour
        const peakHour = Object.keys(hours).reduce((maxH, currHStr) => {
            const currH = parseInt(currHStr);
            return (hours[currH] || 0) > (hours[maxH] || 0) ? currH : maxH;
        }, 12);

        // Velocity Calc: Average interactions per post over last 10 posts, normalized to 0-100 scale (assuming 100 interax is high)
        const recentPosts = posts.slice(0, 10);
        const recentInteractions = recentPosts.reduce((acc, p) => acc + (p.likes || 0) + (p.comments || 0), 0);
        const avgInteractions = recentPosts.length ? recentInteractions / recentPosts.length : 0;
        const velocity = Math.min(100, Math.round((avgInteractions / 50) * 100)); // 50 interactions avg = 100% velocity

        setMetrics({
          totalLikes: likes,
          totalComments: comments,
          velocityScore: velocity,
          engagementTrend: trendData.reverse(), // Oldest to newest
          peakHour,
          geoData: { 'US': 30, 'GB': 40, 'JP': 20, 'DE': 10 } // Mock
        });

      } catch (e) {
        console.error("Telemetry sync error", e);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [userData.id]);

  const StatCard = ({ label, value, sub, icon, color }: any) => (
    <div className={`p-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:border-${color}-500 transition-colors`}>
      <div className={`absolute top-0 right-0 p-4 opacity-10 text-${color}-500`}>{icon}</div>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1 font-mono">{label}</p>
      <h3 className="text-3xl font-black italic tracking-tighter text-slate-900 dark:text-white">{value}</h3>
      <p className={`text-[9px] font-bold text-${color}-500 mt-2`}>{sub}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
        {[1,2,3].map(i => <div key={i} className="h-40 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem]" />)}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 max-w-[2560px] mx-auto">
      
      {/* 1. Header */}
      <div className="bg-slate-950 dark:bg-black rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden border border-white/10 flex flex-col md:flex-row justify-between items-center gap-8">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/20 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3" />
         
         <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-cyan-900/50 rounded-xl border border-cyan-500/30 text-cyan-400">
                  <ICONS.Telemetry />
               </div>
               <span className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.3em] font-mono">Personal_Telemetry</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-none">
              Signal_Analysis
            </h1>
            <p className="text-xs font-medium text-slate-400 max-w-sm">
              Real-time diagnostic of your neural footprint on the grid. Data is updated every sync cycle.
            </p>
         </div>

         <div className="relative z-10 flex gap-4">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-6 flex flex-col items-center min-w-[140px]">
               <VelocityGauge value={metrics.velocityScore} />
               <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-2">Broadcast Velocity</p>
            </div>
         </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         <StatCard 
           label="Total Resonance" 
           value={metrics.totalLikes} 
           sub="Cumulative Likes" 
           color="rose" 
           icon={<svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>} 
         />
         <StatCard 
           label="Echo Volume" 
           value={metrics.totalComments} 
           sub="Total Replies" 
           color="indigo" 
           icon={<ICONS.Messages />} 
         />
         <StatCard 
           label="Peak Hour" 
           value={`${metrics.peakHour}:00`} 
           sub="Optimal Post Time" 
           color="amber" 
           icon={<ICONS.Temporal />} 
         />
         <StatCard 
           label="Network Reach" 
           value={userData.followers} 
           sub="Active Nodes" 
           color="emerald" 
           icon={<ICONS.Clusters />} 
         />
      </div>

      {/* 3. Deep Dive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Engagement Graph */}
         <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[3rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-8">
               <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Engagement_Flow</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Last 50 Transmissions</p>
               </div>
               <div className="flex gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">LIVE_FEED</span>
               </div>
            </div>
            <TelemetryGraph data={metrics.engagementTrend} color="#10b981" />
         </div>

         {/* Audience Geo Map (Simulated Visual) */}
         <div className="bg-slate-900 dark:bg-black rounded-[3rem] p-8 border border-slate-800 shadow-lg relative overflow-hidden text-white">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay" />
            <h3 className="text-lg font-black uppercase italic tracking-tight mb-6 relative z-10">Geo_Distribution</h3>
            
            <div className="space-y-4 relative z-10">
               {Object.entries(metrics.geoData).map(([region, val], idx) => (
                 <div key={region} className="flex items-center gap-3">
                    <span className="text-[9px] font-mono font-bold text-slate-500 w-8">{region}</span>
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                       <div 
                         className={`h-full rounded-full ${idx === 0 ? 'bg-indigo-500' : idx === 1 ? 'bg-purple-500' : 'bg-slate-600'}`} 
                         style={{ width: `${val}%` }} 
                       />
                    </div>
                    <span className="text-[9px] font-mono font-bold text-slate-300">{val}%</span>
                 </div>
               ))}
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
               <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">Global Node Density</p>
            </div>
         </div>
      </div>

    </div>
  );
};
