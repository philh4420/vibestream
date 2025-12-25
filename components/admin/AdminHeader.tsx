
import React from 'react';
import { ICONS } from '../../constants';
import { User } from '../../types';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { doc, updateDoc } = Firestore as any;

interface AdminHeaderProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  locale: string;
  userData: User | null;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ activeTab, setActiveTab, locale, userData }) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: ICONS.Home },
    { id: 'users', label: 'Nodes', icon: ICONS.Profile },
    { id: 'content', label: 'Signals', icon: ICONS.Explore },
    { id: 'features', label: 'Protocols', icon: ICONS.Settings },
    { id: 'system', label: 'Kernel', icon: ICONS.Admin },
  ];

  const currentTheme = userData?.settings?.appearance?.theme || 'system';

  const handleToggleTheme = async () => {
    if (!userData || !db) return;
    
    let nextTheme: 'system' | 'light' | 'dark' = 'system';
    if (currentTheme === 'system') nextTheme = 'light';
    else if (currentTheme === 'light') nextTheme = 'dark';
    else nextTheme = 'system';

    try {
      await updateDoc(doc(db, 'users', userData.id), {
        'settings.appearance.theme': nextTheme
      });
    } catch (e) {
      console.error("Theme toggle failed", e);
    }
  };

  const getThemeIcon = () => {
    if (currentTheme === 'light') return <div className="text-amber-500">☀️</div>;
    if (currentTheme === 'dark') return <div className="text-indigo-400">🌙</div>;
    return <div className="text-slate-400 dark:text-slate-500">🖥️</div>;
  };

  return (
    <div className="w-full">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[2rem] border border-white/60 dark:border-slate-800 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-2 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Branding Block */}
        <div className="flex items-center gap-3 px-4 shrink-0 w-full md:w-auto">
          <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-[1.2rem] flex items-center justify-center text-white dark:text-slate-900 shadow-lg">
            <ICONS.Admin />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-black italic uppercase tracking-tighter text-slate-900 dark:text-white leading-none">
              Citadel_OS
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
               <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
               <p className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
                 V5.2 • {locale.toUpperCase()}
               </p>
            </div>
          </div>
        </div>

        {/* Navigation Segments */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
          <nav className="flex items-center p-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-[1.6rem] shrink-0">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-[1.4rem] transition-all duration-300 relative group shrink-0 ${
                    isActive 
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-md ring-1 ring-black/5 dark:ring-white/5' 
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-90 group-hover:scale-100'}`}>
                    <tab.icon />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Theme Toggle */}
          <button 
            onClick={handleToggleTheme}
            className="w-12 h-12 flex items-center justify-center rounded-[1.4rem] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-all active:scale-95 hover:bg-slate-50 dark:hover:bg-slate-700 shrink-0"
            title={`Theme: ${currentTheme.toUpperCase()}`}
          >
            {getThemeIcon()}
          </button>
        </div>
      </div>
    </div>
  );
};
