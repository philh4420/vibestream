
import React from 'react';
import { User, Region } from '../../types';
import { ICONS } from '../../constants';

interface ProfileAboutProps {
  userData: User;
  locale: Region;
}

export const ProfileAbout: React.FC<ProfileAboutProps> = ({ userData, locale }) => {
  const formattedDob = userData.dob ? new Date(userData.dob).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) : 'Unknown Date';

  const InfoRow = ({ label, value, icon: Icon }: { label: string, value: string | React.ReactNode, icon?: any }) => (
    <div className="flex items-center gap-4 group/row">
      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover/row:bg-indigo-50 group-hover/row:text-indigo-600 transition-all border-precision">
        {Icon ? <Icon /> : <div className="w-4 h-4 rounded-full border-2 border-current opacity-30" />}
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] font-mono leading-none mb-1">{label}</p>
        <p className="text-sm font-bold text-slate-800 tracking-tight">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Bio Cluster */}
      <div className="lg:col-span-2 glass-panel rounded-[2.5rem] p-8 md:p-10">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Neural_Bio</h3>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <p className="text-lg md:text-xl font-medium text-slate-700 leading-relaxed italic mb-8">
          "{userData.bio || 'Node has not yet established a bio signature.'}"
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
           <div className="space-y-6">
              <InfoRow label="Occupation" value={userData.occupation || 'Digital Architect'} />
              <InfoRow label="Education" value={userData.education || 'Neural Institute of Design'} />
              <InfoRow label="Location" value={userData.location} icon={ICONS.Globe} />
           </div>
           <div className="space-y-6">
              <InfoRow label="Origin Date" value={formattedDob} />
              <InfoRow label="Biometric ID" value={userData.pronouns || 'Not Disclosed'} />
              <InfoRow label="Encoded As" value={userData.relationshipStatus || 'Independent'} />
           </div>
        </div>
      </div>

      {/* Tags Cluster */}
      <div className="glass-panel rounded-[2.5rem] p-8 flex flex-col justify-between">
        <div>
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mb-8">Identity_Mesh</h3>
          <div className="flex flex-wrap gap-2">
            {(userData.tags || ['Explorer', 'Pioneer']).map(tag => (
              <span key={tag} className="px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/10 hover:bg-indigo-600 transition-all cursor-default">
                {tag}
              </span>
            ))}
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-slate-100">
           <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] font-mono mb-4">Neural Hubs</h4>
           <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white hover:scale-110 transition-transform cursor-pointer"><ICONS.Globe /></div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:scale-110 transition-transform cursor-pointer"><ICONS.Messages /></div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:scale-110 transition-transform cursor-pointer"><ICONS.Explore /></div>
           </div>
        </div>
      </div>
    </div>
  );
};
