
import React, { useState } from 'react';
import { User } from '../../types';

interface ClusterCreationModalProps {
  currentUser: User;
  availableNodes: User[];
  onClose: () => void;
  onConfirm: (name: string, participants: string[]) => void;
}

export const ClusterCreationModal: React.FC<ClusterCreationModalProps> = ({ availableNodes, onClose, onConfirm }) => {
  const [clusterName, setClusterName] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  const toggleNode = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const filteredNodes = availableNodes.filter(n => 
    n.displayName.toLowerCase().includes(search.toLowerCase()) || 
    n.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-transparent" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-xl rounded-[3.5rem] p-12 shadow-heavy border border-white/10 animate-in zoom-in-95 duration-500 overflow-hidden flex flex-col h-[85vh]">
        
        <div className="shrink-0 flex justify-between items-start mb-10">
           <div>
             <h2 className="text-4xl font-black text-slate-950 tracking-tighter uppercase italic leading-none">Fusion_Protocol</h2>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mt-3">Initialising New Multi-Node Cluster</p>
           </div>
           <button onClick={onClose} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>

        <div className="space-y-6 mb-10 shrink-0">
           <div className="space-y-2">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono ml-2">Cluster_Identity_Label</label>
             <input 
               type="text" value={clusterName} onChange={(e) => setClusterName(e.target.value)}
               placeholder="e.g. ALPHA_Vanguard..."
               className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] px-8 py-6 text-lg font-black italic focus:ring-4 focus:ring-indigo-500/5 focus:bg-white outline-none transition-all placeholder:text-slate-200"
             />
           </div>
           <div className="space-y-2">
             <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono ml-2">Filter_Peers</label>
             <input 
               type="text" value={search} onChange={(e) => setSearch(e.target.value)}
               placeholder="Search by ID or Label..."
               className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold focus:bg-white outline-none transition-all"
             />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar scroll-container space-y-3 pb-6">
           {filteredNodes.length > 0 ? filteredNodes.map(user => {
             const isSelected = selectedIds.includes(user.id);
             return (
               <button 
                 key={user.id} 
                 onClick={() => toggleNode(user.id)}
                 className={`w-full flex items-center justify-between p-5 rounded-3xl border transition-all active:scale-98 ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 'bg-slate-50 border-slate-100 text-slate-900 hover:bg-white hover:border-indigo-100'}`}
               >
                 <div className="flex items-center gap-4">
                   <img src={user.avatarUrl} className={`w-12 h-12 rounded-2xl object-cover border-2 ${isSelected ? 'border-white/30' : 'border-white shadow-sm'}`} alt="" />
                   <div className="text-left">
                     <p className={`text-sm font-black uppercase italic ${isSelected ? 'text-white' : 'text-slate-900'}`}>{user.displayName}</p>
                     <p className={`text-[10px] font-mono uppercase tracking-widest ${isSelected ? 'text-white/60' : 'text-indigo-500'}`}>@{user.username}</p>
                   </div>
                 </div>
                 <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isSelected ? 'bg-white/20' : 'bg-white shadow-sm border border-slate-100'}`}>
                    {isSelected ? (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    )}
                 </div>
               </button>
             );
           }) : (
             <div className="py-20 text-center opacity-30 italic text-[11px] font-black font-mono">NO_MATCHING_NODES_IN_GRID</div>
           )}
        </div>

        <div className="pt-8 border-t border-slate-50 shrink-0">
           <button 
             disabled={!clusterName.trim() || selectedIds.length === 0}
             onClick={() => onConfirm(clusterName, selectedIds)}
             className="w-full py-7 bg-slate-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.6em] shadow-2xl hover:bg-black transition-all active:scale-95 disabled:opacity-20 italic"
           >
             CONFIRM_CLUSTER_FUSION
           </button>
        </div>
      </div>
    </div>
  );
};
