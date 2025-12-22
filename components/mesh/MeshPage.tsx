
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
  
  // Track who the current user follows to toggle buttons correctly in "Discover" or "Followers" mode
  const [myFollowingIds, setMyFollowingIds] = useState<Set<string>>(new Set());

  // Initial Data Fetch
  useEffect(() => {
    if (!db || !currentUser.id) return;
    
    const fetchGraphData = async () => {
      setIsLoading(true);
      try {
        let fetchedUsers: User[] = [];
        const myFollowingSnap = await getDocs(collection(db, 'users', currentUser.id, 'following'));
        // Explicitly type the Set as Set<string> to avoid type inference errors
        const currentFollowing = new Set<string>(myFollowingSnap.docs.map((d: any) => String(d.id)));
        setMyFollowingIds(currentFollowing);

        if (activeTab === 'discover') {
          // Fetch all users, filter out self and already following
          // Optimized: Real app would use a recommendation engine or paginated query
          const q = query(collection(db, 'users'), where('id', '!=', currentUser.id)); 
          const snap = await getDocs(q);
          
          fetchedUsers = snap.docs
            .map((d: any) => ({ id: d.id, ...d.data() } as User))
            .filter((u: any) => !currentFollowing.has(u.id))
            .slice(0, 50);

        } else if (activeTab === 'following') {
          // Fetch details of users I follow
          // Note: Firestore 'in' query supports max 10. For production, fetch in batches or denormalize basic user data.
          // Falling back to parallel fetching for this architecture scale.
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

  const handleToggleFollow = async (targetUser: User) => {
    if (!db || !currentUser.id) return;
    
    // Optimistic UI Update
    const isFollowing = myFollowingIds.has(targetUser.id);
    const action = isFollowing ? 'unfollow' : 'follow';
    
    setProcessingIds(prev => [...prev, targetUser.id]);

    // Update local state immediately
    if (action === 'follow') {
      setMyFollowingIds(prev => new Set(prev).add(targetUser.id));
      if (activeTab === 'discover') {
        // Remove from discover list visually
        setUsers(prev => prev.filter(u => u.id !== targetUser.id));
      }
    } else {
      const newSet = new Set(myFollowingIds);
      newSet.delete(targetUser.id);
      setMyFollowingIds(newSet);
      if (activeTab === 'following') {
        // Remove from following list visually
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
        
        // Add Notification
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
      // Revert optimistic update on failure
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

  const tabs = [
    { id: 'following', label: 'Network', count: currentUser.following },
    { id: 'followers', label: 'Audience', count: currentUser.followers },
    { id: 'discover', label: 'Discover', count: null }
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-screen pb-20">
      
      {/* 1. Header & Stats Cluster */}
      <div className="bg-white border-precision rounded-[2.5rem] p-6 md:p-8 shadow-sm relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[80px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
         
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
           <div>
             <div className="flex items-center gap-3 mb-3">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><ICONS.Profile /></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono">NEURAL_MESH_v2.6</span>
             </div>
             <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-2">My_Connections</h1>
           </div>
           
           <div className="flex gap-4">
              <div className="text-center px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                 <div className="text-xl font-black text-slate-900 leading-none">{currentUser.following}</div>
                 <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono mt-1">Following</div>
              </div>
              <div className="text-center px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                 <div className="text-xl font-black text-slate-900 leading-none">{currentUser.followers}</div>
                 <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono mt-1">Followers</div>
              </div>
           </div>
         </div>

         {/* Navigation Tabs */}
         <div className="flex items-center gap-2 mt-8 overflow-x-auto no-scrollbar pb-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${activeTab === tab.id ? 'bg-slate-950 text-white border-slate-950 shadow-lg' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'}`}
              >
                {tab.label}
              </button>
            ))}
         </div>
      </div>

      {/* 2. Search & List Container */}
      <div className="bg-white border-precision rounded-[2.5rem] shadow-sm min-h-[500px] flex flex-col">
        {/* Search Bar */}
        <div className="p-6 border-b border-slate-50 sticky top-0 bg-white/95 backdrop-blur-xl z-20 rounded-t-[2.5rem]">
           <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors"><ICONS.Search /></div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTab}...`}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all placeholder:text-slate-300"
              />
           </div>
        </div>

        {/* User List */}
        <div className="flex-1 p-4 md:p-6 space-y-4">
           {isLoading ? (
             Array.from({ length: 6 }).map((_, i) => (
               <div key={i} className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 animate-pulse">
                  <div className="w-14 h-14 bg-slate-200 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                     <div className="h-3 w-1/3 bg-slate-200 rounded-full" />
                     <div className="h-2 w-1/4 bg-slate-200 rounded-full" />
                  </div>
               </div>
             ))
           ) : filteredUsers.length > 0 ? (
             filteredUsers.map(user => {
               const isFollowing = myFollowingIds.has(user.id);
               const isMe = user.id === currentUser.id;
               const isProcessing = processingIds.includes(user.id);

               return (
                 <div key={user.id} className="flex items-center gap-4 p-4 rounded-[2rem] bg-white border border-slate-100 hover:border-indigo-100 hover:shadow-lg transition-all group">
                    <div className="relative cursor-pointer shrink-0" onClick={() => onViewProfile(user)}>
                       <img src={user.avatarUrl} className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-50 shadow-sm" alt="" />
                       <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-white rounded-full ${user.presenceStatus === 'Online' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onViewProfile(user)}>
                       <div className="flex items-center gap-2">
                          <h3 className="font-black text-slate-900 text-sm uppercase italic tracking-tight truncate">{user.displayName}</h3>
                          {user.verifiedHuman && <div className="text-indigo-500 scale-75"><ICONS.Verified /></div>}
                       </div>
                       <p className="text-[10px] font-bold text-slate-400 font-mono tracking-wider truncate mb-0.5">@{user.username}</p>
                       <p className="text-[10px] text-slate-500 font-medium truncate opacity-0 group-hover:opacity-100 transition-opacity">
                         {user.bio || 'Node active.'}
                       </p>
                    </div>

                    {!isMe && (
                      <button 
                        onClick={() => handleToggleFollow(user)}
                        disabled={isProcessing}
                        className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shrink-0 ${isFollowing ? 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-500' : 'bg-slate-950 text-white hover:bg-indigo-600 shadow-lg'}`}
                      >
                        {isProcessing ? '...' : (isFollowing ? 'Following' : 'Follow')}
                      </button>
                    )}
                 </div>
               );
             })
           ) : (
             <div className="py-20 text-center flex flex-col items-center opacity-40">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                   <ICONS.Search />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] font-mono italic">
                  {searchQuery ? 'No nodes found matching query.' : 'Grid sector empty.'}
                </p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
