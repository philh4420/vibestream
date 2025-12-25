
import React from 'react';
import { ICONS } from '../../constants';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue: string;
  icon: React.FC;
  trend: string;
  trendType: 'up' | 'down';
  color: 'indigo' | 'rose' | 'emerald' | 'amber';
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, subValue, icon: Icon, trend, trendType, color }) => {
  const colorMap = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800',
    rose: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800'
  };

  const bgGlowMap = {
    indigo: 'bg-indigo-500',
    rose: 'bg-rose-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500'
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl hover:border-white dark:hover:border-slate-700 transition-all duration-500 group relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 ${bgGlowMap[color]}`} />
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center text-xl transition-transform duration-500 group-hover:scale-110 ${colorMap[color]} border`}>
            <Icon />
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${trendType === 'up' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
            <span className="text-[9px] font-black font-mono">
              {trendType === 'up' ? '▲' : '▼'} {trend}
            </span>
          </div>
        </div>

        <div>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic leading-none mb-1">{value}</h3>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
          <p className="text-[9px] font-mono text-slate-300 dark:text-slate-600 mt-2">{subValue}</p>
        </div>
      </div>
    </div>
  );
};

interface AdminOverviewProps {
  metrics: { users: number; posts: number; uptime: string };
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ metrics }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* 1. Main Telemetry Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 dark:bg-black rounded-[3rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden border border-white/5 dark:border-slate-800 flex flex-col justify-between min-h-[360px]">
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3" />
           <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-rose-500/10 blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3" />
           
           <div className="relative z-10 flex justify-between items-start">
              <div>
                 <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 mb-4">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
                    <span className="text-[9px] font-black text-white uppercase tracking-[0.3em] font-mono">System_Nominal</span>
                 </div>
                 <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase leading-none text-white">
                   Grid_Telemetry
                 </h2>
              </div>
              <div className="text-right hidden sm:block">
                 <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Server_Time</p>
                 <p className="text-xl font-black font-mono text-white">{new Date().toLocaleTimeString('en-GB')}</p>
              </div>
           </div>

           {/* Visualizer Bars */}
           <div className="relative z-10 flex items-end gap-1 h-32 mt-auto opacity-80">
              {Array.from({ length: 40 }).map((_, i) => (
                <div 
                  key={i} 
                  className="flex-1 bg-indigo-500/30 rounded-t-sm hover:bg-indigo-400 transition-colors"
                  style={{ 
                    height: `${Math.max(10, Math.random() * 100)}%`,
                    transition: 'height 1s ease-in-out'
                  }} 
                />
              ))}
           </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-8 shadow-sm flex flex-col justify-between relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-10 text-slate-900 dark:text-white">
              <ICONS.Verified />
           </div>
           
           <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2">Security_Index</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Threat detection systems operating at maximum efficiency.</p>
           </div>

           <div className="flex items-center justify-center py-8">
              <div className="relative w-40 h-40 flex items-center justify-center">
                 <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="8" />
                    <circle 
                      cx="50" cy="50" r="45" fill="none" stroke="#10b981" strokeWidth="8" 
                      strokeDasharray="283" 
                      strokeDashoffset="20"
                      strokeLinecap="round"
                      className="animate-[spin_4s_ease-out_reverse]"
                    />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">98<span className="text-lg text-slate-400 dark:text-slate-600">%</span></span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 font-mono">Secure</span>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* 2. Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          label="Total Population" 
          value={metrics.users} 
          subValue="Active Neural Nodes" 
          icon={ICONS.Profile} 
          trend="12%" 
          trendType="up"
          color="indigo" 
        />
        <MetricCard 
          label="Signal Volume" 
          value={metrics.posts} 
          subValue="Broadcast Packets" 
          icon={ICONS.Explore} 
          trend="8.5%" 
          trendType="up"
          color="rose" 
        />
        <MetricCard 
          label="Grid Stability" 
          value={metrics.uptime} 
          subValue="Uptime Percentage" 
          icon={ICONS.Temporal} 
          trend="0.01%" 
          trendType="up"
          color="emerald" 
        />
        <MetricCard 
          label="Pending Alerts" 
          value="3" 
          subValue="Requires Attention" 
          icon={ICONS.Bell} 
          trend="2" 
          trendType="down"
          color="amber" 
        />
      </div>
    </div>
  );
};
