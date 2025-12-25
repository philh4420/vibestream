
import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { ICONS } from '../../constants';
import { db, auth } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { doc, writeBatch, serverTimestamp, increment, collection, getDocs } = Firestore as any;

interface VerifiedNodesPageProps {
  users: User[];
  onViewProfile: (user: User) => void;
  onFollow?: (id: string) => void; 
}

export const VerifiedNodesPage: React.FC<VerifiedNodesPageProps> = ({ users, onViewProfile }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Filter for verified only
  const verifiedUsers = users.filter(u => 
    (u.verifiedHuman || u.role === 'verified' || u.role === 'creator' || u.role === 'admin') &&
    (u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
     u.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Initial Sync of Following Status
  useEffect(() => {
    const syncRelationships = async () => {
      if (!auth.currentUser || !db) return;
      try {
        const q = collection(db, 'users', auth.currentUser.uid, 'following');
        const snap = await getDocs(q);
        const ids = new Set<string>(snap.docs.map((d: any) => d.id));
        setFollowingIds(ids);
      } catch (e) {
        console.error("Sync Error", e);
      } finally {
        setIsSyncing(false);
      }
    };
    syncRelationships();
  }, []);

  const handleFollow = async (targetUser: User) => {
    if (!auth.currentUser || !db || processingIds.has(targetUser.id)) return;
    const currentUser = auth.currentUser;
    const isFollowing = followingIds.has(targetUser.id);
    
    // Optimistic Update
    setProcessingIds(prev => new Set(prev).add(targetUser.id));
    if (isFollowing) {
        setFollowingIds(prev => { const n = new Set(prev); n.delete(targetUser.id); return n; });
    } else {
        setFollowingIds(prev => new Set(prev).add(targetUser.id));
    }

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
            
            // Notification
            const notifRef = doc(collection(db, 'notifications'));
            batch.set(notifRef, {
              type: 'follow',
              fromUserId: currentUser.uid,
              fromUserName: currentUser.displayName || 'Verified Node',
              fromUserAvatar: currentUser.photoURL || '',
              toUserId: targetUser.id,
              text: 'established a secure link',
              isRead: false,
              timestamp: serverTimestamp(),
              pulseFrequency: 'cognition'
            });
        }
        await batch.commit();
    } catch (e) {
        // Revert on error
        if (isFollowing) setFollowingIds(prev => new Set(prev).add(targetUser.id));
        else setFollowingIds(prev => { const n = new Set(prev); n.delete(targetUser.id); return n; });
        console.error("Handshake failed", e);
    } finally {
        setProcessingIds(prev => { const n = new Set(prev); n.delete(targetUser.id); return n; });
    }
  };

  return (
    <div className="w-full max-w-[2400px] mx-auto space-y-8 pb-24 animate-in fade-in duration-700">
      
      {/* 1. Verified Header */}
      <div className="relative overflow-hidden rounded-[3rem] bg-slate-950 dark:bg-black p-10 md:p-12 text-white shadow-2xl border border-white/10 dark:border-slate-800 group">
         <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3 group-hover:bg-amber-500/20 transition-colors duration-1000" />
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
         
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 backdrop-blur-md rounded-xl border border-amber-500/20 text-amber-400">
                     <ICONS.Verified />
                  </div>
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] font-mono">Directory_Gold</span>
               </div>
               <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none text-white">
                 Verified_Nodes
               </h1>
               <p className="text-xs md:text-sm font-medium text-slate-400 max-w-lg leading-relaxed">
                 High-trust entities authenticated by Citadel protocols. These nodes represent the architectural backbone of the VibeStream grid.
               </p>
            </div>

            <div className="w-full md:w-auto min-w-[240px]">
               <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-400 transition-colors">
                    <ICONS.Search />
                  </div>
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Scan directory..."
                    className="w-full bg-white/5 border border-white/10 rounded-[2rem] pl-12 pr-6 py-5 text-sm font-bold text-white placeholder:text-slate-500 focus:bg-white/10 focus:border-amber-500/30 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all shadow-inner"
                  />
               </div>
            </div>
         </div>
      </div>

      {/* 2. Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
         {verifiedUsers.map((user, idx) => {
           const isFollowing = followingIds.has(user.id);
           const isProcessing = processingIds.has(user.id);
           const isMe = auth.currentUser?.uid === user.id;

           return (
             <div 
               key={user.id} 
               className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-6 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] dark:hover:shadow-black/20 hover:border-amber-200 dark:hover:border-amber-900 transition-all duration-500 relative flex flex-col animate-in fade-in slide-in-from-bottom-4"
               style={{ animationDelay: `${idx * 50}ms` }}
             >
                {/* Visual Header */}
                <div className="flex items-start justify-between mb-6">
                   <div className="flex items-center gap-4 cursor-pointer" onClick={() => onViewProfile(user)}>
                      <div className="relative">
                         <div className="p-1 bg-gradient-to-tr from-amber-200 to-yellow-500 rounded-[1.8rem] shadow-lg group-hover:scale-105 transition-transform duration-500">
                            <img src={user.avatarUrl} className="w-16 h-16 rounded-[1.6rem] object-cover border-2 border-white dark:border-slate-900 bg-slate-50 dark:bg-slate-800" alt="" />
                         </div>
                         <div className="absolute -bottom-2 -right-2 bg-slate-950 dark:bg-white text-amber-400 dark:text-amber-500 p-1.5 rounded-xl border-4 border-white dark:border-slate-900 shadow-md scale-90">
                            <ICONS.Verified />
                         </div>
                      </div>
                      <div>
                         <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tighter truncate leading-none mb-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{user.displayName}</h3>
                         <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 font-mono tracking-wider">@{user.username}</span>
                            {user.presenceStatus === 'Online' && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />}
                         </div>
                      </div>
                   </div>
                   
                   <button onClick={() => onViewProfile(user)} className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 rounded-2xl text-slate-300 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all active:scale-90">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                   </button>
                </div>

                {/* Stats / Bio */}
                <div className="mb-8 px-1">
                   <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-2 h-9 italic">
                     "{user.bio || 'Verified entity. Establishing secure grid presence.'}"
                   </p>
                   
                   <div className="mt-4 flex items-center gap-4">
                      <div className="flex flex-col">
                         <span className="text-lg font-black text-slate-900 dark:text-white leading-none tracking-tight">{user.followers}</span>
                         <span className="text-[7px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Linked_Nodes</span>
                      </div>
                      <div className="w-px h-6 bg-slate-100 dark:bg-slate-800" />
                      <div className="flex flex-col">
                         <span className="text-lg font-black text-slate-900 dark:text-white leading-none tracking-tight">{user.trustTier || 'Alpha'}</span>
                         <span className="text-[7px] font-black text-amber-500 uppercase tracking-widest font-mono">Trust_Level</span>
                      </div>
                   </div>
                </div>

                {/* Action */}
                <div className="mt-auto">
                   {!isMe && (
                     <button 
                       onClick={() => handleFollow(user)}
                       disabled={isProcessing}
                       className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-sm active:scale-95 disabled:opacity-50 ${
                         isFollowing 
                           ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-rose-500 hover:border-rose-200 dark:hover:border-rose-900' 
                           : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-400 dark:hover:text-slate-900 shadow-lg'
                       }`}
                     >
                       {isProcessing ? 'SYNCING...' : (isFollowing ? 'DISCONNECT' : 'ESTABLISH_LINK')}
                     </button>
                   )}
                </div>
             </div>
           );
         })}
      </div>

      {verifiedUsers.length === 0 && (
        <div className="py-32 flex flex-col items-center justify-center text-center opacity-40 bg-slate-50/50 dark:bg-slate-800/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
           <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center mb-6 text-slate-300 dark:text-slate-600 shadow-sm border border-slate-100 dark:border-slate-800">
              <ICONS.Verified />
           </div>
           <h3 className="text-2xl font-black uppercase tracking-widest italic text-slate-900 dark:text-white">Index_Empty</h3>
           <p className="text-[10px] font-black uppercase tracking-[0.3em] font-mono mt-2 text-slate-400 dark:text-slate-500">
             {searchQuery ? 'No verified nodes match your query.' : 'Directory synchronization pending.'}
           </p>
        </div>
      )}
    </div>
  );
};
