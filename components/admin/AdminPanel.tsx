import React, { useState, useEffect } from 'react';
import { db, auth } from '../../services/firebase';
import { 
  collection, 
  query, 
  updateDoc, 
  doc, 
  deleteDoc, 
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import { Post, User, SystemSettings, AppRoute, Region } from '../../types';
import { ICONS } from '../../constants';

interface AdminPanelProps {
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  locale: Region;
  systemSettings: SystemSettings;
}

// --- High-Density Technical Components ---

const StatMini = ({ label, value, trend, icon: Icon, color = "indigo" }: any) => {
  const colorMap: Record<string, string> = {
    indigo: "text-indigo-500",
    emerald: "text-emerald-500",
    rose: "text-rose-500",
    amber: "text-amber-500",
  };

  return (
    <div className="bg-white border-precision rounded-xl p-3 flex items-center justify-between hover:border-indigo-500/30 transition-all group">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center shrink-0">
          <Icon />
        </div>
        <div>
          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest font-mono leading-none mb-1">{label}</p>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-black text-slate-900 tracking-tight font-mono leading-none">{value}</h3>
            <span className={`text-[7px] font-black font-mono px-1 rounded-sm ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
          </div>
        </div>
      </div>
      <div className={`w-0.5 h-6 rounded-full bg-current opacity-20 ${colorMap[color]}`} />
    </div>
  );
};

const CompactToggle = ({ label, route, isActive, onToggle }: { 
  label: string; 
  route: AppRoute; 
  isActive: boolean; 
  onToggle: (route: AppRoute, val: boolean) => void 
}) => (
  <div className={`group p-6 rounded-[2.5rem] border transition-all duration-500 flex flex-col justify-between min-h-[160px] hover:shadow-2xl hover:border-indigo-500/30 ${isActive ? 'bg-white border-slate-100 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
    {/* Internal Sub-Grid Layout */}
    <div className="grid grid-cols-[auto_1fr] gap-5 items-start">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm group-hover:scale-110 ${isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
        <ICONS.Settings />
      </div>
      <div className="min-w-0 flex flex-col justify-center h-14">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono leading-none mb-2.5">PROTOCOL_LAYER</p>
        <h4 className="text-[16px] font-black text-slate-950 uppercase tracking-tighter leading-tight whitespace-normal break-words italic">{label.replace('_', ' ')}</h4>
      </div>
    </div>
    
    <div className="flex justify-between items-center mt-6 pt-5 border-t border-slate-100/50">
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 mb-1">
          <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse' : 'bg-slate-300'}`} />
          <span className={`text-[8px] font-black uppercase tracking-widest font-mono ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
            {isActive ? 'NOMINAL' : 'OFFLINE'}
          </span>
        </div>
        <span className="text-[7px] font-black text-slate-300 uppercase tracking-[0.2em] font-mono">NODE_UK_LTS</span>
      </div>

      {/* RUGGED TACTICAL TOGGLE SWITCH */}
      <button 
        onClick={() => onToggle(route, !isActive)}
        className={`relative inline-flex h-9 w-[64px] shrink-0 cursor-pointer rounded-2xl border-[4px] border-transparent transition-all duration-300 active:scale-90 ${isActive ? 'bg-slate-900 shadow-lg' : 'bg-slate-200'}`}
      >
        <div className={`pointer-events-none flex items-center justify-center h-7 w-7 transform rounded-xl bg-white shadow-xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isActive ? 'translate-x-7' : 'translate-x-0'}`}>
           <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${isActive ? 'bg-indigo-600' : 'bg-slate-200'}`} />
        </div>
      </button>
    </div>
  </div>
);

export const AdminPanel: React.FC<AdminPanelProps> = ({ addToast, locale, systemSettings }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'content' | 'features' | 'system'>('overview');
  const [nodes, setNodes] = useState<User[]>([]);
  const [signals, setSignals] = useState<Post[]>([]);
  const [metrics, setMetrics] = useState({ users: 0, posts: 0, uptime: '99.98%' });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
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
      addToast(`${route.toUpperCase()} Protocol updated`, 'success');
    } catch (e) { addToast('Write failure', 'error'); }
  };

  const tabs = [
    { id: 'overview', label: 'Dashboard', icon: ICONS.Home },
    { id: 'users', label: 'Identity', icon: ICONS.Profile },
    { id: 'content', label: 'Signals', icon: ICONS.Explore },
    { id: 'features', label: 'Protocols', icon: ICONS.Settings },
    { id: 'system', label: 'Kernel', icon: ICONS.Admin },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatMini label="Nodes" value={metrics.users} trend={12} icon={ICONS.Profile} color="indigo" />
              <StatMini label="Signals" value={metrics.posts} trend={18} icon={ICONS.Explore} color="emerald" />
              <StatMini label="Stability" value={metrics.uptime} trend={0.1} icon={ICONS.Admin} color="amber" />
              <StatMini label="Net_Load" value="Low" trend={100} icon={ICONS.Verified} color="indigo" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
              <div className="xl:col-span-12 bg-white border-precision rounded-2xl p-6 shadow-sm relative group overflow-hidden h-[300px]">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Resonance_Sync_Live</h3>
                </div>
                <div className="h-44 flex items-end justify-between gap-0.5 px-1">
                  {Array.from({ length: 128 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-full rounded-t-sm bg-slate-50 group-hover:bg-indigo-400 transition-all duration-700`} 
                      style={{ height: `${Math.random() * 80 + 20}%`, opacity: (i / 128) + 0.1 }} 
                    />
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between text-[8px] font-black font-mono text-slate-300 uppercase">
                   <span>Cluster: GB_01_L</span>
                   <span className="animate-pulse text-emerald-400">STATE: NOMINAL</span>
                   <span>Uplink: Synchronised</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="bg-white border-precision rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-200">
            <div className="p-4 border-b border-slate-50 flex justify-between items-center gap-4 bg-slate-50/20">
              <h3 className="text-sm font-black text-slate-900 tracking-tighter uppercase italic">Node_Manifest_V2</h3>
              <div className="relative w-64">
                <input 
                  type="text" placeholder="Filter IDs..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-3 pr-3 py-1.5 text-xs font-bold outline-none h-8"
                />
              </div>
            </div>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="w-1/3 px-6 py-2.5 text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono">Identity_Link</th>
                    <th className="w-1/4 px-6 py-2.5 text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono">Role</th>
                    <th className="w-1/4 px-6 py-2.5 text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono">Status</th>
                    <th className="w-1/6 px-6 py-2.5 text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono text-right">Ops</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {nodes.filter(n => n.username.toLowerCase().includes(searchQuery.toLowerCase())).map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-6 py-2">
                        <div className="flex items-center gap-3">
                          <img src={user.avatarUrl} className="w-8 h-8 rounded-lg object-cover border border-slate-100 shadow-sm" alt="" />
                          <div className="min-w-0">
                            <p className="font-black text-slate-900 text-xs tracking-tight truncate leading-none mb-1">{user.displayName}</p>
                            <p className="text-[8px] font-mono text-slate-400 truncate tracking-tighter">NODE_{user.id.slice(0, 10).toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-2">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${user.role === 'admin' ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border-slate-100'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${user.isSuspended ? 'bg-rose-500' : 'bg-emerald-500'} animate-pulse`} />
                          <span className={`text-[9px] font-black font-mono ${user.isSuspended ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {user.isSuspended ? 'ISOLATED' : 'SYNCED'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-2 text-right">
                         <button className="text-[9px] font-black text-indigo-400 hover:text-indigo-600 tracking-tighter uppercase font-mono">MOD</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'features':
        return (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="bg-slate-950 rounded-[3rem] p-12 text-white shadow-2xl flex items-center justify-between overflow-hidden relative border border-white/5">
               <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-600/10 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3" />
               <div className="relative z-10">
                 <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none mb-3">Citadel_OS_Switchboard</h2>
                 <p className="text-[11px] font-black font-mono uppercase tracking-[0.5em] text-indigo-400/80">Master Layer Protocol Matrix</p>
               </div>
               <div className="hidden md:flex flex-col items-end relative z-10">
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest font-mono mb-1">Active_Protocols</span>
                  <span className="text-4xl font-black text-indigo-400 font-mono leading-none tracking-tighter">{Object.values(AppRoute).length}</span>
               </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {Object.values(AppRoute).map(route => (
                <CompactToggle 
                  key={route}
                  label={route}
                  route={route}
                  isActive={systemSettings.featureFlags?.[route] !== false}
                  onToggle={handleToggleFeature}
                />
              ))}
            </div>
          </div>
        );

      case 'content':
        return (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex justify-between items-center px-1">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">Signal_Interceptor</h3>
                <p className="text-[8px] font-mono text-slate-400 uppercase tracking-widest">Global Packet Buffer</p>
              </div>
              <button className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[8px] font-black font-mono uppercase tracking-widest">Clear_Cache</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {signals.map(post => (
                <div key={post.id} className="bg-white border-precision rounded-xl p-2.5 group hover:border-indigo-400 transition-all flex flex-col h-full shadow-sm">
                  <div className="relative aspect-square rounded-lg overflow-hidden mb-2 bg-slate-50 border border-slate-100 shrink-0">
                    {post.media?.[0]?.url ? (
                      <img src={post.media[0].url} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[7px] text-slate-300 font-black uppercase text-center p-2">No_Visual_Signal</div>
                    )}
                    <button 
                      onClick={() => deleteDoc(doc(db, 'posts', post.id))}
                      className="absolute top-1 right-1 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <img src={post.authorAvatar} className="w-4 h-4 rounded-md object-cover" alt="" />
                      <p className="text-[9px] font-black text-slate-900 truncate leading-none">{post.authorName}</p>
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-snug italic px-0.5">"{post.content}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'system':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in zoom-in-95 duration-200">
            <div className="bg-white border-precision rounded-2xl p-6 space-y-6">
               <h3 className="text-lg font-black text-slate-900 tracking-tighter uppercase italic">Kernel_Safety</h3>
               <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-slate-950 text-white rounded-xl">
                    <div className="min-w-0">
                      <p className="text-[7px] font-black text-rose-400 uppercase tracking-widest mb-0.5 font-mono">EMERGENCY_ISOLATION</p>
                      <p className="text-[11px] text-slate-400 font-bold truncate">Maintenance Mode Override.</p>
                    </div>
                    <button onClick={() => updateDoc(doc(db, 'settings', 'global'), { maintenanceMode: !systemSettings.maintenanceMode })} className={`w-9 h-5 rounded-full border-2 transition-colors ${systemSettings.maintenanceMode ? 'bg-rose-600 border-rose-500' : 'bg-slate-800 border-slate-700'}`}>
                      <div className={`w-3 h-3 bg-white rounded-full transition-transform ${systemSettings.maintenanceMode ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="min-w-0">
                      <p className="text-[7px] font-black text-indigo-500 uppercase tracking-widest mb-0.5 font-mono">GATE_LOCKDOWN</p>
                      <p className="text-[11px] text-slate-500 font-bold italic truncate">Block handshakes.</p>
                    </div>
                    <button onClick={() => updateDoc(doc(db, 'settings', 'global'), { registrationDisabled: !systemSettings.registrationDisabled })} className={`w-9 h-5 rounded-full border-2 transition-colors ${systemSettings.registrationDisabled ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-300 border-slate-200'}`}>
                      <div className={`w-3 h-3 bg-white rounded-full transition-transform ${systemSettings.registrationDisabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
               </div>
            </div>
            <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col justify-between">
               <div>
                  <h3 className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.4em] font-mono mb-6">Access_Levels</h3>
                  <div className="space-y-2">
                    {['Alpha', 'Beta', 'Gamma'].map(tier => (
                      <button 
                        key={tier}
                        onClick={() => updateDoc(doc(db, 'settings', 'global'), { minTrustTier: tier })}
                        className={`w-full flex items-center justify-between p-3.5 rounded-lg border transition-all ${systemSettings.minTrustTier === tier ? 'bg-white text-slate-900 border-white' : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10'}`}
                      >
                        <span className="text-[9px] font-black uppercase tracking-widest font-mono">{tier}_AUTHENTICATION</span>
                        {systemSettings.minTrustTier === tier && <div className="w-2 h-2 bg-indigo-600 rounded-full" />}
                      </button>
                    ))}
                  </div>
               </div>
               <div className="pt-6 border-t border-white/5">
                 <p className="text-[7px] font-mono text-slate-600 uppercase tracking-widest text-center">Root_Hash: {auth.currentUser?.uid.slice(0, 16)}</p>
               </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] animate-in fade-in duration-300 max-w-[2560px] mx-auto flex flex-col gap-4 py-3">
      
      {/* 1. ULTRA SLIM COMMAND BAR */}
      <div className="px-4 flex items-center justify-between h-12 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 bg-slate-950 text-white rounded-lg flex items-center justify-center font-black italic text-lg shadow-lg">C</div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-black text-slate-950 tracking-tighter uppercase italic leading-none">{activeTab}</h1>
            <p className="text-[7px] font-mono text-slate-400 uppercase tracking-widest mt-0.5 leading-none">Citadel_Interface_V4</p>
          </div>
        </div>

        <nav className="bg-white border border-slate-100 p-0.5 rounded-xl shadow-sm flex items-center gap-0.5">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all active:scale-95 group ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <div className="shrink-0 scale-75"><tab.icon /></div>
              <span className="text-[9px] font-black uppercase tracking-widest font-mono hidden lg:block">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-center hidden md:block">
          <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest font-mono mb-0.5">Temporal_Sync</p>
          <p className="text-[11px] font-black text-slate-900 font-mono tracking-tighter leading-none">
            {new Date().toLocaleTimeString(locale, { hour12: false, hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* 2. MAIN GRID VIEWPORT */}
      <div className="flex-1 px-4 pb-12 overflow-y-auto no-scrollbar">
        {renderContent()}
      </div>

    </div>
  );
};