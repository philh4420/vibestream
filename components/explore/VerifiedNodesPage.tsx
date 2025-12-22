
import React, { useState } from 'react';
import { User } from '../../types';
import { ICONS } from '../../constants';
import { db, auth } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { doc, writeBatch, serverTimestamp, increment } = Firestore as any;

interface VerifiedNodesPageProps {
  users: User[];
  onViewProfile: (user: User) => void;
  onFollow: (id: string) => void; // Keeping for interface compat, but implementing logic internally for now
}

export const VerifiedNodesPage: React.FC<VerifiedNodesPageProps> = ({ users, onViewProfile }) => {
  const verifiedUsers = users.filter(u => u.verifiedHuman || u.role === 'verified' || u.role === 'creator' || u.role === 'admin');
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  const handleFollow = async (targetUser: User) => {
    if (!auth.currentUser || !db) return;
    const currentUser = auth.currentUser;
    const isFollowing = followingIds.has(targetUser.id);
    
    // Optimistic UI
    if (isFollowing) {
        const newSet = new Set(followingIds);
        newSet.delete(targetUser.id);
        setFollowingIds(newSet);
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
        }
        await batch.commit();
    } catch (e) {
        console.error("Follow error", e);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 min-h-screen pb-20">
      
      <div className="bg-slate-950 rounded-[3.5rem] p-10 md:p-14 text-white shadow-2xl relative overflow-hidden border border-white/10">
         <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-amber-500/20 to-transparent blur-[100px] -translate-y-1/2 translate-x-1/3" />
         
         <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
               <div className="p-2 bg-amber-500 text-slate-950 rounded-xl shadow-lg shadow-amber-500/20"><ICONS.Verified /></div>
               <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.4em] font-mono">Premium_Directory</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none mb-4">Verified_Nodes</h1>
            <p className="text-sm font-medium text-slate-400 max-w-lg leading-relaxed">
              Citadel-authenticated identities. These nodes represent high-trust entities, creators, and system architects within the VibeStream grid.
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {verifiedUsers.map(user => {
           const isFollowing = followingIds.has(user.id);
           return (
             <div key={user.id} className="group bg-white border border-slate-100 rounded-[3rem] p-8 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 relative overflow-hidden">
                
                {/* Gold Accent */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-center gap-6 mb-6">
                   <div className="relative cursor-pointer" onClick={() => onViewProfile(user)}>
                      <div className="p-1 bg-gradient-to-tr from-amber-200 to-yellow-500 rounded-[1.6rem] shadow-lg">
                         <img src={user.avatarUrl} className="w-16 h-16 rounded-[1.4rem] object-cover border-2 border-white" alt="" />
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-slate-950 text-amber-400 p-1.5 rounded-lg border-2 border-white shadow-md scale-90">
                         <ICONS.Verified />
                      </div>
                   </div>
                   <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-black text-slate-950 uppercase italic tracking-tighter truncate">{user.displayName}</h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">@{user.username}</p>
                   </div>
                </div>

                <p className="text-xs text-slate-600 font-medium leading-relaxed line-clamp-2 mb-8 h-10 italic">
                  "{user.bio || 'Verified entity on the VibeStream grid.'}"
                </p>

                <div className="flex items-center gap-3">
                   <button 
                     onClick={() => handleFollow(user)}
                     className={`flex-1 py-4 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] transition-all shadow-sm active:scale-95 ${isFollowing ? 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-500' : 'bg-slate-50 hover:bg-slate-950 hover:text-white text-slate-900'}`}
                   >
                     {isFollowing ? 'Disconnect' : 'Establish_Link'}
                   </button>
                   <button onClick={() => onViewProfile(user)} className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-amber-500 hover:border-amber-200 transition-all active:scale-90 shadow-sm">
                      <ICONS.Profile />
                   </button>
                </div>
             </div>
           );
         })}
      </div>
    </div>
  );
};
