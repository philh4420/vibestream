
import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { collection, query, where, onSnapshot, orderBy, doc, getDoc, setDoc, serverTimestamp } = Firestore as any;
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
  initialClusterId?: string | null;
}

export const ClustersPage: React.FC<ClustersPageProps> = ({ currentUser, locale, addToast, onOpenChat, allUsers, weather, initialClusterId }) => {
  const [clusters, setClusters] = useState<Chat[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeClusterId, setActiveClusterId] = useState<string | null>(initialClusterId || null);

  useEffect(() => {
    if (!db || !currentUser.id) return;
    const q = query(collection(db, 'chats'), where('isCluster', '==', true), where('participants', 'array-contains', currentUser.id), orderBy('lastMessageTimestamp', 'desc'));
    const unsub = onSnapshot(q, (snap: any) => { setClusters(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Chat))); setLoading(false); });
    return () => unsub();
  }, [currentUser.id]);

  const activeClusterData = clusters.find(c => c.id === activeClusterId);

  if (activeClusterId && activeClusterData) {
    return (
      <div className="h-full w-full bg-[#fcfcfd] dark:bg-slate-900 rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden shadow-heavy relative border border-slate-100 dark:border-slate-800 animate-in fade-in duration-500">
        <AtmosphericBackground weather={weather || null}>
          <ClusterChatInterface chatId={activeClusterId} currentUser={currentUser} allUsers={allUsers} onBack={() => setActiveClusterId(null)} addToast={addToast} chatData={activeClusterData} />
        </AtmosphericBackground>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[2400px] mx-auto space-y-8 pb-24 animate-in fade-in duration-700">
      <div className="relative rounded-[3rem] bg-slate-950 p-10 md:p-12 text-white shadow-2xl border border-white/10 overflow-hidden group">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full translate-x-1/4 -translate-y-1/4 group-hover:bg-indigo-500/30 transition-colors duration-1000" />
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div className="space-y-4 max-w-xl">
               <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none text-white">Neural_Clusters</h1>
               <p className="text-xs font-medium text-slate-300 leading-relaxed">Decentralized communication hubs. Establish high-bandwidth synchronization with multiple nodes.</p>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="px-8 py-5 bg-white text-slate-950 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:shadow-[0_0_50px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
              <ICONS.Create /> INITIALIZE_CORE
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
         {clusters.map(cluster => (
           <div key={cluster.id} onClick={() => setActiveClusterId(cluster.id)} className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-8 hover:border-indigo-200 dark:hover:border-indigo-900 transition-all duration-500 cursor-pointer flex flex-col min-h-[340px] hover:-translate-y-1">
              <div className="flex justify-between items-start mb-12">
                 <img src={cluster.clusterAvatar} className="w-20 h-20 rounded-[2rem] object-cover border shadow-sm" alt="" />
                 <div className="text-[9px] font-black text-slate-400 font-mono bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-lg uppercase">CLUSTER_NODE</div>
              </div>
              <div className="flex-1">
                 <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-4 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{cluster.clusterName}</h3>
                 <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 line-clamp-2 italic">"{cluster.lastMessage || 'Channel established.'}"</p>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                 <div className="flex -space-x-3">
                    {cluster.participants.slice(0, 4).map((pId) => {
                      const peer = allUsers.find(u => u.id === pId);
                      const borderClass = peer?.cosmetics?.activeBorder ? `cosmetic-border-${peer.cosmetics.activeBorder}` : '';
                      return (
                        <div key={pId} className={`w-9 h-9 rounded-full border-[3px] border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800 overflow-hidden shadow-sm relative z-0 hover:z-10 hover:scale-110 transition-transform ${borderClass}`}>
                           <img src={peer?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${pId}`} className="w-full h-full object-cover rounded-full" alt="" />
                        </div>
                      );
                    })}
                 </div>
                 <span className="text-[9px] font-black text-slate-400 font-mono uppercase tracking-widest">{cluster.participants.length} NODES</span>
              </div>
           </div>
         ))}
      </div>

      {isModalOpen && (
        <ClusterCreationModal currentUser={currentUser} availableNodes={allUsers.filter(u => u.id !== currentUser.id)} onClose={() => setIsModalOpen(false)} onConfirm={(name, parts) => {
             const create = async () => {
                const clusterId = `cluster_${Math.random().toString(36).substring(2, 11)}`;
                try {
                  const participantData: any = { [currentUser.id]: { displayName: currentUser.displayName, avatarUrl: currentUser.avatarUrl } };
                  parts.forEach(pId => {
                     const user = allUsers.find(u => u.id === pId);
                     if (user) participantData[pId] = { displayName: user.displayName, avatarUrl: user.avatarUrl, activeBorder: user.cosmetics?.activeBorder };
                  });
                  await setDoc(doc(db, 'chats', clusterId), {
                    participants: [currentUser.id, ...parts], participantData, lastMessage: 'Cluster communications initialised.', lastMessageTimestamp: serverTimestamp(), isCluster: true, clusterName: name, clusterAdmin: currentUser.id, clusterAvatar: `https://api.dicebear.com/7.x/initials/svg?seed=${name}`
                  });
                  setIsModalOpen(false); setActiveClusterId(clusterId);
                } catch(e) { console.error(e); }
             };
             create();
          }} 
        />
      )}
    </div>
  );
};
