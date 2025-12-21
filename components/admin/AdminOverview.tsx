import React from 'react';
import { ICONS } from '../../constants';

interface StatMiniProps {
  label: string;
  value: string | number;
  trend: number;
  icon: React.FC;
  color?: string;
}

const StatMini: React.FC<StatMiniProps> = ({ label, value, trend, icon: Icon, color = "indigo" }) => {
  const colorMap: Record<string, string> = {
    indigo: "text-indigo-500",
    emerald: "text-emerald-500",
    rose: "text-rose-500",
    amber: "text-amber-500",
  };

  return (
    <div className="bg-white border-precision rounded-[2.5rem] p-8 flex items-center justify-between hover:border-indigo-500/30 transition-all duration-500 group shadow-sm">
      <div className="flex items-center gap-6">
        <div className="w-14 h-14 bg-slate-950 text-white rounded-[1.8rem] flex items-center justify-center shrink-0 shadow-2xl group-hover:rotate-6 transition-transform">
          <Icon />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono leading-none mb-2">{label}</p>
          <div className="flex items-center gap-3">
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter font-mono leading-none italic">{value}</h3>
            <span className={`text-[10px] font-black font-mono px-2 py-1 rounded-lg ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          </div>
        </div>
      </div>
      <div className={`w-1.5 h-10 rounded-full bg-current opacity-10 ${colorMap[color]}`} />
    </div>
  );
};

interface AdminOverviewProps {
  metrics: { users: number; posts: number; uptime: string };
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ metrics }) => {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatMini label="ACTIVE_NODES" value={metrics.users} trend={12} icon={ICONS.Profile} color="indigo" />
        <StatMini label="SIGNAL_PULSES" value={metrics.posts} trend={18} icon={ICONS.Explore} color="emerald" />
        <StatMini label="STABILITY_LOCK" value={metrics.uptime} trend={0.1} icon={ICONS.Admin} color="amber" />
        <StatMini label="GRID_STATUS" value="OPTIMAL" trend={100} icon={ICONS.Verified} color="indigo" />
      </div>

      <div className="bg-slate-950 border border-white/5 rounded-[4rem] p-12 shadow-2xl relative group overflow-hidden min-h-[500px] flex flex-col">
        <div className="flex justify-between items-center mb-14 relative z-10">
          <div>
            <h3 className="text-xl font-black text-indigo-400 uppercase tracking-[0.6em] font-mono italic">Neural_Resonance_Flow_V5.0</h3>
            <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em] font-mono mt-2">Buffer Frequency: 164.2 MHz • Global Sync Active</p>
          </div>
          <div className="flex items-center gap-4 px-6 py-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
            <span className="text-[11px] font-black text-slate-300 font-mono tracking-widest uppercase italic">Node_UK_Primary_Active</span>
          </div>
        </div>
        
        <div className="flex-1 flex items-end justify-between gap-1 px-2">
          {Array.from({ length: 180 }).map((_, i) => (
            <div 
              key={i} 
              className={`w-full rounded-t-xl bg-indigo-500 group-hover:bg-emerald-400 transition-all duration-1000`} 
              style={{ height: `${Math.random() * 80 + 20}%`, opacity: (i / 180) + 0.05 }} 
            />
          ))}
        </div>

        <div className="mt-14 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between gap-6 text-[11px] font-black font-mono text-slate-500 uppercase tracking-[0.4em] relative z-10">
          <div className="flex gap-8">
            <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" /> Node_Origin: GB_LON_026</span>
            <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Kernel: Encrypted_Auth</span>
          </div>
          <span className="text-white italic">TEMPORAL_MARKER: {new Date().getFullYear()}.02.SYNC</span>
        </div>
      </div>
    </div>
  );
};
