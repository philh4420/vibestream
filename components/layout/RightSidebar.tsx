
import React, { useState, useEffect } from 'react';
import { db, auth } from '../../services/firebase';
import { 
  collection, 
  query, 
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { User as VibeUser, PresenceStatus, Post } from '../../types';
import { ICONS } from '../../constants';

interface RightSidebarProps {
  userData: VibeUser | null;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ userData }) => {
  const [activeContacts, setActiveContacts] = useState<VibeUser[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!db) return;
    setIsLoading(true);
    
    const usersQuery = query(collection(db, 'users'), limit(12), orderBy('joinedAt', 'desc'));
    const unsubUsers = onSnapshot(usersQuery, (snap) => {
      const fetched = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as VibeUser))
        .filter(user => user.id !== auth.currentUser?.uid);
      setActiveContacts(fetched);
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
        
        {/* Removed redundant 'My_Signal_Node' as requested. Status is now managed in the Header & Dropdown. */}

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
                         {node.statusEmoji} {node.statusMessage || (node.presenceStatus ? node.presenceStatus.toUpperCase() : 'OFFLINE')}
                       </p>
                    </div>
                  </div>
                </button>
              ))}
           </div>
        </div>
      </div>
    </aside>
  );
};
