
import React from 'react';
import { User, Region } from '../../../types';
import { ICONS } from '../../../constants';

interface ProfileAboutSectionProps {
  userData: User;
  locale: Region;
}

const InfoBlock = ({ label, value, icon: Icon }: { label: string; value?: string; icon?: any }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-6 group">
      <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 transition-all border border-slate-100 group-hover:bg-white group-hover:shadow-lg group-hover:text-indigo-600">
        {Icon ? <div className="scale-110"><Icon /></div> : <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
      </div>
      <div className="flex-1 pt-1.5">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono mb-2 leading-none">
          {label}
        </p>
        <p className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter leading-tight uppercase italic break-words">
          {value}
        </p>
      </div>
    </div>
  );
};

export const ProfileAboutSection: React.FC<ProfileAboutSectionProps> = ({ userData, locale }) => {
  const formattedDob = userData.dob 
    ? new Date(userData.dob).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) 
    : '';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000">
      
      {/* Column 1: Core Professional */}
      <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-precision space-y-12">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Professional_Matrix</h2>
        </div>

        <div className="space-y-10">
          <InfoBlock 
            label="Current Function" 
            value={userData.occupation || 'Awaiting Uplink'} 
            icon={ICONS.Admin} 
          />
          
          <InfoBlock 
            label="Neural Training" 
            value={userData.education || 'Self-Taught Node'} 
            icon={ICONS.Explore} 
          />

          <InfoBlock 
            label="Geospatial Node" 
            value={userData.location || 'Encrypted Location'} 
            icon={ICONS.Globe} 
          />

          <InfoBlock 
            label="Primary Uplink" 
            value={userData.website} 
            icon={ICONS.Globe} 
          />
        </div>
      </div>

      {/* Column 2: Biometric Identity */}
      <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-precision space-y-12">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Identity_Signature</h2>
        </div>

        <div className="space-y-10">
          <InfoBlock 
            label="Temporal Origin" 
            value={formattedDob} 
          />

          <InfoBlock 
            label="Identity Label" 
            value={userData.pronouns} 
          />

          <InfoBlock 
            label="Social Status" 
            value={userData.relationshipStatus} 
          />

          <InfoBlock 
            label="Uplink Verification" 
            value={userData.verifiedHuman ? "Verified_Human_Module" : "Unverified_Signal"} 
            icon={ICONS.Verified}
          />
        </div>
      </div>

    </div>
  );
};
