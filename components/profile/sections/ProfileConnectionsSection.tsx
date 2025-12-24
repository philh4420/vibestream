
import React, { useState, useEffect } from 'react';
import { User, Region } from '../../../types';
import { db } from '../../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { collection, getDocs, doc, getDoc } = Firestore as any;
import { ICONS } from '../../../constants';

interface ProfileConnectionsSectionProps {
  userData: User;
  currentUser: User;
  onViewProfile: (user: User) => void;
}

export const ProfileConnectionsSection: React.FC<ProfileConnectionsSectionProps> = ({ userData, currentUser, onViewProfile }) => {
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
          // Fetch user details for each ID
          // Note: In production, paginate this or use a specialized index
          const userPromises = connectionIds.map((id: string) => getDoc(doc(db, 'users', id)));
          const userSnaps = await Promise.all(userPromises);
          const users = userSnaps
            .map((s: any) => s.exists() ? ({ id: s.id, ...s.data() } as User) : null)
            .filter(Boolean) as User[];
          
          setConnections(users);
        }
      } catch (error) {
        console.error("Error fetching connections:", error);
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
    <div className="bg-white border-precision rounded-[3.5rem] p-8 md:p-12 shadow-sm animate-in fade-in slide-in-from-bottom-6 duration-700 max-w-[2560px] mx-auto min-h-[600px] flex flex-col">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10 pb-8 border-b border-slate-50">
         <div className="flex bg-slate-50 p-1.5 rounded-[2rem] border border-slate-100">
            <button 
              onClick={() => setActiveTab('followers')}
              className={`px-8 py-3 rounded-[1.6rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === 'followers' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}
            >
              Followers
            </button>
            <button 
              onClick={() => setActiveTab('following')}
              className={`px-8 py-3 rounded-[1.6rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${activeTab === 'following' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}
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
              className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] pl-12 pr-6 py-3.5 text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all placeholder:text-slate-400"
            />
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 scale-90">
               <ICONS.Search />
            </div>
         </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           {Array.from({length: 6}).map((_, i) => (
             <div key={i} className="h-24 bg-slate-50 rounded-[2rem] animate-pulse border border-slate-100" />
           ))}
        </div>
      ) : filteredConnections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           {filteredConnections.map(user => (
             <div 
               key={user.id} 
               onClick={() => onViewProfile(user)}
               className="group flex items-center gap-4 p-4 rounded-[2.2rem] bg-white border border-slate-100 hover:border-indigo-100 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
             >
                <div className="relative shrink-0">
                   <img src={user.avatarUrl} className="w-16 h-16 rounded-[1.4rem] object-cover bg-slate-100" alt="" />
                   {user.verifiedHuman && (
                     <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full border border-slate-50 text-indigo-500 shadow-sm">
                       <ICONS.Verified />
                     </div>
                   )}
                </div>
                
                <div className="flex-1 min-w-0">
                   <h4 className="text-sm font-black text-slate-900 uppercase italic tracking-tight truncate">{user.displayName}</h4>
                   <p className="text-[9px] font-mono text-slate-400 uppercase tracking-wider truncate">@{user.username}</p>
                   <p className="text-[9px] text-slate-500 font-medium truncate mt-1">{user.occupation || 'Grid Node'}</p>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-4">
                   <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                   </div>
                </div>
             </div>
           ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20 opacity-50">
           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-300">
              <ICONS.Profile />
           </div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono">No Connections Found</p>
        </div>
      )}

    </div>
  );
};
