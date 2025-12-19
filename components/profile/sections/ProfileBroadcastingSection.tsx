
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 auto-rows-min gap-4 md:gap-6">
        <BentoTile title="Signal_Quality" className="bg-slate-950 text-white">
          <div className="text-4xl font-black tracking-tighter mb-2">99.8%</div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 w-[99.8%]" />
          </div>
        </BentoTile>
        <BentoTile title="Uptime">
          <div className="text-3xl font-black text-slate-900 tracking-tighter">{uptime}</div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 font-mono">Continuous Sync</p>
        </BentoTile>
        <BentoTile title="Trust_Tier">
          <div className="text-2xl font-black text-indigo-600 tracking-tighter uppercase italic">{userData.trustTier || 'Alpha'}</div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 font-mono">Verification Cluster</p>
        </BentoTile>
        <BentoTile title="Node_Stability">
          <div className="text-3xl font-black text-slate-900 tracking-tighter">8ms</div>
          <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-1 font-mono italic">GB_NODE_STABLE</p>
        </BentoTile>
      </div>

      <div className="grid grid-cols-1 gap-6 pt-6">
        {posts.length > 0 ? (
          posts.map(post => <PostCard key={post.id} post={post} onLike={() => {}} locale={locale} />)
        ) : (
          <div className="py-20 text-center glass-panel rounded-[2.5rem] border-dashed">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Awaiting initial transmission...</p>
          </div>
        )}
      </div>
    </div>
  );
};
