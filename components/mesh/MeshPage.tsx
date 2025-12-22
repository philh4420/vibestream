
import React, { useState, useEffect } from 'react';
import { db, auth } from '../../services/firebase';
// Fixed: Using namespaced import for firebase/firestore to resolve "no exported member" errors
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
  writeBatch
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
  const [nodes, setNodes] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<string[]>([]);

  // Fetch logic based on tab
  useEffect(() => {
    if (!db || !currentUser.id) return;
    
    const fetchNodes = async () => {
      setIsLoading(true);
      try {
        let userIds: string[] = [];
        let fetchedUsers: User[] = [];

        if (activeTab === 'discover') {
          // Fetch all users (limited) excluding self
          const q = query(collection(db, 'users'), where('id', '!=', currentUser.id)); // Note: Firestore inequality requires index usually, or client filter
          // Simplified for robustness: fetch all, filter client side if list small, or use limit
          const snap = await getDocs(collection(db, 'users'));
          fetchedUsers = snap.docs
            .map((d: any) => ({ id: d.id, ...d.data() } as User))
            .filter((u: any) => u.id !== currentUser.id)
            .slice(0, 50);
        } else if (activeTab === 'following') {
          const snap = await getDocs(collection(db, 'users', currentUser.id, 'following'));
          userIds = snap.docs.map((d: any) => d.id);
        } else if (activeTab === 'followers') {
          const snap = await getDocs(collection(db, 'users', currentUser.id, 'followers'));
          userIds = snap.docs.map((d: any) => d.id);
        }

        if (userIds.length > 0) {
          // Fetch user details for IDs (batching 10 for simplicity in this demo, usually utilize 'in' query)
          // For 'Your Mesh', likely connection count is manageable. 
          const userPromises = userIds.map(id => getDocs(query(collection(db, 'users'), where('id', '==', id))));
          const userSnaps = await Promise.all(userPromises);
          fetchedUsers = userSnaps.map(s => !s.empty ? ({ id: s.docs[0].id, ...s.docs[0].data() } as User) : null).filter(Boolean) as User[];
        }

        setNodes(fetchedUsers);
      } catch (e) {
        console.error("Mesh Sync Error", e);
        addToast("Grid Sync Failed", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNodes();
  }, [activeTab, currentUser.id]);

  const handleToggleLink = async (targetUser: User, action: 'link' | 'unlink') => {
    if (!db || !currentUser.id) return;
    setProcessingIds(prev => [...prev, targetUser.id]);

    const batch = writeBatch(db);
    const myFollowingRef = doc(db, 'users', currentUser.id, 'following', targetUser.id);
    const theirFollowersRef = doc(db, 'users', targetUser.id, 'followers', currentUser.id);
    const myRef = doc(db, 'users', currentUser.id);
    const theirRef = doc(db, 'users', targetUser.id);

    try {
      if (action === 'link') {
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
        addToast(`Link Established: ${targetUser.displayName}`, "success");
        if (activeTab === 'discover') {
           // Optional: remove from discover or mark linked
        }
      } else {
        batch.delete(myFollowingRef);
        batch.delete(theirFollowersRef);
        batch.update(myRef, { following: increment(-1) });
        batch.update(theirRef, { followers: increment(-1) });
        await batch.commit();
        addToast(`Link Severed: ${targetUser.displayName}`, "info");
        if (activeTab === 'following') {
          setNodes(prev => prev.filter(n => n.id !== targetUser.id));
        }
      }
    } catch (e) {
      addToast("Handshake Protocol Failed", "error");
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== targetUser.id));
    }
  };

  const tabs = [
    { id: 'following', label: 'Linked_Nodes', count: currentUser.following },
    { id: 'followers', label: 'Incoming_Signals', count: currentUser.followers },
    { id: 'discover', label: 'Discover_Grid', count: null }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-screen pb-20">
      
      {/* Header Cluster */}
      <div className="bg-white border-precision rounded-[3rem] p-8 md:p-10 shadow-sm relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[80px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
         
         <div className="relative z-10">
           <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><ICONS.Profile /></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono">Mesh_Network_v2.6</span>
           </div>
           <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none mb-2">Your_Mesh</h1>
           <p className="text-sm font-medium text-slate-500 max-w-lg leading-relaxed">
             Manage your neural connections. Active links amplify your signal reach across the grid.
           </p>
         </div>

         <div className="flex flex-wrap gap-2 mt-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${activeTab === tab.id ? 'bg-slate-950 text-white border-slate-950 shadow-lg' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'}`}
              >
                {tab.label}
                {tab.count !== null && <span className="ml-2 opacity-50 font-mono">[{tab.count}]</span>}
              </button>
            ))}
         </div>
      </div>

      {/* Nodes Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {[1,2,3,4,5,6].map(i => (
             <div key={i} className="h-48 bg-white border border-slate-100 rounded-[2.5rem] animate-pulse" />
           ))}
        </div>
      ) : nodes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           {nodes.map(node => {
             const isProcessing = processingIds.includes(node.id);
             return (
               <div key={node.id} className="group bg-white border border-slate-100 rounded-[2.5rem] p-6 hover:shadow-xl hover:border-indigo-100 transition-all duration-500 relative overflow-hidden">
                  <div className="flex items-start justify-between relative z-10">
                     <div className="flex items-center gap-4 cursor-pointer" onClick={() => onViewProfile(node)}>
                        <div className="relative">
                           <img src={node.avatarUrl} className="w-16 h-16 rounded-[1.2rem] object-cover ring-4 ring-slate-50 group-hover:ring-white transition-all shadow-sm" alt="" />
                           <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${node.presenceStatus === 'Online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                        </div>
                        <div>
                           <h3 className="font-black text-slate-950 text-lg uppercase italic tracking-tighter leading-none">{node.displayName}</h3>
                           <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest font-mono mt-1">@{node.username}</p>
                           <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest font-mono mt-2 flex items-center gap-2">
                             <span className="w-1 h-1 bg-slate-300 rounded-full" /> {node.role || 'Member'}
                           </p>
                        </div>
                     </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-50 flex items-center gap-3 relative z-10">
                     <button 
                       onClick={() => handleToggleLink(node, activeTab === 'following' ? 'unlink' : 'link')}
                       disabled={isProcessing}
                       className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 ${activeTab === 'following' ? 'bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500' : 'bg-slate-950 text-white hover:bg-indigo-600 shadow-lg'}`}
                     >
                       {isProcessing ? 'SYNCING...' : (activeTab === 'following' ? 'SEVER_LINK' : 'ESTABLISH_LINK')}
                     </button>
                     <button onClick={() => onViewProfile(node)} className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all active:scale-90">
                        <ICONS.Profile />
                     </button>
                  </div>
               </div>
             );
           })}
        </div>
      ) : (
        <div className="py-32 text-center bg-white rounded-[3rem] border border-slate-100 border-dashed">
           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <ICONS.Globe />
           </div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono italic">
             {activeTab === 'following' ? 'No active neural links found.' : 'No incoming signals detected.'}
           </p>
           {activeTab !== 'discover' && (
             <button onClick={() => setActiveTab('discover')} className="mt-8 px-8 py-3 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all">
               Scan_Discovery_Grid
             </button>
           )}
        </div>
      )}
    </div>
  );
};
