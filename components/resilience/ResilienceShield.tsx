
import React from 'react';
import { ICONS } from '../../constants';

interface ResilienceShieldProps {
  isFocusShieldActive: boolean;
  toggleFocusShield: () => void;
}

export const ResilienceShield: React.FC<ResilienceShieldProps> = ({ isFocusShieldActive, toggleFocusShield }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500">
           
       <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
             <div className="w-16 h-16 bg-slate-950 dark:bg-white text-white dark:text-slate-900 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-lg">
                <ICONS.Verified />
             </div>
             <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none mb-4">Neural_Shield</h3>
             <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-8 leading-relaxed">
                Activate internal grid isolation. This protocol suppresses all inbound VibeStream notification sounds, hides live toast alerts, and updates your presence to "Deep Work" across the mesh.
             </p>
             <button 
               onClick={toggleFocusShield}
               className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 ${isFocusShieldActive ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-emerald-600 dark:hover:bg-emerald-400 dark:hover:text-white'}`}
             >
               {isFocusShieldActive ? 'TERMINATE_SHIELD' : 'ENGAGE_ISOLATION'}
             </button>
          </div>
       </div>

       <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] p-10 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
          <div>
             <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-6">Internal_Limiters</h3>
             <div className="space-y-4">
                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between shadow-sm">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest font-mono">Platform Mute</span>
                      <span className="text-[8px] text-slate-400 uppercase font-bold">Silence site audio</span>
                   </div>
                   <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${isFocusShieldActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                      {isFocusShieldActive ? 'ACTIVE' : 'READY'}
                   </div>
                </div>
                
                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between shadow-sm">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest font-mono">Alert Suppression</span>
                      <span className="text-[8px] text-slate-400 uppercase font-bold">Block toast interrupts</span>
                   </div>
                   <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${isFocusShieldActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                      {isFocusShieldActive ? 'ACTIVE' : 'READY'}
                   </div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between shadow-sm">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest font-mono">UI De-clutter</span>
                      <span className="text-[8px] text-slate-400 uppercase font-bold">Hide non-essential elements</span>
                   </div>
                   <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full relative cursor-pointer opacity-50">
                      <div className="w-3 h-3 bg-white rounded-full absolute top-1 left-1 shadow-sm" />
                   </div>
                </div>
             </div>
          </div>
          <div className="mt-8 p-4 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/50 dark:border-slate-700 text-center">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] font-mono">BROWSER_DIAGNOSTICS</p>
             <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-2 italic px-4">Sustainable interaction metrics are computed locally on your node.</p>
          </div>
       </div>

    </div>
  );
};
