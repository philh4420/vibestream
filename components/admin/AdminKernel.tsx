
import React from 'react';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { setDoc, doc } = Firestore as any;
import { SystemSettings } from '../../types';
import { ICONS } from '../../constants';

interface AdminKernelProps {
  systemSettings: SystemSettings;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdminKernel: React.FC<AdminKernelProps> = ({ systemSettings, addToast }) => {
  const handleUpdate = async (updates: Partial<SystemSettings>) => {
    try {
      // Use setDoc with merge: true to handle case where document doesn't exist yet
      await setDoc(doc(db, 'settings', 'global'), updates, { merge: true });
      addToast('Kernel Synchronization Complete', 'success');
    } catch (e) {
      console.error(e);
      addToast('Kernel Update Refused', 'error');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
      
      {/* Danger Zone: Critical Overrides */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-10 shadow-sm space-y-10 relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-2 bg-[repeating-linear-gradient(45deg,#e11d48,#e11d48_10px,#fff_10px,#fff_20px)] opacity-20" />
         
         <div className="border-b border-slate-50 dark:border-slate-800 pb-8">
            <h3 className="text-3xl font-black text-slate-950 dark:text-white tracking-tighter uppercase italic">Kernel_Security</h3>
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] mt-2 font-mono">Master Infrastructure Overrides</p>
         </div>
         
         <div className="space-y-6">
            {/* Maintenance Mode */}
            <div className={`flex items-center justify-between p-6 rounded-[2rem] border transition-all duration-300 ${systemSettings.maintenanceMode ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-900' : 'bg-slate-950 dark:bg-black text-white border-slate-900 dark:border-slate-800'}`}>
              <div className="flex-1 pr-6">
                <div className="flex items-center gap-2 mb-2">
                   <div className={`w-2 h-2 rounded-full ${systemSettings.maintenanceMode ? 'bg-rose-600 animate-ping' : 'bg-emerald-500'}`} />
                   <p className="text-[9px] font-black uppercase tracking-widest font-mono">
                     {systemSettings.maintenanceMode ? 'SYSTEM_LOCKED' : 'SYSTEM_LIVE'}
                   </p>
                </div>
                <p className={`text-lg font-black uppercase italic tracking-tight leading-none mb-1 ${systemSettings.maintenanceMode ? 'text-rose-900 dark:text-rose-400' : 'text-white'}`}>Emergency Lockdown</p>
                <p className={`text-[10px] font-bold ${systemSettings.maintenanceMode ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                  Prevents all user access. Admin only.
                </p>
              </div>
              <button 
                onClick={() => handleUpdate({ maintenanceMode: !systemSettings.maintenanceMode })} 
                className={`w-16 h-10 rounded-full transition-all relative p-1 ${systemSettings.maintenanceMode ? 'bg-rose-600' : 'bg-slate-700'}`}
              >
                <div className={`w-8 h-8 bg-white rounded-full transition-all duration-300 shadow-lg transform ${systemSettings.maintenanceMode ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
            
            {/* Registration Toggle */}
            <div className="flex items-center justify-between p-6 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[2rem] shadow-sm hover:shadow-lg transition-all">
              <div className="flex-1 pr-6">
                <p className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-1 font-mono">INGRESS_GATEWAY</p>
                <p className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tight leading-none">Registration</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1">Allow new node creation.</p>
              </div>
              <button 
                onClick={() => handleUpdate({ registrationDisabled: !systemSettings.registrationDisabled })} 
                className={`w-16 h-10 rounded-full transition-all relative p-1 ${systemSettings.registrationDisabled ? 'bg-slate-200 dark:bg-slate-700' : 'bg-indigo-600'}`}
              >
                <div className={`w-8 h-8 bg-white rounded-full transition-all duration-300 shadow-lg transform ${systemSettings.registrationDisabled ? 'translate-x-0' : 'translate-x-6'}`} />
              </button>
            </div>
         </div>
      </div>

      {/* Authority Matrix */}
      <div className="bg-slate-900 dark:bg-black rounded-[3rem] p-10 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden border border-white/5 dark:border-slate-800">
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
         
         <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
               <div className="p-2 bg-white/10 rounded-xl border border-white/10">
                  <ICONS.Verified />
               </div>
               <div>
                  <h3 className="text-xl font-black uppercase tracking-widest italic">Trust_Matrix</h3>
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] font-mono">Access Level Clearance</p>
               </div>
            </div>

            <div className="space-y-4">
              {(['Alpha', 'Beta', 'Gamma'] as const).map(tier => (
                <button 
                  key={tier}
                  onClick={() => handleUpdate({ minTrustTier: tier })}
                  className={`w-full flex items-center justify-between p-5 rounded-[1.8rem] border transition-all active:scale-95 group ${
                    systemSettings.minTrustTier === tier 
                      ? 'bg-white text-slate-950 border-white shadow-xl scale-[1.02]' 
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                     <div className={`w-3 h-3 rounded-full border-2 ${systemSettings.minTrustTier === tier ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600 bg-transparent'}`} />
                     <span className="text-xs font-black uppercase tracking-widest font-mono">{tier}_TIER</span>
                  </div>
                  {systemSettings.minTrustTier === tier && (
                     <span className="text-[8px] font-black bg-slate-900 text-white px-2 py-1 rounded-md uppercase tracking-widest">ACTIVE</span>
                  )}
                </button>
              ))}
            </div>
         </div>

         <div className="pt-8 border-t border-white/10 mt-10 relative z-10 flex justify-between items-end opacity-50">
           <div>
              <p className="text-[8px] font-mono text-indigo-300 uppercase tracking-widest font-black mb-1">ROOT_AUTHORITY_ID</p>
              <p className="text-[10px] font-mono text-white uppercase tracking-widest font-bold">SYS_ADMIN_01</p>
           </div>
           <ICONS.Admin />
         </div>
      </div>
    </div>
  );
};
