
import React, { useState, useRef } from 'react';
import { User } from '../../types';
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

const CHRONOLOGY_ICONS = ['🚀', '🛡️', '⚡', '🧬', '🛰️', '🔥', '💎', '💡', '🌟', '🛡️'];

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
  const [activeSubTab, setActiveSubTab] = useState<'identity' | 'visuals' | 'chronology'>('identity');
  const [isUploading, setIsUploading] = useState<string | null>(null);
  
  // Standardised 2026 Profile Form
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
    lifeEvents: userData.lifeEvents || [
      { id: '1', title: 'Node Established', date: '2025-12-19', icon: '🚀' },
      { id: '2', title: 'Alpha Trust Verification', date: '2026-01-15', icon: '🛡️' },
      { id: '3', title: 'Signal Burst Peak', date: '2026-03-22', icon: '⚡' }
    ]
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

  const handleAddEvent = () => {
    const newEvent = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'New Event Log',
      date: new Date().toISOString().split('T')[0],
      icon: '🚀'
    };
    setForm(prev => ({ ...prev, lifeEvents: [...prev.lifeEvents, newEvent] }));
  };

  const handleUpdateEvent = (id: string, field: string, value: string) => {
    setForm(prev => ({
      ...prev,
      lifeEvents: prev.lifeEvents.map(ev => ev.id === id ? { ...ev, [field]: value } : ev)
    }));
  };

  const handleRemoveEvent = (id: string) => {
    setForm(prev => ({ ...prev, lifeEvents: prev.lifeEvents.filter(ev => ev.id !== id) }));
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl" onClick={onClose}></div>
      
      <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[90vh] border border-white/20 animate-in zoom-in-95 duration-500">
        
        {/* Header Section */}
        <div className="shrink-0 p-8 md:p-10 pb-0 flex justify-between items-start bg-gradient-to-b from-slate-50/50 to-transparent">
           <div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Node_Calibration</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Infrastructure Management • GB_EN</p>
           </div>
           <button onClick={onClose} className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all text-slate-500 active:scale-90">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-8 md:px-10 mt-8 flex gap-8 border-b border-slate-50 overflow-x-auto no-scrollbar">
           {(['identity', 'visuals', 'chronology'] as const).map(tab => (
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
        
        {/* Form Body - Internal Scrollable Only */}
        <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-8 scroll-container">
          {activeSubTab === 'identity' && (
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
                  className="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold resize-none outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-300" 
                  placeholder="Describe your node's function in the network..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 font-mono">Biometric ID</label>
                   <select value={form.pronouns} onChange={e => setForm({...form, pronouns: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none cursor-pointer">
                      {PRONOUN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 font-mono">Status Mask</label>
                   <select value={form.relationshipStatus} onChange={e => setForm({...form, relationshipStatus: e.target.value as any})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none">
                      <option value="Single">Single Node</option>
                      <option value="Partnered">Partnered</option>
                      <option value="Married">Married</option>
                      <option value="Encoded">Encoded</option>
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
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed max-w-[200px]">Supports all modern formats including AVIF & WEBP. High-resolution processing enabled.</p>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeSubTab === 'chronology' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="flex justify-between items-center bg-slate-900 p-6 rounded-[2rem] shadow-xl">
                  <div>
                    <h4 className="text-[11px] font-black text-white uppercase tracking-widest font-mono mb-1">Active_Chronology_Logs</h4>
                    <p className="text-[9px] text-slate-400 font-bold">Synchronise network milestones</p>
                  </div>
                  <button 
                    onClick={handleAddEvent}
                    className="px-5 py-3 bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95"
                  >
                    + Log Event
                  </button>
               </div>

               <div className="space-y-4">
                  {form.lifeEvents.map((ev: any) => (
                    <div key={ev.id} className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center group animate-in slide-in-from-bottom-2 duration-300">
                       <div className="flex gap-2 flex-wrap md:w-48 shrink-0">
                          {CHRONOLOGY_ICONS.map(icon => (
                            <button 
                              key={icon} 
                              onClick={() => handleUpdateEvent(ev.id, 'icon', icon)}
                              className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all ${ev.icon === icon ? 'bg-slate-900 text-white scale-110 shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                            >
                              {icon}
                            </button>
                          ))}
                       </div>
                       
                       <div className="flex-1 w-full space-y-4 md:space-y-0 md:flex md:gap-4">
                          <div className="flex-1">
                             <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Log_Title</label>
                             <input 
                               value={ev.title} 
                               onChange={(e) => handleUpdateEvent(ev.id, 'title', e.target.value)}
                               className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                             />
                          </div>
                          <div className="w-full md:w-36">
                             <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Sync_Date</label>
                             <input 
                               type="date"
                               value={ev.date} 
                               onChange={(e) => handleUpdateEvent(ev.id, 'date', e.target.value)}
                               className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none"
                             />
                          </div>
                       </div>

                       <button 
                        onClick={() => handleRemoveEvent(ev.id)}
                        className="shrink-0 p-3 text-rose-500 bg-rose-50 rounded-xl hover:bg-rose-100 transition-all opacity-0 group-hover:opacity-100"
                       >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                       </button>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>
        
        {/* Footer Actions */}
        <div className="shrink-0 p-8 md:p-10 pt-4 flex gap-4 bg-slate-50/50 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 py-4 bg-white text-slate-400 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-100 transition-all active:scale-95">Abort_Calibration</button>
          <button onClick={() => onSave(form)} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95">Commit_Sync</button>
        </div>
      </div>
    </div>
  );
};
