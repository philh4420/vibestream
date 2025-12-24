
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
    readReceipts: true
  },
  notifications: {
    email: true,
    push: true,
    likes: true,
    comments: true,
    mentions: true
  },
  appearance: {
    theme: 'system',
    reducedMotion: false
  }
};

export const SettingsOverlay: React.FC<SettingsOverlayProps> = ({ userData, onClose, onLogout, addToast }) => {
  const [activeTab, setActiveTab] = useState<'account' | 'privacy' | 'notifications' | 'appearance'>('account');
  const [settings, setSettings] = useState<UserSettings>(userData.settings || DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (category: keyof UserSettings, key: string) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        // @ts-ignore
        [key]: !prev[category][key]
      }
    }));
  };

  const handleChange = (category: keyof UserSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const saveSettings = async () => {
    if (!db || !userData.id) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', userData.id), { settings });
      addToast("System Preferences Updated", "success");
      onClose();
    } catch (e) {
      console.error(e);
      addToast("Update Failed", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const TabButton = ({ id, label, icon: Icon }: { id: typeof activeTab, label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] transition-all duration-300 group ${
        activeTab === id 
          ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10 scale-[1.02]' 
          : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <div className={`transition-transform duration-300 ${activeTab === id ? 'scale-110' : 'group-hover:scale-110'}`}>
        <Icon />
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.2em] font-mono">{label}</span>
    </button>
  );

  const Toggle = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: () => void }) => (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-colors">
      <span className="text-xs font-bold text-slate-700">{label}</span>
      <button 
        onClick={onChange}
        className={`w-12 h-7 rounded-full p-1 transition-all duration-300 ${checked ? 'bg-indigo-600' : 'bg-slate-200'}`}
      >
        <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-5xl h-[85vh] rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-500 border border-white/20">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-80 bg-slate-50/50 border-r border-slate-100 p-6 md:p-8 flex flex-col gap-2 shrink-0 overflow-y-auto no-scrollbar">
          <div className="mb-8 px-2">
            <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Settings</h2>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono mt-2">Control Center</p>
          </div>
          
          <TabButton id="account" label="Account" icon={ICONS.Profile} />
          <TabButton id="privacy" label="Privacy" icon={ICONS.Verified} />
          <TabButton id="notifications" label="Alerts" icon={ICONS.Bell} />
          <TabButton id="appearance" label="Interface" icon={ICONS.Create} />
          
          <div className="mt-auto pt-8">
            <button 
              onClick={onLogout}
              className="w-full py-4 rounded-[1.5rem] border-2 border-rose-100 text-rose-500 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-50 hover:border-rose-200 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Terminate_Session
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {/* Header */}
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
             <div>
                <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">{activeTab}</h3>
                <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-widest">Configuration Matrix</p>
             </div>
             <button onClick={onClose} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all active:scale-90">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar scroll-container">
            
            {activeTab === 'account' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                 <div className="p-6 rounded-[2.5rem] bg-slate-50 border border-slate-100 flex items-center gap-6">
                    <img src={userData.avatarUrl} className="w-20 h-20 rounded-[1.8rem] object-cover bg-white shadow-sm border-2 border-white" alt="" />
                    <div>
                       <h4 className="text-lg font-black text-slate-900">{userData.displayName}</h4>
                       <p className="text-xs font-mono text-slate-500">{userData.id}</p>
                       <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-white rounded-lg border border-slate-200">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{userData.role}</span>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono ml-2">Credentials</h4>
                    <div className="p-6 rounded-[2rem] border border-slate-200 flex justify-between items-center group hover:border-indigo-200 transition-colors">
                       <div>
                          <p className="text-xs font-bold text-slate-900">Email Address</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-1">Managed via Auth Provider</p>
                       </div>
                       <button disabled className="px-4 py-2 bg-slate-100 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-not-allowed">Locked</button>
                    </div>
                    <button className="w-full p-6 rounded-[2rem] border border-slate-200 flex justify-between items-center group hover:border-indigo-200 hover:bg-indigo-50/30 transition-all text-left">
                       <div>
                          <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">Password Reset</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-1">Trigger recovery email</p>
                       </div>
                       <svg className="w-5 h-5 text-slate-300 group-hover:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                 </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono ml-2">Profile Visibility</label>
                    <div className="grid grid-cols-2 gap-4">
                       <button 
                         onClick={() => handleChange('privacy', 'profileVisibility', 'public')}
                         className={`p-6 rounded-[2rem] border text-left transition-all ${settings.privacy.profileVisibility === 'public' ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200'}`}
                       >
                          <ICONS.Globe />
                          <p className="font-black uppercase tracking-widest text-[10px] mt-3">Public Node</p>
                          <p className="text-[9px] opacity-70 mt-1">Visible to entire grid.</p>
                       </button>
                       <button 
                         onClick={() => handleChange('privacy', 'profileVisibility', 'private')}
                         className={`p-6 rounded-[2rem] border text-left transition-all ${settings.privacy.profileVisibility === 'private' ? 'bg-slate-900 text-white border-slate-900 shadow-xl' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-800'}`}
                       >
                          <ICONS.Verified />
                          <p className="font-black uppercase tracking-widest text-[10px] mt-3">Private Mesh</p>
                          <p className="text-[9px] opacity-70 mt-1">Followers only.</p>
                       </button>
                    </div>
                 </div>

                 <div className="space-y-4 pt-4">
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono ml-2">Interactions</h4>
                    <Toggle 
                      label="Show Activity Status" 
                      checked={settings.privacy.activityStatus} 
                      onChange={() => handleToggle('privacy', 'activityStatus')} 
                    />
                    <Toggle 
                      label="Read Receipts" 
                      checked={settings.privacy.readReceipts} 
                      onChange={() => handleToggle('privacy', 'readReceipts')} 
                    />
                 </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                 <div className="space-y-4">
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono ml-2">Channels</h4>
                    <Toggle label="Push Notifications" checked={settings.notifications.push} onChange={() => handleToggle('notifications', 'push')} />
                    <Toggle label="Email Summaries" checked={settings.notifications.email} onChange={() => handleToggle('notifications', 'email')} />
                 </div>
                 
                 <div className="h-px bg-slate-100" />

                 <div className="space-y-4">
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono ml-2">Triggers</h4>
                    <Toggle label="New Followers" checked={true} onChange={() => {}} /> 
                    <Toggle label="Mentions & Replies" checked={settings.notifications.mentions} onChange={() => handleToggle('notifications', 'mentions')} />
                    <Toggle label="Likes & Reactions" checked={settings.notifications.likes} onChange={() => handleToggle('notifications', 'likes')} />
                 </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                 <div className="space-y-4">
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono ml-2">Theme Engine</h4>
                    <div className="grid grid-cols-3 gap-3">
                       {['system', 'light', 'dark'].map((theme) => (
                         <button
                           key={theme}
                           onClick={() => handleChange('appearance', 'theme', theme)}
                           className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                             settings.appearance.theme === theme 
                               ? 'bg-indigo-50 border-indigo-600 text-indigo-700' 
                               : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                           }`}
                         >
                           {theme}
                         </button>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono ml-2">Accessibility</h4>
                    <Toggle 
                      label="Reduced Motion" 
                      checked={settings.appearance.reducedMotion} 
                      onChange={() => handleToggle('appearance', 'reducedMotion')} 
                    />
                 </div>
              </div>
            )}

          </div>

          <div className="p-6 border-t border-slate-50 flex justify-end gap-4 bg-slate-50/50">
             <button 
               onClick={onClose}
               className="px-8 py-4 rounded-[1.5rem] bg-white border border-slate-200 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
             >
               Discard
             </button>
             <button 
               onClick={saveSettings}
               disabled={isSaving}
               className="px-10 py-4 rounded-[1.5rem] bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
             >
               {isSaving && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
               SAVE_CHANGES
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
