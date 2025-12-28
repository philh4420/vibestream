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
  blockedIds?: Set<string>;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ userData, weather, onNavigate, blockedIds }) => {
  const [activeContacts, setActiveContacts] = useState<VibeUser[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [systemTime, setSystemTime] = useState(new Date());
  const [uptime, setUptime] = useState('00:00:00');
  const [contactFilter, setContactFilter] = useState<'all' | 'online'>('all');
  
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    if (!userData?.id || !db) return;
    const q = collection(db, 'users', userData.id, 'following');
    const unsub = onSnapshot(q, (snap: any) => {
      const ids = new Set<string>(snap.docs.map((d: any) => String(d.id)));
      setFollowingIds(ids);
    });
    return () => unsub();
  }, [userData?.id]);

  useEffect(() => {
    if (!db) return;
    setIsLoading(true);
    const usersQuery = query(collection(db, 'users'), limit(50));
    const unsubUsers = onSnapshot(usersQuery, (snap: any) => {
      const fetched = snap.docs
        .map((doc: any) => ({ id: doc.id, ...doc.data() } as VibeUser))
        .filter((user: VibeUser) => user.id !== auth.currentUser?.uid);
      
      fetched.sort((a: VibeUser, b: VibeUser) => {
        const aStatus = a.settings?.privacy?.activityStatus === false ? 'Offline' : (a.presenceStatus || 'Offline');
        const bStatus = b.settings?.privacy?.activityStatus === false ? 'Offline' : (b.presenceStatus || 'Offline');
        if (aStatus === 'Online' && bStatus !== 'Online') return -1;
        if (bStatus === 'Online' && aStatus !== 'Online') return 1;
        if (a.verifiedHuman && !b.verifiedHuman) return -1;
        if (!a.verifiedHuman && b.verifiedHuman) return 1;
        return 0;
      });
      setActiveContacts(fetched);
      setIsLoading(false);
    });

    const trendingQuery = query(collection(db, 'posts'), orderBy('likes', 'desc'), limit(10));
    const unsubTrending = onSnapshot(trendingQuery, (snap: any) => {
      setTrendingPosts(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Post)));
    });
    return () => { unsubUsers(); unsubTrending(); };
  }, [userData?.id]);

  const handleFollowToggle = async (e: React.MouseEvent, targetUser: VibeUser) => {
    e.stopPropagation();
    if (!db || !auth.currentUser || processingIds.has(targetUser.id)) return;
    const currentUser = auth.currentUser;
    const isFollowing = followingIds.has(targetUser.id);
    setProcessingIds(prev => new Set(prev).add(targetUser.id));
    try {
      const batch = writeBatch(db);
      const myRef = doc(db, 'users', currentUser.uid, 'following', targetUser.id);
      const theirRef = doc(db, 'users', targetUser.id, 'followers', currentUser.uid);
      if (isFollowing) {
        batch.delete(myRef); batch.delete(theirRef);
        batch.update(doc(db, 'users', currentUser.uid), { following: increment(-1) });
        batch.update(doc(db, 'users', targetUser.id), { followers: increment(-1) });
      } else {
        batch.set(myRef, { linkedAt: serverTimestamp() });
        batch.set(theirRef, { linkedAt: serverTimestamp() });
        batch.update(doc(db, 'users', currentUser.uid), { following: increment(1) });
        batch.update(doc(db, 'users', targetUser.id), { followers: increment(1) });
        const notifRef = doc(collection(db, 'notifications'));
        batch.set(notifRef, {
          type: 'follow', fromUserId: currentUser.uid, fromUserName: currentUser.displayName, fromUserAvatar: currentUser.photoURL || '',
          toUserId: targetUser.id, text: 'established a neural link', isRead: false, timestamp: serverTimestamp(), pulseFrequency: 'cognition'
        });
      }
      await batch.commit();
    } catch (e) { console.error(e); } finally {
      setProcessingIds(prev => { const s = new Set(prev); s.delete(targetUser.id); return s; });
    }
  };

  const handleMessage = async (e: React.MouseEvent, targetUser: VibeUser) => {
    e.stopPropagation();
    if (!db || !auth.currentUser) return;
    try {
      const q = query(collection(db, 'chats'), where('participants', 'array-contains', auth.currentUser.uid));
      const snap = await getDocs(q);
      const existingChat = snap.docs.find((d: any) => {
        const data = d.data(); return !data.isCluster && data.participants.includes(targetUser.id);
      });
      if (existingChat) { onNavigate(AppRoute.MESSAGES); } else {
        const participantData = {
          [auth.currentUser.uid]: { displayName: auth.currentUser.displayName, avatarUrl: auth.currentUser.photoURL },
          [targetUser.id]: { displayName: targetUser.displayName, avatarUrl: targetUser.avatarUrl, activeBorder: targetUser.cosmetics?.activeBorder }
        };
        await addDoc(collection(db, 'chats'), {
          participants: [auth.currentUser.uid, targetUser.id], participantData, lastMessage: 'Link established.', lastMessageTimestamp: serverTimestamp(), isCluster: false
        });
        onNavigate(AppRoute.MESSAGES);
      }
    } catch (e) { console.error(e); }
  };

  const PRESENCE_DOTS: Record<PresenceStatus, string> = {
    'Online': 'bg-[#10b981]', 'Focus': 'bg-[#f59e0b]', 'Deep Work': 'bg-[#e11d48]', 'In-Transit': 'bg-[#6366f1]', 'Away': 'bg-[#94a3b8]', 'Invisible': 'bg-[#334155]', 'Syncing': 'bg-[#60a5fa]', 'Offline': 'bg-slate-300'
  };

  const filteredContacts = activeContacts.filter(u => {
    if (blockedIds?.has(u.id)) return false;
    const isVisible = u.settings?.privacy?.activityStatus !== false;
    const status = isVisible ? (u.presenceStatus || 'Offline') : 'Offline';
    if (contactFilter === 'online') return ['Online', 'Focus', 'Deep Work', 'Syncing'].includes(status);
    return true;
  });

  const filteredTrending = trendingPosts.filter(p => !blockedIds?.has(p.authorId)).slice(0, 5);

  return (
    <aside className="hidden lg:flex flex-col w-[280px] xl:w-[320px] shrink-0 bg-slate-50/50 dark:bg-slate-900/50 border-l border-precision h-screen sticky top-0 overflow-hidden transition-colors duration-300 pt-[calc(var(--header-h)+1rem)]">
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 space-y-8 pb-12">
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
              <div className="text-right"><p className="text-[10px] font-mono font-bold text-slate-400">{uptime}</p></div>
            </div>
            <div className="h-10 flex items-end gap-1 mb-6 opacity-60 group-hover:opacity-100 transition-opacity">
               {Array.from({ length: 20 }).map((_, i) => (
                 <div key={i} className="flex-1 bg-indigo-500/40 rounded-t-sm" style={{ height: `${20 + Math.random() * 80}%`, transition: 'height 0.5s ease-in-out' }} />
               ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
               <div className="bg-white/5 rounded-xl p-3 border border-white/5 backdrop-blur-sm">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1">Local_Time</p>
                  <p className="text-sm font-bold font-mono text-white">{systemTime.toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' })}</p>
               </div>
               <div className="bg-white/5 rounded-xl p-3 border border-white/5 backdrop-blur-sm">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1">Atmos</p>
                  <p className="text-sm font-bold font-mono text-white flex items-center gap-2">{weather?.temp || '--'}°C {weather?.icon && <img src={`https://openweathermap.org/img/wn/${weather.icon}.png`} className="w-4 h-4 brightness-200" alt="" />}</p>
               </div>
            </div>
          </div>
        </div>

        {filteredTrending.length > 0 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 px-2">
              <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
              <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] font-mono">Top_Signals</h4>
            </div>
            <div className="space-y-3">
              {filteredTrending.map((post, idx) => {
                const authorBorder = post.authorCosmetics?.border ? `cosmetic-border-${post.authorCosmetics.border}` : '';
                return (
                  <button 
                    key={post.id} 
                    onClick={() => window.dispatchEvent(new CustomEvent('vibe-view-post', { detail: { post } }))}
                    className={`w-full group relative flex items-center gap-3 p-3 rounded-[1.5rem] border transition-all text-left ${idx === 0 ? 'bg-gradient-to-br from-white to-indigo-50/30 dark:from-slate-800 dark:to-indigo-900/30 border-indigo-100 dark:border-slate-700 shadow-md' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-indigo-100 dark:hover:border-indigo-900 hover:shadow-lg'}`}
                  >
                    <div className={`relative w-12 h-12 rounded-xl shrink-0 bg-slate-100 dark:bg-slate-700 ${authorBorder}`}>
                       <img src={post.authorAvatar} className="w-full h-full object-cover rounded-xl" alt="" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                         <p className="text-[9px] font-black text-slate-950 dark:text-white uppercase tracking-tight truncate">{post.authorName}</p>
                      </div>
                      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate italic">"{post.content || 'Media Signal'}"</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-5">
           <div className="flex items-center justify-between px-2">
              <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] font-mono">Active_Nodes</h4>
           </div>
           <div className="space-y-2">
              {filteredContacts.slice(0, 15).map(node => {
                  const isFollowing = followingIds.has(node.id);
                  const isProcessing = processingIds.has(node.id);
                  const showActivity = node.settings?.privacy?.activityStatus !== false;
                  const borderClass = node.cosmetics?.activeBorder ? `cosmetic-border-${node.cosmetics.activeBorder}` : '';
                  
                  return (
                    <div key={node.id} className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all duration-300 group hover:shadow-md">
                      <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
                        <div className={`relative shrink-0 w-10 h-10 rounded-xl ${borderClass}`}>
                          <img src={node.avatarUrl} className="w-full h-full rounded-xl object-cover" alt="" />
                          {showActivity && (
                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${PRESENCE_DOTS[node.presenceStatus || 'Invisible']}`} />
                          )}
                        </div>
                        <div className="text-left overflow-hidden flex-1">
                           <div className="flex items-center gap-1.5">
                             <p className="text-[11px] font-black text-slate-900 dark:text-white truncate tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{node.displayName}</p>
                             {node.verifiedHuman && <div className="text-indigo-500 scale-[0.6]"><ICONS.Verified /></div>}
                           </div>
                           <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium truncate tracking-tight">{showActivity ? (node.statusEmoji + ' ' + (node.statusMessage || node.presenceStatus)) : 'Status Hidden'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 pl-2">
                        <button onClick={(e) => handleFollowToggle(e, node)} disabled={isProcessing} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${isFollowing ? 'bg-white dark:bg-slate-700 border border-slate-200 text-slate-400 hover:text-rose-500' : 'bg-slate-950 dark:bg-white text-white dark:text-slate-950'}`}>
                          {isProcessing ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>{isFollowing ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />}</svg>}
                        </button>
                        <button onClick={(e) => handleMessage(e, node)} className="w-7 h-7 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center transition-all"><ICONS.Messages /></button>
                      </div>
                    </div>
                  );
                })
              }
           </div>
        </div>
      </div>
    </aside>
  );
};