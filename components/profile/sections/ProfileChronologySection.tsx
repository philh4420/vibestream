
import React from 'react';
import { User, Region } from '../../../types';

interface ProfileChronologySectionProps {
  userData: User;
  locale: Region;
}

export const ProfileChronologySection: React.FC<ProfileChronologySectionProps> = ({ userData, locale }) => {
  return (
    <div className="bg-white border-precision rounded-[3.5rem] p-10 md:p-14 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-[2560px] mx-auto shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-14 border-b border-slate-50 pb-10 gap-6">
        <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono flex items-center gap-4">
          <span className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(79,70,229,0.5)]" /> System_Identity_Logs
        </h3>
        <p className="text-[10px] font-black text-slate-300 font-mono uppercase tracking-[0.3em] bg-slate-50 px-4 py-2 rounded-lg">Temporal_Ref: {locale.toUpperCase()} • GB_SYNC_OK</p>
      </div>

      {userData.lifeEvents && userData.lifeEvents.length > 0 ? (
        <div className="space-y-12 relative before:absolute before:left-[47px] before:top-8 before:bottom-8 before:w-px before:bg-slate-100">
          {userData.lifeEvents.map((event) => (
            <div key={event.id} className="flex gap-12 md:gap-16 items-start relative group/event">
              <div className="w-24 h-24 min-w-[96px] md:w-28 md:h-28 md:min-w-[112px] rounded-[2.5rem] bg-white border border-slate-100 shadow-2xl flex items-center justify-center text-4xl md:text-5xl z-10 group-hover/event:scale-110 transition-transform shadow-indigo-100/40 ring-4 ring-slate-50">
                {event.icon || '🌟'}
              </div>
              <div className="flex-1 pb-12 border-b border-slate-50 last:border-none group-last/event:pb-0">
                <div className="flex flex-wrap items-center gap-4 mb-3">
                  <p className="text-[11px] font-black text-indigo-500 uppercase tracking-widest font-mono bg-indigo-50 px-3 py-1 rounded-lg">
                    [{event.date ? new Date(event.date).toLocaleDateString(locale, { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.') : '0000.00.00'}]
                  </p>
                  <span className="px-3 py-1 bg-slate-50 rounded-lg text-[8px] font-black uppercase text-slate-400 font-mono border border-slate-100">PROTOCOL_EVENT_INIT</span>
                </div>
                <h4 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter italic leading-tight group-hover/event:text-indigo-600 transition-colors uppercase">{event.title}</h4>
                <div className="mt-6 flex flex-wrap gap-4">
                   <span className="px-5 py-2 bg-slate-950 text-white rounded-xl text-[9px] font-black uppercase tracking-widest font-mono shadow-xl">Hash: {event.id.slice(0, 8).toUpperCase()}</span>
                   <span className="px-5 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest font-mono border border-emerald-100">Verified_Immutable</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-32 text-center bg-slate-50/30 rounded-[3rem] border-2 border-dashed border-slate-100">
           <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em] font-mono italic">Timeline buffer is currently empty. Awaiting primary data sequence injection.</p>
        </div>
      )}
    </div>
  );
};
