
import React, { useState, useMemo } from 'react';
import { AppNotification, Region, User } from '../../types';
import { PULSE_FREQUENCIES, ICONS } from '../../constants';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { doc, writeBatch, updateDoc } = Firestore as any;
import { DeleteConfirmationModal } from '../ui/DeleteConfirmationModal';

interface NotificationsPageProps {
  notifications: AppNotification[];
  onDelete: (id: string) => void;
  onMarkRead: () => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  locale: Region;
  userData: User | null;
}

type SignalFilter = 'all' | 'pulses' | 'system';

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ 
  notifications, 
  onDelete, 
  onMarkRead, 
  addToast, 
  locale,
  userData
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SignalFilter>('all');
  const [showPurgeModal, setShowPurgeModal] = useState(false);

  // Group notifications by date sections
  const groupedNotifications = useMemo(() => {
    let filtered = notifications;
    
    // Apply type filter
    if (activeFilter === 'pulses') {
      filtered = notifications.filter(n => ['like', 'relay', 'follow'].includes(n.type));
    } else if (activeFilter === 'system') {
      filtered = notifications.filter(n => ['system', 'broadcast', 'packet_summary', 'gathering_rsvp', 'gathering_create'].includes(n.type));
    }

    const groups: { label: string; items: AppNotification[] }[] = [
      { label: 'Incoming_Signals', items: [] }, // Unread
      { label: 'Today', items: [] },
      { label: 'Yesterday', items: [] },
      { label: 'Archive_Log', items: [] }
    ];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    filtered.forEach(n => {
      if (!n.isRead) {
        groups[0].items.push(n);
        return;
      }

      const d = n.timestamp?.toDate ? n.timestamp.toDate() : new Date();
      // Reset time for comparison
      const checkDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

      if (checkDate.getTime() === today.getTime()) {
        groups[1].items.push(n);
      } else if (checkDate.getTime() === yesterday.getTime()) {
        groups[2].items.push(n);
      } else {
        groups[3].items.push(n);
      }
    });

    return groups.filter(g => g.items.length > 0);
  }, [notifications, activeFilter]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleItemClick = async (notif: AppNotification) => {
    if (notif.isRead || !db) return;
    try {
      await updateDoc(doc(db, 'notifications', notif.id), { isRead: true });
    } catch (e) {
      console.error("Read sync failed", e);
    }
  };

  const handleSyncAll = async () => {
    if (unreadCount === 0) return;
    setIsSyncing(true);
    try {
      await onMarkRead();
      addToast("Signals Synchronised", "success");
    } catch (e) {
      addToast("Sync Protocol Interrupted", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const executePurgeAll = async () => {
    if (!db || !userData) return;
    
    const batch = writeBatch(db);
    notifications.forEach(n => {
      batch.delete(doc(db, 'notifications', n.id));
    });
    
    try {
      await batch.commit();
      addToast("Signal Archive Purged", "success");
    } catch (e) {
      addToast("Purge Protocol Failed", "error");
    } finally {
      setShowPurgeModal(false);
    }
  };

  const getIcon = (type: string, pulseId?: string) => {
    const pulseConfig = PULSE_FREQUENCIES.find(f => f.id === pulseId);
    
    if (type === 'like' && pulseConfig) {
       return <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-sm border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 ${pulseConfig.color}`}>{pulseConfig.emoji}</div>;
    }

    const iconClasses = "w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md scale-90";

    switch (type) {
        case 'follow': return <div className={`${iconClasses} bg-indigo-600`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M19 7.5v9m-4.5-4.5h9M3 13.5h9m-9-4.5h9m-9-4.5h9" /></svg></div>;
        case 'broadcast': return <div className={`${iconClasses} bg-rose-600 animate-pulse`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></div>;
        case 'relay': return <div className={`${iconClasses} bg-emerald-500`}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg></div>;
        case 'message': return <div className={`${iconClasses} bg-indigo-500`}><ICONS.Messages /></div>;
        case 'like': return <div className="w-8 h-8 bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400 rounded-xl flex items-center justify-center border border-rose-100 dark:border-rose-900 shadow-sm scale-90">❤️</div>;
        case 'gathering_rsvp': return <div className={`${iconClasses} bg-purple-600`}><ICONS.Gatherings /></div>;
        case 'gathering_create': return <div className={`${iconClasses} bg-slate-900 dark:bg-white text-white dark:text-slate-900`}><ICONS.Gatherings /></div>;
        default: return <div className={`${iconClasses} bg-slate-700`}><ICONS.Bell /></div>;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-32 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* 1. Command Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-8 px-4 md:px-0 pt-4">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className={`w-2 h-2 rounded-full ${unreadCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] font-mono">
                STATUS: {unreadCount > 0 ? `${unreadCount}_NEW_SIGNALS` : 'GRID_SYNCED'}
              </span>
           </div>
           <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none">
             Signal_Log
           </h1>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
           <button 
             onClick={handleSyncAll}
             disabled={unreadCount === 0 || isSyncing}
             className="flex-1 md:flex-none h-12 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 dark:hover:bg-indigo-400 dark:hover:text-white transition-all active:scale-95 disabled:opacity-20 disabled:active:scale-100 flex items-center justify-center gap-2"
           >
             {isSyncing ? (
               <div className="w-3 h-3 border-2 border-white/30 border-t-white dark:border-slate-900/30 dark:border-t-slate-900 rounded-full animate-spin" />
             ) : (
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>
             )}
             MARK_ALL_READ
           </button>
           
           <button 
             onClick={() => setShowPurgeModal(true)}
             disabled={notifications.length === 0}
             className="h-12 w-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-900 rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-sm disabled:opacity-50"
             title="Purge Archive"
           >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
           </button>
        </div>
      </div>

      {/* 2. Frequency Filters */}
      <div className="relative z-30 mb-8 px-4 md:px-0">
         <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/60 dark:border-white/10 p-1.5 rounded-[2rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] flex items-center justify-between gap-2 max-w-md">
            {(['all', 'pulses', 'system'] as const).map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`flex-1 py-3 rounded-[1.6rem] text-[9px] font-black uppercase tracking-widest transition-all duration-300 relative overflow-hidden ${activeFilter === f ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                {f}
              </button>
            ))}
         </div>
      </div>

      {/* 3. Notification Stream (Grouped) */}
      <div className="space-y-10 px-4 md:px-0">
         {groupedNotifications.length > 0 ? (
           groupedNotifications.map((group) => (
             <div key={group.label} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div className="flex items-center gap-4 mb-4 opacity-60">
                  <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] font-mono">{group.label}</span>
                  <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
               </div>

               <div className="space-y-3">
                 {group.items.map((notif) => {
                   const isRead = notif.isRead;
                   return (
                     <div 
                       key={notif.id}
                       onClick={() => handleItemClick(notif)}
                       className={`group relative flex items-start gap-4 p-4 rounded-[2rem] border transition-all duration-300 cursor-pointer overflow-hidden active:scale-[0.99] ${
                         !isRead 
                           ? 'bg-white dark:bg-slate-900 border-indigo-100 dark:border-indigo-900/50 shadow-lg ring-1 ring-indigo-50 dark:ring-indigo-900/20 z-10' 
                           : 'bg-[#fcfcfd] dark:bg-slate-950/30 border-transparent hover:bg-white dark:hover:bg-slate-900 hover:border-slate-100 dark:hover:border-slate-800'
                       }`}
                     >
                       {/* Unread Bar */}
                       {!isRead && (
                         <div className="absolute left-0 top-6 bottom-6 w-1 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(79,70,229,0.6)]" />
                       )}

                       {/* Avatar & Type */}
                       <div className="relative shrink-0 mt-1 ml-2">
                          <img src={notif.fromUserAvatar} className="w-10 h-10 rounded-xl object-cover border border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 shadow-sm" alt="" />
                          <div className="absolute -bottom-2 -right-2">
                             {getIcon(notif.type, notif.pulseFrequency)}
                          </div>
                       </div>

                       {/* Text Content */}
                       <div className="flex-1 min-w-0 pt-0.5 pl-2">
                          <div className="flex flex-wrap items-baseline gap-x-1.5 mb-1">
                             <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase italic tracking-tight">{notif.fromUserName}</h4>
                             <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-tight line-clamp-2">{notif.text}</span>
                          </div>
                          
                          <p className="text-[8px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest font-mono">
                            {notif.timestamp?.toDate ? notif.timestamp.toDate().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'NOW'}
                          </p>
                       </div>

                       {/* Action */}
                       <div className="shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }}
                            className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                          >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                       </div>
                     </div>
                   );
                 })}
               </div>
             </div>
           ))
         ) : (
           <div className="py-32 flex flex-col items-center justify-center text-center px-6 opacity-50">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mb-6 text-slate-300 dark:text-slate-600 shadow-inner">
                 <ICONS.Bell />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest italic mb-2">Zero_Activity</h3>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] font-mono max-w-xs leading-relaxed">
                No signals detected in your sector.
              </p>
           </div>
         )}
      </div>

      {/* Purge Modal */}
      <DeleteConfirmationModal 
        isOpen={showPurgeModal}
        title="PURGE_SIGNAL_LOG"
        description="Permanently delete all received notifications? This action cannot be reversed."
        onConfirm={executePurgeAll}
        onCancel={() => setShowPurgeModal(false)}
        confirmText="CONFIRM_PURGE"
      />
    </div>
  );
};
