
import React, { useState, useRef } from 'react';
import { User, PresenceStatus } from '../../types';
import { uploadToCloudinary } from '../../services/cloudinary';
import { ICONS } from '../../constants';

interface CalibrationOverlayProps {
  userData: User;
  onClose: () => void;
  onSave: (newData: any) => void;
}

const PRONOUN_OPTIONS = [
  'Not Specified', 'They/Them', 'He/Him', 'She/Her', 'He/They', 'She/They',
  'Xe/Xem', 'Ze/Zir', 'Ey/Em', 'Per/Per', 'Fae/Faer', 'Fluid', 'Private/Encrypted'
];

const PRESENCE_OPTIONS: PresenceStatus[] = ['Online', 'Focus', 'Invisible', 'Away'];

const RELATIONSHIP_OPTIONS = ['Single', 'Partnered', 'Married', 'Encoded', 'Private'];

// Internal helper for clean UI inputs
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

export const CalibrationOverlay: React.FC<CalibrationOverlayProps> = ({ userData, onClose, onSave }) => {
  const [activeSubTab, setActiveSubTab] = useState<'core' | 'visuals' | 'social' | 'professional'>('core');
  const [isUploading, setIsUploading] = useState<string | null>(null);
  
  // Fully restored and extended 2026 Profile Form
  const [form, setForm] = useState({
    displayName: userData.displayName || '',
    bio: userData.bio || '',
    location: userData.location || '',
    avatarUrl: userData.avatarUrl || '',
    coverUrl: userData.coverUrl || '',
    dob: userData.dob || '',
    pronouns: userData.pronouns || 'Not Specified',
    occupation: userData.occupation || '',
    education: userData.education || '',
    relationshipStatus: userData.relationshipStatus || 'Single',
    website: userData.website || '',
    tags: (userData.tags || []).join(', '),
    skills: (userData.skills || []).join(', '),
    hobbies: (userData.hobbies || []).join(', '),
    presenceStatus: userData.presenceStatus || 'Online',
    lifeEvents: userData.lifeEvents || []
  });

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(type);
    try {
      const url = await uploadToCloudinary(file);
      setForm(prev => ({ ...prev, [type === 'avatar' ? 'avatarUrl' : 'coverUrl']: url }));
    } catch (err) {
      console.error("Neural Uplink Failure:", err);
    } finally {
      setIsUploading(null);
    }
  };

  const handleCommit = () => {
    const processedData = {
      ...form,
      tags: form.tags.split(',').map(t => t.trim()).filter(t => t !== ''),
      skills: form.skills.split(',').map(s => s.trim()).filter(s => s !== ''),
      hobbies: form.hobbies.split(',').map(h => h.trim()).filter(h => h !== ''),
    };
    onSave(processedData);
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl" onClick={onClose}></div>
      
      <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[90vh] border border-white/20 animate-in zoom-in-95 duration-500">
        
        {/* Header Section */}
        <div className="shrink-0 p-8 md:p-10 pb-0 flex justify-between items-start bg-gradient-to-b from-slate-50/50 to-transparent">
           <div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Node_Calibration</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Full Infrastructure Sync • GB_EN</p>
           </div>
           <button onClick={onClose} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all text-slate-500 active:scale-90">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-8 md:px-10 mt-8 flex gap-8 border-b border-slate-50 overflow-x-auto no-scrollbar">
           {(['core', 'visuals', 'social', 'professional'] as const).map(tab => (
             <button 
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`pb-4 text-[10px] font-black uppercase tracking-[0.3em] font-mono transition-all relative whitespace-nowrap ${activeSubTab === tab ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
             >
               {tab}
               {activeSubTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-indigo-600 rounded-full" />}
             </button>
           ))}
        </div>
        
        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-8 scroll-container">
          {activeSubTab === 'core' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Public Identity" value={form.displayName} onChange={(e: any) => setForm({...form, displayName: e.target.value})} />
                <InputField label="Geo Node Link" value={form.location} onChange={(e: any) => setForm({...form, location: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 font-mono">Identity Bio Signature</label>
                <textarea 
                  value={form.bio} 
                  onChange={e => setForm({...form, bio: e.target.value})} 
                  className="w-full h-24 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold resize-none outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-300" 
                  placeholder="Describe your node's function in the network..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 font-mono">Biometric ID (Pronouns)</label>
                   <select value={form.pronouns} onChange={e => setForm({...form, pronouns: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none cursor-pointer">
                      {PRONOUN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 font-mono">Presence State</label>
                   <select value={form.presenceStatus} onChange={e => setForm({...form, presenceStatus: e.target.value as any})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none">
                      {PRESENCE_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                   </select>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'visuals' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="space-y-4">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 font-mono">Environment_Mesh (Cover)</label>
                  <div 
                    className="relative h-44 w-full rounded-3xl overflow-hidden bg-slate-100 group cursor-pointer border-2 border-dashed border-slate-200 hover:border-indigo-500/50 transition-all"
                    onClick={() => coverInputRef.current?.click()}
                  >
                     <img src={form.coverUrl} className={`w-full h-full object-cover transition-opacity duration-500 ${isUploading === 'cover' ? 'opacity-30' : 'opacity-100'}`} alt="" />
                     <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="bg-white/90 backdrop-blur-xl px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl">Update Environment</span>
                     </div>
                     {isUploading === 'cover' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/40">
                           <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin" />
                        </div>
                     )}
                     <input type="file" ref={coverInputRef} className="hidden" accept="image/*,video/*" onChange={(e) => handleFileUpload(e, 'cover')} />
                  </div>
               </div>

               <div className="space-y-4">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 font-mono">Identity_Core (Avatar)</label>
                  <div className="flex items-center gap-8 bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100">
                     <div 
                        className="relative w-32 h-32 rounded-[2.2rem] overflow-hidden bg-white group cursor-pointer border-2 border-dashed border-slate-200 hover:border-indigo-500/50 transition-all shrink-0 shadow-sm"
                        onClick={() => avatarInputRef.current?.click()}
                     >
                        <img src={form.avatarUrl} className={`w-full h-full object-cover ${isUploading === 'avatar' ? 'opacity-30' : 'opacity-100'}`} alt="" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
                           <span className="bg-white p-3 rounded-xl shadow-xl"><ICONS.Create /></span>
                        </div>
                        {isUploading === 'avatar' && (
                           <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin" />
                           </div>
                        )}
                        <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'avatar')} />
                     </div>
                     <div className="space-y-2">
                        <p className="text-sm font-black text-slate-900 tracking-tight">Biometric Neural Profile</p>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed max-w-[200px]">Supports all modern formats. High-resolution processing enabled.</p>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeSubTab === 'social' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <InputField label="Web Uplink" value={form.website} onChange={(e: any) => setForm({...form, website: e.target.value})} placeholder="https://yournode.io" />
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 font-mono">Status Mask</label>
                   <select value={form.relationshipStatus} onChange={e => setForm({...form, relationshipStatus: e.target.value as any})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none">
                      {RELATIONSHIP_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                   </select>
                </div>
                <InputField label="Origin (DOB)" type="date" value={form.dob} onChange={(e: any) => setForm({...form, dob: e.target.value})} />
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 font-mono">Hobbies_Array (Comma Separated)</label>
                   <input 
                      value={form.hobbies} 
                      onChange={e => setForm({...form, hobbies: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" 
                   />
                </div>
             </div>
          )}

          {activeSubTab === 'professional' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
               <InputField label="Primary Function (Occupation)" value={form.occupation} onChange={(e: any) => setForm({...form, occupation: e.target.value})} />
               <InputField label="Training (Education)" value={form.education} onChange={(e: any) => setForm({...form, education: e.target.value})} />
               <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 font-mono">Neural_Skills (Comma Separated)</label>
                   <input 
                      value={form.skills} 
                      onChange={e => setForm({...form, skills: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" 
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 font-mono">Interest_Tags (Comma Separated)</label>
                   <input 
                      value={form.tags} 
                      onChange={e => setForm({...form, tags: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" 
                   />
                </div>
            </div>
          )}
        </div>
        
        {/* Footer Actions */}
        <div className="shrink-0 p-8 md:p-10 pt-4 flex gap-4 bg-slate-50/50 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 py-4 bg-white text-slate-400 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-100 transition-all active:scale-95">Abort_Calibration</button>
          <button onClick={handleCommit} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95">Commit_Sync</button>
        </div>
      </div>
    </div>
  );
};
