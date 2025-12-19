
import React, { useState } from 'react';
import { User } from '../../types';

interface CalibrationOverlayProps {
  userData: User;
  onClose: () => void;
  onSave: (newData: any) => void;
}

export const CalibrationOverlay: React.FC<CalibrationOverlayProps> = ({ userData, onClose, onSave }) => {
  const [form, setForm] = useState({
    displayName: userData.displayName,
    bio: userData.bio,
    location: userData.location,
    dob: userData.dob || '2000-01-01',
    pronouns: userData.pronouns || '',
    website: userData.website || '',
    tags: userData.tags?.join(', ') || ''
  });

  const handleSubmit = () => {
    const processedData = {
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(t => t !== '')
    };
    onSave(processedData);
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xl" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-precision animate-in slide-in-from-bottom-12 duration-500">
        
        <div className="shrink-0 p-8 md:p-12 pb-0 flex justify-between items-start">
           <div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Node_Calibration</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Synchronise personal identity clusters</p>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-10 scroll-container">
          <div className="space-y-6">
             <h3 className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em] font-mono border-b border-slate-100 pb-2">Surface_Metadata</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono ml-1">Label</label>
                   <input 
                      type="text" 
                      value={form.displayName} 
                      onChange={e => setForm(prev => ({...prev, displayName: e.target.value}))} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold transition-all" 
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono ml-1">Geo Node</label>
                   <input 
                      type="text" 
                      value={form.location} 
                      onChange={e => setForm(prev => ({...prev, location: e.target.value}))} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold transition-all" 
                   />
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono ml-1">Neural Bio Signature</label>
                <textarea 
                   value={form.bio} 
                   onChange={e => setForm(prev => ({...prev, bio: e.target.value}))} 
                   className="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none font-medium leading-relaxed transition-all" 
                />
             </div>
          </div>

          <div className="space-y-6">
             <h3 className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em] font-mono border-b border-slate-100 pb-2">Identity_Clusters</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono ml-1">Origins (DOB)</label>
                   <input 
                      type="date" 
                      value={form.dob} 
                      onChange={e => setForm(prev => ({...prev, dob: e.target.value}))} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold transition-all" 
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono ml-1">Pronouns</label>
                   <input 
                      type="text" 
                      placeholder="e.g. they/them"
                      value={form.pronouns} 
                      onChange={e => setForm(prev => ({...prev, pronouns: e.target.value}))} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold transition-all" 
                   />
                </div>
             </div>
          </div>

          <div className="space-y-6">
             <h3 className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em] font-mono border-b border-slate-100 pb-2">Network_Connectivity</h3>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono ml-1">Hyperlink Node</label>
                <input 
                   type="url" 
                   placeholder="https://your-node.com"
                   value={form.website} 
                   onChange={e => setForm(prev => ({...prev, website: e.target.value}))} 
                   className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold transition-all" 
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono ml-1">Interest Mesh</label>
                <input 
                   type="text" 
                   placeholder="Web3, Design, AI"
                   value={form.tags} 
                   onChange={e => setForm(prev => ({...prev, tags: e.target.value}))} 
                   className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold transition-all" 
                />
             </div>
          </div>
        </div>
        
        <div className="shrink-0 p-8 md:p-12 pt-0 flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-200 transition-all">Abort</button>
          <button onClick={handleSubmit} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95">Synchronise</button>
        </div>
      </div>
    </div>
  );
};
