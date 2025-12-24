
import React, { useState, useEffect } from 'react';
import { db, auth } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { 
  collection, 
  query, 
  orderBy,
  limit,
  onSnapshot,
  doc,
  writeBatch,
  serverTimestamp,
  increment,
  addDoc,
  where,
  getDocs
} = Firestore as any;
import { User as VibeUser, PresenceStatus, Post, WeatherInfo, AppRoute } from '../../types';
import { ICONS } from '../../constants';

interface RightSidebarProps {
  userData: VibeUser | null;
  weather: WeatherInfo | null;
  onNavigate: (route: AppRoute) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ userData, weather, onNavigate }) => {
  const [activeContacts, setActiveContacts] = useState<VibeUser[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [systemTime, setSystemTime] = useState(new Date());
  const [uptime, setUptime] = useState('00:00:00');
  const [contactFilter, setContactFilter] = useState<'all' | 'online'>('all');
  
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // System Time & Uptime Logic
  useEffect(() => {
    let sessionStart = parseInt(localStorage.getItem('vibestream_session_start_timestamp') || '0', 10);
    if (!sessionStart) {
      sessionStart = Date.now();
      localStorage.setItem('vibestream_session_start_timestamp', sessionStart.toString());
    }
    
    const timer = setInterval(() => {
      const now = new Date();
      setSystemTime(now);
      
      const diff = Math.floor((now.getTime() - sessionStart) / 1000);
      if (isNaN(diff)) return;

      const h = Math.floor(diff / 3600).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
      const s = (diff % 60).toString().padStart(2, '0');
      setUptime(`${h}:${m}:${s}`);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch Following List
  useEffect(() => {
    if (!userData?.id || !db) return;
    const q = collection(db, 'users', userData.id, 'following');
    const unsub = onSnapshot(q, (snap: any) => {
      const ids = new Set<string>(snap.docs.map((d: any) => String(d.id)));
      setFollowingIds(ids);
    });
    return () => unsub();
  }, [userData?.id]);

  // Fetch Active Contacts & Trending
  useEffect(() => {
    if (!db) return;
    setIsLoading(true);

    // Simplified query to ensure data appears even without complex indexes
    const usersQuery = query(collection(db, 'users'), limit(30));
    
    const unsubUsers = onSnapshot(usersQuery, (snap: any) => {
      const fetched = snap.docs
        .map((doc: any) => ({ id: doc.id, ...doc.data() } as VibeUser))
        .filter((user: VibeUser) => user.id !== auth.currentUser?.uid);
      
      // Client-side sort to prioritize Online users, then verified, then new
      fetched.sort((a: VibeUser, b: VibeUser) => {
        if (a.presenceStatus === 'Online' && b.presenceStatus !== 'Online') return -1;
        if (b.presenceStatus === 'Online' && a.presenceStatus !== 'Online') return 1;
        if (a.verifiedHuman && !b.verifiedHuman) return -1;
        if (!a.verifiedHuman && b.verifiedHuman) return 1;
        return 0;
      });

      setActiveContacts(fetched);
      setIsLoading(false);
    });

    const trendingQuery = query(collection(db, 'posts'), orderBy('likes', 'desc'), limit(5));
    const unsubTrending = onSnapshot(trendingQuery, (snap: any) => {
      setTrendingPosts(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Post)));
    });

    return () => {
      unsubUsers();
      unsubTrending();
    };
  }, [userData?.id]);

  const handleFollowToggle = async (targetUser: VibeUser) => {
    if (!db || !auth.currentUser || processingIds.has(targetUser.id)) return;
    
    const currentUser = auth.currentUser;
    const isFollowing = followingIds.has(targetUser.id);
    setProcessingIds(prev => new Set(prev).add(targetUser.id));

    try {
      const batch = writeBatch(db);
      const myRef = doc(db, 'users', currentUser.uid, 'following', targetUser.id);
      const theirRef = doc(db, 'users', targetUser.id, 'followers', currentUser.uid);
      
      if (isFollowing) {
        batch.delete(myRef);
        batch.delete(theirRef);
        batch.update(doc(db, 'users', currentUser.uid), { following: increment(-1) });
        batch.update(doc(db, 'users', targetUser.id), { followers: increment(-1) });
      } else {
        batch.set(myRef, { linkedAt: serverTimestamp() });
        batch.set(theirRef, { linkedAt: serverTimestamp() });
        batch.update(doc(db, 'users', currentUser.uid), { following: increment(1) });
        batch.update(doc(db, 'users', targetUser.id), { followers: increment(1) });
        
        const notifRef = doc(collection(db, 'notifications'));
        batch.set(notifRef, {
          type: 'follow',
          fromUserId: currentUser.uid,
          fromUserName: currentUser.displayName || 'Neural Node',
          fromUserAvatar: currentUser.photoURL || '',
          toUserId: targetUser.id,
          text: 'established a neural link with you',
          isRead: false,
          timestamp: serverTimestamp(),
          pulseFrequency: 'cognition'
        });
      }
      await batch.commit();
      window.dispatchEvent(new CustomEvent('vibe-toast', { 
        detail: { msg: isFollowing ? `Link Severed: ${targetUser.displayName}` : `Linked to ${targetUser.displayName}`, type: isFollowing ? 'info' : 'success' } 
      }));
    } catch (e) {
      console.error(e);
      window.dispatchEvent(new CustomEvent('vibe-toast', { detail: { msg: "Connection Protocol Failed", type: 'error' } }));
    } finally {
      setProcessingIds(prev => { const s = new Set(prev); s.delete(targetUser.id); return s; });
    }
  };

  const handleMessage = async (targetUser: VibeUser) => {
    if (!db || !auth.currentUser) return;
    try {
      const q = query(
        collection(db, 'chats'), 
        where('participants', 'array-contains', auth.currentUser.uid)
      );
      const snap = await getDocs(q);
      const existingChat = snap.docs.find((d: any) => {
        const data = d.data();
        return !data.isCluster && data.participants.includes(targetUser.id);
      });

      if (existingChat) {
        onNavigate(AppRoute.MESSAGES);
      } else {
        const participantData = {
          [auth.currentUser.uid]: { 
            displayName: auth.currentUser.displayName, 
            avatarUrl: auth.currentUser.photoURL 
          },
          [targetUser.id]: { 
            displayName: targetUser.displayName, 
            avatarUrl: targetUser.avatarUrl 
          }
        };

        await addDoc(collection(db, 'chats'), {
          participants: [auth.currentUser.uid, targetUser.id],
          participantData,
          lastMessage: 'Link established.',
          lastMessageTimestamp: serverTimestamp(),
          isCluster: false
        });
        
        onNavigate(AppRoute.MESSAGES);
        window.dispatchEvent(new CustomEvent('vibe-toast', { detail: { msg: "Secure Channel Opened", type: 'success' } }));
      }
    } catch (e) {
      window.dispatchEvent(new CustomEvent('vibe-toast', { detail: { msg: "Comms Link Failed", type: 'error' } }));
    }
  };

  const handleViewPost = (post: Post) => {
    window.dispatchEvent(new CustomEvent('vibe-view-post', { detail: { post } }));
  };

  const PRESENCE_DOTS: Record<PresenceStatus, string> = {
    'Online': 'bg-[#10b981]',
    'Focus': 'bg-[#f59e0b]',
    'Deep Work': 'bg-[#e11d48]',
    'In-Transit': 'bg-[#6366f1]',
    'Away': 'bg-[#94a3b8]',
    'Invisible': 'bg-[#334155]',
    'Syncing': 'bg-[#60a5fa]',
    'Offline': 'bg-slate-300'
  };

  const filteredContacts = contactFilter === 'online' 
    ? activeContacts.filter(u => ['Online', 'Focus', 'Deep Work', 'Syncing'].includes(u.presenceStatus || ''))
    : activeContacts;

  return (
    <aside className="hidden lg:flex flex-col w-[320px] xl:w-[380px] shrink-0 bg-[#f8fafc] border-l border-precision h-full overflow-hidden">
      
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 space-y-8 py-8">
        
        {/* 1. SYSTEM MONITOR WIDGET */}
        <div className="bg-slate-950 rounded-[2.5rem] p-6 text-white shadow-2xl relative overflow-hidden group border border-white/5">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/20 blur-[80px] rounded-full translate-x-1/3 -translate-y-1/2" />
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                   <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest font-mono">GRID_ONLINE</p>
                </div>
                <h3 className="text-xl font-black italic uppercase tracking-tighter leading-none">System_Link</h3>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-mono font-bold text-slate-400">{uptime}</p>
              </div>
            </div>

            {/* Network Visualization */}
            <div className="h-10 flex items-end gap-1 mb-6 opacity-60 group-hover:opacity-100 transition-opacity">
               {Array.from({ length: 20 }).map((_, i) => (
                 <div 
                   key={i} 
                   className="flex-1 bg-indigo-500/40 rounded-t-sm" 
                   style={{ 
                     height: `${20 + Math.random() * 80}%`,
                     transition: 'height 0.5s ease-in-out'
                   }} 
                 />
               ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div className="bg-white/5 rounded-xl p-3 border border-white/5 backdrop-blur-sm">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1">Local_Time</p>
                  <p className="text-sm font-bold font-mono text-white">
                    {systemTime.toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                  </p>
               </div>
               <div className="bg-white/5 rounded-xl p-3 border border-white/5 backdrop-blur-sm">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1">Atmos</p>
                  <p className="text-sm font-bold font-mono text-white flex items-center gap-2">
                    {weather?.temp || '--'}°C 
                    {weather?.icon && <img src={`https://openweathermap.org/img/wn/${weather.icon}.png`} className="w-4 h-4 brightness-200" alt="" />}
                  </p>
               </div>
            </div>
          </div>
        </div>

        {/* 2. TOP SIGNALS (TRENDING) */}
        {trendingPosts.length > 0 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Top_Signals</h4>
              </div>
              <span className="text-[8px] font-black text-slate-300 font-mono bg-slate-50 px-2 py-0.5 rounded-md">LIVE</span>
            </div>
            
            <div className="space-y-3">
              {trendingPosts.map((post, idx) => (
                <div 
                  key={post.id} 
                  onClick={() => handleViewPost(post)}
                  className={`group relative flex items-center gap-3 p-3 rounded-[1.5rem] border transition-all cursor-pointer ${
                    idx === 0 
                      ? 'bg-gradient-to-br from-white to-indigo-50/30 border-indigo-100 shadow-md' 
                      : 'bg-white border-slate-100 hover:border-indigo-100 hover:shadow-lg'
                  }`}
                >
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-100 shadow-inner">
                    {post.media?.[0]?.url ? (
                      <img src={post.media[0].url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 scale-75"><ICONS.Explore /></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                       <p className="text-[9px] font-black text-slate-950 uppercase tracking-tight truncate">{post.authorName}</p>
                       {idx === 0 && <span className="text-[7px] font-black text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded uppercase tracking-widest">#1</span>}
                    </div>
                    <p className="text-[10px] font-medium text-slate-500 truncate leading-none italic group-hover:text-indigo-600 transition-colors">
                      "{post.content || 'Media Signal'}"
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                       <div className="h-0.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min((post.likes / 50) * 100, 100)}%` }} />
                       </div>
                       <span className="text-[7px] font-black text-slate-300 font-mono">{post.likes}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. ACTIVE NODES (CONTACTS) */}
        <div className="space-y-5">
           <div className="flex items-center justify-between px-2">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Active_Nodes</h4>
              <div className="flex bg-slate-100 p-0.5 rounded-lg">
                 <button 
                   onClick={() => setContactFilter('all')}
                   className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${contactFilter === 'all' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                   All
                 </button>
                 <button 
                   onClick={() => setContactFilter('online')}
                   className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${contactFilter === 'online' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                   Live
                 </button>
              </div>
           </div>

           <div className="space-y-2">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-50">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl animate-pulse" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-2 bg-slate-100 rounded w-1/2 animate-pulse" />
                      <div className="h-1.5 bg-slate-50 rounded w-1/3 animate-pulse" />
                    </div>
                  </div>
                ))
              ) : filteredContacts.length === 0 ? (
                <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-[1.5rem]">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] font-mono italic">No Nodes Detected</p>
                </div>
              ) : (
                filteredContacts.slice(0, 15).map(node => {
                  const isFollowing = followingIds.has(node.id);
                  const isProcessing = processingIds.has(node.id);
                  
                  return (
                    <div 
                      key={node.id}
                      className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all duration-300 group hover:shadow-md"
                    >
                      <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
                        <div className="relative shrink-0">
                          <img src={node.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${node.id}`} className="w-10 h-10 rounded-xl object-cover border border-slate-100 bg-slate-50" alt="" />
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${PRESENCE_DOTS[node.presenceStatus || 'Invisible']}`} />
                        </div>
                        <div className="text-left overflow-hidden flex-1">
                           <div className="flex items-center gap-1.5">
                             <p className="text-[11px] font-black text-slate-900 truncate tracking-tight group-hover:text-indigo-600 transition-colors">
                               {node.displayName}
                             </p>
                             {node.verifiedHuman && <div className="text-indigo-500 scale-[0.6]"><ICONS.Verified /></div>}
                           </div>
                           <p className="text-[9px] text-slate-400 font-medium truncate tracking-tight opacity-80">
                             {node.statusEmoji} {node.statusMessage || node.presenceStatus}
                           </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0 pl-2">
                        <button 
                          onClick={() => handleFollowToggle(node)}
                          disabled={isProcessing}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all shadow-sm ${isFollowing ? 'bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200' : 'bg-slate-900 text-white hover:bg-indigo-600'}`}
                          title={isFollowing ? 'Unlink' : 'Link'}
                        >
                          {isProcessing ? (
                            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                              {isFollowing 
                                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> 
                                : <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                              }
                            </svg>
                          )}
                        </button>
                        <button 
                          onClick={() => handleMessage(node)}
                          className="w-7 h-7 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg flex items-center justify-center transition-all shadow-sm"
                          title="Message"
                        >
                          <ICONS.Messages />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
           </div>
        </div>

        {/* 4. FOOTER MINI INFO */}
        <div className="px-2 pt-6 border-t border-slate-100">
           <div className="flex items-center justify-center gap-4 text-[8px] font-black text-slate-300 uppercase tracking-widest font-mono">
             <span>VIBE_OS 2.6</span>
             <span>•</span>
             <span>UK_LON</span>
             <span>•</span>
             <span>SECURE</span>
           </div>
        </div>
      </div>
    </aside>
  );
};