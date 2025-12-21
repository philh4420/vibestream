import React from 'react';
import { auth, db } from '../../services/firebase';
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
      addToast('Kernel Protocol Synchronised', 'success');
    } catch (e) {
      addToast('Sync Refused: High Authority required', 'error');
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 animate-in zoom-in-95 duration-500">
      <div className="bg-white border-precision rounded-[4.5rem] p-16 space-y-16 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)]">
         <div className="border-b border-slate-50 pb-10">
            <h3 className="text-4xl font-black text-slate-950 tracking-tighter uppercase italic">Kernel_Security_Suite</h3>
            <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] mt-3 font-mono">Low-Level System Override Access</p>
         </div>
         <div className="space-y-8">
            <div className="flex items-center justify-between p-10 bg-slate-950 text-white rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-rose-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="min-w-0 pr-10 relative z-10">
                <p className="text-[11px] font-black text-rose-400 uppercase tracking-[0.6em] mb-3 font-mono italic">EMERGENCY_LOCKDOWN_PROTOCOL</p>
                <p className="text-lg text-slate-400 font-bold truncate">Maintenance Mode Override.</p>
              </div>
              <button 
                onClick={() => handleUpdate({ maintenanceMode: !systemSettings.maintenanceMode })} 
                className={`w-20 h-11 rounded-full border-4 transition-all shrink-0 relative z-10 ${systemSettings.maintenanceMode ? 'bg-rose-600 border-rose-500' : 'bg-slate-800 border-slate-700'}`}
              >
                <div className={`w-7 h-7 bg-white rounded-full transition-all duration-500 ease-[cubic-bezier(0.85,0,0.15,1)] ${systemSettings.maintenanceMode ? 'translate-x-9 shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-10 bg-slate-50 border border-slate-100 rounded-[3.5rem] group hover:bg-white hover:shadow-2xl transition-all duration-500">
              <div className="min-w-0 pr-10">
                <p className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.6em] mb-3 font-mono italic">REGISTRATION_GATEWAY_SYNC</p>
                <p className="text-lg text-slate-500 font-bold italic truncate">Global Node Ingress Policy.</p>
              </div>
              <button 
                onClick={() => handleUpdate({ registrationDisabled: !systemSettings.registrationDisabled })} 
                className={`w-20 h-11 rounded-full border-4 transition-all shrink-0 ${systemSettings.registrationDisabled ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-300 border-slate-200'}`}
              >
                <div className={`w-7 h-7 bg-white rounded-full transition-all duration-500 ease-[cubic-bezier(0.85,0,0.15,1)] ${systemSettings.registrationDisabled ? 'translate-x-9 shadow-[0_0_20px_rgba(79,70,229,0.4)]' : 'translate-x-1'}`} />
              </button>
            </div>
         </div>
      </div>

      <div className="bg-slate-950 rounded-[4.5rem] p-16 text-white flex flex-col justify-between shadow-3xl relative overflow-hidden border border-white/5">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[200px] rounded-full -translate-y-1/2 translate-x-1/2" />
         <div className="relative z-10">
            <h3 className="text-[14px] font-black text-indigo-400 uppercase tracking-[0.7em] font-mono mb-14 italic">Identity_Authority_Architecture</h3>
            <div className="space-y-5">
              {(['Alpha', 'Beta', 'Gamma'] as const).map(tier => (
                <button 
                  key={tier}
                  onClick={() => handleUpdate({ minTrustTier: tier })}
                  className={`w-full flex items-center justify-between p-8 rounded-[2.5rem] border transition-all duration-700 active:scale-95 ${systemSettings.minTrustTier === tier ? 'bg-white text-slate-950 border-white shadow-[0_30px_70px_rgba(255,255,255,0.1)] scale-105' : 'bg-white/5 border-white/10 text-slate-600 hover:bg-white/10 hover:text-white'}`}
                >
                  <div className="flex items-center gap-6">
                    <span className="text-[14px] font-black uppercase tracking-[0.4em] font-mono">{tier}_AUTHORITY</span>
                    {systemSettings.minTrustTier === tier && <span className="bg-indigo-600 text-white text-[9px] px-3 py-1 rounded-lg font-black tracking-widest">ACTIVE</span>}
                  </div>
                  {systemSettings.minTrustTier === tier && <div className="w-3.5 h-3.5 bg-indigo-600 rounded-full animate-ping shadow-[0_0_15px_rgba(79,70,229,1)]" />}
                </button>
              ))}
            </div>
         </div>
         <div className="pt-16 border-t border-white/5 mt-16 relative z-10 text-center">
           <p className="text-[11px] font-mono text-slate-700 uppercase tracking-[0.6em] italic mb-2">ROOT_COMMAND_HASH_LOCK</p>
           <p className="text-[13px] font-mono text-indigo-400/50 uppercase tracking-widest truncate">{auth.currentUser?.uid.toUpperCase()}</p>
         </div>
      </div>
    </div>
  );
};
