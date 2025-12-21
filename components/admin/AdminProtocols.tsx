import React from 'react';
import { AppRoute, SystemSettings } from '../../types';
import { ICONS } from '../../constants';

interface ProtocolCardProps {
  label: string;
  route: AppRoute;
  isActive: boolean;
  onToggle: (route: AppRoute, val: boolean) => void;
}

const ProtocolCard: React.FC<ProtocolCardProps> = ({ label, route, isActive, onToggle }) => {
  const latency = isActive ? Math.floor(Math.random() * 10 + 4) : 0;
  const load = isActive ? Math.floor(Math.random() * 20 + 5) : 0;

  return (
    <div className={`group relative p-10 rounded-[4.5rem] border transition-all duration-700 flex flex-col justify-between min-h-[380px] overflow-hidden ${isActive ? 'bg-white border-slate-200 shadow-[0_50px_100px_-25px_rgba(0,0,0,0.08)]' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
      
      {/* 1. LAYER IDENTITY (TOP) */}
      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-6">
           <div className={`w-20 h-20 rounded-[2.2rem] flex items-center justify-center shrink-0 transition-all duration-500 shadow-2xl border-2 ${isActive ? 'bg-slate-950 text-white border-slate-800' : 'bg-white text-slate-200 border-slate-100'}`}>
             <ICONS.Settings />
           </div>
           <div className="min-w-0">
             <div className="flex items-center gap-3 mb-2">
               <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] font-mono leading-none italic">LAYER_PROTOCOL</span>
               <span className="text-[10px] font-mono text-indigo-400 font-bold tracking-widest bg-indigo-50 px-3 py-1 rounded-lg">#{route.toUpperCase()}</span>
             </div>
             <h4 className="text-[36px] font-black text-slate-950 uppercase tracking-tighter leading-none italic whitespace-nowrap overflow-visible">
               {label.replace('_', ' ')}
             </h4>
           </div>
        </div>
        
        {/* Connection LED */}
        <div className={`w-4 h-4 rounded-full transition-all duration-1000 ${isActive ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,1)] animate-pulse scale-110' : 'bg-slate-300'}`} />
      </div>

      {/* 2. TELEMETRY LCDs (CENTER) */}
      <div className="grid grid-cols-2 gap-8 mt-12 mb-10 relative z-10">
         <div className="p-8 bg-slate-950 rounded-[3rem] border border-white/10 shadow-inner transition-all group-hover:bg-slate-900 group-hover:scale-105 duration-500">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] font-mono">LATENCY</p>
              <div className="w-1.5 h-4 bg-indigo-500 rounded-full opacity-60" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className={`text-3xl font-black font-mono tracking-tighter ${isActive ? 'text-white' : 'text-slate-800'}`}>{latency}</p>
              <span className="text-[11px] font-black text-slate-500 font-mono uppercase tracking-[0.2em]">ms</span>
            </div>
         </div>
         <div className="p-8 bg-slate-950 rounded-[3rem] border border-white/10 shadow-inner transition-all group-hover:bg-slate-900 group-hover:scale-105 duration-500">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] font-mono">PACKET_LOAD</p>
              <div className="w-1.5 h-4 bg-emerald-500 rounded-full opacity-60" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className={`text-3xl font-black font-mono tracking-tighter ${isActive ? 'text-white' : 'text-slate-800'}`}>{load}</p>
              <span className="text-[11px] font-black text-slate-500 font-mono uppercase tracking-[0.2em]">%</span>
            </div>
         </div>
      </div>
      
      {/* 3. FOOTER: STATUS & TACTICAL SWITCH (BOTTOM) */}
      <div className="flex justify-between items-center pt-10 border-t border-slate-50 relative z-10">
        <div className="space-y-2">
          <p className={`text-[14px] font-black uppercase tracking-[0.6em] font-mono transition-colors italic ${isActive ? 'text-emerald-500' : 'text-slate-400'}`}>
            {isActive ? 'NOMINAL_ACCESS' : 'LINK_TERMINATED'}
          </p>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] font-mono">NODE_GB_UPLINK_SYNCHRONISED</p>
        </div>

        {/* TACTICAL MECHANICAL SWITCH V5 */}
        <div className="relative group/toggle">
          <button 
            onClick={() => onToggle(route, !isActive)}
            className={`relative inline-flex h-16 w-[110px] items-center rounded-[2.2rem] p-2 transition-all duration-700 shadow-inner overflow-hidden ${isActive ? 'bg-slate-950 border border-white/10' : 'bg-slate-200 border border-slate-300'}`}
          >
            {/* The Internal Rail */}
            <div className="absolute inset-x-8 h-1.5 bg-white/5 rounded-full pointer-events-none" />
            
            {/* The Physical Knob */}
            <div className={`flex h-12 w-12 transform items-center justify-center rounded-[1.8rem] bg-white shadow-[0_15px_30px_rgba(0,0,0,0.3)] transition-all duration-700 ease-[cubic-bezier(0.85,0,0.15,1)] ${isActive ? 'translate-x-[42px]' : 'translate-x-0'}`}>
              <div className={`h-3 w-3 rounded-full transition-all duration-700 ${isActive ? 'bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,1)] scale-150' : 'bg-slate-100'}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Background Decorative Mesh Overlay */}
      <div className={`absolute -bottom-32 -left-32 w-80 h-80 bg-indigo-500/5 blur-[120px] rounded-full transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  );
};

interface AdminProtocolsProps {
  systemSettings: SystemSettings;
  handleToggleFeature: (route: AppRoute, val: boolean) => void;
}

export const AdminProtocols: React.FC<AdminProtocolsProps> = ({ systemSettings, handleToggleFeature }) => {
  return (
    <div className="space-y-14 animate-in fade-in duration-700">
      <div className="bg-slate-950 rounded-[5rem] p-20 text-white shadow-3xl flex flex-col md:flex-row items-center justify-between overflow-hidden relative border border-white/5">
        <div className="absolute right-0 top-0 w-[600px] h-[600px] bg-indigo-600/10 blur-[250px] rounded-full translate-x-1/3 -translate-y-1/3" />
        <div className="relative z-10 text-center md:text-left">
          <h2 className="text-6xl font-black italic tracking-tighter uppercase leading-none mb-6">Master_Protocol_Matrix</h2>
          <p className="text-[16px] font-black font-mono uppercase tracking-[0.8em] text-indigo-400/80">Citadel Command Center • Multi-Layer Authorisation Suite</p>
        </div>
        <div className="mt-10 md:mt-0 flex flex-col items-center md:items-end relative z-10">
          <span className="text-[13px] font-black text-slate-600 uppercase tracking-[0.5em] font-mono mb-3">ACTIVE_LAYER_COUNT</span>
          <span className="text-8xl font-black text-indigo-400 font-mono leading-none tracking-tighter">{Object.values(AppRoute).length}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-12">
        {Object.values(AppRoute).map(route => (
          <ProtocolCard 
            key={route}
            label={route}
            route={route}
            isActive={systemSettings.featureFlags?.[route] !== false}
            onToggle={handleToggleFeature}
          />
        ))}
      </div>
    </div>
  );
};
