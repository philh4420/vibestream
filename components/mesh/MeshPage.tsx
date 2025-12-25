
import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  deleteDoc, 
  setDoc, 
  serverTimestamp, 
  increment,
  writeBatch,
  getDoc
} = Firestore as any;
import { User, Region } from '../../types';
import { ICONS } from '../../constants';

interface MeshPageProps {
  currentUser: User;
  locale: Region;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onViewProfile: (user: User) => void;
}

export const MeshPage: React.FC<MeshPageProps> = ({ currentUser, locale, addToast, onViewProfile }) => {
  const [activeTab, setActiveTab] = useState<'following' | 'followers' | 'discover'>('following');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  
  // Track who the current user follows
  const [myFollowingIds, setMyFollowingIds] = useState<Set<string>>(new Set());

  // Initial Data Fetch
  useEffect(() => {
    if (!db || !currentUser.id) return;
    
    const fetchGraphData = async () => {
      setIsLoading(true);
      try {
        let fetchedUsers: User[] = [];
        const myFollowingSnap = await getDocs(collection(db, 'users', currentUser.id, 'following'));
        const currentFollowing = new Set<string>(myFollowingSnap.docs.map((d: any) => String(d.id)));
        setMyFollowingIds(currentFollowing);

        if (activeTab === 'discover') {
          // Optimized discovery query
          const q = query(collection(db, 'users'), where('id', '!=', currentUser.id)); 
          const snap = await getDocs(q);
          
          fetchedUsers = snap.docs
            .map((d: any) => ({ id: d.id, ...d.data() } as User))
            .filter((u: any) => !currentFollowing.has(u.id))
            .slice(0, 50);

        } else if (activeTab === 'following') {
          const ids = Array.from(currentFollowing);
          if (ids.length > 0) {
            const promises = ids.map(id => getDoc(doc(db, 'users', id)));
            const snaps = await Promise.all(promises);
            fetchedUsers = snaps.map(s => s.exists() ? ({ id: s.id, ...s.data() } as User) : null).filter(Boolean) as User[];
          }

        } else if (activeTab === 'followers') {
          const followersSnap = await getDocs(collection(db, 'users', currentUser.id, 'followers'));
          const ids = followersSnap.docs.map((d: any) => d.id);
          
          if (ids.length > 0) {
            const promises = ids.map(id => getDoc(doc(db, 'users', id)));
            const snaps = await Promise.all(promises);
            fetchedUsers = snaps.map(s => s.exists() ? ({ id: s.id, ...s.data() } as User) : null).filter(Boolean) as User[];
          }
        }

        setUsers(fetchedUsers);
      } catch (e) {
        console.error("Mesh Sync Error", e);
        addToast("Grid Sync Failed", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGraphData();
  }, [activeTab, currentUser.id]);

  const handleToggleFollow = async (e: React.MouseEvent, targetUser: User) => {
    e.stopPropagation(); // Prevents clicking the card when clicking the button
    if (!db || !currentUser.id) return;
    
    const isFollowing = myFollowingIds.has(targetUser.id);
    const action = isFollowing ? 'unfollow' : 'follow';
    
    setProcessingIds(prev => [...prev, targetUser.id]);

    // Optimistic Update
    if (action === 'follow') {
      setMyFollowingIds(prev => new Set(prev).add(targetUser.id));
      if (activeTab === 'discover') {
        setUsers(prev => prev.filter(u => u.id !== targetUser.id));
      }
    } else {
      const newSet = new Set(myFollowingIds);
      newSet.delete(targetUser.id);
      setMyFollowingIds(newSet);
      if (activeTab === 'following') {
        setUsers(prev => prev.filter(u => u.id !== targetUser.id));
      }
    }

    const batch = writeBatch(db);
    const myFollowingRef = doc(db, 'users', currentUser.id, 'following', targetUser.id);
    const theirFollowersRef = doc(db, 'users', targetUser.id, 'followers', currentUser.id);
    const myRef = doc(db, 'users', currentUser.id);
    const theirRef = doc(db, 'users', targetUser.id);

    try {
      if (action === 'follow') {
        batch.set(myFollowingRef, { linkedAt: serverTimestamp() });
        batch.set(theirFollowersRef, { linkedAt: serverTimestamp() });
        batch.update(myRef, { following: increment(1) });
        batch.update(theirRef, { followers: increment(1) });
        
        const notifRef = doc(collection(db, 'notifications'));
        batch.set(notifRef, {
          type: 'follow',
          fromUserId: currentUser.id,
          fromUserName: currentUser.displayName,
          fromUserAvatar: currentUser.avatarUrl,
          toUserId: targetUser.id,
          text: 'established a neural link with you',
          isRead: false,
          timestamp: serverTimestamp(),
          pulseFrequency: 'cognition'
        });

        await batch.commit();
        addToast(`Linked to ${targetUser.displayName}`, "success");
      } else {
        batch.delete(myFollowingRef);
        batch.delete(theirFollowersRef);
        batch.update(myRef, { following: increment(-1) });
        batch.update(theirRef, { followers: increment(-1) });
        await batch.commit();
        addToast(`Link Severed: ${targetUser.displayName}`, "info");
      }
    } catch (e) {
      addToast("Handshake Protocol Failed", "error");
      // Revert optimistic update
      if (action === 'follow') {
        setMyFollowingIds(prev => { const s = new Set(prev); s.delete(targetUser.id); return s; });
      } else {
        setMyFollowingIds(prev => new Set(prev).add(targetUser.id));
      }
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== targetUser.id));
    }
  };

  const filteredUsers = users.filter(u => 
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-[2400px] mx-auto pb-32 animate-in fade-in duration-700">
      
      {/* 1. Neural Command Header */}
      <div className="relative rounded-[3rem] bg-slate-950 dark:bg-black p-8 md:p-12 text-white shadow-2xl border border-white/10 dark:border-slate-800 overflow-hidden mb-8 group">
         <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3 group-hover:bg-indigo-500/30 transition-colors duration-1000" />
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3" />
         
         <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
           <div className="space-y-4">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 text-indigo-300">
                   <ICONS.Profile />
                </div>
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] font-mono">Mesh_Control_v2.6</span>
             </div>
             <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase leading-none">
               Neural_Network
             </h1>
             <p className="text-xs md:text-sm font-medium text-slate-400 max-w-lg leading-relaxed">
               Visualizing active connections and potential resonance points within your local cluster.
             </p>
           </div>

           <div className="flex gap-4 w-full lg:w-auto">
              <div className="flex-1 lg:flex-none px-8 py-5 bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] flex flex-col items-center justify-center min-w-[140px] hover:bg-white/10 transition-colors">
                 <span className="text-3xl font-black text-white leading-none tracking-tighter">{currentUser.following}</span>
                 <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mt-1.5">Outbound</span>
              </div>
              <div className="flex-1 lg:flex-none px-8 py-5 bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] flex flex-col items-center justify-center min-w-[140px] hover:bg-white/10 transition-colors">
                 <span className="text-3xl font-black text-white leading-none tracking-tighter">{currentUser.followers}</span>
                 <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mt-1.5">Inbound</span>
              </div>
           </div>
         </div>
      </div>

      {/* 2. Sticky Control Bar */}
      <div className="sticky top-[calc(var(--header-h)+1rem)] z-30 mb-8 px-2 md:px-0">
         <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/60 dark:border-white/10 p-2 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] dark:shadow-none flex flex-col md:flex-row items-center justify-between gap-3">
            
            {/* Tabs */}
            <div className="flex bg-slate-100/80 dark:bg-slate-800/50 p-1 rounded-[2rem] w-full md:w-auto">
               {[
                 { id: 'following', label: 'Network' },
                 { id: 'followers', label: 'Audience' },
                 { id: 'discover', label: 'Discover' }
               ].map(tab => (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id as any)}
                   className={`flex-1 md:flex-none px-6 py-3 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative ${
                     activeTab === tab.id 
                       ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-md' 
                       : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                   }`}
                 >
                   {tab.label}
                 </button>
               ))}
            </div>

            {/* Search */}
            <div className="relative w-full md:w-80 group">
               <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors scale-90">
                 <ICONS.Search />
               </div>
               <input 
                 type="text" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder={`Scan ${activeTab} nodes...`}
                 className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] pl-12 pr-6 py-3.5 text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 dark:focus:border-indigo-800 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 text-slate-900 dark:text-white shadow-inner dark:shadow-none"
               />
            </div>
         </div>
      </div>

      {/* 3. Node Grid */}
      <div className="min-h-[400px]">
         {isLoading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
             {Array.from({ length: 9 }).map((_, i) => (
               <div key={i} className="h-40 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] animate-pulse border border-slate-100 dark:border-slate-700" />
             ))}
           </div>
         ) : filteredUsers.length > 0 ? (
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
             {filteredUsers.map((user, idx) => {
               const isFollowing = myFollowingIds.has(user.id);
               const isMe = user.id === currentUser.id;
               const isProcessing = processingIds.includes(user.id);
               const showActivity = user.settings?.privacy?.activityStatus !== false;

               return (
                 <div 
                   key={user.id} 
                   onClick={() => onViewProfile(user)}
                   className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-5 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] dark:hover:shadow-black/20 hover:border-indigo-100 dark:hover:border-indigo-900 transition-all duration-300 relative flex flex-col overflow-hidden cursor-pointer"
                   style={{ animationDelay: `${idx * 50}ms` }}
                 >
                    {/* Decorative Top Line */}
                    <div className={`absolute top-0 left-0 right-0 h-1 ${user.presenceStatus === 'Online' && showActivity ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'} opacity-0 group-hover:opacity-100 transition-opacity`} />

                    <div className="flex items-start justify-between mb-4 relative z-10">
                       <div className="flex items-center gap-4">
                          <div className="relative">
                             <img src={user.avatarUrl} className="w-16 h-16 rounded-[1.5rem] object-cover border-2 border-slate-50 dark:border-slate-800 shadow-sm group-hover:scale-105 transition-transform duration-500" alt="" />
                             {user.verifiedHuman && (
                               <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 text-indigo-500 dark:text-indigo-400 p-0.5 rounded-full border border-slate-50 dark:border-slate-700 shadow-sm">
                                  <ICONS.Verified />
                               </div>
                             )}
                          </div>
                          <div>
                             <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase italic tracking-tight truncate max-w-[140px]">{user.displayName}</h3>
                             <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 font-mono tracking-wider truncate mb-1">@{user.username}</p>
                             <div className="flex items-center gap-1.5">
                                {showActivity && user.presenceStatus === 'Online' && (
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                )}
                                <span className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">{showActivity ? (user.presenceStatus || 'OFFLINE') : 'OFFLINE'}</span>
                             </div>
                          </div>
                       </div>
                    </div>

                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-2 mb-6 px-1 h-8">
                      {user.bio || 'Neural node active. Establishing resonance.'}
                    </p>

                    <div className="mt-auto flex gap-2">
                       {!isMe && (
                         <button 
                           onClick={(e) => handleToggleFollow(e, user)}
                           disabled={isProcessing}
                           className={`flex-1 py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 ${
                             isFollowing 
                               ? 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-500 border border-slate-100 dark:border-slate-700' 
                               : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-indigo-600 dark:hover:bg-indigo-400 shadow-lg'
                           }`}
                         >
                           {isProcessing ? 'SYNCING...' : (isFollowing ? 'Disconnect' : 'Connect')}
                         </button>
                       )}
                       <button 
                         onClick={(e) => { e.stopPropagation(); onViewProfile(user); }}
                         className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-slate-300 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-white hover:border-indigo-100 dark:hover:border-indigo-900 transition-all active:scale-90 shadow-sm"
                       >
                          <ICONS.Profile />
                       </button>
                    </div>
                 </div>
               );
             })}
           </div>
         ) : (
           <div className="py-32 flex flex-col items-center justify-center text-center opacity-40 bg-slate-50/50 dark:bg-slate-800/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
              <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-3xl flex items-center justify-center mb-6 text-slate-300 dark:text-slate-600 shadow-sm border border-slate-100 dark:border-slate-800">
                 <ICONS.Search />
              </div>
              <h3 className="text-lg font-black uppercase tracking-widest italic text-slate-900 dark:text-white">Scan_Complete</h3>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] font-mono mt-1 text-slate-400 dark:text-slate-500">
                {searchQuery ? 'No nodes found matching query.' : 'Grid sector empty.'}
              </p>
           </div>
         )}
      </div>
    </div>
  );
};
