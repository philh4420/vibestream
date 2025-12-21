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
    <div className="bg-white border-precision rounded-xl p-4 flex items-center justify-between hover:border-indigo-500/30 transition-all group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shrink-0">
          <Icon />
        </div>
        <div>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono leading-none mb-1.5">{label}</p>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black text-slate-900 tracking-tight font-mono leading-none">{value}</h3>
            <span className={`text-[8px] font-black font-mono px-1.5 py-0.5 rounded-md ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
          </div>
        </div>
      </div>
      <div className={`w-1 h-8 rounded-full bg-current opacity-20 ${colorMap[color]}`} />
    </div>
  );
};

const CompactToggle = ({ label, route, isActive, onToggle }: { 
  label: string; 
  route: AppRoute; 
  isActive: boolean; 
  onToggle: (route: AppRoute, val: boolean) => void 
}) => {
  const latency = isActive ? Math.floor(Math.random() * 12 + 5) : 0;
  const load = isActive ? Math.floor(Math.random() * 25 + 10) : 0;

  return (
    <div className={`group p-8 rounded-[3.5rem] border transition-all duration-500 flex flex-col justify-between min-h-[260px] relative overflow-hidden ${isActive ? 'bg-white border-slate-200 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.06)]' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
      
      {/* Subtle Data Gradient */}
      <div className={`absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/5 blur-[80px] rounded-full transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`} />

      {/* 1. HEADER: BRANDING & TITLE (Ensuring No Truncation) */}
      <div className="flex items-center gap-6 relative z-10">
        <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center shrink-0 transition-all duration-500 shadow-xl border-2 ${isActive ? 'bg-slate-950 text-white border-slate-800' : 'bg-white text-slate-100 border-slate-50'}`}>
          <ICONS.Settings />
        </div>
        <div className="min-w-0 flex-1 overflow-visible">
          <div className="flex items-center gap-2 mb-1.5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono leading-none">PROTOCOL_LAYER</p>
            <span className="text-[9px] font-mono text-slate-300 font-bold tracking-widest">[{route.toUpperCase()}]</span>
          </div>
          <h4 className="text-[26px] font-black text-slate-950 uppercase tracking-tighter leading-none italic whitespace-nowrap overflow-visible">
            {label.replace('_', ' ')}
          </h4>
        </div>
      </div>

      {/* 2. CENTER: TELEMETRY READOUTS */}
      <div className="grid grid-cols-2 gap-5 mt-10 mb-6 relative z-10">
         <div className="p-5 bg-slate-50/50 rounded-[2rem] border border-slate-100 shadow-inner group-hover:bg-white transition-all duration-300">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono mb-2">LATENCY</p>
            <div className="flex items-baseline gap-1">
              <p className={`text-[18px] font-black font-mono tracking-tighter ${isActive ? 'text-indigo-600' : 'text-slate-200'}`}>{latency}</p>
              <span className="text-[10px] font-black text-slate-300 font-mono">ms</span>
            </div>
         </div>
         <div className="p-5 bg-slate-50/50 rounded-[2rem] border border-slate-100 shadow-inner group-hover:bg-white transition-all duration-300">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono mb-2">LOAD</p>
            <div className="flex items-baseline gap-1">
              <p className={`text-[18px] font-black font-mono tracking-tighter ${isActive ? 'text-indigo-600' : 'text-slate-200'}`}>{load}</p>
              <span className="text-[10px] font-black text-slate-300 font-mono">%</span>
            </div>
         </div>
      </div>
      
      {/* 3. FOOTER: STATUS & MECHANICAL TOGGLE */}
      <div className="flex justify-between items-end pt-8 border-t border-slate-50 relative z-10">
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-3 h-3 rounded-full transition-all duration-700 ${isActive ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] scale-110' : 'bg-slate-300'}`} />
            <span className={`text-[11px] font-black uppercase tracking-[0.4em] font-mono transition-colors ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
              {isActive ? 'NOMINAL' : 'OFFLINE'}
            </span>
          </div>
          <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] font-mono">NODE_GB_CENTRAL</span>
        </div>

        {/* HIGH-PRECISION SLIDER TOGGLE */}
        <button 
          onClick={() => onToggle(route, !isActive)}
          className={`relative inline-flex h-12 w-20 shrink-0 cursor-pointer rounded-2xl border-[5px] border-slate-50 p-0.5 transition-all duration-500 active:scale-90 shadow-inner ${isActive ? 'bg-slate-900' : 'bg-slate-200'}`}
        >
          <div className={`flex items-center justify-center h-full w-9 transform rounded-[0.8rem] bg-white shadow-[0_5px_15px_rgba(0,0,0,0.2)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isActive ? 'translate-x-8' : 'translate-x-0'}`}>
             <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${isActive ? 'bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,1)] scale-125' : 'bg-slate-100'}`} />
          </div>
          {/* Inner Rail Line */}
          <div className="absolute inset-x-5 top-1/2 -translate-y-1/2 h-0.5 bg-white/10 rounded-full pointer-events-none" />
        </button>
      </div>
    </div>
  );
};

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
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatMini label="Identity_Nodes" value={metrics.users} trend={12} icon={ICONS.Profile} color="indigo" />
              <StatMini label="Signal_Pulses" value={metrics.posts} trend={18} icon={ICONS.Explore} color="emerald" />
              <StatMini label="Grid_Stability" value={metrics.uptime} trend={0.1} icon={ICONS.Admin} color="amber" />
              <StatMini label="Network_Load" value="Optimal" trend={100} icon={ICONS.Verified} color="indigo" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
              <div className="xl:col-span-12 bg-white border-precision rounded-[2.5rem] p-8 shadow-sm relative group overflow-hidden h-[340px]">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] font-mono">Resonance_Visualiser_V4</h3>
                </div>
                <div className="h-48 flex items-end justify-between gap-1 px-1">
                  {Array.from({ length: 160 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-full rounded-t-md bg-slate-50 group-hover:bg-indigo-400 transition-all duration-1000`} 
                      style={{ height: `${Math.random() * 80 + 20}%`, opacity: (i / 160) + 0.1 }} 
                    />
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between text-[10px] font-black font-mono text-slate-300 uppercase tracking-widest">
                   <span>Node: GB_LON_C1</span>
                   <span className="animate-pulse text-emerald-500">STATE: FULL_SYNC</span>
                   <span>Encryption: Active</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="bg-white border-precision rounded-[2.5rem] shadow-sm overflow-hidden animate-in fade-in duration-200">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center gap-6 bg-slate-50/20">
              <h3 className="text-lg font-black text-slate-900 tracking-tighter uppercase italic">Node_Manifest_Archive</h3>
              <div className="relative w-72">
                <input 
                  type="text" placeholder="Filter identities..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-4 py-2.5 text-xs font-bold outline-none h-11 focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>
            </div>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="w-1/3 px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono">Identity_Hash</th>
                    <th className="w-1/4 px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono">Protocol_Role</th>
                    <th className="w-1/4 px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono">Grid_State</th>
                    <th className="w-1/6 px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono text-right">Ops</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {nodes.filter(n => n.username.toLowerCase().includes(searchQuery.toLowerCase())).map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-4">
                          <img src={user.avatarUrl} className="w-11 h-11 rounded-2xl object-cover border-2 border-slate-100 shadow-sm" alt="" />
                          <div className="min-w-0">
                            <p className="font-black text-slate-900 text-sm tracking-tight truncate leading-none mb-1.5">{user.displayName}</p>
                            <p className="text-[9px] font-mono text-slate-400 truncate tracking-widest uppercase">ID_{user.id.slice(0, 12).toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${user.role === 'admin' ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border-slate-100'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-2 h-2 rounded-full ${user.isSuspended ? 'bg-rose-500' : 'bg-emerald-500'} animate-pulse`} />
                          <span className={`text-[10px] font-black font-mono ${user.isSuspended ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {user.isSuspended ? 'ISOLATED' : 'SYNCHRONISED'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-right">
                         <button className="text-[10px] font-black text-indigo-500 hover:text-indigo-800 tracking-widest uppercase font-mono">MANAGE</button>
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
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="bg-slate-950 rounded-[4rem] p-16 text-white shadow-2xl flex items-center justify-between overflow-hidden relative border border-white/5">
               <div className="absolute right-0 top-0 w-[400px] h-[400px] bg-indigo-600/10 blur-[200px] rounded-full translate-x-1/3 -translate-y-1/3" />
               <div className="relative z-10">
                 <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none mb-4">Citadel_Protocol_Matrix</h2>
                 <p className="text-[13px] font-black font-mono uppercase tracking-[0.8em] text-indigo-400/80">Master Infrastructure Switchboard</p>
               </div>
               <div className="hidden md:flex flex-col items-end relative z-10">
                  <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest font-mono mb-2">Active_Layers</span>
                  <span className="text-6xl font-black text-indigo-400 font-mono leading-none tracking-tighter">{Object.values(AppRoute).length}</span>
               </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-10">
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
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex justify-between items-center px-2">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Signal_Interceptor</h3>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-[0.4em] mt-1">Global Buffer Management</p>
              </div>
              <button className="px-5 py-2.5 bg-slate-950 text-white rounded-xl text-[10px] font-black font-mono uppercase tracking-[0.3em] shadow-lg">Purge_Grid_Cache</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {signals.map(post => (
                <div key={post.id} className="bg-white border-precision rounded-[2rem] p-4 group hover:border-indigo-400 hover:shadow-2xl transition-all flex flex-col h-full">
                  <div className="relative aspect-square rounded-[1.5rem] overflow-hidden mb-4 bg-slate-50 border border-slate-100 shrink-0">
                    {post.media?.[0]?.url ? (
                      <img src={post.media[0].url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-300 font-black uppercase text-center p-6 italic">No_Visual_Handshake</div>
                    )}
                    <button 
                      onClick={() => deleteDoc(doc(db, 'posts', post.id))}
                      className="absolute top-2 right-2 p-2.5 bg-rose-600 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <img src={post.authorAvatar} className="w-6 h-6 rounded-lg object-cover" alt="" />
                      <p className="text-[10px] font-black text-slate-900 truncate tracking-tight">{post.authorName}</p>
                    </div>
                    <p className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed italic px-1 font-medium">"{post.content}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'system':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in zoom-in-95 duration-200">
            <div className="bg-white border-precision rounded-[3rem] p-10 space-y-10 shadow-sm">
               <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic border-b border-slate-50 pb-6">Kernel_Safety_Overrides</h3>
               <div className="space-y-4">
                  <div className="flex items-center justify-between p-6 bg-slate-950 text-white rounded-[2.5rem] border border-white/5">
                    <div className="min-w-0 pr-6">
                      <p className="text-[9px] font-black text-rose-400 uppercase tracking-[0.4em] mb-1.5 font-mono">EMERGENCY_LOCKDOWN</p>
                      <p className="text-sm text-slate-400 font-bold truncate">Maintenance Mode Protocol.</p>
                    </div>
                    <button onClick={() => updateDoc(doc(db, 'settings', 'global'), { maintenanceMode: !systemSettings.maintenanceMode })} className={`w-12 h-7 rounded-full border-2 transition-all shrink-0 ${systemSettings.maintenanceMode ? 'bg-rose-600 border-rose-500' : 'bg-slate-800 border-slate-700'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${systemSettings.maintenanceMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-[2.5rem]">
                    <div className="min-w-0 pr-6">
                      <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-1.5 font-mono">GATE_SYNCHRONISATION</p>
                      <p className="text-sm text-slate-500 font-bold italic truncate">New Identity Registration.</p>
                    </div>
                    <button onClick={() => updateDoc(doc(db, 'settings', 'global'), { registrationDisabled: !systemSettings.registrationDisabled })} className={`w-12 h-7 rounded-full border-2 transition-all shrink-0 ${systemSettings.registrationDisabled ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-300 border-slate-200'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${systemSettings.registrationDisabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
               </div>
            </div>
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full" />
               <div className="relative z-10">
                  <h3 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.5em] font-mono mb-8">Access_Authentication_Levels</h3>
                  <div className="space-y-3">
                    {['Alpha', 'Beta', 'Gamma'].map(tier => (
                      <button 
                        key={tier}
                        onClick={() => updateDoc(doc(db, 'settings', 'global'), { minTrustTier: tier })}
                        className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${systemSettings.minTrustTier === tier ? 'bg-white text-slate-900 border-white shadow-xl' : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10'}`}
                      >
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] font-mono">{tier}_AUTHORITY</span>
                        {systemSettings.minTrustTier === tier && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-pulse" />}
                      </button>
                    ))}
                  </div>
               </div>
               <div className="pt-10 border-t border-white/5 mt-10 relative z-10">
                 <p className="text-[9px] font-mono text-slate-600 uppercase tracking-[0.4em] text-center">Root_Hash_Node: {auth.currentUser?.uid.toUpperCase().slice(0, 20)}</p>
               </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] animate-in fade-in duration-500 max-w-[2560px] mx-auto flex flex-col gap-6 py-6">
      
      {/* 1. MASTER COMMAND BAR (OPTIMIZED) */}
      <div className="px-8 flex items-center justify-between h-16 shrink-0">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-slate-950 text-white rounded-[1.2rem] flex items-center justify-center font-black italic text-2xl shadow-2xl border border-white/10">C</div>
          <div className="hidden sm:block">
            <h1 className="text-3xl font-black text-slate-950 tracking-tighter uppercase italic leading-none">{activeTab}</h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.5em] font-mono mt-2 leading-none">Citadel_Master_OS_v4.2</p>
          </div>
        </div>

        <nav className="bg-white border border-slate-200 p-1 rounded-[1.5rem] shadow-sm flex items-center gap-1">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-6 py-2.5 rounded-2xl transition-all active:scale-95 group ${activeTab === tab.id ? 'bg-slate-950 text-white shadow-xl shadow-slate-200' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <div className="shrink-0 scale-90"><tab.icon /></div>
              <span className="text-[11px] font-black uppercase tracking-widest font-mono hidden lg:block">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-6 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-center hidden md:block">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mb-1">Grid_Sync_Clock</p>
          <p className="text-[15px] font-black text-slate-900 font-mono tracking-tighter leading-none italic">
            {new Date().toLocaleTimeString(locale, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
      </div>

      {/* 2. PRIMARY DATA VIEWPORT */}
      <div className="flex-1 px-8 pb-20 overflow-y-auto no-scrollbar">
        {renderContent()}
      </div>

    </div>
  );
};