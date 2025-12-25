
import React from 'react';
import { ICONS } from '../../constants';

interface TermsPageProps {
  onAccept?: () => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onAccept }) => {
  return (
    <div className="w-full max-w-[2400px] mx-auto pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Hero Header */}
      <div className="relative rounded-[3rem] bg-indigo-950 p-10 md:p-14 text-white shadow-2xl border border-white/10 overflow-hidden mb-10 group">
         <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-500/20 blur-[120px] rounded-full -translate-x-1/4 -translate-y-1/4 group-hover:bg-indigo-400/30 transition-colors duration-1000" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />

         <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 mb-6">
               <ICONS.Admin />
               <span className="text-[9px] font-black text-indigo-300 uppercase tracking-[0.3em] font-mono">Directive_Alpha</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none text-white mb-6">
              Terms_Of<br/><span className="text-indigo-400">Uplink</span>
            </h1>
            <p className="text-xs md:text-sm font-medium text-indigo-200/80 leading-relaxed max-w-2xl border-l-2 border-indigo-500 pl-6">
              By establishing a neural handshake with VibeStream, you agree to the following operational parameters. Violation may result in immediate node suspension or permanent IP banishment.
            </p>
         </div>
      </div>

      {/* Terms Stack (Static) */}
      <div className="space-y-4">
        
        {/* Term 1 */}
        <div className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300 flex flex-col md:flex-row gap-6 md:items-start">
             <div className="shrink-0 md:w-48 pt-1">
                <span className="inline-block px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest font-mono bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                  MANDATORY
                </span>
             </div>
             <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Identity_Verification
                </h3>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                  Users must maintain a valid biometric hash (verified email). Impersonation of Citadel Admins, System AI, or other nodes is a Class A violation.
                </p>
             </div>
        </div>

        {/* Term 2 */}
        <div className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300 flex flex-col md:flex-row gap-6 md:items-start">
             <div className="shrink-0 md:w-48 pt-1">
                <span className="inline-block px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest font-mono bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                  ENFORCED
                </span>
             </div>
             <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Signal_Decency
                </h3>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                  Broadcasts containing hate speech, illicit contraband, or neural hazards (malware) will be intercepted by the automated moderation grid. Repeat offenders face grid exile.
                </p>
             </div>
        </div>

        {/* Term 3 */}
        <div className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300 flex flex-col md:flex-row gap-6 md:items-start">
             <div className="shrink-0 md:w-48 pt-1">
                <span className="inline-block px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest font-mono bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                  SHARED
                </span>
             </div>
             <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Intellectual_Property
                </h3>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                  You retain full ownership of your transmitted artifacts. However, by broadcasting, you grant VibeStream a non-exclusive license to relay your signal across the global mesh.
                </p>
             </div>
        </div>

        {/* Term 4 */}
        <div className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300 flex flex-col md:flex-row gap-6 md:items-start">
             <div className="shrink-0 md:w-48 pt-1">
                <span className="inline-block px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest font-mono bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                  VARIABLE
                </span>
             </div>
             <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  System_Availability
                </h3>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                  The grid may undergo maintenance cycles during low-traffic temporal windows. We do not guarantee 100% uptime during solar flare events or infrastructure upgrades.
                </p>
             </div>
        </div>

      </div>

      {/* Acceptance Footer (Only visible if onAccept is provided) */}
      {onAccept && (
        <div className="mt-10 p-8 bg-slate-900 dark:bg-slate-800 rounded-[2.5rem] border border-slate-800 dark:border-slate-700 text-center shadow-2xl animate-in slide-in-from-bottom-6">
           <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] font-mono mb-6">
             Digital Signature Required
           </p>
           <button 
             onClick={onAccept}
             className="px-12 py-5 bg-white text-slate-950 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-emerald-400 hover:text-white transition-all shadow-xl hover:shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-3 mx-auto"
           >
             <ICONS.Verified />
             ACCEPT_PROTOCOLS
           </button>
        </div>
      )}
    </div>
  );
};
