
import React, { useState } from 'react';
import { User } from '../../types';

interface CalibrationOverlayProps {
  userData: User;
  onClose: () => void;
  onSave: (newData: any) => void;
}

export const CalibrationOverlay: React.FC<CalibrationOverlayProps> = ({ userData, onClose, onSave }) => {
  const [activeSubTab, setActiveSubTab] = useState<'basic' | 'professional' | 'social'>('basic');
  const [form, setForm] = useState({
    displayName: userData.displayName,
    bio: userData.bio,
    location: userData.location,
    dob: userData.dob || '2000-01-01',
    pronouns: userData.pronouns || '',
    website: userData.website || '',
    tags: userData.tags?.join(', ') || '',
    occupation: userData.occupation || '',
    education: userData.education || '',
    relationshipStatus: userData.relationshipStatus || 'Single'
  });

  const handleSubmit = () => {
    const processedData = {
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(t => t !== '')
    };
    onSave(processedData);
  };

  const InputField = ({ label, type = "text", value, onChange, placeholder }: any) => (
    <div className="space-y-2 group">
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 font-mono group-focus-within:text-indigo-500 transition-colors">{label}</label>
      <input 
        type={type} 
        value={value} 
        placeholder={placeholder}
        onChange={onChange} 
        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300" 
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xl" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-precision animate-in slide-in-from-bottom-12 duration-500">
        
        {/* Modal Header */}
        <div className="shrink-0 p-8 md:p-12 pb-0 flex justify-between items-start">
           <div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Node_Calibration</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Synchronise Neural Identity Clusters</p>
           </div>
           <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>

        {/* Modal Nav */}
        <div className="px-8 md:px-12 mt-8 flex gap-8 border-b border-slate-50">
           {(['basic', 'professional', 'social'] as const).map(tab => (
             <button 
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`pb-4 text-[10px] font-black uppercase tracking-widest font-mono transition-all relative ${activeSubTab === tab ? 'text-indigo-600' : 'text-slate-400'}`}
             >
               {tab}
               {activeSubTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-full" />}
             </button>
           ))}
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-8 scroll-container">
          {activeSubTab === 'basic' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Public Identity" value={form.displayName} onChange={(e: any) => setForm({...form, displayName: e.target.value})} />
                <InputField label="Geo Node Location" value={form.location} onChange={(e: any) => setForm({...form, location: e.target.value})} />
              </div>
              <div className="space-y-2 group">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 font-mono group-focus-within:text-indigo-500">Identity Signature (Bio)</label>
                <textarea 
                  value={form.bio} 
                  onChange={e => setForm({...form, bio: e.target.value})} 
                  className="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium resize-none outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" 
                />
              </div>
            </div>
          )}

          {activeSubTab === 'professional' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Current Occupation" value={form.occupation} onChange={(e: any) => setForm({...form, occupation: e.target.value})} placeholder="e.g. Creative Director" />
                <InputField label="Education Hub" value={form.education} onChange={(e: any) => setForm({...form, education: e.target.value})} placeholder="e.g. Oxford University" />
              </div>
              <InputField label="Personal Port (URL)" type="url" value={form.website} onChange={(e: any) => setForm({...form, website: e.target.value})} placeholder="https://..." />
            </div>
          )}

          {activeSubTab === 'social' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Origin Date (DOB)" type="date" value={form.dob} onChange={(e: any) => setForm({...form, dob: e.target.value})} />
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 font-mono">Encoded Status</label>
                   <select value={form.relationshipStatus} onChange={e => setForm({...form, relationshipStatus: e.target.value as any})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all">
                      <option value="Single">Independent</option>
                      <option value="Partnered">Partnered</option>
                      <option value="Married">Married</option>
                      <option value="Encoded">Encoded</option>
                      <option value="Private">Privacy Mesh</option>
                   </select>
                </div>
              </div>
              <InputField label="Identity Tags (Comma Separated)" value={form.tags} onChange={(e: any) => setForm({...form, tags: e.target.value})} placeholder="Design, AI, London" />
              <InputField label="Biometric ID (Pronouns)" value={form.pronouns} onChange={(e: any) => setForm({...form, pronouns: e.target.value})} placeholder="they/them" />
            </div>
          )}
        </div>
        
        {/* Modal Footer */}
        <div className="shrink-0 p-8 md:p-12 pt-0 flex gap-4 bg-white">
          <button onClick={onClose} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-200 transition-all active:scale-95">Abort_Sync</button>
          <button onClick={handleSubmit} className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95">Synchronise</button>
        </div>
      </div>
    </div>
  );
};
