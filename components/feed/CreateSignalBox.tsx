
import React, { useRef } from 'react';
import { User } from '../../types';
import { ICONS } from '../../constants';

interface CreateSignalBoxProps {
  userData: User | null;
  onOpen: (initialAction?: 'media' | 'gif') => void;
  onFileSelect?: (file: File) => void;
}

export const CreateSignalBox: React.FC<CreateSignalBoxProps> = ({ userData, onOpen, onFileSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileSelect) {
      onFileSelect(file);
      e.target.value = '';
    }
  };

  return (
    <div className="bg-white border-precision rounded-[3rem] p-7 md:p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.06)] transition-all duration-500 group">
      <div className="flex items-center gap-6 mb-7">
        <div className="relative shrink-0">
          <img 
            src={userData?.avatarUrl} 
            className="w-12 h-12 md:w-16 md:h-16 rounded-[1.4rem] object-cover shadow-md ring-1 ring-slate-100 transition-transform duration-500 group-hover:rotate-3" 
            alt="My Node" 
          />
          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full animate-pulse shadow-sm" />
        </div>
        
        <button 
          onClick={() => onOpen()}
          className="flex-1 bg-slate-50/80 border border-slate-100 hover:bg-white hover:border-indigo-100 text-left px-8 py-4.5 rounded-[1.8rem] transition-all duration-300 group/input touch-active flex items-center justify-between"
        >
          <span className="text-slate-400 font-bold text-sm md:text-lg group-hover/input:text-slate-700 italic tracking-tight">
            Initiate a new signal, {userData?.displayName.split(' ')[0]}...
          </span>
          <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-300 group-hover/input:text-indigo-500 transition-colors">
            <ICONS.Create />
          </div>
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 border-t border-slate-50 pt-6">
        <button 
          onClick={() => fileInputRef.current?.click()} 
          className="flex flex-col items-center justify-center gap-2 py-3 hover:bg-indigo-50/50 rounded-2xl transition-all duration-300 text-slate-500 group/btn touch-active"
        >
          <div className="text-indigo-500 group-hover/btn:scale-125 transition-transform duration-500 scale-90 md:scale-100">
            <ICONS.Create />
          </div>
          <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] font-mono leading-none">
            Artifact
          </span>
        </button>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*,video/*,.heic,.heif,.avif,.webp" 
          onChange={handleFileChange} 
        />

        {[
          { icon: <span className="text-sm font-black font-mono">GIF</span>, label: 'GIF_Fragment', color: 'text-amber-500', bg: 'hover:bg-amber-50/50', action: () => onOpen('gif') },
          { icon: <ICONS.Streams />, label: 'Live_Stream', color: 'text-rose-500', bg: 'hover:bg-rose-50/50', action: () => onOpen() },
          { icon: <ICONS.Explore />, label: 'Deep_Sync', color: 'text-emerald-500', bg: 'hover:bg-emerald-50/50', action: () => onOpen() }
        ].map((action, i) => (
          <button 
            key={i}
            onClick={action.action} 
            className={`flex flex-col items-center justify-center gap-2 py-3 ${action.bg} rounded-2xl transition-all duration-300 text-slate-500 group/btn touch-active`}
          >
            <div className={`${action.color} group-hover/btn:scale-125 transition-transform duration-500 scale-90 md:scale-100`}>
              {action.icon}
            </div>
            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] font-mono leading-none">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
