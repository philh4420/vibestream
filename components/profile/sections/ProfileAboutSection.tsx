
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
    <div className={`glass-panel rounded-[3rem] p-10 md:p-12 ${className}`}>
      <div className="flex justify-between items-center mb-10 border-b border-slate-50 pb-6">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" /> {title}
        </h3>
        <div className="px-3 py-1 bg-slate-50 rounded-lg text-[8px] font-bold text-slate-300 font-mono">v2.6.GB</div>
      </div>
      <div className="space-y-10">{children}</div>
    </div>
  );

  const InfoItem = ({ icon: Icon, label, value }: { icon?: any; label: string; value: string }) => {
    if (!value || value.trim() === '') return null;
    return (
      <div className="flex items-center gap-6 group cursor-default animate-in fade-in duration-500">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all shadow-sm">
          {Icon ? <Icon /> : <div className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />}
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] font-mono mb-1">{label}</p>
          <p className="text-base md:text-lg font-bold text-slate-900 tracking-tight leading-none">{value}</p>
        </div>
      </div>
    );
  };

  const getSocialIcon = (platform: string) => {
    // @ts-ignore
    return ICONS.Social[platform] || ICONS.Globe;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 animate-in fade-in slide-in-from-bottom-6 duration-700 max-w-[2560px] mx-auto">
      
      {/* Professional Grid Cluster */}
      <DataCluster title="Core_Professional">
        <div className="grid grid-cols-1 gap-10">
          <InfoItem label="Operational Function" value={userData.occupation || ''} />
          <InfoItem label="Neural Training" value={userData.education || ''} />
          <InfoItem label="Geospatial Node" value={userData.location} icon={ICONS.Globe} />
        </div>
      </DataCluster>

      {/* Biometric Cluster */}
      <DataCluster title="Biometric_Identity">
        <div className="grid grid-cols-1 gap-10">
          <InfoItem label="Temporal Origin" value={formattedDob} />
          <InfoItem label="Identity Label (Pronouns)" value={userData.pronouns || ''} />
          <InfoItem label="Social Status" value={userData.relationshipStatus || ''} />
        </div>
      </DataCluster>

      {/* Connectivity Hub (External Socials) */}
      {userData.socialLinks && userData.socialLinks.length > 0 && (
        <DataCluster title="Neural_Connectivity_Hub" className="md:col-span-2">
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {userData.socialLinks.map((link, idx) => {
                const PlatformIcon = getSocialIcon(link.platform);
                return (
                  <a 
                    key={`${link.platform}-${idx}`} 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-5 p-6 bg-slate-50 hover:bg-indigo-50 rounded-[2rem] border border-slate-100 transition-all group/link active:scale-[0.98] shadow-sm"
                  >
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-500 group-hover/link:text-indigo-600 shadow-sm transition-colors ring-1 ring-slate-100">
                      <PlatformIcon />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1">{link.platform}</p>
                      <p className="text-xs font-bold text-slate-900 truncate">{link.url.replace(/^https?:\/\/(www\.)?/, '')}</p>
                    </div>
                  </a>
                );
              })}
           </div>
        </DataCluster>
      )}

      {/* Skills Matrix */}
      {(userData.skills?.length || 0) > 0 && (
        <DataCluster title="Capability_Matrix">
          <div className="flex flex-wrap gap-4">
            {userData.skills?.map((skill) => (
              <span key={skill} className="px-6 py-3 bg-indigo-50 text-indigo-700 text-[11px] font-black uppercase tracking-widest rounded-2xl border border-indigo-100 shadow-sm hover:bg-indigo-100 transition-colors cursor-default">
                {skill}
              </span>
            ))}
          </div>
        </DataCluster>
      )}

      {/* Passions Grid */}
      {(userData.hobbies?.length || 0) > 0 && (
        <DataCluster title="Passions_Grid">
          <div className="flex flex-wrap gap-4">
            {userData.hobbies?.map((hobby) => (
              <span key={hobby} className="px-6 py-3 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl border border-white/10 shadow-lg hover:bg-indigo-600 transition-colors cursor-default">
                {hobby}
              </span>
            ))}
          </div>
        </DataCluster>
      )}

      {/* Identity Mesh Tags */}
      {(userData.tags?.length || 0) > 0 && (
        <DataCluster title="Resonance_Mesh" className="md:col-span-2">
          <div className="flex flex-wrap gap-5">
            {userData.tags?.map((tag) => (
              <span key={tag} className="px-8 py-4 bg-white text-slate-900 text-[11px] font-black uppercase tracking-[0.35em] rounded-[1.5rem] border border-slate-100 shadow-sm hover:border-indigo-500/30 transition-all cursor-default font-mono">
                #{tag}
              </span>
            ))}
          </div>
        </DataCluster>
      )}

      {/* System Chronology Logs */}
      {userData.lifeEvents && userData.lifeEvents.length > 0 && (
        <DataCluster title="System_Identity_Logs" className="md:col-span-2">
           <div className="space-y-6 relative before:absolute before:left-10 before:top-4 before:bottom-4 before:w-px before:bg-slate-100">
              {userData.lifeEvents.map((event) => (
                <div key={event.id} className="flex gap-12 items-start relative group/event">
                  <div className="w-20 h-20 rounded-[1.5rem] bg-white border border-slate-100 shadow-xl flex items-center justify-center text-3xl z-10 group-hover/event:scale-110 transition-transform shadow-indigo-100/30">
                    {event.icon || '🌟'}
                  </div>
                  <div className="flex-1 pb-10 border-b border-slate-50 last:border-none">
                    <p className="text-[11px] font-black text-indigo-500 uppercase tracking-widest font-mono mb-2">
                      [{event.date ? new Date(event.date).toLocaleDateString(locale, { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.') : '0000.00.00'}] PROTOCOL_EVENT
                    </p>
                    <h4 className="text-2xl font-black text-slate-900 tracking-tighter italic leading-tight">{event.title.toUpperCase()}</h4>
                    <p className="text-[10px] font-bold text-slate-400 mt-2 font-mono uppercase tracking-widest">Hash_Sync: Verified</p>
                  </div>
                </div>
              ))}
           </div>
        </DataCluster>
      )}
    </div>
  );
};
