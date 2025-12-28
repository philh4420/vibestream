import React from 'react';
import { ICONS } from '../../constants';

interface FeedProtocolsProps {
  active: 'mesh' | 'pulse' | 'recent';
  onChange: (val: 'mesh' | 'pulse' | 'recent') => void;
}

export const FeedProtocols: React.FC<FeedProtocolsProps> = ({ active, onChange }) => {
  const protocols = [
    { id: 'mesh', label: 'Neural Mesh', subtitle: 'PEER_UPLINK', icon: ICONS.Clusters },
    { id: 'pulse', label: 'Global Pulse', subtitle: 'TREND_ARRAY', icon: ICONS.Resilience },
    { id: 'recent', label: 'Recent Logs', subtitle: 'TIME_FLOW', icon: ICONS.Temporal }
  ] as const;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 md:px-0">
      <div className="relative flex p-1.5 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-2xl border border-slate-200 dark:border-slate-700/50 rounded-[2.5rem] shadow-inner overflow-hidden">
        
        {/* Animated High-Fidelity Background Pill */}
        <div 
          className="absolute top-1.5 bottom-1.5 rounded-[2rem] bg-white dark:bg-slate-900 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] border border-slate-200 dark:border-slate-700 transition-all duration-500 cubic-bezier(0.2, 1, 0.2, 1) z-0"
          style={{
            left: '6px',
            width: 'calc(33.333% - 4px)',
            transform: `translateX(${
              active === 'mesh' ? '0%' : 
              active === 'pulse' ? '100%' : '200%'
            })`
          }}
        />

        {protocols.map((p) => {
          const isActive = active === p.id;
          const Icon = p.icon;
          
          return (
            <button
              key={p.id}
              onClick={() => onChange(p.id)}
              className={`relative z-10 flex-1 flex flex-col items-center justify-center py-4 md:py-6 rounded-[2rem] transition-all duration-300 group touch-manipulation active:scale-[0.98] ${isActive ? 'text-slate-950 dark:text-white' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              <div className={`mb-2 transition-all duration-500 ease-out ${isActive ? 'scale-110 text-indigo-600 dark:text-indigo-400 -translate-y-0.5' : 'scale-90 group-hover:scale-100 group-hover:-translate-y-0.5'}`}>
                <Icon />
              </div>
              
              <div className="flex flex-col items-center leading-none">
                <span className={`text-[10px] md:text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                  {p.label}
                </span>
                
                {/* Conditional Subtitle Reveal */}
                <div className={`overflow-hidden transition-all duration-500 ease-out ${isActive ? 'max-h-4 opacity-100 mt-1.5' : 'max-h-0 opacity-0 mt-0'}`}>
                   <span className="text-[8px] font-bold font-mono uppercase tracking-[0.25em] text-indigo-500/80 dark:text-indigo-400/80 block">
                     {p.subtitle}
                   </span>
                </div>
              </div>

              {/* Active Indicator Dot */}
              <div className={`absolute bottom-2 w-1.5 h-1.5 rounded-full bg-indigo-500 transition-all duration-500 shadow-[0_0_8px_rgba(99,102,241,0.6)] ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} />
            </button>
          )
        })}
      </div>
    </div>
  );
};