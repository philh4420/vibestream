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
            <h3 className="text-4xl md:text-5xl xl:text-7xl font-black text-slate-900 tracking-tighter italic leading-none">{value}</h3>
            <span className="text-[10px] font-black text-slate-300 font-mono uppercase tracking-widest ml-2">Active</span>
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
  <div className={`group relative p-8 rounded-[3rem] border transition-all duration-500 flex flex-col justify-between h-56 ${isActive ? 'bg-white border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200' : 'bg-slate-50 border-slate-200 grayscale opacity-60'}`}>
    <div className="flex justify-between items-start">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
        <ICONS.Settings />
      </div>
      <button 
        onClick={() => onToggle(route, !isActive)}
        className={`relative inline-flex h-10 w-16 shrink-0 cursor-pointer rounded-full border-[4px] border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${isActive ? 'bg-indigo-600' : 'bg-slate-300'}`}
      >
        <span className={`pointer-events-none inline-block h-7.5 w-7.5 transform rounded-full bg-white shadow-xl ring-0 transition duration-300 ease-in-out ${isActive ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
    </div>
    <div className="space-y-2">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono">PROTOCOL_{route.toUpperCase()}</p>
      <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight truncate">{label.replace('_', ' ')}</h4>
    </div>
    <div className={`absolute top-6 right-6 w-2.5 h-2.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
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
      addToast(`Global Protocol Update: ${field.toUpperCase()} [${val}]`, 'success');
    } catch (e) {
      addToast('Critical Kernel Write Failure', 'error');
    }
  };

  const handleToggleFeature = async (route: AppRoute, val: boolean) => {
    const updatedFlags = { ...(systemSettings.featureFlags || {}), [route]: val };
    try {
      await updateDoc(doc(db, 'settings', 'global'), { featureFlags: updatedFlags });
      addToast(`${route.toUpperCase()} Protocol ${val ? 'ENGAGED' : 'OFFLINE'}`, val ? 'success' : 'info');
    } catch (e) {
      addToast('Feature Matrix Write Failure', 'error');
    }
  };

  const handleSuspendNode = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), { isSuspended: !currentStatus });
      addToast(currentStatus ? 'Node Re-synchronised' : 'Node Isolated', 'info');
    } catch (e) {
      addToast('Node State Modification Refused', 'error');
    }
  };

  const handleDeleteSignal = async (postId: string) => {
    if (!window.confirm('Confirm permanent signal erasure from grid?')) return;
    try {
      await deleteDoc(doc(db, 'posts', postId));
      addToast('Signal Packet Expunged', 'success');
    } catch (e) {
      addToast('Expunging Handshake Failed', 'error');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Command_Dash', icon: ICONS.Home },
    { id: 'users', label: 'Identity_Nodes', icon: ICONS.Profile },
    { id: 'content', label: 'Signal_Buffer', icon: ICONS.Explore },
    { id: 'features', label: 'Protocol_Matrix', icon: ICONS.Settings },
    { id: 'system', label: 'Infrastructure', icon: ICONS.Admin },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <TacticalCard label="Identity_Nodes" value={metrics.users} trend={12.4} icon={ICONS.Profile} color="indigo" />
              <TacticalCard label="Signal_Flow_24H" value={metrics.posts} trend={18.2} icon={ICONS.Explore} color="emerald" />
              <TacticalCard label="Kernel_Stability" value={metrics.uptime} trend={0.02} icon={ICONS.Admin} color="amber" />
            </div>

            <div className="grid grid-cols-1 2xl:grid-cols-12 gap-8">
              <div className="2xl:col-span-8 bg-white border-precision rounded-[4rem] p-12 md:p-16 shadow-sm relative overflow-hidden group">
                <div className="flex justify-between items-center mb-12">
                  <div>
                    <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.6em] font-mono">Realtime_Neural_Resonance</h3>
                    <p className="text-sm text-slate-500 font-bold mt-2 italic">Network Load: Optimized</p>
                  </div>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(i => <div key={i} className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: `${i*0.15}s` }} />)}
                  </div>
                </div>
                <div className="h-80 flex items-end justify-between gap-1.5 px-6">
                  {Array.from({ length: 64 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-full rounded-t-full transition-all duration-[1.2s] group-hover:bg-indigo-600 bg-slate-100`} 
                      style={{ height: `${Math.random() * 85 + 15}%`, opacity: (i / 64) + 0.3 }} 
                    />
                  ))}
                </div>
                <div className="mt-12 pt-10 border-t border-slate-50 flex justify-between text-[11px] font-black font-mono text-slate-300 uppercase tracking-[0.4em]">
                   <span>GB_LON_NODE_ROOT</span>
                   <span className="animate-pulse text-emerald-500">SYNC_STATUS_OPERATIONAL</span>
                   <span>REF_TIME_Z</span>
                </div>
              </div>

              <div className="2xl:col-span-4 bg-slate-950 rounded-[4rem] p-12 text-white shadow-2xl relative overflow-hidden flex flex-col min-h-[450px]">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.12] mix-blend-overlay" />
                <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full" />
                <h3 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.5em] font-mono mb-10 relative z-10">Neural_Grid_Interceptor</h3>
                <div className="space-y-8 relative z-10 flex-1 overflow-y-auto no-scrollbar">
                  {[
                    { type: 'SUCCESS', msg: 'Core handshake verified: node_v2', time: '1m' },
                    { type: 'WARNING', msg: 'Latency spike in Paris node', time: '14m' },
                    { type: 'PROTOCOL', msg: 'Global feature flip re-initialized', time: '42m' },
                    { type: 'SYSTEM', msg: 'Kernel upgrade synchronisation ok', time: '1h' },
                    { type: 'SECURITY', msg: 'Authorised root access established', time: '4h' },
                  ].map((alert, i) => (
                    <div key={i} className="flex gap-6 items-start border-l-4 border-indigo-500/40 pl-6 py-2 hover:bg-white/5 transition-colors rounded-r-2xl">
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] font-mono mb-1">{alert.type}</p>
                        <p className="text-[14px] font-bold text-slate-300 leading-snug italic truncate">"{alert.msg}"</p>
                      </div>
                      <span className="text-[9px] font-black text-slate-600 font-mono mt-1 shrink-0">{alert.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="bg-white border-precision rounded-[4rem] shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-10 duration-700 w-full">
            <div className="p-12 md:p-16 border-b border-slate-50 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10">
              <div>
                <h3 className="text-4xl font-black text-slate-950 tracking-tighter uppercase italic mb-2">Node_Manifest</h3>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] font-mono">Scanning identity mesh nodes: {metrics.users}</p>
              </div>
              <div className="relative w-full xl:w-[500px] group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors">
                  <ICONS.Search />
                </div>
                <input 
                  type="text" 
                  placeholder="Intercept Node Identification..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-[2.2rem] pl-16 pr-8 py-6 text-base font-bold focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-300 h-20 shadow-inner"
                />
              </div>
            </div>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/40">
                    <th className="px-12 py-10 text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Neural_Identity</th>
                    <th className="px-12 py-10 text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Permission_Tier</th>
                    <th className="px-12 py-10 text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Uplink_Sync</th>
                    <th className="px-12 py-10 text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono text-right">Action_Matrix</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {nodes.filter(n => n.username.toLowerCase().includes(searchQuery.toLowerCase()) || n.displayName.toLowerCase().includes(searchQuery.toLowerCase())).map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-all duration-300 group">
                      <td className="px-12 py-10">
                        <div className="flex items-center gap-8">
                          <div className="relative">
                            <img src={user.avatarUrl} className="w-20 h-20 rounded-[2.2rem] object-cover border-[3px] border-white shadow-xl group-hover:rotate-3 transition-all" alt="" />
                            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-[5px] border-white shadow-md ${user.isSuspended ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                          </div>
                          <div>
                            <p className="font-black text-slate-950 text-2xl tracking-tighter leading-none mb-2">{user.displayName}</p>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest font-mono">ID: {user.id.slice(0, 14).toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-12 py-10">
                        <span className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] font-mono border ${user.role === 'admin' ? 'bg-slate-950 text-white border-slate-900 shadow-2xl' : 'bg-white text-slate-600 border-slate-200'}`}>
                          {user.role === 'admin' ? 'CITADEL_ROOT' : 'GRID_MEMBER'}
                        </span>
                      </td>
                      <td className="px-12 py-10">
                        <div className="flex items-center gap-4">
                          <div className={`w-3.5 h-3.5 rounded-full ${user.isSuspended ? 'bg-rose-500' : 'bg-emerald-500'} animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.4)]`} />
                          <span className={`text-[12px] font-black uppercase tracking-[0.3em] font-mono ${user.isSuspended ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {user.isSuspended ? 'ISOLATED' : 'SYNCHRONISED'}
                          </span>
                        </div>
                      </td>
                      <td className="px-12 py-10 text-right">
                        <div className="flex justify-end gap-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <button 
                            onClick={() => handleSuspendNode(user.id, !!user.isSuspended)}
                            className={`px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-90 shadow-xl ${user.isSuspended ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20' : 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 shadow-rose-500/5'}`}
                          >
                            {user.isSuspended ? 'Restore_Handshake' : 'Suspend_Node'}
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
          <div className="space-y-12 animate-in fade-in duration-1000 w-full">
            <div className="bg-indigo-600 rounded-[4rem] p-16 text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3" />
               <div className="relative z-10 max-w-3xl">
                 <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none mb-6">Protocol_Engagement_Matrix</h2>
                 <p className="text-[13px] font-black text-indigo-100 uppercase tracking-[0.6em] font-mono leading-relaxed opacity-80">Centralised Neural Switchboard for Primary Grid Global Layers.</p>
               </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
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
          <div className="space-y-12 animate-in fade-in duration-1000 w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 px-6 gap-10">
               <div>
                 <h3 className="text-5xl md:text-7xl font-black text-slate-950 tracking-tighter uppercase italic leading-none mb-4">Signal_Buffer</h3>
                 <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.6em] font-mono">Deep Packet Interceptor • Neural Verification Protocol</p>
               </div>
               <button className="px-12 py-6 bg-slate-950 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.4em] font-mono shadow-2xl hover:bg-black active:scale-95 transition-all">Flush_Buffer_Archive</button>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
              {signals.map(post => (
                <div key={post.id} className="bg-white border-precision rounded-[4.5rem] p-12 flex flex-col md:flex-row gap-12 items-start group hover:shadow-2xl hover:border-indigo-100 transition-all duration-700">
                  <div className="shrink-0 relative">
                    <img src={post.authorAvatar} className="w-24 h-24 rounded-[2.5rem] object-cover border-[4px] border-white shadow-2xl" alt="" />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 border-[6px] border-white rounded-full shadow-lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <p className="text-2xl font-black text-slate-950 tracking-tight leading-none mb-2">{post.authorName}</p>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] font-mono italic">PKT_{post.id.slice(0, 12).toUpperCase()} • {post.createdAt}</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteSignal(post.id)}
                        className="p-5 bg-rose-50 text-rose-500 rounded-3xl opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white active:scale-90 shadow-sm"
                      >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                    <p className="text-lg text-slate-700 leading-relaxed font-medium mb-10 italic">"{post.content}"</p>
                    {post.media?.[0] && (
                      <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 w-fit group/media cursor-pointer hover:bg-indigo-50 transition-colors">
                         <div className="w-16 h-16 rounded-[1.5rem] bg-white shadow-sm flex items-center justify-center text-indigo-600">
                            <ICONS.Create />
                         </div>
                         <div className="pr-8">
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono mb-1">Grid_Payload</p>
                            <p className="text-[14px] font-black text-slate-950 uppercase tracking-tight">{post.media[0].type.toUpperCase()}_STREAM_SYNCHRONISED</p>
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
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 animate-in zoom-in-95 duration-700 w-full">
            <div className="xl:col-span-7 bg-white border-precision rounded-[4.5rem] p-16 md:p-24 shadow-sm space-y-20">
               <div>
                  <h3 className="text-5xl md:text-7xl font-black text-slate-950 tracking-tighter uppercase italic mb-6 leading-none">Kernel_Override</h3>
                  <p className="text-[13px] font-black text-slate-400 uppercase tracking-[0.6em] font-mono">Infrastructure Emergency Control Suite</p>
               </div>
               
               <div className="space-y-10">
                  <div className="flex items-center justify-between p-12 bg-slate-950 text-white rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    <div className="relative z-10">
                      <p className="text-[12px] font-black text-rose-400 uppercase tracking-[0.5em] font-mono mb-3">GLOBAL_MAINTENANCE_SYNC</p>
                      <p className="text-base text-slate-400 font-bold max-w-md leading-relaxed">Suspend entire grid operation immediately. All neural sessions will be archived in the maintenance buffer.</p>
                    </div>
                    <button 
                      onClick={() => handleToggleSystemFlag('maintenanceMode', !systemSettings.maintenanceMode)}
                      className={`relative inline-flex h-14 w-28 shrink-0 cursor-pointer rounded-full border-[5px] border-transparent transition-colors duration-500 ease-in-out focus:outline-none z-10 ${systemSettings.maintenanceMode ? 'bg-rose-600' : 'bg-slate-800'}`}
                    >
                      <span className={`pointer-events-none inline-block h-10 w-10 transform rounded-full bg-white shadow-2xl ring-0 transition duration-500 ease-in-out ${systemSettings.maintenanceMode ? 'translate-x-14' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-12 bg-slate-50 border border-slate-100 rounded-[3.5rem] hover:bg-white hover:shadow-2xl transition-all duration-700 group">
                    <div>
                      <p className="text-[12px] font-black text-indigo-500 uppercase tracking-[0.5em] font-mono mb-3">REGISTRATION_GATE_LOCK</p>
                      <p className="text-base text-slate-500 font-bold max-w-md leading-relaxed italic">Decline all inbound handshakes. Prevent identity replication across global clusters.</p>
                    </div>
                    <button 
                      onClick={() => handleToggleSystemFlag('registrationDisabled', !systemSettings.registrationDisabled)}
                      className={`relative inline-flex h-14 w-28 shrink-0 cursor-pointer rounded-full border-[5px] border-transparent transition-colors duration-500 ease-in-out focus:outline-none ${systemSettings.registrationDisabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <span className={`pointer-events-none inline-block h-10 w-10 transform rounded-full bg-white shadow-2xl ring-0 transition duration-500 ease-in-out ${systemSettings.registrationDisabled ? 'translate-x-14' : 'translate-x-0'}`} />
                    </button>
                  </div>
               </div>
            </div>

            <div className="xl:col-span-5 bg-slate-900 rounded-[4.5rem] p-16 md:p-24 text-white shadow-2xl relative overflow-hidden flex flex-col">
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent" />
               <div className="relative z-10 flex flex-col h-full">
                  <h3 className="text-[13px] font-black text-indigo-400 uppercase tracking-[0.6em] font-mono mb-16">Resonance_Trust_Hierarchy</h3>
                  <div className="space-y-8 flex-1">
                    {(['Alpha', 'Beta', 'Gamma'] as const).map(tier => (
                      <button 
                        key={tier}
                        onClick={() => handleToggleSystemFlag('minTrustTier', tier)}
                        className={`w-full flex items-center justify-between p-10 rounded-[2.5rem] border transition-all duration-700 ${systemSettings.minTrustTier === tier ? 'bg-white text-slate-950 border-white shadow-[0_50px_120px_rgba(255,255,255,0.12)] scale-[1.03]' : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10 hover:text-slate-300'}`}
                      >
                        <div className="text-left">
                           <span className="text-[12px] font-black uppercase tracking-[0.4em] font-mono block mb-3">{tier}_ACCESS_PROTOCOL</span>
                           <span className={`text-[11px] font-black uppercase tracking-widest ${systemSettings.minTrustTier === tier ? 'text-indigo-600' : 'opacity-40'}`}>Auth_Calibration: Level_0{tier === 'Alpha' ? '3' : tier === 'Beta' ? '2' : '1'}</span>
                        </div>
                        {systemSettings.minTrustTier === tier && <div className="w-4 h-4 bg-indigo-600 rounded-full animate-ping shadow-[0_0_20px_rgba(79,70,229,1)]" />}
                      </button>
                    ))}
                  </div>
                  <div className="mt-24 pt-12 border-t border-white/5 text-center">
                    <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.5em] font-mono leading-relaxed">
                      Infrastructure Hash: {auth.currentUser?.uid.toUpperCase() || 'UNSYNCED'}
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
    <div className="min-h-screen animate-in fade-in duration-1000 max-w-[2560px] mx-auto px-4 sm:px-8 xl:px-12 flex flex-col gap-10">
      
      {/* 1. CITADEL COMMAND HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 pt-8">
        <div>
           <div className="flex items-center gap-6 mb-6">
             <div className="w-16 h-16 bg-slate-950 text-white rounded-[1.75rem] flex items-center justify-center font-black italic text-3xl shadow-2xl">C</div>
             <div>
               <h1 className="text-6xl md:text-8xl font-black text-slate-950 tracking-tighter uppercase italic leading-none">{activeTab}_OPS</h1>
               <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.6em] font-mono mt-3">Citadel Command • Global_Root_Control • v2.6.GB</p>
             </div>
           </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="px-10 py-6 bg-white border-precision rounded-[2.5rem] shadow-sm text-center min-w-[200px] group hover:shadow-xl transition-all">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono mb-2">Neural_Temporal_Sync</p>
              <p className="text-2xl font-black text-slate-950 font-mono tracking-tighter tabular-nums">
                {new Date().toLocaleTimeString(locale, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
           </div>
        </div>
      </div>

      {/* 2. TOP HORIZONTAL NAVIGATION (REPLACING SIDEBAR) */}
      <nav className="w-full bg-slate-950 p-3 rounded-[3rem] shadow-2xl flex flex-wrap lg:flex-nowrap items-center gap-2 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-5 px-10 py-6 rounded-[2.2rem] transition-all duration-500 group active:scale-95 text-left min-w-fit flex-1 lg:flex-none ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-[0_30px_80px_-20px_rgba(79,70,229,0.5)]' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
          >
            <div className={`shrink-0 transition-transform duration-700 ${activeTab === tab.id ? 'scale-125 rotate-6' : 'group-hover:scale-110'}`}>
              <tab.icon />
            </div>
            <span className="text-[14px] font-black uppercase tracking-[0.4em] font-mono leading-none">{tab.label}</span>
            {activeTab === tab.id && <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse shadow-[0_0_15px_white]" />}
          </button>
        ))}
      </nav>

      {/* 3. PRIMARY VIEWPORT */}
      <div className="flex-1 pb-32">
        {renderContent()}
      </div>

    </div>
  );
};