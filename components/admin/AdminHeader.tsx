
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
    <div className="w-full max-w-[1400px] mx-auto px-4 py-6 sticky top-0 z-[100] animate-in fade-in slide-in-from-top-2 duration-700">
      <div className="bg-white/95 backdrop-blur-xl rounded-full border border-slate-100 shadow-[0_15px_50px_-15px_rgba(0,0,0,0.08)] px-5 py-2.5 flex items-center justify-between gap-4">
        
        {/* Branding & Title Section */}
        <div className="flex items-center gap-6 shrink-0">
          <div className="w-10 h-10 bg-slate-950 rounded-full flex items-center justify-center text-white font-black italic text-xl shadow-lg shrink-0 active:scale-95 transition-transform cursor-pointer">
            V
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-slate-950 leading-none">
              {activeTab === 'overview' ? 'OVERVIEW' : currentTitle}
            </h1>
            <p className="text-[7px] md:text-[8px] font-mono font-bold text-slate-300 uppercase tracking-[0.4em] mt-1.5 leading-none whitespace-nowrap">
              VIBESTREAM_CITADEL_OS_V5.2.LTS
            </p>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
          <nav className="flex items-center p-1 bg-slate-50 rounded-full border border-slate-100/50">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-4 md:px-6 py-2 md:py-2.5 rounded-full transition-all duration-300 relative active:scale-95 shrink-0 group ${
                    isActive 
                      ? 'bg-slate-950 text-white shadow-xl shadow-slate-200' 
                      : 'text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <div className={`shrink-0 transition-transform duration-300 ${isActive ? 'scale-100' : 'scale-90 opacity-60 group-hover:opacity-100'}`}>
                    <tab.icon />
                  </div>
                  <span className={`text-[8px] md:text-[9px] font-black italic tracking-[0.2em] hidden lg:block ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                    {tab.label}
                  </span>
                  
                  {isActive && (
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-1 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                  )}
                </button>
              );
            })}
          </nav>
          
          <div className="w-px h-6 bg-slate-100 mx-1 hidden sm:block" />
          
          <button className="p-3 text-slate-300 hover:text-slate-950 transition-all hover:bg-slate-50 rounded-full active:scale-90 shrink-0">
            <ICONS.Search />
          </button>
        </div>
      </div>
    </div>
  );
};
