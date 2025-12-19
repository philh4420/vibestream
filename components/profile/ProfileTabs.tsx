
import React from 'react';

export type ProfileTab = 'broadcasting' | 'identity' | 'visuals' | 'resonance' | 'chronology';

interface ProfileTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: ProfileTab; label: string }[] = [
    { id: 'broadcasting', label: 'Broadcasting' },
    { id: 'identity', label: 'Identity' },
    { id: 'visuals', label: 'Visuals' },
    { id: 'resonance', label: 'Resonance' },
    { id: 'chronology', label: 'Chronology' },
  ];

  return (
    <div className="sticky top-[var(--header-h)] z-[40] glass-panel border-x-0 border-t-0 -mx-4 sm:-mx-6 md:-mx-10 lg:-mx-14 px-4 sm:px-6 md:px-10 lg:px-14">
      <div className="max-w-4xl mx-auto overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-8 py-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`whitespace-nowrap text-[10px] font-black uppercase tracking-[0.3em] font-mono transition-all relative pb-2 ${
                activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-full animate-in fade-in zoom-in duration-300" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
