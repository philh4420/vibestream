
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
import { Chat, User, Region, WeatherInfo } from '../../types';
import { ICONS } from '../../constants';
import { ClusterCreationModal } from '../clusters/ClusterCreationModal';
import { ClusterChatInterface } from './ClusterChatInterface';
import { AtmosphericBackground } from '../messages/AtmosphericBackground';

interface ClustersPageProps {
  currentUser: User;
  locale: Region;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onOpenChat: (chatId: string) => void;
  allUsers: User[];
  weather?: WeatherInfo | null;
}

export const ClustersPage: React.FC<ClustersPageProps> = ({ currentUser, locale, addToast, onOpenChat, allUsers, weather }) => {
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

  // If a cluster is active, show the specialized cluster chat interface
  if (activeClusterId && activeClusterData) {
    return (
      <div className="h-[calc(100vh-var(--header-h)-var(--bottom-nav-h)-1rem)] md:h-[calc(100vh-var(--header-h)-3rem)] -mx-4 md:-mx-6 lg:-mx-4 xl:-mx-10 bg-[#fcfcfd] md:rounded-[3.5rem] overflow-hidden shadow-heavy relative border border-slate-100 animate-in fade-in duration-500">
         <AtmosphericBackground weather={weather || null}>
            <ClusterChatInterface 
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
    <div className="w-full max-w-[2400px] mx-auto space-y-8 pb-24 animate-in fade-in duration-700">
      
      {/* 1. Dashboard Header */}
      <div className="relative overflow-hidden rounded-[3rem] bg-slate-950 p-10 md:p-12 text-white shadow-2xl border border-white/10 group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3 group-hover:bg-indigo-500/30 transition-colors duration-1000" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/10 blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
           <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
                    <ICONS.Clusters />
                 </div>
                 <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] font-mono">SECURE_CHANNELS</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none">
                Neural_Clusters
              </h1>
              <p className="text-sm font-medium text-slate-400 max-w-lg leading-relaxed">
                Decentralized communication hubs. Establish high-bandwidth synchronization with multiple nodes simultaneously.
              </p>
           </div>

           <div className="flex gap-4 w-full md:w-auto">
              <div className="flex-1 md:flex-none px-6 py-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col items-center justify-center min-w-[100px]">
                 <span className="text-2xl font-black text-white leading-none">{clusters.length}</span>
                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Active</span>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex-1 md:flex-none px-8 py-4 bg-white text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group/btn"
              >
                <div className="group-hover/btn:rotate-90 transition-transform duration-500"><ICONS.Create /></div>
                INITIALIZE_CORE
              </button>
           </div>
        </div>
      </div>

      {/* 2. Cluster Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           {[1,2,3,4,5,6].map(i => (
             <div key={i} className="h-[320px] bg-slate-50 rounded-[3rem] animate-pulse border border-slate-100" />
           ))}
        </div>
      ) : clusters.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
           {clusters.map(cluster => (
             <div 
               key={cluster.id}
               onClick={() => setActiveClusterId(cluster.id)}
               className="group bg-white/70 backdrop-blur-xl border border-slate-100 rounded-[3rem] p-8 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] hover:border-indigo-200 transition-all duration-500 cursor-pointer relative overflow-hidden flex flex-col min-h-[340px] hover:-translate-y-1"
             >
                {/* Active Indicator & Avatar */}
                <div className="flex justify-between items-start mb-12 relative z-10">
                   <div className="relative">
                      <div className="w-20 h-20 rounded-[2rem] bg-slate-50 border border-slate-100 p-1 shadow-sm group-hover:scale-110 transition-transform duration-500">
                         <img src={cluster.clusterAvatar} className="w-full h-full object-cover rounded-[1.8rem]" alt="" />
                      </div>
                      <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-xl shadow-lg border border-slate-100 scale-90">
                         <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                      </div>
                   </div>
                   
                   <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                   </div>
                </div>

                {/* Info Block */}
                <div className="flex-1 relative z-10">
                   <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-4 group-hover:text-indigo-600 transition-colors line-clamp-2">
                     {cluster.clusterName}
                   </h3>
                   <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100/50 backdrop-blur-sm group-hover:bg-white group-hover:shadow-md transition-all">
                      <p className="text-[10px] font-bold text-slate-500 line-clamp-2 leading-relaxed">
                        <span className="text-indigo-500 mr-1">Last Signal:</span> 
                        "{cluster.lastMessage || 'Channel established.'}"
                      </p>
                   </div>
                </div>

                {/* Footer Stats */}
                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between relative z-10">
                   <div className="flex -space-x-3 pl-1">
                      {cluster.participants.slice(0, 4).map((pId, i) => (
                        <div key={i} className="w-9 h-9 rounded-full border-[3px] border-white bg-slate-200 overflow-hidden shadow-sm relative z-0 hover:z-10 hover:scale-110 transition-transform">
                           <img 
                             src={allUsers.find(u => u.id === pId)?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${pId}`} 
                             className="w-full h-full object-cover" 
                             alt="" 
                           />
                        </div>
                      ))}
                      {cluster.participants.length > 4 && (
                        <div className="w-9 h-9 rounded-full border-[3px] border-white bg-slate-900 text-white flex items-center justify-center text-[9px] font-black z-10 shadow-md">
                          +{cluster.participants.length - 4}
                        </div>
                      )}
                   </div>
                   <div className="flex flex-col items-end">
                      <span className="text-[9px] font-black text-slate-900 font-mono">{cluster.participants.length} NODES</span>
                      <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">SYNCED</span>
                   </div>
                </div>

                {/* Hover Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 via-indigo-50/0 to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-500" />
             </div>
           ))}
        </div>
      ) : (
        <div className="py-40 text-center bg-white rounded-[4rem] border border-slate-100 shadow-sm border-dashed">
           <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-slate-300 shadow-inner animate-pulse">
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
