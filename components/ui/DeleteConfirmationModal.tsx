
import React from 'react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = "CONFIRM_PURGE"
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onCancel}></div>
      
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3.5rem] p-10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-500">
        {/* Kinetic Warning Header */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-rose-500" />
        
        <div className="text-center space-y-6 mb-10">
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-sm relative border border-rose-100 dark:border-rose-900/50">
            <div className="absolute inset-0 rounded-[2rem] bg-rose-500 animate-ping opacity-10" />
            <svg className="w-10 h-10 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.34c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none mb-3">{title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed px-4 uppercase tracking-tight">
              {description}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={(e) => { e.stopPropagation(); onConfirm(); }}
            className="w-full py-6 bg-rose-600 text-white rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.4em] shadow-2xl shadow-rose-500/30 hover:bg-rose-700 transition-all active:scale-95 italic"
          >
            {confirmText}
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onCancel(); }}
            className="w-full py-5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.4em] hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95 italic border border-slate-100 dark:border-slate-700"
          >
            ABORT_ACTION
          </button>
        </div>

        {/* Trace ID */}
        <div className="mt-8 text-center opacity-30">
          <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.5em] font-mono italic">TERMINATION_VERIFICATION_REQUIRED</p>
        </div>
      </div>
    </div>
  );
};
