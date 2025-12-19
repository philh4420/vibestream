
import React, { useEffect } from 'react';
import { ToastMessage } from '../types';

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  const bgStyles = {
    success: 'bg-emerald-500',
    error: 'bg-rose-500',
    info: 'bg-slate-800'
  };

  return (
    <div className={`${bgStyles[toast.type]} text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300`}>
      <span className="text-sm font-medium">{toast.message}</span>
      <button onClick={() => onClose(toast.id)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};
