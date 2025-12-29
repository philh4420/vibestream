
import React from 'react';
import { ICONS } from '../../constants';

interface ProfileTabsProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'broadcasting', label: 'Timeline', icon: ICONS.Home },
    { id: 'telemetry', label: 'Telemetry', icon: ICONS.Telemetry },
    { id: 'connections', label: 'Network', icon: ICONS.Clusters },
    { id: 'identity', label: 'Identity', icon: ICONS.Profile },
    { id: 'visuals', label: 'Visuals', icon: ICONS.Create },
    { id: 'resonance', label: 'Resonance', icon: ICONS.Verified },
    { id: 'chronology', label: 'Log', icon: ICONS.Temporal },
  ];

  return (
    <div className="relative z-30 w-full bg-slate-50/90 dark:bg-[#020617]/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all duration-500">
      <div className="max-w-[2560px] mx-auto px-4 sm:px-6 md:px-10 lg:px-14 py-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar" role="tablist">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={`
                  relative flex items-center gap-2.5 px-5 py-3 rounded-2xl transition-all duration-300 outline-none select-none shrink-0 group font-bold text-xs tracking-wide focus-visible:ring-2 focus-visible:ring-indigo-500
                  ${isActive 
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-lg scale-[1.02] ring-1 ring-black/5 dark:ring-white/20' 
                    : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700/50'
                  }
                `}
              >
                <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-90 group-hover:scale-100 opacity-70 group-hover:opacity-100'}`}>
                  <tab.icon />
                </div>
                <span className="uppercase tracking-widest font-mono text-[10px]">
                  {tab.label}
                </span>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 dark:bg-emerald-600 ml-1 animate-pulse shadow-[0_0_8px_currentColor]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
