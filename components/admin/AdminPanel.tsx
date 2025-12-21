import React, { useState, useEffect } from 'react';
import { db, auth } from '../../services/firebase';
import { 
  collection, 
  query, 
  updateDoc, 
  doc, 
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import { Post, User, SystemSettings, AppRoute, Region } from '../../types';
import { ICONS } from '../../constants';

// Refactored Sub-Components
import { AdminOverview } from './AdminOverview';
import { AdminUsers } from './AdminUsers';
import { AdminContent } from './AdminContent';
import { AdminProtocols } from './AdminProtocols';
import { AdminKernel } from './AdminKernel';

interface AdminPanelProps {
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  locale: Region;
  systemSettings: SystemSettings;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ addToast, locale, systemSettings }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'content' | 'features' | 'system'>('overview');
  const [nodes, setNodes] = useState<User[]>([]);
  const [signals, setSignals] = useState<Post[]>([]);
  const [metrics, setMetrics] = useState({ users: 0, posts: 0, uptime: '99.99%' });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!db) return;

    const unsubNodes = onSnapshot(collection(db, 'users'), (snap) => {
      setNodes(snap.docs.map(d => ({ id: d.id, ...d.data() } as User)));
      setMetrics(prev => ({ ...prev, users: snap.size }));
    });

    const unsubSignals = onSnapshot(query(collection(db, 'posts'), orderBy('timestamp', 'desc'), limit(100)), (snap) => {
      setSignals(snap.docs.map(d => ({ id: d.id, ...d.data() } as Post)));
      setMetrics(prev => ({ ...prev, posts: snap.size }));
    });

    return () => {
      unsubNodes();
      unsubSignals();
    };
  }, []);

  const handleToggleFeature = async (route: AppRoute, val: boolean) => {
    const updatedFlags = { ...(systemSettings.featureFlags || {}), [route]: val };
    try {
      await updateDoc(doc(db, 'settings', 'global'), { featureFlags: updatedFlags });
      addToast(`${route.toUpperCase()} Protocol modified`, 'success');
    } catch (e) { addToast('Uplink failed: Buffer locked', 'error'); }
  };

  const tabs = [
    { id: 'overview', label: 'DASHBOARD', icon: ICONS.Home },
    { id: 'users', label: 'IDENTITY', icon: ICONS.Profile },
    { id: 'content', label: 'SIGNALS', icon: ICONS.Explore },
    { id: 'features', label: 'PROTOCOLS', icon: ICONS.Settings },
    { id: 'system', label: 'KERNEL', icon: ICONS.Admin },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverview metrics={metrics} />;
      case 'users':
        return <AdminUsers nodes={nodes} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />;
      case 'content':
        return <AdminContent signals={signals} addToast={addToast} />;
      case 'features':
        return <AdminProtocols systemSettings={systemSettings} handleToggleFeature={handleToggleFeature} />;
      case 'system':
        return <AdminKernel systemSettings={systemSettings} addToast={addToast} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] animate-in fade-in duration-1000 max-w-[3840px] mx-auto flex flex-col gap-10 py-10 px-4 md:px-10">
      
      {/* 1. MASTER COMMAND BAR (RACK-MOUNT STYLE) */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-8 h-auto xl:h-24 shrink-0 bg-white border border-slate-200 p-6 rounded-[3rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-8">
          <div className="w-16 h-16 bg-slate-950 text-white rounded-[1.8rem] flex items-center justify-center font-black italic text-4xl shadow-3xl border border-white/10 group cursor-pointer hover:rotate-12 transition-all">V</div>
          <div className="hidden sm:block">
            <h1 className="text-4xl font-black text-slate-950 tracking-tighter uppercase italic leading-none">{activeTab}</h1>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.7em] font-mono mt-3 leading-none italic opacity-70">VibeStream_Citadel_OS_v5.2.LTS</p>
          </div>
        </div>

        <nav className="bg-slate-50 border border-slate-200 p-1.5 rounded-[2.2rem] flex items-center gap-1.5 shadow-inner">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-4 px-8 py-4 rounded-[1.8rem] transition-all duration-500 active:scale-95 group relative ${activeTab === tab.id ? 'bg-slate-950 text-white shadow-2xl' : 'text-slate-400 hover:text-slate-950 hover:bg-white'}`}
            >
              <div className={`shrink-0 transition-transform duration-500 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110 group-hover:rotate-6'}`}>
                <tab.icon />
              </div>
              <span className="text-[13px] font-black uppercase tracking-[0.2em] font-mono hidden lg:block italic">{tab.label}</span>
              {activeTab === tab.id && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-indigo-500 rounded-full" />}
            </button>
          ))}
        </nav>

        <div className="hidden xl:flex items-center gap-6 px-10 py-4 bg-slate-50 border border-slate-200 rounded-[2rem] shadow-inner">
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.6em] font-mono mb-2 italic">Infrastructure_Clock</p>
            <p className="text-2xl font-black text-slate-950 font-mono tracking-tighter leading-none italic">
              {new Date().toLocaleTimeString(locale, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
          <div className="w-px h-10 bg-slate-200" />
          <div className="flex flex-col items-center">
             <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]" />
             <span className="text-[8px] font-black text-emerald-600 font-mono uppercase mt-2 tracking-widest">OK</span>
          </div>
        </div>
      </div>

      {/* 2. OPERATIONAL DATA VIEWPORT */}
      <div className="flex-1 pb-24 overflow-y-auto no-scrollbar scroll-container">
        <div className="max-w-[2560px] mx-auto">
          {renderContent()}
        </div>
      </div>

    </div>
  );
};
