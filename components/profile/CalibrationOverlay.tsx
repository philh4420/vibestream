
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

export const CalibrationOverlay: React.FC<CalibrationOverlayProps> = ({ userData, onClose, onSave }) => {
  const [activeSubTab, setActiveSubTab] = useState<'intro' | 'media' | 'professional' | 'footprint' | 'chronology'>('intro');
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
  const [newSocial, setNewSocial] = useState({ platform: 'X', url: '' });

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

  const handleAddSocial = () => {
    if (!newSocial.url) return;
    setForm(prev => ({ 
      ...prev, 
      socialLinks: [...prev.socialLinks, { ...newSocial }] 
    }));
    setNewSocial({ platform: 'X', url: '' });
  };

  const handleRemoveSocial = (index: number) => {
    setForm(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index)
    }));
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

  const platforms = ['X', 'Instagram', 'LinkedIn', 'GitHub', 'Threads', 'TikTok', 'Portfolio', 'Custom'];

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-0 md:p-6 overflow-hidden">
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-3xl" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-6xl h-full md:h-[90vh] md:rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/20 animate-in zoom-in-95 duration-500">
        
        <div className="shrink-0 p-6 md:p-10 flex justify-between items-center border-b border-slate-50 bg-white/50 backdrop-blur-md">
           <div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Neural_Calibration_Hub</h2>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Profile Control Suite v2.9</p>
           </div>
           <button onClick={onClose} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all active:scale-90">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <nav className="hidden md:flex flex-col w-72 border-r border-slate-50 p-8 gap-3 bg-slate-50/30">
             {[
               { id: 'intro', label: 'Identity & Biometrics', icon: ICONS.Profile },
               { id: 'media', label: 'Visual Interface', icon: ICONS.Create },
               { id: 'professional', label: 'Career & Mastery', icon: ICONS.Admin },
               { id: 'footprint', label: 'Digital Ecosystem', icon: ICONS.Globe },
               { id: 'chronology', label: 'Neural Timeline', icon: ICONS.Explore }
             ].map(tab => (
               <button 
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`flex items-center gap-4 px-6 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === tab.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:bg-white hover:text-slate-900'}`}
               >
                 <div className="scale-75"><tab.icon /></div>
                 {tab.label}
               </button>
             ))}
          </nav>

          <div className="flex-1 overflow-y-auto p-6 md:p-12 scroll-container bg-white">
            {activeSubTab === 'intro' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <InputField label="Public Identity" value={form.displayName} onChange={(e: any) => setForm({...form, displayName: e.target.value})} icon={ICONS.Profile} />
                  <InputField label="Geospatial Node" value={form.location} onChange={(e: any) => setForm({...form, location: e.target.value})} icon={ICONS.Globe} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <InputField label="Temporal Origin (DOB)" type="date" value={form.dob} onChange={(e: any) => setForm({...form, dob: e.target.value})} />
                  <InputField label="Neural Pronouns" value={form.pronouns} onChange={(e: any) => setForm({...form, pronouns: e.target.value})} placeholder="He/Him, They/Them..." />
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Neural Bio-Signature</label>
                  <textarea 
                    value={form.bio} 
                    onChange={e => setForm({...form, bio: e.target.value})} 
                    className="w-full h-40 bg-slate-50 border border-slate-200 rounded-[2rem] px-8 py-6 text-sm font-bold resize-none outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300" 
                    placeholder="Establish your signal history..."
                  />
                </div>
              </div>
            )}

            {activeSubTab === 'professional' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                <InputField label="Primary Function (Work)" value={form.occupation} onChange={(e: any) => setForm({...form, occupation: e.target.value})} />
                <InputField label="Training Centre (Education)" value={form.education} onChange={(e: any) => setForm({...form, education: e.target.value})} />
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Capability Matrix (Skills)</label>
                  <input 
                    type="text" value={form.skills} onChange={(e: any) => setForm({...form, skills: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-300 h-14"
                    placeholder="React:90, UI Design:85, Typescript:95..."
                  />
                  <p className="text-[9px] text-slate-400 font-mono mt-2">Note: Format as 'SkillName:Level' (e.g. Design:80) for visual bars.</p>
                </div>
              </div>
            )}

            {activeSubTab === 'footprint' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Primary Website Integration */}
                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 mb-6">
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-6 font-mono">Primary_Uplink_Node</h4>
                  <InputField 
                    label="Primary Domain (Personal Website)" 
                    value={form.website} 
                    onChange={(e: any) => setForm({...form, website: e.target.value})} 
                    icon={ICONS.Globe} 
                    placeholder="https://yourdomain.com"
                  />
                </div>

                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-6 font-mono">Establish_External_Resonance</h4>
                  <div className="flex flex-col md:flex-row gap-4">
                    <select 
                      value={newSocial.platform} 
                      onChange={e => setNewSocial({...newSocial, platform: e.target.value})}
                      className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none h-14"
                    >
                      {platforms.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <input 
                      type="url" placeholder="Paste ecosystem URL here..." value={newSocial.url} onChange={e => setNewSocial({...newSocial, url: e.target.value})}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-6 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none h-14"
                    />
                    <button 
                      onClick={handleAddSocial}
                      className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all h-14"
                    >
                      Inject_Node
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {form.socialLinks.map((link, idx) => (
                    <div key={idx} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl shadow-sm group">
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-600">
                          {/* @ts-ignore */}
                          {ICONS.Social[link.platform] ? React.createElement(ICONS.Social[link.platform]) : <ICONS.Globe />}
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-black text-slate-900 text-[10px] uppercase tracking-widest">{link.platform}</p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">{link.url}</p>
                        </div>
                      </div>
                      <button onClick={() => handleRemoveSocial(idx)} className="p-2 text-rose-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSubTab === 'media' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono ml-2">Cover_Layer_Interface</p>
                   <div className="relative h-64 w-full rounded-[3rem] overflow-hidden bg-slate-100 border-2 border-dashed border-slate-200 cursor-pointer group" onClick={() => coverInputRef.current?.click()}>
                      <img src={form.coverUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                         <span className="bg-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest">Update_Background_Protocol</span>
                      </div>
                      <input type="file" ref={coverInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'cover')} />
                   </div>
                </div>
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono ml-2">Avatar_Core_Node</p>
                   <div className="flex items-center gap-10 bg-slate-50 p-8 rounded-[3rem] border border-slate-100">
                      <div className="relative w-40 h-40 rounded-[2.5rem] overflow-hidden bg-white shadow-2xl cursor-pointer group" onClick={() => avatarInputRef.current?.click()}>
                         <img src={form.avatarUrl} className="w-full h-full object-cover" alt="" />
                         <input type="file" ref={avatarInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'avatar')} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-black text-slate-900 uppercase italic mb-2 tracking-tight">Identity Visual Hash</h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">This visual artifact will be broadcasted to all synchronized nodes across the VibeStream grid.</p>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {activeSubTab === 'chronology' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-6 font-mono">Inject_Timeline_Event</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <input 
                      type="text" placeholder="Event Protocol Name" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                      className="bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none h-14"
                    />
                    <input 
                      type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                      className="bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-100 outline-none h-14"
                    />
                  </div>
                  <button 
                    onClick={handleAddEvent}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-black transition-all shadow-xl"
                  >
                    Commit_Event_To_Archive
                  </button>
                </div>

                <div className="space-y-4">
                  {form.lifeEvents.map(event => (
                    <div key={event.id} className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-md transition-all group">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl">{event.icon}</div>
                        <div>
                          <p className="font-black text-slate-900 text-sm uppercase tracking-tight">{event.title}</p>
                          <p className="text-[10px] text-slate-400 font-mono font-bold uppercase mt-1 tracking-widest">{event.date}</p>
                        </div>
                      </div>
                      <button onClick={() => handleRemoveEvent(event.id)} className="p-3 text-rose-300 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="shrink-0 p-8 md:p-12 flex gap-6 bg-slate-50/80 backdrop-blur-md border-t border-slate-100">
          <button onClick={onClose} className="flex-1 py-5 bg-white text-slate-400 border border-slate-200 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] active:scale-95 transition-all">Abort_Synchronization</button>
          <button onClick={handleCommit} className="flex-1 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all">Commit_Neural_Update</button>
        </div>
      </div>
    </div>
  );
};
