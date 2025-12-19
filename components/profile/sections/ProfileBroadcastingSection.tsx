
import React, { useState, useEffect } from 'react';
import { Post, User, Region } from '../../../types';
import { PostCard } from '../../feed/PostCard';
import { BentoTile } from '../tiles/BentoTile';

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
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-[2560px] mx-auto">
      {/* High-Density Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-min gap-6 md:gap-8">
        <BentoTile title="Signal_Quality" className="bg-slate-950 text-white p-10">
          <div className="text-5xl font-black tracking-tighter mb-4 italic">99.9%</div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 w-[99.9%] shadow-[0_0_15px_rgba(79,70,229,1)]" />
          </div>
        </BentoTile>
        <BentoTile title="Uptime" className="p-10">
          <div className="text-4xl font-black text-slate-900 tracking-tighter italic">{uptime}</div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 font-mono">Continuous Grid Sync</p>
        </BentoTile>
        <BentoTile title="Trust_Tier" className="p-10">
          <div className="text-3xl font-black text-indigo-600 tracking-tighter uppercase italic">{userData.trustTier || 'Alpha'}</div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 font-mono">Neural Cluster Verified</p>
        </BentoTile>
        <BentoTile title="Node_Stability" className="p-10">
          <div className="text-4xl font-black text-slate-900 tracking-tighter italic">4ms</div>
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-2 font-mono italic">GB_FAST_NODE</p>
        </BentoTile>
      </div>

      {/* Broadcasting Stream */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12 pt-8">
        {posts.length > 0 ? (
          posts.map(post => <PostCard key={post.id} post={post} onLike={() => {}} locale={locale} />)
        ) : (
          <div className="xl:col-span-2 py-40 text-center glass-panel rounded-[3.5rem] border-2 border-dashed border-slate-100">
            <p className="text-[12px] font-black text-slate-300 uppercase tracking-[0.4em] font-mono italic">Awaiting primary transmission sequence establishment...</p>
          </div>
        )}
      </div>
    </div>
  );
};
