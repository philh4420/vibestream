
import React from 'react';

interface FeedProtocolsProps {
  active: 'mesh' | 'pulse' | 'recent';
  onChange: (val: 'mesh' | 'pulse' | 'recent') => void;
}

export const FeedProtocols: React.FC<FeedProtocolsProps> = ({ active, onChange }) => {
  const protocols = [
    { id: 'mesh', label: 'Neural Mesh', subtitle: 'PEER_UPLINK' },
    { id: 'pulse', label: 'Global Pulse', subtitle: 'TREND_ARRAY' },
    { id: 'recent', label: 'Recent Logs', subtitle: 'TIME_FLOW' }
  ] as const;

  return (
    <div className="flex items-center gap-3 bg-white/50 backdrop-blur-xl p-2 rounded-[2.2rem] border border-slate-100 overflow-x-auto no-scrollbar shadow-sm">
      {protocols.map((p) => (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          className={`flex-1 min-w-[130px] flex flex-col items-center py-3.5 px-4 rounded-[1.6rem] transition-all duration-300 touch-active relative group ${
            active === p.id 
              ? 'bg-slate-950 text-white shadow-2xl shadow-slate-200' 
              : 'text-slate-500 hover:bg-white hover:text-slate-900'
          }`}
        >
          <span className={`text-[11px] font-black uppercase tracking-tight italic ${active === p.id ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
            {p.label}
          </span>
          <span className={`text-[7px] font-black uppercase tracking-[0.4em] font-mono mt-1 opacity-40 group-hover:opacity-60 transition-opacity`}>
            {p.subtitle}
          </span>
          
          {active === p.id && (
            <div className="absolute -bottom-1 w-2 h-2 bg-indigo-500 rounded-full blur-[2px] animate-pulse" />
          )}
        </button>
      ))}
    </div>
  );
};
