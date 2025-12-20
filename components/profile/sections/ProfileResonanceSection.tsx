
import React from 'react';
import { User } from '../../../types';

interface ProfileResonanceSectionProps {
  userData: User;
}

export const ProfileResonanceSection: React.FC<ProfileResonanceSectionProps> = ({ userData }) => {
  const DataCluster = ({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) => (
    <div className={`bg-white border-precision rounded-[3.5rem] p-10 md:p-14 shadow-sm ${className}`}>
      <div className="flex justify-between items-center mb-10 border-b border-slate-50 pb-8">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono flex items-center gap-3">
          <span className="w-2 h-2 bg-indigo-500 rounded-full" /> {title}
        </h3>
        <div className="w-2 h-2 bg-slate-100 rounded-full" />
      </div>
      <div className="flex flex-wrap gap-4">{children}</div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 animate-in fade-in slide-in-from-bottom-6 duration-700 max-w-[2560px] mx-auto">
      
      {/* Capability Matrix */}
      <DataCluster title="Capability_Matrix">
        {userData.skills && userData.skills.length > 0 ? (
          userData.skills.map((skill) => (
            <span key={skill} className="px-6 py-3 bg-indigo-50 text-indigo-700 text-[11px] font-black uppercase tracking-widest rounded-2xl border border-indigo-100 shadow-sm hover:bg-indigo-100 transition-all cursor-default active:scale-95">
              {skill}
            </span>
          ))
        ) : <p className="text-[10px] font-black text-slate-300 uppercase italic font-mono">Matrix pending initialisation...</p>}
      </DataCluster>

      {/* Passions Grid */}
      <DataCluster title="Passions_Grid">
        {userData.hobbies && userData.hobbies.length > 0 ? (
          userData.hobbies.map((hobby) => (
            <span key={hobby} className="px-6 py-3 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl border border-white/10 shadow-lg hover:bg-indigo-600 transition-all cursor-default active:scale-95">
              {hobby}
            </span>
          ))
        ) : <p className="text-[10px] font-black text-slate-300 uppercase italic font-mono">Passions not yet encoded...</p>}
      </DataCluster>

      {/* Identity Mesh Tags */}
      <DataCluster title="Resonance_Mesh" className="md:col-span-2">
        {userData.tags && userData.tags.length > 0 ? (
          userData.tags.map((tag) => (
            <span key={tag} className="px-8 py-4 bg-white text-slate-900 text-[11px] font-black uppercase tracking-[0.35em] rounded-[1.8rem] border border-slate-100 shadow-sm hover:border-indigo-500/30 transition-all cursor-default font-mono active:scale-95">
              #{tag}
            </span>
          ))
        ) : <p className="text-[10px] font-black text-slate-300 uppercase italic font-mono">Mesh tags awaiting synchronization...</p>}
      </DataCluster>
    </div>
  );
};
