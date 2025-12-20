
import React from 'react';

export const CookiesPage: React.FC = () => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-10 pb-20">
      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic">Cookie_Fragments</h1>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Local Storage Audit • Buffer Node 2.6</p>
      </div>

      <div className="bg-white border-precision rounded-[3rem] p-10 md:p-14 shadow-sm space-y-10">
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Grid_Persistence_Tools</h2>
          <p className="text-slate-600 font-medium leading-relaxed">
            VibeStream uses local storage artifacts (fragments) to maintain your neural session. Without these, every transmission would require a full identity re-verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              id: "SESSION_KEY",
              purpose: "Maintains active neural handshake.",
              type: "Essential"
            },
            {
              id: "ROUTE_KEY",
              purpose: "Persists your current viewport location.",
              type: "Functional"
            },
            {
              id: "TIMESTAMP_KEY",
              purpose: "Tracks uplink synchronization timing.",
              type: "Operational"
            },
            {
              id: "REGION_REF",
              purpose: "Configures local node dialect (en-GB).",
              type: "Localization"
            }
          ].map(cookie => (
            <div key={cookie.id} className="p-6 bg-slate-50 border border-slate-100 rounded-2xl">
              <div className="flex justify-between items-center mb-3">
                <code className="text-[10px] font-black text-indigo-600 font-mono">{cookie.id}</code>
                <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">{cookie.type}</span>
              </div>
              <p className="text-xs text-slate-500 font-bold leading-relaxed">{cookie.purpose}</p>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-slate-50">
          <p className="text-sm text-slate-400 font-medium italic">
            Note: Disabling these fragments will disrupt your ability to established a stable uplink with the VibeStream grid.
          </p>
        </div>
      </div>
    </div>
  );
};
