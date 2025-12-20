
import React, { useState, useEffect } from 'react';
import { db, auth } from '../../services/firebase';
import { 
  collection, 
  query, 
  getDocs, 
  limit, 
  orderBy,
  doc,
  updateDoc,
  onSnapshot
} from 'firebase/firestore';
import { User as VibeUser, PresenceStatus, Post } from '../../types';
import { PRESENCE_CONFIG, IDENTITY_SIGNALS, ICONS } from '../../constants';

interface RightSidebarProps {
  userData: VibeUser | null;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ userData }) => {
  const [activeContacts, setActiveContacts] = useState<VibeUser[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [anniversaries, setAnniversaries] = useState<VibeUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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
    if (!db) return;
    setIsLoading(true);
    
    // Live Sync Active Contacts
    const usersQuery = query(collection(db, 'users'), limit(12), orderBy('joinedAt', 'desc'));
    const unsubUsers = onSnapshot(usersQuery, (snap) => {
      const fetched = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as VibeUser))
        .filter(user => user.id !== auth.currentUser?.uid);
      setActiveContacts(fetched);

      // Anniversary Check
      const today = new Date();
      const annis = fetched.filter(u => {
         if (!u.joinedAt) return false;
         const jDate = new Date(u.joinedAt);
         return jDate.getMonth() === today.getMonth() && jDate.getDate() === today.getDate();
      });
      setAnniversaries(annis);
      setIsLoading(false);
    });

    // Real Trending Signals (Engaged Posts)
    const trendingQuery = query(collection(db, 'posts'), orderBy('likes', 'desc'), limit(3));
    const unsubTrending = onSnapshot(trendingQuery, (snap) => {
      setTrendingPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Post)));
    });

    return () => {
      unsubUsers();
      unsubTrending();
    };
  }, [userData?.id]);

  const PRESENCE_DOTS: Record<PresenceStatus, string> = {
    'Online': 'bg-[#10b981]',
    'Focus': 'bg-[#f59e0b]',
    'Deep Work': 'bg-[#e11d48]',
    'In-Transit': 'bg-[#6366f1]',
    'Away': 'bg-[#94a3b8]',
    'Invisible': 'bg-[#334155]',
    'Syncing': 'bg-[#60a5fa]'
  };

  return (
    <aside className="hidden xl:flex flex-col w-[380px] shrink-0 bg-[#f8fafc] border-l border-precision h-full pt-[calc(var(--header-h)+1rem)] pb-8 overflow-hidden">
      
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 space-y-10">
        
        {/* COMMAND MODULE: Neural Status Hub (V3 Refined) */}
        <div className="bg-white rounded-[3rem] p-8 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.06)] border border-slate-100 transition-all duration-500">
           
           {/* Header Info */}
           <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-[1.5rem] flex items-center justify-center text-4xl shadow-sm">
                {localStatus.statusEmoji}
              </div>
              <div className="flex-1 min-w-0">
                <input 
                  type="text"
                  value={localStatus.statusMessage}
                  onChange={(e) => setLocalStatus(prev => ({ ...prev, statusMessage: e.target.value }))}
                  onBlur={() => updateNeuralStatus({ statusMessage: localStatus.statusMessage })}
                  placeholder="Broadcast status..."
                  className="w-full bg-transparent border-none p-0 text-xl font-extrabold text-slate-900 focus:ring-0 placeholder:text-slate-300 tracking-tight"
                />
                <div className="flex items-center gap-2 mt-2">
                   <div className={`w-2 h-2 rounded-full ${PRESENCE_DOTS[localStatus.presenceStatus as PresenceStatus]}`} />
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] font-mono">
                     {localStatus.presenceStatus}
                   </span>
                </div>
              </div>
           </div>

           {/* Quick Signal Grid */}
           <div className="space-y-4 mb-10">
             <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] font-mono ml-1">Quick_Signals</h4>
             <div className="grid grid-cols-6 gap-3">
               {IDENTITY_SIGNALS.map(signal => (
                 <button 
                   key={signal}
                   onClick={() => updateNeuralStatus({ statusEmoji: signal })}
                   className={`aspect-square rounded-full flex items-center justify-center text-xl transition-all active:scale-90 relative ${localStatus.statusEmoji === signal ? 'bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.4)] scale-110 z-10' : 'bg-slate-50 hover:bg-slate-100 text-slate-400'}`}
                 >
                   {signal}
                 </button>
               ))}
             </div>
           </div>

           {/* Presence Pills */}
           <div className="flex flex-wrap gap-2 pt-6 border-t border-slate-50">
             {['Online', 'Focus', 'Deep Work', 'Invisible'].map(status => (
               <button 
                 key={status}
                 onClick={() => updateNeuralStatus({ presenceStatus: status as PresenceStatus })}
                 className={`px-4 py-2.5 rounded-full border transition-all flex items-center gap-2.5 ${localStatus.presenceStatus === status ? 'bg-white border-indigo-100 shadow-sm' : 'bg-transparent border-slate-100 hover:border-slate-200'}`}
               >
                 <div className={`w-2 h-2 rounded-full ${PRESENCE_DOTS[status as PresenceStatus]}`} />
                 <span className={`text-[10px] font-black uppercase tracking-widest font-mono ${localStatus.presenceStatus === status ? 'text-slate-900' : 'text-slate-400'}`}>
                   {status}
                 </span>
               </button>
             ))}
           </div>
        </div>

        {/* SECTION: Trending Signals (Real Pulse) */}
        {trendingPosts.length > 0 && (
          <div className="space-y-6">
            <h4 className="px-2 text-[11px] font-black text-slate-400 uppercase tracking-widest font-mono">Trending_Transmissions</h4>
            <div className="space-y-6">
              {trendingPosts.map(post => (
                <div key={post.id} className="flex gap-5 group cursor-pointer p-2 rounded-3xl hover:bg-white transition-all">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-precision shadow-sm bg-slate-100">
                    {post.media?.[0]?.url ? (
                      <img src={post.media[0].url} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-200"><ICONS.Explore /></div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <p className="text-sm font-extrabold text-slate-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2 tracking-tight">
                      {post.content || "Neural Signal Entry..."}
                    </p>
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">{post.likes} Pulses</span>
                       <span className="w-1 h-1 bg-slate-200 rounded-full" />
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">LIVE</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION: Temporal Milestones (Real Events) */}
        {anniversaries.length > 0 && (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-700">
             <h4 className="px-2 text-[11px] font-black text-slate-400 uppercase tracking-widest font-mono">Temporal_Nodes</h4>
             <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-[2.5rem] p-6 flex items-start gap-5">
                <div className="p-4 bg-white rounded-2xl shadow-sm text-indigo-600 shrink-0">
                   <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M11.7 2.02c-0.11-0.01-0.23-0.02-0.34-0.02-3.14 0-5.71 2.53-5.71 5.65 0 0.8 0.17 1.57 0.48 2.27H3.45c-1.1 0-2 0.9-2 2v2c0 1.1 0.9 2 2 2v5c0 1.1 0.9 2 2 2h13c1.1 0 2-0.9 2-2v-5c1.1 0 2-0.9 2-2v-2c0-1.1-0.9-2-2-2h-2.68c0.31-0.7 0.48-1.47 0.48-2.27 0-3.12-2.57-5.65-5.71-5.65-0.12 0-0.23 0.01-0.34 0.02zM12 4.02c1.86 0 3.37 1.48 3.37 3.31 0 0.28-0.04 0.54-0.12 0.8-0.33 1.05-1.12 1.88-2.13 2.26L12 10.74l-1.12-0.35c-1.01-0.38-1.8-1.21-2.13-2.26-0.08-0.26-0.12-0.52-0.12-0.8 0-1.83 1.51-3.31 3.37-3.31z"/></svg>
                </div>
                <div className="flex-1">
                   <p className="text-sm font-bold text-slate-900 leading-snug">
                    {anniversaries[0].displayName} is celebrating a system identity milestone.
                   </p>
                   <button className="mt-3 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Synchronise Congratulations</button>
                </div>
             </div>
          </div>
        )}

        {/* SECTION: Active Contacts Grid */}
        <div className="space-y-6">
           <div className="flex items-center justify-between px-2">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest font-mono">Active_Grid_Nodes</h4>
              <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><ICONS.Search /></button>
           </div>

           <div className="space-y-1">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                    <div className="w-11 h-11 bg-slate-100 rounded-xl" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                ))
              ) : activeContacts.length > 0 ? (
                activeContacts.map(node => (
                  <button 
                    key={node.id}
                    className="w-full flex items-center justify-between p-4 hover:bg-white hover:shadow-sm border border-transparent hover:border-precision rounded-2xl transition-all group active:scale-95"
                  >
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="relative shrink-0">
                        <img src={node.avatarUrl} className="w-11 h-11 rounded-xl object-cover bg-slate-50 border border-slate-100" alt="" />
                        <div className="absolute -bottom-1 -right-1">
                           <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${node.presenceStatus ? PRESENCE_DOTS[node.presenceStatus] : 'bg-slate-300'}`} />
                        </div>
                      </div>
                      <div className="text-left overflow-hidden">
                         <p className="text-sm font-extrabold text-slate-900 truncate tracking-tight">{node.displayName}</p>
                         <p className="text-[10px] text-slate-400 font-bold truncate mt-1 tracking-tight font-mono">
                           {node.statusEmoji} {node.statusMessage || node.presenceStatus.toUpperCase()}
                         </p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-12 text-center px-6">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest font-mono italic leading-relaxed">Searching for regional neighbors...</p>
                </div>
              )}
           </div>
        </div>

        {/* FOOTER: System Diagnostics */}
        <div className="pt-10 pb-6 border-t border-slate-100 px-2">
           <div className="flex flex-wrap gap-x-6 gap-y-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">
             <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
             <a href="#" className="hover:text-indigo-600 transition-colors">Terms</a>
             <a href="#" className="hover:text-indigo-600 transition-colors">Infrastructure</a>
           </div>
           <div className="space-y-2 opacity-30">
             <p className="text-[9px] font-black text-slate-900 uppercase tracking-[0.4em] font-mono leading-tight">
               VibeStream_GB_LON_01
             </p>
             <p className="text-[9px] font-black text-slate-900 uppercase tracking-[0.4em] font-mono">
               Node: 2.6.26 • © 2026
             </p>
           </div>
        </div>

      </div>
    </aside>
  );
};
