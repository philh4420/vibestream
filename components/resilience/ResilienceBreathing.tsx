import React, { useState, useEffect } from 'react';
/* Import ICONS from constants */
import { ICONS } from '../../constants';

type SyncMode = 'Arctic_Stasis' | 'Solar_Recharge' | 'Deep_Void';

interface ModeConfig {
    color: string;
    glow: string;
    timing: number;
    label: string;
}

const MODES: Record<SyncMode, ModeConfig> = {
    'Arctic_Stasis': { color: 'from-cyan-400 to-emerald-500', glow: 'shadow-cyan-500/40', timing: 5000, label: 'Cooling_Breath' },
    'Solar_Recharge': { color: 'from-amber-400 to-orange-500', glow: 'shadow-amber-500/40', timing: 4000, label: 'Energy_Flow' },
    'Deep_Void': { color: 'from-indigo-600 to-purple-800', glow: 'shadow-indigo-500/40', timing: 6000, label: 'Silent_Calibration' }
};

export const ResilienceBreathing: React.FC = () => {
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [activeMode, setActiveMode] = useState<SyncMode>('Arctic_Stasis');
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Inhale');
  const [completionCount, setCompletionCount] = useState(0);

  const config = MODES[activeMode];

  useEffect(() => {
    if (!isBreathingActive) return;
    let isMounted = true;

    const cycle = async () => {
      if (!isMounted || !isBreathingActive) return;
      setBreathPhase('Inhale');
      await new Promise(r => setTimeout(r, config.timing));
      
      if (!isMounted || !isBreathingActive) return;
      setBreathPhase('Hold');
      await new Promise(r => setTimeout(r, config.timing / 1.5));
      
      if (!isMounted || !isBreathingActive) return;
      setBreathPhase('Exhale');
      await new Promise(r => setTimeout(r, config.timing * 1.2));
      
      if (!isMounted || !isBreathingActive) return;
      setBreathPhase('Rest');
      await new Promise(r => setTimeout(r, 2000));
      
      if (isMounted && isBreathingActive) {
          setCompletionCount(prev => prev + 1);
          cycle();
      }
    };
    
    cycle();
    return () => { isMounted = false; };
  }, [isBreathingActive, activeMode]);

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
       <div className="bg-slate-950 dark:bg-black rounded-[3.5rem] p-10 md:p-16 text-white text-center relative overflow-hidden shadow-2xl border border-white/5">
          <div className="absolute inset-0 bg-gradient-radial from-slate-900 to-black z-0 opacity-50" />
          
          <div className="relative z-10 flex flex-col items-center">
             <div className="flex justify-between w-full mb-12">
                <div className="text-left">
                   <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Bio_Sync</h3>
                   <p className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.3em] mt-2">Vitals Restoration</p>
                </div>
                <div className="text-right">
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono">Cycles_Complete</p>
                   <p className="text-2xl font-black italic tracking-tighter">{completionCount}</p>
                </div>
             </div>

             {/* Mode Selector */}
             <div className="flex gap-2 mb-12 bg-white/5 p-1.5 rounded-2xl border border-white/10">
                {(Object.keys(MODES) as SyncMode[]).map(mode => (
                    <button
                        key={mode}
                        onClick={() => { setActiveMode(mode); setCompletionCount(0); }}
                        className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${activeMode === mode ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                        {mode.replace('_', ' ')}
                    </button>
                ))}
             </div>

             <div className="relative w-64 h-64 flex items-center justify-center mb-16">
                {/* Breathing Orbs */}
                <div 
                  className={`absolute inset-0 bg-gradient-to-tr ${config.color} rounded-full blur-[60px] transition-all duration-[4000ms] ease-in-out ${breathPhase === 'Inhale' || breathPhase === 'Hold' ? 'scale-125 opacity-40' : 'scale-50 opacity-10'}`} 
                />
                
                <div 
                  className={`w-32 h-32 bg-gradient-to-tr ${config.color} rounded-full ${config.glow} flex flex-col items-center justify-center relative z-10 transition-all duration-[4000ms] ease-in-out shadow-2xl ${breathPhase === 'Inhale' || breathPhase === 'Hold' ? 'scale-[1.8]' : 'scale-90'}`}
                >
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white drop-shadow-md">
                     {isBreathingActive ? breathPhase : 'Ready'}
                   </span>
                   {isBreathingActive && (
                        <span className="text-[7px] font-bold text-white/60 uppercase mt-1 animate-pulse">{config.label}</span>
                   )}
                </div>

                {/* HUD Ring */}
                <div className="absolute inset-[-20px] border border-white/5 rounded-full" />
                <div className={`absolute inset-[-20px] border-2 border-white/20 rounded-full transition-all duration-[4000ms] ${breathPhase === 'Inhale' ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`} />
             </div>

             <button 
               onClick={() => { setIsBreathingActive(!isBreathingActive); setCompletionCount(0); }}
               className="px-12 py-5 bg-white text-slate-950 rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-xl hover:shadow-white/20 transition-all active:scale-95 flex items-center justify-center gap-3"
             >
               {isBreathingActive ? 'TERMINATE_PROTOCOL' : 'INITIALIZE_SYNC'}
             </button>
          </div>
       </div>

       {/* Stability Note */}
       <div className="p-6 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex items-center gap-6 shadow-sm">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
             <ICONS.Verified />
          </div>
          <div>
             <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest font-mono">Resonance_Note</p>
             <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-1">Periodic Bio-Synchronization reduces neural load by up to 42% during high-velocity grid interaction.</p>
          </div>
       </div>
    </div>
  );
};