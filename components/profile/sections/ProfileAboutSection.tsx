
import React from 'react';
import { User, Region } from '../../../types';
import { ICONS } from '../../../constants';

interface ProfileAboutSectionProps {
  userData: User;
  locale: Region;
}

const MasteryBar = ({ label, level }: { label: string; level: number }) => (
  <div className="space-y-2 group">
    <div className="flex justify-between items-end">
      <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest font-mono">{label}</p>
      <p className="text-[9px] font-black text-indigo-500 font-mono">{level}%</p>
    </div>
    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
      <div 
        className="h-full bg-indigo-600 rounded-full transition-all duration-1000 group-hover:bg-indigo-400" 
        style={{ width: `${level}%` }} 
      />
    </div>
  </div>
);

const SocialCard = ({ platform, url, isPrimary = false }: { platform: string; url: string; isPrimary?: boolean }) => {
  // @ts-ignore
  const Icon = ICONS.Social[platform] || ICONS.Globe;
  const brandColors: Record<string, string> = {
    'GitHub': 'hover:bg-[#24292e] hover:text-white',
    'LinkedIn': 'hover:bg-[#0077b5] hover:text-white',
    'X': 'hover:bg-black hover:text-white',
    'Instagram': 'hover:bg-gradient-to-tr hover:from-[#f9ce34] hover:via-[#ee2a7b] hover:to-[#6228d7] hover:text-white',
    'TikTok': 'hover:bg-black hover:text-white',
    'Threads': 'hover:bg-black hover:text-white',
    'Primary': 'bg-indigo-600 text-white hover:bg-slate-900',
  };

  return (
    <a 
      href={url} target="_blank" rel="noopener noreferrer"
      className={`flex items-center gap-4 p-5 rounded-2xl transition-all duration-300 group ${isPrimary ? brandColors['Primary'] : `bg-slate-50 border border-slate-100 ${brandColors[platform] || 'hover:bg-indigo-600 hover:text-white'}`}`}
    >
      <div className={`${isPrimary ? 'scale-125' : 'scale-110'}`}><Icon /></div>
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 truncate">{isPrimary ? 'Primary_Domain' : platform}</span>
        <span className={`text-[9px] font-bold truncate opacity-60`}>{url.replace(/^https?:\/\//, '')}</span>
      </div>
    </a>
  );
};

export const ProfileAboutSection: React.FC<ProfileAboutSectionProps> = ({ userData, locale }) => {
  const formattedDob = userData.dob 
    ? new Date(userData.dob).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) 
    : 'Awaiting Temporal Data';

  // Parse skills with format "SkillName:Level"
  const parsedSkills = (userData.skills || []).map(s => {
    const [name, level] = s.split(':');
    return { name, level: parseInt(level) || 50 };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-10 duration-1000 max-w-[2560px] mx-auto">
      
      {/* Column 1: Identity & Biosignals */}
      <div className="lg:col-span-4 space-y-8">
        <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 space-y-10 relative overflow-hidden h-full">
           <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
           
           <div className="flex items-center gap-4 mb-2">
             <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
             <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Neural_ID_Profile</h2>
           </div>

           <div className="space-y-8">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono mb-2">Temporal_Origin</p>
                <p className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">{formattedDob}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono mb-2">Geospatial_Node</p>
                <p className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">{userData.location || 'Encrypted'}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono mb-2">Identity_Labels</p>
                <p className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">{userData.pronouns || 'Not Specified'}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono mb-2">Social_Bonding</p>
                <p className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">{userData.relationshipStatus || 'Single'}</p>
              </div>
           </div>

           <div className="pt-6 border-t border-slate-50 flex items-center justify-between mt-auto">
              <div className="flex flex-col">
                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono">Trust_Tier</span>
                 <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">{userData.trustTier || 'Gamma'}</span>
              </div>
              <div className="px-4 py-2 bg-slate-50 rounded-xl text-[9px] font-black font-mono">ID: {userData.id.slice(0, 8).toUpperCase()}</div>
           </div>
        </div>
      </div>

      {/* Column 2: Professional Mastery */}
      <div className="lg:col-span-4 space-y-8">
        <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden h-full">
           <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-indigo-500/10 to-transparent" />
           
           <div className="flex items-center gap-4 mb-10 relative z-10">
             <div className="w-2 h-2 bg-indigo-400 rounded-full animate-ping" />
             <h2 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] font-mono">Capability_Matrix</h2>
           </div>

           <div className="space-y-10 relative z-10">
              <div className="pb-8 border-b border-white/5">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono mb-2">Current_Role</p>
                <p className="text-3xl font-black italic tracking-tighter uppercase leading-tight">{userData.occupation || 'Awaiting Uplink'}</p>
              </div>

              <div className="space-y-6">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono mb-4">Mastery_Diagnostics</p>
                {parsedSkills.length > 0 ? parsedSkills.map((skill, idx) => (
                  <MasteryBar key={idx} label={skill.name} level={skill.level} />
                )) : (
                  <p className="text-xs text-slate-500 font-medium italic">No capability data synchronised...</p>
                )}
              </div>
           </div>
        </div>
      </div>

      {/* Column 3: Digital Footprint (Ecosystem) */}
      <div className="lg:col-span-4 space-y-8">
        <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 space-y-8 h-full flex flex-col">
           <div className="flex items-center gap-4 mb-4">
             <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><ICONS.Globe /></div>
             <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em] font-mono">Digital_Ecosystem</h2>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 overflow-y-auto no-scrollbar max-h-[500px] pr-2">
              {/* Highlighted Primary Website Tile */}
              {userData.website && (
                <div className="sm:col-span-2 lg:col-span-1">
                  <SocialCard platform="Primary" url={userData.website} isPrimary={true} />
                </div>
              )}

              {userData.socialLinks && userData.socialLinks.length > 0 ? (
                userData.socialLinks.map((link, idx) => (
                  <SocialCard key={idx} platform={link.platform} url={link.url} />
                ))
              ) : !userData.website && (
                <div className="col-span-full py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center px-6">
                   <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-4">
                      <ICONS.Globe />
                   </div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono italic">External nodes not yet integrated.</p>
                </div>
              )}
           </div>

           <div className="mt-auto pt-8 border-t border-slate-50">
             <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono mb-2">Uplink_Efficiency</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-black text-slate-900 tracking-tighter">{(userData.socialLinks?.length || 0) + (userData.website ? 1 : 0)}</span>
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest font-mono">Active_Nodes</span>
                </div>
             </div>
           </div>
        </div>
      </div>

    </div>
  );
};
