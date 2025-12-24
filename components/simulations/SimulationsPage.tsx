
import React from 'react';
import { ICONS } from '../../constants';

export const SimulationsPage: React.FC = () => {
  return (
    <div className="w-full min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 md:px-6 animate-in fade-in duration-700 relative">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[3rem]">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full animate-pulse" />
         <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-rose-500/5 blur-[100px] rounded-full" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="relative z-10 max-w-3xl w-full bg-white/60 backdrop-blur-3xl border border-white/60 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.1)] rounded-[3.5rem] p-8 md:p-16 text-center overflow-hidden">
        
        {/* Decorative Grid Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />

        {/* Kinetic Header */}
        <div className="flex flex-col items-center mb-10">
           <div className="w-24 h-24 md:w-28 md:h-28 bg-slate-950 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl relative group border border-white/10 shrink-0">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 opacity-20 rounded-[2.5rem] blur-xl group-hover:blur-2xl transition-all duration-1000" />
              <div className="relative z-10 text-white scale-[1.5] text-indigo-300">
                <ICONS.Simulations />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-lg border border-slate-100">
                 <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              </div>
           </div>
           
           <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-200/60 mb-6 shadow-sm">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono">System_Status:</span>
              <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest font-mono">CALIBRATING</span>
           </div>

           <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-6">
             Reality<br/><span className="text-indigo-600">Engine</span>
           </h1>
           
           <p className="text-sm md:text-base font-medium text-slate-500 max-w-lg leading-relaxed mx-auto">
             The Simulation Deck is currently compiling. This architecture will soon enable collective scenario modeling, algorithmic stress-testing, and predictive market dynamics within the VibeStream grid.
           </p>
        </div>

        {/* Feature Preview (Ghost UI) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12 max-w-2xl mx-auto w-full">
           {[
             { label: 'Prediction Markets', icon: '📈' },
             { label: 'Digital Twins', icon: '👯‍♂️' },
             { label: 'Hive Logic', icon: '🧠' }
           ].map((item, idx) => (
             <div key={idx} className="p-4 rounded-[2rem] bg-white border border-slate-100 shadow-sm flex flex-col items-center gap-3 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
                <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-xl shadow-inner">{item.icon}</div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 font-mono text-center">{item.label}</span>
             </div>
           ))}
        </div>

        {/* Action Placeholder */}
        <div className="relative group max-w-sm mx-auto w-full">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <button disabled className="relative w-full py-5 bg-slate-900 text-slate-400 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] cursor-not-allowed border border-slate-800 flex items-center justify-center gap-3">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            INITIALIZING_CORE...
          </button>
        </div>

        <p className="mt-6 text-[8px] font-black text-slate-300 uppercase tracking-[0.4em] font-mono">
          ESTIMATED_UPLINK: Q3_2026
        </p>

      </div>
    </div>
  );
};
