import React, { useEffect } from 'react';
import { ToastMessage } from '../../types';

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const typeStyles = {
    success: 'bg-slate-900 border-emerald-500/50 text-white',
    error: 'bg-rose-950 border-rose-500/50 text-rose-50',
    info: 'bg-indigo-950 border-indigo-400/50 text-white'
  };

  const StatusLight = () => {
    if (toast.type === 'success') return <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />;
    if (toast.type === 'error') return <div className="w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.5)]" />;
    return <div className="w-2 h-2 bg-indigo-400 rounded-full shadow-[0_0_8px_rgba(129,140,248,0.5)]" />;
  };

  return (
    <div className={`flex items-center gap-4 px-5 py-3 rounded-xl border-precision shadow-2xl route-transition ${typeStyles[toast.type]}`}>
      <StatusLight />
      <span className="text-[10px] font-medium uppercase tracking-wider font-mono">
        <span className="opacity-40 mr-2">[{new Date().toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' })}]</span>
        {toast.message}
      </span>
      <button onClick={() => onClose(toast.id)} className="ml-3 p-1 opacity-40 hover:opacity-100 transition-opacity rounded-md hover:bg-white/10">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
};