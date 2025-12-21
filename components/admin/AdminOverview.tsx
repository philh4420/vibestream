
import React from 'react';
import { ICONS } from '../../constants';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue: string;
  icon: React.FC;
  trend: string;
  color: 'indigo' | 'emerald' | 'rose' | 'amber';
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, subValue, icon: Icon, trend, color }) => {
  return (
    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all duration-500 group flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
          <Icon />
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-lg">
          <span className="text-[7px] font-black text-emerald-600 font-mono tracking-tighter">▲ 12.5%</span>
        </div>
      </div>

      <div className="flex-1">
        <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em] font-mono mb-2">{label}</p>
        <h3 className="text-4xl font-black text-slate-950 tracking-tighter italic font-mono leading-none mb-1">{value}</h3>
        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{subValue}</p>
      </div>

      <div className="mt-8 flex gap-0.5 h-1.5 items-end opacity-40 group-hover:opacity-100 transition-opacity">
        {Array.from({ length: 28 }).map((_, i) => (
          <div 
            key={i} 
            className={`flex-1 rounded-full ${i > 20 ? 'bg-indigo-600' : 'bg-slate-200'}`}
            style={{ height: `${Math.random() * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
};

const HealthNode = ({ label, nodeId }: { label: string; nodeId: string }) => (
  <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl group hover:bg-white hover:shadow-md transition-all">
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
      <span className="text-[9px] font-black text-slate-950 uppercase tracking-[0.2em] font-mono">{label}</span>
    </div>
    <span className="text-[7px] font-black text-slate-300 font-mono tracking-widest">{nodeId}</span>
  </div>
);

interface AdminOverviewProps {
  metrics: { users: number; posts: number; uptime: string };
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-full">
      
      {/* 1. TOP METRICS GRID */}
      <div className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <MetricCard label="GLOBAL_INHABITANT" value={metrics.users} subValue="VERIFIED_NEURAL_NODES" icon={ICONS.Profile} trend="12.5%" color="indigo" />
        <MetricCard label="SIGNAL_THROUGHPUT" value={metrics.posts} subValue="TOTAL_PACKETS_BROADCAST" icon={ICONS.Explore} trend="12.5%" color="emerald" />
        <MetricCard label="GRID_STABILITY" value={metrics.uptime} subValue="LTS_PERSISTENCE_CLOCK" icon={ICONS.Admin} trend="12.5%" color="amber" />
        <MetricCard label="SECURITY_INDEX" value="99.9" subValue="PACKET_INTEGRITY_SCORE" icon={ICONS.Verified} trend="12.5%" color="indigo" />
      </div>

      {/* 2. MAIN VISUALISATION */}
      <div className="lg:col-span-8 bg-[#0a0f1d] rounded-[3.5rem] p-8 md:p-12 text-white shadow-3xl relative overflow-hidden flex flex-col min-h-[500px] border border-white/5">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/5 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="px-3 py-1 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-[8px] font-black font-mono tracking-[0.2em] text-indigo-400 uppercase">LIVE_TELEMETRY</div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] font-mono italic">SYNC_STATUS: NOMINAL</span>
            </div>
          </div>
          
          <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none mb-4">
            NEURAL_FLOW_BUFFER
          </h2>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.5em] font-mono leading-relaxed">
            REAL-TIME PACKET DISTRIBUTION ACROSS GB-LON-026 INFRASTRUCTURE
          </p>
        </div>

        <div className="flex-1 flex items-end gap-1 relative z-10 group opacity-40 hover:opacity-100 transition-opacity duration-700">
          {Array.from({ length: 80 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col gap-0.5 items-center group/bar">
              <div 
                className="w-full bg-indigo-500/20 rounded-t-sm transition-all duration-500 group-hover/bar:bg-indigo-400/40" 
                style={{ height: `${Math.random() * 50 + 10}%` }} 
              />
              <div 
                className="w-full bg-indigo-600 rounded-t-sm transition-all duration-300 group-hover/bar:bg-indigo-400 shadow-[0_0_10px_rgba(79,70,229,0.2)]" 
                style={{ height: `${Math.random() * 20 + 5}%` }} 
              />
            </div>
          ))}
        </div>

        <div className="mt-10 pt-8 border-t border-white/5 flex justify-between items-center relative z-10">
          <div className="flex gap-12">
            <div className="flex flex-col">
              <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest font-mono mb-1">EGRESS_TRAFFIC</span>
              <span className="text-xl font-black font-mono text-white italic tracking-tighter">14.2 GB/s</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest font-mono mb-1">NEURAL_LATENCY</span>
              <span className="text-xl font-black font-mono text-white italic tracking-tighter">4.2 MS</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.4em] font-mono mb-1">KERNEL_AUTH_ID</p>
            <p className="text-[9px] font-mono text-indigo-500/50 uppercase tracking-widest">CITADEL_V5.2</p>
          </div>
        </div>
      </div>

      {/* 3. SIDEBAR BENTO */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        <div className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-sm flex flex-col h-full">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-2xl font-black text-slate-950 tracking-tighter uppercase italic leading-none">GRID_HEALTH</h3>
            <div className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[8px] font-black font-mono uppercase tracking-widest border border-emerald-100">ALL_NOMINAL</div>
          </div>
          
          <div className="space-y-3 flex-1">
            <HealthNode label="CENTRAL_UPLINK" nodeId="OS_NODE_08" />
            <HealthNode label="NEURAL_DATABASE" nodeId="OS_NODE_06" />
            <HealthNode label="MEDIA_RELAY" nodeId="OS_NODE_02" />
            <HealthNode label="NEURAL_COMMS" nodeId="OS_NODE_04" />
            <HealthNode label="SECURITY_CITADEL" nodeId="OS_NODE_01" />
          </div>

          <button className="mt-10 w-full py-4 bg-slate-950 text-white rounded-2xl font-black text-[9px] uppercase tracking-[0.3em] hover:bg-black transition-all active:scale-95 shadow-xl">
            PERFORMANCE_REPORT
          </button>
        </div>
      </div>

    </div>
  );
};
