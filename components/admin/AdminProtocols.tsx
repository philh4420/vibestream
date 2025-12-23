
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
    <div className={`relative p-5 rounded-[2rem] border transition-all duration-500 flex flex-col justify-between min-h-[180px] overflow-hidden group ${
      isActive 
        ? 'bg-white border-slate-200 shadow-xl shadow-slate-200/50' 
        : 'bg-slate-50/50 border-slate-100 opacity-70 grayscale-[0.5]'
    }`}>
      
      {/* Background Tech Pattern */}
      {isActive && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-bl-[4rem] pointer-events-none" />
      )}

      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-3">
           <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 ${
             isActive 
               ? 'bg-slate-950 text-white shadow-lg shadow-indigo-500/20' 
               : 'bg-white border border-slate-100 text-slate-300'
           }`}>
             <div className="scale-90"><ICONS.Settings /></div>
           </div>
        </div>
        
        {/* Status LED */}
        <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-full border border-slate-200">
           <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${isActive ? 'bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse' : 'bg-slate-300'}`} />
           <span className="text-[6px] font-black uppercase tracking-widest text-slate-400 font-mono">
             {isActive ? 'ON' : 'OFF'}
           </span>
        </div>
      </div>

      <div className="relative z-10 mt-4">
         <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest font-mono mb-1">
           LAYER_{route.toUpperCase().slice(0,3)}
         </p>
         <h4 className="text-lg font-black text-slate-900 uppercase tracking-tighter italic leading-none">
           {label.replace('_', ' ')}
         </h4>
      </div>

      <div className="flex justify-between items-end mt-auto pt-4 relative z-10">
        <div className="space-y-0.5">
          <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest font-mono">
            SECURE_SHA256
          </p>
        </div>

        {/* High-Tech Toggle Switch */}
        <button 
          onClick={() => onToggle(route, !isActive)}
          className={`relative h-9 w-16 rounded-full transition-all duration-500 p-1 flex items-center cursor-pointer ${
            isActive ? 'bg-indigo-600 shadow-[inset_0_2px_6px_rgba(0,0,0,0.2)]' : 'bg-slate-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]'
          }`}
        >
          <div className={`h-7 w-7 rounded-full bg-white shadow-lg transition-all duration-500 cubic-bezier(0.2, 0.8, 0.2, 1) transform flex items-center justify-center ${
            isActive ? 'translate-x-7' : 'translate-x-0'
          }`}>
             {isActive && <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
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
      <div className="bg-slate-950 rounded-[3rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute right-0 top-0 w-96 h-96 bg-gradient-radial from-indigo-600/20 to-transparent blur-[100px] -translate-y-1/3 translate-x-1/3" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
               <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md border border-white/10">
                 <ICONS.Admin />
               </div>
               <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] font-mono">System_Core_v2.6</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-none">Protocol_Matrix</h2>
            <p className="text-[11px] font-bold text-slate-400 mt-4 max-w-lg leading-relaxed">
              Manage global access layers. Disabling a protocol will instantly sever the neural link for that specific module across all connected nodes.
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-md">
             <div className="text-right">
                <p className="text-[9px] font-black text-white uppercase tracking-widest font-mono">Global_Grid</p>
                <p className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest font-mono">STATUS: STABLE</p>
             </div>
             <div className="w-10 h-10 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
          </div>
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
