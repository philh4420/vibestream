
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
    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all duration-500 group flex flex-col min-h-[220px]">
      <div className="flex justify-between items-start mb-6">
        <div className="w-9 h-9 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-slate-950 group-hover:text-white transition-all duration-500 scale-90">
          <Icon />
        </div>
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg ${trendType === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          <span className="text-[8px] font-black font-mono tracking-tighter">
            {trendType === 'up' ? '▲' : '▼'} {trend}
          </span>
        </div>
      </div>

      <div className="flex-1">
        <p className="text-[7px] font-black text-slate-300 uppercase tracking-[0.45em] font-mono mb-2">{label}</p>
        <h3 className="text-3xl font-black text-slate-950 tracking-tighter italic font-mono leading-none mb-1.5">{value}</h3>
        <p className="text-[7px] font-bold text-slate-400 uppercase tracking-[0.15em] leading-none opacity-80">{subValue}</p>
      </div>

      <div className="mt-8 flex gap-0.5 h-1 items-end opacity-20 group-hover:opacity-100 transition-opacity duration-700">
        {Array.from({ length: 32 }).map((_, i) => {
          const height = Math.random() * 100;
          return (
            <div 
              key={i} 
              className={`flex-1 rounded-full ${i > 25 ? (trendType === 'up' ? 'bg-indigo-600' : 'bg-rose-600') : 'bg-slate-200'}`}
              style={{ height: `${height}%` }}
            />
          );
        })}
      </div>
    </div>
  );
};

const HealthNode = ({ label, nodeId }: { label: string; nodeId: string }) => (
  <div className="flex items-center justify-between p-4 bg-slate-50/40 border border-slate-100/50 rounded-2xl group hover:bg-white hover:shadow-md transition-all duration-300">
    <div className="flex items-center gap-3">
      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
      <span className="text-[9px] font-black text-slate-900 uppercase tracking-[0.25em] font-mono">{label}</span>
    </div>
    <span className="text-[7px] font-black text-slate-300 font-mono tracking-widest">{nodeId}</span>
  </div>
);

interface AdminOverviewProps {
  metrics: { users: number; posts: number; uptime: string };
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 1. TOP METRICS GRID (4 Columns) */}
      <div className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <MetricCard 
          label="GLOBAL_INHABITANT" 
          value={metrics.users} 
          subValue="VERIFIED_NEURAL_NODES" 
          icon={ICONS.Profile} 
          trend="12.5%" 
          trendType="up"
        />
        <MetricCard 
          label="SIGNAL_THROUGHPUT" 
          value={metrics.posts} 
          subValue="TOTAL_PACKETS_BROADCAST" 
          icon={ICONS.Explore} 
          trend="08.2%" 
          trendType="up"
        />
        <MetricCard 
          label="GRID_STABILITY" 
          value={metrics.uptime} 
          subValue="LTS_PERSISTENCE_CLOCK" 
          icon={ICONS.Admin} 
          trend="00.1%" 
          trendType="down"
        />
        <MetricCard 
          label="SECURITY_INDEX" 
          value="99.9" 
          subValue="PACKET_INTEGRITY_SCORE" 
          icon={ICONS.Verified} 
          trend="01.4%" 
          trendType="up"
        />
      </div>

      {/* 2. NEURAL FLOW BUFFER (Tactical Telemetry) */}
      <div className="lg:col-span-8 bg-[#0a0f1d] rounded-[3.5rem] p-10 md:p-14 text-white shadow-3xl relative overflow-hidden flex flex-col min-h-[550px] border border-white/5">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10 mb-14">
          <div className="flex items-center gap-4 mb-8">
            <div className="px-3.5 py-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-[8px] font-black font-mono tracking-[0.3em] text-indigo-400 uppercase">LIVE_TELEMETRY</div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] font-mono italic">SYNC_STATUS: NOMINAL</span>
            </div>
          </div>
          
          <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none mb-6">
            NEURAL_FLOW_BUFFER
          </h2>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.6em] font-mono leading-relaxed max-w-lg">
            REAL-TIME PACKET DISTRIBUTION ACROSS GB-LON-026 INFRASTRUCTURE RELAY NODES
          </p>
        </div>

        {/* Tactical Waveform Visualisation */}
        <div className="flex-1 flex items-end gap-1 relative z-10 opacity-60 group hover:opacity-100 transition-opacity duration-1000">
          {Array.from({ length: 72 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col gap-0.5 items-center group/bar">
              <div 
                className="w-full bg-indigo-500/10 rounded-t-sm transition-all duration-700 group-hover/bar:bg-indigo-400/30" 
                style={{ height: `${Math.random() * 40 + 5}%` }} 
              />
              <div 
                className="w-full bg-indigo-600 rounded-t-sm transition-all duration-500 group-hover/bar:bg-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.3)]" 
                style={{ height: `${Math.random() * 30 + 10}%` }} 
              />
            </div>
          ))}
        </div>

        <div className="mt-12 pt-10 border-t border-white/5 flex justify-between items-center relative z-10">
          <div className="flex gap-16">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] font-mono mb-2">EGRESS_TRAFFIC</span>
              <span className="text-2xl font-black font-mono text-white italic tracking-tighter">14.2 GB/s</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] font-mono mb-2">NEURAL_LATENCY</span>
              <span className="text-2xl font-black font-mono text-white italic tracking-tighter">4.2 MS</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.5em] font-mono mb-2">KERNEL_AUTH_ID</p>
            <p className="text-[10px] font-mono text-indigo-500/60 uppercase tracking-widest font-black">CITADEL_V5.2_X64</p>
          </div>
        </div>
      </div>

      {/* 3. GRID HEALTH (Bento Sidebar) */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        <div className="bg-white border border-slate-100 rounded-[3.5rem] p-10 shadow-sm flex flex-col h-full hover:shadow-xl transition-all duration-500">
          <div className="flex justify-between items-center mb-12">
            <h3 className="text-2xl font-black text-slate-950 tracking-tighter uppercase italic leading-none">GRID_HEALTH</h3>
            <div className="px-3.5 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[8px] font-black font-mono uppercase tracking-[0.2em] border border-emerald-100 shadow-sm">ALL_NOMINAL</div>
          </div>
          
          <div className="space-y-4 flex-1">
            <HealthNode label="CENTRAL_UPLINK" nodeId="OS_NODE_08" />
            <HealthNode label="NEURAL_DATABASE" nodeId="OS_NODE_06" />
            <HealthNode label="MEDIA_RELAY" nodeId="OS_NODE_02" />
            <HealthNode label="NEURAL_COMMS" nodeId="OS_NODE_04" />
            <HealthNode label="SECURITY_CITADEL" nodeId="OS_NODE_01" />
          </div>

          <button className="mt-12 w-full py-5 bg-slate-950 text-white rounded-[1.8rem] font-black text-[9px] uppercase tracking-[0.4em] hover:bg-black transition-all active:scale-95 shadow-2xl shadow-slate-200">
            GENERATE_STATUS_REPORT
          </button>
        </div>
      </div>

    </div>
  );
};
