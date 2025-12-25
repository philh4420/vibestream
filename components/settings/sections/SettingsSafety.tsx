
import React, { useState } from 'react';
import { UserSettings } from '../../../types';

interface SettingsSafetyProps {
  settings: UserSettings;
  handleChange: (category: keyof UserSettings, key: string, value: any) => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SettingsSafety: React.FC<SettingsSafetyProps> = ({ settings, handleChange, addToast }) => {
  const [hiddenWordInput, setHiddenWordInput] = useState('');

  const addHiddenWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hiddenWordInput.trim()) return;
    const word = hiddenWordInput.trim().toLowerCase();
    
    if (!settings.safety.hiddenWords.includes(word)) {
      // Update parent state via handleChange using the new array
      handleChange('safety', 'hiddenWords', [...settings.safety.hiddenWords, word]);
      addToast(`Shield Updated: "${word}" blocked`, "info");
    }
    setHiddenWordInput('');
  };

  const removeHiddenWord = (word: string) => {
    const newWords = settings.safety.hiddenWords.filter(w => w !== word);
    handleChange('safety', 'hiddenWords', newWords);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="mb-6 pl-1">
        <h3 className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.3em] font-mono mb-1">Guard_Rails</h3>
        <p className="text-lg font-black text-slate-900 dark:text-white italic tracking-tight">Content Safety</p>
      </div>
      
      <div className="space-y-4">
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono pl-2">Filter_Intensity</p>
        <div className="grid grid-cols-3 gap-3">
          {(['standard', 'strict', 'relaxed'] as const).map((level) => (
            <button
              key={level}
              onClick={() => handleChange('safety', 'filterLevel', level)}
              className={`py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95 ${
                settings.safety.filterLevel === level 
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-sm' 
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 px-2 leading-relaxed">
          * <strong>Strict:</strong> Hides all potentially sensitive media and aggressive language.<br/>
          * <strong>Standard:</strong> Blurs sensitive media, filters hate speech.<br/>
          * <strong>Relaxed:</strong> Minimal filtering. Use at own risk.
        </p>
      </div>

      <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono pl-2 mb-4">Keyword_Shield</p>
        <form onSubmit={addHiddenWord} className="flex gap-2 mb-4">
          <input 
            type="text" 
            value={hiddenWordInput}
            onChange={(e) => setHiddenWordInput(e.target.value)}
            placeholder="Add word or phrase to hide..."
            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
          />
          <button type="submit" className="px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 dark:hover:bg-indigo-400 dark:hover:text-white transition-all active:scale-95">Add</button>
        </form>
        <div className="flex flex-wrap gap-2">
          {settings.safety.hiddenWords.map(word => (
            <button 
              key={word} 
              onClick={() => removeHiddenWord(word)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:bg-rose-100 dark:hover:bg-rose-900/30 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-2 transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-900"
            >
              {word} <span className="text-[8px]">✕</span>
            </button>
          ))}
          {settings.safety.hiddenWords.length === 0 && <p className="text-xs text-slate-400 dark:text-slate-500 italic px-2">No active keyword filters.</p>}
        </div>
      </div>
    </div>
  );
};
