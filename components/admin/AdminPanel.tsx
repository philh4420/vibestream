
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
  setDoc
} from 'firebase/firestore';
import { Post, User, SystemSettings, AppRoute } from '../../types';
import { ICONS } from '../../constants';

// --- Modular Sub-Components ---

const AdminSidebar: React.FC<{ activeTab: string; onSelect: (t: any) => void }> = ({ activeTab, onSelect }) => (
  <div className="w-full lg:w-72 flex flex-col gap-2 shrink-0">
    <div className="px-4 py-2 mb-2">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Control_Matrix</h3>
    </div>
    {[
      { id: 'overview', label: 'Command Overview', icon: ICONS.Home },
      { id: 'users', label: 'Identity Nodes', icon: ICONS.Profile },
      { id: 'content', label: 'Signal Feed', icon: ICONS.Explore },
      { id: 'features', label: 'Protocol Toggles', icon: ICONS.Settings },
      { id: 'system', label: 'Core Infrastructure', icon: ICONS.Admin },
    ].map(tab => (
      <button 
        key={tab.id}
        onClick={() => onSelect(tab.id)}
        className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all active:scale-95 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-500 hover:bg-white hover:text-slate-900 border border-transparent'}`}
      >
        <div className="scale-75"><tab.icon /></div>
        <span className="text-[11px] font-black uppercase tracking-widest">{tab.label}</span>
      </button>
    ))}
  </div>
);

const FeatureToggle: React.FC<{ 
  label: string; 
  route: AppRoute; 
  isActive: boolean; 
  onToggle: (route: AppRoute, val: boolean) => void 
}> = ({ label, route, isActive, onToggle }) => (
  <div className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-[2rem] hover:shadow-md transition-all group">
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-300'}`}>
        {/* Placeholder icon logic could go here */}
        <div className="w-2 h-2 rounded-full bg-current" />
      </div>
      <div>
        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest font-mono">{label}</h4>
        <p className={`text-[9px] font-bold uppercase tracking-tight ${isActive ? 'text-emerald-500' : 'text-rose-400'}`}>
          {isActive ? 'Protocol Active' : 'Protocol Suspended'}
        </p>
      </div>
    </div>
    <button 
      onClick={() => onToggle(route, !isActive)}
      className={`relative w-14 h-7 rounded-full p-1 transition-all duration-300 ${isActive ? 'bg-indigo-600' : 'bg-slate-200'}`}
    >
      <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${isActive ? 'translate-x-7' : 'translate-x-0'}`} />
    </button>
  </div>
);

interface AdminPanelProps {
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  locale: string;
  systemSettings: SystemSettings;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ addToast, locale, systemSettings }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'content' | 'features' | 'system'>('overview');
  const [stats, setStats] = useState({ users: 0, posts: 0, reports: 0 });
  const [users, setUsers] = useState<User[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    if (!db) return;
    setIsLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const postsSnap = await getDocs(query(collection(db, 'posts'), limit(20), orderBy('timestamp', 'desc')));
      
      setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as User)));
      setRecentPosts(postsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Post)));
      setStats({
        users: usersSnap.size,
        posts: postsSnap.size,
        reports: 0
      });
    } catch (e) {
      addToast('Sync Interrupted: Data Retrieval Failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateSystemSetting = async (key: string, value: any) => {
    if (!db || !auth.currentUser) return;
    try {
      const settingRef = doc(db, 'settings', 'global');
      await updateDoc(settingRef, {
        [key]: value,
        lastUpdatedBy: auth.currentUser.uid,
        updatedAt: new Date().toISOString()
      });
      addToast('Parameters Synchronised Successfully', 'success');
    } catch (e) {
      addToast('Handshake Denied: Update Failed', 'error');
    }
  };

  const handleFeatureToggle = async (route: AppRoute, value: boolean) => {
    const updatedFlags = { ...(systemSettings.featureFlags || {}), [route]: value };
    await updateSystemSetting('featureFlags', updatedFlags);
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      addToast(`Identity Node Reclassified: ${newRole}`, 'success');
      fetchData();
    } catch (e) { addToast('Reclassification Error', 'error'); }
  };

  const toggleSuspension = async (user: User) => {
    if (!db) return;
    const newState = !user.isSuspended;
    try {
      await updateDoc(doc(db, 'users', user.id), { isSuspended: newState });
      addToast(newState ? 'Node Access Terminated' : 'Node Access Restored', newState ? 'error' : 'success');
      fetchData();
    } catch (e) { addToast('Critical Error: Suspension Failed', 'error'); }
  };

  const handleDeletePost = async (postId: string) => {
    if (!db || !confirm('Confirm Signal Termination?')) return;
    try {
      await deleteDoc(doc(db, 'posts', postId));
      addToast('Transmission Terminated', 'success');
      fetchData();
    } catch (e) { addToast('Termination Error', 'error'); }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-10 animate-in fade-in duration-700 max-w-[2560px] mx-auto min-h-[80vh]">
      
      {/* 1. NAVIGATION BAR (FB STYLE) */}
      <AdminSidebar activeTab={activeTab} onSelect={setActiveTab} />

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 space-y-8">
        
        {/* Workspace Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-100">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">{activeTab.replace('_', ' ')}</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mt-2">VibeStream Citadel Control Node • GB-LON-026</p>
          </div>
          <button 
            onClick={fetchData}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-3 shadow-xl shadow-indigo-100"
          >
            <div className={isLoading ? 'animate-spin' : ''}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            </div>
            Resynchronise
          </button>
        </div>

        {/* Dynamic Content Views */}
        <div className="min-h-[500px]">
          {isLoading && !users.length ? (
             <div className="flex items-center justify-center h-64">
               <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
             </div>
          ) : activeTab === 'overview' ? (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Network Entities', value: stats.users, color: 'indigo' },
                  { label: 'Published Signals', value: stats.posts, color: 'emerald' },
                  { label: 'Security Alerts', value: stats.reports, color: 'rose' }
                ].map(s => (
                  <div key={s.label} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                     <div className={`absolute top-0 right-0 w-32 h-32 bg-${s.color}-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2`} />
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono mb-4">{s.label}</p>
                     <p className="text-5xl font-black text-slate-900 tracking-tighter italic">{s.value.toLocaleString(locale)}</p>
                  </div>
                ))}
              </div>
              
              <div className="bg-slate-950 rounded-[3rem] p-12 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
                <h3 className="text-3xl font-black uppercase tracking-tighter italic mb-4">Infrastructure Status</h3>
                <div className="flex flex-wrap gap-4">
                  <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest font-mono">Kernel_v2.6.4_LTS</div>
                  <div className="px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-[9px] font-black uppercase tracking-widest text-emerald-400 font-mono">Nodes_Online: {stats.users}</div>
                  <div className="px-6 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-[9px] font-black uppercase tracking-widest text-indigo-400 font-mono">Region: en-GB</div>
                </div>
              </div>
            </div>
          ) : activeTab === 'features' ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
               <div className="bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100 mb-8">
                  <h4 className="text-[11px] font-black text-indigo-900 uppercase tracking-widest font-mono mb-2 italic">Module Oversight</h4>
                  <p className="text-xs text-indigo-700 font-medium">Toggle individual grid protocols. Suspended protocols will redirect users to the calibration overlay across all devices.</p>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                 {[
                   { label: 'Neural Mesh', route: AppRoute.MESH },
                   { label: 'Identity Clusters', route: AppRoute.CLUSTERS },
                   { label: 'Visual Stream Grid', route: AppRoute.STREAM_GRID },
                   { label: 'Temporal Archive', route: AppRoute.TEMPORAL },
                   { label: 'Saved Fragments', route: AppRoute.SAVED },
                   { label: 'Verified Entity Nodes', route: AppRoute.VERIFIED_NODES },
                   { label: 'Localized Gatherings', route: AppRoute.GATHERINGS },
                   { label: 'Neural Simulations', route: AppRoute.SIMULATIONS },
                   { label: 'Resilience Uplink', route: AppRoute.RESILIENCE }
                 ].map(f => (
                   <FeatureToggle 
                     key={f.route} 
                     label={f.label} 
                     route={f.route} 
                     isActive={systemSettings.featureFlags?.[f.route] !== false} 
                     onToggle={handleFeatureToggle} 
                   />
                 ))}
               </div>
            </div>
          ) : activeTab === 'users' ? (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4">
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Entity_Identity</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Role_Protocol</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono text-center">Status</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {users.map(u => (
                      <tr key={u.id} className={`hover:bg-slate-50/50 transition-all group ${u.isSuspended ? 'opacity-50 grayscale' : ''}`}>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <img src={u.avatarUrl} className="w-10 h-10 rounded-xl border border-slate-100" alt="" />
                            <div>
                              <p className="text-sm font-black text-slate-900 tracking-tight">{u.displayName || 'Unknown'}</p>
                              <p className="text-[10px] text-slate-400 font-bold font-mono">@{u.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           <select 
                            value={u.role} 
                            onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                            className="bg-slate-100 text-slate-900 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border-none outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer"
                          >
                            <option value="member">Member</option>
                            <option value="creator">Creator</option>
                            <option value="verified">Verified</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <button 
                            onClick={() => toggleSuspension(u)}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${u.isSuspended ? 'bg-rose-600 text-white' : 'bg-emerald-50 text-emerald-600'}`}
                          >
                            {u.isSuspended ? 'Suspended' : 'Operational'}
                          </button>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <button className="p-3 text-slate-300 hover:text-indigo-600 transition-colors"><ICONS.Search /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'content' ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4">
               {recentPosts.map(p => (
                 <div key={p.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                         <img src={p.authorAvatar} className="w-10 h-10 rounded-full" alt="" />
                         <div>
                            <p className="text-sm font-black text-slate-900">{p.authorName}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest font-mono">{p.createdAt}</p>
                         </div>
                      </div>
                      <button onClick={() => handleDeletePost(p.id)} className="p-3 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
                    <p className="text-slate-600 text-sm font-medium leading-relaxed mb-6 line-clamp-3 italic">"{p.content}"</p>
                    {p.media?.[0]?.url && <img src={p.media[0].url} className="w-full h-40 object-cover rounded-2xl" alt="" />}
                 </div>
               ))}
             </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-10 bg-white border border-slate-100 rounded-[3rem] shadow-sm">
                   <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest font-mono mb-8 italic">Access Control</h4>
                   <div className="space-y-6">
                      <div className="flex items-center justify-between">
                         <span className="text-xs font-bold text-slate-600">Maintenance_Protocol</span>
                         <button 
                          onClick={() => updateSystemSetting('maintenanceMode', !systemSettings.maintenanceMode)}
                          className={`relative w-14 h-7 rounded-full p-1 transition-all ${systemSettings.maintenanceMode ? 'bg-indigo-600' : 'bg-slate-200'}`}
                         >
                           <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${systemSettings.maintenanceMode ? 'translate-x-7' : 'translate-x-0'}`} />
                         </button>
                      </div>
                      <div className="flex items-center justify-between">
                         <span className="text-xs font-bold text-slate-600">Registration_Lock</span>
                         <button 
                          onClick={() => updateSystemSetting('registrationDisabled', !systemSettings.registrationDisabled)}
                          className={`relative w-14 h-7 rounded-full p-1 transition-all ${systemSettings.registrationDisabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                         >
                           <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${systemSettings.registrationDisabled ? 'translate-x-7' : 'translate-x-0'}`} />
                         </button>
                      </div>
                   </div>
                </div>
                
                <div className="p-10 bg-slate-50 border border-slate-100 rounded-[3rem]">
                   <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest font-mono mb-8">System_Audit</h4>
                   <div className="space-y-4">
                      <div className="flex justify-between text-[9px] font-black font-mono">
                         <span className="text-slate-400 uppercase">Synchronisation_Ref:</span>
                         <span className="text-indigo-600">{systemSettings.updatedAt || 'NEW'}</span>
                      </div>
                      <div className="flex justify-between text-[9px] font-black font-mono">
                         <span className="text-slate-400 uppercase">Modified_By:</span>
                         <span className="text-indigo-600">NODE_{systemSettings.lastUpdatedBy?.slice(0, 8) || 'SYSTEM'}</span>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
