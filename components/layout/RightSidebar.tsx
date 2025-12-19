
import React, { useState, useEffect } from 'react';
import { db, auth } from '../../services/firebase';
import { 
  collection, 
  query, 
  getDocs, 
  limit, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { User as VibeUser, Post } from '../../types';

interface RightSidebarProps {
  userData: VibeUser | null;
}

interface Trend {
  tag: string;
  count: number;
  growth: string;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ userData }) => {
  const [suggestedNodes, setSuggestedNodes] = useState<VibeUser[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSidebarData = async () => {
      if (!db) return;
      setIsLoading(true);
      
      try {
        // 1. Fetch Suggested Nodes (Recent Users)
        const usersQuery = query(
          collection(db, 'users'),
          limit(5),
          orderBy('joinedAt', 'desc')
        );
        const usersSnap = await getDocs(usersQuery);
        const fetchedUsers = usersSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as VibeUser))
          .filter(user => user.id !== auth.currentUser?.uid)
          .slice(0, 3);
        setSuggestedNodes(fetchedUsers);

        // 2. Fetch Trends (Extracting tags from recent posts)
        const postsQuery = query(
          collection(db, 'posts'),
          limit(50),
          orderBy('timestamp', 'desc')
        );
        const postsSnap = await getDocs(postsQuery);
        const recentPosts = postsSnap.docs.map(doc => doc.data() as Post);
        
        const tagMap: Record<string, number> = {};
        recentPosts.forEach(post => {
          const hashtags = post.content.match(/#[\w\u0080-\uffff]+/g);
          if (hashtags) {
            hashtags.forEach(tag => {
              const cleanTag = tag.replace('#', '');
              tagMap[cleanTag] = (tagMap[cleanTag] || 0) + 1;
            });
          }
        });

        const sortedTrends = Object.entries(tagMap)
          .map(([tag, count]) => ({
            tag,
            count,
            growth: count > 5 ? '+18%' : '+5%' // Aesthetic growth metric
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 4);

        setTrends(sortedTrends);
      } catch (error) {
        console.error("Sidebar Intelligence Sync Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSidebarData();
  }, [userData]);

  return (
    <aside className="hidden xl:flex flex-col w-80 shrink-0 bg-white/30 p-6 gap-6 pt-[calc(var(--header-h)+1.5rem)] pr-[max(1.5rem,var(--sar))] border-l border-precision overflow-y-auto no-scrollbar">
      
      {/* Live Resonance Feed */}
      <div className="glass-panel rounded-[2.5rem] p-7 backdrop-blur-md shadow-sm border-white/40 hover:border-indigo-500/20 transition-all duration-500 group">
        <div className="flex justify-between items-center mb-8">
          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono group-hover:text-indigo-500 transition-colors">Resonance_Feed</h4>
          <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-ping" />
        </div>
        
        <div className="space-y-7">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-8 bg-slate-100 rounded-lg w-full" />
              ))}
            </div>
          ) : trends.length > 0 ? (
            trends.map((trend) => (
              <div key={trend.tag} className="flex flex-col gap-1.5 group/item cursor-pointer">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-black text-slate-900 tracking-tight group-hover/item:text-indigo-600 transition-colors">#{trend.tag}</p>
                  <span className={`text-[8px] font-bold font-mono ${trend.growth.startsWith('+') ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {trend.growth}
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest font-mono">{trend.count.toLocaleString('en-GB')} Signals</p>
              </div>
            ))
          ) : (
            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest font-mono py-4">Scanning Grid for Signal...</p>
          )}
        </div>
        
        <button className="w-full mt-8 py-3 bg-slate-50 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-transparent hover:border-indigo-100">
          Sync_All_Signals
        </button>
      </div>

      {/* Neural Connect - Live Node Discovery */}
      <div className="glass-panel rounded-[2.5rem] p-7 backdrop-blur-md shadow-sm border-white/40">
        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8 font-mono">Neural_Connect</h4>
        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-6 animate-pulse">
              {[1, 2].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-2 bg-slate-100 rounded w-1/2" />
                    <div className="h-2 bg-slate-100 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : suggestedNodes.length > 0 ? (
            suggestedNodes.map(node => (
              <div key={node.id} className="flex items-center justify-between group/node">
                <div className="flex items-center gap-3">
                  <img 
                    src={node.avatarUrl} 
                    className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 group-hover/node:scale-105 transition-transform" 
                    alt="" 
                  />
                  <div>
                    <p className="text-[11px] font-black text-slate-900 leading-none mb-1 line-clamp-1">{node.displayName}</p>
                    <p className="text-[9px] text-slate-400 font-bold font-mono tracking-tight">@{node.username}</p>
                  </div>
                </div>
                <button className="p-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-600 hover:text-white transition-all active:scale-90">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                </button>
              </div>
            ))
          ) : (
            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest font-mono py-4">Searching for Peer Nodes...</p>
          )}
        </div>
      </div>

      {/* System Operational Monitor */}
      <div className="glass-panel rounded-[2rem] p-6 backdrop-blur-md bg-slate-950/5 border-slate-200">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <div className="w-3 h-3 bg-emerald-500 rounded-full" />
            <div className="absolute inset-0 w-3 h-3 bg-emerald-400 rounded-full animate-ping opacity-75" />
          </div>
          <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest font-mono">Grid_Operational</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Latency</p>
            <p className="text-xs font-black text-slate-900 font-mono">14ms</p>
          </div>
          <div>
            <p className="text-[8px] font-bold text-slate-400 uppercase mb-1">Uptime</p>
            <p className="text-xs font-black text-slate-900 font-mono">99.99%</p>
          </div>
        </div>
      </div>

    </aside>
  );
};
