
import React, { useState, useMemo } from 'react';
import { AppNotification, Region, User, AppRoute } from '../../types';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { doc, writeBatch, updateDoc } = Firestore as any;
import { DeleteConfirmationModal } from '../ui/DeleteConfirmationModal';
import { NotificationItem } from './NotificationItem';
import { ICONS } from '../../constants';

interface NotificationsPageProps {
  notifications: AppNotification[];
  onDelete: (id: string) => void;
  onMarkRead: () => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  locale: Region;
  userData: User | null;
}

type FilterType = 'all' | 'mentions' | 'pulses' | 'systems';

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ notifications, onDelete, onMarkRead, addToast, locale }) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showPurgeModal, setShowPurgeModal] = useState(false);

  const filtered = useMemo(() => {
    switch (activeFilter) {
        case 'mentions': return notifications.filter(n => n.type === 'mention' || n.type === 'comment');
        case 'pulses': return notifications.filter(n => n.type === 'like' || n.type === 'follow' || n.type === 'relay');
        case 'systems': return notifications.filter(n => n.type === 'system' || n.type === 'broadcast');
        default: return notifications;
    }
  }, [notifications, activeFilter]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handlePurgeAll = async () => {
    if (!db) return;
    const batch = writeBatch(db);
    notifications.forEach(n => batch.delete(doc(db, 'notifications', n.id)));
    try { 
        await batch.commit(); 
        addToast("Archive Core Purged", "success"); 
        setShowPurgeModal(false);
    } catch (e) { 
        addToast("Purge Sequence Halted", "error"); 
    }
  };

  const handleMarkItemRead = async (id: string) => {
    if (!db) return;
    try {
        await updateDoc(doc(db, 'notifications', id), { isRead: true });
    } catch (e) { console.error(e); }
  };

  return (
    <div className="w-full max-w-5xl mx-auto pb-32 animate-in fade-in duration-700 space-y-10">
      
      {/* Master Protocol Header */}
      <div className="relative p-10 md:p-14 bg-slate-950 dark:bg-black rounded-[3.5rem] text-white shadow-2xl overflow-hidden border border-white/5 group">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full translate-x-1/4 -translate-y-1/4 transition-colors duration-1000" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
         
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl border backdrop-blur-md transition-colors duration-500 ${unreadCount > 0 ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'}`}>
                        <ICONS.Bell />
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-[0.4em] font-mono ${unreadCount > 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                        {unreadCount > 0 ? `INBOUND_SIGNALS: ${unreadCount}` : 'ALL_SIGNALS_SYNCED'}
                    </span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none">Signal_Archive</h1>
                <p className="text-xs md:text-sm font-medium text-slate-400 max-w-md leading-relaxed">
                   Comprehensive log of grid interactions, neural links, and automated system overrides.
                </p>
            </div>

            <div className="flex gap-4 w-full md:w-auto">
               <button 
                 onClick={onMarkRead}
                 disabled={unreadCount === 0}
                 className="flex-1 md:flex-none px-8 py-4 bg-white text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-50 transition-all active:scale-95 disabled:opacity-30"
               >
                 SYNC_ALL
               </button>
               <button 
                 onClick={() => setShowPurgeModal(true)}
                 className="p-4 bg-white/5 border border-white/10 hover:bg-rose-600/20 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 rounded-2xl transition-all active:scale-90"
               >
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
               </button>
            </div>
         </div>
      </div>

      {/* Control Surface */}
      <div className="relative z-30 px-2 md:px-0">
         <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/60 dark:border-slate-800 p-2 rounded-[2.5rem] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-[2rem] w-full md:w-auto overflow-x-auto no-scrollbar">
               {[
                 { id: 'all', label: 'All Logs' },
                 { id: 'mentions', label: 'Mentions' },
                 { id: 'pulses', label: 'Pulses' },
                 { id: 'systems', label: 'Systems' }
               ].map(tab => (
                 <button
                   key={tab.id}
                   onClick={() => setActiveFilter(tab.id as FilterType)}
                   className={`flex-1 md:flex-none px-8 py-3 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative whitespace-nowrap ${
                     activeFilter === tab.id 
                       ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' 
                       : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                   }`}
                 >
                   {tab.label}
                 </button>
               ))}
            </div>
            
            <div className="hidden md:flex items-center gap-3 pr-6 text-slate-400 dark:text-slate-600">
                <span className="text-[10px] font-black uppercase tracking-widest font-mono">Archive_Fid: 100%</span>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                <span className="text-[10px] font-black uppercase tracking-widest font-mono">Filter_Active</span>
            </div>
         </div>
      </div>

      {/* Signal Stream */}
      <div className="space-y-4 min-h-[400px]">
        {filtered.length > 0 ? (
            filtered.map((n, idx) => (
                <div 
                    key={n.id} 
                    className="animate-in fade-in slide-in-from-bottom-8 duration-700"
                    style={{ animationDelay: `${idx * 60}ms` }}
                >
                    <NotificationItem 
                        notification={n} 
                        onDelete={onDelete} 
                        onMarkRead={handleMarkItemRead} 
                    />
                </div>
            ))
        ) : (
            <div className="py-40 flex flex-col items-center justify-center text-center opacity-40 bg-white/40 dark:bg-slate-900/20 rounded-[4rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
               <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center mb-8 text-slate-300 dark:text-slate-700 shadow-inner">
                  <ICONS.Bell />
               </div>
               <h3 className="text-2xl font-black uppercase tracking-widest italic text-slate-900 dark:text-white leading-none">Void_Sector</h3>
               <p className="text-[10px] font-black uppercase tracking-[0.4em] font-mono mt-3 text-slate-400 dark:text-slate-500">
                  No signals detected in current frequency buffer.
               </p>
            </div>
        )}
      </div>

      <DeleteConfirmationModal 
        isOpen={showPurgeModal} 
        title="INITIATE_WIPE_PROTOCOL" 
        description="Permanently delete all signal logs from your archive? This protocol cannot be interrupted once started." 
        onConfirm={handlePurgeAll} 
        onCancel={() => setShowPurgeModal(false)} 
        confirmText="EXECUTE_PURGE"
      />
    </div>
  );
};
