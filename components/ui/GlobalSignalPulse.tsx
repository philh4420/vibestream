
import React, { useState, useEffect } from 'react';
import { GlobalSignal } from '../../types';
import { ICONS } from '../../constants';

interface GlobalSignalPulseProps {
  signal: GlobalSignal;
  onDismiss: () => void;
}

export const GlobalSignalPulse: React.FC<GlobalSignalPulseProps> = ({ signal, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (signal.type === 'transient') {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 1000); // Allow fade-out
      }, 30000); // 30 second transient lifecycle
      return () => clearTimeout(timer);
    }
  }, [signal, onDismiss]);

  if (!isVisible) return null;

  const severityStyles = {
    info: 'bg-cyan-600 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]',
    warning: 'bg-amber-600 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]',
    critical: 'bg-rose-700 border-rose-500 shadow-[0_0_25px_rgba(225,29,72,0.5)] animate-pulse'
  };

  const severityIcon = {
    info: <ICONS.Temporal />,
    warning: <ICONS.Resilience />,
    critical: <ICONS.Admin />
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-[10000] citadel-push-ticker border-b-2 overflow-hidden h-9 flex items-center ${severityStyles[signal.severity]}`}>
      {/* Glitch Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
      
      <div className="shrink-0 px-4 h-full flex items-center bg-black/20 backdrop-blur-md border-r border-white/10 z-10 gap-2">
         <div className="scale-75 text-white">{severityIcon[signal.severity]}</div>
         <span className="text-[9px] font-black text-white uppercase tracking-[0.3em] font-mono whitespace-nowrap">Citadel_Broadcast</span>
      </div>

      <div className="flex-1 relative h-full flex items-center overflow-hidden">
        <div className="citadel-push-text flex items-center whitespace-nowrap px-10">
           <span className="text-[11px] font-black text-white uppercase tracking-[0.1em] italic">
             {signal.text} • {signal.text} • {signal.text} • {signal.text} • {signal.text}
           </span>
        </div>
      </div>

      <button 
        onClick={() => { setIsVisible(false); onDismiss(); }}
        className="shrink-0 h-full px-4 bg-black/30 hover:bg-black/50 transition-colors text-white/70 hover:text-white border-l border-white/10 z-10 group"
      >
        <div className="group-hover:scale-125 transition-transform"><ICONS.Verified /></div>
      </button>
    </div>
  );
};
