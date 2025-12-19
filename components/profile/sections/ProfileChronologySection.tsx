
import React from 'react';
import { User, Region } from '../../../types';

interface ProfileChronologySectionProps {
  userData: User;
  locale: Region;
}

export const ProfileChronologySection: React.FC<ProfileChronologySectionProps> = ({ userData, locale }) => {
  return (
    <div className="glass-panel rounded-[3rem] p-10 md:p-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex justify-between items-center mb-12 border-b border-slate-50 pb-8">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono flex items-center gap-3">
          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" /> System_Identity_Logs
        </h3>
        <p className="text-[9px] font-black text-slate-300 font-mono uppercase tracking-[0.3em]">Temporal_Ref: {locale.toUpperCase()}</p>
      </div>

      {userData.lifeEvents && userData.lifeEvents.length > 0 ? (
        <div className="space-y-8 relative before:absolute before:left-[43px] before:top-6 before:bottom-6 before:w-px before:bg-slate-100">
          {userData.lifeEvents.map((event) => (
            <div key={event.id} className="flex gap-12 items-start relative group/event">
              <div className="w-22 h-22 min-w-[88px] rounded-[2rem] bg-white border border-slate-100 shadow-xl flex items-center justify-center text-4xl z-10 group-hover/event:scale-105 transition-transform shadow-indigo-100/30 border-precision ring-1 ring-slate-50">
                {event.icon || '🌟'}
              </div>
              <div className="flex-1 pb-10 border-b border-slate-50 last:border-none group-last/event:pb-0">
                <p className="text-[11px] font-black text-indigo-500 uppercase tracking-widest font-mono mb-2">
                  [{event.date ? new Date(event.date).toLocaleDateString(locale, { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.') : '0000.00.00'}] PROTOCOL_EVENT_INIT
                </p>
                <h4 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter italic leading-tight group-hover/event:text-indigo-600 transition-colors uppercase">{event.title}</h4>
                <div className="mt-4 flex gap-3">
                   <span className="px-3 py-1 bg-slate-50 rounded-lg text-[8px] font-black uppercase text-slate-400 font-mono">Sync_Verified</span>
                   <span className="px-3 py-1 bg-emerald-50 rounded-lg text-[8px] font-black uppercase text-emerald-500 font-mono">Immutable_Log</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center">
           <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] font-mono italic">Timeline buffer is currently empty. Awaiting primary data sequence.</p>
        </div>
      )}
    </div>
  );
};
