
import React, { useState, useEffect } from 'react';
import { User } from '../../../types';
import { db } from '../../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { collection, getDocs, doc, getDoc } = Firestore as any;
import { ICONS } from '../../../constants';

interface ProfileConnectionsSectionProps {
  userData: User;
  currentUser: User;
  onViewProfile: (user: User) => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ProfileConnectionsSection: React.FC<ProfileConnectionsSectionProps> = ({ userData, currentUser, onViewProfile, addToast }) => {
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>('followers');
  const [connections, setConnections] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchConnections = async () => {
      if (!db || !userData.id) return;
      setLoading(true);
      setConnections([]);

      try {
        const collectionRef = collection(db, 'users', userData.id, activeTab);
        const snapshot = await getDocs(collectionRef);
        const connectionIds = snapshot.docs.map((d: any) => d.id);

        if (connectionIds.length > 0) {
          const userPromises = connectionIds.map((id: string) => getDoc(doc(db, 'users', id)));
          const userSnaps = await Promise.all(userPromises);
          const users = userSnaps
            .map((s: any) => s.exists() ? ({ id: s.id, ...s.data() } as User) : null)
            .filter(Boolean) as User[];
          
          setConnections(users);
        }
      } catch (error) {
        console.error("Error fetching connections:", error);
        addToast("Connection Sync Failed", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, [userData.id, activeTab]);

  const filteredConnections = connections.filter(u => 
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3.5rem] p-8 md:p-12 shadow-sm animate-in fade-in slide-in-from-bottom-6 duration-700 max-w-[2560px] mx-auto min-h-[600px] flex flex-col transition-colors">
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10 pb-8 border-b border-slate-100 dark:border-slate-800">
         <div className="flex bg-slate-50 dark:bg-slate-800 p-1.5 rounded-[2rem] border border-slate-100 dark:border-slate-700">
            <button 
              onClick={() => setActiveTab('followers')}
              className={`px-8 py-3 rounded-[1.6rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === 'followers' ? 'bg-indigo-600 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Followers
            </button>
            <button 
              onClick={() => setActiveTab('following')}
              className={`px-8 py-3 rounded-[1.6rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === 'following' ? 'bg-indigo-600 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Following
            </button>
         </div>

         <div className="relative w-full md:w-72">
            <input 
              type="text" 
              placeholder="Search Nodes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[1.5rem] pl-12 pr-6 py-3.5 text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/20 focus:border-indigo-200 dark:focus:border-indigo-800 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white"
            />
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 scale-90">
               <ICONS.Search />
            </div>
         </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           {[1,2,3,4,5,6].map(i => (
             <div key={i} className="h-24 bg-slate-50 dark:bg-slate-800 rounded-[2rem] animate-pulse border border-slate-100 dark:border-slate-700" />
           ))}
        </div>
      ) : filteredConnections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           {filteredConnections.map(user => (
             <div 
               key={user.id} 
               onClick={() => onViewProfile(user)}
               className="group flex items-center gap-4 p-4 rounded-[2.2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-900 hover:shadow-lg dark:hover:shadow-indigo-900/10 transition-all cursor-pointer relative overflow-hidden active:scale-[0.98]"
             >
                <div className="relative shrink-0">
                   <img src={user.avatarUrl} className="w-16 h-16 rounded-[1.4rem] object-cover bg-slate-100 dark:bg-slate-800 border-2 border-transparent group-hover:border-indigo-100 dark:group-hover:border-indigo-900 transition-colors" alt="" />
                   {user.verifiedHuman && (
                     <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 p-0.5 rounded-full border border-slate-50 dark:border-slate-800 text-indigo-500 dark:text-indigo-400 shadow-sm">
                       <ICONS.Verified />
                     </div>
                   )}
                </div>
                
                <div className="flex-1 min-w-0">
                   <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{user.displayName}</h4>
                   <p className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">@{user.username}</p>
                   <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium truncate mt-1">{user.occupation || 'Grid Node'}</p>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-4">
                   <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M9 5l7 7-7 7" /></svg>
                   </div>
                </div>
             </div>
           ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20 opacity-50">
           <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-300 dark:text-slate-600 border border-slate-100 dark:border-slate-700">
              <ICONS.Profile />
           </div>
           <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] font-mono">No Connections Found</p>
        </div>
      )}

    </div>
  );
};
