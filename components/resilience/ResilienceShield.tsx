
import React from 'react';
import { ICONS } from '../../constants';

interface ResilienceShieldProps {
  isFocusShieldActive: boolean;
  toggleFocusShield: () => void;
}

export const ResilienceShield: React.FC<ResilienceShieldProps> = ({ isFocusShieldActive, toggleFocusShield }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500">
           
       <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
             <div className="w-16 h-16 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-lg">
                <ICONS.Verified />
             </div>
             <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none mb-4">Focus_Shield</h3>
             <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-8 leading-relaxed">
                Activate high-intensity cognitive protection. This protocol will auto-reject incoming call signals, mute notifications, and update your grid status to "Deep Work".
             </p>
             <button 
               onClick={toggleFocusShield}
               className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 ${isFocusShieldActive ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-indigo-600 dark:hover:bg-indigo-300'}`}
             >
               {isFocusShieldActive ? 'DISENGAGE_SHIELD' : 'ENGAGE_SHIELD'}
             </button>
          </div>
       </div>

       <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] p-10 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between">
          <div>
             <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-6">Sentiment_Mesh</h3>
             <div className="space-y-4">
                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between shadow-sm">
                   <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">Feed_Temperature</span>
                   <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-mono">Positive</span>
                </div>
                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between shadow-sm">
                   <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">Static_Filter</span>
                   <div className="w-10 h-5 bg-indigo-600 dark:bg-indigo-500 rounded-full relative cursor-pointer">
                      <div className="w-3 h-3 bg-white rounded-full absolute top-1 right-1 shadow-sm" />
                   </div>
                </div>
             </div>
          </div>
          <div className="mt-8 p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 text-center">
             <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] font-mono">AI_ANALYSIS</p>
             <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200 mt-2 italic">"Your incoming stream is 85% harmonic. Low toxicity detected."</p>
          </div>
       </div>

    </div>
  );
};
