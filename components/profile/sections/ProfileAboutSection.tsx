
import React from 'react';
import { User, Region } from '../../../types';
import { ICONS } from '../../../constants';

interface ProfileAboutSectionProps {
  userData: User;
  locale: Region;
}

export const ProfileAboutSection: React.FC<ProfileAboutSectionProps> = ({ userData, locale }) => {
  const formattedDob = userData.dob ? new Date(userData.dob).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) : 'Pending Sync';

  const DataCluster = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="glass-panel rounded-[2.5rem] p-8 md:p-10">
      <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mb-8 border-b border-slate-100 pb-4 flex items-center gap-2">
        <span className="w-1 h-1 bg-indigo-500 rounded-full" /> {title}
      </h3>
      <div className="space-y-6">{children}</div>
    </div>
  );

  const InfoItem = ({ icon: Icon, label, value }: { icon?: any; label: string; value: string }) => (
    <div className="flex items-center gap-4 group cursor-default">
      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
        {Icon ? <Icon /> : <div className="w-1 h-1 rounded-full bg-current" />}
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono mb-0.5">{label}</p>
        <p className="text-sm font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <DataCluster title="Professional_Profile">
        <InfoItem label="Current Occupation" value={userData.occupation || 'Creative Technologist'} />
        <InfoItem label="Education Path" value={userData.education || 'Self-Encoded Specialist'} />
        <InfoItem label="Geo Node" value={userData.location} icon={ICONS.Globe} />
      </DataCluster>

      <DataCluster title="Personal_Identity">
        <InfoItem label="Origin (DOB)" value={formattedDob} />
        <InfoItem label="Biometric ID" value={userData.pronouns || 'Human'} />
        <InfoItem label="Encoded Status" value={userData.relationshipStatus || 'Independent'} />
      </DataCluster>

      <div className="md:col-span-2">
        <DataCluster title="Interest_Mesh">
          <div className="flex flex-wrap gap-3">
            {(userData.tags || ['Innovation', 'Web3', 'Design']).map((tag) => (
              <span key={tag} className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl border border-white/10 hover:bg-indigo-600 transition-all cursor-pointer">
                #{tag}
              </span>
            ))}
          </div>
        </DataCluster>
      </div>
    </div>
  );
};
