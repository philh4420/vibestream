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

const StatMini = ({ label, value, trend, icon: Icon, color = "indigo" }: any) => {
  const colorMap: Record<string, string> = {
    indigo: "text-indigo-500",
    emerald: "text-emerald-500",
    rose: "text-rose-500",
    amber: "text-amber-500",
  };

  return (
    <div className="bg-white border-precision rounded-[2rem] p-6 flex items-center justify-between hover:border-indigo-500/30 transition-all duration-500 group shadow-sm">
      <div className="flex items-center gap-5">
        <div className="w-12 h-12 bg-slate-950 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-xl group-hover:rotate-6 transition-transform">
          <Icon />
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono leading-none mb-2">{label}</p>
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter font-mono leading-none italic">{value}</h3>
            <span className={`text-[9px] font-black font-mono px-2 py-1 rounded-lg ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProtocolCard = ({ label, route, isActive, onToggle }: { 
  label: string; 
  route: AppRoute; 
  isActive: boolean; 
  onToggle: (route: AppRoute, val: boolean) => void 
}) => {
  const latency = isActive ? Math.floor(Math.random() * 10 + 4) : 0;
  const load = isActive ? Math.floor(Math.random() * 20 + 5) : 0;

  return (
    <div className={`group relative p-8 rounded-[4rem] border transition-all duration-700 flex flex-col justify-between min-h-[320px] overflow-hidden ${isActive ? 'bg-white border-slate-200 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.06)]' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
      
      {/* 1. LAYER IDENTITY (TOP) */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-5">
           <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center shrink-0 transition-all duration-500 shadow-2xl border-2 ${isActive ? 'bg-slate-950 text-white border-slate-800' : 'bg-white text-slate-200 border-slate-100'}`}>
             <ICONS.Settings />
           </div>
           <div>
             <div className="flex items-center gap-2 mb-1">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">PROTOCOL</span>
               <span className="text-[9px] font-mono text-indigo-400 font-bold tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md">#{route.toUpperCase()}</span>
             </div>
             <h4 className="text-[28px] font-black text-slate-950 uppercase tracking-tighter leading-none italic whitespace-nowrap">
               {label.replace('_', ' ')}
             </h4>
           </div>
        </div>
        
        {/* Connection LED */}
        <div className={`w-3 h-3 rounded-full transition-all duration-1000 ${isActive ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.9)] animate-pulse' : 'bg-slate-300'}`} />
      </div>

      {/* 2. TELEMETRY LCDs (CENTER) */}
      <div className="grid grid-cols-2 gap-6 mt-10 mb-8 relative z-10">
         <div className="p-6 bg-slate-950 rounded-[2.5rem] border border-white/5 shadow-inner transition-all group-hover:bg-slate-900">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono">LATENCY</p>
              <div className="w-1 h-3 bg-indigo-500 rounded-full opacity-40" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className={`text-2xl font-black font-mono tracking-tighter ${isActive ? 'text-white' : 'text-slate-700'}`}>{latency}</p>
              <span className="text-[10px] font-black text-slate-500 font-mono uppercase tracking-widest">ms</span>
            </div>
         </div>
         <div className="p-6 bg-slate-950 rounded-[2.5rem] border border-white/5 shadow-inner transition-all group-hover:bg-slate-900">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono">LOAD</p>
              <div className="w-1 h-3 bg-emerald-500 rounded-full opacity-40" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className={`text-2xl font-black font-mono tracking-tighter ${isActive ? 'text-white' : 'text-slate-700'}`}>{load}</p>
              <span className="text-[10px] font-black text-slate-500 font-mono uppercase tracking-widest">%</span>
            </div>
         </div>
      </div>
      
      {/* 3. FOOTER: STATUS & TACTICAL SWITCH (BOTTOM) */}
      <div className="flex justify-between items-center pt-8 border-t border-slate-50 relative z-10">
        <div className="space-y-1">
          <p className={`text-[12px] font-black uppercase tracking-[0.5em] font-mono transition-colors ${isActive ? 'text-emerald-500' : 'text-slate-400'}`}>
            {isActive ? 'NOMINAL' : 'OFFLINE'}
          </p>
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] font-mono">NODE_GB_CENTRAL</p>
        </div>

        {/* RE-ENGINEERED MECHANICAL SWITCH */}
        <div className="relative group/toggle">
          <button 
            onClick={() => onToggle(route, !isActive)}
            className={`relative inline-flex h-14 w-[90px] items-center rounded-[1.8rem] p-1.5 transition-all duration-500 shadow-inner ${isActive ? 'bg-slate-950' : 'bg-slate-200'}`}
          >
            {/* The Internal Rail */}
            <div className="absolute inset-x-5 h-1 bg-white/10 rounded-full pointer-events-none" />
            
            {/* The Physical Knob */}
            <div className={`flex h-11 w-11 transform items-center justify-center rounded-[1.4rem] bg-white shadow-[0_10px_25px_rgba(0,0,0,0.2)] transition-all duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] ${isActive ? 'translate-x-[34px]' : 'translate-x-0'}`}>
              <div className={`h-2.5 w-2.5 rounded-full transition-all duration-500 ${isActive ? 'bg-indigo-600 shadow-[0_0_12px_rgba(79,70,229,1)] scale-125' : 'bg-slate-100'}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Background Decorative Mesh */}
      <div className={`absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  );
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ addToast, locale, systemSettings }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'content' | 'features' | 'system'>('overview');
  const [nodes, setNodes] = useState<User[]>([]);
  const [signals, setSignals] = useState<Post[]>([]);
  const [metrics, setMetrics] = useState({ users: 0, posts: 0, uptime: '99.99%' });
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
    { id: 'overview', label: 'DASHBOARD', icon: ICONS.Home },
    { id: 'users', label: 'IDENTITY', icon: ICONS.Profile },
    { id: 'content', label: 'SIGNALS', icon: ICONS.Explore },
    { id: 'features', label: 'PROTOCOLS', icon: ICONS.Settings },
    { id: 'system', label: 'KERNEL', icon: ICONS.Admin },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatMini label="ACTIVE_NODES" value={metrics.users} trend={12} icon={ICONS.Profile} color="indigo" />
              <StatMini label="SIGNAL_PULSES" value={metrics.posts} trend={18} icon={ICONS.Explore} color="emerald" />
              <StatMini label="STABILITY_LOCK" value={metrics.uptime} trend={0.1} icon={ICONS.Admin} color="amber" />
              <StatMini label="GRID_STATUS" value="OPTIMAL" trend={100} icon={ICONS.Verified} color="indigo" />
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="bg-slate-950 border border-white/5 rounded-[3rem] p-10 shadow-2xl relative group overflow-hidden h-[400px] flex flex-col">
                <div className="flex justify-between items-center mb-10 relative z-10">
                   <h3 className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.6em] font-mono italic">Neural_Resonance_Flow_V4.2</h3>
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-black text-slate-500 font-mono tracking-widest uppercase">Syncing_Real_Time</span>
                   </div>
                </div>
                <div className="flex-1 flex items-end justify-between gap-1 px-1">
                  {Array.from({ length: 120 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-full rounded-t-lg bg-indigo-500 group-hover:bg-emerald-400 transition-all duration-700`} 
                      style={{ height: `${Math.random() * 70 + 30}%`, opacity: (i / 120) + 0.1 }} 
                    />
                  ))}
                </div>
                <div className="mt-10 pt-8 border-t border-white/5 flex justify-between text-[10px] font-black font-mono text-slate-500 uppercase tracking-[0.3em]">
                   <span>Node_ID: GB_LON_026</span>
                   <span className="text-white">Full_Kernel_Authorisation_Confirmed</span>
                   <span>Temporal: {new Date().getFullYear()}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="bg-white border-precision rounded-[3.5rem] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.05)] overflow-hidden animate-in fade-in duration-300">
            <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-8 bg-slate-50/20">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Node_Manifest_Archive</h3>
                <p className="text-[10px] font-black text-slate-400 font-mono uppercase tracking-widest mt-1">Identity Authorization Logs</p>
              </div>
              <div className="relative w-full md:w-96">
                <input 
                  type="text" placeholder="Scan Identifiers..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl pl-6 pr-6 py-4 text-sm font-bold outline-none h-14 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 shadow-inner"
                />
              </div>
            </div>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="w-1/3 px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Identity_Link</th>
                    <th className="w-1/4 px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Protocol_Tier</th>
                    <th className="w-1/4 px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Status</th>
                    <th className="w-1/6 px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono text-right">Ops</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {nodes.filter(n => n.username.toLowerCase().includes(searchQuery.toLowerCase())).map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-5">
                          <img src={user.avatarUrl} className="w-14 h-14 rounded-[1.5rem] object-cover border-2 border-white shadow-xl" alt="" />
                          <div className="min-w-0">
                            <p className="font-black text-slate-950 text-base tracking-tight truncate leading-none mb-2">{user.displayName}</p>
                            <p className="text-[10px] font-mono text-slate-400 truncate tracking-widest uppercase">NODE_ID_{user.id.toUpperCase().slice(0, 15)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${user.role === 'admin' ? 'bg-slate-950 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-100'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full ${user.isSuspended ? 'bg-rose-500' : 'bg-emerald-500'} animate-pulse`} />
                          <span className={`text-[11px] font-black font-mono tracking-tight uppercase ${user.isSuspended ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {user.isSuspended ? 'ISOLATED' : 'SYNCHRONISED'}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-right">
                         <button className="text-[11px] font-black text-indigo-500 hover:text-indigo-800 tracking-[0.2em] uppercase font-mono italic">Manage_Access</button>
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
          <div className="space-y-12 animate-in fade-in duration-700">
            <div className="bg-slate-950 rounded-[4.5rem] p-16 text-white shadow-2xl flex items-center justify-between overflow-hidden relative border border-white/5">
               <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[200px] rounded-full translate-x-1/3 -translate-y-1/3" />
               <div className="relative z-10">
                 <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none mb-4">Master_Protocol_Matrix</h2>
                 <p className="text-[14px] font-black font-mono uppercase tracking-[0.8em] text-indigo-400/80">Infrastructure_Grid_Authorisation_Suite</p>
               </div>
               <div className="hidden md:flex flex-col items-end relative z-10">
                  <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest font-mono mb-2">Total_Active_Layers</span>
                  <span className="text-7xl font-black text-indigo-400 font-mono leading-none tracking-tighter">{Object.values(AppRoute).length}</span>
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-10">
              {Object.values(AppRoute).map(route => (
                <ProtocolCard 
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
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex justify-between items-center px-4">
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Signal_Interceptor</h3>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1 font-mono">Network Buffer Inspection Protocols</p>
              </div>
              <button className="px-8 py-4 bg-slate-950 text-white rounded-[1.5rem] text-[10px] font-black font-mono uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all">FLUSH_GLOBAL_CACHE</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
              {signals.map(post => (
                <div key={post.id} className="bg-white border-precision rounded-[3rem] p-5 group hover:border-indigo-400 hover:shadow-2xl transition-all flex flex-col h-full">
                  <div className="relative aspect-square rounded-[2.5rem] overflow-hidden mb-5 bg-slate-50 border border-slate-100 shrink-0 shadow-inner">
                    {post.media?.[0]?.url ? (
                      <img src={post.media[0].url} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-200 font-black uppercase text-center p-10 italic">Buffer_Empty_Visual</div>
                    )}
                    <button 
                      onClick={() => deleteDoc(doc(db, 'posts', post.id))}
                      className="absolute top-3 right-3 p-3 bg-rose-600 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity shadow-2xl"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-4">
                      <img src={post.authorAvatar} className="w-8 h-8 rounded-xl object-cover border border-slate-100" alt="" />
                      <p className="text-[11px] font-black text-slate-900 truncate tracking-tight">{post.authorName}</p>
                    </div>
                    <p className="text-[14px] text-slate-600 line-clamp-3 leading-relaxed italic px-2 font-medium">"{post.content}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'system':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in zoom-in-95 duration-300">
            <div className="bg-white border-precision rounded-[4rem] p-12 space-y-12 shadow-sm">
               <h3 className="text-3xl font-black text-slate-950 tracking-tighter uppercase italic border-b border-slate-50 pb-8">Kernel_Access_Overrides</h3>
               <div className="space-y-6">
                  <div className="flex items-center justify-between p-8 bg-slate-950 text-white rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-rose-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="min-w-0 pr-8 relative z-10">
                      <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.5em] mb-2 font-mono italic">EMERGENCY_LOCKDOWN_PROTOCOL</p>
                      <p className="text-base text-slate-400 font-bold truncate">System-wide Maintenance Mode.</p>
                    </div>
                    <button onClick={() => updateDoc(doc(db, 'settings', 'global'), { maintenanceMode: !systemSettings.maintenanceMode })} className={`w-14 h-8 rounded-full border-2 transition-all shrink-0 relative z-10 ${systemSettings.maintenanceMode ? 'bg-rose-600 border-rose-500' : 'bg-slate-800 border-slate-700'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${systemSettings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-8 bg-slate-50 border border-slate-100 rounded-[3rem] group">
                    <div className="min-w-0 pr-8">
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.5em] mb-2 font-mono italic">REGISTRATION_SYNCHRONISATION</p>
                      <p className="text-base text-slate-500 font-bold italic truncate">Node Ingress Access Gate.</p>
                    </div>
                    <button onClick={() => updateDoc(doc(db, 'settings', 'global'), { registrationDisabled: !systemSettings.registrationDisabled })} className={`w-14 h-8 rounded-full border-2 transition-all shrink-0 ${systemSettings.registrationDisabled ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-300 border-slate-200'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${systemSettings.registrationDisabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
               </div>
            </div>
            <div className="bg-slate-950 rounded-[4rem] p-12 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden border border-white/5">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full" />
               <div className="relative z-10">
                  <h3 className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.6em] font-mono mb-10 italic">Security_Access_Architecture</h3>
                  <div className="space-y-4">
                    {['Alpha', 'Beta', 'Gamma'].map(tier => (
                      <button 
                        key={tier}
                        onClick={() => updateDoc(doc(db, 'settings', 'global'), { minTrustTier: tier })}
                        className={`w-full flex items-center justify-between p-6 rounded-[2rem] border transition-all duration-500 ${systemSettings.minTrustTier === tier ? 'bg-white text-slate-950 border-white shadow-[0_20px_50px_rgba(255,255,255,0.1)]' : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10'}`}
                      >
                        <span className="text-[12px] font-black uppercase tracking-[0.4em] font-mono">{tier}_AUTHORITY_UPLINK</span>
                        {systemSettings.minTrustTier === tier && <div className="w-3 h-3 bg-indigo-600 rounded-full animate-ping" />}
                      </button>
                    ))}
                  </div>
               </div>
               <div className="pt-12 border-t border-white/5 mt-12 relative z-10">
                 <p className="text-[10px] font-mono text-slate-600 uppercase tracking-[0.6em] text-center italic">ROOT_NODE_HASH_LOCK: {auth.currentUser?.uid.toUpperCase()}</p>
               </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] animate-in fade-in duration-700 max-w-[2560px] mx-auto flex flex-col gap-10 py-10">
      
      {/* 1. MASTER OPERATIONAL BAR */}
      <div className="px-10 flex items-center justify-between h-20 shrink-0">
        <div className="flex items-center gap-10">
          <div className="w-16 h-16 bg-slate-950 text-white rounded-[2rem] flex items-center justify-center font-black italic text-3xl shadow-2xl border border-white/10 group cursor-pointer hover:rotate-12 transition-all">V</div>
          <div className="hidden sm:block">
            <h1 className="text-4xl font-black text-slate-950 tracking-tighter uppercase italic leading-none">{activeTab}</h1>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.6em] font-mono mt-3 leading-none">VibeStream_Citadel_OS_v5.0_LTS</p>
          </div>
        </div>

        <nav className="bg-white border border-slate-200 p-2 rounded-[2.5rem] shadow-sm flex items-center gap-2">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-4 px-8 py-3.5 rounded-[1.8rem] transition-all active:scale-95 group ${activeTab === tab.id ? 'bg-slate-950 text-white shadow-2xl shadow-slate-300' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <div className="shrink-0 scale-100"><tab.icon /></div>
              <span className="text-[12px] font-black uppercase tracking-[0.2em] font-mono hidden lg:block">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="px-8 py-3 bg-slate-50 border border-slate-200 rounded-[2rem] text-center hidden md:block shadow-inner">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.5em] font-mono mb-2">Network_Clock_Sync</p>
          <p className="text-[18px] font-black text-slate-950 font-mono tracking-tighter leading-none italic">
            {new Date().toLocaleTimeString(locale, { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
      </div>

      {/* 2. OPERATIONAL DATA VIEWPORT */}
      <div className="flex-1 px-10 pb-20 overflow-y-auto no-scrollbar">
        {renderContent()}
      </div>

    </div>
  );
};