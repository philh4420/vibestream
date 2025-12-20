
import React from 'react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-10 pb-20">
      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic">Privacy_Protocol</h1>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Last Synchronized: February 2026 • GB-NOD-01</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {[
          {
            title: "01_Data_Interception",
            content: "VibeStream intercepts neural data signals required for identity synchronization. This includes your network ID, temporal origin, and geospatial node coordinates. We prioritize your anonymity across the grid."
          },
          {
            title: "02_Neural_Encryption",
            content: "All transmissions published via the Neural Uplink are encrypted using Citadel-grade protocols. Your private comms remain inaccessible to non-participating nodes unless reclassified by central command."
          },
          {
            title: "03_Third_Party_Resonance",
            content: "We do not leak your bio-signature to external advertising grids. Any third-party integration (like Cloudinary for visuals) is strictly governed by secure handshakes to ensure asset integrity."
          },
          {
            title: "04_Node_Retention",
            content: "Upon identity decommissioning (account deletion), all associated data clusters are purged from the primary grid within 7 temporal cycles, unless legally intercepted by safety protocols."
          }
        ].map((section, idx) => (
          <div key={idx} className="bg-white border-precision rounded-[2.5rem] p-8 md:p-12 shadow-sm hover:shadow-md transition-all group">
            <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase italic mb-6 flex items-center gap-4">
              <span className="w-2 h-2 bg-indigo-600 rounded-full group-hover:animate-ping" />
              {section.title}
            </h3>
            <p className="text-slate-600 font-medium leading-relaxed text-sm md:text-base">
              {section.content}
            </p>
          </div>
        ))}
      </div>

      <div className="p-8 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full" />
        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 font-mono">Citadel_Verification</h4>
        <p className="text-xs text-slate-400 font-medium">For inquiries regarding your neural footprint, transmit a signal to: privacy@vibestream.co.uk</p>
      </div>
    </div>
  );
};
