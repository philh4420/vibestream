
import React, { useState } from 'react';
import { User, UserSettings } from '../../types';
import { db, auth } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { doc, updateDoc } = Firestore as any;
import { ICONS } from '../../constants';

interface SettingsOverlayProps {
  userData: User;
  onClose: () => void;
  onLogout: () => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const DEFAULT_SETTINGS: UserSettings = {
  privacy: {
    profileVisibility: 'public',
    activityStatus: true,
    readReceipts: true,
    allowTagging: true,
    showLocation: true
  },
  notifications: {
    email: true,
    push: true,
    likes: true,
    comments: true,
    mentions: true,
    follows: true,
    broadcasts: true
  },
  appearance: {
    theme: 'system',
    reducedMotion: false,
    autoPlayVideo: true,
    hapticFeedback: true,
    highContrast: false
  },
  dataUsage: {
    mediaQuality: 'high',
    preloadContent: true
  },
  safety: {
    filterLevel: 'standard',
    hiddenWords: []
  }
};

type SettingTab = 'account' | 'privacy' | 'notifications' | 'appearance' | 'safety' | 'data';

export const SettingsOverlay: React.FC<SettingsOverlayProps> = ({ userData, onClose, onLogout, addToast }) => {
  const [activeTab, setActiveTab] = useState<SettingTab>('account');
  const [settings, setSettings] = useState<UserSettings>(() => {
    // Deep merge defaults with user settings to ensure all fields exist
    const base = { ...DEFAULT_SETTINGS };
    if (userData.settings) {
      // We manually merge sections to avoid overwriting entire objects if new keys were added to types
      return {
        privacy: { ...base.privacy, ...userData.settings.privacy },
        notifications: { ...base.notifications, ...userData.settings.notifications },
        appearance: { ...base.appearance, ...userData.settings.appearance },
        dataUsage: { ...base.dataUsage, ...userData.settings.dataUsage },
        safety: { ...base.safety, ...userData.settings.safety },
      };
    }
    return base;
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [hiddenWordInput, setHiddenWordInput] = useState('');

  // -- Handlers --

  const handleToggle = (category: keyof UserSettings, key: string) => {
    setSettings(prev => ({
      ...prev,
      // @ts-ignore
      [category]: { ...prev[category], [key]: !prev[category][key] }
    }));
    // Haptic feedback simulation
    if (window.navigator && window.navigator.vibrate && settings.appearance.hapticFeedback) {
      window.navigator.vibrate(5);
    }
  };

  const handleChange = (category: keyof UserSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      // @ts-ignore
      [category]: { ...prev[category], [key]: value }
    }));
  };

  const addHiddenWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hiddenWordInput.trim()) return;
    const word = hiddenWordInput.trim().toLowerCase();
    if (!settings.safety.hiddenWords.includes(word)) {
      setSettings(prev => ({
        ...prev,
        safety: { ...prev.safety, hiddenWords: [...prev.safety.hiddenWords, word] }
      }));
      addToast(`Filtered: "${word}"`, "info");
    }
    setHiddenWordInput('');
  };

  const removeHiddenWord = (word: string) => {
    setSettings(prev => ({
      ...prev,
      safety: { ...prev.safety, hiddenWords: prev.safety.hiddenWords.filter(w => w !== word) }
    }));
  };

  const clearCache = () => {
    // Simulation of cache clearing logic
    localStorage.removeItem('vibestream_cache');
    addToast("Local Fragments Purged (142MB Freed)", "success");
  };

  const saveSettings = async () => {
    if (!db || !userData.id) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', userData.id), { settings });
      addToast("Neural Matrix Updated", "success");
      onClose();
    } catch (e) {
      console.error(e);
      addToast("Update Sequence Failed", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // -- Components --

  const TabButton = ({ id, label, icon: Icon }: { id: SettingTab, label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-4 px-5 py-4 rounded-[1.2rem] transition-all duration-300 group w-full ${
        activeTab === id 
          ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10 scale-[1.02]' 
          : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <div className={`transition-transform duration-300 ${activeTab === id ? 'scale-110 text-white' : 'group-hover:scale-110'}`}>
        <Icon />
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.2em] font-mono whitespace-nowrap">{label}</span>
      {activeTab === id && <div className="ml-auto w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />}
    </button>
  );

  const Toggle = ({ label, checked, onChange, description }: { label: string, checked: boolean, onChange: () => void, description?: string }) => (
    <div 
      onClick={onChange}
      className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-indigo-100 transition-all group cursor-pointer active:scale-[0.99]"
    >
      <div className="flex flex-col pr-4">
        <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-900 transition-colors">{label}</span>
        {description && <span className="text-[9px] font-medium text-slate-400 mt-0.5 leading-tight">{description}</span>}
      </div>
      <div className={`w-11 h-6 rounded-full p-1 transition-all duration-300 relative shrink-0 ${checked ? 'bg-indigo-600' : 'bg-slate-200'}`}>
        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 absolute top-1 ${checked ? 'left-[22px]' : 'left-1'}`} />
      </div>
    </div>
  );

  const SectionHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
    <div className="mb-6 pl-1">
      <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] font-mono mb-1">{title}</h3>
      <p className="text-lg font-black text-slate-900 italic tracking-tight">{subtitle}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-0 md:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-[#fcfcfd] w-full max-w-6xl h-full md:h-[90vh] md:rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-500 border border-white/20">
        
        {/* Navigation Sidebar */}
        <div className="w-full md:w-72 lg:w-80 bg-slate-50/80 border-b md:border-b-0 md:border-r border-slate-200/60 p-4 md:p-8 flex flex-row md:flex-col gap-2 shrink-0 overflow-x-auto md:overflow-y-auto no-scrollbar relative z-20">
          <div className="hidden md:block mb-8 px-2">
            <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Command_Deck</h2>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono mt-2">Neural Config v3.0</p>
          </div>
          
          <TabButton id="account" label="Identity" icon={ICONS.Profile} />
          <TabButton id="privacy" label="Privacy" icon={ICONS.Verified} />
          <TabButton id="notifications" label="Signals" icon={ICONS.Bell} />
          <TabButton id="appearance" label="Interface" icon={ICONS.Create} />
          <TabButton id="safety" label="Safety" icon={ICONS.Resilience} />
          <TabButton id="data" label="Data" icon={ICONS.Saved} />
          
          <div className="mt-auto pt-8 hidden md:block">
            <button 
              onClick={onLogout}
              className="w-full py-4 rounded-[1.2rem] border-2 border-rose-100 text-rose-500 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-50 hover:border-rose-200 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Terminate_Uplink
            </button>
          </div>
        </div>

        {/* Content Viewport */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#fcfcfd] relative z-10">
          
          {/* Mobile Header (Visible only on small screens) */}
          <div className="md:hidden p-6 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-20">
             <div>
                <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tight">{activeTab}</h3>
                <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">Config_Mode</p>
             </div>
             <button onClick={onClose} className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-10 scroll-container">
            
            {activeTab === 'account' && (
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
                    <SectionHeader title="Security_Protocol" subtitle="Credentials & Access" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <button className="p-6 rounded-[2rem] border border-slate-200 hover:border-indigo-200 bg-white hover:shadow-lg transition-all text-left group active:scale-[0.98]">
                          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                             <ICONS.Admin />
                          </div>
                          <p className="text-xs font-black text-slate-900 uppercase tracking-wide mb-1">2-Factor Auth</p>
                          <p className="text-[10px] text-slate-500 font-medium">Secure your node with biometric hardware keys.</p>
                       </button>
                       <button className="p-6 rounded-[2rem] border border-slate-200 hover:border-indigo-200 bg-white hover:shadow-lg transition-all text-left group active:scale-[0.98]">
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
                       <button className="px-6 py-3 bg-white border border-rose-200 text-rose-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-95">
                          Deactivate
                       </button>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                 <div>
                    <SectionHeader title="Visibility_Matrix" subtitle="Who sees your signals" />
                    <div className="space-y-3">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <button 
                            onClick={() => handleChange('privacy', 'profileVisibility', 'public')}
                            className={`p-6 rounded-[2rem] border text-left transition-all active:scale-[0.98] ${settings.privacy.profileVisibility === 'public' ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl ring-4 ring-indigo-100' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200'}`}
                          >
                             <div className="mb-4 text-2xl"><ICONS.Globe /></div>
                             <p className="font-black uppercase tracking-widest text-xs">Public Node</p>
                             <p className="text-[10px] opacity-70 mt-1 leading-relaxed">Visible to the entire grid. Signals are indexable.</p>
                          </button>
                          <button 
                            onClick={() => handleChange('privacy', 'profileVisibility', 'private')}
                            className={`p-6 rounded-[2rem] border text-left transition-all active:scale-[0.98] ${settings.privacy.profileVisibility === 'private' ? 'bg-slate-900 text-white border-slate-900 shadow-xl ring-4 ring-slate-100' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-800'}`}
                          >
                             <div className="mb-4 text-2xl"><ICONS.Verified /></div>
                             <p className="font-black uppercase tracking-widest text-xs">Private Mesh</p>
                             <p className="text-[10px] opacity-70 mt-1 leading-relaxed">Only approved connections can decipher your signals.</p>
                          </button>
                       </div>
                    </div>
                 </div>

                 <div>
                    <SectionHeader title="Interaction_Log" subtitle="Data Exchange" />
                    <div className="space-y-3">
                       <Toggle 
                         label="Activity Status" 
                         description="Allow others to see when your node is online."
                         checked={settings.privacy.activityStatus} 
                         onChange={() => handleToggle('privacy', 'activityStatus')} 
                       />
                       <Toggle 
                         label="Read Receipts" 
                         description="Send 'Signal Received' confirmation in chats."
                         checked={settings.privacy.readReceipts} 
                         onChange={() => handleToggle('privacy', 'readReceipts')} 
                       />
                       <Toggle 
                         label="Allow Tagging" 
                         description="Let others link your ID in their broadcasts."
                         checked={settings.privacy.allowTagging} 
                         onChange={() => handleToggle('privacy', 'allowTagging')} 
                       />
                       <Toggle 
                         label="Geospatial Data" 
                         description="Attach coordinates to your new signals by default."
                         checked={settings.privacy.showLocation} 
                         onChange={() => handleToggle('privacy', 'showLocation')} 
                       />
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                 <SectionHeader title="Alert_Grid" subtitle="Signal Sensitivity" />
                 
                 <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 mb-6">
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-mono mb-4">Global_Switches</h4>
                    <div className="flex gap-4">
                       <div className="flex-1">
                          <Toggle label="Push Notifications" checked={settings.notifications.push} onChange={() => handleToggle('notifications', 'push')} />
                       </div>
                       <div className="flex-1">
                          <Toggle label="Email Summaries" checked={settings.notifications.email} onChange={() => handleToggle('notifications', 'email')} />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono pl-2 mb-2">Trigger_Events</h4>
                    <Toggle label="New Followers" checked={settings.notifications.follows} onChange={() => handleToggle('notifications', 'follows')} />
                    <Toggle label="Mentions & Replies" checked={settings.notifications.mentions} onChange={() => handleToggle('notifications', 'mentions')} />
                    <Toggle label="Likes & Reactions" checked={settings.notifications.likes} onChange={() => handleToggle('notifications', 'likes')} />
                    <Toggle label="Live Broadcasts" checked={settings.notifications.broadcasts} onChange={() => handleToggle('notifications', 'broadcasts')} />
                 </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                 <div>
                    <SectionHeader title="Visual_Engine" subtitle="Interface Calibration" />
                    <div className="grid grid-cols-3 gap-3 mb-8">
                       {['system', 'light', 'dark'].map((theme) => (
                         <button
                           key={theme}
                           onClick={() => handleChange('appearance', 'theme', theme)}
                           className={`py-6 rounded-[2rem] text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95 ${
                             settings.appearance.theme === theme 
                               ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-inner' 
                               : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                           }`}
                         >
                           {theme}
                         </button>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono pl-2 mb-2">Accessibility_&_Motion</h4>
                    <Toggle 
                      label="Reduced Motion" 
                      description="Minimize interface animations and parallax effects."
                      checked={settings.appearance.reducedMotion} 
                      onChange={() => handleToggle('appearance', 'reducedMotion')} 
                    />
                    <Toggle 
                      label="Autoplay Video" 
                      description="Automatically play visual media in stream."
                      checked={settings.appearance.autoPlayVideo} 
                      onChange={() => handleToggle('appearance', 'autoPlayVideo')} 
                    />
                    <Toggle 
                      label="Haptic Feedback" 
                      description="Vibration response on interactions."
                      checked={settings.appearance.hapticFeedback} 
                      onChange={() => handleToggle('appearance', 'hapticFeedback')} 
                    />
                    <Toggle 
                      label="High Contrast" 
                      description="Increase border visibility and text contrast."
                      checked={settings.appearance.highContrast} 
                      onChange={() => handleToggle('appearance', 'highContrast')} 
                    />
                 </div>
              </div>
            )}

            {activeTab === 'safety' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                 <SectionHeader title="Guard_Rails" subtitle="Content Safety" />
                 
                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono pl-2">Filter_Intensity</p>
                    <div className="grid grid-cols-3 gap-3">
                       {(['standard', 'strict', 'relaxed'] as const).map((level) => (
                         <button
                           key={level}
                           onClick={() => handleChange('safety', 'filterLevel', level)}
                           className={`py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95 ${
                             settings.safety.filterLevel === level 
                               ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' 
                               : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                           }`}
                         >
                           {level}
                         </button>
                       ))}
                    </div>
                    <p className="text-[10px] text-slate-400 px-2 leading-relaxed">
                      * <strong>Strict:</strong> Hides all potentially sensitive media and aggressive language.<br/>
                      * <strong>Standard:</strong> Blurs sensitive media, filters hate speech.<br/>
                      * <strong>Relaxed:</strong> Minimal filtering. Use at own risk.
                    </p>
                 </div>

                 <div className="pt-6 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono pl-2 mb-4">Keyword_Shield</p>
                    <form onSubmit={addHiddenWord} className="flex gap-2 mb-4">
                       <input 
                         type="text" 
                         value={hiddenWordInput}
                         onChange={(e) => setHiddenWordInput(e.target.value)}
                         placeholder="Add word or phrase to hide..."
                         className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400"
                       />
                       <button type="submit" className="px-6 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95">Add</button>
                    </form>
                    <div className="flex flex-wrap gap-2">
                       {settings.safety.hiddenWords.map(word => (
                         <button 
                           key={word} 
                           onClick={() => removeHiddenWord(word)}
                           className="px-3 py-1.5 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-rose-100 hover:text-rose-600 flex items-center gap-2 transition-colors border border-transparent hover:border-rose-200"
                         >
                           {word} <span className="text-[8px]">✕</span>
                         </button>
                       ))}
                       {settings.safety.hiddenWords.length === 0 && <p className="text-xs text-slate-400 italic px-2">No active keyword filters.</p>}
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                 <SectionHeader title="Data_Stream" subtitle="Usage & Quality" />
                 
                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono pl-2">Media_Fidelity</p>
                    <div className="flex flex-col gap-3">
                       {[
                         { id: 'high', label: 'Maximum Fidelity', desc: 'Always load 4K/HD assets. High data usage.' },
                         { id: 'standard', label: 'Balanced', desc: 'HD on WiFi, Standard on Cellular.' },
                         { id: 'data-saver', label: 'Data Saver', desc: 'Lower resolution, no autoplay. Minimal usage.' }
                       ].map((opt) => (
                         <button
                           key={opt.id}
                           onClick={() => handleChange('dataUsage', 'mediaQuality', opt.id)}
                           className={`p-4 rounded-[1.8rem] border text-left transition-all active:scale-[0.98] ${
                             settings.dataUsage.mediaQuality === opt.id 
                               ? 'bg-indigo-50 border-indigo-600 relative overflow-hidden ring-1 ring-indigo-200' 
                               : 'bg-white border-slate-200 hover:border-slate-300'
                           }`}
                         >
                           <div className="relative z-10">
                             <p className={`text-xs font-black uppercase tracking-wide ${settings.dataUsage.mediaQuality === opt.id ? 'text-indigo-900' : 'text-slate-900'}`}>{opt.label}</p>
                             <p className="text-[10px] text-slate-500 mt-1">{opt.desc}</p>
                           </div>
                         </button>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-4 pt-6 border-t border-slate-100">
                    <Toggle 
                      label="Preload Content" 
                      description="Download predicted content in background for instant viewing."
                      checked={settings.dataUsage.preloadContent} 
                      onChange={() => handleToggle('dataUsage', 'preloadContent')} 
                    />
                    
                    <button 
                      onClick={clearCache}
                      className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-rose-200 group transition-all active:scale-[0.98]"
                    >
                       <div className="flex flex-col text-left">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-rose-600 transition-colors">Clear Local Cache</span>
                          <span className="text-[9px] font-medium text-slate-400 mt-0.5">Free up space (142 MB)</span>
                       </div>
                       <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:bg-rose-50 group-hover:text-rose-500 transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                       </div>
                    </button>
                 </div>
              </div>
            )}

          </div>

          {/* Persistent Footer */}
          <div className="p-6 md:p-8 border-t border-slate-100 bg-white/80 backdrop-blur-xl flex justify-end gap-4 shrink-0 absolute bottom-0 left-0 right-0 z-20 md:relative">
             <button 
               onClick={onClose}
               className="px-8 py-4 rounded-[1.5rem] bg-white border border-slate-200 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
             >
               Discard
             </button>
             <button 
               onClick={saveSettings}
               disabled={isSaving}
               className="px-10 py-4 rounded-[1.5rem] bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-200/50 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
             >
               {isSaving && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
               COMMIT_CHANGES
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
