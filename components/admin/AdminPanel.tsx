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

// --- Compact Command Components ---

const DataStrip = ({ label, value, trend, icon: Icon, color = "indigo" }: any) => {
  const colorMap: Record<string, string> = {
    indigo: "border-indigo-500/20 text-indigo-600",
    emerald: "border-emerald-500/20 text-emerald-600",
    rose: "border-rose-500/20 text-rose-600",
    amber: "border-amber-500/20 text-amber-600",
  };

  return (
    <div className={`relative bg-white border-precision rounded-2xl p-5 flex items-center justify-between transition-all duration-300 hover:shadow-lg hover:border-indigo-500/30 group`}>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
          <Icon />
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono mb-0.5">{label}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight italic leading-none">{value}</h3>
            <span className={`text-[8px] font-black font-mono px-1.5 py-0.5 rounded-md ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {trend >= 0 ? '↑' : '↓'}{Math.abs(trend)}%
            </span>
          </div>
        </div>
      </div>
      <div className={`w-1 h-8 rounded-full bg-gradient-to-b from-transparent via-current to-transparent opacity-20 ${colorMap[color]}`} />
    </div>
  );
};

const ProtocolToggle = ({ label, route, isActive, onToggle }: { 
  label: string; 
  route: AppRoute; 
  isActive: boolean; 
  onToggle: (route: AppRoute, val: boolean) => void 
}) => (
  <div className={`group relative p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between ${isActive ? 'bg-white border-slate-100 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
    <div className="flex items-center gap-3 min-w-0">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
        <ICONS.Settings />
      </div>
      <div className="min-w-0">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono leading-none mb-1">PROTO_{route.toUpperCase()}</p>
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight truncate">{label.replace('_', ' ')}</h4>
      </div>
    </div>
    <button 
      onClick={() => onToggle(route, !isActive)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${isActive ? 'bg-indigo-600' : 'bg-slate-300'}`}
    >
      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isActive ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
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

    const unsubSignals = onSnapshot(query(collection(db, 'posts'), orderBy('timestamp', 'desc'), limit(50)), (snap) => {
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
      addToast(`${route.toUpperCase()} Protocol ${val ? 'ENGAGED' : 'OFFLINE'}`, val ? 'success' : 'info');
    } catch (e) {
      addToast('Matrix update failed', 'error');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Dash', icon: ICONS.Home },
    { id: 'users', label: 'Nodes', icon: ICONS.Profile },
    { id: 'content', label: 'Buffer', icon: ICONS.Explore },
    { id: 'features', label: 'Matrix', icon: ICONS.Settings },
    { id: 'system', label: 'Kernel', icon: ICONS.Admin },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <DataStrip label="Identity_Nodes" value={metrics.users} trend={12.4} icon={ICONS.Profile} color="indigo" />
              <DataStrip label="Signal_Flow" value={metrics.posts} trend={18.2} icon={ICONS.Explore} color="emerald" />
              <DataStrip label="Stability" value={metrics.uptime} trend={0.02} icon={ICONS.Admin} color="amber" />
              <DataStrip label="Neural_Sync" value="Active" trend={100} icon={ICONS.Verified} color="indigo" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <div className="xl:col-span-9 bg-white border-precision rounded-3xl p-8 shadow-sm relative overflow-hidden group">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Neural_Network_Activity</h3>
                    <p className="text-[10px] text-slate-500 font-bold mt-1">Live Resonator Cache: GB-LON-01</p>
                  </div>
                </div>
                <div className="h-64 flex items-end justify-between gap-1 px-2">
                  {Array.from({ length: 96 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-full rounded-t-sm bg-slate-100 group-hover:bg-indigo-500 transition-all`} 
                      style={{ height: `${Math.random() * 80 + 20}%`, opacity: (i / 96) + 0.2 }} 
                    />
                  ))}
                </div>
              </div>

              <div className="xl:col-span-3 bg-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col">
                <h3 className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.4em] font-mono mb-6">Live_Alerts</h3>
                <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar">
                  {[
                    { msg: 'Node verified', time: '1m' },
                    { msg: 'Signal latency ok', time: '12m' },
                    { msg: 'Kernel synced', time: '45m' },
                    { msg: 'Root access ok', time: '2h' },
                  ].map((alert, i) => (
                    <div key={i} className="flex gap-4 items-start border-l-2 border-indigo-500/40 pl-4 py-1">
                      <div className="flex-1">
                        <p className="text-[11px] font-bold text-slate-300 italic truncate leading-none">"{alert.msg}"</p>
                      </div>
                      <span className="text-[8px] font-mono text-slate-600 shrink-0">{alert.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="bg-white border-precision rounded-3xl shadow-sm overflow-hidden animate-in fade-in duration-300">
            <div className="p-6 md:px-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
              <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">Node_Manifest</h3>
              <div className="relative w-full md:w-72">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><ICONS.Search /></div>
                <input 
                  type="text" placeholder="Filter IDs..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-2 text-xs font-bold outline-none focus:border-indigo-400 h-10"
                />
              </div>
            </div>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Identity</th>
                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Tier</th>
                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Resonance</th>
                    <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono text-right">Matrix</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {nodes.filter(n => n.username.toLowerCase().includes(searchQuery.toLowerCase())).map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-8 py-3">
                        <div className="flex items-center gap-3">
                          <img src={user.avatarUrl} className="w-8 h-8 rounded-lg object-cover" alt="" />
                          <div>
                            <p className="font-black text-slate-900 text-sm tracking-tight leading-none mb-1">{user.displayName}</p>
                            <p className="text-[9px] font-mono text-slate-400">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-3">
                        <span className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border ${user.role === 'admin' ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border-slate-200'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-8 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${user.isSuspended ? 'bg-rose-500' : 'bg-emerald-500'} animate-pulse`} />
                          <span className={`text-[9px] font-black font-mono ${user.isSuspended ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {user.isSuspended ? 'ISOLATED' : 'SYNCED'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-3 text-right">
                        <button className="text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest">Adjust</button>
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
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-indigo-600 rounded-3xl p-10 text-white shadow-lg flex items-center justify-between overflow-hidden relative">
               <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2" />
               <div className="relative z-10">
                 <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Protocol_Matrix</h2>
                 <p className="text-[9px] font-mono uppercase tracking-[0.4em] mt-2 text-indigo-100">Neural Switchboard Control</p>
               </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Object.values(AppRoute).map(route => (
                <ProtocolToggle 
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
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-end px-4">
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Signal_Buffer</h3>
                <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mt-1">Live Interceptor Active</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {signals.map(post => (
                <div key={post.id} className="bg-white border-precision rounded-2xl p-5 group hover:border-indigo-400 transition-all flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <img src={post.authorAvatar} className="w-8 h-8 rounded-lg object-cover" alt="" />
                      <div>
                        <p className="text-xs font-black text-slate-900 truncate max-w-[120px]">{post.authorName}</p>
                        <p className="text-[8px] font-mono text-slate-400">{post.createdAt}</p>
                      </div>
                    </div>
                    <button onClick={() => deleteDoc(doc(db, 'posts', post.id))} className="text-rose-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-3 italic mb-4 flex-1">"{post.content}"</p>
                  {post.media?.[0] && (
                    <div className="h-20 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-black font-mono text-slate-400 uppercase">
                      Media_Asset
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'system':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in zoom-in-95 duration-300">
            <div className="bg-white border-precision rounded-3xl p-8 space-y-8">
               <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Infrastructure</h3>
               <div className="space-y-4">
                  <div className="flex items-center justify-between p-6 bg-slate-950 text-white rounded-2xl">
                    <div>
                      <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1 font-mono">MAINTENANCE_OVERRIDE</p>
                      <p className="text-xs text-slate-400 font-bold">Isolate Global Node Grid.</p>
                    </div>
                    <button onClick={() => updateDoc(doc(db, 'settings', 'global'), { maintenanceMode: !systemSettings.maintenanceMode })} className={`w-12 h-6 rounded-full border-2 transition-colors ${systemSettings.maintenanceMode ? 'bg-rose-600 border-rose-500' : 'bg-slate-800 border-slate-700'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${systemSettings.maintenanceMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div>
                      <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1 font-mono">GATE_LOCKDOWN</p>
                      <p className="text-xs text-slate-500 font-bold italic">Reject new Handshakes.</p>
                    </div>
                    <button onClick={() => updateDoc(doc(db, 'settings', 'global'), { registrationDisabled: !systemSettings.registrationDisabled })} className={`w-12 h-6 rounded-full border-2 transition-colors ${systemSettings.registrationDisabled ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-300 border-slate-200'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${systemSettings.registrationDisabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
               </div>
            </div>
            <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col justify-between">
               <div>
                  <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] font-mono mb-8">Trust_Hierarchy</h3>
                  <div className="space-y-3">
                    {['Alpha', 'Beta', 'Gamma'].map(tier => (
                      <button 
                        key={tier}
                        onClick={() => updateDoc(doc(db, 'settings', 'global'), { minTrustTier: tier })}
                        className={`w-full flex items-center justify-between p-5 rounded-xl border transition-all ${systemSettings.minTrustTier === tier ? 'bg-white text-slate-900 border-white' : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10'}`}
                      >
                        <span className="text-[10px] font-black uppercase tracking-widest font-mono">{tier}_UPLINK</span>
                        {systemSettings.minTrustTier === tier && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />}
                      </button>
                    ))}
                  </div>
               </div>
               <div className="pt-8 border-t border-white/5 text-center">
                 <p className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">Citadel Node: {auth.currentUser?.uid.slice(0, 12)}</p>
               </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen animate-in fade-in duration-500 max-w-[2560px] mx-auto flex flex-col gap-6 py-4">
      
      {/* 1. SLIM COMMAND NAV */}
      <div className="px-6 flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-4 shrink-0">
          <div className="w-10 h-10 bg-slate-950 text-white rounded-xl flex items-center justify-center font-black italic text-xl shadow-xl">C</div>
          <div className="hidden md:block">
            <h1 className="text-2xl font-black text-slate-950 tracking-tighter uppercase italic leading-none">{activeTab}</h1>
            <p className="text-[8px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">Citadel_OS v2.6</p>
          </div>
        </div>

        <nav className="flex-1 bg-white border border-slate-100 p-1 rounded-2xl shadow-sm flex items-center gap-1 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-6 py-2.5 rounded-xl transition-all duration-200 active:scale-95 group ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <div className="shrink-0 scale-90"><tab.icon /></div>
              <span className="text-[10px] font-black uppercase tracking-widest font-mono hidden lg:block">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="shrink-0 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-center hidden xl:block">
          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest font-mono mb-0.5">Temporal_Sync</p>
          <p className="text-xs font-black text-slate-900 font-mono tracking-tighter">
            {new Date().toLocaleTimeString(locale, { hour12: false, hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* 2. MAIN COMMAND VIEWPORT */}
      <div className="flex-1 px-6 pb-20">
        {renderContent()}
      </div>

    </div>
  );
};