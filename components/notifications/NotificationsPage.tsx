
import React, { useState, useMemo } from 'react';
import { AppNotification, Region, User, NotificationType } from '../../types';
import { PULSE_FREQUENCIES, ICONS } from '../../constants';
import { db } from '../../services/firebase';
import { doc, writeBatch, updateDoc } from 'firebase/firestore';

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
        return notifications.filter(n => n.type === 'like' || n.type === 'relay');
      case 'system':
        return notifications.filter(n => n.type === 'system' || n.type === 'broadcast');
      default:
        return notifications;
    }
  }, [notifications, activeFilter]);

  const handleItemClick = async (notif: AppNotification) => {
    if (notif.isRead || !db) return;
    try {
      await updateDoc(doc(db, 'notifications', notif.id), { isRead: true });
      // Implicitly handled by App.tsx listener, but we could add a tiny success toast for UX
    } catch (e) {
      addToast("Failed to sync signal state", "error");
    }
  };

  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      await onMarkRead();
      // Toast is handled by the parent handleMarkRead in App.tsx
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
    
    const batch = writeBatch(db);
    notifications.forEach(n => {
      batch.delete(doc(db, 'notifications', n.id));
    });
    
    try {
      await batch.commit();
      addToast("Signal Archive Purged Successfully", "success");
    } catch (e) {
      addToast("Purge Protocol Failed: Buffer Locked", "error");
    }
  };

  const iconMap: Record<string, any> = {
    follow: <div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M19 7.5v9m-4.5-4.5h9M3 13.5h9m-9-4.5h9m-9-4.5h9" /></svg></div>,
    broadcast: <div className="p-3 bg-rose-600 text-white rounded-2xl shadow-lg shadow-rose-200 animate-pulse"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></div>,
    system: <div className="p-3 bg-slate-900 text-white rounded-2xl"><ICONS.Admin /></div>,
    relay: <div className="p-3 bg-indigo-600 text-white rounded-2xl"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg></div>,
    message: <div className="p-3 bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-100"><ICONS.Messages /></div>
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-8 pb-24 max-w-5xl mx-auto">
      
      {/* Header & Meta Cluster */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-2">
        <div>
          <div className="flex items-center gap-3 mb-4">
             <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(79,70,229,0.6)]" />
             <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] font-mono">Neural_Comms_Sync</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-950 tracking-tighter uppercase italic leading-none">Notifications</h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-4 flex items-center gap-2">
            Local Buffer: <span className="text-indigo-600 font-black font-mono">{notifications.length} Nodes</span>
          </p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
           <button 
             onClick={handleSyncAll}
             disabled={isSyncing || notifications.filter(n => !n.isRead).length === 0}
             className="flex-1 md:flex-none px-8 py-4.5 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all active:scale-95 disabled:opacity-20 flex items-center justify-center gap-3"
           >
             {isSyncing ? 'SYNCHRONISING...' : 'MARK_ALL_READ'}
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>
           </button>
           <button 
             onClick={handlePurgeAll}
             disabled={notifications.length === 0}
             className="px-6 py-4.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all active:scale-95 disabled:opacity-50"
             title="Purge Signal Archive"
           >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
           </button>
        </div>
      </div>

      {/* Persistent Filter Bar */}
      <div className="sticky top-[calc(var(--header-h)-1rem)] z-[100] flex items-center gap-2 p-1.5 bg-white/80 backdrop-blur-3xl border border-slate-100 rounded-[2rem] shadow-xl mx-2">
         {(['all', 'pulses', 'system'] as SignalFilter[]).map(f => (
           <button
             key={f}
             onClick={() => setActiveFilter(f)}
             className={`flex-1 py-3.5 rounded-[1.4rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeFilter === f ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}
           >
             {f}_Signals
           </button>
         ))}
      </div>

      {/* Signal Stream */}
      <div className="grid grid-cols-1 gap-4 px-2">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map(notif => {
            const pulseConfig = PULSE_FREQUENCIES.find(f => f.id === notif.pulseFrequency);
            const isRead = notif.isRead;
            
            return (
              <div 
                key={notif.id} 
                onClick={() => handleItemClick(notif)}
                className={`group relative flex items-center gap-5 md:gap-8 p-6 md:p-10 rounded-[3rem] transition-all duration-500 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.12)] border border-transparent cursor-pointer overflow-hidden ${!isRead ? 'bg-white border-indigo-100 shadow-2xl ring-1 ring-indigo-50' : 'bg-slate-50/50 hover:bg-white hover:border-slate-200'}`}
              >
                {!isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-2 bg-indigo-600 animate-pulse" />
                )}

                <div className="relative shrink-0">
                  <div className={`p-1 rounded-[1.8rem] transition-transform duration-500 group-hover:scale-105 ${!isRead ? 'bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-lg' : 'bg-slate-200'}`}>
                    <img src={notif.fromUserAvatar} className="w-14 h-14 md:w-20 md:h-20 rounded-[1.6rem] object-cover border-2 border-white" alt="" />
                  </div>
                  {pulseConfig && (
                    <div className={`absolute -bottom-2 -right-2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white shadow-2xl flex items-center justify-center text-lg md:text-xl border border-slate-50 animate-bounce`}>
                      {pulseConfig.emoji}
                    </div>
                  )}
                  {!pulseConfig && !isRead && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 rounded-full border-2 border-white shadow-sm animate-pulse" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className={`font-black text-slate-950 text-sm md:text-lg uppercase italic tracking-tighter transition-colors ${!isRead ? 'text-indigo-900' : ''}`}>
                      {notif.fromUserName}
                    </h3>
                  </div>
                  <p className={`font-bold text-sm md:text-base leading-relaxed mb-4 ${!isRead ? 'text-slate-800' : 'text-slate-500'}`}>
                    {notif.text}
                  </p>
                  <div className="flex flex-wrap items-center gap-4">
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono bg-slate-100 px-3 py-1 rounded-lg">
                       {notif.timestamp?.toDate ? notif.timestamp.toDate().toLocaleTimeString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'BUFFERING...'}
                     </span>
                     {pulseConfig && (
                       <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-colors ${!isRead ? `${pulseConfig.color.replace('text', 'border')} ${pulseConfig.color.replace('text', 'bg-')}/10 ${pulseConfig.color}` : 'border-slate-200 text-slate-400'}`}>
                         {pulseConfig.id}_frequency_detected
                       </span>
                     )}
                     {notif.type === 'broadcast' && (
                       <span className="px-3 py-1 bg-rose-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest animate-pulse shadow-lg shadow-rose-100">
                         LIVE_SIGNAL_ACTIVE
                       </span>
                     )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-4">
                  <div className="hidden sm:flex opacity-30 group-hover:opacity-100 transition-all duration-500 scale-125">
                     {notif.type === 'like' && pulseConfig ? (
                       <div className={`p-4 rounded-3xl bg-white shadow-xl ${pulseConfig.color} border border-slate-50`}>
                         <span className="text-3xl">{pulseConfig.emoji}</span>
                       </div>
                     ) : (iconMap[notif.type] || iconMap.system)}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }}
                    className="p-5 md:p-6 bg-slate-100 text-rose-500 rounded-[1.5rem] hover:bg-rose-500 hover:text-white transition-all active:scale-90 opacity-0 group-hover:opacity-100 shadow-xl border border-white"
                    title="Terminate Signal Cluster"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={3.5} viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-56 text-center bg-white rounded-[4rem] border-precision shadow-sm flex flex-col items-center justify-center opacity-40 mx-2">
             <div className="w-28 h-28 bg-slate-50 rounded-[3rem] flex items-center justify-center mb-12 text-slate-300 shadow-inner group">
                <div className="group-hover:scale-125 transition-transform duration-700">
                  <ICONS.Bell />
                </div>
             </div>
             <div className="space-y-4">
               <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Grid_Silence</h2>
               <p className="text-[11px] font-black uppercase tracking-[0.6em] font-mono italic max-w-xs mx-auto">No Active Transmission Clusters Logged for {activeFilter.toUpperCase()}</p>
             </div>
          </div>
        )}
      </div>

      {/* Footer System Info */}
      <div className="mt-12 px-6 flex flex-col items-center gap-4 opacity-30">
        <div className="h-px w-32 bg-slate-200" />
        <p className="text-[9px] font-black text-slate-800 uppercase tracking-[0.8em] font-mono">End_Of_Archive</p>
      </div>

    </div>
  );
};