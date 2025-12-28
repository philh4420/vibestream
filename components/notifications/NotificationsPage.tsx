
import React, { useState, useMemo, useEffect } from 'react';
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

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ notifications, onDelete, onMarkRead, addToast, locale, userData }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'pulses' | 'system'>('all');
  const [showPurgeModal, setShowPurgeModal] = useState(false);

  const filtered = useMemo(() => {
    if (activeFilter === 'pulses') return notifications.filter(n => ['like', 'relay', 'follow'].includes(n.type));
    if (activeFilter === 'system') return notifications.filter(n => ['system', 'broadcast'].includes(n.type));
    return notifications;
  }, [notifications, activeFilter]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const executePurgeAll = async () => {
    if (!db) return;
    const batch = writeBatch(db);
    notifications.forEach(n => batch.delete(doc(db, 'notifications', n.id)));
    try { await batch.commit(); addToast("Archive Purged", "success"); } catch (e) { addToast("Purge Failed", "error"); }
    setShowPurgeModal(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto pb-32 animate-in fade-in duration-700 space-y-8">
      <div className="flex justify-between items-end px-4 md:px-0 pt-4">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <div className={`w-1.5 h-1.5 rounded-full ${unreadCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">STATUS: {unreadCount}_NEW</span>
           </div>
           <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter italic leading-none">Signal_Log</h1>
        </div>
        <div className="flex gap-3">
           <button onClick={onMarkRead} className="px-6 py-3 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">MARK_READ</button>
           <button onClick={() => setShowPurgeModal(true)} className="w-12 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 rounded-xl flex items-center justify-center transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
        </div>
      </div>

      <div className="space-y-3 px-4 md:px-0">
        {filtered.map(notif => {
          // Fallback logic for borders in notifications
          // In a real app, fromUserCosmetics would be in the notification doc. 
          // For now, we apply a standard border or fetch from a global user map if possible.
          return (
            <div key={notif.id} className={`group relative flex items-center gap-4 p-4 rounded-[1.8rem] border transition-all ${notif.isRead ? 'bg-[#fcfcfd] dark:bg-slate-900/40 border-transparent' : 'bg-white dark:bg-slate-900 border-indigo-100 dark:border-indigo-900 shadow-md'}`}>
              <div className="relative shrink-0 w-11 h-11">
                 <img src={notif.fromUserAvatar} className="w-full h-full rounded-[1.1rem] object-cover border border-slate-100 dark:border-slate-800" alt="" />
                 <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-1 rounded-md text-[8px] shadow-lg"><ICONS.Bell /></div>
              </div>
              <div className="flex-1 min-w-0">
                 <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight"><span className="font-black italic uppercase mr-1">{notif.fromUserName}</span> {notif.text}</p>
                 <p className="text-[8px] font-mono text-slate-400 mt-1 uppercase">Received: {notif.timestamp?.toDate ? notif.timestamp.toDate().toLocaleTimeString() : 'NOW'}</p>
              </div>
              <button onClick={() => onDelete(notif.id)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
          );
        })}
      </div>
      <DeleteConfirmationModal isOpen={showPurgeModal} title="PURGE_LOG" description="Delete all signals?" onConfirm={executePurgeAll} onCancel={() => setShowPurgeModal(false)} />
    </div>
  );
};
