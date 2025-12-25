
import React from 'react';
import { ICONS } from '../../constants';

interface ProfileTabsProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'broadcasting', label: 'Timeline', icon: ICONS.Home },
    { id: 'connections', label: 'Network', icon: ICONS.Clusters },
    { id: 'identity', label: 'Identity', icon: ICONS.Profile },
    { id: 'visuals', label: 'Visuals', icon: ICONS.Create },
    { id: 'resonance', label: 'Resonance', icon: ICONS.Verified },
    { id: 'chronology', label: 'Log', icon: ICONS.Temporal },
  ];

  return (
    <div className="sticky top-[var(--header-h)] z-30 w-full bg-[#f0f2f5]/90 dark:bg-[#020617]/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all duration-500">
      <div className="max-w-[2560px] mx-auto px-4 sm:px-6 md:px-10 lg:px-14">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  group relative flex items-center gap-3 px-6 py-4 transition-all duration-300 outline-none select-none shrink-0
                  ${isActive ? 'opacity-100' : 'opacity-50 hover:opacity-80'}
                `}
              >
                {/* Icon */}
                <div className={`transition-transform duration-300 scale-75 ${isActive ? 'text-indigo-600 dark:text-indigo-400 scale-90' : 'text-slate-500 dark:text-slate-400 group-hover:scale-90'}`}>
                  <tab.icon />
                </div>

                {/* Label */}
                <span className={`text-[10px] font-black uppercase tracking-[0.25em] font-mono ${isActive ? 'text-indigo-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                  {tab.label}
                </span>

                {/* Active Indicator (Bottom Bar) */}
                {isActive && (
                  <div className="absolute bottom-0 left-4 right-4 h-[3px] bg-indigo-600 dark:bg-indigo-400 rounded-t-full shadow-[0_-2px_6px_rgba(79,70,229,0.3)] animate-in fade-in zoom-in-x duration-300" />
                )}
                
                {/* Hover Background */}
                <div className={`absolute inset-2 rounded-xl bg-white dark:bg-slate-800 transition-opacity duration-300 -z-10 ${isActive ? 'opacity-100 shadow-sm' : 'opacity-0 group-hover:opacity-40'}`} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
