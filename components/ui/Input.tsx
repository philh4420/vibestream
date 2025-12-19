
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, ...props }) => {
  return (
    <div className="w-full space-y-3 group">
      {label && (
        <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1 group-focus-within:text-indigo-400 transition-colors">
          {label}
        </label>
      )}
      <div className="relative">
        <input 
          {...props}
          className="w-full bg-white/[0.04] border border-white/10 rounded-[1.5rem] px-8 py-5 text-white text-lg placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all font-semibold shadow-inner"
        />
        <div className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-br from-white/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
};
