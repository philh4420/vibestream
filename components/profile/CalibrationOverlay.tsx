
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

const CHRONOLOGY_ICONS = ['🚀', '🛡️', '⚡', '🧬', '🛰️', '🔥', '💎', '💡'];

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
  const [activeSubTab, setActiveSubTab] = useState<'basic' | 'visuals' | 'chronology'>('basic');
  const [isUploading, setIsUploading] = useState<string | null>(null); // 'avatar' | 'cover' | null
  
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
      console.error("Upload failed", err);
    } finally {
      setIsUploading(null);
    }
  };

  const handleAddEvent = () => {
    const newEvent = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'New Event',
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

  const handleSubmit = () => {
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xl" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-precision animate-in slide-in-from-bottom-12 duration-500">
        
        <div className="shrink-0 p-8 md:p-12 pb-0 flex justify-between items-start">
           <div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Node_Calibration</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Precision Identity Alignment</p>
           </div>
           <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>

        <div className="px-8 md:px-12 mt-8 flex gap-8 border-b border-slate-50 overflow-x-auto no-scrollbar">
           {(['basic', 'visuals', 'chronology'] as const).map(tab => (
             <button 
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`pb-4 text-[10px] font-black uppercase tracking-widest font-mono transition-all relative whitespace-nowrap ${activeSubTab === tab ? 'text-indigo-600' : 'text-slate-400'}`}
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
                <InputField label="Geo Node" value={form.location} onChange={(e: any) => setForm({...form, location: e.target.value})} />
              </div>
              <div className="space-y-2 group">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 font-mono">Identity Signature (Bio)</label>
                <textarea 
                  value={form.bio} 
                  onChange={e => setForm({...form, bio: e.target.value})} 
                  className="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium resize-none outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" 
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
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 font-mono">Encoded Status</label>
                   <select value={form.relationshipStatus} onChange={e => setForm({...form, relationshipStatus: e.target.value as any})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold outline-none">
                      <option value="Single">Independent</option>
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
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 font-mono">Cover_Interface</label>
                  <div 
                    className="relative h-40 w-full rounded-[2rem] overflow-hidden bg-slate-100 group cursor-pointer border-2 border-dashed border-slate-200 hover:border-indigo-500/50 transition-all"
                    onClick={() => coverInputRef.current?.click()}
                  >
                     <img src={form.coverUrl} className={`w-full h-full object-cover transition-opacity ${isUploading === 'cover' ? 'opacity-30' : 'opacity-100'}`} alt="" />
                     <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="bg-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">Update Cover</span>
                     </div>
                     {isUploading === 'cover' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                           <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin" />
                        </div>
                     )}
                     <input type="file" ref={coverInputRef} className="hidden" accept="image/*,video/*" onChange={(e) => handleFileUpload(e, 'cover')} />
                  </div>
               </div>

               <div className="space-y-4">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 font-mono">Avatar_Core</label>
                  <div className="flex items-center gap-6">
                     <div 
                        className="relative w-32 h-32 rounded-[2.5rem] overflow-hidden bg-slate-100 group cursor-pointer border-2 border-dashed border-slate-200 hover:border-indigo-500/50 transition-all shrink-0"
                        onClick={() => avatarInputRef.current?.click()}
                     >
                        <img src={form.avatarUrl} className={`w-full h-full object-cover ${isUploading === 'avatar' ? 'opacity-30' : 'opacity-100'}`} alt="" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
                           <span className="bg-white p-2 rounded-lg"><ICONS.Create /></span>
                        </div>
                        {isUploading === 'avatar' && (
                           <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-6 h-6 border-3 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin" />
                           </div>
                        )}
                        <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'avatar')} />
                     </div>
                     <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-900">Neural Avatar Signal</p>
                        <p className="text-[10px] text-slate-400 font-medium max-w-xs">Supports WEBP, AVIF, HEIC, PNG and JPG. Recommended 1:1 ratio for optimal node resolution.</p>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeSubTab === 'chronology' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="flex justify-between items-center mb-4">
                  <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest font-mono">Active_Neural_Events</h4>
                  <button 
                    onClick={handleAddEvent}
                    className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all"
                  >
                    + Add_Event
                  </button>
               </div>

               <div className="space-y-4">
                  {form.lifeEvents.map((ev: any) => (
                    <div key={ev.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col md:flex-row gap-4 items-start md:items-end group animate-in slide-in-from-left-4 duration-300">
                       <div className="space-y-2 w-full md:w-auto">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Icon</label>
                          <div className="flex gap-2 flex-wrap">
                             {CHRONOLOGY_ICONS.map(icon => (
                               <button 
                                 key={icon} 
                                 onClick={() => handleUpdateEvent(ev.id, 'icon', icon)}
                                 className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${ev.icon === icon ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 hover:bg-white/80'}`}
                               >
                                 {icon}
                               </button>
                             ))}
                          </div>
                       </div>
                       
                       <div className="flex-1 w-full space-y-4 md:space-y-0 md:flex md:gap-4">
                          <div className="flex-1">
                             <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Event_Title</label>
                             <input 
                               value={ev.title} 
                               onChange={(e) => handleUpdateEvent(ev.id, 'title', e.target.value)}
                               className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                             />
                          </div>
                          <div className="w-full md:w-40">
                             <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Sync_Date</label>
                             <input 
                               type="date"
                               value={ev.date} 
                               onChange={(e) => handleUpdateEvent(ev.id, 'date', e.target.value)}
                               className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none"
                             />
                          </div>
                       </div>

                       <button 
                        onClick={() => handleRemoveEvent(ev.id)}
                        className="p-3 text-rose-500 bg-white border border-slate-200 rounded-xl hover:bg-rose-50 hover:border-rose-200 transition-all opacity-0 group-hover:opacity-100"
                       >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                       </button>
                    </div>
                  ))}
                  {form.lifeEvents.length === 0 && (
                    <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Chronology Is Empty</p>
                    </div>
                  )}
               </div>
            </div>
          )}
        </div>
        
        <div className="shrink-0 p-8 md:p-12 pt-0 flex gap-4 bg-white">
          <button onClick={onClose} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-200 transition-all active:scale-95">Abort_Sync</button>
          <button onClick={handleSubmit} className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95">Synchronise</button>
        </div>
      </div>
    </div>
  );
};
