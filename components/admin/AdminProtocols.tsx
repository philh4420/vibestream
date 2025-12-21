
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
    <div className={`p-6 rounded-[2rem] border transition-all duration-500 flex flex-col justify-between min-h-[220px] ${isActive ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all ${isActive ? 'bg-slate-950 text-white border-slate-800 shadow-lg' : 'bg-white text-slate-200 border-slate-100'}`}>
             <ICONS.Settings />
           </div>
           <div>
             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono">PROTOCOL_LAYER</span>
             <h4 className="text-xl font-black text-slate-950 uppercase tracking-tighter italic">
               {label.replace('_', ' ')}
             </h4>
           </div>
        </div>
        <div className={`w-3 h-3 rounded-full transition-all ${isActive ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]' : 'bg-slate-300'}`} />
      </div>

      <div className="flex justify-between items-end mt-8">
        <div className="space-y-1">
          <p className={`text-[10px] font-black uppercase tracking-widest font-mono ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
            {isActive ? 'NOMINAL' : 'INACTIVE'}
          </p>
          <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest font-mono">NODE_UK_SYNC</p>
        </div>

        <button 
          onClick={() => onToggle(route, !isActive)}
          className={`relative inline-flex h-10 w-20 items-center rounded-full transition-all duration-300 ${isActive ? 'bg-slate-900' : 'bg-slate-200'}`}
        >
          <div className={`h-8 w-8 rounded-full bg-white shadow-md transition-all duration-300 transform ${isActive ? 'translate-x-11' : 'translate-x-1'}`} />
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
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="bg-slate-950 rounded-[3rem] p-10 md:p-14 text-white shadow-xl relative overflow-hidden border border-white/5">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-600/10 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3" />
        <div className="relative z-10">
          <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none mb-4">Protocol_Matrix</h2>
          <p className="text-[12px] font-black font-mono uppercase tracking-widest text-indigo-400/80">Command Center • Global Layer Authorization</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
