
import React, { useState, useEffect } from 'react';
import { Post, User, Region } from '../../../types';
import { PostCard } from '../../feed/PostCard';

interface ProfileBroadcastingSectionProps {
  userData: User;
  posts: Post[];
  sessionStartTime: number;
  locale: Region;
}

export const ProfileBroadcastingSection: React.FC<ProfileBroadcastingSectionProps> = ({ 
  userData, 
  posts, 
  sessionStartTime, 
  locale 
}) => {
  const [uptime, setUptime] = useState('0h 0m');

  useEffect(() => {
    const update = () => {
      const diffMs = Date.now() - sessionStartTime;
      const h = Math.floor(diffMs / 3600000);
      const m = Math.floor((diffMs % 3600000) / 60000);
      setUptime(`${h}h ${m}m`);
    };
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, [sessionStartTime]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* High-Density Horizontal Telemetry Strip */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-wrap gap-8 items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1">Signal_Quality</span>
          <div className="flex items-center gap-3">
             <span className="text-2xl font-black tracking-tighter italic">99.9%</span>
             <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 w-[99%]" />
             </div>
          </div>
        </div>
        <div className="w-px h-10 bg-slate-100 hidden md:block" />
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1">Uptime</span>
          <span className="text-2xl font-black tracking-tighter italic text-slate-900">{uptime}</span>
        </div>
        <div className="w-px h-10 bg-slate-100 hidden md:block" />
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1">Trust_Tier</span>
          <span className="text-2xl font-black tracking-tighter italic text-indigo-600">{userData.trustTier || 'Alpha'}</span>
        </div>
      </div>

      {/* Transmission Flow */}
      <div className="space-y-6">
        {posts.length > 0 ? (
          posts.map(post => <PostCard key={post.id} post={post} onLike={() => {}} locale={locale} />)
        ) : (
          <div className="py-32 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 shadow-sm">
            <p className="text-[12px] font-black text-slate-300 uppercase tracking-[0.4em] font-mono italic">Awaiting primary transmission sequence establishment...</p>
          </div>
        )}
      </div>
    </div>
  );
};
