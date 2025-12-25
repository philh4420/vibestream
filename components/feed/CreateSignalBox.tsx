
import React from 'react';
import { User } from '../../types';
import { ICONS } from '../../constants';

interface CreateSignalBoxProps {
  userData: User | null;
  onOpen: (initialAction?: 'media' | 'gif') => void;
  onFileSelect?: (file: File) => void;
}

export const CreateSignalBox: React.FC<CreateSignalBoxProps> = ({ userData, onOpen }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border-precision rounded-[3rem] p-7 md:p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.06)] transition-all duration-500 group">
      <div className="flex items-center gap-6">
        <div className="relative shrink-0">
          <img 
            src={userData?.avatarUrl} 
            className="w-12 h-12 md:w-16 md:h-16 rounded-[1.4rem] object-cover shadow-md ring-1 ring-slate-100 dark:ring-slate-800 transition-transform duration-500 group-hover:rotate-3" 
            alt="My Node" 
          />
          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse shadow-sm" />
        </div>
        
        <button 
          onClick={() => onOpen()}
          className="flex-1 bg-slate-50/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 hover:border-indigo-100 dark:hover:border-indigo-900/50 text-left px-8 py-4.5 rounded-[1.8rem] transition-all duration-300 group/input touch-active flex items-center justify-between"
        >
          <span className="text-slate-400 dark:text-slate-500 font-bold text-sm md:text-lg group-hover/input:text-slate-700 dark:group-hover/input:text-slate-300 italic tracking-tight">
            Initiate a new signal, {userData?.displayName.split(' ')[0]}...
          </span>
          <div className="p-2 bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-slate-100 dark:border-slate-600 text-slate-300 dark:text-slate-500 group-hover/input:text-indigo-500 dark:group-hover/input:text-indigo-400 transition-colors">
            <ICONS.Create />
          </div>
        </button>
      </div>
    </div>
  );
};
