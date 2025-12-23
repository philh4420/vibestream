
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
      <div className="relative flex p-1.5 bg-slate-200/60 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] overflow-hidden">
        
        {/* Animated Active Background Pill */}
        <div 
          className="absolute top-1.5 bottom-1.5 rounded-[2rem] bg-white shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1)] border border-white/50 transition-all duration-500 cubic-bezier(0.2, 0.8, 0.2, 1) z-0"
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
              className={`relative z-10 flex-1 flex flex-col items-center justify-center py-4 md:py-5 rounded-[2rem] transition-all duration-300 group touch-manipulation ${isActive ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <div className={`mb-1.5 transition-all duration-500 ease-out ${isActive ? 'scale-110 text-indigo-600 -translate-y-0.5' : 'scale-90 group-hover:scale-100 group-hover:-translate-y-0.5'}`}>
                <Icon />
              </div>
              
              <div className="flex flex-col items-center leading-none">
                <span className={`text-[10px] md:text-[11px] font-black uppercase tracking-tight transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                  {p.label}
                </span>
                
                {/* Conditional Subtitle Reveal */}
                <div className={`overflow-hidden transition-all duration-500 ease-out ${isActive ? 'max-h-4 opacity-100 mt-1' : 'max-h-0 opacity-0 mt-0'}`}>
                   <span className="text-[7px] font-bold font-mono uppercase tracking-[0.2em] text-indigo-500 block">
                     {p.subtitle}
                   </span>
                </div>
              </div>

              {/* Active Indicator Dot */}
              <div className={`absolute bottom-2 w-1 h-1 rounded-full bg-indigo-500 transition-all duration-500 ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} />
            </button>
          )
        })}
      </div>
    </div>
  );
};
