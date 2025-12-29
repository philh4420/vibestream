
import React from 'react';
import { AppNotification, AppRoute } from '../../types';
import { ICONS } from '../../constants';

interface NotificationItemProps {
  notification: AppNotification;
  onDelete: (id: string) => void;
  onMarkRead: (id: string) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onDelete, onMarkRead }) => {
  const isPriority = notification.metadata?.isPriority || notification.type === 'system';
  
  const handleNavigate = () => {
    if (!notification.isRead) onMarkRead(notification.id);

    if (notification.type === 'follow') {
        window.dispatchEvent(new CustomEvent('vibe-navigate', { 
            detail: { route: AppRoute.PROFILE, userId: notification.fromUserId } 
        }));
    } else if (notification.type === 'message') {
        window.dispatchEvent(new CustomEvent('vibe-navigate', { detail: { route: AppRoute.MESSAGES } }));
    } else if (notification.targetId) {
        // Broad search for post navigation via dispatch
        window.dispatchEvent(new CustomEvent('vibe-navigate', { 
            detail: { route: AppRoute.FEED } 
        }));
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'like': return <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>;
      case 'comment': return <ICONS.Messages />;
      case 'follow': return <ICONS.Clusters />;
      case 'broadcast': return <div className="animate-pulse"><ICONS.Streams /></div>;
      case 'system': return <ICONS.Admin />;
      default: return <ICONS.Bell />;
    }
  };

  const getActionColor = () => {
    if (notification.type === 'system') return 'bg-amber-500';
    if (notification.type === 'broadcast') return 'bg-rose-600';
    return 'bg-indigo-600';
  };

  return (
    <div 
        className={`group relative flex items-center gap-5 p-5 md:p-6 rounded-[2.5rem] border transition-all duration-500 overflow-hidden ${
            notification.isRead 
                ? 'bg-white/40 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800' 
                : 'bg-white dark:bg-slate-900 border-indigo-100 dark:border-indigo-900/50 shadow-premium'
        }`}
    >
      {/* Read Status Line */}
      <div className={`absolute top-0 left-0 w-1.5 h-full transition-all duration-500 ${notification.isRead ? 'bg-transparent' : getActionColor()}`} />
      
      {/* Background Glow for unread priority items */}
      {!notification.isRead && isPriority && (
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full" />
      )}

      {/* Avatar Node */}
      <div 
        onClick={(e) => { e.stopPropagation(); handleNavigate(); }}
        className="relative shrink-0 cursor-pointer"
      >
        <div className={`p-0.5 rounded-[1.2rem] bg-slate-100 dark:bg-slate-800 shadow-sm ${!notification.isRead ? 'ring-2 ring-indigo-500/20' : ''}`}>
            <img src={notification.fromUserAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=SYSTEM`} className="w-12 h-12 md:w-14 md:h-14 rounded-[1.1rem] object-cover" alt="" />
        </div>
        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg shadow-lg flex items-center justify-center text-white border-2 border-white dark:border-slate-900 ${getActionColor()}`}>
            <div className="scale-50">{getIcon()}</div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
                {notification.type.replace('_', ' ')} • {notification.timestamp?.toDate ? notification.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : 'JUST_NOW'}
            </span>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {!notification.isRead && (
                    <button onClick={() => onMarkRead(notification.id)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors" title="Mark as Synchronised">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    </button>
                )}
                <button onClick={() => onDelete(notification.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors" title="Purge Log">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        </div>
        
        <p className={`text-sm md:text-base leading-tight ${notification.isRead ? 'text-slate-500 dark:text-slate-400 font-medium' : 'text-slate-900 dark:text-white font-bold'}`}>
            <span className="font-black italic uppercase mr-1.5">{notification.fromUserName}</span> 
            {notification.text}
        </p>

        {/* Dynamic Action Protocol */}
        <div className="pt-3 flex flex-wrap gap-3">
            <button 
                onClick={handleNavigate}
                className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 ${
                    !notification.isRead 
                        ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-900' 
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                }`}
            >
                {notification.metadata?.actionLabel || 'EXECUTE_LINK'}
            </button>
            {notification.type === 'follow' && !notification.isRead && (
                <button className="px-5 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-100 transition-all">
                    Link_Back
                </button>
            )}
        </div>
      </div>

      {/* Rich Metadata Peek */}
      {notification.metadata?.thumbnailUrl && (
          <div className="hidden sm:block shrink-0 ml-4">
              <div className="relative w-20 h-20 rounded-[1.4rem] overflow-hidden border-2 border-white dark:border-slate-800 shadow-md group-hover:scale-105 transition-transform duration-500">
                  <img src={notification.metadata.thumbnailUrl} className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100" />
              </div>
          </div>
      )}
    </div>
  );
};
