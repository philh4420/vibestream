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
    <div className={`relative overflow-hidden bg-white border-precision rounded-[3rem] p-10 transition-all duration-500 hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] group`}>
      <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-br ${colorMap[color]} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-10">
          <div className="p-5 bg-slate-900 text-white rounded-[1.5rem] shadow-2xl shadow-slate-200 group-hover:scale-110 transition-transform duration-500">
            <Icon />
          </div>
          <div className="text-right">
            <span className={`text-[10px] font-black font-mono px-4 py-1.5 rounded-full ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          </div>
        </div>
        <div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] font-mono mb-3">{label}</p>
          <div className="flex items-baseline gap-3">
            <h3 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter italic leading-none">{value}</h3>
            <span className="text-[12px] font-black text-slate-300 font-mono uppercase tracking-widest">Active_Packets</span>
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
  <div className={`group relative p-8 rounded-[3rem] border transition-all duration-700 flex flex-col justify-between h-56 ${isActive ? 'bg-white border-slate-100 shadow-sm hover:shadow-2xl hover:border-indigo-200' : 'bg-slate-50 border-slate-200 grayscale opacity-60'}`}>
    <div className="flex justify-between items-start">
      <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-700 ${isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
        <ICONS.Settings />
      </div>
      <button 
        onClick={() => onToggle(route, !isActive)}
        className={`relative inline-flex h-10 w-16 shrink-0 cursor-pointer rounded-full border-[5px] border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${isActive ? 'bg-indigo-600' : 'bg-slate-300'}`}
      >
        <span className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-2xl ring-0 transition duration-300 ease-in-out ${isActive ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
    </div>
    <div className="space-y-2">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">SYS_PROTO_{route.toUpperCase()}</p>
      <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">{label.replace('_', ' ')}</h4>
    </div>
    <div className={`absolute top-6 right-6 w-2.5 h-2.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
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
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <TacticalCard label="Identity_Nodes" value={metrics.users} trend={12.4} icon={ICONS.Profile} color="indigo" />
              <TacticalCard label="Signal_Flow_24H" value={metrics.posts} trend={18.2} icon={ICONS.Explore} color="emerald" />
              <TacticalCard label="Kernel_Stability" value={metrics.uptime} trend={0.02} icon={ICONS.Admin} color="amber" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              <div className="xl:col-span-8 bg-white border-precision rounded-[4rem] p-12 md:p-16 shadow-sm relative overflow-hidden group">
                <div className="flex justify-between items-center mb-12">
                  <div>
                    <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] font-mono">Realtime_Network_Resonance</h3>
                    <p className="text-sm text-slate-500 font-bold mt-2 italic">Active Load: 2.4 TB/s</p>
                  </div>
                  <div className="flex gap-2">
                    {[1,2,3,4].map(i => <div key={i} className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(79,70,229,0.5)]" style={{ animationDelay: `${i*0.2}s` }} />)}
                  </div>
                </div>
                <div className="h-80 flex items-end justify-between gap-1.5 px-6">
                  {Array.from({ length: 64 }).map((_, i) => {
                    const h = Math.random() * 85 + 15;
                    return (
                      <div 
                        key={i} 
                        className={`w-full rounded-t-full transition-all duration-[1.5s] group-hover:bg-indigo-500 bg-slate-100 group-hover:scale-y-110`} 
                        style={{ height: `${h}%`, opacity: (i / 64) + 0.3 }} 
                      />
                    );
                  })}
                </div>
                <div className="mt-10 pt-10 border-t border-slate-50 flex justify-between text-[10px] font-black font-mono text-slate-300 uppercase tracking-[0.3em]">
                   <span>X_COORD_NODE_001</span>
                   <span className="animate-pulse text-emerald-400">LATENCY_SYNC_OK</span>
                   <span>TIMESTAMP_04:00_Z</span>
                </div>
              </div>

              <div className="xl:col-span-4 bg-slate-900 rounded-[4rem] p-12 md:p-14 text-white shadow-2xl relative overflow-hidden flex flex-col">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
                
                <h3 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em] font-mono mb-10 relative z-10">Neural_Grid_Alerts</h3>
                <div className="space-y-8 relative z-10 flex-1 overflow-y-auto no-scrollbar">
                  {[
                    { type: 'SUCCESS', msg: 'Node handshake verified: clstr_09x', time: '1m' },
                    { type: 'WARNING', msg: 'High packet loss in cluster GB-MAN-02', time: '12m' },
                    { type: 'MODERATION', msg: 'Neural anomaly expunged by auto-kernel', time: '45m' },
                    { type: 'SYSTEM', msg: 'Protocol v2.6 synchronization complete', time: '2h' },
                    { type: 'AUTH', msg: 'Root access established via Citadel', time: '5h' },
                  ].map((alert, i) => (
                    <div key={i} className="flex gap-6 items-start border-l-4 border-indigo-500/40 pl-6 py-2 transition-all hover:bg-white/5 rounded-r-2xl">
                      <div className="flex-1">
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest font-mono mb-1.5">{alert.type}</p>
                        <p className="text-[13px] font-bold text-slate-300 leading-tight tracking-tight italic">"{alert.msg}"</p>
                      </div>
                      <span className="text-[9px] font-black text-slate-600 font-mono mt-1">{alert.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="bg-white border-precision rounded-[4rem] shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-12 duration-700">
            <div className="p-12 md:p-16 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
              <div>
                <h3 className="text-3xl font-black text-slate-950 tracking-tighter uppercase italic mb-2">Node_Registry</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Scanning Total Synchronized Assets: {metrics.users}</p>
              </div>
              <div className="relative w-full md:w-96 group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors">
                  <ICONS.Search />
                </div>
                <input 
                  type="text" 
                  placeholder="Intercept Node ID or Alias..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] pl-16 pr-8 py-6 text-sm font-bold focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-300 h-16 shadow-inner"
                />
              </div>
            </div>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/40">
                    <th className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono">Neural_Profile</th>
                    <th className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono">Access_Tier</th>
                    <th className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono">Grid_Resonance</th>
                    <th className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono text-right">Intervention</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {nodes.filter(n => n.username.toLowerCase().includes(searchQuery.toLowerCase()) || n.displayName.toLowerCase().includes(searchQuery.toLowerCase())).map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-all duration-300 group">
                      <td className="px-12 py-10">
                        <div className="flex items-center gap-6">
                          <div className="relative">
                            <img src={user.avatarUrl} className="w-16 h-16 rounded-[1.5rem] object-cover border-2 border-white shadow-xl group-hover:scale-105 transition-transform" alt="" />
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white shadow-sm ${user.isSuspended ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                          </div>
                          <div>
                            <p className="font-black text-slate-950 text-xl tracking-tighter leading-none mb-1.5">{user.displayName}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">NODE_{user.id.slice(0, 12).toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-12 py-10">
                        <span className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] font-mono border ${user.role === 'admin' ? 'bg-slate-950 text-white border-slate-900 shadow-xl' : 'bg-white text-slate-600 border-slate-200'}`}>
                          {user.role === 'admin' ? 'CITADEL_ROOT' : 'GRID_MEMBER'}
                        </span>
                      </td>
                      <td className="px-12 py-10">
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${user.isSuspended ? 'bg-rose-500' : 'bg-emerald-500'} animate-pulse`} />
                          <span className={`text-[11px] font-black uppercase tracking-[0.2em] font-mono ${user.isSuspended ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {user.isSuspended ? 'ISOLATED_NODE' : 'CONNECTED_SYNC'}
                          </span>
                        </div>
                      </td>
                      <td className="px-12 py-10 text-right">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500">
                          <button 
                            onClick={() => handleSuspendNode(user.id, !!user.isSuspended)}
                            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-90 shadow-sm ${user.isSuspended ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100'}`}
                          >
                            {user.isSuspended ? 'Restore_Signal' : 'Isolate_Node'}
                          </button>
                          <button className="p-3 bg-slate-100 text-slate-400 hover:text-slate-950 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl transition-all shadow-inner">
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
          <div className="space-y-12 animate-in fade-in duration-1000">
            <div className="bg-indigo-600 rounded-[4rem] p-16 text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] rounded-full" />
               <div className="relative z-10 max-w-2xl">
                 <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none mb-4">Protocol_Matrix</h2>
                 <p className="text-[12px] font-black text-indigo-100 uppercase tracking-[0.5em] font-mono leading-relaxed">Centralised Feature Engagement & Neural Interface Toggle Matrix for Global Layer GB-01.</p>
               </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8">
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
          <div className="space-y-12 animate-in fade-in duration-1000">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 px-6 gap-10">
               <div>
                 <h3 className="text-5xl md:text-6xl font-black text-slate-950 tracking-tighter uppercase italic leading-none mb-4">Signal_Buffer</h3>
                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] font-mono">Live Transmission Interceptor • Neural Filter Active</p>
               </div>
               <button className="px-10 py-5 bg-slate-950 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.3em] font-mono shadow-2xl hover:bg-black active:scale-95 transition-all">Flush_Buffer_Archive</button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {signals.map(post => (
                <div key={post.id} className="bg-white border-precision rounded-[4rem] p-12 flex flex-col md:flex-row gap-10 items-start group hover:shadow-2xl hover:border-indigo-100 transition-all duration-700">
                  <div className="shrink-0 relative">
                    <img src={post.authorAvatar} className="w-20 h-20 rounded-[1.5rem] object-cover border-4 border-white shadow-xl" alt="" />
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-emerald-500 border-[5px] border-white rounded-full shadow-md" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <p className="text-xl font-black text-slate-950 tracking-tight leading-none mb-1.5">{post.authorName}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono italic">{post.createdAt} • PKT_{post.id.slice(0, 10).toUpperCase()}</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteSignal(post.id)}
                        className="p-4 bg-rose-50 text-rose-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white active:scale-90"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                    <p className="text-base text-slate-600 leading-relaxed font-medium mb-8 italic">"{post.content}"</p>
                    {post.media?.[0] && (
                      <div className="flex items-center gap-5 p-5 bg-slate-50 rounded-[2rem] border border-slate-100 w-fit group/media cursor-pointer hover:bg-indigo-50 transition-colors">
                         <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-600">
                            <ICONS.Create />
                         </div>
                         <div className="pr-6">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono mb-0.5">Packet_Attachment</p>
                            <p className="text-[12px] font-black text-slate-950 uppercase tracking-tight">{post.media[0].type.toUpperCase()}_STREAM</p>
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in zoom-in-95 duration-700">
            <div className="lg:col-span-7 bg-white border-precision rounded-[4rem] p-12 md:p-20 shadow-sm space-y-16">
               <div>
                  <h3 className="text-5xl font-black text-slate-950 tracking-tighter uppercase italic mb-4 leading-none">Kernel_Lockdown</h3>
                  <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em] font-mono">Infrastructure Emergency Override Protocols</p>
               </div>
               
               <div className="space-y-8">
                  <div className="flex items-center justify-between p-10 bg-slate-950 text-white rounded-[3rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    <div className="relative z-10">
                      <p className="text-[11px] font-black text-rose-400 uppercase tracking-[0.4em] font-mono mb-2">GLOBAL_MAINTENANCE_SYNC</p>
                      <p className="text-sm text-slate-400 font-bold max-w-sm leading-relaxed">Emergency network isolation. All identity nodes will be held in encrypted overlay.</p>
                    </div>
                    <button 
                      onClick={() => handleToggleSystemFlag('maintenanceMode', !systemSettings.maintenanceMode)}
                      className={`relative inline-flex h-12 w-24 shrink-0 cursor-pointer rounded-full border-4 border-transparent transition-colors duration-500 ease-in-out focus:outline-none z-10 ${systemSettings.maintenanceMode ? 'bg-rose-600' : 'bg-slate-800'}`}
                    >
                      <span className={`pointer-events-none inline-block h-9 w-9 transform rounded-full bg-white shadow-2xl ring-0 transition duration-500 ease-in-out ${systemSettings.maintenanceMode ? 'translate-x-12' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-10 bg-slate-50 border border-slate-100 rounded-[3rem] hover:bg-white hover:shadow-2xl transition-all duration-700 group">
                    <div>
                      <p className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.4em] font-mono mb-2">REGISTRATION_GATE_OVERRIDE</p>
                      <p className="text-sm text-slate-500 font-bold max-w-sm leading-relaxed italic">Decline all inbound neural handshake requests. Authorised nodes only.</p>
                    </div>
                    <button 
                      onClick={() => handleToggleSystemFlag('registrationDisabled', !systemSettings.registrationDisabled)}
                      className={`relative inline-flex h-12 w-24 shrink-0 cursor-pointer rounded-full border-4 border-transparent transition-colors duration-500 ease-in-out focus:outline-none ${systemSettings.registrationDisabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <span className={`pointer-events-none inline-block h-9 w-9 transform rounded-full bg-white shadow-2xl ring-0 transition duration-500 ease-in-out ${systemSettings.registrationDisabled ? 'translate-x-12' : 'translate-x-0'}`} />
                    </button>
                  </div>
               </div>
            </div>

            <div className="lg:col-span-5 bg-slate-900 rounded-[4rem] p-12 md:p-20 text-white shadow-2xl relative overflow-hidden flex flex-col">
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent" />
               <div className="relative z-10 flex flex-col h-full">
                  <h3 className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.5em] font-mono mb-14">Security_Resonance_Hierarchy</h3>
                  <div className="space-y-6 flex-1">
                    {(['Alpha', 'Beta', 'Gamma'] as const).map(tier => (
                      <button 
                        key={tier}
                        onClick={() => handleToggleSystemFlag('minTrustTier', tier)}
                        className={`w-full flex items-center justify-between p-8 rounded-[2rem] border transition-all duration-700 ${systemSettings.minTrustTier === tier ? 'bg-white text-slate-950 border-white shadow-[0_40px_100px_rgba(255,255,255,0.1)] scale-[1.03]' : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10 hover:text-slate-300'}`}
                      >
                        <div className="text-left">
                           <span className="text-[11px] font-black uppercase tracking-[0.3em] font-mono block mb-2">{tier}_ACCESS_PROTOCOL</span>
                           <span className={`text-[10px] font-black uppercase tracking-widest ${systemSettings.minTrustTier === tier ? 'text-indigo-600' : 'opacity-40'}`}>Auth: Level_{tier === 'Alpha' ? '03' : tier === 'Beta' ? '02' : '01'}</span>
                        </div>
                        {systemSettings.minTrustTier === tier && <div className="w-3.5 h-3.5 bg-indigo-600 rounded-full animate-ping shadow-[0_0_15px_rgba(79,70,229,0.8)]" />}
                      </button>
                    ))}
                  </div>
                  <div className="mt-20 pt-10 border-t border-white/5 text-center">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] font-mono leading-relaxed">
                      All infrastructure modifications logged via Citadel Kernel:<br />
                      {auth.currentUser?.uid.toUpperCase() || 'EXTERNAL_INTERCEPTION'}
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
    <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 min-h-screen animate-in fade-in duration-1000 max-w-[2560px] mx-auto">
      
      {/* CITADEL MASTER NAVIGATION SIDEBAR */}
      <nav className="w-full lg:w-96 shrink-0 space-y-4">
        <div className="px-10 py-12 bg-slate-950 rounded-[4rem] border border-white/10 shadow-2xl relative overflow-hidden group mb-12">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
          <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none mb-2 relative z-10">Citadel</h2>
          <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.6em] font-mono relative z-10">Root_Commander</p>
        </div>

        <div className="flex flex-col gap-3">
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
              className={`flex items-center gap-6 px-10 py-6 rounded-[2rem] transition-all duration-700 group active:scale-95 text-left border ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-[0_40px_100px_-20px_rgba(79,70,229,0.4)] border-indigo-500' : 'text-slate-500 hover:bg-white hover:text-slate-950 border-transparent hover:border-slate-100 hover:shadow-2xl'}`}
            >
              <div className={`shrink-0 transition-all duration-700 ${activeTab === tab.id ? 'scale-125 rotate-6' : 'group-hover:scale-125'}`}>
                <tab.icon />
              </div>
              <span className="text-[13px] font-black uppercase tracking-[0.3em] font-mono flex-1 leading-none">{tab.label}</span>
              {activeTab === tab.id && <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse shadow-lg" />}
            </button>
          ))}
        </div>
      </nav>

      {/* PRIMARY COMMAND VIEWPORT */}
      <div className="flex-1 min-w-0 pb-32">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-16 gap-10 px-4">
          <div>
             <h1 className="text-6xl md:text-8xl font-black text-slate-950 tracking-tighter uppercase italic leading-none">{activeTab}_OPS</h1>
             <div className="flex flex-wrap items-center gap-5 mt-6">
               <div className="px-6 py-3 bg-slate-950 text-white rounded-2xl text-[10px] font-black font-mono tracking-[0.3em] uppercase italic shadow-xl">Protocol: GB_LON_001</div>
               <div className="h-px w-20 bg-slate-200" />
               <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] font-mono">Status: Grid_Operational_Alpha</p>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="px-8 py-6 bg-white border-precision rounded-[2rem] shadow-sm text-center min-w-[160px] group hover:shadow-xl transition-all">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono mb-2">Neural_Sync_Time</p>
                <p className="text-xl font-black text-slate-950 font-mono tracking-tighter">{new Date().toLocaleTimeString(locale, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
             </div>
          </div>
        </div>

        {renderContent()}
      </div>

    </div>
  );
};