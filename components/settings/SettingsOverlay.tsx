
import React, { useState } from 'react';
import { User, UserSettings } from '../../types';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { doc, updateDoc } = Firestore as any;
import { ICONS } from '../../constants';

// Modular Sections
import { SettingsAccount } from './sections/SettingsAccount';
import { SettingsPrivacy } from './sections/SettingsPrivacy';
import { SettingsNotifications } from './sections/SettingsNotifications';
import { SettingsAppearance } from './sections/SettingsAppearance';
import { SettingsSafety } from './sections/SettingsSafety';
import { SettingsData } from './sections/SettingsData';

interface SettingsOverlayProps {
  userData: User;
  onClose: () => void;
  onLogout: () => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  blockedIds?: string[];
  onUnblock?: (id: string) => void;
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

export const SettingsOverlay: React.FC<SettingsOverlayProps> = ({ userData, onClose, onLogout, addToast, blockedIds = [], onUnblock }) => {
  const [activeTab, setActiveTab] = useState<SettingTab>('account');
  const [settings, setSettings] = useState<UserSettings>(() => {
    // Deep merge defaults with user settings to ensure all fields exist
    const base = { ...DEFAULT_SETTINGS };
    if (userData.settings) {
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

  // -- Master State Handlers --

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

  // -- UI Components --

  const TabButton = ({ id, label, icon: Icon }: { id: SettingTab, label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-4 px-5 py-4 rounded-[1.2rem] transition-all duration-300 group w-full ${
        activeTab === id 
          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl shadow-slate-900/10 dark:shadow-none scale-[1.02]' 
          : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
      }`}
    >
      <div className={`transition-transform duration-300 ${activeTab === id ? 'scale-110 text-white dark:text-slate-900' : 'group-hover:scale-110'}`}>
        <Icon />
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.2em] font-mono whitespace-nowrap">{label}</span>
      {activeTab === id && <div className="ml-auto w-1.5 h-1.5 bg-emerald-400 dark:bg-emerald-600 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-0 md:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-[#fcfcfd] dark:bg-slate-900 w-full max-w-6xl h-full md:h-[90vh] md:rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-500 border border-white/20 dark:border-slate-800">
        
        {/* Navigation Sidebar */}
        <div className="w-full md:w-72 lg:w-80 bg-slate-50/80 dark:bg-slate-950/80 border-b md:border-b-0 md:border-r border-slate-200/60 dark:border-slate-800 p-4 md:p-8 flex flex-row md:flex-col gap-2 shrink-0 overflow-x-auto md:overflow-y-auto no-scrollbar relative z-20">
          <div className="hidden md:block mb-8 px-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Command_Deck</h2>
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
              className="w-full py-4 rounded-[1.2rem] border-2 border-rose-100 dark:border-rose-900/50 text-rose-500 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-200 dark:hover:border-rose-800 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Terminate_Uplink
            </button>
          </div>
        </div>

        {/* Content Viewport */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#fcfcfd] dark:bg-slate-900 relative z-10">
          
          {/* Mobile Header (Visible only on small screens) */}
          <div className="md:hidden p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20">
             <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tight">{activeTab}</h3>
                <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">Config_Mode</p>
             </div>
             <button onClick={onClose} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-12 pb-32 md:pb-12 space-y-10 scroll-container relative">
            {activeTab === 'account' && (
              <SettingsAccount userData={userData} onLogout={onLogout} addToast={addToast} />
            )}
            {activeTab === 'privacy' && (
              <SettingsPrivacy settings={settings} handleChange={handleChange} handleToggle={handleToggle} />
            )}
            {activeTab === 'notifications' && (
              <SettingsNotifications settings={settings} handleToggle={handleToggle} />
            )}
            {activeTab === 'appearance' && (
              <SettingsAppearance 
                settings={settings} 
                handleChange={handleChange} 
                handleToggle={handleToggle}
                currentSignalColor={userData.cosmetics?.signalColor}
              />
            )}
            {activeTab === 'safety' && (
              <SettingsSafety 
                settings={settings} 
                handleChange={handleChange} 
                addToast={addToast} 
                blockedIds={blockedIds} 
                onUnblock={onUnblock}
              />
            )}
            {activeTab === 'data' && (
              <SettingsData settings={settings} handleChange={handleChange} handleToggle={handleToggle} addToast={addToast} />
            )}
          </div>
          
          {/* Scroll Hint Mask - Only visible when content is long */}
          <div className="absolute bottom-[88px] md:bottom-[96px] left-0 right-0 h-12 bg-gradient-to-t from-[#fcfcfd] dark:from-slate-900 to-transparent pointer-events-none z-10 opacity-80" />

          {/* Persistent Footer */}
          <div className="p-6 md:p-8 border-t border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl flex justify-end gap-4 shrink-0 absolute bottom-0 left-0 right-0 z-20 md:relative">
             <button 
               onClick={onClose}
               className="px-8 py-4 rounded-[1.5rem] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
             >
               Discard
             </button>
             <button 
               onClick={saveSettings}
               disabled={isSaving}
               className="px-10 py-4 rounded-[1.5rem] bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-200/50 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
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
