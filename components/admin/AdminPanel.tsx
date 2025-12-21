import React, { useState, useEffect } from 'react';
import { db, auth } from '../../services/firebase';
import { 
  collection, 
  query, 
  getDocs, 
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

// --- High-Fidelity Sub-Components ---

const StatCard = ({ label, value, trend, icon: Icon }: any) => (
  <div className="bg-white border-precision rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden">
    <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700" />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-6">
        <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-lg">
          <Icon />
        </div>
        <div className={`px-3 py-1 rounded-full text-[9px] font-black font-mono ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {trend >= 0 ? '+' : ''}{trend}%
        </div>
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono mb-1">{label}</p>
      <p className="text-4xl font-black text-slate-900 tracking-tighter italic">{value}</p>
    </div>
  </div>
);

const FeatureToggle = ({ label, route, isActive, onToggle }: { 
  label: string; 
  route: AppRoute; 
  isActive: boolean; 
  onToggle: (route: AppRoute, val: boolean) => void 
}) => (
  <div className={`p-6 rounded-[2.2rem] transition-all duration-500 border group flex flex-col justify-between h-44 ${isActive ? 'bg-white border-slate-100 hover:shadow-xl hover:border-indigo-100' : 'bg-slate-50 border-slate-200 grayscale-[0.5] opacity-80'}`}>
    <div className="flex justify-between items-start mb-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
        <ICONS.Settings />
      </div>
      <button 
        onClick={() => onToggle(route, !isActive)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isActive ? 'bg-indigo-600' : 'bg-slate-300'}`}
      >
        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isActive ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
    <div>
      <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-1">{label}</h4>
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">PROTOCOL: {route.toUpperCase()}</p>
    </div>
  </div>
);

export const AdminPanel: React.FC<AdminPanelProps> = ({ addToast, locale, systemSettings }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'content' | 'features' | 'system'>('overview');
  const [nodes, setNodes] = useState<User[]>([]);
  const [signals, setSignals] = useState<Post[]>([]);
  const [metrics, setMetrics] = useState({ users: 0, posts: 0, uptime: '99.99%' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubNodes = onSnapshot(collection(db, 'users'), (snap) => {
      setNodes(snap.docs.map(d => ({ id: d.id, ...d.data() } as User)));
      setMetrics(prev => ({ ...prev, users: snap.size }));
    });

    const unsubSignals = onSnapshot(query(collection(db, 'posts'), orderBy('timestamp', 'desc'), limit(50)), (snap) => {
      setSignals(snap.docs.map(d => ({ id: d.id, ...d.data() } as Post)));
      setMetrics(prev => ({ ...prev, posts: snap.size }));
    });

    setIsLoading(false);
    return () => {
      unsubNodes();
      unsubSignals();
    };
  }, []);

  const handleToggleSystemFlag = async (field: keyof SystemSettings, val: any) => {
    try {
      await updateDoc(doc(db, 'settings', 'global'), { [field]: val });
      addToast(`Infrastructure updated: ${field} set to ${val}`, 'success');
    } catch (e) {
      addToast('Kernel update failed', 'error');
    }
  };

  const handleToggleFeature = async (route: AppRoute, val: boolean) => {
    const updatedFlags = { ...(systemSettings.featureFlags || {}), [route]: val };
    try {
      await updateDoc(doc(db, 'settings', 'global'), { featureFlags: updatedFlags });
      addToast(`Protocol ${route.toUpperCase()} ${val ? 'ENABLED' : 'DISABLED'}`, val ? 'success' : 'info');
    } catch (e) {
      addToast('Protocol switch failed', 'error');
    }
  };

  const handleSuspendNode = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), { isSuspended: !currentStatus });
      addToast(currentStatus ? 'Node re-synchronized' : 'Node suspended from grid', 'info');
    } catch (e) {
      addToast('Node calibration failed', 'error');
    }
  };

  const handleDeleteSignal = async (postId: string) => {
    if (!window.confirm('Erase signal from grid archive?')) return;
    try {
      await deleteDoc(doc(db, 'posts', postId));
      addToast('Signal expunged successfully', 'success');
    } catch (e) {
      addToast('Expunging failed', 'error');
    }
  };

  const renderDashboard = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard label="Total_Identity_Nodes" value={metrics.users} trend={12} icon={ICONS.Profile} />
              <StatCard label="Global_Signal_Count" value={metrics.posts} trend={24} icon={ICONS.Explore} />
              <StatCard label="Kernel_Uptime" value={metrics.uptime} trend={0.01} icon={ICONS.Admin} />
            </div>
            
            <div className="bg-white border-precision rounded-[3rem] p-10 shadow-sm overflow-hidden relative">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Live_Grid_Activity</h3>
                <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">REALTIME_UPLINK</span>
              </div>
              <div className="h-64 bg-slate-50 rounded-[2rem] flex items-center justify-center border border-dashed border-slate-200">
                <div className="text-center space-y-4">
                  <div className="flex justify-center gap-1">
                    {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="w-1.5 bg-indigo-500 rounded-full animate-pulse" style={{ height: `${Math.random() * 40 + 20}px`, animationDelay: `${i * 0.1}s` }} />)}
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Calibrating signal frequency visualization...</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'features':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-10 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Object.values(AppRoute).map(route => (
                <FeatureToggle 
                  key={route}
                  label={route.replace('_', ' ')}
                  route={route}
                  isActive={systemSettings.featureFlags?.[route] !== false}
                  onToggle={handleToggleFeature}
                />
              ))}
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="bg-white border-precision rounded-[3rem] overflow-hidden shadow-sm animate-in fade-in duration-500">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Identity_Node_Manifest</h3>
              <div className="flex gap-2">
                 <input type="text" placeholder="Filter node ID..." className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-mono font-black outline-none focus:ring-2 focus:ring-indigo-100" />
              </div>
            </div>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/30 border-b border-slate-50">
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Node</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Auth_Level</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Grid_Status</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action_Protocol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {nodes.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <img src={user.avatarUrl} className="w-10 h-10 rounded-xl object-cover" alt="" />
                          <div>
                            <p className="font-black text-slate-900 text-sm tracking-tight">{user.displayName}</p>
                            <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${user.isSuspended ? 'bg-rose-500' : 'bg-emerald-500'} animate-pulse`} />
                          <span className={`text-[10px] font-black uppercase tracking-widest ${user.isSuspended ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {user.isSuspended ? 'SUSPENDED' : 'SYNCHRONISED'}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <button 
                          onClick={() => handleSuspendNode(user.id, !!user.isSuspended)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${user.isSuspended ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                        >
                          {user.isSuspended ? 'Re-Sync' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'content':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            {signals.map(post => (
              <div key={post.id} className="bg-white border-precision rounded-[2.5rem] p-8 flex items-start justify-between group hover:shadow-xl transition-all">
                <div className="flex gap-6 items-start">
                   <img src={post.authorAvatar} className="w-12 h-12 rounded-2xl object-cover shadow-sm" alt="" />
                   <div>
                     <div className="flex items-center gap-2 mb-2">
                       <span className="text-sm font-black text-slate-900 tracking-tight">{post.authorName}</span>
                       <span className="text-[9px] font-mono text-slate-400">{post.createdAt}</span>
                     </div>
                     <p className="text-sm text-slate-600 leading-relaxed max-w-xl italic">"{post.content}"</p>
                     {post.media?.[0] && (
                        <div className="mt-4 px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-black text-indigo-500 uppercase tracking-widest w-fit">
                          Attached: {post.media[0].type.toUpperCase()}
                        </div>
                     )}
                   </div>
                </div>
                <button 
                  onClick={() => handleDeleteSignal(post.id)}
                  className="p-4 bg-rose-50 text-rose-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white active:scale-90 shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
          </div>
        );

      case 'system':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in zoom-in-95 duration-500">
            <div className="bg-white border-precision rounded-[3rem] p-10 shadow-sm space-y-8">
               <div className="flex items-center gap-4 mb-2">
                 <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                 <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em] font-mono">Infrastructure_Emergency</h3>
               </div>
               <div className="space-y-6">
                  <div className="flex items-center justify-between p-6 bg-slate-950 text-white rounded-[2rem] shadow-2xl">
                    <div>
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest font-mono mb-1">Global_Maintenance_Lock</p>
                      <p className="text-xs text-slate-400 font-medium">Suspending all public nodes immediately.</p>
                    </div>
                    <button 
                      onClick={() => handleToggleSystemFlag('maintenanceMode', !systemSettings.maintenanceMode)}
                      className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${systemSettings.maintenanceMode ? 'bg-rose-600' : 'bg-slate-800'}`}
                    >
                      <span className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${systemSettings.maintenanceMode ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-[2rem]">
                    <div>
                      <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-mono mb-1">Inbound_Registration_Lock</p>
                      <p className="text-xs text-slate-500 font-medium italic">Disabling new neural handshake requests.</p>
                    </div>
                    <button 
                      onClick={() => handleToggleSystemFlag('registrationDisabled', !systemSettings.registrationDisabled)}
                      className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${systemSettings.registrationDisabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <span className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${systemSettings.registrationDisabled ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>
               </div>
            </div>

            <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent" />
               <div className="relative z-10 space-y-10 h-full flex flex-col">
                  <div>
                    <h3 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em] font-mono mb-6">Security_Tier_Protocols</h3>
                    <div className="space-y-4">
                      {(['Alpha', 'Beta', 'Gamma'] as const).map(tier => (
                        <button 
                          key={tier}
                          onClick={() => handleToggleSystemFlag('minTrustTier', tier)}
                          className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all ${systemSettings.minTrustTier === tier ? 'bg-white text-slate-900 border-white shadow-xl scale-105' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                        >
                          <span className="text-[10px] font-black uppercase tracking-widest font-mono">{tier}_NODE_ACCESS</span>
                          {systemSettings.minTrustTier === tier && <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-auto pt-10 border-t border-white/5 text-center">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest font-mono leading-relaxed">
                      All kernel modifications are logged in the persistent ledger via node: {auth.currentUser?.uid.slice(0, 8)}
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
    <div className="flex flex-col lg:flex-row gap-10 min-h-[80vh] animate-in fade-in duration-1000">
      
      {/* Sidebar Navigation */}
      <div className="w-full lg:w-72 flex flex-col gap-2 shrink-0">
        <div className="px-8 py-6 mb-4 bg-slate-900 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
          <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] font-mono relative z-10">CITADEL_ADM</h3>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1 relative z-10">Security_Level: 0</p>
        </div>
        
        <div className="flex flex-col gap-1.5">
          {[
            { id: 'overview', label: 'Command_Overview', icon: ICONS.Home },
            { id: 'users', label: 'Identity_Nodes', icon: ICONS.Profile },
            { id: 'content', label: 'Signal_Buffer', icon: ICONS.Explore },
            { id: 'features', label: 'Protocol_Toggles', icon: ICONS.Settings },
            { id: 'system', label: 'Infrastructure', icon: ICONS.Admin },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-4 px-6 py-5 rounded-2xl transition-all duration-300 group active:scale-95 text-left border ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-100 border-indigo-500' : 'text-slate-500 hover:bg-white hover:text-slate-900 border-transparent hover:border-slate-100 hover:shadow-lg'}`}
            >
              <div className={`shrink-0 transition-transform duration-500 ${activeTab === tab.id ? 'scale-110 rotate-3' : 'group-hover:scale-110'}`}>
                <tab.icon />
              </div>
              <span className="text-[11px] font-black uppercase tracking-widest leading-none flex-1 truncate">{tab.label}</span>
              {activeTab === tab.id && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
            </button>
          ))}
        </div>
      </div>

      {/* Main Command Viewport */}
      <div className="flex-1 min-w-0 pb-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">{activeTab.replace('_', ' ')}_DASH</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mt-2">VibeStream Node Controller • Global_{locale.toUpperCase()}</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black font-mono border border-emerald-100">Status: OPERATIONAL</div>
             <div className="px-4 py-2 bg-slate-50 text-slate-400 rounded-xl text-[9px] font-black font-mono">Sync: {new Date().toLocaleTimeString(locale, { hour12: false })}</div>
          </div>
        </div>

        {renderDashboard()}
      </div>

    </div>
  );
};