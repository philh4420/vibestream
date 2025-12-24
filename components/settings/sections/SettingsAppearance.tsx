
import React from 'react';
import { UserSettings } from '../../../types';

interface SettingsAppearanceProps {
  settings: UserSettings;
  handleChange: (category: keyof UserSettings, key: string, value: any) => void;
  handleToggle: (category: keyof UserSettings, key: string) => void;
}

export const SettingsAppearance: React.FC<SettingsAppearanceProps> = ({ settings, handleChange, handleToggle }) => {
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
          <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] font-mono mb-1">Visual_Engine</h3>
          <p className="text-lg font-black text-slate-900 italic tracking-tight">Interface Calibration</p>
        </div>
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
  );
};
