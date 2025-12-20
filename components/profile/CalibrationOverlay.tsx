
import React, { useState, useRef } from 'react';
import { User, PresenceStatus } from '../../types';
import { uploadToCloudinary } from '../../services/cloudinary';
import { ICONS, IDENTITY_SIGNALS, PRESENCE_CONFIG } from '../../constants';

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
      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 h-14 md:h-16" 
    />
  </div>
);

const SelectField = ({ label, value, onChange, options, icon: Icon }: any) => (
  <div className="space-y-2 group">
    <div className="flex items-center gap-2 mb-1">
      {Icon && <div className="text-slate-400 group-focus-within:text-indigo-500 transition-colors"><Icon /></div>}
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono group-focus-within:text-indigo-500 transition-colors">{label}</label>
    </div>
    <div className="relative">
      <select 
        value={value} 
        onChange={onChange} 
        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer h-14 md:h-16"
      >
        {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
      </div>
    </div>
  </div>
);

export const CalibrationOverlay: React.FC<CalibrationOverlayProps> = ({ userData, onClose, onSave }) => {
  const [activeSubTab, setActiveSubTab] = useState<'core' | 'visuals' | 'connectivity' | 'professional' | 'logs'>('core');
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
    pronouns: userData.pronouns || 'Not Disclosed',
    tags: (userData.tags || []).join(', '),
    skills: (userData.skills || []).join(', '),
    hobbies: (userData.hobbies || []).join(', '),
    statusMessage: userData.statusMessage || '',
    statusEmoji: userData.statusEmoji || '⚡',
    trustTier: userData.trustTier || 'Gamma',
    presenceStatus: userData.presenceStatus || 'Online',
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
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-3xl" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col h-[92vh] border border-white/20 animate-in zoom-in-95 duration-500">
        
        <div className="shrink-0 p-8 md:p-14 pb-0 flex justify-between items-start bg-gradient-to-b from-slate-50/50 to-transparent">
           <div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter mb-2 italic">Calibration_Hub</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Neural Handshake Protocol v2.6.9_UNIVERSAL</p>
           </div>
           <button onClick={onClose} className="p-6 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all text-slate-500 active:scale-90">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>

        <div className="px-8 md:px-14 mt-12 flex gap-12 border-b border-slate-50 overflow-x-auto no-scrollbar shrink-0">
           {(['core', 'visuals', 'connectivity', 'professional', 'logs'] as const).map(tab => (
             <button 
                key={tab} 
                onClick={() => setActiveSubTab(tab)} 
                className={`pb-6 text-[11px] font-black uppercase tracking-[0.4em] font-mono transition-all relative whitespace-nowrap ${activeSubTab === tab ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
             >
               {tab}
               {activeSubTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-indigo-600 rounded-full" />}
             </button>
           ))}
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 md:p-14 space-y-12 scroll-container">
          {activeSubTab === 'core' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-6 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <InputField label="Identity Name" value={form.displayName} onChange={(e: any) => setForm({...form, displayName: e.target.value})} icon={ICONS.Profile} />
                <InputField label="Geo Coordinate" value={form.location} onChange={(e: any) => setForm({...form, location: e.target.value})} icon={ICONS.Globe} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <InputField label="Status Signal (Message)" value={form.statusMessage} onChange={(e: any) => setForm({...form, statusMessage: e.target.value})} placeholder="Establishing uplink..." />
                </div>
                <InputField label="Status Emoji" value={form.statusEmoji} onChange={(e: any) => setForm({...form, statusEmoji: e.target.value})} placeholder="⚡" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <label className="col-span-full text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Neural_Status_Cluster</label>
                {Object.keys(PRESENCE_CONFIG).map((status) => (
                  <button
                    key={status}
                    onClick={() => setForm({...form, presenceStatus: status as PresenceStatus})}
                    className={`p-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${form.presenceStatus === status ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-indigo-200'}`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <div className="space-y-3 group">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 font-mono group-focus-within:text-indigo-500 transition-colors">Neural_Bio_Signature</label>
                <textarea 
                  value={form.bio} 
                  onChange={e => setForm({...form, bio: e.target.value})} 
                  className="w-full h-44 bg-slate-50 border border-slate-200 rounded-[2rem] px-8 py-6 text-base font-bold resize-none outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300" 
                  placeholder="Establish global signal..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <SelectField 
                  label="Social_Status" 
                  value={form.relationshipStatus} 
                  onChange={(e: any) => setForm({...form, relationshipStatus: e.target.value})} 
                  options={['Single', 'Partnered', 'Married', 'Encoded', 'Polyamorous', 'Fluid', 'Open', 'Private']}
                />
                <SelectField 
                  label="Biometric_ID (Pronouns)" 
                  value={form.pronouns} 
                  onChange={(e: any) => setForm({...form, pronouns: e.target.value})} 
                  options={['He/Him', 'She/Her', 'They/Them', 'Xe/Xem', 'Ze/Zir', 'Any/All', 'Not Disclosed']}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <InputField label="Temporal_Origin (DOB)" type="date" value={form.dob} onChange={(e: any) => setForm({...form, dob: e.target.value})} />
                <SelectField 
                  label="Neural Trust Tier" 
                  value={form.trustTier} 
                  onChange={(e: any) => setForm({...form, trustTier: e.target.value})} 
                  options={['Alpha', 'Beta', 'Gamma']}
                />
              </div>
            </div>
          )}

          {activeSubTab === 'visuals' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-right-6 duration-300">
              <div className="relative h-80 w-full rounded-[3rem] overflow-hidden bg-slate-100 group border-2 border-dashed border-slate-200 cursor-pointer" onClick={() => coverInputRef.current?.click()}>
                <img src={form.coverUrl} className="w-full h-full object-cover transition-all group-hover:scale-105 duration-[2s]" alt="" />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="bg-white px-10 py-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest shadow-2xl">Update_Environment</div>
                </div>
                <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'cover')} />
                {isUploading === 'cover' && <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center text-white text-xs font-black uppercase tracking-widest">Uploading...</div>}
              </div>
              
              <div className="flex items-center gap-12 bg-slate-50/50 p-10 rounded-[3.5rem] border border-slate-100">
                <div className="relative w-56 h-56 rounded-[3rem] overflow-hidden bg-white border-2 border-dashed border-slate-200 cursor-pointer group/avatar" onClick={() => avatarInputRef.current?.click()}>
                  <img src={form.avatarUrl} className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-700" alt="" />
                  <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'avatar')} />
                  {isUploading === 'avatar' && <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest">Uploading...</div>}
                </div>
                <div className="flex-1 space-y-4">
                   <p className="text-3xl font-black text-slate-900 tracking-tighter italic">Avatar Protocol</p>
                   <p className="text-base text-slate-400 font-medium leading-relaxed max-w-sm">Neural identity visuals are broadcasted across the VibeStream Grid in high fidelity.</p>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'connectivity' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-right-6 duration-300">
              <InputField label="Primary Web Uplink" value={form.website} onChange={(e: any) => setForm({...form, website: e.target.value})} placeholder="https://node.io" icon={ICONS.Globe} />
              
              <div className="space-y-8">
                 <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Neural_Social_Mesh</h4>
                    <button onClick={addSocialLink} className="px-8 py-4 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 hover:bg-indigo-100 transition-colors">+ Link Node</button>
                 </div>
                 <div className="space-y-6">
                    {form.socialLinks.map((link, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row gap-6 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 group animate-in slide-in-from-top-4">
                        <select 
                          value={link.platform} 
                          onChange={(e) => updateSocialLink(idx, 'platform', e.target.value)}
                          className="bg-white border border-slate-200 rounded-xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none w-full sm:w-48"
                        >
                          {['X', 'Instagram', 'LinkedIn', 'GitHub', 'Threads', 'TikTok'].map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <input 
                          type="text" 
                          value={link.url} 
                          onChange={(e) => updateSocialLink(idx, 'url', e.target.value)}
                          placeholder="Platform URL"
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none"
                        />
                        <button onClick={() => setForm(prev => ({ ...prev, socialLinks: prev.socialLinks.filter((_, i) => i !== idx) }))} className="p-4 text-rose-500 hover:bg-rose-50 rounded-xl transition-all self-end sm:self-auto"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7" /></svg></button>
                      </div>
                    ))}
                 </div>
              </div>

              <InputField label="Identity_Resonance_Tags" value={form.tags} onChange={(e: any) => setForm({...form, tags: e.target.value})} placeholder="Designer, Architect..." />
              <InputField label="Passions_Grid (Hobbies)" value={form.hobbies} onChange={(e: any) => setForm({...form, hobbies: e.target.value})} placeholder="Photography, Sound Design..." />
            </div>
          )}

          {activeSubTab === 'professional' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-6 duration-300">
               <InputField label="Operational Function" value={form.occupation} onChange={(e: any) => setForm({...form, occupation: e.target.value})} />
               <InputField label="Neural Training (Education)" value={form.education} onChange={(e: any) => setForm({...form, education: e.target.value})} />
               <InputField label="Capability_Matrix (Skills)" value={form.skills} onChange={(e: any) => setForm({...form, skills: e.target.value})} />
            </div>
          )}

          {activeSubTab === 'logs' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-6 duration-300">
               <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">System_Identity_Logs</h4>
                  <button onClick={() => setForm(prev => ({...prev, lifeEvents: [...prev.lifeEvents, { id: Math.random().toString(36).substring(7), title: '', date: '', icon: '🌟' }]}))} className="px-8 py-4 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 hover:bg-indigo-100 transition-colors">+ Add Log Entry</button>
               </div>
               <div className="space-y-8">
                  {form.lifeEvents.map((event, idx) => (
                    <div key={event.id} className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 space-y-8 relative group">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <InputField label="PROTOCOL_EVENT_TITLE" value={event.title} onChange={(e: any) => { const nl = [...form.lifeEvents]; nl[idx].title = e.target.value; setForm({...form, lifeEvents: nl}); }} />
                          <InputField label="TEMPORAL_MARKER" type="date" value={event.date} onChange={(e: any) => { const nl = [...form.lifeEvents]; nl[idx].date = e.target.value; setForm({...form, lifeEvents: nl}); }} />
                       </div>
                       <button onClick={() => setForm(prev => ({...prev, lifeEvents: prev.lifeEvents.filter((_, i) => i !== idx)}))} className="absolute -top-4 -right-4 p-4 bg-white text-rose-500 rounded-full shadow-lg border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity active:scale-90"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>
        
        <div className="shrink-0 p-8 md:p-14 pt-8 flex gap-8 bg-slate-50/50 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 py-7 bg-white text-slate-400 border border-slate-200 rounded-[1.8rem] font-black text-[11px] uppercase tracking-[0.4em] active:scale-95 hover:bg-slate-50 transition-all">Abort_Sync</button>
          <button onClick={handleCommit} className="flex-1 py-7 bg-indigo-600 text-white rounded-[1.8rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl active:scale-95 hover:bg-indigo-700 transition-all">Commit_Calibration</button>
        </div>
      </div>
    </div>
  );
};
