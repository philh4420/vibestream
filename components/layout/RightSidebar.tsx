
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

    const usersQuery = query(collection(db, 'users'), limit(12), orderBy('joinedAt', 'desc'));
    const unsubUsers = onSnapshot(usersQuery, (snap: any) => {
      const fetched = snap.docs
        .map((doc: any) => ({ id: doc.id, ...doc.data() } as VibeUser))
        .filter((user: VibeUser) => user.id !== auth.currentUser?.uid);
      setActiveContacts(fetched);
      setIsLoading(false);
    });

    // Increased limit to 5 for better leaderboard
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
        
        // Notify
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
      // Check for existing chat
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

  const calculateVelocityScore = (post: Post) => {
    return (post.likes || 0) * 1.5 + (post.comments || 0) * 3 + (post.shares || 0) * 5;
  };

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
    <aside className="hidden lg:flex flex-col w-[320px] xl:w-[380px] shrink-0 bg-[#f8fafc] border-l border-precision h-full pt-6 pb-8 overflow-hidden custom-scrollbar">
      
      <div className="flex-1 scroll-viewport px-6 space-y-10 pb-10">
        
        {/* SECTION: SYSTEM MONITOR WIDGET */}
        <div className="relative group overflow-hidden bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl transition-all duration-500 hover:shadow-indigo-500/20 min-h-[260px] flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-60 bg-indigo-500/20 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/3" />
          
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.4em] font-mono mb-1">Grid_Uptime</p>
              <p className="text-xl font-black font-mono tracking-tighter text-white">{uptime}</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] font-mono mb-1">Local_Node</p>
              <p className="text-[11px] font-bold text-slate-200">{userData?.location || 'UK-HQ-026'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 relative z-10 flex-1 content-center">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md flex flex-col justify-center min-h-[100px]">
              <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest font-mono mb-1.5 text-center">Neural_Time</p>
              <p className="text-base font-black text-center text-white font-mono flex items-center justify-center gap-1">
                <span>{systemTime.toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-[10px] text-indigo-400 animate-pulse">:</span>
                <span className="text-xs opacity-60">{systemTime.toLocaleTimeString('en-GB', { second: '2-digit' })}</span>
              </p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 backdrop-blur-md flex flex-col justify-center min-h-[100px]">
              <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest font-mono mb-1.5 text-center">Atmospherics</p>
              {weather ? (
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-base font-black text-white font-mono">{weather.temp}°C</span>
                  {weather.icon ? (
                    <img 
                      src={`https://openweathermap.org/img/wn/${weather.icon}.png`} 
                      className="w-5 h-5 object-contain brightness-200" 
                      alt="" 
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  ) : null}
                </div>
              ) : (
                <p className="text-[10px] font-bold text-slate-600 text-center animate-pulse">SYNCING</p>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-5 relative z-10">
             <div className="flex items-center gap-1.5">
               <div className={`w-1 h-1 bg-emerald-500 rounded-full animate-pulse`} />
               <span className={`text-[8px] font-black text-emerald-400 uppercase tracking-widest font-mono`}>
                 Kernel_Optimised
               </span>
             </div>
             <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest font-mono">v2.6.4</span>
          </div>
        </div>

        {/* SECTION: TRENDING SIGNALS (IMPROVED) */}
        {trendingPosts.length > 0 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Grid_Velocity</h4>
              </div>
              <span className="text-[8px] font-black text-slate-300 font-mono bg-slate-50 px-2 py-0.5 rounded-md">LIVE</span>
            </div>
            
            <div className="space-y-4">
              {/* TOP TRENDING ITEM */}
              {trendingPosts[0] && (
                <div 
                  onClick={() => handleViewPost(trendingPosts[0])}
                  className="relative h-56 rounded-[2rem] overflow-hidden group cursor-pointer shadow-xl border border-slate-100 transition-all hover:scale-[1.02] active:scale-95"
                >
                  {trendingPosts[0].media?.[0]?.url ? (
                    <img src={trendingPosts[0].media[0].url} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="" />
                  ) : (
                    <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                      <div className="text-white opacity-10 scale-150"><ICONS.Explore /></div>
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-90" />
                  
                  <div className="absolute top-4 left-4">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-xl flex items-center gap-2">
                      <span className="text-[10px] font-black text-white italic">#01</span>
                      <span className="text-[8px] font-bold text-rose-400 uppercase tracking-widest font-mono">DOMINANT</span>
                    </div>
                  </div>

                  <div className="absolute bottom-5 left-5 right-5">
                    <div className="flex items-center gap-2 mb-2">
                      <img src={trendingPosts[0].authorAvatar} className="w-6 h-6 rounded-lg object-cover border border-white/20" alt="" />
                      <p className="text-[9px] font-black text-white/80 uppercase tracking-widest truncate">{trendingPosts[0].authorName}</p>
                    </div>
                    <p className="text-sm font-bold text-white line-clamp-2 leading-tight italic">"{trendingPosts[0].content}"</p>
                    <div className="mt-3 flex items-center gap-2 text-[8px] font-black font-mono uppercase tracking-widest text-indigo-400">
                      <span>{calculateVelocityScore(trendingPosts[0]).toFixed(0)} VELOCITY</span>
                      <div className="h-px bg-white/20 flex-1" />
                    </div>
                  </div>
                </div>
              )}

              {/* LIST ITEMS */}
              <div className="space-y-2">
                {trendingPosts.slice(1, 5).map((post, idx) => (
                  <div 
                    key={post.id} 
                    onClick={() => handleViewPost(post)}
                    className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl hover:border-indigo-100 hover:shadow-lg transition-all cursor-pointer group"
                  >
                    <div className="w-8 flex justify-center text-[10px] font-black text-slate-300 font-mono group-hover:text-indigo-500 transition-colors">
                      {(idx + 2).toString().padStart(2, '0')}
                    </div>
                    
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-slate-50 border border-slate-50">
                      {post.media?.[0]?.url ? (
                        <img src={post.media[0].url} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 scale-75"><ICONS.Explore /></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate">{post.authorName}</p>
                        <span className="text-[7px] font-black text-indigo-500 font-mono">{post.likes} P</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-800 truncate leading-none group-hover:text-indigo-600 transition-colors">{post.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION: ACTIVE GRID (CONTACTS) */}
        <div className="space-y-4">
           <div className="flex items-center justify-between px-2">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Neural_Mesh</h4>
              <button 
                onClick={() => onNavigate(AppRoute.EXPLORE)} 
                className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-white rounded-lg transition-all scale-75"
              >
                <ICONS.Search />
              </button>
           </div>

           <div className="space-y-1">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 animate-pulse bg-slate-50 rounded-xl">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-1.5 bg-slate-100 rounded w-1/2" />
                      <div className="h-1 bg-slate-100 rounded w-1/3" />
                    </div>
                  </div>
                ))
              ) : activeContacts.map(node => {
                const isFollowing = followingIds.has(node.id);
                const isProcessing = processingIds.has(node.id);
                
                return (
                  <div 
                    key={node.id}
                    className="w-full flex items-center justify-between p-3 bg-white/40 hover:bg-white border border-transparent hover:border-sharp rounded-[1.5rem] transition-all duration-300 group tap-feedback hover:shadow-float"
                  >
                    <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
                      <div className="relative shrink-0">
                        <div className="p-0.5 bg-white rounded-xl shadow-sm border border-slate-100 transition-transform group-hover:rotate-3">
                          <img src={node.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${node.id}`} className="w-9 h-9 rounded-lg object-cover" alt="" />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5">
                           <div className={`w-3 h-3 rounded-full border-[2.5px] border-white shadow-sm ${node.presenceStatus ? PRESENCE_DOTS[node.presenceStatus] : 'bg-slate-300'} ${node.presenceStatus === 'Online' ? 'animate-pulse' : ''}`} />
                        </div>
                      </div>
                      <div className="text-left overflow-hidden flex-1">
                         <p className="text-[12px] font-black text-slate-900 truncate tracking-tight group-hover:text-indigo-600 transition-colors">
                           {node.displayName || 'Unknown Node'}
                         </p>
                         <div className="flex items-center gap-1 mt-0.5">
                           <span className="text-[9px]">{node.statusEmoji || '⚡'}</span>
                           <p className="text-[9px] text-slate-400 font-bold truncate tracking-tight font-mono italic opacity-80">
                             {node.statusMessage || (node.presenceStatus ? node.presenceStatus.toUpperCase() : 'OFFLINE')}
                           </p>
                         </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleFollowToggle(node)}
                        disabled={isProcessing}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isFollowing ? 'bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-500' : 'bg-slate-900 text-white hover:bg-indigo-600'}`}
                        title={isFollowing ? "Disconnect" : "Connect"}
                      >
                        {isProcessing ? (
                          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                            {isFollowing 
                              ? <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /> 
                              : <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                            }
                          </svg>
                        )}
                      </button>
                      <button 
                        onClick={() => handleMessage(node)}
                        className="w-7 h-7 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg flex items-center justify-center transition-all"
                        title="Start Secure Link"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.596.596 0 01-.474-.065.412.412 0 01-.205-.35c0-.18.01-.358.028-.53l.303-2.84A8.25 8.25 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
                      </button>
                    </div>
                  </div>
                );
              })}
           </div>
           
           <button 
             onClick={() => onNavigate(AppRoute.EXPLORE)}
             className="w-full py-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono hover:text-indigo-600 transition-colors bg-slate-50/50 rounded-xl border border-dashed border-slate-200 hover:border-indigo-200"
           >
             Load_More_Nodes...
           </button>
        </div>

        {/* FOOTER MINI INFO */}
        <div className="px-2 pt-8 pb-4 border-t border-slate-100 flex flex-col gap-3">
           <div className="flex items-center gap-3">
             <div className="flex-1 h-px bg-slate-100" />
             <span className="text-[9px] font-black text-slate-800 uppercase tracking-[0.5em] font-mono">Infrastructure</span>
             <div className="flex-1 h-px bg-slate-100" />
           </div>
           <p className="text-[9px] text-center text-slate-800 font-bold leading-relaxed px-4 opacity-50">
             VibeStream Node 2.6 Synchronisation Active. Local UK routing cluster operational via GB-LON-CENTRAL.
           </p>
        </div>
      </div>
    </aside>
  );
};
