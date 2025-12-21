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
    <div className={`relative overflow-hidden bg-white border-precision rounded-[2.5rem] p-8 transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] group`}>
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorMap[color]} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-2xl shadow-slate-200 group-hover:scale-110 transition-transform duration-500">
            <Icon />
          </div>
          <div className="text-right">
            <span className={`text-[9px] font-black font-mono px-3 py-1 rounded-full ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          </div>
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mb-2">{label}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter italic leading-none">{value}</h3>
            <span className="text-[10px] font-black text-slate-300 font-mono uppercase tracking-widest">Nodes</span>
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
  <div className={`group relative p-6 rounded-[2.5rem] border transition-all duration-500 flex flex-col justify-between h-48 ${isActive ? 'bg-white border-slate-100 shadow-sm hover:shadow-2xl hover:border-indigo-200' : 'bg-slate-50 border-slate-200 grayscale opacity-60'}`}>
    <div className="flex justify-between items-start">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
        <ICONS.Settings />
      </div>
      <button 
        onClick={() => onToggle(route, !isActive)}
        className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-4 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${isActive ? 'bg-indigo-600' : 'bg-slate-300'}`}
      >
        <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-xl ring-0 transition duration-300 ease-in-out ${isActive ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
    </div>
    <div className="space-y-1">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono">SYS_PROTO_{route.toUpperCase()}</p>
      <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{label.replace('_', ' ')}</h4>
    </div>
    <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
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
      addToast(`Kernel Update: ${field.toUpperCase()} -> ${val}`, 'success');
    } catch (e) {
      addToast('Critical Kernel Write Error', 'error');
    }
  };

  const handleToggleFeature = async (route: AppRoute, val: boolean) => {
    const updatedFlags = { ...(systemSettings.featureFlags || {}), [route]: val };
    try {
      await updateDoc(doc(db, 'settings', 'global'), { featureFlags: updatedFlags });
      addToast(`Protocol ${route.toUpperCase()} ${val ? 'RE-ENGAGED' : 'SUSPENDED'}`, val ? 'success' : 'info');
    } catch (e) {
      addToast('Protocol Switch Failure', 'error');
    }
  };

  const handleSuspendNode = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), { isSuspended: !currentStatus });
      addToast(currentStatus ? 'Node Re-synchronized' : 'Node Isolated from Grid', 'info');
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
              <TacticalCard label="Identity_Nodes" value={metrics.users} trend={8.4} icon={ICONS.Profile} color="indigo" />
              <TacticalCard label="Signal_Flow_24H" value={metrics.posts} trend={12.2} icon={ICONS.Explore} color="emerald" />
              <TacticalCard label="Kernel_Stability" value={metrics.uptime} trend={0.01} icon={ICONS.Admin} color="amber" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 bg-white border-precision rounded-[3rem] p-10 shadow-sm relative overflow-hidden group">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Realtime_Grid_Frequency</h3>
                    <p className="text-xs text-slate-500 font-bold mt-1">Global Buffer: 1.2ms latency</p>
                  </div>
                  <div className="flex gap-1">
                    {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: `${i*0.2}s` }} />)}
                  </div>
                </div>
                <div className="h-64 flex items-end justify-between gap-1 px-4">
                  {Array.from({ length: 48 }).map((_, i) => {
                    const h = Math.random() * 80 + 10;
                    return (
                      <div 
                        key={i} 
                        className={`w-full rounded-t-full transition-all duration-1000 group-hover:bg-indigo-500 bg-slate-100`} 
                        style={{ height: `${h}%`, opacity: (i / 48) + 0.2 }} 
                      />
                    );
                  })}
                </div>
                <div className="mt-8 pt-8 border-t border-slate-50 flex justify-between text-[8px] font-black font-mono text-slate-300 uppercase tracking-widest">
                   <span>00:00:00_NODE_START</span>
                   <span>LOCAL_GRID_RESONANCE_OK</span>
                   <span>BUFFER_FULL</span>
                </div>
              </div>

              <div className="lg:col-span-4 bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] font-mono mb-8 relative z-10">Recent_Alerts</h3>
                <div className="space-y-6 relative z-10">
                  {[
                    { type: 'SUCCESS', msg: 'Neural Handshake: node_042x connected', time: '2m' },
                    { type: 'ALERT', msg: 'Signal Spike detected in GB-LON cluster', time: '14m' },
                    { type: 'SYSTEM', msg: 'Auto-moderation expunged 12 anomalies', time: '1h' },
                    { type: 'INFO', msg: 'Kernel upgrade to v2.6 complete', time: '3h' },
                  ].map((alert, i) => (
                    <div key={i} className="flex gap-4 items-start border-l-2 border-indigo-500/30 pl-4 py-1">
                      <div className="flex-1">
                        <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest font-mono mb-1">{alert.type}</p>
                        <p className="text-[11px] font-bold text-slate-300 leading-tight">{alert.msg}</p>
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
          <div className="bg-white border-precision rounded-[3rem] shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-10 duration-500">
            <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mb-1">Identity_Manifest</h3>
                <p className="text-xs text-slate-500 font-bold">Total Synchronized Nodes: {metrics.users}</p>
              </div>
              <div className="relative w-full md:w-80">
                <ICONS.Search />
                <input 
                  type="text" 
                  placeholder="Filter by Node ID / Username..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-300 h-14"
                />
              </div>
            </div>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Node_Profile</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Permission_Tier</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Grid_Connectivity</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Intervention</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {nodes.filter(n => n.username.toLowerCase().includes(searchQuery.toLowerCase()) || n.displayName.toLowerCase().includes(searchQuery.toLowerCase())).map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-5">
                          <img src={user.avatarUrl} className="w-12 h-12 rounded-2xl object-cover border border-slate-100 shadow-sm" alt="" />
                          <div>
                            <p className="font-black text-slate-900 text-base tracking-tighter">{user.displayName}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">@{user.username} • {user.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${user.role === 'admin' ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-100' : 'bg-white text-slate-600 border-slate-200'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full ${user.isSuspended ? 'bg-rose-500' : 'bg-emerald-500'} animate-pulse`} />
                          <span className={`text-[10px] font-black uppercase tracking-widest font-mono ${user.isSuspended ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {user.isSuspended ? 'ISOLATED' : 'SYNCED'}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button 
                            onClick={() => handleSuspendNode(user.id, !!user.isSuspended)}
                            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${user.isSuspended ? 'bg-emerald-600 text-white shadow-lg' : 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100'}`}
                          >
                            {user.isSuspended ? 'Restore' : 'Suspend'}
                          </button>
                          <button className="p-2.5 bg-slate-100 text-slate-400 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl transition-all">
                             <ICONS.Settings />
                          </button>
                        </div>
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
            <div className="bg-indigo-600 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full" />
               <div className="relative z-10">
                 <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Protocol_Command</h2>
                 <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.4em] font-mono">Engagement & Interface Toggle Matrix</p>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
          <div className="space-y-6 animate-in fade-in duration-700">
            <div className="flex justify-between items-center mb-10 px-4">
               <div>
                 <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Signal_Buffer</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mt-2">Moderation Queue • Live_Stream_Interceptor</p>
               </div>
               <button className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest font-mono shadow-xl active:scale-95">Purge_Old_Signals</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {signals.map(post => (
                <div key={post.id} className="bg-white border-precision rounded-[3rem] p-8 flex gap-8 items-start group hover:shadow-2xl hover:border-indigo-100 transition-all duration-500">
                  <div className="shrink-0 relative">
                    <img src={post.authorAvatar} className="w-14 h-14 rounded-2xl object-cover border border-slate-100 shadow-sm" alt="" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-sm font-black text-slate-900 tracking-tight">{post.authorName}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">{post.createdAt} • ID:{post.id.slice(0,6)}</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteSignal(post.id)}
                        className="p-3 bg-rose-50 text-rose-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white active:scale-90"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed italic mb-4">"{post.content}"</p>
                    {post.media?.[0] && (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 w-fit">
                         <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                            <ICONS.Create />
                         </div>
                         <div className="pr-4">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Media_Asset</p>
                            <p className="text-[10px] font-bold text-slate-900 uppercase">{post.media[0].type}</p>
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in zoom-in-95 duration-500">
            <div className="lg:col-span-7 bg-white border-precision rounded-[3rem] p-10 md:p-14 shadow-sm space-y-12">
               <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic mb-2">Kernel_Lockdown</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Infrastructure Emergency Protocols</p>
               </div>
               
               <div className="space-y-6">
                  <div className="flex items-center justify-between p-8 bg-slate-950 text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="relative z-10">
                      <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.3em] font-mono mb-1">GLOBAL_MAINTENANCE_SYNC</p>
                      <p className="text-sm text-slate-400 font-medium">Isolate entire network immediately. All nodes will be held in synchronization overlay.</p>
                    </div>
                    <button 
                      onClick={() => handleToggleSystemFlag('maintenanceMode', !systemSettings.maintenanceMode)}
                      className={`relative inline-flex h-10 w-20 shrink-0 cursor-pointer rounded-full border-4 border-transparent transition-colors duration-300 ease-in-out focus:outline-none z-10 ${systemSettings.maintenanceMode ? 'bg-rose-600' : 'bg-slate-800'}`}
                    >
                      <span className={`pointer-events-none inline-block h-8 w-8 transform rounded-full bg-white shadow-2xl ring-0 transition duration-300 ease-in-out ${systemSettings.maintenanceMode ? 'translate-x-10' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] hover:bg-white hover:shadow-xl transition-all duration-500 group">
                    <div>
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] font-mono mb-1">REGISTRATION_GATE_LOCK</p>
                      <p className="text-sm text-slate-500 font-medium italic">Decline all new neural handshake requests. Primary grid access only.</p>
                    </div>
                    <button 
                      onClick={() => handleToggleSystemFlag('registrationDisabled', !systemSettings.registrationDisabled)}
                      className={`relative inline-flex h-10 w-20 shrink-0 cursor-pointer rounded-full border-4 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${systemSettings.registrationDisabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <span className={`pointer-events-none inline-block h-8 w-8 transform rounded-full bg-white shadow-2xl ring-0 transition duration-300 ease-in-out ${systemSettings.registrationDisabled ? 'translate-x-10' : 'translate-x-0'}`} />
                    </button>
                  </div>
               </div>
            </div>

            <div className="lg:col-span-5 bg-slate-900 rounded-[3rem] p-10 md:p-14 text-white shadow-2xl relative overflow-hidden flex flex-col">
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent" />
               <div className="relative z-10 flex flex-col h-full">
                  <h3 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em] font-mono mb-10">Security_Resonance_Tier</h3>
                  <div className="space-y-4 flex-1">
                    {(['Alpha', 'Beta', 'Gamma'] as const).map(tier => (
                      <button 
                        key={tier}
                        onClick={() => handleToggleSystemFlag('minTrustTier', tier)}
                        className={`w-full flex items-center justify-between p-6 rounded-2xl border transition-all duration-500 ${systemSettings.minTrustTier === tier ? 'bg-white text-slate-900 border-white shadow-[0_20px_50px_rgba(255,255,255,0.1)] scale-105' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                      >
                        <div className="text-left">
                           <span className="text-[10px] font-black uppercase tracking-[0.2em] font-mono block mb-1">{tier}_NODE_ACCESS</span>
                           <span className="text-[9px] font-bold opacity-60">Auth Protocol: Level_{tier === 'Alpha' ? '3' : tier === 'Beta' ? '2' : '1'}</span>
                        </div>
                        {systemSettings.minTrustTier === tier && <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-pulse" />}
                      </button>
                    ))}
                  </div>
                  <div className="mt-14 pt-10 border-t border-white/5 text-center">
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest font-mono leading-relaxed">
                      All infrastructure modifications are logged via citadel node:<br />
                      {auth.currentUser?.uid.toUpperCase()}
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
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 min-h-screen animate-in fade-in duration-1000">
      
      {/* CITADEL SIDE NAVIGATION */}
      <nav className="w-full lg:w-80 shrink-0 space-y-3">
        <div className="px-8 py-8 bg-slate-950 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden group mb-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2" />
          <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none mb-1 relative z-10">Citadel</h2>
          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.5em] font-mono relative z-10">Global_Root_Controller</p>
        </div>

        <div className="flex flex-col gap-2">
          {[
            { id: 'overview', label: 'Command_Dash', icon: ICONS.Home },
            { id: 'users', label: 'Identity_Nodes', icon: ICONS.Profile },
            { id: 'content', label: 'Signal_Buffer', icon: ICONS.Explore },
            { id: 'features', label: 'Protocol_Matrix', icon: ICONS.Settings },
            { id: 'system', label: 'Infrastructure', icon: ICONS.Admin },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-5 px-8 py-5 rounded-2xl transition-all duration-500 group active:scale-95 text-left border ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-[0_25px_60px_-15px_rgba(79,70,229,0.35)] border-indigo-500' : 'text-slate-500 hover:bg-white hover:text-slate-950 border-transparent hover:border-slate-100 hover:shadow-xl'}`}
            >
              <div className={`shrink-0 transition-transform duration-700 ${activeTab === tab.id ? 'scale-110 rotate-3' : 'group-hover:scale-110'}`}>
                <tab.icon />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.2em] font-mono flex-1 leading-none">{tab.label}</span>
              {activeTab === tab.id && <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />}
            </button>
          ))}
        </div>
      </nav>

      {/* PRIMARY COMMAND VIEWPORT */}
      <div className="flex-1 min-w-0 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8 px-2">
          <div>
             <h1 className="text-5xl md:text-7xl font-black text-slate-950 tracking-tighter uppercase italic leading-none">{activeTab}_OPS</h1>
             <div className="flex items-center gap-4 mt-4">
               <div className="px-5 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black font-mono tracking-widest uppercase italic">Node: GB_LON_OVR</div>
               <div className="h-px w-12 bg-slate-100" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Status: Grid_Operational</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-6 py-4 bg-white border-precision rounded-2xl shadow-sm text-center min-w-[120px]">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1">Local_Time</p>
                <p className="text-sm font-black text-slate-900 font-mono tracking-tighter">{new Date().toLocaleTimeString(locale, { hour12: false })}</p>
             </div>
          </div>
        </div>

        {renderContent()}
      </div>

    </div>
  );
};