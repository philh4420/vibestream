
import React from 'react';

export const TermsPage: React.FC = () => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-10 pb-20">
      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic">Terms_of_Uplink</h1>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Operational Directive v2.6 • Effective 2026.02.01</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {[
          {
            title: "Protocol_Entry",
            content: "By establishing a connection to the VibeStream grid, you agree to abide by the Citadel Command's safety directives. Access is a privilege, not a hardcoded right."
          },
          {
            title: "Identity_Responsibility",
            content: "Nodes are solely responsible for the signals they broadcast. Mimicking Citadel Admins or injecting malicious code into the Neural Hub will result in immediate suspension."
          },
          {
            title: "Uplink_Usage",
            content: "Transmissions must not contain prohibited material as defined by global safety standards. Central Hub monitors all public pulses for compliance with the 2026 Decency Accord."
          },
          {
            title: "Grid_Maintenance",
            content: "Infrastructure maintenance may occur at any moment without prior signal. During maintenance, your neural session may be intercepted by the synchronization overlay."
          }
        ].map((section, idx) => (
          <div key={idx} className="bg-white border-precision rounded-[2.5rem] p-8 md:p-12 shadow-sm hover:shadow-md transition-all group">
            <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase italic mb-6 flex items-center gap-4">
              <span className="w-2 h-2 bg-emerald-600 rounded-full group-hover:animate-pulse" />
              {section.title}
            </h3>
            <p className="text-slate-600 font-medium leading-relaxed text-sm md:text-base">
              {section.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
