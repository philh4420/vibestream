
import React, { useState, useEffect } from 'react';
import { db, auth } from '../../services/firebase';
import { 
  collection, 
  query, 
  getDocs, 
  limit, 
  orderBy,
  doc,
  updateDoc
} from 'firebase/firestore';
import { User as VibeUser, Post, PresenceStatus } from '../../types';
import { PRESENCE_CONFIG, IDENTITY_SIGNALS } from '../../constants';

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
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Local state for instant feedback
  const [localStatus, setLocalStatus] = useState({
    presenceStatus: userData?.presenceStatus || 'Online',
    statusEmoji: userData?.statusEmoji || '⚡',
    statusMessage: userData?.statusMessage || ''
  });

  useEffect(() => {
    if (userData) {
      setLocalStatus({
        presenceStatus: userData.presenceStatus || 'Online',
        statusEmoji: userData.statusEmoji || '⚡',
        statusMessage: userData.statusMessage || ''
      });
    }
  }, [userData]);

  const updateNeuralStatus = async (updates: Partial<typeof localStatus>) => {
    if (!db || !auth.currentUser) return;
    setIsUpdatingStatus(true);
    const newStatus = { ...localStatus, ...updates };
    setLocalStatus(newStatus);
    
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), newStatus);
    } catch (e) {
      console.error("Status Sync Error:", e);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  useEffect(() => {
    const fetchSidebarData = async () => {
      if (!db) return;
      setIsLoading(true);
      
      try {
        const usersQuery = query(collection(db, 'users'), limit(5), orderBy('joinedAt', 'desc'));
        const usersSnap = await getDocs(usersQuery);
        const fetchedUsers = usersSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as VibeUser))
          .filter(user => user.id !== auth.currentUser?.uid)
          .slice(0, 3);
        setSuggestedNodes(fetchedUsers);

        const postsQuery = query(collection(db, 'posts'), limit(50), orderBy('timestamp', 'desc'));
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
            growth: count > 5 ? '+18%' : '+5%'
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
  }, [userData?.id]);

  return (
    <aside className="hidden xl:flex flex-col w-80 shrink-0 bg-[#fcfcfd] p-6 gap-6 pt-[calc(var(--header-h)+1.5rem)] pr-[max(1.5rem,var(--sar))] border-l border-precision overflow-y-auto no-scrollbar">
      
      {/* Neural Hub: Presence & Status Control */}
      <div className="glass-panel rounded-[2.5rem] p-7 backdrop-blur-3xl shadow-2xl border-white hover:border-indigo-500/20 transition-all duration-500 group bg-white">
        <div className="flex justify-between items-center mb-6">
           <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em] font-mono">Neural_Control</h4>
           <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${isUpdatingStatus ? 'bg-indigo-500 animate-spin' : 'bg-emerald-500'}`} />
        </div>

        <div className="space-y-8">
           {/* Status Emoji Grid */}
           <div className="grid grid-cols-4 gap-2">
              {IDENTITY_SIGNALS.map(emoji => (
                <button 
                  key={emoji}
                  onClick={() => updateNeuralStatus({ statusEmoji: emoji })}
                  className={`aspect-square rounded-xl flex items-center justify-center text-lg transition-all active:scale-90 ${localStatus.statusEmoji === emoji ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 hover:bg-slate-100 text-slate-400'}`}
                >
                  {emoji}
                </button>
              ))}
           </div>

           {/* Status Message Field */}
           <div className="space-y-2">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 font-mono">Current Signal</label>
              <input 
                type="text"
                value={localStatus.statusMessage}
                onChange={(e) => setLocalStatus(prev => ({ ...prev, statusMessage: e.target.value }))}
                onBlur={() => updateNeuralStatus({ statusMessage: localStatus.statusMessage })}
                placeholder="Synchronising..."
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-300"
              />
           </div>

           {/* Presence Selection */}
           <div className="space-y-3">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1 font-mono">Presence Mode</label>
              <div className="grid grid-cols-2 gap-2">
                 {(Object.keys(PRESENCE_CONFIG) as PresenceStatus[]).map(status => (
                    <button 
                      key={status}
                      onClick={() => updateNeuralStatus({ presenceStatus: status })}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 ${localStatus.presenceStatus === status ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${PRESENCE_CONFIG[status].color}`} />
                      <span className="truncate">{status}</span>
                    </button>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* Resonance Feed (Trends) */}
      <div className="glass-panel rounded-[2.5rem] p-7 bg-white/50 border-white/40 group">
        <div className="flex justify-between items-center mb-8">
          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono group-hover:text-indigo-500 transition-colors">Resonance_Feed</h4>
          <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-ping" />
        </div>
        
        <div className="space-y-7">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map(i => <div key={i} className="h-8 bg-slate-100 rounded-lg w-full" />)}
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
      </div>

      {/* Neural Connect - Peer Discovery */}
      <div className="glass-panel rounded-[2.5rem] p-7 bg-white/50 border-white/40">
        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] mb-8 font-mono">Neural_Connect</h4>
        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-6 animate-pulse">
              {[1, 2].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-2 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : suggestedNodes.length > 0 ? (
            suggestedNodes.map(node => (
              <div key={node.id} className="flex items-center justify-between group/node">
                <div className="flex items-center gap-3">
                  <img src={node.avatarUrl} className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 group-hover/node:scale-105 transition-transform" alt="" />
                  <div>
                    <p className="text-[11px] font-black text-slate-900 leading-none mb-1 line-clamp-1">{node.displayName}</p>
                    <p className="text-[9px] text-slate-400 font-bold font-mono tracking-tight">@{node.username}</p>
                  </div>
                </div>
                <button className="p-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-600 hover:text-white transition-all active:scale-90 shadow-sm border border-indigo-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                </button>
              </div>
            ))
          ) : (
            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest font-mono py-4">Searching for Peer Nodes...</p>
          )}
        </div>
      </div>
    </aside>
  );
};
