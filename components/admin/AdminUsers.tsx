
import React from 'react';
import { User, UserRole } from '../../types';

interface AdminUsersProps {
  nodes: User[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onManage: (userId: string, updates: Partial<User>) => void;
}

export const AdminUsers: React.FC<AdminUsersProps> = ({ nodes, searchQuery, setSearchQuery, onManage }) => {
  const roles: UserRole[] = ['member', 'verified', 'creator', 'admin'];

  return (
    <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden animate-in fade-in duration-500">
      <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/20">
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Node_Registry</h3>
          <p className="text-[10px] font-black text-slate-400 font-mono uppercase tracking-widest mt-2">Active Inhabitant Database • Global Sync</p>
        </div>
        <div className="relative w-full md:w-[320px]">
          <input 
            type="text" placeholder="Search Node Identifier..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl pl-6 pr-6 py-3.5 text-sm font-bold outline-none h-12 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all"
          />
        </div>
      </div>
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Identity_Link</th>
              <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Authority_Protocol</th>
              <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Current_State</th>
              <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono text-right">System_Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {nodes.filter(n => n.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || n.username.toLowerCase().includes(searchQuery.toLowerCase())).map(user => (
              <tr key={user.id} className="hover:bg-slate-50/30 transition-all group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <img src={user.avatarUrl} className="w-12 h-12 rounded-2xl object-cover border border-slate-100 shadow-sm" alt="" />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-950 text-sm tracking-tight truncate leading-none mb-1.5">{user.displayName}</p>
                      <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest truncate">@{user.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <select 
                    value={user.role} 
                    onChange={(e) => onManage(user.id, { role: e.target.value as UserRole })}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                  >
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${user.isSuspended ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                    <span className={`text-[10px] font-black font-mono tracking-widest uppercase ${user.isSuspended ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {user.isSuspended ? 'ISOLATED' : 'SYNCED'}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                   <div className="flex justify-end gap-2">
                     <button 
                       onClick={() => onManage(user.id, { isSuspended: !user.isSuspended })}
                       className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${user.isSuspended ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-rose-50 text-rose-500 hover:bg-rose-100'}`}
                     >
                       {user.isSuspended ? 'UNSUSPEND' : 'SUSPEND'}
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
};
