
import React from 'react';
import { ICONS } from '../../constants';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue: string;
  icon: React.FC;
  trend: 'up' | 'down' | 'stable';
  color: 'indigo' | 'emerald' | 'rose' | 'amber';
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, subValue, icon: Icon, trend, color }) => {
  const colorClasses = {
    indigo: 'from-indigo-500/10 to-transparent border-indigo-500/20 text-indigo-400',
    emerald: 'from-emerald-500/10 to-transparent border-emerald-500/20 text-emerald-400',
    rose: 'from-rose-500/10 to-transparent border-rose-500/20 text-rose-400',
    amber: 'from-amber-500/10 to-transparent border-amber-500/20 text-amber-400',
  };

  return (
    <div className={`relative overflow-hidden bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all duration-500 group`}>
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorClasses[color]} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 group-hover:rotate-6">
          <Icon />
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black font-mono tracking-widest ${trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {trend === 'up' ? '▲' : '▼'} 12.5%
        </div>
      </div>

      <div className="relative z-10">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mb-2">{label}</p>
        <h3 className="text-4xl font-black text-slate-950 tracking-tighter italic font-mono mb-1">{value}</h3>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{subValue}</p>
      </div>

      <div className="mt-8 flex gap-1 h-1 items-end relative z-10">
        {Array.from({ length: 24 }).map((_, i) => (
          <div 
            key={i} 
            className={`flex-1 rounded-full transition-all duration-500 ${i > 15 ? 'bg-indigo-500' : 'bg-slate-100'}`}
            style={{ height: `${Math.random() * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
};

const HealthNode = ({ label, status }: { label: string; status: 'nominal' | 'degraded' | 'critical' }) => (
  <div className="flex items-center justify-between p-5 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-white hover:shadow-md transition-all">
    <div className="flex items-center gap-4">
      <div className={`w-2.5 h-2.5 rounded-full ${status === 'nominal' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : status === 'degraded' ? 'bg-amber-500' : 'bg-rose-500'} animate-pulse`} />
      <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-mono">{label}</span>
    </div>
    <span className="text-[8px] font-black text-slate-300 font-mono tracking-widest group-hover:text-indigo-500 transition-colors">OS_NODE_0{Math.floor(Math.random() * 9)}</span>
  </div>
);

interface AdminOverviewProps {
  metrics: { users: number; posts: number; uptime: string };
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[3840px] mx-auto">
      
      {/* 1. TOP METRICS GRID (4 COLUMNS ON XL) */}
      <div className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8">
        <MetricCard label="Global_Inhabitants" value={metrics.users.toLocaleString('en-GB')} subValue="Verified_Neural_Nodes" icon={ICONS.Profile} trend="up" color="indigo" />
        <MetricCard label="Signal_Throughput" value={metrics.posts.toLocaleString('en-GB')} subValue="Total_Packets_Broadcast" icon={ICONS.Explore} trend="up" color="emerald" />
        <MetricCard label="Grid_Stability" value={metrics.uptime} subValue="LTS_Persistence_Clock" icon={ICONS.Admin} trend="stable" color="amber" />
        <MetricCard label="Security_Index" value="99.9" subValue="Packet_Integrity_Score" icon={ICONS.Verified} trend="up" color="indigo" />
      </div>

      {/* 2. MAIN VISUALISATION: NEURAL RESONANCE (BENTO LARGE) */}
      <div className="lg:col-span-8 bg-slate-950 rounded-[4rem] p-10 md:p-14 text-white shadow-3xl relative overflow-hidden flex flex-col min-h-[600px] border border-white/5">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/10 blur-[200px] rounded-full -translate-y-1/2 translate-x-1/2" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="px-3 py-1 bg-indigo-500/20 rounded-lg border border-indigo-500/30 text-[9px] font-black font-mono tracking-widest text-indigo-400 uppercase">Live_Telemetry</div>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono italic">Sync_Status: Nominal</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-none">Neural_Flow_Buffer</h2>
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] font-mono mt-4">Real-time packet distribution across GB-LON-01 infrastructure</p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest font-mono">Infrastructure_Load</span>
            <div className="flex gap-1">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className={`w-3 h-8 rounded-sm ${i < 8 ? 'bg-indigo-500' : 'bg-white/5'}`} />
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-end gap-1.5 relative z-10 group cursor-crosshair">
          {Array.from({ length: 60 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col gap-1 items-center">
              <div 
                className="w-full bg-indigo-500/30 rounded-t-lg transition-all duration-1000 group-hover:bg-emerald-400/50" 
                style={{ height: `${Math.random() * 60 + 10}%` }} 
              />
              <div 
                className="w-full bg-indigo-500 rounded-t-lg transition-all duration-700 group-hover:bg-emerald-400" 
                style={{ height: `${Math.random() * 30 + 5}%` }} 
              />
            </div>
          ))}
        </div>

        <div className="mt-14 pt-10 border-t border-white/5 flex flex-wrap justify-between items-center gap-6 relative z-10">
          <div className="flex gap-10">
            <div className="space-y-1">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest font-mono">Egress_Traffic</p>
              <p className="text-xl font-black font-mono text-white italic">14.2 GB/s</p>
            </div>
            <div className="space-y-1">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest font-mono">Neural_Latency</p>
              <p className="text-xl font-black font-mono text-white italic">4.2 MS</p>
            </div>
            <div className="space-y-1">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest font-mono">Active_Uplinks</p>
              <p className="text-xl font-black font-mono text-white italic">842 Nodes</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest font-mono">Kernel_Auth_ID</p>
            <p className="text-[11px] font-mono text-indigo-400/80 uppercase tracking-widest">GB_CITADEL_2026_V5</p>
          </div>
        </div>
      </div>

      {/* 3. SIDEBAR BENTO: SERVICE HEALTH & ACTIVITY */}
      <div className="lg:col-span-4 space-y-8">
        {/* Service Health Widget */}
        <div className="bg-white border-precision rounded-[3.5rem] p-10 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">Grid_Health</h3>
            <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black font-mono uppercase tracking-widest border border-emerald-100">ALL_NOMINAL</div>
          </div>
          <div className="space-y-4">
            <HealthNode label="Central_Uplink" status="nominal" />
            <HealthNode label="Neural_Database" status="nominal" />
            <HealthNode label="Media_Relay" status="nominal" />
            <HealthNode label="Neural_Comms" status="nominal" />
            <HealthNode label="Security_Citadel" status="nominal" />
          </div>
          <button className="mt-10 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95">Node_Performance_Report</button>
        </div>

        {/* Global Activity Mini Feed */}
        <div className="bg-slate-50 border border-slate-200 rounded-[3.5rem] p-10 shadow-inner flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Grid_Events</h3>
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
          </div>
          <div className="space-y-6 overflow-hidden flex-1">
            {[
              { time: '12:04:10', event: 'New_Identity_Established', node: 'GB-LON' },
              { time: '12:03:52', event: 'Signal_Sync_Verified', node: 'DE-BER' },
              { time: '12:03:11', event: 'Uplink_Handshake_Complete', node: 'FR-PAR' },
              { time: '12:02:44', event: 'Protocol_Auth_Bypass_Blocked', node: 'US-NYC' },
              { time: '12:02:01', event: 'Neural_Buffer_Flushed', node: 'SYSTEM' },
            ].map((ev, i) => (
              <div key={i} className="flex gap-4 items-start group">
                <div className="text-[10px] font-black font-mono text-slate-300 pt-1 leading-none">{ev.time}</div>
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-slate-900 leading-none mb-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight italic">{ev.event}</p>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono">Source_Cluster: {ev.node}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
