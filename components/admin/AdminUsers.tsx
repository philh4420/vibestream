
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

  const filteredNodes = nodes.filter(n => 
    n.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-sm">
         <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none">Node_Registry</h3>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] font-mono mt-2">Manage Grid Inhabitants</p>
         </div>
         <div className="w-full md:w-80 relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors">
               <ICONS.Search />
            </div>
            <input 
              type="text" 
              placeholder="Search by ID or Alias..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.8rem] pl-12 pr-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-200 dark:focus:border-indigo-800 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900 dark:text-white"
            />
         </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <th className="px-8 py-5 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] font-mono">Identity_Link</th>
              <th className="px-8 py-5 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] font-mono">Role_Protocol</th>
              <th className="px-8 py-5 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] font-mono">Status_Check</th>
              <th className="px-8 py-5 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] font-mono text-right">Overrides</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {filteredNodes.map(user => (
              <tr key={user.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-all group">
                <td className="px-8 py-4">
                  <div className="flex items-center gap-4">
                    <img src={user.avatarUrl} className="w-10 h-10 rounded-[1rem] object-cover border border-slate-100 dark:border-slate-800 shadow-sm bg-slate-100 dark:bg-slate-800" alt="" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">{user.displayName}</p>
                        {user.verifiedHuman && <div className="text-indigo-500 dark:text-indigo-400 scale-75"><ICONS.Verified /></div>}
                      </div>
                      <p className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest">@{user.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-4">
                  <select 
                    value={user.role} 
                    onChange={(e) => onManage(user.id, { role: e.target.value as UserRole })}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-[9px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 transition-all cursor-pointer text-slate-600 dark:text-slate-300"
                  >
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="px-8 py-4">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${user.isSuspended ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900 text-rose-600 dark:text-rose-400' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${user.isSuspended ? 'bg-rose-500' : 'bg-emerald-500'} animate-pulse`} />
                    <span className="text-[8px] font-black font-mono tracking-widest uppercase">
                      {user.isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-4 text-right">
                   <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                     <button 
                       onClick={() => onManage(user.id, { verifiedHuman: !user.verifiedHuman })}
                       className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all active:scale-90"
                       title="Toggle Verification"
                     >
                       <ICONS.Verified />
                     </button>
                     <button 
                       onClick={() => onManage(user.id, { isSuspended: !user.isSuspended })}
                       className={`p-2.5 rounded-xl transition-all active:scale-90 ${user.isSuspended ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30'}`}
                       title="Toggle Suspension"
                     >
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                     </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
         {filteredNodes.map(user => (
            <div key={user.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-5 shadow-sm">
               <div className="flex items-center gap-4 mb-4">
                  <img src={user.avatarUrl} className="w-14 h-14 rounded-[1.2rem] object-cover border border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-800" alt="" />
                  <div>
                     <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight">{user.displayName}</h4>
                        {user.verifiedHuman && <div className="text-indigo-500 dark:text-indigo-400 scale-75"><ICONS.Verified /></div>}
                     </div>
                     <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest">@{user.username}</p>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-3 mb-4">
                  <select 
                    value={user.role} 
                    onChange={(e) => onManage(user.id, { role: e.target.value as UserRole })}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 text-[9px] font-black uppercase tracking-widest outline-none text-slate-600 dark:text-slate-300 text-center"
                  >
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <div className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl border ${user.isSuspended ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900 text-rose-600 dark:text-rose-400' : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${user.isSuspended ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                    <span className="text-[8px] font-black font-mono tracking-widest uppercase">
                      {user.isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                    </span>
                  </div>
               </div>

               <div className="flex gap-2">
                  <button 
                     onClick={() => onManage(user.id, { verifiedHuman: !user.verifiedHuman })}
                     className="flex-1 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[9px] uppercase tracking-widest hover:bg-indigo-600 dark:hover:bg-indigo-300 transition-all"
                  >
                     {user.verifiedHuman ? 'REVOKE' : 'VERIFY'}
                  </button>
                  <button 
                     onClick={() => onManage(user.id, { isSuspended: !user.isSuspended })}
                     className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black text-[9px] uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                  >
                     {user.isSuspended ? 'RESTORE' : 'SUSPEND'}
                  </button>
               </div>
            </div>
         ))}
      </div>
    </div>
  );
};
