
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, ...props }) => {
  return (
    <div className="w-full space-y-3 group">
      {label && (
        <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] ml-1 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors">
          {label}
        </label>
      )}
      <div className="relative">
        <input 
          {...props}
          className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-[1.5rem] px-8 py-5 text-slate-900 dark:text-white text-lg placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 focus:bg-white dark:focus:bg-slate-800 transition-all font-bold shadow-sm dark:shadow-inner"
        />
        <div className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
};
