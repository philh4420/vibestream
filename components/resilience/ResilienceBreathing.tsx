
import React, { useState, useEffect } from 'react';

export const ResilienceBreathing: React.FC = () => {
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Inhale');

  useEffect(() => {
    if (!isBreathingActive) return;
    let isMounted = true;

    const cycle = async () => {
      if (!isMounted || !isBreathingActive) return;
      setBreathPhase('Inhale');
      await new Promise(r => setTimeout(r, 4000));
      
      if (!isMounted || !isBreathingActive) return;
      setBreathPhase('Hold');
      await new Promise(r => setTimeout(r, 4000));
      
      if (!isMounted || !isBreathingActive) return;
      setBreathPhase('Exhale');
      await new Promise(r => setTimeout(r, 4000));
      
      if (!isMounted || !isBreathingActive) return;
      setBreathPhase('Rest');
      await new Promise(r => setTimeout(r, 2000));
      
      if (isMounted && isBreathingActive) cycle();
    };
    
    cycle();
    return () => { isMounted = false; };
  }, [isBreathingActive]);

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-500">
       <div className="bg-slate-950 dark:bg-black rounded-[3.5rem] p-10 md:p-20 text-white text-center relative overflow-hidden shadow-2xl border border-white/5 dark:border-slate-800">
          <div className="absolute inset-0 bg-gradient-radial from-teal-900/40 to-slate-950 dark:to-black z-0" />
          
          <div className="relative z-10 flex flex-col items-center">
             <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Bio_Synchronization</h3>
             <p className="text-[10px] font-mono text-teal-400 uppercase tracking-[0.3em] mb-12">Regulate Nervous System</p>

             <div className="relative w-64 h-64 flex items-center justify-center mb-12">
                {/* Breathing Circles */}
                <div 
                  className={`absolute inset-0 bg-teal-500/20 rounded-full blur-3xl transition-all duration-[4000ms] ease-in-out ${breathPhase === 'Inhale' || breathPhase === 'Hold' ? 'scale-100 opacity-60' : 'scale-50 opacity-20'}`} 
                />
                <div 
                  className={`w-32 h-32 bg-gradient-to-tr from-teal-400 to-emerald-500 rounded-full shadow-[0_0_60px_rgba(20,184,166,0.4)] flex items-center justify-center relative z-10 transition-all duration-[4000ms] ease-in-out ${breathPhase === 'Inhale' || breathPhase === 'Hold' ? 'scale-150' : 'scale-75'}`}
                >
                   <span className="text-xs font-black uppercase tracking-widest text-white drop-shadow-md">
                     {isBreathingActive ? breathPhase : 'Ready'}
                   </span>
                </div>
                {/* Ring */}
                <div 
                  className={`absolute inset-0 border-2 border-teal-500/30 rounded-full transition-all duration-[4000ms] ease-in-out ${breathPhase === 'Inhale' ? 'scale-110' : 'scale-90'}`}
                />
             </div>

             <button 
               onClick={() => setIsBreathingActive(!isBreathingActive)}
               className="px-10 py-4 bg-white text-slate-950 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] hover:scale-105 transition-all active:scale-95"
             >
               {isBreathingActive ? 'TERMINATE_SESSION' : 'INITIATE_SEQUENCE'}
             </button>
          </div>
       </div>
    </div>
  );
};
