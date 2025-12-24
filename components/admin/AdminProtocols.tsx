
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
  return (
    <div className={`relative p-6 rounded-[2.5rem] border transition-all duration-500 flex flex-col justify-between min-h-[220px] overflow-hidden group ${
      isActive 
        ? 'bg-white border-slate-200 shadow-xl shadow-slate-200/50' 
        : 'bg-slate-50 border-slate-100 opacity-80'
    }`}>
      
      {/* Active Aura */}
      {isActive && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-indigo-500/10 to-transparent blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      )}

      <div className="relative z-10 flex justify-between items-start">
        <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 ${
             isActive 
               ? 'bg-slate-900 text-white shadow-lg shadow-indigo-500/20' 
               : 'bg-white border border-slate-100 text-slate-300'
           }`}>
             <ICONS.Settings />
        </div>
        
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
           <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${isActive ? 'bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse' : 'bg-slate-400'}`} />
           <span className="text-[7px] font-black uppercase tracking-widest font-mono leading-none">
             {isActive ? 'ONLINE' : 'OFFLINE'}
           </span>
        </div>
      </div>

      <div className="relative z-10 mt-6">
         <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.3em] font-mono mb-2">
           LAYER_{route.toUpperCase().slice(0,3)}
         </p>
         <h4 className={`text-2xl font-black uppercase tracking-tighter italic leading-none transition-colors ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
           {label.replace('_', ' ')}
         </h4>
      </div>

      <div className="mt-auto pt-6 relative z-10">
        <button 
          onClick={() => onToggle(route, !isActive)}
          className={`w-full py-4 rounded-[1.8rem] flex items-center justify-between px-2 transition-all duration-500 ${
            isActive ? 'bg-indigo-50 border border-indigo-100' : 'bg-slate-100 border border-slate-200'
          }`}
        >
          <span className={`text-[9px] font-black uppercase tracking-widest font-mono ml-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
            {isActive ? 'ACTIVE' : 'INACTIVE'}
          </span>
          
          <div className={`h-10 w-16 rounded-[1.4rem] p-1 flex items-center transition-all duration-500 ${isActive ? 'bg-indigo-600 shadow-lg' : 'bg-slate-300'}`}>
             <div className={`h-8 w-8 rounded-[1.1rem] bg-white shadow-md transition-all duration-500 transform ${isActive ? 'translate-x-6' : 'translate-x-0'}`} />
          </div>
        </button>
      </div>
    </div>
  );
};

interface AdminProtocolsProps {
  systemSettings: SystemSettings;
  handleToggleFeature: (route: AppRoute, val: boolean) => void;
}

export const AdminProtocols: React.FC<AdminProtocolsProps> = ({ systemSettings, handleToggleFeature }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Hero Header */}
      <div className="bg-slate-950 rounded-[3rem] p-10 md:p-14 text-white shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute right-0 top-0 w-[600px] h-[600px] bg-indigo-600/20 blur-[120px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/10 blur-[100px] translate-y-1/2 -translate-x-1/3" />
        
        <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 mb-4">
                <ICONS.Settings />
                <span className="text-[9px] font-black text-indigo-300 uppercase tracking-[0.3em] font-mono">Core_Architecture</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none mb-6">
              Protocol_Matrix
            </h2>
            <p className="text-sm font-medium text-slate-400 leading-relaxed">
              Global feature flags. Disabling a protocol here will instantly sever access to that module across the entire VibeStream grid. Use with caution.
            </p>
        </div>
      </div>
      
      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
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
