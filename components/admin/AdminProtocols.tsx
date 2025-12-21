
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
    <div className={`p-4 rounded-[1.5rem] border transition-all duration-500 flex flex-col justify-between min-h-[160px] ${isActive ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
           <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${isActive ? 'bg-slate-950 text-white border-slate-800 shadow-lg' : 'bg-white text-slate-200 border-slate-100'}`}>
             <div className="scale-75"><ICONS.Settings /></div>
           </div>
           <div>
             <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest font-mono">PROTOCOL_LAYER</span>
             <h4 className="text-[15px] font-black text-slate-950 uppercase tracking-tighter italic">
               {label.replace('_', ' ')}
             </h4>
           </div>
        </div>
        <div className={`w-2 h-2 rounded-full transition-all ${isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-slate-300'}`} />
      </div>

      <div className="flex justify-between items-end mt-6">
        <div className="space-y-0.5">
          <p className={`text-[8px] font-black uppercase tracking-widest font-mono ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
            {isActive ? 'NOMINAL' : 'INACTIVE'}
          </p>
          <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest font-mono">NODE_UK_SYNC</p>
        </div>

        <button 
          onClick={() => onToggle(route, !isActive)}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ${isActive ? 'bg-slate-900' : 'bg-slate-200'}`}
        >
          <div className={`h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-300 transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
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
      <div className="bg-slate-950 rounded-[2rem] p-8 md:p-10 text-white shadow-xl relative overflow-hidden border border-white/5">
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full translate-x-1/3 -translate-y-1/3" />
        <div className="relative z-10">
          <h2 className="text-2xl font-black italic tracking-tighter uppercase leading-none mb-3">Protocol_Matrix</h2>
          <p className="text-[10px] font-black font-mono uppercase tracking-widest text-indigo-400/80">Command Center • Global Layer Authorization</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
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
