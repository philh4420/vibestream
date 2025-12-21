
import React from 'react';
import { User } from '../../types';
import { ICONS } from '../../constants';

interface CreateSignalBoxProps {
  userData: User | null;
  onOpen: () => void;
}

export const CreateSignalBox: React.FC<CreateSignalBoxProps> = ({ userData, onOpen }) => {
  return (
    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-5 md:p-6 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-4 mb-5">
        <img 
          src={userData?.avatarUrl} 
          className="w-11 h-11 md:w-12 md:h-12 rounded-2xl object-cover shadow-sm ring-1 ring-slate-50" 
          alt="" 
        />
        <button 
          onClick={onOpen}
          className="flex-1 bg-slate-50 hover:bg-slate-100 text-left px-6 py-3.5 rounded-2xl transition-all group touch-active"
        >
          <span className="text-slate-400 font-bold text-sm md:text-base group-hover:text-slate-600">
            What's the signal, {userData?.displayName.split(' ')[0]}?
          </span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-slate-50 pt-4">
        <button onClick={onOpen} className="flex items-center justify-center gap-2.5 py-3 hover:bg-slate-50 rounded-xl transition-all text-slate-500 group touch-active">
          <div className="text-indigo-500 group-hover:scale-110 transition-transform"><ICONS.Create /></div>
          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Visual</span>
        </button>
        <button onClick={onOpen} className="flex items-center justify-center gap-2.5 py-3 hover:bg-slate-50 rounded-xl transition-all text-slate-500 group touch-active">
          <div className="text-rose-500 group-hover:scale-110 transition-transform"><ICONS.Streams /></div>
          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Stream</span>
        </button>
        <button onClick={onOpen} className="flex items-center justify-center gap-2.5 py-3 hover:bg-slate-50 rounded-xl transition-all text-slate-500 group touch-active">
          <div className="text-emerald-500 group-hover:scale-110 transition-transform"><ICONS.Explore /></div>
          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Activity</span>
        </button>
      </div>
    </div>
  );
};
