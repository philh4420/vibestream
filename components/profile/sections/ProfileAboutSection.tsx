
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
    <div className="flex items-start gap-8 group">
      <div className="w-16 h-16 md:w-20 md:h-32 rounded-[2rem] bg-slate-50/50 flex flex-col items-center justify-center text-slate-400 transition-all border border-slate-100/50">
        {Icon ? <div className="scale-125"><Icon /></div> : <div className="w-2 h-2 rounded-full bg-indigo-500" />}
        <div className="mt-4 w-px h-full bg-slate-100 hidden md:block" />
      </div>
      <div className="flex-1 pt-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono mb-4 leading-none">
          {label}
        </p>
        <p className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter leading-[0.9] italic uppercase break-words">
          {value}
        </p>
      </div>
    </div>
  );
};

export const ProfileAboutSection: React.FC<ProfileAboutSectionProps> = ({ userData, locale }) => {
  const formattedDob = userData.dob 
    ? new Date(userData.dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) 
    : '';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
      
      {/* Column 1: Core Professional */}
      <div className="bg-white rounded-[3.5rem] p-10 md:p-14 lg:p-20 shadow-sm border border-precision space-y-20">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] font-mono">Core_Professional</h2>
        </div>

        <div className="space-y-16">
          <InfoBlock 
            label="Geospatial Node" 
            value={userData.location || 'Node Hidden'} 
            icon={ICONS.Globe} 
          />
          
          <InfoBlock 
            label="Primary Uplink" 
            value={userData.website} 
            icon={ICONS.Globe} 
          />

          <InfoBlock 
            label="Operational Function" 
            value={userData.occupation} 
          />

          <InfoBlock 
            label="Neural Training" 
            value={userData.education} 
          />
        </div>
      </div>

      {/* Column 2: Biometric Identity */}
      <div className="bg-white rounded-[3.5rem] p-10 md:p-14 lg:p-20 shadow-sm border border-precision space-y-20">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full" />
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] font-mono">Biometric_Identity</h2>
        </div>

        <div className="space-y-16">
          <InfoBlock 
            label="Temporal Origin" 
            value={formattedDob} 
          />

          <InfoBlock 
            label="Identity Label (Pronouns)" 
            value={userData.pronouns} 
          />

          <InfoBlock 
            label="Social Status" 
            value={userData.relationshipStatus} 
          />

          <InfoBlock 
            label="Uplink Verification" 
            value={userData.verifiedHuman ? "Verified_Human" : "Unverified_Node"} 
          />
        </div>
      </div>

    </div>
  );
};
