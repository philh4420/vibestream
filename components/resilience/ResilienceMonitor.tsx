
import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { collection, query, where, getDocs, orderBy } = Firestore as any;

interface ResilienceMonitorProps {
  userData: User;
}

export const ResilienceMonitor: React.FC<ResilienceMonitorProps> = ({ userData }) => {
  const [velocity, setVelocity] = useState(0); 
  const [creationCount, setCreationCount] = useState(0);
  const [consumptionPotential, setConsumptionPotential] = useState(userData.following || 1);

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
            setVelocity(Math.min(vSnap.size, 100));
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
        } catch (e) {
            console.error("Hygiene sync error", e);
        }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, [userData.id]);

  const totalActivity = creationCount + consumptionPotential;
  const creationPct = totalActivity > 0 ? Math.round((creationCount / totalActivity) * 100) : 0;
  const consumptionPct = 100 - creationPct;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
           
       {/* Hygiene Card */}
       <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Neural_Hygiene</h3>
             <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] font-mono">Live Ratio</span>
          </div>
          <div className="space-y-6">
             <div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                   <span className="text-indigo-600 dark:text-indigo-400">Creation (Active Signals)</span>
                   <span className="text-slate-400 dark:text-slate-500">{creationCount} Posts ({creationPct}%)</span>
                </div>
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${Math.max(5, creationPct)}%` }} />
                </div>
             </div>
             <div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                   <span className="text-rose-500 dark:text-rose-400">Consumption (Network Load)</span>
                   <span className="text-slate-400 dark:text-slate-500">{consumptionPotential} Nodes ({consumptionPct}%)</span>
                </div>
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-rose-500 rounded-full transition-all duration-1000" style={{ width: `${Math.max(5, consumptionPct)}%` }} />
                </div>
             </div>
          </div>
          <p className="mt-8 text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
             {creationPct < 10 
                ? "Your active signal output is low relative to your network intake. Consider broadcasting to balance your neural load."
                : "Your creation-to-consumption ratio is healthy. Neural systems operating at optimal efficiency."}
          </p>
       </div>

       {/* Velocity Gauge */}
       <div className="bg-slate-900 dark:bg-black rounded-[3rem] p-8 shadow-xl border border-white/10 dark:border-slate-800 text-white relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/20 blur-[60px] rounded-full" />
          <div>
             <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Signal_Velocity</h3>
             <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mt-1">Global Broadcast Rate (1h)</p>
          </div>
          
          <div className="py-8 flex justify-center relative">
             <div className="w-40 h-20 overflow-hidden relative">
                <div className="w-40 h-40 rounded-full border-[12px] border-slate-700 border-b-0 border-l-0 border-r-0 absolute top-0 left-0 box-border" />
                <div 
                  className={`w-40 h-40 rounded-full border-[12px] ${velocity > 80 ? 'border-rose-500' : velocity > 50 ? 'border-amber-500' : 'border-emerald-500'} border-b-0 border-l-0 border-r-0 absolute top-0 left-0 transition-transform duration-500 ease-out`} 
                  style={{ transform: `rotate(${velocity * 1.8 - 180}deg)` }}
                />
             </div>
             <div className="absolute bottom-8 text-center">
                <span className="text-3xl font-black tracking-tighter">{Math.round(velocity)}</span>
                <span className="text-[8px] block font-mono text-slate-400">P/Hr</span>
             </div>
          </div>

          <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-slate-500 font-mono">
             <span>Calm</span>
             <span>Surge</span>
          </div>
       </div>
    </div>
  );
};
