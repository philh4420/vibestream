
import React from 'react';

interface BentoTileProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const BentoTile: React.FC<BentoTileProps> = ({ title, children, className = "", onClick }) => (
  <div 
    onClick={onClick}
    className={`glass-panel rounded-[2rem] p-6 flex flex-col justify-between transition-all duration-500 hover:shadow-2xl hover:border-indigo-500/30 group cursor-pointer ${className}`}
  >
    <div className="flex justify-between items-start mb-4">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono group-hover:text-indigo-400 transition-colors">
        {title}
      </span>
      <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-indigo-500 animate-pulse" />
    </div>
    <div className="flex-1">
      {children}
    </div>
  </div>
);
