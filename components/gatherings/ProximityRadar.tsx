
import React, { useState, useEffect } from 'react';
import { User } from '../../types';

interface ProximityRadarProps {
  attendees: User[];
}

export const ProximityRadar: React.FC<ProximityRadarProps> = ({ attendees }) => {
  const [nearbyNodes, setNearbyNodes] = useState<User[]>([]);

  // Simulation: Randomly select "nearby" users from the attendee list
  useEffect(() => {
    if (attendees.length > 0) {
      const shuffled = [...attendees].sort(() => 0.5 - Math.random());
      setNearbyNodes(shuffled.slice(0, Math.min(3, attendees.length)));
    }
  }, [attendees]);

  return (
    <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white border border-white/10 relative overflow-hidden shadow-2xl">
      
      <div className="flex items-center justify-between mb-6 relative z-10">
         <div>
            <h3 className="text-sm font-black uppercase tracking-widest italic text-indigo-400">Proximity_Ping</h3>
            <p className="text-[9px] font-mono text-slate-400">Scanning 1KM Radius...</p>
         </div>
         <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
      </div>

      <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
         
         {/* Radar Visual */}
         <div className="relative w-32 h-32 flex-shrink-0">
            {/* Grid Circles */}
            <div className="absolute inset-0 border border-indigo-500/30 rounded-full" />
            <div className="absolute inset-4 border border-indigo-500/20 rounded-full" />
            <div className="absolute inset-10 border border-indigo-500/10 rounded-full bg-indigo-500/5" />
            
            {/* Scanner Line */}
            <div className="absolute inset-0 rounded-full animate-radar-spin bg-gradient-to-tr from-transparent via-transparent to-indigo-500/40" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 50%)' }} />
            
            {/* Blips */}
            {nearbyNodes.map((_, i) => (
                <div 
                    key={i} 
                    className="absolute w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_#34d399] animate-pulse"
                    style={{ 
                        top: `${20 + Math.random() * 60}%`, 
                        left: `${20 + Math.random() * 60}%`,
                        animationDelay: `${i * 0.5}s`
                    }} 
                />
            ))}
         </div>

         {/* Detected List */}
         <div className="flex-1 w-full">
            {nearbyNodes.length > 0 ? (
                <div className="space-y-3">
                    {nearbyNodes.map(node => (
                        <div key={node.id} className="flex items-center gap-3 p-2 bg-white/5 rounded-xl border border-white/5">
                            <img src={node.avatarUrl} className="w-8 h-8 rounded-lg object-cover" alt="" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black uppercase truncate tracking-tight">{node.displayName}</p>
                                <p className="text-[8px] font-mono text-emerald-400">~{(Math.random() * 800).toFixed(0)}m AWAY</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-4 opacity-50">
                    <p className="text-[9px] font-mono text-slate-400">NO_SIGNALS_DETECTED</p>
                </div>
            )}
         </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes radar-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-radar-spin {
            animation: radar-spin 2s linear infinite;
        }
      `}} />
    </div>
  );
};
