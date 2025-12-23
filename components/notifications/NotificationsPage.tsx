
import React, { useState, useMemo } from 'react';
import { AppNotification, Region, User } from '../../types';
import { PULSE_FREQUENCIES, ICONS } from '../../constants';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { doc, writeBatch, updateDoc } = Firestore as any;

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

  const filteredNotifications = useMemo(() => {
    switch (activeFilter) {
      case 'pulses':
        return notifications.filter(n => n.type === 'like' || n.type === 'relay' || n.type === 'follow');
      case 'system':
        return notifications.filter(n => n.type === 'system' || n.type === 'broadcast' || n.type === 'packet_summary' || n.type === 'gathering_rsvp');
      default:
        return notifications;
    }
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

  const handlePurgeAll = async () => {
    if (!db || !userData || notifications.length === 0) {
      return;
    }
    
    if(!window.confirm("CONFIRM: Purge all signal history? This cannot be undone.")) return;

    const batch = writeBatch(db);
    notifications.forEach(n => {
      batch.delete(doc(db, 'notifications', n.id));
    });
    
    try {
      await batch.commit();
      addToast("Signal Archive Purged", "success");
    } catch (e) {
      addToast("Purge Protocol Failed", "error");
    }
  };

  const getIcon = (type: string, pulseId?: string) => {
    const pulseConfig = PULSE_FREQUENCIES.find(f => f.id === pulseId);
    
    if (type === 'like' && pulseConfig) {
       return <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-sm border border-slate-100 ${pulseConfig.color} bg-white`}>{pulseConfig.emoji}</div>;
    }

    switch (type) {
        case 'follow': return <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M19 7.5v9m-4.5-4.5h9M3 13.5h9m-9-4.5h9m-9-4.5h9" /></svg></div>;
        case 'broadcast': return <div className="w-10 h-10 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200 animate-pulse"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></div>;
        case 'relay': return <div className="w-10 h-10 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg></div>;
        case 'message': return <div className="w-10 h-10 bg-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100"><ICONS.Messages /></div>;
        case 'like': return <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center border border-rose-100">❤️</div>;
        case 'gathering_rsvp': return <div className="w-10 h-10 bg-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200"><ICONS.Gatherings /></div>;
        default: return <div className="w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg"><ICONS.Bell /></div>;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-32 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* 1. Command Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-8 px-4 md:px-0 pt-4">
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className={`w-2 h-2 rounded-full ${unreadCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono">
                INBOX_STATUS: {unreadCount > 0 ? 'ACTIVE_SIGNALS' : 'IDLE'}
              </span>
           </div>
           <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
             Signal_Log
           </h1>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
           <button 
             onClick={handleSyncAll}
             disabled={unreadCount === 0 || isSyncing}
             className="flex-1 md:flex-none h-12 px-6 bg-slate-900 text-white rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-20 disabled:active:scale-100 flex items-center justify-center gap-2"
           >
             {isSyncing ? (
               <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
             ) : (
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>
             )}
             MARK_READ
           </button>
           
           <button 
             onClick={handlePurgeAll}
             disabled={notifications.length === 0}
             className="h-12 w-12 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-sm disabled:opacity-50"
             title="Purge Archive"
           >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
           </button>
        </div>
      </div>

      {/* 2. Frequency Filters */}
      <div className="sticky top-[calc(var(--header-h)+1rem)] z-30 mb-8 px-4 md:px-0">
         <div className="bg-white/80 backdrop-blur-xl border border-white/60 p-1.5 rounded-[2rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] flex items-center justify-between gap-2 max-w-md">
            {(['all', 'pulses', 'system'] as const).map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`flex-1 py-3 rounded-[1.6rem] text-[9px] font-black uppercase tracking-widest transition-all duration-300 relative overflow-hidden ${activeFilter === f ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
              >
                {f}
              </button>
            ))}
         </div>
      </div>

      {/* 3. Notification Stream */}
      <div className="space-y-4 px-4 md:px-0">
         {filteredNotifications.length > 0 ? (
           filteredNotifications.map((notif, idx) => {
             const isRead = notif.isRead;
             return (
               <div 
                 key={notif.id}
                 onClick={() => handleItemClick(notif)}
                 className={`group relative flex items-start gap-5 p-5 md:p-6 rounded-[2.5rem] border transition-all duration-500 cursor-pointer overflow-hidden active:scale-[0.99] ${
                   !isRead 
                     ? 'bg-white border-indigo-100 shadow-[0_20px_40px_-10px_rgba(79,70,229,0.15)] ring-1 ring-indigo-50 z-10' 
                     : 'bg-[#f8fafc] border-transparent hover:bg-white hover:border-slate-100 hover:shadow-lg'
                 }`}
                 style={{ animationDelay: `${idx * 50}ms` }}
               >
                 {/* Unread Indicator */}
                 {!isRead && (
                   <div className="absolute left-0 top-8 bottom-8 w-1.5 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
                 )}

                 {/* Icon / Avatar Layer */}
                 <div className="relative shrink-0 mt-1">
                    <div className="relative z-10">
                       <img src={notif.fromUserAvatar} className="w-12 h-12 md:w-14 md:h-14 rounded-[1.2rem] object-cover border-2 border-white bg-slate-100 shadow-sm group-hover:scale-105 transition-transform" alt="" />
                       <div className="absolute -bottom-2 -right-2 scale-75 shadow-sm">
                          {getIcon(notif.type, notif.pulseFrequency)}
                       </div>
                    </div>
                 </div>

                 {/* Content Layer */}
                 <div className="flex-1 min-w-0 pt-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 mb-1.5">
                       <h4 className="text-sm font-black text-slate-900 uppercase italic tracking-tight hover:text-indigo-600 transition-colors">{notif.fromUserName}</h4>
                       <span className="text-[10px] font-medium text-slate-500 leading-tight">{notif.text}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                       <div className="px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200/50">
                          <p className="text-[8px] font-black text-slate-400 font-mono">
                            {notif.timestamp?.toDate ? notif.timestamp.toDate().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'NOW'}
                          </p>
                       </div>
                       {!isRead && (
                         <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest animate-pulse">NEW_SIGNAL</span>
                       )}
                    </div>
                 </div>

                 {/* Action Layer */}
                 <div className="shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-4 group-hover:translate-x-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }}
                      className="p-3 bg-white border border-rose-100 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all shadow-sm active:scale-90"
                    >
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                 </div>
               </div>
             );
           })
         ) : (
           <div className="py-32 flex flex-col items-center justify-center text-center px-6">
              <div className="w-24 h-24 bg-slate-100 rounded-[2.5rem] flex items-center justify-center mb-6 text-slate-300 shadow-inner">
                 <ICONS.Bell />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest italic mb-2">Zero_Activity</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono max-w-xs leading-relaxed">
                No new signals detected in your sector for this frequency range.
              </p>
           </div>
         )}
      </div>

      {/* Footer Decoration */}
      {filteredNotifications.length > 0 && (
        <div className="mt-12 flex justify-center opacity-30">
           <div className="h-1 w-12 bg-slate-300 rounded-full" />
        </div>
      )}
    </div>
  );
};
