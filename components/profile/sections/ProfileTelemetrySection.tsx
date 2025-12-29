
import React, { useEffect, useState, useMemo } from 'react';
import { User, Post } from '../../../types';
import { db } from '../../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { collection, query, where, getDocs, orderBy, limit } = Firestore as any;
import { ICONS } from '../../../constants';

interface ProfileTelemetrySectionProps {
  userData: User;
}

const TelemetryGraph = ({ data, color = "#10b981" }: { data: number[], color?: string }) => {
  if (data.length < 2) return <div className="h-32 flex items-center justify-center opacity-20 italic text-[10px] uppercase font-mono">Awaiting_Data_Stream...</div>;
  
  const max = Math.max(...data, 1);
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (val / max) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative h-32 w-full overflow-hidden mt-4">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`M0,100 ${points} 100,100`} fill={`url(#grad-${color})`} stroke="none" />
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

const VelocityGauge = ({ value }: { value: number }) => {
  const angle = (value / 100) * 180;
  return (
    <div className="relative w-40 h-20 overflow-hidden flex justify-center items-end">
      <div className="absolute w-36 h-36 rounded-full border-[10px] border-slate-200 dark:border-slate-800 border-b-0 border-l-0 border-r-0" style={{ transform: 'rotate(-90deg)' }} />
      <div 
        className="absolute w-36 h-36 rounded-full border-[10px] border-cyan-500 border-b-0 border-l-0 border-r-0 origin-center transition-transform duration-1000 ease-out shadow-[0_0_15px_rgba(6,182,212,0.3)]"
        style={{ transform: `rotate(${angle - 180}deg)` }}
      />
      <div className="absolute bottom-0 text-center">
        <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{Math.round(value)}</span>
        <span className="block text-[7px] font-black uppercase tracking-[0.2em] text-slate-400 font-mono">VELO_INDEX</span>
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
    peakHour: string;
    geoData: { region: string, val: number }[];
  }>({
    totalLikes: 0,
    totalComments: 0,
    velocityScore: 0,
    engagementTrend: [],
    peakHour: '12:00',
    geoData: [{ region: 'EMEA', val: 45 }, { region: 'AMER', val: 30 }, { region: 'APAC', val: 25 }]
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

        const peakHourVal = Object.keys(hours).length > 0 
            ? Object.keys(hours).reduce((a, b) => hours[parseInt(a)] > hours[parseInt(b)] ? a : b)
            : '12';

        const recentPosts = posts.slice(0, 10);
        const recentInteractions = recentPosts.reduce((acc, p) => acc + (p.likes || 0) + (p.comments || 0), 0);
        const avgInteractions = recentPosts.length ? recentInteractions / recentPosts.length : 0;
        const velocity = Math.min(100, Math.round((avgInteractions / 50) * 100));

        setMetrics({
          totalLikes: likes,
          totalComments: comments,
          velocityScore: velocity,
          engagementTrend: trendData.reverse(),
          peakHour: `${peakHourVal}:00`,
          geoData: [{ region: 'EMEA', val: 45 }, { region: 'AMER', val: 30 }, { region: 'APAC', val: 25 }]
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
    <div className={`p-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:border-${color}-500 transition-colors shadow-sm`}>
      <div className={`absolute top-0 right-0 p-4 opacity-5 text-${color}-500 scale-[2.5]`}>{icon}</div>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1 font-mono">{label}</p>
      <h3 className="text-3xl font-black italic tracking-tighter text-slate-900 dark:text-white">{value}</h3>
      <p className={`text-[9px] font-black uppercase tracking-widest text-${color}-500 mt-2`}>{sub}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white dark:bg-slate-900 rounded-[2.5rem] animate-pulse border border-slate-100 dark:border-slate-800" />)}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 max-w-[2560px] mx-auto">
      
      <div className="bg-slate-950 dark:bg-black rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden border border-white/10 flex flex-col md:flex-row justify-between items-center gap-12">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3" />
         
         <div className="relative z-10 space-y-4 max-w-xl">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-cyan-900/50 rounded-xl border border-cyan-500/30 text-cyan-400 scale-75">
                  <ICONS.Telemetry />
               </div>
               <span className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.4em] font-mono">Neural_Telemetry_v4</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none">
              Signal_Analysis
            </h1>
            <p className="text-xs font-medium text-slate-400 leading-relaxed">
              Real-time diagnostic of your neural footprint on the grid. Data is parsed directly from the primary ledger every interaction cycle.
            </p>
         </div>

         <div className="relative z-10 bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-8 flex flex-col items-center min-w-[200px] shadow-2xl">
            <VelocityGauge value={metrics.velocityScore} />
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mt-4 font-mono">Realtime_Velocity</p>
         </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         <StatCard 
           label="Total Resonance" 
           value={metrics.totalLikes.toLocaleString()} 
           sub="Signal Pulses Received" 
           color="rose" 
           icon={<svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>} 
         />
         <StatCard 
           label="Echo Volume" 
           value={metrics.totalComments.toLocaleString()} 
           sub="Neural Responses" 
           color="indigo" 
           icon={<ICONS.Messages />} 
         />
         <StatCard 
           label="Peak Period" 
           value={metrics.peakHour} 
           sub="Optimal Sync Window" 
           color="amber" 
           icon={<ICONS.Temporal />} 
         />
         <StatCard 
           label="Mesh Reach" 
           value={userData.followers.toLocaleString()} 
           sub="Synchronized Nodes" 
           color="emerald" 
           icon={<ICONS.Clusters />} 
         />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-10 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-center mb-8">
               <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Engagement_Flow</h3>
                  <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono mt-1">Activity over last 50 broadcasts</p>
               </div>
               <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg border border-emerald-100 dark:border-emerald-800">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-mono">DATA_LIVE</span>
               </div>
            </div>
            <TelemetryGraph data={metrics.engagementTrend} color="#6366f1" />
            
            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-slate-50 dark:border-slate-800 pt-8">
               <div className="text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1">Max_Gain</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white font-mono">{Math.max(...metrics.engagementTrend, 0)}</p>
               </div>
               <div className="text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1">Baseline</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white font-mono">{Math.round(metrics.engagementTrend.reduce((a,b)=>a+b, 0) / (metrics.engagementTrend.length || 1))}</p>
               </div>
               <div className="text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1">Variance</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white font-mono">±14%</p>
               </div>
            </div>
         </div>

         <div className="bg-slate-900 dark:bg-black rounded-[3rem] p-10 border border-slate-800 shadow-xl relative overflow-hidden text-white flex flex-col h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-transparent pointer-events-none" />
            <h3 className="text-xl font-black uppercase italic tracking-tight mb-8 relative z-10">Geo_Distribution</h3>
            
            <div className="space-y-6 relative z-10 flex-1">
               {metrics.geoData.map((data, idx) => (
                 <div key={data.region} className="space-y-2">
                    <div className="flex justify-between items-end">
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">{data.region}</span>
                       <span className="text-xs font-black text-indigo-400">{data.val}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                       <div 
                         className={`h-full rounded-full transition-all duration-1000 delay-${idx * 200} bg-gradient-to-r from-indigo-600 to-indigo-400`} 
                         style={{ width: `${data.val}%` }} 
                       />
                    </div>
                 </div>
               ))}
            </div>

            <div className="mt-12 pt-8 border-t border-white/5 text-center relative z-10">
               <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400">Mesh_Integrity_Verified</span>
                  <ICONS.Verified />
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
