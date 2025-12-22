
import React from 'react';
import { User, UserRole } from '../../types';
import { ICONS } from '../../constants';

interface AdminUsersProps {
  nodes: User[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onManage: (userId: string, updates: Partial<User>) => void;
}

export const AdminUsers: React.FC<AdminUsersProps> = ({ nodes, searchQuery, setSearchQuery, onManage }) => {
  const roles: UserRole[] = ['member', 'verified', 'creator', 'admin'];

  return (
    <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden animate-in fade-in duration-500">
      <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/20">
        <div>
          <h3 className="text-lg font-black text-slate-950 tracking-tighter uppercase italic leading-none">Node_Registry</h3>
          <p className="text-[9px] font-black text-slate-400 font-mono uppercase tracking-widest mt-1.5">Active Inhabitant Database • Global Sync</p>
        </div>
        <div className="relative w-full md:w-[280px]">
          <input 
            type="text" placeholder="Search Node Identifier..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-4 py-2.5 text-xs font-bold outline-none h-10 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all"
          />
        </div>
      </div>
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono">Identity_Link</th>
              <th className="px-6 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono">Authority_Protocol</th>
              <th className="px-6 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono">Current_State</th>
              <th className="px-6 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono text-right">System_Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {nodes.filter(n => n.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || n.username.toLowerCase().includes(searchQuery.toLowerCase())).map(user => (
              <tr key={user.id} className="hover:bg-slate-50/30 transition-all group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={user.avatarUrl} className="w-10 h-10 rounded-xl object-cover border border-slate-100 shadow-sm" alt="" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-slate-950 text-[13px] tracking-tight truncate leading-none mb-1">{user.displayName}</p>
                        {user.verifiedHuman && <div className="text-indigo-500 scale-75"><ICONS.Verified /></div>}
                      </div>
                      <p className="text-[8px] font-mono text-slate-400 uppercase tracking-widest truncate">@{user.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <select 
                    value={user.role} 
                    onChange={(e) => onManage(user.id, { role: e.target.value as UserRole })}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
                  >
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${user.isSuspended ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                    <span className={`text-[9px] font-black font-mono tracking-widest uppercase ${user.isSuspended ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {user.isSuspended ? 'ISOLATED' : 'SYNCED'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                   <div className="flex justify-end gap-2">
                     <button 
                       onClick={() => onManage(user.id, { verifiedHuman: !user.verifiedHuman })}
                       className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all active:scale-95 ${user.verifiedHuman ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                     >
                       {user.verifiedHuman ? 'REVOKE_VERIFY' : 'VERIFY_NODE'}
                     </button>
                     <button 
                       onClick={() => onManage(user.id, { isSuspended: !user.isSuspended })}
                       className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all active:scale-95 ${user.isSuspended ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-rose-50 text-rose-500 hover:bg-rose-100'}`}
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
