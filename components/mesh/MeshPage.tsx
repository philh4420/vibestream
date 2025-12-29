
import React, { useState, useEffect, useMemo } from 'react';
import { db, auth } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { collection, query, where, getDocs, doc, writeBatch, serverTimestamp, increment, getDoc } = Firestore as any;
import { User, Region } from '../../types';
import { ICONS } from '../../constants';

interface MeshPageProps {
  currentUser: User;
  locale: Region;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onViewProfile: (user: User) => void;
  blockedIds?: Set<string>;
}

type MeshTab = 'following' | 'followers' | 'discover';
type SortOrder = 'resonance' | 'recent' | 'alpha';

export const MeshPage: React.FC<MeshPageProps> = ({ currentUser, locale, addToast, onViewProfile, blockedIds }) => {
  const [activeTab, setActiveTab] = useState<MeshTab>('following');
  const [sortOrder, setSortOrder] = useState<SortOrder>('resonance');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [myFollowingIds, setMyFollowingIds] = useState<Set<string>>(new Set());
  const [myFollowerIds, setMyFollowerIds] = useState<Set<string>>(new Set());
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Fetch Core Social Graph
  useEffect(() => {
    const syncMeshIds = async () => {
      if (!auth.currentUser || !db) return;
      try {
        const [followingSnap, followersSnap] = await Promise.all([
          getDocs(collection(db, 'users', currentUser.id, 'following')),
          getDocs(collection(db, 'users', currentUser.id, 'followers'))
        ]);
        setMyFollowingIds(new Set(followingSnap.docs.map((d: any) => String(d.id))));
        setMyFollowerIds(new Set(followersSnap.docs.map((d: any) => String(d.id))));
      } catch (e) {
        console.error("Mesh ID sync failure", e);
      }
    };
    syncMeshIds();
  }, [currentUser.id]);

  // Fetch Display Data
  useEffect(() => {
    const fetchGraphData = async () => {
      setIsLoading(true);
      try {
        let fetchedUsers: User[] = [];
        
        if (activeTab === 'discover') {
          // Discovery logic: find high resonance nodes not yet followed
          const q = query(
            collection(db, 'users'), 
            where('id', '!=', currentUser.id),
            Firestore.limit(40)
          );
          const snap = await getDocs(q);
          fetchedUsers = snap.docs
            .map((d: any) => ({ id: d.id, ...d.data() } as User))
            .filter(u => !myFollowingIds.has(u.id));
        } else {
          const collectionRef = collection(db, 'users', currentUser.id, activeTab);
          const snap = await getDocs(collectionRef);
          const ids = snap.docs.map((d: any) => d.id);
          
          if (ids.length > 0) {
            const promises = ids.map(id => getDoc(doc(db, 'users', id)));
            const snaps = await Promise.all(promises);
            fetchedUsers = snaps
              .map(s => s.exists() ? ({ id: s.id, ...s.data() } as User) : null)
              .filter(Boolean) as User[];
          }
        }

        // Apply global block filter
        setUsers(fetchedUsers.filter(u => !blockedIds?.has(u.id)));
      } catch (e) { 
        console.error("Mesh Data Fetch Error", e); 
      } finally { 
        setIsLoading(false); 
      }
    };
    fetchGraphData();
  }, [activeTab, currentUser.id, myFollowingIds, blockedIds]);

  const handleToggleFollow = async (e: React.MouseEvent, targetUser: User) => {
    e.stopPropagation(); 
    if (!db || !auth.currentUser) return;
    
    const isFollowing = myFollowingIds.has(targetUser.id);
    const batch = writeBatch(db);
    
    try {
        if (isFollowing) {
            batch.delete(doc(db, 'users', currentUser.id, 'following', targetUser.id));
            batch.delete(doc(db, 'users', targetUser.id, 'followers', currentUser.id));
            batch.update(doc(db, 'users', currentUser.id), { following: increment(-1) });
            batch.update(doc(db, 'users', targetUser.id), { followers: increment(-1) });
            setMyFollowingIds(prev => { const n = new Set(prev); n.delete(targetUser.id); return n; });
        } else {
            batch.set(doc(db, 'users', currentUser.id, 'following', targetUser.id), { linkedAt: serverTimestamp() });
            batch.set(doc(db, 'users', targetUser.id, 'followers', currentUser.id), { linkedAt: serverTimestamp() });
            batch.update(doc(db, 'users', currentUser.id), { following: increment(1) });
            batch.update(doc(db, 'users', targetUser.id), { followers: increment(1) });
            
            // Notification
            batch.set(doc(collection(db, 'notifications')), {
                type: 'follow',
                fromUserId: currentUser.id,
                fromUserName: currentUser.displayName,
                fromUserAvatar: currentUser.avatarUrl,
                toUserId: targetUser.id,
                text: 'established a primary neural link.',
                isRead: false,
                timestamp: serverTimestamp(),
                pulseFrequency: 'cognition'
            });
            
            setMyFollowingIds(prev => new Set(prev).add(targetUser.id));
        }
        await batch.commit();
        addToast(isFollowing ? "Signal Decoupled" : "Handshake Established", "success");
    } catch (e) { 
        addToast("Protocol Conflict: Sync Refused", "error"); 
    }
  };

  // Derived Processing
  const processedUsers = useMemo(() => {
    let list = users.filter(u => 
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (selectedTag) {
        list = list.filter(u => u.tags?.includes(selectedTag));
    }

    // Sorting
    return [...list].sort((a, b) => {
      if (sortOrder === 'resonance') return (b.resonance || 0) - (a.resonance || 0);
      if (sortOrder === 'alpha') return a.displayName.localeCompare(b.displayName);
      return 0; // Default order from server
    });
  }, [users, searchQuery, sortOrder, selectedTag]);

  const allTags = useMemo(() => {
      const tags = new Set<string>();
      users.forEach(u => u.tags?.forEach(t => tags.add(t)));
      return Array.from(tags).slice(0, 8);
  }, [users]);

  // Network Meta Calculation
  const signalStrength = Math.round(((myFollowingIds.size + myFollowerIds.size) / 200) * 100);

  return (
    <div className="w-full max-w-[2400px] mx-auto pb-40 animate-in fade-in duration-1000 space-y-10">
      
      {/* 1. MESH TOPOGRAPHY HERO */}
      <div className="relative rounded-[3.5rem] bg-slate-950 p-10 md:p-14 text-white shadow-2xl border border-white/5 overflow-hidden group">
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 blur-[120px] rounded-full translate-x-1/4 -translate-y-1/4 group-hover:bg-indigo-500/20 transition-colors duration-1000" />
         <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
         
         <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12">
            <div className="space-y-5 max-w-2xl">
               <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_#6366f1]" />
                  <span className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.4em] font-mono">Neural_Grid_Control</span>
               </div>
               <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none text-white">
                 Mesh<br/><span className="text-slate-500">Topology</span>
               </h1>
               <p className="text-sm md:text-base font-medium text-slate-400 leading-relaxed max-w-lg">
                 Visualize and manage your secure connection matrix. Calibrate incoming signals and discover compatible nodes across the global mesh.
               </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full lg:w-auto">
               <div className="px-8 py-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.2rem] flex flex-col items-center justify-center min-w-[140px] hover:bg-white/10 transition-colors">
                  <span className="text-4xl font-black text-white leading-none tracking-tighter">{currentUser.followers + currentUser.following}</span>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2 font-mono">Total_Links</span>
               </div>
               <div className="px-8 py-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-[2.2rem] flex flex-col items-center justify-center min-w-[140px] hover:bg-white/10 transition-colors">
                  <span className="text-4xl font-black text-indigo-400 leading-none tracking-tighter">{Math.min(100, signalStrength)}%</span>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2 font-mono">Signal_Gain</span>
               </div>
               <div className="hidden md:flex px-8 py-6 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 rounded-[2.2rem] flex-col items-center justify-center min-w-[140px]">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping mb-2" />
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest font-mono">ENCRYPTED</span>
               </div>
            </div>
         </div>
      </div>

      {/* 2. COMMAND INTERFACE (Tabs & Filters) */}
      <div className="sticky top-[calc(var(--header-h)+1rem)] z-[100] px-2 md:px-0">
         <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-3xl border border-white/50 dark:border-white/10 p-2.5 rounded-[2.8rem] shadow-heavy flex flex-col xl:flex-row items-center gap-4">
            
            {/* Main Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-[2.2rem] w-full xl:w-auto">
               {(['following', 'followers', 'discover'] as const).map(tab => (
                 <button
                   key={tab}
                   onClick={() => { setActiveTab(tab); setSelectedTag(null); }}
                   className={`flex-1 md:flex-none px-10 py-3.5 rounded-[1.8rem] text-[11px] font-black uppercase tracking-widest transition-all duration-300 relative ${
                     activeTab === tab 
                       ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 shadow-xl scale-105' 
                       : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                   }`}
                 >
                   {tab === 'following' ? 'HANDSHAKES' : tab === 'followers' ? 'INBOUND' : 'DISCOVERY'}
                   {activeTab === tab && (
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-indigo-500 rounded-full shadow-[0_0_10px_#6366f1]" />
                   )}
                 </button>
               ))}
            </div>

            {/* Sorting & Search Sub-dock */}
            <div className="flex items-center gap-3 w-full xl:w-auto xl:flex-1">
                <div className="relative flex-1 group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors">
                        <ICONS.Search />
                    </div>
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Scan registry by name or ID..."
                        className="w-full bg-slate-100 dark:bg-slate-900/60 border border-transparent dark:border-slate-800 rounded-[2rem] pl-16 pr-6 py-4 text-xs font-bold focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all outline-none italic text-slate-800 dark:text-white"
                    />
                </div>

                <select 
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                    className="hidden md:block bg-slate-100 dark:bg-slate-900/60 border border-transparent dark:border-slate-800 rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-widest outline-none focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                    <option value="resonance">Sort: Resonance</option>
                    <option value="alpha">Sort: Alphabetical</option>
                </select>
            </div>
         </div>

         {/* Tag Filtering Ribbon */}
         <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-2 px-6">
            <button 
                onClick={() => setSelectedTag(null)}
                className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${!selectedTag ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400'}`}
            >
                ALL_LAYERS
            </button>
            {allTags.map(tag => (
                <button 
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${selectedTag === tag ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400 hover:border-indigo-400'}`}
                >
                    #{tag.toUpperCase()}
                </button>
            ))}
         </div>
      </div>

      {/* 3. GRID OF NODES */}
      <div className="min-h-[600px] px-2 md:px-0">
         {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
               {[1,2,3,4,5,6].map(i => (
                 <div key={i} className="h-64 bg-white/40 dark:bg-slate-900/40 rounded-[3rem] animate-pulse border border-slate-100 dark:border-slate-800" />
               ))}
            </div>
         ) : processedUsers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
               {processedUsers.map((user, idx) => {
                  const isFollowing = myFollowingIds.has(user.id);
                  const isMutual = isFollowing && myFollowerIds.has(user.id);
                  const borderClass = user.cosmetics?.activeBorder ? `cosmetic-border-${user.cosmetics.activeBorder}` : '';
                  const resonancePercent = Math.min(100, Math.round(((user.resonance || 0) / 5000) * 100));

                  return (
                    <div 
                      key={user.id} 
                      onClick={() => onViewProfile(user)}
                      className="group relative bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-[3rem] p-6 hover:shadow-premium hover:border-indigo-200 dark:hover:border-indigo-900 transition-all duration-500 cursor-pointer overflow-hidden flex flex-col h-full animate-in slide-in-from-bottom-4 fill-mode-backwards"
                      style={{ animationDelay: `${idx * 60}ms` }}
                    >
                        {/* Shimmer Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        
                        <div className="flex items-start justify-between mb-8 relative z-10">
                            <div className="flex items-center gap-5">
                                <div className={`relative shrink-0 w-20 h-20 rounded-[1.8rem] transition-transform duration-700 group-hover:scale-105 ${borderClass}`}>
                                    <img src={user.avatarUrl} className="w-full h-full rounded-[1.8rem] object-cover ring-4 ring-white dark:ring-slate-900 shadow-xl bg-slate-100 dark:bg-slate-800" alt="" />
                                    {user.presenceStatus === 'Online' && (
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-white dark:border-slate-900 animate-pulse" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-black text-xl text-slate-950 dark:text-white uppercase italic tracking-tighter truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                            {user.displayName}
                                        </h4>
                                        {user.verifiedHuman && <div className="text-indigo-500 scale-90"><ICONS.Verified /></div>}
                                    </div>
                                    <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">@{user.username}</p>
                                    
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                        {user.tags?.slice(0, 2).map(t => (
                                            <span key={t} className="px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-[8px] font-black text-slate-400 uppercase">{t}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                                {isMutual && (
                                    <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[8px] font-black uppercase tracking-widest rounded-lg border border-indigo-100 dark:border-indigo-800">MUTUAL</span>
                                )}
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono">Resonance</p>
                                    <p className="text-sm font-black text-slate-900 dark:text-white font-mono">{user.resonance?.toLocaleString() || '0'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Resonance Mini-Meter */}
                        <div className="mb-8 relative z-10">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Transmission_Quality</span>
                                <span className="text-[9px] font-bold font-mono text-indigo-500">{resonancePercent}%</span>
                            </div>
                            <div className="h-1 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                                    style={{ width: `${resonancePercent}%` }}
                                />
                            </div>
                        </div>

                        {/* Bio / Meta */}
                        <div className="mb-8 flex-1 relative z-10">
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium line-clamp-2 italic h-9">
                                "{user.bio || 'Signal established. Awaiting primary interaction sequence.'}"
                            </p>
                        </div>

                        {/* Interaction Dock */}
                        <div className="pt-6 border-t border-slate-50 dark:border-slate-900 flex items-center justify-between relative z-10">
                            <div className="flex gap-2">
                                <button className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all flex items-center justify-center active:scale-90">
                                    <ICONS.Messages />
                                </button>
                                <button className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all flex items-center justify-center active:scale-90">
                                    <ICONS.Explore />
                                </button>
                            </div>

                            <button 
                                onClick={(e) => handleToggleFollow(e, user)}
                                className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-sm active:scale-95 ${
                                    isFollowing 
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20' 
                                        : 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:bg-indigo-600 dark:hover:bg-indigo-400 hover:text-white dark:hover:text-white shadow-lg'
                                }`}
                            >
                                {isFollowing ? 'SEVER_LINK' : 'INITIALIZE'}
                            </button>
                        </div>
                    </div>
                  );
               })}
            </div>
         ) : (
            <div className="py-40 flex flex-col items-center justify-center text-center opacity-40 bg-white/40 dark:bg-slate-900/20 rounded-[4rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
               <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center mb-8 text-slate-300 dark:text-slate-700 shadow-inner">
                  <ICONS.Clusters />
               </div>
               <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 dark:text-white leading-none">Void_Detected</h3>
               <p className="text-[11px] font-black uppercase tracking-[0.5em] font-mono mt-3 text-slate-400 dark:text-slate-500 max-w-sm leading-loose">
                  No compatible neural nodes found in this frequency window. Adjust your scanning parameters.
               </p>
               <button 
                  onClick={() => { setActiveTab('discover'); setSearchQuery(''); setSelectedTag(null); }}
                  className="mt-10 px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-indigo-700 transition-all active:scale-95"
               >
                  EXPAND_SCAN_RADIUS
               </button>
            </div>
         )}
      </div>

      {/* Footer Info */}
      <div className="mt-12 text-center opacity-40">
        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.6em] font-mono">
           Mesh_Encryption: Level_7 • Protocol_Stable • GB_SYNC_OK
        </p>
      </div>

    </div>
  );
};
