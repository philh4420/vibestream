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
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { Post, User, SystemSettings } from '../../types';

interface AdminPanelProps {
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  locale: string;
  systemSettings: SystemSettings;
}

const SystemToggle = ({ label, description, isActive, onToggle }: { label: string, description: string, isActive: boolean, onToggle: () => void }) => (
  <div className="flex items-center justify-between p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all group">
    <div className="space-y-1">
      <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest font-mono">{label}</h4>
      <p className="text-xs text-slate-400 font-medium max-w-xs leading-relaxed">{description}</p>
    </div>
    <button 
      onClick={onToggle}
      className={`relative w-20 h-10 rounded-full p-1 transition-all duration-500 ease-in-out ${isActive ? 'bg-indigo-600' : 'bg-slate-200'}`}
    >
      <div className={`w-8 h-8 bg-white rounded-full shadow-lg transform transition-transform duration-500 ease-in-out ${isActive ? 'translate-x-10' : 'translate-x-0'}`} />
    </button>
  </div>
);

export const AdminPanel: React.FC<AdminPanelProps> = ({ addToast, locale, systemSettings }) => {
  const [stats, setStats] = useState({ users: 0, posts: 0, reports: 0 });
  const [users, setUsers] = useState<User[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'content' | 'system'>('users');

  const fetchData = async () => {
    if (!db) return;
    setIsLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const postsSnap = await getDocs(query(collection(db, 'posts'), limit(50), orderBy('timestamp', 'desc')));
      const reportsSnap = await getDocs(collection(db, 'reports')).catch(() => ({ size: 0 }));
      
      const usersData = usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as User));
      const postsData = postsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Post));
      
      setUsers(usersData);
      setRecentPosts(postsData);
      setStats({
        users: usersSnap.size,
        posts: postsSnap.size,
        reports: reportsSnap.size
      });
    } catch (e) {
      console.error(e);
      addToast('Data retrieval failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      addToast(`Identity Reclassified: ${newRole}`, 'success');
      fetchData();
    } catch (e) {
      addToast('Reclassification failed', 'error');
    }
  };

  const toggleVerification = async (user: User) => {
    if (!db) return;
    const newState = !user.verifiedHuman;
    try {
      await updateDoc(doc(db, 'users', user.id), { verifiedHuman: newState });
      addToast(newState ? 'Neural Verified' : 'Verification Revoked', 'success');
      fetchData();
    } catch (e) {
      addToast('State sync failed', 'error');
    }
  };

  const toggleSuspension = async (user: User) => {
    if (!db) return;
    const newState = !user.isSuspended;
    try {
      await updateDoc(doc(db, 'users', user.id), { isSuspended: newState });
      addToast(newState ? 'Node Suspended' : 'Node Restored', newState ? 'error' : 'success');
      fetchData();
    } catch (e) {
      addToast('Safety protocol failed', 'error');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!db) return;
    if (!confirm('Are you sure you want to terminate this transmission?')) return;
    try {
      await deleteDoc(doc(db, 'posts', postId));
      addToast('Transmission Terminated', 'success');
      fetchData();
    } catch (e) {
      addToast('Termination failed', 'error');
    }
  };

  const updateSystemSetting = async (key: keyof SystemSettings, value: any) => {
    if (!db || !auth.currentUser) return;
    try {
      const settingRef = doc(db, 'settings', 'global');
      await updateDoc(settingRef, {
        [key]: value,
        lastUpdatedBy: auth.currentUser.uid,
        updatedAt: new Date().toISOString()
      }).catch(async (e) => {
        // Fallback for first-time creation if doc doesn't exist
        if (e.code === 'not-found') {
          await setDoc(settingRef, {
            maintenanceMode: false,
            registrationDisabled: false,
            minTrustTier: 'Gamma',
            [key]: value,
            lastUpdatedBy: auth.currentUser!.uid,
            updatedAt: new Date().toISOString()
          });
        } else {
          throw e;
        }
      });
      addToast('System Parameters Synchronized', 'success');
    } catch (e) {
      console.error(e);
      addToast('Handshake Denied', 'error');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">CITADEL COMMAND</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">UK INFRASTRUCTURE OVERSIGHT • GB-LON</p>
        </div>
        <button 
          onClick={fetchData}
          className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-3 shadow-xl shadow-indigo-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          Resync Node
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Neural Nodes', value: stats.users, color: 'indigo' },
          { label: 'Transmissions', value: stats.posts, color: 'blue' },
          { label: 'Protocol Alerts', value: stats.reports, color: 'rose' }
        ].map(stat => (
          <div key={stat.label} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${stat.color}-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 transition-transform group-hover:scale-150 duration-700`} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">{stat.label}</p>
            <p className="text-5xl font-black text-slate-900 tracking-tighter">{stat.value.toLocaleString(locale)}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-4 border-b border-slate-100 pb-2">
        {(['users', 'content', 'system'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-full" />}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : activeTab === 'users' ? (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identity</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Protocol Status</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(user => (
                  <tr key={user.id} className={`hover:bg-slate-50/50 transition-colors group ${user.isSuspended ? 'opacity-50 grayscale' : ''}`}>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <img src={user.avatarUrl} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="" />
                        <div>
                          <div className="flex items-center gap-1">
                            <p className="font-bold text-slate-900">{user.displayName || 'Unknown node'}</p>
                            {user.verifiedHuman && (
                              <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"></path></svg>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 font-medium">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <select 
                        value={user.role} 
                        onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                        className="bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border-none focus:ring-2 focus:ring-indigo-200 cursor-pointer outline-none"
                      >
                        <option value="member">Member</option>
                        <option value="creator">Creator</option>
                        <option value="verified">Verified</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex justify-center gap-2">
                         <button 
                          onClick={() => toggleVerification(user)}
                          className={`p-2 rounded-lg transition-all ${user.verifiedHuman ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-300'}`}
                          title="Toggle Verification"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                        </button>
                        <button 
                          onClick={() => toggleSuspension(user)}
                          className={`p-2 rounded-lg transition-all ${user.isSuspended ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-300'}`}
                          title="Suspend Node"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-xl font-bold text-xs uppercase tracking-widest transition-all">
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'content' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recentPosts.length > 0 ? recentPosts.map(post => (
              <div key={post.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <img src={post.authorAvatar} className="w-8 h-8 rounded-full" alt="" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">{post.authorName}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{post.createdAt}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeletePost(post.id)}
                    className="p-2 text-rose-500 bg-rose-50 rounded-xl hover:bg-rose-100 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
                <p className="text-slate-600 text-sm line-clamp-3 mb-4">{post.content}</p>
                {post.media?.[0]?.url && (
                  <img src={post.media[0].url} className="w-full h-32 object-cover rounded-xl" alt="" />
                )}
              </div>
            )) : (
              <div className="md:col-span-2 text-center py-20 bg-white rounded-[3rem] border border-slate-100">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No Transmissions Logged</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="bg-slate-950 rounded-[3rem] p-10 md:p-14 text-white relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
               <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
                  <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-500/40 shrink-0">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path></svg>
                  </div>
                  <div className="space-y-4 text-center md:text-left">
                     <h3 className="text-3xl font-black uppercase tracking-tighter italic">Neural Infrastructure Sync</h3>
                     <p className="text-slate-400 max-w-md font-medium">All core parameters under direct Citadel oversight. Adjust global routing protocols below.</p>
                     <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
                        <div className="px-6 py-2 bg-white/5 rounded-xl border border-white/10 text-[9px] font-black uppercase tracking-[0.3em] font-mono">Kernel_v2.6.4</div>
                        <div className="px-6 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400 font-mono">Live_Pulse</div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SystemToggle 
                label="Maintenance_Lock"
                description="Intercepts all non-admin node sessions with the synchronization protocol overlay."
                isActive={systemSettings.maintenanceMode}
                onToggle={() => updateSystemSetting('maintenanceMode', !systemSettings.maintenanceMode)}
              />
              <SystemToggle 
                label="Registration_Halt"
                description="Disables the creation of new neural identities within the VibeStream grid."
                isActive={systemSettings.registrationDisabled}
                onToggle={() => updateSystemSetting('registrationDisabled', !systemSettings.registrationDisabled)}
              />
            </div>
            
            <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem]">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">System_Audit_Log</h4>
              </div>
              <div className="space-y-3">
                 <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-slate-400">Last System Update:</span>
                    <span className="text-slate-900 font-bold">{systemSettings.updatedAt || 'N/A'}</span>
                 </div>
                 <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-slate-400">Modified By:</span>
                    <span className="text-indigo-600 font-bold">NODE_{systemSettings.lastUpdatedBy?.slice(0, 8) || 'SYSTEM'}</span>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};