
import React, { useState } from 'react';
import { AppNotification, Region, User } from '../../types';
import { PULSE_FREQUENCIES, ICONS } from '../../constants';
import { db } from '../../services/firebase';
import { doc, writeBatch } from 'firebase/firestore';

interface NotificationsPageProps {
  notifications: AppNotification[];
  onDelete: (id: string) => void;
  onMarkRead: () => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  locale: Region;
  userData: User | null;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ 
  notifications, 
  onDelete, 
  onMarkRead, 
  addToast, 
  locale,
  userData
}) => {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      await onMarkRead();
      addToast("Neural Handshakes Synchronized", "success");
    } catch (e) {
      addToast("Sync Protocol Interrupted", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePurgeAll = async () => {
    if (!db || !userData || notifications.length === 0) {
      addToast("Local Buffer Empty", "info");
      return;
    }
    
    // 2026 Protocol: No browser confirms. We execute and notify.
    const batch = writeBatch(db);
    notifications.forEach(n => {
      batch.delete(doc(db, 'notifications', n.id));
    });
    
    try {
      await batch.commit();
      addToast("Local Notification Cluster Purged", "success");
    } catch (e) {
      addToast("Purge Protocol Failed: Buffer Locked", "error");
    }
  };

  const iconMap: Record<string, any> = {
    follow: <div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M19 7.5v9m-4.5-4.5h9M3 13.5h9m-9-4.5h9m-9-4.5h9" /></svg></div>,
    broadcast: <div className="p-3 bg-rose-600 text-white rounded-2xl shadow-lg shadow-rose-200 animate-pulse"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></div>,
    system: <div className="p-3 bg-slate-900 text-white rounded-2xl"><ICONS.Admin /></div>,
    relay: <div className="p-3 bg-indigo-600 text-white rounded-2xl"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg></div>
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic">Neural_Center</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mt-3">Monitoring Grid Handshakes • Buffer Status: {notifications.length} Nodes</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
           <button 
             onClick={handleSyncAll}
             disabled={isSyncing}
             className="flex-1 md:flex-none px-6 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
           >
             {isSyncing ? 'Syncing...' : 'Sync_All_Read'}
           </button>
           <button 
             onClick={handlePurgeAll}
             className="flex-1 md:flex-none px-6 py-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all active:scale-95 shadow-sm"
           >
             Purge_Buffer
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {notifications.length > 0 ? (
          notifications.map(notif => {
            const pulseConfig = PULSE_FREQUENCIES.find(f => f.id === notif.pulseFrequency);
            
            return (
              <div 
                key={notif.id} 
                className={`group relative flex items-center gap-6 p-6 md:p-8 bg-white border-precision rounded-[2.5rem] transition-all duration-500 hover:shadow-2xl hover:border-indigo-100 cursor-pointer overflow-hidden ${!notif.isRead ? 'border-l-8 border-l-indigo-600' : ''}`}
              >
                <div className="relative shrink-0">
                  <img src={notif.fromUserAvatar} className="w-14 h-14 md:w-16 md:h-16 rounded-[1.6rem] object-cover border border-slate-100 shadow-sm" alt="" />
                  {pulseConfig && (
                    <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white shadow-xl flex items-center justify-center text-sm border border-slate-50 animate-bounce`}>
                      {pulseConfig.emoji}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="font-black text-slate-900 text-sm md:text-base uppercase italic tracking-tight">{notif.fromUserName}</h3>
                    {!notif.isRead && <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />}
                  </div>
                  <p className="text-slate-600 font-bold text-sm md:text-base leading-relaxed">
                    {notif.text}
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                       {notif.timestamp?.toDate ? notif.timestamp.toDate().toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'ESTABLISHING...'}
                     </span>
                     {pulseConfig && (
                       <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${pulseConfig.color.replace('text', 'border')} ${pulseConfig.color.replace('text', 'bg-')}/5`}>
                         {pulseConfig.id}_FREQUENCY_LOCKED
                       </span>
                     )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-4">
                  <div className="hidden sm:block opacity-40 group-hover:opacity-100 transition-opacity scale-110">
                     {notif.type === 'like' && pulseConfig ? (
                       <div className={`p-3 rounded-2xl bg-white shadow-xl ${pulseConfig.color}`}>
                         <span className="text-2xl">{pulseConfig.emoji}</span>
                       </div>
                     ) : (iconMap[notif.type] || iconMap.system)}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }}
                    className="p-5 md:p-6 bg-slate-50 text-rose-500 rounded-2xl hover:bg-rose-50 transition-all active:scale-90 opacity-0 group-hover:opacity-100 shadow-sm"
                    title="Purge Signal"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={4} viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-40 text-center bg-white rounded-[4rem] border-precision shadow-sm flex flex-col items-center justify-center opacity-40">
             <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mb-10 text-slate-300">
                <ICONS.Bell />
             </div>
             <p className="text-[11px] font-black uppercase tracking-[0.5em] font-mono italic">Signal Archive Empty</p>
          </div>
        )}
      </div>
    </div>
  );
};
