
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
    error: 'bg-rose-50 border-rose-200 text-rose-800',
    info: 'bg-indigo-900 border-indigo-400/50 text-white'
  };

  const Icon = () => {
    if (toast.type === 'success') return <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />;
    if (toast.type === 'error') return <div className="w-2 h-2 bg-rose-500 rounded-full" />;
    return <div className="w-2 h-2 bg-indigo-400 rounded-full" />;
  };

  return (
    <div className={`flex items-center gap-4 px-5 py-3 rounded-xl border-precision shadow-2xl route-transition ${typeStyles[toast.type]}`}>
      <Icon />
      <span className="text-[11px] font-bold uppercase tracking-wider">{toast.message}</span>
      <button onClick={() => onClose(toast.id)} className="ml-4 opacity-50 hover:opacity-100">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
};
