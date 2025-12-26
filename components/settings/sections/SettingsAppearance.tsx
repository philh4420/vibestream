
import React, { useState } from 'react';
import { UserSettings } from '../../../types';
import { SIGNAL_COLORS } from '../../../constants';
import { db } from '../../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { doc, updateDoc } = Firestore as any;
import { auth } from '../../../services/firebase';

interface SettingsAppearanceProps {
  settings: UserSettings;
  handleChange: (category: keyof UserSettings, key: string, value: any) => void;
  handleToggle: (category: keyof UserSettings, key: string) => void;
  currentSignalColor?: string;
}

export const SettingsAppearance: React.FC<SettingsAppearanceProps> = ({ settings, handleChange, handleToggle, currentSignalColor }) => {
  const [previewColor, setPreviewColor] = useState<string | null>(null);

  const handleSignalColorChange = async (colorId: string) => {
    setPreviewColor(colorId);
    if (auth.currentUser) {
        try {
            await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                'cosmetics.signalColor': colorId
            });
            if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(20);
            }
        } catch (e) {
            console.error("Failed to update signal color", e);
        }
    }
  };

  const Toggle = ({ label, checked, onChange, description }: { label: string, checked: boolean, onChange: () => void, description?: string }) => (
    <div 
      onClick={onChange}
      className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-indigo-100 dark:hover:border-indigo-900 transition-all group cursor-pointer active:scale-[0.99]"
    >
      <div className="flex flex-col pr-4">
        <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-900 dark:group-hover:text-indigo-400 transition-colors">{label}</span>
        {description && <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 mt-0.5 leading-tight line-clamp-1">{description}</span>}
      </div>
      <div className={`w-10 h-5 rounded-full p-0.5 transition-all duration-300 relative shrink-0 ${checked ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-slate-200 dark:bg-slate-600'}`}>
        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <div className="mb-4 pl-1">
          <h3 className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.3em] font-mono mb-1">Visual_Engine</h3>
          <p className="text-lg font-black text-slate-900 dark:text-white italic tracking-tight">Interface Calibration</p>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-6">
          {['system', 'light', 'dark'].map((theme) => (
            <button
              key={theme}
              onClick={() => handleChange('appearance', 'theme', theme)}
              className={`py-4 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95 ${
                settings.appearance.theme === theme 
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-600 dark:border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-inner' 
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {theme}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono pl-2">Prism_Signal_Frequency</h4>
        <div className="grid grid-cols-4 gap-2">
            {SIGNAL_COLORS.map(color => {
                const isActive = previewColor ? previewColor === color.id : currentSignalColor === color.id;
                
                return (
                    <button
                        key={color.id}
                        onClick={() => handleSignalColorChange(color.id)}
                        className={`relative p-2 rounded-2xl border transition-all active:scale-95 flex flex-col items-center gap-1.5 group overflow-hidden ${
                            isActive
                            ? 'border-slate-900 dark:border-white ring-1 ring-slate-900 dark:ring-white bg-slate-50 dark:bg-slate-800' 
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-500'
                        }`}
                        title={color.label}
                    >
                        <div 
                            className="w-full h-6 rounded-lg shadow-inner transition-transform group-hover:scale-105"
                            style={{ backgroundColor: color.hex }}
                        />
                        {isActive && (
                            <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm animate-pulse" />
                        )}
                    </button>
                );
            })}
        </div>
      </div>

      <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono pl-2 mb-2">Accessibility_&_Motion</h4>
        <div className="grid grid-cols-1 gap-2">
            <Toggle 
            label="Reduced Motion" 
            description="Minimize interface animations."
            checked={settings.appearance.reducedMotion} 
            onChange={() => handleToggle('appearance', 'reducedMotion')} 
            />
            <Toggle 
            label="Autoplay Video" 
            description="Play visual media in stream."
            checked={settings.appearance.autoPlayVideo} 
            onChange={() => handleToggle('appearance', 'autoPlayVideo')} 
            />
            <Toggle 
            label="Haptic Feedback" 
            description="Vibration on interactions."
            checked={settings.appearance.hapticFeedback} 
            onChange={() => handleToggle('appearance', 'hapticFeedback')} 
            />
            <Toggle 
            label="High Contrast" 
            description="Increase border visibility."
            checked={settings.appearance.highContrast} 
            onChange={() => handleToggle('appearance', 'highContrast')} 
            />
        </div>
      </div>
    </div>
  );
};
