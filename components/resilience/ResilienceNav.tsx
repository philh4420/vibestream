
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
    <div className="sticky top-[calc(var(--header-h)+1rem)] z-30 flex justify-center px-4">
         <div className="bg-white/80 backdrop-blur-2xl border border-white/60 p-2 rounded-[2.5rem] shadow-lg flex gap-2 w-full max-w-md">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                  activeTab === tab.id 
                    ? 'bg-emerald-950 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-900 hover:bg-white'
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
