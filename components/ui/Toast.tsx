
import React, { useEffect } from 'react';
import { ToastMessage } from '../../types';

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    // Standard VibeStream 2026 Dismissal Protocol (3.5s)
    const timer = setTimeout(() => onClose(toast.id), 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const typeStyles = {
    success: 'bg-white/90 dark:bg-slate-900/95 border-emerald-500/20 dark:border-emerald-500/40 text-slate-900 dark:text-white shadow-[0_8px_30px_-5px_rgba(16,185,129,0.15)] dark:shadow-emerald-500/10',
    error: 'bg-white/90 dark:bg-rose-950/95 border-rose-500/20 dark:border-rose-500/40 text-slate-900 dark:text-rose-50 shadow-[0_8px_30px_-5px_rgba(244,63,94,0.15)] dark:shadow-rose-500/10',
    info: 'bg-white/90 dark:bg-indigo-950/95 border-indigo-500/20 dark:border-indigo-400/40 text-slate-900 dark:text-white shadow-[0_8px_30px_-5px_rgba(99,102,241,0.15)] dark:shadow-indigo-500/10'
  };

  const StatusLight = () => {
    if (toast.type === 'success') return <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]" />;
    if (toast.type === 'error') return <div className="w-2.5 h-2.5 bg-rose-500 rounded-full shadow-[0_0_12px_rgba(244,63,94,0.8)]" />;
    return <div className="w-2.5 h-2.5 bg-indigo-500 dark:bg-indigo-400 rounded-full shadow-[0_0_12px_rgba(129,140,248,0.8)]" />;
  };

  return (
    <div className={`flex items-center gap-5 px-6 py-4 rounded-2xl border-[0.5px] backdrop-blur-3xl animate-in slide-in-from-top-10 fade-in duration-500 pointer-events-auto ${typeStyles[toast.type]}`}>
      <StatusLight />
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] font-mono leading-none mb-1 opacity-50 text-slate-500 dark:text-slate-400">
          [{new Date().toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
        </span>
        <span className="text-xs font-bold tracking-tight">
          {toast.message}
        </span>
      </div>
      <button 
        onClick={() => onClose(toast.id)} 
        className="ml-4 p-2 opacity-30 hover:opacity-100 transition-all rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 active:scale-90"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
};
