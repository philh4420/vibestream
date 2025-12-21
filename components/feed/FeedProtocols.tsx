
import React from 'react';

interface FeedProtocolsProps {
  active: 'mesh' | 'pulse' | 'recent';
  onChange: (val: 'mesh' | 'pulse' | 'recent') => void;
}

export const FeedProtocols: React.FC<FeedProtocolsProps> = ({ active, onChange }) => {
  const protocols = [
    { id: 'mesh', label: 'Neural Mesh', subtitle: 'PEERS' },
    { id: 'pulse', label: 'Global Pulse', subtitle: 'TRENDING' },
    { id: 'recent', label: 'Recent Logs', subtitle: 'TEMPORAL' }
  ] as const;

  return (
    <div className="flex items-center gap-4 bg-slate-100/50 p-1.5 rounded-[1.8rem] border border-slate-100 overflow-x-auto no-scrollbar">
      {protocols.map((p) => (
        <button
          key={p.id}
          onClick={() => onChange(p.id)}
          className={`flex-1 min-w-[120px] flex flex-col items-center py-2.5 rounded-2xl transition-all touch-active ${
            active === p.id 
              ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100' 
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="text-[10px] font-black uppercase tracking-tight">{p.label}</span>
          <span className="text-[7px] font-black uppercase tracking-[0.2em] font-mono opacity-50 mt-0.5">{p.subtitle}</span>
          {active === p.id && <div className="w-1 h-1 bg-indigo-500 rounded-full mt-1.5" />}
        </button>
      ))}
    </div>
  );
};
