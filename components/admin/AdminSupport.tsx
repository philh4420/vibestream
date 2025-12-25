
import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc 
} = Firestore as any;
import { ICONS } from '../../constants';
import { DeleteConfirmationModal } from '../ui/DeleteConfirmationModal';

interface AdminSupportProps {
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

interface Ticket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  description: string;
  category: 'technical' | 'account' | 'billing' | 'harassment' | 'appeal';
  status: 'open' | 'resolved' | 'escalated';
  priority: 'normal' | 'high';
  attachmentUrl?: string;
  createdAt: any;
}

const CATEGORY_CONFIG: Record<string, { color: string, bg: string, border: string, icon: any, label: string }> = {
  'appeal': { 
    color: 'text-rose-600 dark:text-rose-400', 
    bg: 'bg-rose-50 dark:bg-rose-900/20', 
    border: 'border-rose-200 dark:border-rose-900',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
      </svg>
    ),
    label: 'BAN_APPEAL'
  },
  'harassment': { 
    color: 'text-orange-600 dark:text-orange-400', 
    bg: 'bg-orange-50 dark:bg-orange-900/20', 
    border: 'border-orange-200 dark:border-orange-900',
    icon: <ICONS.Resilience />,
    label: 'SAFETY_ALERT'
  },
  'billing': { 
    color: 'text-emerald-600 dark:text-emerald-400', 
    bg: 'bg-emerald-50 dark:bg-emerald-900/20', 
    border: 'border-emerald-200 dark:border-emerald-900',
    icon: <ICONS.Saved />,
    label: 'BILLING'
  },
  'technical': { 
    color: 'text-indigo-600 dark:text-indigo-400', 
    bg: 'bg-indigo-50 dark:bg-indigo-900/20', 
    border: 'border-indigo-200 dark:border-indigo-900',
    icon: <ICONS.Settings />,
    label: 'TECHNICAL'
  },
  'account': { 
    color: 'text-slate-600 dark:text-slate-400', 
    bg: 'bg-slate-100 dark:bg-slate-800', 
    border: 'border-slate-200 dark:border-slate-700',
    icon: <ICONS.Profile />,
    label: 'ACCOUNT'
  }
};

export const AdminSupport: React.FC<AdminSupportProps> = ({ addToast }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState<'active' | 'appeals' | 'resolved'>('active');
  const [loading, setLoading] = useState(true);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!db) return;
    
    const q = query(collection(db, 'support_tickets'), orderBy('createdAt', 'desc'));
    
    const unsub = onSnapshot(q, (snap: any) => {
      setTickets(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Ticket)));
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'support_tickets', id), { status: newStatus });
      addToast(`Ticket marked as ${newStatus.toUpperCase()}`, 'success');
    } catch (e) {
      addToast("Status update failed", "error");
    }
  };

  const confirmDelete = async () => {
    if (!ticketToDelete) return;
    try {
      await deleteDoc(doc(db, 'support_tickets', ticketToDelete));
      addToast("Ticket purged", "success");
    } catch (e) {
      addToast("Purge failed", "error");
    } finally {
      setTicketToDelete(null);
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (filter === 'resolved') return t.status === 'resolved';
    if (filter === 'appeals') return t.category === 'appeal' && t.status !== 'resolved';
    // Active includes everything open/escalated EXCEPT appeals (to keep the active queue clean for standard support)
    // Or we can include appeals in active. Let's exclude appeals from 'active' so they have their own focused tab.
    return (t.status === 'open' || t.status === 'escalated') && t.category !== 'appeal';
  });

  const stats = {
    active: tickets.filter(t => (t.status === 'open' || t.status === 'escalated') && t.category !== 'appeal').length,
    appeals: tickets.filter(t => t.category === 'appeal' && t.status !== 'resolved').length,
    critical: tickets.filter(t => t.priority === 'high' && t.status !== 'resolved').length
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* 1. Header & Stats */}
      <div className="relative rounded-[3rem] bg-indigo-950 p-10 md:p-12 text-white shadow-2xl border border-white/10 overflow-hidden group">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/20 blur-[120px] rounded-full translate-x-1/4 -translate-y-1/4 group-hover:bg-purple-500/30 transition-colors duration-1000" />
         <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-rose-500/10 blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3" />
         
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="space-y-4">
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                  <ICONS.Support />
                  <span className="text-[9px] font-black text-white uppercase tracking-[0.3em] font-mono">Support_Matrix</span>
               </div>
               <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-none text-white">
                 Inbound_Signals
               </h1>
               <p className="text-xs font-medium text-indigo-200/80 leading-relaxed max-w-sm">
                 Manage user inquiries, technical anomalies, and prioritize account appeals.
               </p>
            </div>

            <div className="flex flex-wrap gap-4">
               <div className="px-6 py-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] flex flex-col items-center justify-center min-w-[100px]">
                  <span className="text-3xl font-black text-white leading-none tracking-tighter">{stats.active}</span>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Standard</span>
               </div>
               <div className="px-6 py-4 bg-rose-500/20 backdrop-blur-md border border-rose-500/30 rounded-[2rem] flex flex-col items-center justify-center min-w-[100px]">
                  <span className="text-3xl font-black text-rose-300 leading-none tracking-tighter">{stats.appeals}</span>
                  <span className="text-[8px] font-black text-rose-200 uppercase tracking-widest mt-1.5">Appeals</span>
               </div>
            </div>
         </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="flex overflow-x-auto no-scrollbar bg-slate-100 dark:bg-slate-800 p-1 rounded-[2rem] w-full md:w-fit">
         <button 
           onClick={() => setFilter('active')}
           className={`flex-1 md:flex-none px-8 py-3 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === 'active' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-md' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'}`}
         >
           Active_Tickets
         </button>
         <button 
           onClick={() => setFilter('appeals')}
           className={`flex-1 md:flex-none px-8 py-3 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === 'appeals' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-md' : 'text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400'}`}
         >
           Ban_Appeals
         </button>
         <button 
           onClick={() => setFilter('resolved')}
           className={`flex-1 md:flex-none px-8 py-3 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === 'resolved' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-md' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'}`}
         >
           Archive
         </button>
      </div>

      {/* 3. Ticket Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 min-h-[400px]">
         {loading ? (
            Array.from({length: 6}).map((_, i) => (
               <div key={i} className="h-64 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] animate-pulse border border-slate-100 dark:border-slate-700" />
            ))
         ) : filteredTickets.length > 0 ? (
            filteredTickets.map((ticket, idx) => {
               const config = CATEGORY_CONFIG[ticket.category] || CATEGORY_CONFIG['technical'];
               
               return (
                 <div 
                   key={ticket.id} 
                   className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900 transition-all duration-300 flex flex-col relative overflow-hidden"
                 >
                    {/* Status Strip */}
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${ticket.category === 'appeal' ? 'bg-rose-500' : ticket.status === 'resolved' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />

                    <div className="flex justify-between items-start mb-4 pl-4">
                       <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${config.bg} ${config.border}`}>
                          <div className={config.color}>{config.icon}</div>
                          <span className={`text-[8px] font-black uppercase tracking-widest ${config.color}`}>
                             {config.label}
                          </span>
                       </div>
                       <span className="text-[8px] font-mono font-bold text-slate-400 dark:text-slate-500">
                          {ticket.createdAt?.toDate ? ticket.createdAt.toDate().toLocaleDateString() : 'N/A'}
                       </span>
                    </div>

                    <div className="pl-4 mb-6 flex-1">
                       <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-2 line-clamp-1">
                          {ticket.subject}
                       </h3>
                       <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed line-clamp-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                          "{ticket.description}"
                       </p>
                       
                       <div className="mt-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500">
                             {ticket.userName.charAt(0)}
                          </div>
                          <div className="flex flex-col min-w-0">
                             <span className="text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-wide truncate">{ticket.userName}</span>
                             <span className="text-[8px] font-mono text-slate-400 truncate">{ticket.userEmail}</span>
                          </div>
                       </div>

                       {ticket.attachmentUrl && (
                          <a 
                             href={ticket.attachmentUrl} 
                             target="_blank" 
                             rel="noreferrer"
                             className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors border border-slate-100 dark:border-slate-700 w-full justify-center"
                          >
                             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                             View_Attached_Evidence
                          </a>
                       )}
                    </div>

                    <div className="flex items-center gap-2 pl-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                       {ticket.status !== 'resolved' ? (
                          <>
                             <button 
                                onClick={() => handleUpdateStatus(ticket.id, 'resolved')}
                                className="flex-1 py-3 bg-emerald-500 text-white rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                             >
                                <ICONS.Verified /> {ticket.category === 'appeal' ? 'APPROVE_LIFT' : 'RESOLVE'}
                             </button>
                             {ticket.status !== 'escalated' && ticket.category !== 'appeal' && (
                                <button 
                                   onClick={() => handleUpdateStatus(ticket.id, 'escalated')}
                                   className="px-4 py-3 bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400 border border-rose-100 dark:border-rose-800 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all active:scale-95"
                                >
                                   Escalate
                                </button>
                             )}
                          </>
                       ) : (
                          <button 
                             onClick={() => handleUpdateStatus(ticket.id, 'open')}
                             className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                          >
                             Re-Open
                          </button>
                       )}
                       
                       <button 
                          onClick={() => setTicketToDelete(ticket.id)}
                          className="p-3 text-slate-300 hover:text-rose-500 transition-colors"
                       >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                       </button>
                    </div>
                 </div>
               );
            })
         ) : (
            <div className="col-span-full py-32 text-center opacity-40">
               <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 dark:text-slate-600">
                  <ICONS.Support />
               </div>
               <h3 className="text-xl font-black uppercase tracking-widest italic text-slate-900 dark:text-white">All_Clear</h3>
               <p className="text-[10px] font-black uppercase tracking-[0.4em] font-mono text-slate-400 dark:text-slate-500 mt-2">
                  No signals detected in {filter} buffer.
               </p>
            </div>
         )}
      </div>

      <DeleteConfirmationModal
        isOpen={!!ticketToDelete}
        title="PURGE_TICKET_LOG"
        description="Permanently delete this support ticket from the archive? This action is irreversible."
        onConfirm={confirmDelete}
        onCancel={() => setTicketToDelete(null)}
        confirmText="PURGE_TICKET"
      />
    </div>
  );
};
