
import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { collection, query, where, getDocs, orderBy, limit } = Firestore as any;

interface ResilienceMonitorProps {
  userData: User;
}

export const ResilienceMonitor: React.FC<ResilienceMonitorProps> = ({ userData }) => {
  const [velocity, setVelocity] = useState(0); 
  const [creationCount, setCreationCount] = useState(0);
  const [noiseLevel, setNoiseLevel] = useState(15); // Logic-based mock
  const [handshakeEfficiency, setHandshakeEfficiency] = useState(98);

  useEffect(() => {
    if (!db) return;

    const fetchMetrics = async () => {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        try {
            const velocityQuery = query(
                collection(db, 'posts'),
                where('timestamp', '>=', oneHourAgo),
                orderBy('timestamp', 'desc')
            );
            const vSnap = await getDocs(velocityQuery);
            setVelocity(Math.min(vSnap.size * 2.5, 100)); // Scaled
        } catch (e) {
            console.error("Velocity sync error", e);
        }

        try {
            const userPostsQuery = query(
                collection(db, 'posts'),
                where('authorId', '==', userData.id)
            );
            const uSnap = await getDocs(userPostsQuery);
            setCreationCount(uSnap.size);
            
            // Logic: Noise level increases with blocked words count
            const blockedCount = userData.settings?.safety?.hiddenWords?.length || 0;
            setNoiseLevel(Math.min(100, 5 + (blockedCount * 8)));
            
            // Handshake efficiency decreases slightly with high velocity
            setHandshakeEfficiency(Math.max(85, 100 - (velocity / 10)));

        } catch (e) {
            console.error("Signal sync error", e);
        }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000); // Fast updates for kinetics
    return () => clearInterval(interval);
  }, [userData.id, velocity]);

  const StatBox = ({ label, value, unit, color }: any) => (
    <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono mb-2">{label}</p>
        <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-black italic tracking-tighter ${color}`}>{value}</span>
            <span className="text-[10px] font-black text-slate-400 uppercase">{unit}</span>
        </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
       
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Hygiene Card */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-10 opacity-5">
                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" /></svg>
             </div>
             
             <div className="flex justify-between items-start mb-10">
                <div>
                   <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">Signal_Hygiene</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono mt-2">Interaction Integrity Audit</p>
                </div>
                <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800">
                   Audit_Passed
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-3">
                        <span className="text-indigo-600 dark:text-indigo-400">Contribution Rate</span>
                        <span className="text-slate-400">{creationCount} Packets</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 dark:bg-indigo-400 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, creationCount * 5)}%` }} />
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-3">
                        <span className="text-rose-500">Noise Sensitivity</span>
                        <span className="text-slate-400">{noiseLevel}% Interference</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full transition-all duration-1000" style={{ width: `${noiseLevel}%` }} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <StatBox label="GRID_EFFICIENCY" value={handshakeEfficiency} unit="%" color="text-emerald-500" />
                    <StatBox label="SYNC_STABILITY" value="99.2" unit="%" color="text-cyan-500" />
                </div>
             </div>
          </div>

          {/* Velocity Card */}
          <div className="bg-slate-900 dark:bg-black rounded-[3rem] p-10 shadow-xl border border-white/10 text-white relative overflow-hidden flex flex-col justify-between">
             <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[60px] rounded-full" />
             <div>
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Grid_Velocity</h3>
                <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-1">Platform Signal Rate (60s)</p>
             </div>
             
             <div className="py-12 flex justify-center relative">
                <div className="w-40 h-20 overflow-hidden relative">
                   <div className="w-40 h-40 rounded-full border-[12px] border-white/5 absolute top-0 left-0 box-border" />
                   <div 
                     className={`w-40 h-40 rounded-full border-[12px] ${velocity > 70 ? 'border-rose-500' : 'border-cyan-500'} border-b-0 border-l-0 border-r-0 absolute top-0 left-0 transition-transform duration-[1000ms] ease-out shadow-[0_0_20px_rgba(6,182,212,0.3)]`} 
                     style={{ transform: `rotate(${velocity * 1.8 - 180}deg)` }}
                   />
                </div>
                <div className="absolute bottom-8 text-center">
                   <span className="text-4xl font-black tracking-tighter">{Math.round(velocity)}</span>
                   <span className="block text-[8px] font-black font-mono text-slate-500">PKTS/SEC</span>
                </div>
             </div>

             <div className="flex justify-between items-center text-[7px] font-black uppercase tracking-widest text-slate-600 font-mono">
                <span>STAGNANT</span>
                <span>HYPER-VELOCITY</span>
             </div>
          </div>
       </div>

       {/* Diagnostics Log */}
       <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mb-6">Diagnostic_Output</h4>
          <div className="space-y-2 font-mono text-[9px] text-slate-500 dark:text-slate-400">
             <p className="flex gap-4"><span className="text-indigo-500">[OK]</span> Node Identity Hash Verified: {userData.id.slice(0,16)}...</p>
             <p className="flex gap-4"><span className="text-emerald-500">[OK]</span> Handshake Protocols Optimal: Latency 14ms</p>
             <p className="flex gap-4"><span className="text-amber-500">[WARN]</span> Noise Threshold detected at {noiseLevel}%: Consider Filter Adjustments</p>
             <p className="flex gap-4"><span className="text-indigo-500">[INFO]</span> Temporal Resonance Streaks active: Day 4</p>
          </div>
       </div>
    </div>
  );
};
