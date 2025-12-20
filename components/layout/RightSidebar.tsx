
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
  const [isHubOpen, setIsHubOpen] = useState(false);

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
    
    const usersQuery = query(collection(db, 'users'), limit(12), orderBy('joinedAt', 'desc'));
    const unsubUsers = onSnapshot(usersQuery, (snap) => {
      const fetched = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as VibeUser))
        .filter(user => user.id !== auth.currentUser?.uid);
      setActiveContacts(fetched);

      const today = new Date();
      const annis = fetched.filter(u => {
         if (!u.joinedAt) return false;
         const jDate = new Date(u.joinedAt);
         return jDate.getMonth() === today.getMonth() && jDate.getDate() === today.getDate();
      });
      setAnniversaries(annis);
      setIsLoading(false);
    });

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
        
        {/* COMPACT TRIGGER: Neural Signal Node */}
        <div className="space-y-4">
           <div className="flex items-center justify-between px-2">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">My_Signal_Node</h4>
             <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isUpdatingStatus ? 'bg-indigo-500 animate-ping' : 'bg-emerald-500'}`} />
                <span className="text-[8px] font-bold text-slate-400 font-mono">EN-GB_UPLINK</span>
             </div>
           </div>

           <button 
            onClick={() => setIsHubOpen(true)}
            className="w-full bg-white border-precision rounded-[2rem] p-5 shadow-sm hover:shadow-md transition-all duration-300 group text-left relative overflow-hidden active:scale-95"
           >
              <div className="flex items-center gap-4 relative z-10">
                 <div className="relative">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-2xl shadow-inner border border-slate-100">
                      {localStatus.statusEmoji}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${PRESENCE_DOTS[localStatus.presenceStatus as PresenceStatus]}`} />
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold text-slate-900 truncate tracking-tight">
                      {localStatus.statusMessage || "Broadcast status..."}
                    </p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono mt-0.5">
                      {localStatus.presenceStatus}
                    </p>
                 </div>
                 <div className="p-2 text-slate-300 group-hover:text-indigo-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v12m6-6H6" /></svg>
                 </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/0 via-indigo-50/0 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
           </button>
        </div>

        {/* SECTION: Trending Pulse */}
        {trendingPosts.length > 0 && (
          <div className="space-y-6">
            <h4 className="px-2 text-[11px] font-black text-slate-400 uppercase tracking-widest font-mono">Trending_Signals</h4>
            <div className="space-y-5">
              {trendingPosts.map(post => (
                <div key={post.id} className="flex gap-4 group cursor-pointer p-2 rounded-2xl hover:bg-white transition-all">
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border-precision shadow-sm bg-slate-100">
                    {post.media?.[0]?.url ? (
                      <img src={post.media[0].url} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-200"><ICONS.Explore /></div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <p className="text-[12px] font-bold text-slate-900 leading-snug mb-1 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {post.content || "Neural Signal Entry..."}
                    </p>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] font-mono">{post.likes} PULSES</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION: Active Contacts */}
        <div className="space-y-6">
           <div className="flex items-center justify-between px-2">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest font-mono">Active_Grid</h4>
              <button className="p-1.5 text-slate-300 hover:text-indigo-600 transition-colors"><ICONS.Search /></button>
           </div>

           <div className="space-y-1">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                    <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                  </div>
                ))
              ) : activeContacts.map(node => (
                <button 
                  key={node.id}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-white hover:shadow-sm border border-transparent hover:border-precision rounded-2xl transition-all group active:scale-95"
                >
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="relative shrink-0">
                      <img src={node.avatarUrl} className="w-10 h-10 rounded-xl object-cover bg-slate-50 border border-slate-100 shadow-sm" alt="" />
                      <div className="absolute -bottom-1 -right-1">
                         <div className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${node.presenceStatus ? PRESENCE_DOTS[node.presenceStatus] : 'bg-slate-300'}`} />
                      </div>
                    </div>
                    <div className="text-left overflow-hidden">
                       <p className="text-sm font-extrabold text-slate-900 truncate tracking-tight">{node.displayName}</p>
                       <p className="text-[10px] text-slate-400 font-bold truncate mt-0.5 tracking-tight font-mono">
                         {node.statusEmoji} {node.statusMessage || node.presenceStatus.toUpperCase()}
                       </p>
                    </div>
                  </div>
                </button>
              ))}
           </div>
        </div>
      </div>

      {/* NEURAL STATUS OVERLAY: High Fidelity Command Hub */}
      {isHubOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-2xl" onClick={() => setIsHubOpen(false)}></div>
           
           <div className="relative bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] border border-white/20 animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 overflow-hidden">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              
              <div className="relative z-10">
                 {/* Header & Status Entry */}
                 <div className="flex items-center gap-6 mb-10">
                    <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-[1.5rem] flex items-center justify-center text-5xl shadow-inner group">
                      {localStatus.statusEmoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <input 
                        autoFocus
                        type="text"
                        value={localStatus.statusMessage}
                        onChange={(e) => setLocalStatus(prev => ({ ...prev, statusMessage: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && setIsHubOpen(false)}
                        placeholder="Current signal..."
                        className="w-full bg-transparent border-none p-0 text-2xl font-black text-slate-900 focus:ring-0 placeholder:text-slate-200 tracking-tighter italic"
                      />
                      <div className="flex items-center gap-2 mt-2">
                         <div className={`w-2 h-2 rounded-full ${PRESENCE_DOTS[localStatus.presenceStatus as PresenceStatus]}`} />
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono">
                           {localStatus.presenceStatus}
                         </span>
                      </div>
                    </div>
                 </div>

                 {/* Quick Signals Grid */}
                 <div className="space-y-4 mb-10">
                   <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] font-mono ml-1">Quick_Transmissions</h4>
                   <div className="grid grid-cols-6 gap-3">
                     {IDENTITY_SIGNALS.map(signal => (
                       <button 
                         key={signal}
                         onClick={() => updateNeuralStatus({ statusEmoji: signal })}
                         className={`aspect-square rounded-full flex items-center justify-center text-xl transition-all active:scale-90 relative ${localStatus.statusEmoji === signal ? 'bg-indigo-600 shadow-[0_10px_30px_rgba(79,70,229,0.4)] scale-110 z-10' : 'bg-slate-50 hover:bg-slate-100 text-slate-400'}`}
                       >
                         {signal}
                       </button>
                     ))}
                   </div>
                 </div>

                 {/* Presence Selectors */}
                 <div className="space-y-4 pt-8 border-t border-slate-50">
                    <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] font-mono ml-1">Signal_Modality</h4>
                    <div className="flex flex-wrap gap-2">
                      {['Online', 'Focus', 'Deep Work', 'Invisible'].map(status => (
                        <button 
                          key={status}
                          onClick={() => updateNeuralStatus({ presenceStatus: status as PresenceStatus })}
                          className={`px-5 py-3 rounded-full border transition-all flex items-center gap-3 ${localStatus.presenceStatus === status ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                        >
                          <div className={`w-2 h-2 rounded-full ${PRESENCE_DOTS[status as PresenceStatus]}`} />
                          <span className="text-[10px] font-black uppercase tracking-widest font-mono">
                            {status}
                          </span>
                        </button>
                      ))}
                    </div>
                 </div>

                 {/* Footer Action */}
                 <button 
                  onClick={() => { updateNeuralStatus({ statusMessage: localStatus.statusMessage }); setIsHubOpen(false); }}
                  className="w-full mt-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
                 >
                   Confirm_Neural_Sync
                 </button>
              </div>
           </div>
        </div>
      )}
    </aside>
  );
};
