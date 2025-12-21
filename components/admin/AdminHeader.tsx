
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
    { id: 'users', label: 'NODES', icon: ICONS.Profile },
    { id: 'content', label: 'SIGNALS', icon: ICONS.Explore },
    { id: 'features', label: 'PROTOCOLS', icon: ICONS.Settings },
    { id: 'system', label: 'KERNEL', icon: ICONS.Admin },
  ];

  return (
    <div className="w-full px-4 md:px-6 lg:px-8 py-3 sticky top-0 z-[100] animate-in fade-in duration-500">
      <div className="bg-white/95 backdrop-blur-xl rounded-[1.8rem] border border-slate-100 shadow-lg px-3 py-2 flex items-center justify-between gap-3">
        
        {/* Branding */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 bg-slate-950 rounded-full flex items-center justify-center text-white font-black italic text-base shadow-lg shrink-0">
            V
          </div>
          <div className="hidden sm:flex flex-col">
            <h1 className="text-[15px] font-black italic uppercase tracking-tighter text-slate-950 leading-none">
              CITADEL_OS
            </h1>
            <p className="text-[6px] font-mono font-bold text-slate-300 uppercase tracking-widest mt-1 leading-none">
              GRID_ADMIN_V5.2
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-1 p-0.5 bg-slate-50/50 rounded-xl border border-slate-100/50 overflow-x-auto no-scrollbar">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 relative active:scale-95 shrink-0 group ${
                  isActive 
                    ? 'bg-slate-950 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-900'
                }`}
              >
                <div className={`shrink-0 transition-transform scale-75 ${isActive ? 'scale-90 opacity-100' : 'opacity-60'}`}>
                  <tab.icon />
                </div>
                <span className={`text-[8px] font-black italic tracking-widest hidden lg:block ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-0.5 bg-indigo-500 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
        
        <div className="flex items-center gap-2">
           <div className="hidden md:flex px-2 py-1 bg-slate-50 rounded-md border border-slate-100 items-center gap-1.5">
             <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
             <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest font-mono">{locale.toUpperCase()}</span>
           </div>
        </div>
      </div>
    </div>
  );
};
