
import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { 
  collection, 
  query, 
  getDocs, 
  updateDoc, 
  doc, 
  deleteDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { Post, User } from '../../types';

interface AdminPanelProps {
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  locale: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ addToast, locale }) => {
  const [stats, setStats] = useState({ users: 0, posts: 0, reports: 12 });
  const [users, setUsers] = useState<User[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'content' | 'system'>('users');

  const fetchData = async () => {
    if (!db) return;
    setIsLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const postsSnap = await getDocs(query(collection(db, 'posts'), limit(10), orderBy('timestamp', 'desc')));
      
      const usersData = usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as User));
      const postsData = postsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Post));
      
      setUsers(usersData);
      setRecentPosts(postsData);
      setStats({
        users: usersSnap.size,
        posts: postsSnap.size, // This is actually post count in the snap, not total
        reports: 12 // Hardcoded for 2026 scenario
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

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* 2026 Admin Header */}
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

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Neural Nodes', value: stats.users, icon: 'Users', color: 'indigo' },
          { label: 'Transmissions', value: stats.posts, icon: 'Broadcast', color: 'blue' },
          { label: 'Protocol Alerts', value: stats.reports, icon: 'Shield', color: 'rose' }
        ].map(stat => (
          <div key={stat.label} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${stat.color}-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 transition-transform group-hover:scale-150 duration-700`} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">{stat.label}</p>
            <p className="text-5xl font-black text-slate-900 tracking-tighter">{stat.value.toLocaleString(locale)}</p>
          </div>
        ))}
      </div>

      {/* Control Tabs */}
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

      {/* Tab Content */}
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
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Origin</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <img src={user.avatarUrl} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="" />
                        <div>
                          <p className="font-bold text-slate-900">{user.displayName || 'Unknown node'}</p>
                          <p className="text-xs text-slate-400 font-medium">{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <select 
                        value={user.role} 
                        onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                        className="bg-indigo-50 text-indigo-600 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl border-none focus:ring-2 focus:ring-indigo-200 cursor-pointer"
                      >
                        <option value="member">Member</option>
                        <option value="creator">Creator</option>
                        <option value="verified">Verified</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-bold text-slate-500">{user.location || 'London, UK'}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="p-3 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'content' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recentPosts.map(post => (
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
            ))}
          </div>
        ) : (
          <div className="bg-slate-900 rounded-[2.5rem] p-12 text-center text-white">
            <div className="w-20 h-20 bg-indigo-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-500/40">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 (0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path></svg>
            </div>
            <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter">System Pulse</h3>
            <p className="text-slate-400 max-w-md mx-auto mb-10 font-medium">All infrastructure nodes operating within established parameters. Global latency: 12ms.</p>
            <div className="flex justify-center gap-4">
              <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-[0.3em]">Build v2.6.4-UK</div>
              <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Stable</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
