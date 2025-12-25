
import React from 'react';
import { ICONS } from '../../constants';

interface ResilienceHeroProps {
  vitalityScore: number;
}

export const ResilienceHero: React.FC<ResilienceHeroProps> = ({ vitalityScore }) => {
  return (
    <div className="relative rounded-[3.5rem] bg-emerald-900 dark:bg-emerald-950 p-10 md:p-14 text-white shadow-2xl border border-white/10 overflow-hidden group">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/20 blur-[120px] rounded-full translate-x-1/4 -translate-y-1/4 group-hover:bg-emerald-400/30 transition-colors duration-1000" />
         <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-500/10 blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />

         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
            <div className="space-y-4 max-w-xl">
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                  <ICONS.Resilience />
                  <span className="text-[9px] font-black text-white uppercase tracking-[0.3em] font-mono">Neural_Wellbeing_v2.0</span>
               </div>
               <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none text-white">
                 Resilience<br/><span className="text-emerald-300 dark:text-emerald-400">Hub</span>
               </h1>
               <p className="text-xs md:text-sm font-medium text-emerald-100/80 leading-relaxed max-w-sm">
                 Monitor your digital integrity. Maintain balance between active creation and passive consumption to prevent neural fatigue.
               </p>
            </div>

            <div className="relative w-40 h-40 md:w-56 md:h-56 flex items-center justify-center shrink-0">
               {/* Radial Progress Simulation */}
               <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                  <circle 
                    cx="50" cy="50" r="45" fill="none" stroke="#34d399" strokeWidth="8" 
                    strokeDasharray="283" 
                    strokeDashoffset={283 - (283 * vitalityScore) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl md:text-5xl font-black text-white tracking-tighter">{vitalityScore}</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-emerald-300 font-mono">Vitality</span>
               </div>
            </div>
         </div>
      </div>
  );
};
