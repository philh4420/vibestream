
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
    <div className="w-full bg-white rounded-full px-4 md:px-6 py-3 flex items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 max-w-full overflow-x-auto no-scrollbar mb-8 animate-in slide-in-from-top-4 duration-700">
      {/* Branding Section */}
      <div className="flex items-center shrink-0">
        <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-950 rounded-full flex items-center justify-center text-white font-black italic text-2xl md:text-3xl shadow-xl active:scale-95 transition-transform cursor-pointer">
          V
        </div>
        <div className="ml-5 md:ml-8 flex flex-col justify-center">
          <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-slate-950 leading-none">
            {activeTab === 'overview' ? 'OVERVIEW' : currentTitle}
          </h1>
          <p className="text-[9px] md:text-[10px] font-mono font-bold text-slate-300 uppercase tracking-[0.4em] mt-1.5 md:mt-2 whitespace-nowrap opacity-80">
            VIBESTREAM_CITADEL_OS_V5.2.LTS
          </p>
        </div>
      </div>

      {/* Navigation & Utilities */}
      <div className="flex items-center gap-4 ml-6">
        <nav className="flex items-center p-1.5 bg-slate-50/80 rounded-full border border-slate-100 shadow-inner">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-5 md:px-7 py-2.5 md:py-3.5 rounded-full transition-all duration-500 relative group active:scale-95 ${
                activeTab === tab.id 
                  ? 'bg-slate-950 text-white shadow-[0_10px_25px_rgba(0,0,0,0.15)]' 
                  : 'text-slate-400 hover:text-slate-900'
              }`}
            >
              <div className={`shrink-0 transition-transform duration-500 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                <tab.icon />
              </div>
              <span className="text-[10px] md:text-[11px] font-black italic tracking-widest hidden lg:block">
                {tab.label}
              </span>
              
              {/* Active Indicator Underline */}
              {activeTab === tab.id && (
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-7 h-1.5 bg-[#4F46E5] rounded-full animate-in zoom-in duration-300" />
              )}
            </button>
          ))}
        </nav>
        
        <button className="p-3.5 text-slate-300 hover:text-slate-950 transition-colors hover:bg-slate-50 rounded-full hidden sm:block active:scale-90">
          <ICONS.Search />
        </button>
      </div>
    </div>
  );
};
