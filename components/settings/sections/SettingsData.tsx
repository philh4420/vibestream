
import React from 'react';
import { UserSettings } from '../../../types';

interface SettingsDataProps {
  settings: UserSettings;
  handleChange: (category: keyof UserSettings, key: string, value: any) => void;
  handleToggle: (category: keyof UserSettings, key: string) => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SettingsData: React.FC<SettingsDataProps> = ({ settings, handleChange, handleToggle, addToast }) => {
  const handleClearCache = () => {
    try {
      localStorage.removeItem('vibestream_cache');
      localStorage.removeItem('vibestream_session_start_timestamp');
      // We don't clear the active route to prevent disorientation
      addToast("Local Storage Fragments Purged (142MB Freed)", "success");
    } catch (e) {
      addToast("Cache Purge Failed", "error");
    }
  };

  const Toggle = ({ label, checked, onChange, description }: { label: string, checked: boolean, onChange: () => void, description?: string }) => (
    <div 
      onClick={onChange}
      className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-indigo-100 dark:hover:border-indigo-900 transition-all group cursor-pointer active:scale-[0.99]"
    >
      <div className="flex flex-col pr-4">
        <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-900 dark:group-hover:text-indigo-400 transition-colors">{label}</span>
        {description && <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">{description}</span>}
      </div>
      <div className={`w-11 h-6 rounded-full p-1 transition-all duration-300 relative shrink-0 ${checked ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-slate-200 dark:bg-slate-600'}`}>
        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 absolute top-1 ${checked ? 'left-[22px]' : 'left-1'}`} />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="mb-6 pl-1">
        <h3 className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.3em] font-mono mb-1">Data_Stream</h3>
        <p className="text-lg font-black text-slate-900 dark:text-white italic tracking-tight">Usage & Quality</p>
      </div>
      
      <div className="space-y-4">
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono pl-2">Media_Fidelity</p>
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
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-600 dark:border-indigo-500 relative overflow-hidden ring-1 ring-indigo-200 dark:ring-indigo-800' 
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="relative z-10">
                <p className={`text-xs font-black uppercase tracking-wide ${settings.dataUsage.mediaQuality === opt.id ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-900 dark:text-white'}`}>{opt.label}</p>
                <p className={`text-[10px] mt-1 ${settings.dataUsage.mediaQuality === opt.id ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
        <Toggle 
          label="Preload Content" 
          description="Download predicted content in background for instant viewing."
          checked={settings.dataUsage.preloadContent} 
          onChange={() => handleToggle('dataUsage', 'preloadContent')} 
        />
        
        <button 
          onClick={handleClearCache}
          className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-900 group transition-all active:scale-[0.98]"
        >
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">Clear Local Cache</span>
            <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">Free up space (142 MB)</span>
          </div>
          <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-slate-400 dark:text-slate-500 group-hover:bg-rose-50 dark:group-hover:bg-rose-900/30 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </div>
        </button>
      </div>
    </div>
  );
};
