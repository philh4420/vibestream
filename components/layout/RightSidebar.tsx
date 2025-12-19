
import React, { useState, useEffect } from 'react';
import { ICONS } from '../../constants';
import { User as VibeUser } from '../../types';

interface RightSidebarProps {
  userData: VibeUser | null;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ userData }) => {
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(prev => (prev + 1) % 100);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const trends = [
    { tag: 'Neural_Web_2026', count: '42.5K', growth: '+12%' },
    { tag: 'Citadel_Protocol', count: '12.8K', growth: '+8%' },
    { tag: 'VibeFlow_Sync', count: '9.2K', growth: '+24%' },
    { tag: 'London_Grid', count: '7.1K', growth: '-2%' },
  ];

  const suggestedNodes = [
    { name: 'Dr. Nexus', handle: 'nexus_01', seed: 'nexus' },
    { name: 'Aura Weaver', handle: 'aura_vibe', seed: 'aura' },
    { name: 'Byte Commander', handle: 'byte_cmd', seed: 'byte' },
  ];

  return (
    <aside className="hidden xl:flex flex-col w-80 shrink-0 bg-white/30 p-6 gap-6 pt-[calc(var(--header-h)+1.5rem)] pr-[max(1.5rem,var(--sar))] border-l border-precision overflow-y-auto no-scrollbar">
      
      {/* Trending Section */}
      <div className="glass-panel rounded-[2.5rem] p-7 backdrop-blur-md shadow-sm border-white/40 hover:border-indigo-500/20 transition-all duration-500 group">
        <div className="flex justify-between items-center mb-8">
          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono group-hover:text-indigo-500 transition-colors">Resonance_Feed</h4>
          <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-ping" />
        </div>
        
        <div className="space-y-7">
          {trends.map((trend, i) => (
            <div key={trend.tag} className="flex flex-col gap-1.5 group/item cursor-pointer">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-black text-slate-900 tracking-tight group-hover/item:text-indigo-600 transition-colors">#{trend.tag}</p>
                <span className={`text-[8px] font-bold font-mono ${trend.growth.startsWith('+') ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {trend.growth}
                </span>
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest font-mono">{trend.count} Signals</p>
            </div>
          ))}
        </div>
        
        <button className="w-full mt-8 py-3 bg-slate-50 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-transparent hover:border-indigo-100">
          Sync_All_Signals
        </button>
      </div>

      {/* Suggested Nodes */}
      <div className="glass-panel rounded-[2.5rem] p-7 backdrop-blur-md shadow-sm border-white/40">
        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8 font-mono">Neural_Connect</h4>
        <div className="space-y-6">
          {suggestedNodes.map(node => (
            <div key={node.handle} className="flex items-center justify-between group/node">
              <div className="flex items-center gap-3">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${node.seed}`} 
                  className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 group-hover/node:scale-105 transition-transform" 
                  alt="" 
                />
                <div>
                  <p className="text-[11px] font-black text-slate-900 leading-none mb-1">{node.name}</p>
                  <p className="text-[9px] text-slate-400 font-bold font-mono tracking-tight">@{node.handle}</p>
                </div>
              </div>
              <button className="p-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-600 hover:text-white transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div className="glass-panel rounded-[2rem] p-6 backdrop-blur-md bg-slate-950/5 border-slate-200">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <div className="w-3 h-3 bg-emerald-500 rounded-full" />
            <div className="absolute inset-0 w-3 h-3 bg-emerald-400 rounded-full animate-ping opacity-75" />
          </div>
          <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest font-mono">Grid_Operational</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Latency</p>
            <p className="text-xs font-black text-slate-900 font-mono">14ms</p>
          </div>
          <div>
            <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Uptime</p>
            <p className="text-xs font-black text-slate-900 font-mono">99.98%</p>
          </div>
        </div>
      </div>

    </aside>
  );
};
