
import React, { useState, useEffect, useRef } from 'react';
import { User, PresenceStatus } from '../../types';
import { ICONS } from '../../constants';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { doc, updateDoc } = Firestore as any;

interface ResiliencePageProps {
  userData: User;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ResiliencePage: React.FC<ResiliencePageProps> = ({ userData, addToast }) => {
  const [activeTab, setActiveTab] = useState<'monitor' | 'shield' | 'breath'>('monitor');
  const [vitalityScore, setVitalityScore] = useState(85);
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Inhale');
  const [velocity, setVelocity] = useState(12); // Mock signal velocity
  const [isFocusShieldActive, setIsFocusShieldActive] = useState(false);

  // Sync Focus Status
  useEffect(() => {
    setIsFocusShieldActive(['Deep Work', 'Focus', 'Invisible'].includes(userData.presenceStatus || ''));
  }, [userData.presenceStatus]);

  // Simulate Velocity Fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setVelocity(prev => Math.max(5, Math.min(100, prev + (Math.random() * 10 - 5))));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Breathing Logic
  useEffect(() => {
    if (!isBreathingActive) return;
    
    const cycle = async () => {
      setBreathPhase('Inhale');
      await new Promise(r => setTimeout(r, 4000));
      if (!isBreathingActive) return;
      
      setBreathPhase('Hold');
      await new Promise(r => setTimeout(r, 4000));
      if (!isBreathingActive) return;
      
      setBreathPhase('Exhale');
      await new Promise(r => setTimeout(r, 4000));
      if (!isBreathingActive) return;
      
      setBreathPhase('Rest');
      await new Promise(r => setTimeout(r, 2000));
      if (isBreathingActive) cycle();
    };
    
    cycle();
    return () => {}; // Cleanup not strictly needed due to state check
  }, [isBreathingActive]);

  const toggleFocusShield = async () => {
    if (!db || !userData.id) return;
    const newStatus: PresenceStatus = isFocusShieldActive ? 'Online' : 'Deep Work';
    const newMsg = isFocusShieldActive ? 'Systems nominal.' : 'Neural Shield Active. Notifications Muted.';
    
    try {
      await updateDoc(doc(db, 'users', userData.id), {
        presenceStatus: newStatus,
        statusMessage: newMsg
      });
      setIsFocusShieldActive(!isFocusShieldActive);
      addToast(isFocusShieldActive ? "Focus Shield Disengaged" : "Focus Shield Active", "success");
    } catch (e) {
      addToast("Shield Protocol Failed", "error");
    }
  };

  const calculateVitality = () => {
    // Mock Calculation
    let score = 80;
    if (userData.verifiedHuman) score += 5;
    if (userData.followers > 10) score += 5;
    if (userData.following < 500) score += 5;
    if (isFocusShieldActive) score += 5;
    return Math.min(100, score);
  };

  useEffect(() => {
    setVitalityScore(calculateVitality());
  }, [userData, isFocusShieldActive]);

  return (
    <div className="w-full max-w-[2400px] mx-auto pb-24 animate-in fade-in duration-700 space-y-8">
      
      {/* 1. HERO HEADER: VITALITY ENGINE */}
      <div className="relative rounded-[3.5rem] bg-emerald-950 p-10 md:p-14 text-white shadow-2xl border border-white/10 overflow-hidden group">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/20 blur-[120px] rounded-full translate-x-1/4 -translate-y-1/4 group-hover:bg-emerald-400/30 transition-colors duration-1000" />
         <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-500/10 blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />

         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
            <div className="space-y-4 max-w-xl">
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                  <ICONS.Resilience />
                  <span className="text-[9px] font-black text-white uppercase tracking-[0.3em] font-mono">Neural_Wellbeing_v2.0</span>
               </div>
               <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none text-white">
                 Resilience<br/><span className="text-emerald-400">Hub</span>
               </h1>
               <p className="text-xs font-medium text-emerald-100/80 leading-relaxed max-w-sm">
                 Monitor your digital integrity. Maintain balance between active creation and passive consumption to prevent neural fatigue.
               </p>
            </div>

            <div className="relative w-40 h-40 md:w-56 md:h-56 flex items-center justify-center shrink-0">
               {/* Radial Progress Simulation */}
               <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                  <circle 
                    cx="50" cy="50" r="45" fill="none" stroke="#34d399" strokeWidth="8" 
                    strokeDasharray="283" 
                    strokeDashoffset={283 - (283 * vitalityScore) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl md:text-5xl font-black text-white tracking-tighter">{vitalityScore}</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-emerald-300 font-mono">Vitality</span>
               </div>
            </div>
         </div>
      </div>

      {/* 2. NAVIGATION PILL */}
      <div className="sticky top-[calc(var(--header-h)+1rem)] z-30 flex justify-center px-4">
         <div className="bg-white/80 backdrop-blur-2xl border border-white/60 p-2 rounded-[2.5rem] shadow-lg flex gap-2 w-full max-w-md">
            {[
              { id: 'monitor', label: 'Monitor', icon: ICONS.Explore },
              { id: 'shield', label: 'Shields', icon: ICONS.Verified },
              { id: 'breath', label: 'Bio-Sync', icon: ICONS.Resilience }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                  activeTab === tab.id 
                    ? 'bg-emerald-950 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-900 hover:bg-white'
                }`}
              >
                {activeTab === tab.id && <div className="scale-75"><tab.icon /></div>}
                {tab.label}
              </button>
            ))}
         </div>
      </div>

      {/* 3. MODULE CONTENT */}
      
      {/* MONITOR MODULE */}
      {activeTab === 'monitor' && (
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
      )}

      {/* SHIELD MODULE */}
      {activeTab === 'shield' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-2 md:px-0 animate-in slide-in-from-bottom-4 duration-500">
           
           <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="relative z-10">
                 <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center mb-6 shadow-lg">
                    <ICONS.Verified />
                 </div>
                 <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-4">Focus_Shield</h3>
                 <p className="text-sm text-slate-600 font-medium mb-8 leading-relaxed">
                    Activate high-intensity cognitive protection. This protocol will auto-reject incoming call signals, mute notifications, and update your grid status to "Deep Work".
                 </p>
                 <button 
                   onClick={toggleFocusShield}
                   className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 ${isFocusShieldActive ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-slate-900 text-white hover:bg-indigo-600'}`}
                 >
                   {isFocusShieldActive ? 'DISENGAGE_SHIELD' : 'ENGAGE_SHIELD'}
                 </button>
              </div>
           </div>

           <div className="bg-slate-50 rounded-[3rem] p-10 border border-slate-200/60 flex flex-col justify-between">
              <div>
                 <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter mb-6">Sentiment_Mesh</h3>
                 <div className="space-y-4">
                    <div className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Feed_Temperature</span>
                       <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest font-mono">Positive</span>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Static_Filter</span>
                       <div className="w-10 h-5 bg-indigo-600 rounded-full relative cursor-pointer">
                          <div className="w-3 h-3 bg-white rounded-full absolute top-1 right-1 shadow-sm" />
                       </div>
                    </div>
                 </div>
              </div>
              <div className="mt-8 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-center">
                 <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] font-mono">AI_ANALYSIS</p>
                 <p className="text-xs font-bold text-indigo-900 mt-2 italic">"Your incoming stream is 85% harmonic. Low toxicity detected."</p>
              </div>
           </div>

        </div>
      )}

      {/* BIO-SYNC MODULE */}
      {activeTab === 'breath' && (
        <div className="px-2 md:px-0 animate-in slide-in-from-bottom-4 duration-500">
           <div className="bg-slate-950 rounded-[3.5rem] p-10 md:p-20 text-white text-center relative overflow-hidden shadow-2xl border border-white/5">
              <div className="absolute inset-0 bg-gradient-radial from-teal-900/40 to-slate-950 z-0" />
              
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
      )}

    </div>
  );
};
