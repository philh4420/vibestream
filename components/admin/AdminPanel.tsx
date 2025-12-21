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

// --- High-Fidelity Tactical Components ---

const TacticalCard = ({ label, value, trend, icon: Icon, color = "indigo" }: any) => {
  const colorMap: Record<string, string> = {
    indigo: "from-indigo-500/10 to-transparent border-indigo-500/20 text-indigo-600",
    emerald: "from-emerald-500/10 to-transparent border-emerald-500/20 text-emerald-600",
    rose: "from-rose-500/10 to-transparent border-rose-500/20 text-rose-600",
    amber: "from-amber-500/10 to-transparent border-amber-500/20 text-amber-600",
  };

  return (
    <div className={`relative overflow-hidden bg-white border-precision rounded-[2.5rem] p-8 transition-all duration-500 hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.06)] group`}>
      <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-br ${colorMap[color]} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="p-4 bg-slate-900 text-white rounded-[1.25rem] shadow-2xl shadow-slate-200 group-hover:scale-110 transition-transform duration-500">
            <Icon />
          </div>
          <div className="text-right">
            <span className={`text-[9px] font-black font-mono px-3 py-1.5 rounded-full ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          </div>
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mb-2">{label}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl md:text-5xl xl:text-6xl font-black text-slate-900 tracking-tighter italic leading-none">{value}</h3>
            <span className="text-[10px] font-black text-slate-300 font-mono uppercase tracking-widest">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProtocolModule = ({ label, route, isActive, onToggle }: { 
  label: string; 
  route: AppRoute; 
  isActive: boolean; 
  onToggle: (route: AppRoute, val: boolean) => void 
}) => (
  <div className={`group relative p-7 rounded-[2.5rem] border transition-all duration-500 flex flex-col justify-between h-52 ${isActive ? 'bg-white border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200' : 'bg-slate-50 border-slate-200 grayscale opacity-60'}`}>
    <div className="flex justify-between items-start">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
        <ICONS.Settings />
      </div>
      <button 
        onClick={() => onToggle(route, !isActive)}
        className={`relative inline-flex h-9 w-15 shrink-0 cursor-pointer rounded-full border-[4px] border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${isActive ? 'bg-indigo-600' : 'bg-slate-300'}`}
      >
        <span className={`pointer-events-none inline-block h-6.5 w-6.5 transform rounded-full bg-white shadow-xl ring-0 transition duration-300 ease-in-out ${isActive ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
    </div>
    <div className="space-y-1.5">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono">SYS_PROTO_{route.toUpperCase()}</p>
      <h4 className="text-base font-black text-slate-900 uppercase tracking-tight truncate">{label.replace('_', ' ')}</h4>
    </div>
    <div className={`absolute top-5 right-5 w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
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

  const handleToggleSystemFlag = async (field: keyof SystemSettings, val: any) => {
    try {
      await updateDoc(doc(db, 'settings', 'global'), { [field]: val });
      addToast(`Global Write: ${field.toUpperCase()} [${val}]`, 'success');
    } catch (e) {
      addToast('Critical Kernel Write Error', 'error');
    }
  };

  const handleToggleFeature = async (route: AppRoute, val: boolean) => {
    const updatedFlags = { ...(systemSettings.featureFlags || {}), [route]: val };
    try {
      await updateDoc(doc(db, 'settings', 'global'), { featureFlags: updatedFlags });
      addToast(`Protocol ${route.toUpperCase()} ${val ? 'ENGAGED' : 'SUSPENDED'}`, val ? 'success' : 'info');
    } catch (e) {
      addToast('Feature Matrix Update Failure', 'error');
    }
  };

  const handleSuspendNode = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), { isSuspended: !currentStatus });
      addToast(currentStatus ? 'Node Re-synced' : 'Node Isolated', 'info');
    } catch (e) {
      addToast('Node Calibration Refused', 'error');
    }
  };

  const handleDeleteSignal = async (postId: string) => {
    if (!window.confirm('Permanent erasure of this signal packet?')) return;
    try {
      await deleteDoc(doc(db, 'posts', postId));
      addToast('Signal Packet Expunged', 'success');
    } catch (e) {
      addToast('Expunging Interrupted', 'error');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <TacticalCard label="Identity_Nodes" value={metrics.users} trend={12.4} icon={ICONS.Profile} color="indigo" />
              <TacticalCard label="Signal_Flow_24H" value={metrics.posts} trend={18.2} icon={ICONS.Explore} color="emerald" />
              <TacticalCard label="Kernel_Stability" value={metrics.uptime} trend={0.02} icon={ICONS.Admin} color="amber" />
            </div>

            <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6">
              <div className="2xl:col-span-8 bg-white border-precision rounded-[3.5rem] p-10 md:p-12 shadow-sm relative overflow-hidden group">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] font-mono">Realtime_Network_Resonance</h3>
                    <p className="text-xs text-slate-500 font-bold mt-1.5 italic">Active Load: 2.4 TB/s</p>
                  </div>
                  <div className="flex gap-1.5">
                    {[1,2,3,4].map(i => <div key={i} className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(79,70,229,0.5)]" style={{ animationDelay: `${i*0.2}s` }} />)}
                  </div>
                </div>
                <div className="h-72 flex items-end justify-between gap-1 px-4">
                  {Array.from({ length: 64 }).map((_, i) => {
                    const h = Math.random() * 80 + 20;
                    return (
                      <div 
                        key={i} 
                        className={`w-full rounded-t-full transition-all duration-[1s] group-hover:bg-indigo-500 bg-slate-100`} 
                        style={{ height: `${h}%`, opacity: (i / 64) + 0.3 }} 
                      />
                    );
                  })}
                </div>
                <div className="mt-8 pt-8 border-t border-slate-50 flex justify-between text-[9px] font-black font-mono text-slate-300 uppercase tracking-[0.3em]">
                   <span>X_COORD_NODE_001</span>
                   <span className="animate-pulse text-emerald-400">LATENCY_SYNC_OK</span>
                   <span>TIMESTAMP_04:00_Z</span>
                </div>
              </div>

              <div className="2xl:col-span-4 bg-slate-900 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col min-h-[400px]">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.1] mix-blend-overlay" />
                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] font-mono mb-8 relative z-10">Neural_Grid_Alerts</h3>
                <div className="space-y-6 relative z-10 flex-1 overflow-y-auto no-scrollbar">
                  {[
                    { type: 'SUCCESS', msg: 'Node handshake verified', time: '1m' },
                    { type: 'WARNING', msg: 'High packet loss in cluster', time: '12m' },
                    { type: 'MODERATION', msg: 'Neural anomaly expunged', time: '45m' },
                    { type: 'SYSTEM', msg: 'Protocol v2.6 sync complete', time: '2h' },
                  ].map((alert, i) => (
                    <div key={i} className="flex gap-4 items-start border-l-3 border-indigo-500/30 pl-5 py-1.5">
                      <div className="flex-1">
                        <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest font-mono mb-1">{alert.type}</p>
                        <p className="text-[12px] font-bold text-slate-300 leading-tight italic">"{alert.msg}"</p>
                      </div>
                      <span className="text-[8px] font-black text-slate-600 font-mono">{alert.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="bg-white border-precision rounded-[3rem] shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-12 duration-700">
            <div className="p-10 md:p-14 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <div>
                <h3 className="text-3xl font-black text-slate-950 tracking-tighter uppercase italic mb-1">Node_Registry</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Synchronized Assets: {metrics.users}</p>
              </div>
              <div className="relative w-full md:w-80 group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors">
                  <ICONS.Search />
                </div>
                <input 
                  type="text" 
                  placeholder="Intercept Node ID..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] pl-14 pr-6 py-5 text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-300 h-14"
                />
              </div>
            </div>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/30">
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono">Profile</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono">Access</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono">Resonance</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {nodes.filter(n => n.username.toLowerCase().includes(searchQuery.toLowerCase()) || n.displayName.toLowerCase().includes(searchQuery.toLowerCase())).map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-all duration-300 group">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-5">
                          <img src={user.avatarUrl} className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-lg" alt="" />
                          <div>
                            <p className="font-black text-slate-950 text-lg tracking-tighter leading-none mb-1">{user.displayName}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] font-mono border ${user.role === 'admin' ? 'bg-slate-950 text-white border-slate-900 shadow-xl' : 'bg-white text-slate-600 border-slate-200'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full ${user.isSuspended ? 'bg-rose-500' : 'bg-emerald-500'} animate-pulse`} />
                          <span className={`text-[10px] font-black uppercase tracking-[0.2em] font-mono ${user.isSuspended ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {user.isSuspended ? 'ISOLATED' : 'SYNCED'}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <button 
                          onClick={() => handleSuspendNode(user.id, !!user.isSuspended)}
                          className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-90 ${user.isSuspended ? 'bg-emerald-600 text-white shadow-lg' : 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100'}`}
                        >
                          {user.isSuspended ? 'Restore' : 'Isolate'}
                        </button>
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
          <div className="space-y-10 animate-in fade-in duration-700">
            <div className="bg-indigo-600 rounded-[3.5rem] p-12 text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 blur-[80px] rounded-full" />
               <div className="relative z-10">
                 <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none mb-3">Protocol_Matrix</h2>
                 <p className="text-[11px] font-black text-indigo-100 uppercase tracking-[0.4em] font-mono">Global Layer Engagement Control</p>
               </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {Object.values(AppRoute).map(route => (
                <ProtocolModule 
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
          <div className="space-y-10 animate-in fade-in duration-700">
            <div className="flex justify-between items-end mb-12 px-2">
               <div>
                 <h3 className="text-4xl md:text-5xl font-black text-slate-950 tracking-tighter uppercase italic leading-none mb-2">Signal_Buffer</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] font-mono">Live Transmission Interceptor</p>
               </div>
               <button className="px-8 py-4 bg-slate-950 text-white rounded-[1.25rem] text-[10px] font-black uppercase tracking-[0.3em] font-mono shadow-xl hover:bg-black transition-all">Flush_Buffer</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {signals.map(post => (
                <div key={post.id} className="bg-white border-precision rounded-[3rem] p-10 flex flex-col sm:flex-row gap-8 items-start group hover:shadow-2xl hover:border-indigo-100 transition-all duration-500">
                  <div className="shrink-0">
                    <img src={post.authorAvatar} className="w-16 h-16 rounded-[1.25rem] object-cover border-4 border-white shadow-xl" alt="" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-lg font-black text-slate-950 tracking-tight leading-none mb-1">{post.authorName}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">{post.createdAt}</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteSignal(post.id)}
                        className="p-3 bg-rose-50 text-rose-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white active:scale-90"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium mb-6 italic">"{post.content}"</p>
                    {post.media?.[0] && (
                      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 w-fit">
                         <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-indigo-600"><ICONS.Create /></div>
                         <div className="pr-4">
                            <p className="text-[10px] font-black text-slate-950 uppercase tracking-tight">{post.media[0].type.toUpperCase()}_STREAM</p>
                         </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'system':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in zoom-in-95 duration-500">
            <div className="lg:col-span-7 bg-white border-precision rounded-[3.5rem] p-10 md:p-14 shadow-sm space-y-12">
               <div>
                  <h3 className="text-4xl font-black text-slate-950 tracking-tighter uppercase italic mb-2 leading-none">Kernel_Lockdown</h3>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Infrastructure Override</p>
               </div>
               
               <div className="space-y-6">
                  <div className="flex items-center justify-between p-8 bg-slate-950 text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10">
                      <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.4em] font-mono mb-1">GLOBAL_MAINTENANCE</p>
                      <p className="text-xs text-slate-400 font-bold max-w-sm leading-relaxed">Immediate network isolation protocol.</p>
                    </div>
                    <button 
                      onClick={() => handleToggleSystemFlag('maintenanceMode', !systemSettings.maintenanceMode)}
                      className={`relative inline-flex h-11 w-20 shrink-0 cursor-pointer rounded-full border-4 border-transparent transition-colors duration-300 ease-in-out focus:outline-none z-10 ${systemSettings.maintenanceMode ? 'bg-rose-600' : 'bg-slate-800'}`}
                    >
                      <span className={`pointer-events-none inline-block h-8.5 w-8.5 transform rounded-full bg-white shadow-2xl ring-0 transition duration-300 ease-in-out ${systemSettings.maintenanceMode ? 'translate-x-9' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] hover:bg-white hover:shadow-xl transition-all duration-500 group">
                    <div>
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] font-mono mb-1">REGISTRATION_GATE</p>
                      <p className="text-xs text-slate-500 font-bold leading-relaxed italic">Decline all inbound handshakes.</p>
                    </div>
                    <button 
                      onClick={() => handleToggleSystemFlag('registrationDisabled', !systemSettings.registrationDisabled)}
                      className={`relative inline-flex h-11 w-20 shrink-0 cursor-pointer rounded-full border-4 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${systemSettings.registrationDisabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <span className={`pointer-events-none inline-block h-8.5 w-8.5 transform rounded-full bg-white shadow-2xl ring-0 transition duration-300 ease-in-out ${systemSettings.registrationDisabled ? 'translate-x-9' : 'translate-x-0'}`} />
                    </button>
                  </div>
               </div>
            </div>

            <div className="lg:col-span-5 bg-slate-900 rounded-[3.5rem] p-10 md:p-14 text-white shadow-2xl relative overflow-hidden flex flex-col">
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent" />
               <div className="relative z-10 flex flex-col h-full">
                  <h3 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.5em] font-mono mb-10">Security_Resonance</h3>
                  <div className="space-y-4 flex-1">
                    {(['Alpha', 'Beta', 'Gamma'] as const).map(tier => (
                      <button 
                        key={tier}
                        onClick={() => handleToggleSystemFlag('minTrustTier', tier)}
                        className={`w-full flex items-center justify-between p-7 rounded-[1.75rem] border transition-all duration-500 ${systemSettings.minTrustTier === tier ? 'bg-white text-slate-950 border-white shadow-[0_40px_100px_rgba(255,255,255,0.1)] scale-[1.03]' : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10'}`}
                      >
                        <div className="text-left">
                           <span className="text-[10px] font-black uppercase tracking-[0.3em] font-mono block mb-1">{tier}_ACCESS</span>
                           <span className={`text-[9px] font-black uppercase tracking-widest ${systemSettings.minTrustTier === tier ? 'text-indigo-600' : 'opacity-40'}`}>Tier: Level_{tier === 'Alpha' ? '03' : tier === 'Beta' ? '02' : '01'}</span>
                        </div>
                        {systemSettings.minTrustTier === tier && <div className="w-3 h-3 bg-indigo-600 rounded-full animate-ping" />}
                      </button>
                    ))}
                  </div>
                  <div className="mt-16 pt-8 border-t border-white/5 text-center">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] font-mono">
                      Kernel Log ID: {auth.currentUser?.uid.toUpperCase() || 'EXTERNAL'}
                    </p>
                  </div>
               </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 min-h-screen animate-in fade-in duration-1000 max-w-[2560px] mx-auto px-4 md:px-8 xl:px-12">
      
      {/* CITADEL MASTER NAVIGATION SIDEBAR (REFINED WIDTH) */}
      <nav className="w-full lg:w-72 shrink-0 space-y-4 lg:sticky lg:top-10 lg:h-[calc(100vh-100px)] overflow-y-auto no-scrollbar pt-6 pb-20">
        <div className="px-8 py-10 bg-slate-950 rounded-[3.5rem] border border-white/10 shadow-2xl relative overflow-hidden group mb-8">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2" />
          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none mb-1 relative z-10">Citadel</h2>
          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.5em] font-mono relative z-10 leading-none">Root_Cmd</p>
        </div>

        <div className="flex flex-col gap-2.5">
          {[
            { id: 'overview', label: 'Cmd_Dash', icon: ICONS.Home },
            { id: 'users', label: 'Identity', icon: ICONS.Profile },
            { id: 'content', label: 'Signals', icon: ICONS.Explore },
            { id: 'features', label: 'Protocol', icon: ICONS.Settings },
            { id: 'system', label: 'Infra', icon: ICONS.Admin },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-5 px-8 py-5 rounded-[1.75rem] transition-all duration-500 group active:scale-95 text-left border ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-[0_30px_70px_-15px_rgba(79,70,229,0.3)] border-indigo-500' : 'text-slate-500 hover:bg-white hover:text-slate-950 border-transparent hover:border-slate-100'}`}
            >
              <div className={`shrink-0 transition-all duration-700 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                <tab.icon />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.3em] font-mono flex-1 leading-none truncate">{tab.label}</span>
              {activeTab === tab.id && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
            </button>
          ))}
        </div>
      </nav>

      {/* PRIMARY COMMAND VIEWPORT */}
      <div className="flex-1 min-w-0 pb-32 pt-6">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-16 gap-8 px-2">
          <div>
             <h1 className="text-6xl md:text-7xl xl:text-8xl font-black text-slate-950 tracking-tighter uppercase italic leading-none">{activeTab}_OPS</h1>
             <div className="flex flex-wrap items-center gap-4 mt-6">
               <div className="px-5 py-2.5 bg-slate-950 text-white rounded-xl text-[9px] font-black font-mono tracking-[0.3em] uppercase italic">GB_LON_001</div>
               <div className="h-px w-14 bg-slate-200" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] font-mono">Status: Grid_Operational</p>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="px-7 py-5 bg-white border-precision rounded-[2rem] shadow-sm text-center min-w-[140px] group hover:shadow-lg transition-all">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1.5">Neural_Time</p>
                <p className="text-lg font-black text-slate-950 font-mono tracking-tighter leading-none">{new Date().toLocaleTimeString(locale, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
             </div>
          </div>
        </div>

        {renderContent()}
      </div>

    </div>
  );
};