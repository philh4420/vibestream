
import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
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

export const MeshPage: React.FC<MeshPageProps> = ({ currentUser, locale, addToast, onViewProfile, blockedIds }) => {
  const [activeTab, setActiveTab] = useState<'following' | 'followers' | 'discover'>('following');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [myFollowingIds, setMyFollowingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchGraphData = async () => {
      setIsLoading(true);
      try {
        const myFollowingSnap = await getDocs(collection(db, 'users', currentUser.id, 'following'));
        const currentFollowing = new Set<string>(myFollowingSnap.docs.map((d: any) => String(d.id)));
        setMyFollowingIds(currentFollowing);

        let fetchedUsers: User[] = [];
        if (activeTab === 'discover') {
          const q = query(collection(db, 'users'), where('id', '!=', currentUser.id)); 
          const snap = await getDocs(q);
          fetchedUsers = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as User)).filter(u => !currentFollowing.has(u.id)).slice(0, 30);
        } else {
          const collectionRef = collection(db, 'users', currentUser.id, activeTab);
          const snap = await getDocs(collectionRef);
          const ids = snap.docs.map((d: any) => d.id);
          if (ids.length > 0) {
            const promises = ids.map(id => getDoc(doc(db, 'users', id)));
            const snaps = await Promise.all(promises);
            fetchedUsers = snaps.map(s => s.exists() ? ({ id: s.id, ...s.data() } as User) : null).filter(Boolean) as User[];
          }
        }
        setUsers(fetchedUsers.filter(u => !blockedIds?.has(u.id)));
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };
    fetchGraphData();
  }, [activeTab, currentUser.id, blockedIds]);

  const handleToggleFollow = async (e: React.MouseEvent, targetUser: User) => {
    e.stopPropagation(); if (!db) return;
    const isFollowing = myFollowingIds.has(targetUser.id);
    const batch = writeBatch(db);
    try {
        if (isFollowing) {
            batch.delete(doc(db, 'users', currentUser.id, 'following', targetUser.id));
            batch.update(doc(db, 'users', currentUser.id), { following: increment(-1) });
            setMyFollowingIds(prev => { const n = new Set(prev); n.delete(targetUser.id); return n; });
        } else {
            batch.set(doc(db, 'users', currentUser.id, 'following', targetUser.id), { linkedAt: serverTimestamp() });
            batch.update(doc(db, 'users', currentUser.id), { following: increment(1) });
            setMyFollowingIds(prev => new Set(prev).add(targetUser.id));
        }
        await batch.commit();
        addToast(isFollowing ? "Link Severed" : "Linked", "success");
    } catch (e) { addToast("Handshake Failed", "error"); }
  };

  const filteredUsers = users.filter(u => u.displayName.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="w-full max-w-[2400px] mx-auto pb-32 animate-in fade-in duration-700 space-y-8">
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-[2rem] w-full md:w-fit mx-auto">
         {(['following', 'followers', 'discover'] as const).map(tab => (
           <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-3 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-md' : 'text-slate-400'}`}>{tab}</button>
         ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {filteredUsers.map(user => {
           const borderClass = user.cosmetics?.activeBorder ? `cosmetic-border-${user.cosmetics.activeBorder}` : '';
           return (
             <div key={user.id} onClick={() => onViewProfile(user)} className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 flex items-center gap-4 hover:shadow-xl transition-all cursor-pointer">
                <div className={`relative shrink-0 w-16 h-16 rounded-[1.4rem] ${borderClass}`}>
                   <img src={user.avatarUrl} className="w-full h-full rounded-[1.4rem] object-cover bg-slate-100" alt="" />
                </div>
                <div className="flex-1 min-w-0">
                   <h4 className="font-black text-slate-900 dark:text-white uppercase italic tracking-tight truncate">{user.displayName}</h4>
                   <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest truncate">@{user.username}</p>
                </div>
                <button onClick={(e) => handleToggleFollow(e, user)} className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase transition-all ${myFollowingIds.has(user.id) ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : 'bg-indigo-600 text-white'}`}>
                   {myFollowingIds.has(user.id) ? 'LINKED' : 'CONNECT'}
                </button>
             </div>
           );
         })}
      </div>
    </div>
  );
};
