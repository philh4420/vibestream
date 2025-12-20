
import React, { useState, useRef } from 'react';
import { User, PresenceStatus } from '../../types';
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
      {Icon && <div className="text-slate-400 group-focus-within:text-indigo-500 transition-colors scale-75"><Icon /></div>}
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono group-focus-within:text-indigo-500 transition-colors">{label}</label>
    </div>
    <input 
      type={type} 
      value={value || ''} 
      placeholder={placeholder}
      onChange={onChange} 
      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300 h-14" 
    />
  </div>
);

const SelectField = ({ label, value, onChange, options, icon: Icon }: any) => (
  <div className="space-y-2 group">
    <div className="flex items-center gap-2 mb-1">
      {Icon && <div className="text-slate-400 group-focus-within:text-indigo-500 transition-colors scale-75"><Icon /></div>}
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono group-focus-within:text-indigo-500 transition-colors">{label}</label>
    </div>
    <div className="relative">
      <select 
        value={value} 
        onChange={onChange} 
        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer h-14"
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
  const [activeSubTab, setActiveSubTab] = useState<'intro' | 'media' | 'professional' | 'social' | 'chronology'>('intro');
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
    pronouns: userData.pronouns || 'He/Him',
    tags: (userData.tags || []).join(', '),
    skills: (userData.skills || []).join(', '),
    hobbies: (userData.hobbies || []).join(', '),
    trustTier: userData.trustTier || 'Gamma',
    socialLinks: userData.socialLinks || [],
    lifeEvents: userData.lifeEvents || []
  });

  const [newEvent, setNewEvent] = useState({ title: '', date: '', icon: '🌟' });

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

  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.date) return;
    const event = { ...newEvent, id: Math.random().toString(36).substr(2, 9) };
    setForm(prev => ({ ...prev, lifeEvents: [...prev.lifeEvents, event] }));
    setNewEvent({ title: '', date: '', icon: '🌟' });
  };

  const handleRemoveEvent = (id: string) => {
    setForm(prev => ({ ...prev, lifeEvents: prev.lifeEvents.filter(e => e.id !== id) }));
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
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-0 md:p-6 overflow-hidden">
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-3xl" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-5xl h-full md:h-[85vh] md:rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/20 animate-in zoom-in-95 duration-500">
        
        {/* Header Cluster */}
        <div className="shrink-0 p-6 md:p-10 flex justify-between items-center border-b border-slate-50 bg-white/50 backdrop-blur-md sticky top-0 z-10">
           <div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Identity_Calibration</h2>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Neural Interface v2.6</p>
           </div>
           <button onClick={onClose} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all active:scale-90">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Vertical Navigation (FB Style) */}
          <nav className="hidden md:flex flex-col w-64 border-r border-slate-50 p-6 gap-2 bg-slate-50/30">
             {[
               { id: 'intro', label: 'Intro & Bio', icon: ICONS.Profile },
               { id: 'media', label: 'Visuals', icon: ICONS.Create },
               { id: 'professional', label: 'Work & Training', icon: ICONS.Admin },
               { id: 'social', label: 'Connections', icon: ICONS.Globe },
               { id: 'chronology', label: 'Life Events', icon: ICONS.Explore }
             ].map(tab => (
               <button 
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === tab.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:bg-white hover:text-slate-900'}`}
               >
                 <div className="scale-75"><tab.icon /></div>
                 {tab.label}
               </button>
             ))}
          </nav>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-6 md:p-10 scroll-container bg-white">
            {/* Mobile Tab Rail */}
            <div className="md:hidden flex gap-4 overflow-x-auto no-scrollbar mb-8 pb-4 border-b border-slate-50">
               {['intro', 'media', 'professional', 'social', 'chronology'].map(tab => (
                 <button 
                   key={tab} 
                   onClick={() => setActiveSubTab(tab as any)}
                   className={`whitespace-nowrap px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${activeSubTab === tab ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400'}`}
                 >
                   {tab}
                 </button>
               ))}
            </div>

            {activeSubTab === 'intro' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <InputField label="Identity Label" value={form.displayName} onChange={(e: any) => setForm({...form, displayName: e.target.value})} icon={ICONS.Profile} />
                  <InputField label="Geospatial Node" value={form.location} onChange={(e: any) => setForm({...form, location: e.target.value})} icon={ICONS.Globe} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <InputField label="Temporal Origin (DOB)" type="date" value={form.dob} onChange={(e: any) => setForm({...form, dob: e.target.value})} />
                  <SelectField 
                    label="Pronouns" 
                    value={form.pronouns} 
                    onChange={(e: any) => setForm({...form, pronouns: e.target.value})} 
                    options={['He/Him', 'She/Her', 'They/Them', 'Xe/Xem', 'Not Disclosed']}
                  />
                </div>
                <SelectField 
                  label="Relationship Status" 
                  value={form.relationshipStatus} 
                  onChange={(e: any) => setForm({...form, relationshipStatus: e.target.value})} 
                  options={['Single', 'Partnered', 'Married', 'Encoded', 'Polyamorous', 'Private']}
                />
                <div className="space-y-3 group">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono group-focus-within:text-indigo-500">Neural Biography</label>
                  <textarea 
                    value={form.bio} 
                    onChange={e => setForm({...form, bio: e.target.value})} 
                    className="w-full h-32 bg-slate-50 border border-slate-200 rounded-3xl px-6 py-5 text-sm font-bold resize-none outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300" 
                    placeholder="Establish your signal..."
                  />
                </div>
              </div>
            )}

            {activeSubTab === 'media' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono ml-2">Cover_Layer</p>
                   <div className="relative h-56 w-full rounded-[2.5rem] overflow-hidden bg-slate-100 border-2 border-dashed border-slate-200 cursor-pointer group" onClick={() => coverInputRef.current?.click()}>
                      <img src={form.coverUrl} className="w-full h-full object-cover" alt="" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <span className="bg-white px-4 py-2 rounded-xl text-[9px] font-black uppercase">Replace_Artifact</span>
                      </div>
                      <input type="file" ref={coverInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'cover')} />
                      {isUploading === 'cover' && <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest">Uplinking...</div>}
                   </div>
                </div>

                <div className="space-y-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono ml-2">Avatar_Core</p>
                   <div className="flex items-center gap-8 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                      <div className="relative w-32 h-32 rounded-3xl overflow-hidden bg-white shadow-xl cursor-pointer group" onClick={() => avatarInputRef.current?.click()}>
                         <img src={form.avatarUrl} className="w-full h-full object-cover" alt="" />
                         <input type="file" ref={avatarInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'avatar')} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-black text-slate-900 uppercase italic mb-1">Visual ID Protocol</h4>
                        <p className="text-xs text-slate-500 font-medium">Synchronised across the neural grid.</p>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {activeSubTab === 'professional' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <InputField label="Current Function (Work)" value={form.occupation} onChange={(e: any) => setForm({...form, occupation: e.target.value})} />
                <InputField label="Neural Training (Education)" value={form.education} onChange={(e: any) => setForm({...form, education: e.target.value})} />
                <InputField label="Capability Matrix (Skills)" value={form.skills} onChange={(e: any) => setForm({...form, skills: e.target.value})} placeholder="React, UI Design, Blockchain..." />
              </div>
            )}

            {activeSubTab === 'social' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <InputField label="Primary Domain (Website)" value={form.website} onChange={(e: any) => setForm({...form, website: e.target.value})} icon={ICONS.Globe} />
                <InputField label="Resonance Tags" value={form.tags} onChange={(e: any) => setForm({...form, tags: e.target.value})} placeholder="Tech, Music, Design..." />
                <InputField label="Passions Grid (Hobbies)" value={form.hobbies} onChange={(e: any) => setForm({...form, hobbies: e.target.value})} />
              </div>
            )}

            {activeSubTab === 'chronology' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-6 font-mono">Inject_Event</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      type="text" placeholder="Protocol Title (e.g. Graduation)" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                      className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none"
                    />
                    <input 
                      type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                      className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none"
                    />
                  </div>
                  <button 
                    onClick={handleAddEvent}
                    className="mt-4 w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all"
                  >
                    Establish_Event_Signal
                  </button>
                </div>

                <div className="space-y-4">
                  {form.lifeEvents.map(event => (
                    <div key={event.id} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-indigo-100 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-2xl">{event.icon}</div>
                        <div>
                          <p className="font-black text-slate-900 text-xs uppercase tracking-tight">{event.title}</p>
                          <p className="text-[10px] text-slate-400 font-mono font-bold uppercase">{event.date}</p>
                        </div>
                      </div>
                      <button onClick={() => handleRemoveEvent(event.id)} className="p-2 text-rose-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer Actions */}
        <div className="shrink-0 p-6 md:p-10 flex gap-4 md:gap-8 bg-slate-50/80 backdrop-blur-md border-t border-slate-100 sticky bottom-0 z-10">
          <button onClick={onClose} className="flex-1 py-5 bg-white text-slate-400 border border-slate-200 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] active:scale-95 transition-all">Abort_Sync</button>
          <button onClick={handleCommit} className="flex-1 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all">Commit_Calibration</button>
        </div>
      </div>
    </div>
  );
};
