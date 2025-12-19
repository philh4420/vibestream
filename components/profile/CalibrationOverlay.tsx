
import React, { useState, useRef } from 'react';
import { User } from '../../types';
import { uploadToCloudinary } from '../../services/cloudinary';
import { ICONS } from '../../constants';

interface CalibrationOverlayProps {
  userData: User;
  onClose: () => void;
  onSave: (newData: any) => void;
}

const InputField = ({ label, type = "text", value, onChange, placeholder, icon: Icon }: any) => (
  <div className="space-y-2 group">
    <div className="flex items-center gap-2 mb-1">
      {Icon && <div className="text-slate-400 group-focus-within:text-indigo-500 transition-colors"><Icon /></div>}
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono group-focus-within:text-indigo-500 transition-colors">{label}</label>
    </div>
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
  const [activeSubTab, setActiveSubTab] = useState<'core' | 'visuals' | 'connectivity' | 'professional' | 'chronology'>('core');
  const [isUploading, setIsUploading] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    displayName: userData.displayName || '',
    bio: userData.bio || '',
    location: userData.location || '',
    avatarUrl: userData.avatarUrl || '',
    coverUrl: userData.coverUrl || '',
    dob: userData.dob || '',
    occupation: userData.occupation || '',
    education: userData.education || '',
    relationshipStatus: userData.relationshipStatus || 'Single',
    website: userData.website || '',
    pronouns: userData.pronouns || 'Not Specified',
    tags: (userData.tags || []).join(', '),
    skills: (userData.skills || []).join(', '),
    hobbies: (userData.hobbies || []).join(', '),
    socialLinks: userData.socialLinks || [],
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
    } catch (err) { console.error(err); } finally { setIsUploading(null); }
  };

  const addSocialLink = () => {
    setForm(prev => ({
      ...prev,
      socialLinks: [...prev.socialLinks, { platform: 'X', url: '' }]
    }));
  };

  const updateSocialLink = (index: number, field: string, value: string) => {
    const newList = [...form.socialLinks];
    newList[index] = { ...newList[index], [field]: value };
    setForm(prev => ({ ...prev, socialLinks: newList }));
  };

  const removeSocialLink = (index: number) => {
    setForm(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index)
    }));
  };

  const addLifeEvent = () => {
    setForm(prev => ({
      ...prev,
      lifeEvents: [...prev.lifeEvents, { id: Math.random().toString(36).substring(7), title: '', date: '', icon: '🌟' }]
    }));
  };

  const updateLifeEvent = (index: number, field: string, value: string) => {
    const newList = [...form.lifeEvents];
    newList[index] = { ...newList[index], [field]: value };
    setForm(prev => ({ ...prev, lifeEvents: newList }));
  };

  const removeLifeEvent = (index: number) => {
    setForm(prev => ({
      ...prev,
      lifeEvents: prev.lifeEvents.filter((_, i) => i !== index)
    }));
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
      <div className="relative bg-white w-full max-w-3xl rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col h-[90vh] border border-white/20 animate-in zoom-in-95 duration-500">
        
        {/* Hub Header */}
        <div className="shrink-0 p-8 md:p-12 pb-0 flex justify-between items-start bg-gradient-to-b from-slate-50/50 to-transparent">
           <div>
              <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-2 italic">Calibration_Hub</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Neural Grid Sync v2.6.8_PRO</p>
           </div>
           <button onClick={onClose} className="p-4 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all text-slate-500 active:scale-90">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-8 md:px-12 mt-10 flex gap-10 border-b border-slate-50 overflow-x-auto no-scrollbar shrink-0">
           {(['core', 'visuals', 'connectivity', 'professional', 'chronology'] as const).map(tab => (
             <button 
                key={tab} 
                onClick={() => setActiveSubTab(tab)} 
                className={`pb-5 text-[10px] font-black uppercase tracking-[0.4em] font-mono transition-all relative whitespace-nowrap ${activeSubTab === tab ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
             >
               {tab}
               {activeSubTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-full" />}
             </button>
           ))}
        </div>
        
        {/* Dynamic Form Content */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-10 scroll-container">
          {activeSubTab === 'core' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InputField label="Identity Name" value={form.displayName} onChange={(e: any) => setForm({...form, displayName: e.target.value})} icon={ICONS.Profile} />
                <InputField label="Geo Coordinate (Location)" value={form.location} onChange={(e: any) => setForm({...form, location: e.target.value})} icon={ICONS.Globe} />
              </div>
              <div className="space-y-2 group">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 font-mono group-focus-within:text-indigo-500 transition-colors">Identity_Bio_Signature</label>
                <textarea 
                  value={form.bio} 
                  onChange={e => setForm({...form, bio: e.target.value})} 
                  className="w-full h-36 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-5 text-sm font-bold resize-none outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300" 
                  placeholder="Establish your global signal..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InputField label="Social_Status" value={form.relationshipStatus} onChange={(e: any) => setForm({...form, relationshipStatus: e.target.value})} />
                <InputField label="Biometric_ID (Pronouns)" value={form.pronouns} onChange={(e: any) => setForm({...form, pronouns: e.target.value})} />
              </div>
              <InputField label="Temporal_Origin (DOB)" type="date" value={form.dob} onChange={(e: any) => setForm({...form, dob: e.target.value})} />
            </div>
          )}

          {activeSubTab === 'visuals' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="relative h-64 w-full rounded-[2.5rem] overflow-hidden bg-slate-100 group border-2 border-dashed border-slate-200 cursor-pointer" onClick={() => coverInputRef.current?.click()}>
                <img src={form.coverUrl} className="w-full h-full object-cover transition-all group-hover:scale-105 duration-700" alt="" />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="bg-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl">Update_Environment</div>
                </div>
                <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'cover')} />
                {isUploading === 'cover' && <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center"><div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" /></div>}
              </div>
              
              <div className="flex items-center gap-10 bg-slate-50/50 p-8 rounded-[3rem] border border-slate-100">
                <div className="relative w-44 h-44 rounded-[2.5rem] overflow-hidden bg-white border-2 border-dashed border-slate-200 cursor-pointer group/avatar" onClick={() => avatarInputRef.current?.click()}>
                  <img src={form.avatarUrl} className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-500" alt="" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity"><span className="text-white text-[8px] font-black uppercase tracking-widest">Update</span></div>
                  <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'avatar')} />
                  {isUploading === 'avatar' && <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center"><div className="w-8 h-8 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" /></div>}
                </div>
                <div className="flex-1 space-y-3">
                   <p className="text-xl font-black text-slate-900 tracking-tighter">Avatar Protocol</p>
                   <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-sm">Identity visuals are cached across the VibeStream Central Grid. Visual synchronisation is performed globally in high fidelity.</p>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'connectivity' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
              <InputField label="Primary Web Uplink" value={form.website} onChange={(e: any) => setForm({...form, website: e.target.value})} placeholder="https://node.io" icon={ICONS.Globe} />
              
              <div className="space-y-6">
                 <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Neural_Social_Mesh</h4>
                    <button onClick={addSocialLink} className="px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-indigo-100 hover:bg-indigo-100 transition-colors">+ Link Peer Node</button>
                 </div>
                 <div className="space-y-4">
                    {form.socialLinks.map((link, idx) => (
                      <div key={idx} className="flex gap-4 p-5 bg-slate-50 rounded-[1.8rem] border border-slate-100 group animate-in slide-in-from-top-2">
                        <select 
                          value={link.platform} 
                          onChange={(e) => updateSocialLink(idx, 'platform', e.target.value)}
                          className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-100 outline-none"
                        >
                          {['X', 'Instagram', 'LinkedIn', 'GitHub', 'Threads', 'TikTok'].map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <input 
                          type="text" 
                          value={link.url} 
                          onChange={(e) => updateSocialLink(idx, 'url', e.target.value)}
                          placeholder="Platform URL"
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-100 outline-none"
                        />
                        <button onClick={() => removeSocialLink(idx)} className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-90"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" /></svg></button>
                      </div>
                    ))}
                    {form.socialLinks.length === 0 && <p className="text-center py-8 text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] font-mono italic">No social uplinks defined...</p>}
                 </div>
              </div>

              <InputField label="Identity_Resonance_Tags" value={form.tags} onChange={(e: any) => setForm({...form, tags: e.target.value})} placeholder="Pioneer, Architect, Voyager..." />
              <InputField label="Passions_Grid (Hobbies)" value={form.hobbies} onChange={(e: any) => setForm({...form, hobbies: e.target.value})} placeholder="Photography, Sound Design, Deep Learning..." />
            </div>
          )}

          {activeSubTab === 'professional' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
               <InputField label="Operational Function (Occupation)" value={form.occupation} onChange={(e: any) => setForm({...form, occupation: e.target.value})} />
               <InputField label="Neural Training (Education)" value={form.education} onChange={(e: any) => setForm({...form, education: e.target.value})} />
               <InputField label="Capability_Matrix (Skills)" value={form.skills} onChange={(e: any) => setForm({...form, skills: e.target.value})} placeholder="React, TypeScript, UI Architecture..." />
            </div>
          )}

          {activeSubTab === 'chronology' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Identity_Milestones</h4>
                  <button onClick={addLifeEvent} className="px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-indigo-100 hover:bg-indigo-100 transition-colors">+ Event Marker</button>
               </div>
               <div className="space-y-6">
                  {form.lifeEvents.map((event, idx) => (
                    <div key={event.id} className="p-8 bg-slate-50 rounded-[2.2rem] border border-slate-100 space-y-6 relative group animate-in slide-in-from-bottom-2">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <InputField label="Milestone Label" value={event.title} onChange={(e: any) => updateLifeEvent(idx, 'title', e.target.value)} />
                          <InputField label="Temporal Marker (Date)" type="date" value={event.date} onChange={(e: any) => updateLifeEvent(idx, 'date', e.target.value)} />
                       </div>
                       <button onClick={() => removeLifeEvent(idx)} className="absolute -top-3 -right-3 p-3 bg-white text-rose-500 rounded-full shadow-lg border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity active:scale-90"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                  ))}
                  {form.lifeEvents.length === 0 && <p className="text-center py-12 text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] font-mono italic">Timeline chronology empty...</p>}
               </div>
            </div>
          )}
        </div>
        
        {/* Actions Footer */}
        <div className="shrink-0 p-8 md:p-12 pt-6 flex gap-6 bg-slate-50/50 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 py-5 bg-white text-slate-400 border border-slate-200 rounded-2xl font-black text-[11px] uppercase tracking-[0.4em] active:scale-95 hover:bg-slate-50 transition-all">Abort_Sync</button>
          <button onClick={handleCommit} className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl active:scale-95 hover:bg-indigo-700 transition-all">Commit_Calibration</button>
        </div>
      </div>
    </div>
  );
};
