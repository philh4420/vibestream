
import React from 'react';
import { ICONS } from '../../constants';

interface ResilienceShieldProps {
  isFocusShieldActive: boolean;
  toggleFocusShield: () => void;
  limiters: {
    grayscale: boolean;
    fog: boolean;
    kinetic: boolean;
  };
  onToggleLimiter: (type: 'grayscale' | 'fog' | 'kinetic') => void;
}

export const ResilienceShield: React.FC<ResilienceShieldProps> = ({ 
    isFocusShieldActive, 
    toggleFocusShield, 
    limiters,
    onToggleLimiter 
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500">
           
       {/* Primary Shield Control */}
       <div className="bg-slate-900 dark:bg-black rounded-[3rem] p-10 border border-white/10 shadow-2xl relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10">
             <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-2xl transition-all duration-500 ${isFocusShieldActive ? 'bg-rose-600 text-white animate-pulse' : 'bg-white text-slate-900'}`}>
                <ICONS.Resilience />
             </div>
             <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none mb-4">Neural_Shield</h3>
             <p className="text-sm text-slate-400 font-medium mb-12 leading-relaxed max-w-sm">
                Activate high-level isolation. This protocol suppresses all inbound notifications and updates your node status to "Deep Work" across the grid.
             </p>
          </div>

          <button 
            onClick={toggleFocusShield}
            className={`w-full py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-xl transition-all active:scale-95 border-2 ${isFocusShieldActive ? 'bg-rose-600 border-rose-500 text-white' : 'bg-transparent border-white/20 text-white hover:border-white hover:bg-white/5'}`}
          >
            {isFocusShieldActive ? 'TERMINATE_SHIELD' : 'ENGAGE_ISOLATION'}
          </button>
       </div>

       {/* Visual Limiters Control */}
       <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
             <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-8">Interface_Limiters</h3>
             
             <div className="space-y-4">
                {/* Grayscale Toggle */}
                <div 
                    onClick={() => onToggleLimiter('grayscale')}
                    className={`p-6 rounded-3xl border transition-all cursor-pointer flex items-center justify-between group ${limiters.grayscale ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}
                >
                   <div className="flex flex-col">
                      <span className={`text-xs font-black uppercase tracking-widest font-mono ${limiters.grayscale ? 'text-white dark:text-slate-900' : 'text-slate-900 dark:text-white'}`}>Monochrome_Matrix</span>
                      <span className={`text-[9px] uppercase font-bold mt-1 ${limiters.grayscale ? 'text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}>Remove color distractions</span>
                   </div>
                   <div className={`w-12 h-6 rounded-full p-1 relative transition-colors ${limiters.grayscale ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${limiters.grayscale ? 'translate-x-6' : 'translate-x-0'}`} />
                   </div>
                </div>

                {/* Media Fog Toggle */}
                <div 
                    onClick={() => onToggleLimiter('fog')}
                    className={`p-6 rounded-3xl border transition-all cursor-pointer flex items-center justify-between group ${limiters.fog ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}
                >
                   <div className="flex flex-col">
                      <span className={`text-xs font-black uppercase tracking-widest font-mono ${limiters.fog ? 'text-white dark:text-slate-900' : 'text-slate-900 dark:text-white'}`}>Media_Fog</span>
                      <span className={`text-[9px] uppercase font-bold mt-1 ${limiters.fog ? 'text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}>Blur visual overstimulation</span>
                   </div>
                   <div className={`w-12 h-6 rounded-full p-1 relative transition-colors ${limiters.fog ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${limiters.fog ? 'translate-x-6' : 'translate-x-0'}`} />
                   </div>
                </div>

                {/* Kinetic Throttle Toggle */}
                <div 
                    onClick={() => onToggleLimiter('kinetic')}
                    className={`p-6 rounded-3xl border transition-all cursor-pointer flex items-center justify-between group ${limiters.kinetic ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}
                >
                   <div className="flex flex-col">
                      <span className={`text-xs font-black uppercase tracking-widest font-mono ${limiters.kinetic ? 'text-white dark:text-slate-900' : 'text-slate-900 dark:text-white'}`}>Kinetic_Throttle</span>
                      <span className={`text-[9px] uppercase font-bold mt-1 ${limiters.kinetic ? 'text-slate-400' : 'text-slate-400 dark:text-slate-500'}`}>Reduce interface motion</span>
                   </div>
                   <div className={`w-12 h-6 rounded-full p-1 relative transition-colors ${limiters.kinetic ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${limiters.kinetic ? 'translate-x-6' : 'translate-x-0'}`} />
                   </div>
                </div>
             </div>
          </div>
          
          <div className="mt-8 p-4 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/50 dark:border-slate-700 text-center">
             <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 italic">Protocols are applied locally to your current session viewport.</p>
          </div>
       </div>

    </div>
  );
};
