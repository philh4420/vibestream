
import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  doc,
  setDoc,
  serverTimestamp
} = Firestore as any;
import { Chat, User, Region } from '../../types';
import { ICONS } from '../../constants';
import { ClusterCreationModal } from '../messages/ClusterCreationModal';
import { ChatInterface } from '../messages/ChatInterface';
import { AtmosphericBackground } from '../messages/AtmosphericBackground';

interface ClustersPageProps {
  currentUser: User;
  locale: Region;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onOpenChat: (chatId: string) => void;
  allUsers: User[];
}

export const ClustersPage: React.FC<ClustersPageProps> = ({ currentUser, locale, addToast, onOpenChat, allUsers }) => {
  const [clusters, setClusters] = useState<Chat[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeClusterId, setActiveClusterId] = useState<string | null>(null);

  useEffect(() => {
    if (!db || !currentUser.id) return;
    
    // Fetch chats where isCluster is true and user is participant
    const q = query(
      collection(db, 'chats'), 
      where('isCluster', '==', true),
      where('participants', 'array-contains', currentUser.id),
      orderBy('lastMessageTimestamp', 'desc')
    );

    const unsub = onSnapshot(q, (snap: any) => {
      setClusters(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Chat)));
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser.id]);

  const activeClusterData = clusters.find(c => c.id === activeClusterId);

  // If a cluster is active, show the chat interface
  if (activeClusterId && activeClusterData) {
    return (
      <div className="h-[calc(100vh-var(--header-h)-var(--bottom-nav-h)-1rem)] md:h-[calc(100vh-var(--header-h)-3rem)] -mx-4 sm:-mx-6 md:-mx-10 lg:-mx-14 bg-[#fcfcfd] md:rounded-[3.5rem] overflow-hidden shadow-heavy relative border border-slate-100 animate-in fade-in duration-500">
         <AtmosphericBackground weather={null}>
            <ChatInterface 
                chatId={activeClusterId}
                currentUser={currentUser}
                allUsers={allUsers}
                onBack={() => setActiveClusterId(null)}
                addToast={addToast}
                chatData={activeClusterData}
            />
         </AtmosphericBackground>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 min-h-screen pb-20">
      
      {/* Header Hero */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
         <div>
            <div className="flex items-center gap-3 mb-4">
               <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
               <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] font-mono">Neural_Hive_Minds</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Clusters</h1>
            <p className="text-sm font-medium text-slate-500 mt-4 max-w-md leading-relaxed">
              High-bandwidth communication hubs. Sync with multiple nodes in a shared frequency space.
            </p>
         </div>
         
         <button 
           onClick={() => setIsModalOpen(true)}
           className="px-8 py-5 bg-slate-950 text-white rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all active:scale-95 flex items-center gap-3 group"
         >
           <div className="group-hover:rotate-90 transition-transform duration-500"><ICONS.Clusters /></div>
           INITIATE_FUSION
         </button>
      </div>

      {/* Cluster Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {[1,2,3,4].map(i => <div key={i} className="h-64 bg-white rounded-[3rem] animate-pulse border border-slate-100" />)}
        </div>
      ) : clusters.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           {clusters.map(cluster => (
             <div 
               key={cluster.id}
               onClick={() => setActiveClusterId(cluster.id)}
               className="group bg-white border border-slate-100 rounded-[3rem] p-8 hover:shadow-2xl hover:border-indigo-100 transition-all duration-500 cursor-pointer relative overflow-hidden flex flex-col min-h-[300px]"
             >
                {/* Visual Header */}
                <div className="flex items-center justify-between mb-8 relative z-10">
                   <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                      <img src={cluster.clusterAvatar} className="w-full h-full object-cover rounded-[1.5rem] opacity-90" alt="" />
                   </div>
                   <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        {cluster.participants.length} Nodes
                      </span>
                   </div>
                </div>

                <div className="flex-1 relative z-10">
                   <h3 className="text-2xl font-black text-slate-950 uppercase italic tracking-tighter leading-none mb-3 group-hover:text-indigo-600 transition-colors">
                     {cluster.clusterName}
                   </h3>
                   <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
                     Last Signal: "{cluster.lastMessage || 'Channel established.'}"
                   </p>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between relative z-10">
                   <div className="flex -space-x-3">
                      {cluster.participants.slice(0, 4).map((pId, i) => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm">
                           <img 
                             src={allUsers.find(u => u.id === pId)?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${pId}`} 
                             className="w-full h-full object-cover" 
                             alt="" 
                           />
                        </div>
                      ))}
                      {cluster.participants.length > 4 && (
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-900 text-white flex items-center justify-center text-[9px] font-bold z-10">
                          +{cluster.participants.length - 4}
                        </div>
                      )}
                   </div>
                   <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em] font-mono italic">ACTIVE</span>
                </div>

                <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
             </div>
           ))}
        </div>
      ) : (
        <div className="py-40 text-center bg-white rounded-[4rem] border border-slate-100 shadow-sm border-dashed">
           <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-slate-300 shadow-inner">
              <ICONS.Clusters />
           </div>
           <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">No_Active_Clusters</h2>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono mt-3 px-10 mb-10">You are not synced with any hive minds.</p>
           <button 
             onClick={() => setIsModalOpen(true)}
             className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-indigo-700 transition-all active:scale-95"
           >
             Create_First_Cluster
           </button>
        </div>
      )}

      {isModalOpen && (
        <ClusterCreationModal 
          currentUser={currentUser} 
          availableNodes={allUsers.filter(u => u.id !== currentUser.id)} 
          onClose={() => setIsModalOpen(false)} 
          onConfirm={(name, parts) => {
             const create = async () => {
                const clusterId = `cluster_${Math.random().toString(36).substring(2, 11)}`;
                try {
                  const participantData: any = { [currentUser.id]: { displayName: currentUser.displayName, avatarUrl: currentUser.avatarUrl } };
                  parts.forEach(pId => {
                     const user = allUsers.find(u => u.id === pId);
                     if (user) participantData[pId] = { displayName: user.displayName, avatarUrl: user.avatarUrl };
                  });
                  await setDoc(doc(db, 'chats', clusterId), {
                    participants: [currentUser.id, ...parts],
                    participantData,
                    lastMessage: 'Cluster communications initialised.',
                    lastMessageTimestamp: serverTimestamp(),
                    isCluster: true,
                    clusterName: name,
                    clusterAdmin: currentUser.id,
                    clusterAvatar: `https://api.dicebear.com/7.x/initials/svg?seed=${name}`
                  });
                  addToast("Cluster Fusion Complete", "success");
                  setIsModalOpen(false);
                  setActiveClusterId(clusterId); // Open chat immediately
                } catch(e) { addToast("Fusion Failed", "error"); }
             };
             create();
          }} 
        />
      )}
    </div>
  );
};
