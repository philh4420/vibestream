
import React, { useState, useEffect } from 'react';

export const ResilienceMonitor: React.FC = () => {
  const [velocity, setVelocity] = useState(12); // Internal simulation for visual effect

  // Simulate Velocity Fluctuation locally
  useEffect(() => {
    const interval = setInterval(() => {
      setVelocity(prev => Math.max(5, Math.min(100, prev + (Math.random() * 10 - 5))));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2 md:px-0 animate-in slide-in-from-bottom-4 duration-500">
           
       {/* Hygiene Card */}
       <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100 col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Neural_Hygiene</h3>
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] font-mono">Today's Ratio</span>
          </div>
          <div className="space-y-6">
             <div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                   <span className="text-indigo-600">Creation (Active)</span>
                   <span className="text-slate-400">35%</span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-indigo-600 rounded-full w-[35%]" />
                </div>
             </div>
             <div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                   <span className="text-rose-500">Consumption (Passive)</span>
                   <span className="text-slate-400">65%</span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-rose-500 rounded-full w-[65%]" />
                </div>
             </div>
          </div>
          <p className="mt-8 text-xs text-slate-500 font-medium leading-relaxed">
             You are spending more time consuming than creating. Consider initiating a new signal or engaging in a cluster discussion to balance your neural load.
          </p>
       </div>

       {/* Velocity Gauge */}
       <div className="bg-slate-900 rounded-[3rem] p-8 shadow-xl border border-white/10 text-white relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/20 blur-[60px] rounded-full" />
          <div>
             <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Signal_Velocity</h3>
             <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mt-1">Information Intake Rate</p>
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
                <span className="text-[8px] block font-mono text-slate-400">BPM</span>
             </div>
          </div>

          <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-slate-500 font-mono">
             <span>Calm</span>
             <span>Overload</span>
          </div>
       </div>
    </div>
  );
};
