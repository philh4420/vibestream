
import React, { useState } from 'react';
import { User } from '../../../types';
import { db } from '../../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { doc, updateDoc } = Firestore as any;
import { ICONS } from '../../../constants';
import { DeleteConfirmationModal } from '../../ui/DeleteConfirmationModal';

interface SettingsAccountProps {
  userData: User;
  onLogout: () => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SettingsAccount: React.FC<SettingsAccountProps> = ({ userData, onLogout, addToast }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  const handleTwoFactorToggle = () => {
    // Simulation of 2FA handshake
    addToast("2FA Request Sent: Check your secure device", "info");
  };

  const handleDataDownload = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(userData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `vibestream_archive_${userData.username}_${Date.now()}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      addToast("Neural Archive Extracted Successfully", "success");
    } catch (e) {
      addToast("Extraction Protocol Failed", "error");
    }
  };

  const executeDeactivation = async () => {
    setIsProcessing(true);
    setShowDeactivateModal(false); // Close modal immediately to show processing state in button if needed, or keep open. Better to close and show toast.
    
    try {
      await updateDoc(doc(db, 'users', userData.id), {
        isSuspended: true,
        presenceStatus: 'Offline'
      });
      addToast("Node Deactivation Confirmed. Terminating...", "info");
      
      // Delay logout slightly to allow toast to be seen
      setTimeout(() => {
        onLogout();
      }, 1500);
    } catch (e) {
      console.error(e);
      addToast("Deactivation Sequence Failed", "error");
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="p-8 rounded-[2.5rem] bg-slate-900 text-white shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full translate-x-1/3 -translate-y-1/3" />
        <div className="relative z-10 flex items-center gap-6">
          <div className="relative">
            <img src={userData.avatarUrl} className="w-24 h-24 rounded-[1.8rem] object-cover bg-slate-800 border-4 border-white/10" alt="" />
            {userData.verifiedHuman && <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-1.5 rounded-xl text-white shadow-lg border-2 border-slate-900"><ICONS.Verified /></div>}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h4 className="text-2xl font-black italic tracking-tight">{userData.displayName}</h4>
              <span className="px-2 py-0.5 rounded-md bg-white/10 text-[8px] font-black uppercase tracking-widest border border-white/10">{userData.role}</span>
            </div>
            <p className="text-sm font-mono text-slate-400 mb-4">ID: {userData.id.slice(0,8).toUpperCase()}</p>
            <button className="text-[9px] font-black uppercase tracking-widest text-indigo-300 hover:text-white transition-colors flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 hover:bg-white/10">
              Request_Verification_Badge <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-6 pl-1">
          <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] font-mono mb-1">Security_Protocol</h3>
          <p className="text-lg font-black text-slate-900 italic tracking-tight">Credentials & Access</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={handleTwoFactorToggle}
            className="p-6 rounded-[2rem] border border-slate-200 hover:border-indigo-200 bg-white hover:shadow-lg transition-all text-left group active:scale-[0.98]"
          >
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ICONS.Admin />
            </div>
            <p className="text-xs font-black text-slate-900 uppercase tracking-wide mb-1">2-Factor Auth</p>
            <p className="text-[10px] text-slate-500 font-medium">Secure your node with biometric hardware keys.</p>
          </button>
          <button 
            onClick={handleDataDownload}
            className="p-6 rounded-[2rem] border border-slate-200 hover:border-indigo-200 bg-white hover:shadow-lg transition-all text-left group active:scale-[0.98]"
          >
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ICONS.Saved />
            </div>
            <p className="text-xs font-black text-slate-900 uppercase tracking-wide mb-1">Data Download</p>
            <p className="text-[10px] text-slate-500 font-medium">Export your neural footprint archive.</p>
          </button>
        </div>
      </div>

      <div className="pt-8 border-t border-slate-100">
        <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] font-mono mb-4">Danger_Zone</h4>
        <div className="p-6 rounded-[2rem] bg-rose-50/50 border border-rose-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black text-rose-900">Deactivate Node</p>
            <p className="text-[10px] text-rose-700/60 mt-1 max-w-sm">This will temporarily hide your profile and signals. You can reactivate anytime by logging in.</p>
          </div>
          <button 
            onClick={() => setShowDeactivateModal(true)}
            disabled={isProcessing}
            className="px-6 py-3 bg-white border border-rose-200 text-rose-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            {isProcessing ? 'TERMINATING...' : 'Deactivate'}
          </button>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={showDeactivateModal}
        title="NODE_DEACTIVATION"
        description="CRITICAL WARNING: This will suspend your digital presence and hide all signals from the grid. You will be logged out immediately. This action can be reversed by re-authenticating."
        onConfirm={executeDeactivation}
        onCancel={() => setShowDeactivateModal(false)}
        confirmText="CONFIRM_DEACTIVATION"
      />
    </div>
  );
};
