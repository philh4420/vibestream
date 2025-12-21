
import React from 'react';
import { ICONS } from '../../constants';

interface AdminHeaderProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  locale: string;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ activeTab, setActiveTab, locale }) => {
  const tabs = [
    { id: 'overview', label: 'DASHBOARD', icon: ICONS.Home },
    { id: 'users', label: 'IDENTITY', icon: ICONS.Profile },
    { id: 'content', label: 'SIGNALS', icon: ICONS.Explore },
    { id: 'features', label: 'PROTOCOLS', icon: ICONS.Settings },
    { id: 'system', label: 'KERNEL', icon: ICONS.Admin },
  ];

  const currentTitle = tabs.find(t => t.id === activeTab)?.label || 'OVERVIEW';

  return (
    <div className="w-full max-w-7xl mx-auto px-2 md:px-4 py-4 sticky top-0 z-[100] animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="bg-white rounded-full border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] px-3 md:px-6 py-2.5 flex items-center justify-between gap-4">
        
        {/* Branding & Title Section */}
        <div className="flex items-center gap-3 md:gap-5 shrink-0">
          <div className="w-10 h-10 md:w-11 md:h-11 bg-slate-950 rounded-full flex items-center justify-center text-white font-black italic text-xl shadow-lg shrink-0">
            V
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-slate-950 leading-none">
              {activeTab === 'overview' ? 'OVERVIEW' : currentTitle}
            </h1>
            <p className="text-[7px] md:text-[8px] font-mono font-bold text-slate-300 uppercase tracking-[0.4em] mt-1 leading-none whitespace-nowrap">
              VIBESTREAM_CITADEL_OS_V5.2.LTS
            </p>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex items-center gap-1 md:gap-3 overflow-x-auto no-scrollbar">
          <nav className="flex items-center gap-1">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-full transition-all duration-300 relative active:scale-95 shrink-0 ${
                    isActive 
                      ? 'bg-slate-950 text-white shadow-xl shadow-slate-200' 
                      : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className={`shrink-0 ${isActive ? 'scale-100' : 'scale-90 opacity-70'}`}>
                    <tab.icon />
                  </div>
                  <span className={`text-[9px] md:text-[10px] font-black italic tracking-widest hidden sm:block ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                    {tab.label}
                  </span>
                  
                  {/* Indicator Dot for Active */}
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-500 rounded-full md:hidden" />
                  )}
                </button>
              );
            })}
          </nav>
          
          <div className="w-px h-6 bg-slate-100 mx-1 hidden md:block" />
          
          <button className="p-2.5 text-slate-300 hover:text-slate-950 transition-colors hover:bg-slate-50 rounded-full active:scale-90 shrink-0">
            <ICONS.Search />
          </button>
        </div>
      </div>
    </div>
  );
};
