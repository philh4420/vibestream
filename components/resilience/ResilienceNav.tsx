
import React from 'react';
import { ICONS } from '../../constants';

interface ResilienceNavProps {
  activeTab: 'monitor' | 'shield' | 'breath';
  setActiveTab: (tab: 'monitor' | 'shield' | 'breath') => void;
}

export const ResilienceNav: React.FC<ResilienceNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'monitor', label: 'Monitor', icon: ICONS.Explore },
    { id: 'shield', label: 'Shields', icon: ICONS.Verified },
    { id: 'breath', label: 'Bio-Sync', icon: ICONS.Resilience }
  ];

  return (
    <div className="relative z-30 flex justify-center w-full">
         <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/60 dark:border-slate-700/60 p-2 rounded-[2.5rem] shadow-lg shadow-slate-200/20 dark:shadow-none flex gap-2 w-full max-w-md">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                  activeTab === tab.id 
                    ? 'bg-emerald-900 dark:bg-emerald-600 text-white shadow-md' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                {activeTab === tab.id && <div className="scale-75"><tab.icon /></div>}
                {tab.label}
              </button>
            ))}
         </div>
      </div>
  );
};
