
import React from 'react';
import { User, Region } from '../../../types';
import { ICONS } from '../../../constants';

interface ProfileAboutSectionProps {
  userData: User;
  locale: Region;
}

export const ProfileAboutSection: React.FC<ProfileAboutSectionProps> = ({ userData, locale }) => {
  const formattedDob = userData.dob ? new Date(userData.dob).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) : '';

  const DataCluster = ({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) => (
    <div className={`glass-panel rounded-[3.5rem] p-10 md:p-14 ${className}`}>
      <div className="flex justify-between items-center mb-12 border-b border-slate-50 pb-8">
        <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono flex items-center gap-3">
          <span className="w-2 h-2 bg-indigo-500 rounded-full" /> {title}
        </h3>
        <div className="w-2 h-2 bg-slate-100 rounded-full" />
      </div>
      <div className="space-y-12">{children}</div>
    </div>
  );

  const InfoItem = ({ icon: Icon, label, value }: { icon?: any; label: string; value: string }) => {
    if (!value || value.trim() === '') return null;
    return (
      <div className="flex items-center gap-8 group cursor-default animate-in fade-in duration-500">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-[1.8rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all shadow-sm">
          {Icon ? <div className="scale-125 md:scale-150"><Icon /></div> : <div className="w-2 h-2 rounded-full bg-current opacity-40" />}
        </div>
        <div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] font-mono mb-2">{label}</p>
          <p className="text-xl md:text-3xl font-bold text-slate-900 tracking-tighter leading-none italic">{value}</p>
        </div>
      </div>
    );
  };

  const getSocialIcon = (platform: string) => {
    // @ts-ignore
    return ICONS.Social[platform] || ICONS.Globe;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 lg:gap-12 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-[2560px] mx-auto">
      
      {/* Professional Grid Cluster */}
      <DataCluster title="Core_Professional" className="xl:col-span-1">
        <div className="grid grid-cols-1 gap-12">
          <InfoItem label="Operational Function" value={userData.occupation || ''} />
          <InfoItem label="Neural Training" value={userData.education || ''} />
          <InfoItem label="Geospatial Node" value={userData.location} icon={ICONS.Globe} />
          <InfoItem label="Primary Uplink" value={userData.website || ''} icon={ICONS.Globe} />
        </div>
      </DataCluster>

      {/* Biometric Cluster */}
      <DataCluster title="Biometric_Identity" className="xl:col-span-1">
        <div className="grid grid-cols-1 gap-12">
          <InfoItem label="Temporal Origin" value={formattedDob} />
          <InfoItem label="Identity Label (Pronouns)" value={userData.pronouns || ''} />
          <InfoItem label="Social Status" value={userData.relationshipStatus || ''} />
        </div>
      </DataCluster>

      {/* Connectivity Hub (External Socials) */}
      {userData.socialLinks && userData.socialLinks.length > 0 && (
        <DataCluster title="Neural_Connectivity_Hub" className="md:col-span-2 xl:col-span-1">
           <div className="grid grid-cols-1 gap-8">
              {userData.socialLinks.map((link, idx) => {
                const PlatformIcon = getSocialIcon(link.platform);
                return (
                  <a 
                    key={`${link.platform}-${idx}`} 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-6 p-6 bg-slate-50 hover:bg-indigo-50 rounded-[2.2rem] border border-slate-100 transition-all group/link active:scale-[0.98] shadow-sm"
                  >
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-500 group-hover/link:text-indigo-600 shadow-sm transition-colors ring-1 ring-slate-100">
                      <PlatformIcon />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1">{link.platform}</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{link.url.replace(/^https?:\/\/(www\.)?/, '')}</p>
                    </div>
                  </a>
                );
              })}
           </div>
        </DataCluster>
      )}
    </div>
  );
};
