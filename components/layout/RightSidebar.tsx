
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
  where,
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
    
    // 1. Live Sync Active Contacts
    const usersQuery = query(collection(db, 'users'), limit(12), orderBy('joinedAt', 'desc'));
    const unsubUsers = onSnapshot(usersQuery, (snap) => {
      const fetched = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as VibeUser))
        .filter(user => user.id !== auth.currentUser?.uid);
      setActiveContacts(fetched);

      // Check for Anniversaries
      const today = new Date();
      const annis = fetched.filter(u => {
         if (!u.joinedAt) return false;
         const jDate = new Date(u.joinedAt);
         return jDate.getMonth() === today.getMonth() && jDate.getDate() === today.getDate();
      });
      setAnniversaries(annis);
      setIsLoading(false);
    });

    // 2. Fetch Real Trending Signals (Posts with high pulse)
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
    'Online': 'bg-emerald-500',
    'Focus': 'bg-amber-500',
    'Deep Work': 'bg-rose-600',
    'In-Transit': 'bg-indigo-600',
    'Away': 'bg-slate-400',
    'Invisible': 'bg-slate-700',
    'Syncing': 'bg-blue-400'
  };

  return (
    <aside className="hidden xl:flex flex-col w-[340px] shrink-0 bg-[#f8fafc] border-l border-precision h-full pt-[calc(var(--header-h)+0.5rem)] pb-6 overflow-hidden">
      
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 space-y-8">
        
        {/* SECTION: Neural Status Control (Professional v2) */}
        <div className="space-y-4">
           <div className="flex items-center justify-between px-2">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">My_Neural_Signal</h4>
             <div className="flex items-center gap-2">
                {isUpdatingStatus && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />}
                <span className={`text-[8px] font-bold ${isUpdatingStatus ? 'text-indigo-500' : 'text-emerald-500'}`}>
                  {isUpdatingStatus ? 'SYNCING' : 'BROADCASTING'}
                </span>
             </div>
           </div>
           
           <div className="bg-white border-precision rounded-[2.5rem] p-6 shadow-sm hover:shadow-md transition-all duration-500">
              <div className="flex items-center gap-4 mb-6">
                 <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                   {localStatus.statusEmoji}
                 </div>
                 <div className="flex-1">
                   <input 
                     type="text"
                     value={localStatus.statusMessage}
                     onChange={(e) => setLocalStatus(prev => ({ ...prev, statusMessage: e.target.value }))}
                     onBlur={() => updateNeuralStatus({ statusMessage: localStatus.statusMessage })}
                     placeholder="Update your signal..."
                     className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-900 focus:ring-0 placeholder:text-slate-300"
                   />
                   <div className="flex items-center gap-1.5 mt-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${PRESENCE_DOTS[localStatus.presenceStatus as PresenceStatus]}`} />
                      <p className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-tight">
                        {localStatus.presenceStatus}
                      </p>
                   </div>
                 </div>
              </div>

              {/* Signals Grid (The icons the user asked for) */}
              <div className="space-y-4">
                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest font-mono">Quick_Signals</p>
                <div className="grid grid-cols-6 gap-2">
                  {IDENTITY_SIGNALS.map(signal => (
                    <button 
                      key={signal}
                      onClick={() => updateNeuralStatus({ statusEmoji: signal })}
                      className={`h-9 rounded-xl flex items-center justify-center text-lg transition-all active:scale-90 ${localStatus.statusEmoji === signal ? 'bg-indigo-600 shadow-lg shadow-indigo-100' : 'bg-slate-50 hover:bg-slate-100 text-slate-400'}`}
                    >
                      {signal}
                    </button>
                  ))}
                </div>
              </div>

              {/* Presence Modes */}
              <div className="mt-6 flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {(Object.keys(PRESENCE_CONFIG) as PresenceStatus[]).map(status => (
                  <button 
                    key={status}
                    onClick={() => updateNeuralStatus({ presenceStatus: status })}
                    className={`shrink-0 h-8 px-3 rounded-full border transition-all flex items-center gap-2 ${localStatus.presenceStatus === status ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200'}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${localStatus.presenceStatus === status ? 'bg-white' : PRESENCE_CONFIG[status].color}`} />
                    <span className="text-[8px] font-black uppercase tracking-widest">{status}</span>
                  </button>
                ))}
              </div>
           </div>
        </div>

        {/* SECTION: Trending Transmissions (Real Data, No Mocks) */}
        {trendingPosts.length > 0 && (
          <div className="space-y-4">
            <h4 className="px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Trending_Signals</h4>
            <div className="space-y-4">
              {trendingPosts.map(post => (
                <div key={post.id} className="flex gap-4 group cursor-pointer p-2 rounded-2xl hover:bg-white transition-all">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-precision shadow-sm bg-slate-100">
                    {post.media?.[0]?.url ? (
                      <img src={post.media[0].url} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-200"><ICONS.Explore /></div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <p className="text-[11px] font-black text-slate-900 leading-tight mb-1 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {post.content || "Neural Signal..."}
                    </p>
                    <div className="flex items-center gap-2">
                       <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">{post.likes} Pulses</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION: Identity Anniversaries (Real Data) */}
        {anniversaries.length > 0 && (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
             <h4 className="px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Temporal_Milestones</h4>
             <div className="bg-indigo-50/30 border border-indigo-100/50 rounded-[2rem] p-5 flex items-start gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600">
                   <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.7 2.02c-0.11-0.01-0.23-0.02-0.34-0.02-3.14 0-5.71 2.53-5.71 5.65 0 0.8 0.17 1.57 0.48 2.27H3.45c-1.1 0-2 0.9-2 2v2c0 1.1 0.9 2 2 2v5c0 1.1 0.9 2 2 2h13c1.1 0 2-0.9 2-2v-5c1.1 0 2-0.9 2-2v-2c0-1.1-0.9-2-2-2h-2.68c0.31-0.7 0.48-1.47 0.48-2.27 0-3.12-2.57-5.65-5.71-5.65-0.12 0-0.23 0.01-0.34 0.02zM12 4.02c1.86 0 3.37 1.48 3.37 3.31 0 0.28-0.04 0.54-0.12 0.8-0.33 1.05-1.12 1.88-2.13 2.26L12 10.74l-1.12-0.35c-1.01-0.38-1.8-1.21-2.13-2.26-0.08-0.26-0.12-0.52-0.12-0.8 0-1.83 1.51-3.31 3.37-3.31z"/></svg>
                </div>
                <div className="flex-1">
                   <p className="text-[11px] font-bold text-slate-800 leading-tight">
                    {anniversaries[0].displayName} is celebrating an identity milestone today.
                   </p>
                   <button className="mt-3 text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Transmit Signal</button>
                </div>
             </div>
          </div>
        )}

        {/* SECTION: Active Grid Nodes (Contacts) */}
        <div className="space-y-4">
           <div className="flex items-center justify-between px-2">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Active_Grid_Nodes</h4>
              <div className="flex items-center gap-1">
                 <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><ICONS.Search /></button>
                 <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><ICONS.Settings /></button>
              </div>
           </div>

           <div className="space-y-1">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                    <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                  </div>
                ))
              ) : activeContacts.length > 0 ? (
                activeContacts.map(node => (
                  <button 
                    key={node.id}
                    className="w-full flex items-center justify-between p-3 hover:bg-white hover:shadow-sm border border-transparent hover:border-precision rounded-2xl transition-all group active:scale-95"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="relative shrink-0">
                        <img src={node.avatarUrl} className="w-10 h-10 rounded-xl object-cover bg-slate-50 border border-slate-100" alt="" />
                        <div className="absolute -bottom-1 -right-1">
                           <div className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${node.presenceStatus ? PRESENCE_DOTS[node.presenceStatus] : 'bg-slate-300'}`} />
                        </div>
                      </div>
                      <div className="text-left overflow-hidden">
                         <p className="text-sm font-extrabold text-slate-900 truncate tracking-tight">{node.displayName}</p>
                         <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                           {node.statusEmoji} {node.statusMessage || node.presenceStatus}
                         </p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-10 text-center px-4">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest font-mono italic">Searching for neighboring nodes...</p>
                </div>
              )}
           </div>
        </div>

        {/* FOOTER: System Integrity */}
        <div className="pt-10 pb-4 border-t border-slate-100">
           <div className="flex flex-wrap gap-x-4 gap-y-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-6 px-2">
             <a href="#" className="hover:text-indigo-600">Privacy</a>
             <a href="#" className="hover:text-indigo-600">Terms</a>
             <a href="#" className="hover:text-indigo-600">Cookies</a>
             <a href="#" className="hover:text-indigo-600">Infrastructure</a>
           </div>
           <p className="px-2 text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] font-mono leading-relaxed">
             VibeStream_GB_01<br />
             Core_Node: 2.6.26 • © 2026
           </p>
        </div>

      </div>
    </aside>
  );
};
