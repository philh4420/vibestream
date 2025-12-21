import React from 'react';
import { User } from '../../types';

interface AdminUsersProps {
  nodes: User[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const AdminUsers: React.FC<AdminUsersProps> = ({ nodes, searchQuery, setSearchQuery }) => {
  return (
    <div className="bg-white border-precision rounded-[3.5rem] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.06)] overflow-hidden animate-in fade-in slide-up duration-500">
      <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-8 bg-slate-50/20">
        <div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Node_Manifest_Archive</h3>
          <p className="text-[11px] font-black text-slate-400 font-mono uppercase tracking-[0.5em] mt-3">Global Infrastructure Identity Database</p>
        </div>
        <div className="relative w-full md:w-[400px]">
          <input 
            type="text" placeholder="Scan Identifiers / Names..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-[1.8rem] pl-8 pr-8 py-5 text-sm font-bold outline-none h-16 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 shadow-inner transition-all"
          />
        </div>
      </div>
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="w-[40%] px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] font-mono">Identity_Hash_Link</th>
              <th className="w-[20%] px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] font-mono">Protocol_Role</th>
              <th className="w-[20%] px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] font-mono">Grid_State</th>
              <th className="w-[20%] px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] font-mono text-right">Ops_Command</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {nodes.filter(n => n.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || n.username.toLowerCase().includes(searchQuery.toLowerCase())).map(user => (
              <tr key={user.id} className="hover:bg-slate-50/30 transition-all group">
                <td className="px-10 py-8">
                  <div className="flex items-center gap-6">
                    <img src={user.avatarUrl} className="w-16 h-16 rounded-[1.8rem] object-cover border-2 border-white shadow-2xl transition-transform group-hover:scale-105" alt="" />
                    <div className="min-w-0">
                      <p className="font-black text-slate-950 text-lg tracking-tight truncate leading-none mb-2 italic group-hover:text-indigo-600 transition-colors">{user.displayName}</p>
                      <p className="text-[10px] font-mono text-slate-400 truncate tracking-[0.2em] uppercase">ID_GRID_NODE_{user.id.toUpperCase().slice(0, 18)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-10 py-8">
                  <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${user.role === 'admin' ? 'bg-slate-950 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-100'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-10 py-8">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${user.isSuspended ? 'bg-rose-500' : 'bg-emerald-500'} animate-pulse shadow-sm`} />
                    <span className={`text-[12px] font-black font-mono tracking-tighter uppercase ${user.isSuspended ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {user.isSuspended ? 'ISOLATED' : 'SYNCHRONISED'}
                    </span>
                  </div>
                </td>
                <td className="px-10 py-8 text-right">
                   <button className="px-6 py-2.5 rounded-xl text-[10px] font-black text-indigo-500 hover:bg-indigo-50 hover:text-indigo-800 tracking-[0.3em] uppercase font-mono italic transition-all active:scale-95">Manage_Node</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
