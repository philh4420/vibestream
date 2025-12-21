
import React from 'react';
import { db } from '../../services/firebase';
import { updateDoc, doc } from 'firebase/firestore';
import { SystemSettings } from '../../types';

interface AdminKernelProps {
  systemSettings: SystemSettings;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdminKernel: React.FC<AdminKernelProps> = ({ systemSettings, addToast }) => {
  const handleUpdate = async (updates: Partial<SystemSettings>) => {
    try {
      await updateDoc(doc(db, 'settings', 'global'), updates);
      addToast('Kernel Synchronization Complete', 'success');
    } catch (e) {
      addToast('Kernel Update Refused', 'error');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 space-y-12 shadow-sm">
         <div className="border-b border-slate-50 pb-8">
            <h3 className="text-3xl font-black text-slate-950 tracking-tighter uppercase italic">Kernel_Security</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 font-mono">Master Infrastructure Overrides</p>
         </div>
         <div className="space-y-6">
            <div className="flex items-center justify-between p-8 bg-slate-950 text-white rounded-[2rem] border border-white/5 relative overflow-hidden group">
              <div className="absolute inset-0 bg-rose-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1 font-mono italic">EMERGENCY_LOCKDOWN</p>
                <p className="text-sm text-slate-400 font-bold">Global Maintenance Mode.</p>
              </div>
              <button 
                onClick={() => handleUpdate({ maintenanceMode: !systemSettings.maintenanceMode })} 
                className={`w-16 h-8 rounded-full transition-all relative z-10 ${systemSettings.maintenanceMode ? 'bg-rose-600' : 'bg-slate-800'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full transition-all duration-300 transform ${systemSettings.maintenanceMode ? 'translate-x-9' : 'translate-x-1'}`} />
              </button>
            </div>
            
            <div className="flex items-center justify-between p-8 bg-slate-50 border border-slate-100 rounded-[2rem] group hover:bg-white hover:shadow-lg transition-all">
              <div className="relative z-10">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1 font-mono italic">INGRESS_PROTOCOL</p>
                <p className="text-sm text-slate-500 font-bold">Registration Gateway.</p>
              </div>
              <button 
                onClick={() => handleUpdate({ registrationDisabled: !systemSettings.registrationDisabled })} 
                className={`w-16 h-8 rounded-full transition-all ${systemSettings.registrationDisabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full transition-all duration-300 transform ${systemSettings.registrationDisabled ? 'translate-x-9' : 'translate-x-1'}`} />
              </button>
            </div>
         </div>
      </div>

      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white flex flex-col justify-between shadow-xl relative overflow-hidden border border-white/5">
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
         <div className="relative z-10">
            <h3 className="text-[12px] font-black text-indigo-400 uppercase tracking-widest font-mono mb-10 italic">Authority_Matrix</h3>
            <div className="space-y-4">
              {(['Alpha', 'Beta', 'Gamma'] as const).map(tier => (
                <button 
                  key={tier}
                  onClick={() => handleUpdate({ minTrustTier: tier })}
                  className={`w-full flex items-center justify-between p-6 rounded-2xl border transition-all active:scale-95 ${systemSettings.minTrustTier === tier ? 'bg-white text-slate-950 border-white shadow-xl scale-105' : 'bg-white/5 border-white/10 text-slate-600 hover:bg-white/10'}`}
                >
                  <span className="text-[11px] font-black uppercase tracking-widest font-mono">{tier}_TRUST_TIER</span>
                  {systemSettings.minTrustTier === tier && <div className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(79,70,229,1)]" />}
                </button>
              ))}
            </div>
         </div>
         <div className="pt-10 border-t border-white/5 mt-10 relative z-10 text-center">
           <p className="text-[9px] font-mono text-slate-700 uppercase tracking-widest italic mb-1">SYSTEM_ROOT_ID</p>
           <p className="text-[10px] font-mono text-indigo-400/50 uppercase tracking-widest truncate">ESTABLISHED_2026_GB</p>
         </div>
      </div>
    </div>
  );
};
