import React from 'react';
import { ICONS } from '../../constants';

export const TermsPage: React.FC = () => {
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

      {/* Terms Stack */}
      <div className="space-y-4">
        {[
          {
            title: "Identity_Verification",
            status: "MANDATORY",
            content: "Users must maintain a valid biometric hash (verified email). Impersonation of Citadel Admins, System AI, or other nodes is a Class A violation."
          },
          {
            title: "Signal_Decency",
            status: "ENFORCED",
            content: "Broadcasts containing hate speech, illicit contraband, or neural hazards (malware) will be intercepted by the automated moderation grid. Repeat offenders face grid exile."
          },
          {
            title: "Intellectual_Property",
            status: "SHARED",
            content: "You retain full ownership of your transmitted artifacts. However, by broadcasting, you grant VibeStream a non-exclusive license to relay your signal across the global mesh."
          },
          {
            title: "System_Availability",
            status: "VARIABLE",
            content: "The grid may undergo maintenance cycles during low-traffic temporal windows. We do not guarantee 100% uptime during solar flare events or infrastructure upgrades."
          }
        ].map((term, idx) => (
          <div key={idx} className="group bg-white border border-slate-100 rounded-[2.5rem] p-8 hover:border-indigo-200 transition-all duration-300 flex flex-col md:flex-row gap-6 md:items-start">
             <div className="shrink-0 md:w-48 pt-1">
                <span className={`inline-block px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest font-mono ${term.status === 'MANDATORY' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
                  {term.status}
                </span>
             </div>
             <div>
                <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tight mb-2 group-hover:text-indigo-600 transition-colors">
                  {term.title}
                </h3>
                <p className="text-sm font-medium text-slate-600 leading-relaxed">
                  {term.content}
                </p>
             </div>
          </div>
        ))}
      </div>

      {/* Acceptance Footer */}
      <div className="mt-10 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200 text-center">
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] font-mono mb-4">
           Digital Signature Required
         </p>
         <button className="px-10 py-4 bg-slate-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-indigo-600 transition-all shadow-lg active:scale-95 cursor-default opacity-50">
           Term_Accepted
         </button>
      </div>
    </div>
  );
};