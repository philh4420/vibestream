
import React from 'react';
import { ICONS } from '../../constants';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue: string;
  icon: React.FC;
  trend: string;
  trendType: 'up' | 'down';
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, subValue, icon: Icon, trend, trendType }) => {
  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-lg hover:border-slate-200 transition-all duration-500 group flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-slate-950 group-hover:text-white transition-all duration-500 scale-90">
          <Icon />
        </div>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg ${trendType === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          <span className="text-[9px] font-black font-mono">
            {trendType === 'up' ? '▲' : '▼'} {trend}
          </span>
        </div>
      </div>

      <div>
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1">{label}</p>
        <h3 className="text-2xl font-black text-slate-950 tracking-tighter italic font-mono leading-none mb-1">{value}</h3>
        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none opacity-80">{subValue}</p>
      </div>

      <div className="mt-6 flex gap-0.5 h-1 items-end opacity-20 group-hover:opacity-100 transition-opacity duration-700">
        {Array.from({ length: 24 }).map((_, i) => (
          <div 
            key={i} 
            className={`flex-1 rounded-full ${i > 18 ? (trendType === 'up' ? 'bg-indigo-600' : 'bg-rose-600') : 'bg-slate-200'}`}
            style={{ height: `${Math.random() * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
};

const HealthNode = ({ label, status }: { label: string; status: 'nominal' | 'warning' | 'critical' }) => (
  <div className="flex items-center justify-between p-3.5 bg-slate-50/40 border border-slate-100/50 rounded-2xl group hover:bg-white hover:shadow-md transition-all duration-300">
    <div className="flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full shadow-sm ${status === 'nominal' ? 'bg-emerald-500 animate-pulse' : status === 'warning' ? 'bg-amber-500' : 'bg-rose-500'}`} />
      <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest font-mono">{label}</span>
    </div>
    <span className="text-[8px] font-black text-slate-300 font-mono tracking-widest">{status.toUpperCase()}</span>
  </div>
);

interface AdminOverviewProps {
  metrics: { users: number; posts: number; uptime: string };
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-700">
      
      {/* Top row: Core metrics */}
      <div className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <MetricCard label="INHABITANTS" value={metrics.users} subValue="NEURAL_NODES" icon={ICONS.Profile} trend="4.2%" trendType="up" />
        <MetricCard label="SIGNALS" value={metrics.posts} subValue="PACKET_BROADCAST" icon={ICONS.Explore} trend="12.1%" trendType="up" />
        <MetricCard label="UPTIME" value={metrics.uptime} subValue="GRID_PERSISTENCE" icon={ICONS.Temporal} trend="0.01%" trendType="up" />
        <MetricCard label="SECURITY" value="99.9" subValue="INTEGRITY_SCORE" icon={ICONS.Verified} trend="0.2%" trendType="up" />
      </div>

      {/* Main Telemetry Panel */}
      <div className="lg:col-span-8 bg-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white shadow-xl relative overflow-hidden flex flex-col min-h-[450px] border border-white/5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10 mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="px-2.5 py-1 bg-indigo-500/20 rounded-lg border border-indigo-500/20 text-[9px] font-black font-mono tracking-widest text-indigo-300 uppercase">TELEMETRY_LIVE</div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono italic">SYNC: NOMINAL</span>
            </div>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-none mb-4 text-white">
            NEURAL_FLOW_GRID
          </h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono leading-relaxed max-w-md">
            REAL-TIME DATA THROUGHPUT ACROSS ALL REGISTERED INFRASTRUCTURE RELAY NODES.
          </p>
        </div>

        <div className="flex-1 flex items-end gap-1 relative z-10 opacity-50 hover:opacity-100 transition-opacity duration-700">
          {Array.from({ length: 48 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col gap-0.5 items-center group">
              <div 
                className="w-full bg-indigo-500/20 rounded-t-sm group-hover:bg-indigo-400 transition-all duration-300" 
                style={{ height: `${Math.random() * 60 + 5}%` }} 
              />
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center relative z-10">
          <div className="flex gap-10">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest font-mono mb-1">TRAFFIC</span>
              <span className="text-xl font-black font-mono text-white italic">8.2 GB/s</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest font-mono mb-1">LATENCY</span>
              <span className="text-xl font-black font-mono text-white italic">14ms</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest font-mono mb-1">CITADEL_CORE</p>
            <p className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest font-black">v5.2.LTS</p>
          </div>
        </div>
      </div>

      {/* Grid Health Status */}
      <div className="lg:col-span-4 bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm flex flex-col">
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-xl font-black text-slate-950 tracking-tighter uppercase italic">GRID_DIAGNOSTICS</h3>
          <div className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[8px] font-black font-mono uppercase border border-emerald-100">ALL_SAFE</div>
        </div>
        
        <div className="space-y-3 flex-1">
          <HealthNode label="AUTH_CENTRAL" status="nominal" />
          <HealthNode label="SIGNAL_GRID" status="nominal" />
          <HealthNode label="MEDIA_STORAGE" status="nominal" />
          <HealthNode label="COMMS_CHANNEL" status="nominal" />
          <HealthNode label="ADMIN_GATEWAY" status="warning" />
          <HealthNode label="LOCALISATION_GB" status="nominal" />
        </div>

        <button className="mt-8 w-full py-4 bg-slate-950 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl">
          FULL_SYSTEM_AUDIT
        </button>
      </div>
    </div>
  );
};
