
import React from 'react';
import { UserSettings } from '../../../types';

interface SettingsNotificationsProps {
  settings: UserSettings;
  handleToggle: (category: keyof UserSettings, key: string) => void;
}

export const SettingsNotifications: React.FC<SettingsNotificationsProps> = ({ settings, handleToggle }) => {
  const Toggle = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: () => void }) => (
    <div 
      onClick={onChange}
      className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-indigo-100 transition-all group cursor-pointer active:scale-[0.99]"
    >
      <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-900 transition-colors">{label}</span>
      <div className={`w-11 h-6 rounded-full p-1 transition-all duration-300 relative shrink-0 ${checked ? 'bg-indigo-600' : 'bg-slate-200'}`}>
        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 absolute top-1 ${checked ? 'left-[22px]' : 'left-1'}`} />
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="mb-6 pl-1">
        <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] font-mono mb-1">Alert_Grid</h3>
        <p className="text-lg font-black text-slate-900 italic tracking-tight">Signal Sensitivity</p>
      </div>
      
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
  );
};
