
import React from 'react';
import { ICONS } from '../../constants';

export const CookiesPage: React.FC = () => {
  return (
    <div className="w-full max-w-[2400px] mx-auto pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Hero Header */}
      <div className="relative rounded-[3rem] bg-amber-950 p-10 md:p-14 text-white shadow-2xl border border-white/10 overflow-hidden mb-10 group">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-600/20 blur-[120px] rounded-full translate-x-1/4 -translate-y-1/4 group-hover:bg-amber-500/30 transition-colors duration-1000" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />

         <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 mb-6">
               <ICONS.Saved />
               <span className="text-[9px] font-black text-amber-300 uppercase tracking-[0.3em] font-mono">Local_Storage</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none text-white mb-6">
              Persistence<br/><span className="text-amber-500">Fragments</span>
            </h1>
            <p className="text-xs md:text-sm font-medium text-amber-100/80 leading-relaxed max-w-xl">
              VibeStream utilizes small data shards stored locally on your device to maintain session continuity, grid preferences, and reduce latency.
            </p>
         </div>
      </div>

      {/* Fragments Table (Static) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-8 md:p-12 shadow-sm">
         <div className="flex justify-between items-center mb-8 border-b border-slate-50 dark:border-slate-800 pb-6">
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Active_Fragments</h3>
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] font-mono">Total: 4</span>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Fragment 1 */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-700 relative overflow-hidden group hover:border-amber-200 dark:hover:border-amber-900 transition-all">
                 <div className="flex justify-between items-start mb-4">
                    <code className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg">NEURAL_SESSION</code>
                    <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">ESSENTIAL</span>
                 </div>
                 <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-4">
                   Maintains your cryptographic handshake with the grid. Deleting this will terminate your session immediately.
                 </p>
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Retention: Session</span>
                 </div>
            </div>

            {/* Fragment 2 */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-700 relative overflow-hidden group hover:border-amber-200 dark:hover:border-amber-900 transition-all">
                 <div className="flex justify-between items-start mb-4">
                    <code className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg">ROUTE_MEMORY</code>
                    <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">FUNCTIONAL</span>
                 </div>
                 <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-4">
                   Remembers your last visited coordinate to restore context upon return.
                 </p>
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Retention: Persistent</span>
                 </div>
            </div>

            {/* Fragment 3 */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-700 relative overflow-hidden group hover:border-amber-200 dark:hover:border-amber-900 transition-all">
                 <div className="flex justify-between items-start mb-4">
                    <code className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg">THEME_MATRIX</code>
                    <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">PREFERENCE</span>
                 </div>
                 <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-4">
                   Stores local UI calibration (Dark/Light mode, font scaling).
                 </p>
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Retention: Persistent</span>
                 </div>
            </div>

            {/* Fragment 4 */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-700 relative overflow-hidden group hover:border-amber-200 dark:hover:border-amber-900 transition-all">
                 <div className="flex justify-between items-start mb-4">
                    <code className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg">LOCALE_BINDING</code>
                    <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">FUNCTIONAL</span>
                 </div>
                 <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-4">
                   Ensures the grid renders in your preferred dialect (en-GB).
                 </p>
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Retention: Persistent</span>
                 </div>
            </div>

         </div>
      </div>

      {/* Control Panel (Mock) */}
      <div className="mt-8 bg-slate-900 dark:bg-slate-800 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10 dark:border-slate-700">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-rose-900/50">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <div>
               <h4 className="text-lg font-black uppercase italic tracking-tight">Purge_Fragments</h4>
               <p className="text-[10px] font-medium text-slate-400">Clear all local storage artifacts.</p>
            </div>
         </div>
         <button className="px-8 py-3 bg-white/10 hover:bg-rose-600 text-white rounded-[1.5rem] font-black text-[9px] uppercase tracking-[0.3em] transition-all border border-white/10 backdrop-blur-md">
            INITIATE_WIPE
         </button>
      </div>
    </div>
  );
};
