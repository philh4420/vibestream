
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
    <div className={`glass-panel rounded-[2.5rem] p-8 md:p-10 ${className}`}>
      <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mb-8 border-b border-slate-100 pb-4 flex items-center gap-2">
        <span className="w-1 h-1 bg-indigo-500 rounded-full" /> {title}
      </h3>
      <div className="space-y-6">{children}</div>
    </div>
  );

  const InfoItem = ({ icon: Icon, label, value }: { icon?: any; label: string; value: string }) => {
    if (!value || value.trim() === '') return null;
    return (
      <div className="flex items-center gap-4 group cursor-default animate-in fade-in duration-500">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
          {Icon ? <Icon /> : <div className="w-1 h-1 rounded-full bg-current" />}
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono mb-0.5">{label}</p>
          <p className="text-sm font-bold text-slate-900">{value}</p>
        </div>
      </div>
    );
  };

  const getSocialIcon = (platform: string) => {
    // @ts-ignore
    return ICONS.Social[platform] || ICONS.Globe;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <DataCluster title="Professional_Profile">
        <InfoItem label="Current Occupation" value={userData.occupation || ''} />
        <InfoItem label="Education Path" value={userData.education || ''} />
        <InfoItem label="Geo Node" value={userData.location} icon={ICONS.Globe} />
      </DataCluster>

      <DataCluster title="Personal_Identity">
        <InfoItem label="Origin (DOB)" value={formattedDob} />
        <InfoItem label="Biometric ID" value={userData.pronouns || ''} />
        <InfoItem label="Encoded Status" value={userData.relationshipStatus || ''} />
      </DataCluster>

      {/* Social Hub Cluster - Multi-platform support 2026 */}
      {userData.socialLinks && userData.socialLinks.length > 0 && (
        <DataCluster title="Social_Hub_Uplink" className="md:col-span-2">
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {userData.socialLinks.map((link) => {
                const PlatformIcon = getSocialIcon(link.platform);
                return (
                  <a 
                    key={link.platform} 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-slate-50 hover:bg-indigo-50 rounded-2xl border border-slate-100 transition-all group/link active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-500 group-hover/link:text-indigo-600 shadow-sm transition-colors">
                      <PlatformIcon />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">{link.platform}</p>
                      <p className="text-xs font-bold text-slate-900 truncate">{link.url.replace(/^https?:\/\/(www\.)?/, '')}</p>
                    </div>
                  </a>
                );
              })}
           </div>
        </DataCluster>
      )}

      {(userData.tags?.length || 0) > 0 && (
        <DataCluster title="Interest_Mesh" className="md:col-span-2">
          <div className="flex flex-wrap gap-3">
            {userData.tags?.map((tag) => (
              <span key={tag} className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl border border-white/10 hover:bg-indigo-600 transition-all cursor-pointer">
                #{tag}
              </span>
            ))}
          </div>
        </DataCluster>
      )}
    </div>
  );
};
