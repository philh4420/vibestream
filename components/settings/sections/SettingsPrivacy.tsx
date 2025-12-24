
import React from 'react';
import { UserSettings } from '../../../types';
import { ICONS } from '../../../constants';

interface SettingsPrivacyProps {
  settings: UserSettings;
  handleChange: (category: keyof UserSettings, key: string, value: any) => void;
  handleToggle: (category: keyof UserSettings, key: string) => void;
}

export const SettingsPrivacy: React.FC<SettingsPrivacyProps> = ({ settings, handleChange, handleToggle }) => {
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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <div className="mb-6 pl-1">
          <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] font-mono mb-1">Visibility_Matrix</h3>
          <p className="text-lg font-black text-slate-900 italic tracking-tight">Who sees your signals</p>
        </div>
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
        <div className="mb-6 pl-1">
          <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] font-mono mb-1">Interaction_Log</h3>
          <p className="text-lg font-black text-slate-900 italic tracking-tight">Data Exchange</p>
        </div>
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
  );
};
