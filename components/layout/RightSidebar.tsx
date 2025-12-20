
import React, { useState, useEffect } from 'react';
import { db, auth } from '../../services/firebase';
import { 
  collection, 
  query, 
  getDocs, 
  limit, 
  orderBy,
  doc,
  updateDoc,
  where
} from 'firebase/firestore';
import { User as VibeUser, PresenceStatus } from '../../types';
import { PRESENCE_CONFIG, IDENTITY_SIGNALS, ICONS } from '../../constants';

interface RightSidebarProps {
  userData: VibeUser | null;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ userData }) => {
  const [activeContacts, setActiveContacts] = useState<VibeUser[]>([]);
  const [anniversaries, setAnniversaries] = useState<VibeUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [localStatus, setLocalStatus] = useState({
    presenceStatus: userData?.presenceStatus || 'Online',
    statusEmoji: userData?.statusEmoji || '⚡',
    statusMessage: userData?.statusMessage || ''
  });

  useEffect(() => {
    if (userData) {
      setLocalStatus({
        presenceStatus: userData.presenceStatus || 'Online',
        statusEmoji: userData.statusEmoji || '⚡',
        statusMessage: userData.statusMessage || ''
      });
    }
  }, [userData]);

  const updateNeuralStatus = async (updates: Partial<typeof localStatus>) => {
    if (!db || !auth.currentUser) return;
    setIsUpdatingStatus(true);
    const newStatus = { ...localStatus, ...updates };
    setLocalStatus(newStatus);
    
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), newStatus);
    } catch (e) {
      console.error("Status Sync Error:", e);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  useEffect(() => {
    const fetchSidebarData = async () => {
      if (!db) return;
      setIsLoading(true);
      
      try {
        // 1. Fetch Active Contacts (Users)
        const usersQuery = query(collection(db, 'users'), limit(15), orderBy('joinedAt', 'desc'));
        const usersSnap = await getDocs(usersQuery);
        const fetchedUsers = usersSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as VibeUser))
          .filter(user => user.id !== auth.currentUser?.uid);
        
        setActiveContacts(fetchedUsers);

        // 2. Mock Anniversary Logic (In production, this queries dob/joinedAt)
        // Filtering users who joined on this month/day in previous years
        const today = new Date();
        const currentMonthDay = `${today.getMonth() + 1}-${today.getDate()}`;
        
        const anniversaryUsers = fetchedUsers.filter(u => {
           if (!u.joinedAt) return false;
           const jDate = new Date(u.joinedAt);
           return jDate.getMonth() === today.getMonth() && jDate.getDate() === today.getDate();
        });
        setAnniversaries(anniversaryUsers);

      } catch (error) {
        console.error("Sidebar Intelligence Sync Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSidebarData();
  }, [userData?.id]);

  const PresenceDot = ({ status }: { status?: PresenceStatus }) => (
    <div className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${status ? PRESENCE_DOTS[status] : 'bg-slate-300'}`} />
  );

  const PRESENCE_DOTS: Record<PresenceStatus, string> = {
    'Online': 'bg-emerald-500',
    'Focus': 'bg-amber-500',
    'Deep Work': 'bg-rose-600',
    'In-Transit': 'bg-indigo-600',
    'Away': 'bg-slate-400',
    'Invisible': 'bg-slate-700',
    'Syncing': 'bg-blue-400'
  };

  return (
    <aside className="hidden xl:flex flex-col w-[340px] shrink-0 bg-[#f8fafc] border-l border-precision h-full pt-[calc(var(--header-h)+0.5rem)] pb-6 overflow-hidden">
      
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 space-y-8">
        
        {/* SECTION: Neural Status Control (Pinned Style) */}
        <div className="space-y-4">
           <div className="flex items-center justify-between px-2">
             <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest font-mono">My_Signal</h4>
             <span className={`text-[8px] font-bold ${isUpdatingStatus ? 'text-indigo-500 animate-pulse' : 'text-emerald-500'}`}>
               {isUpdatingStatus ? 'SYNCING...' : 'ACTIVE'}
             </span>
           </div>
           
           <div className="bg-white border-precision rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                 <button 
                  onClick={() => {/* Trigger emoji picker */}}
                  className="w-12 h-12 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center text-xl transition-all active:scale-90"
                 >
                   {localStatus.statusEmoji}
                 </button>
                 <div className="flex-1">
                   <input 
                     type="text"
                     value={localStatus.statusMessage}
                     onChange={(e) => setLocalStatus(prev => ({ ...prev, statusMessage: e.target.value }))}
                     onBlur={() => updateNeuralStatus({ statusMessage: localStatus.statusMessage })}
                     placeholder="Broadcast status..."
                     className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-800 focus:ring-0 placeholder:text-slate-300"
                   />
                   <p className="text-[9px] text-slate-400 font-mono font-bold mt-1 uppercase tracking-tight">
                     Mode: {localStatus.presenceStatus}
                   </p>
                 </div>
              </div>

              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {(Object.keys(PRESENCE_CONFIG) as PresenceStatus[]).map(status => (
                  <button 
                    key={status}
                    onClick={() => updateNeuralStatus({ presenceStatus: status })}
                    className={`shrink-0 w-8 h-8 rounded-full border transition-all flex items-center justify-center ${localStatus.presenceStatus === status ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-110' : 'bg-white border-slate-100 text-slate-300 hover:border-indigo-200'}`}
                    title={status}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${localStatus.presenceStatus === status ? 'bg-white' : PRESENCE_CONFIG[status].color}`} />
                  </button>
                ))}
              </div>
           </div>
        </div>

        {/* SECTION: Featured Signals (Sponsored) */}
        <div className="space-y-4">
           <h4 className="px-2 text-[11px] font-black text-slate-400 uppercase tracking-widest font-mono">Promoted_Nodes</h4>
           <div className="space-y-4">
              <a href="#" className="flex gap-4 group">
                 <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border-precision shadow-sm">
                    <img src="https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="React Conf" />
                 </div>
                 <div className="flex flex-col justify-center">
                    <p className="text-xs font-black text-slate-900 leading-tight mb-1 group-hover:text-indigo-600 transition-colors">Neural React Summit 2026</p>
                    <p className="text-[10px] text-slate-400 font-medium">grid-summit.vibe</p>
                 </div>
              </a>
              <a href="#" className="flex gap-4 group">
                 <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border-precision shadow-sm">
                    <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop" className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Vibe Design" />
                 </div>
                 <div className="flex flex-col justify-center">
                    <p className="text-xs font-black text-slate-900 leading-tight mb-1 group-hover:text-indigo-600 transition-colors">Precision UI Design Kit v5</p>
                    <p className="text-[10px] text-slate-400 font-medium">design.vibestream.io</p>
                 </div>
              </a>
           </div>
        </div>

        {/* SECTION: Neural Anniversaries (Birthdays) */}
        {anniversaries.length > 0 && (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
             <h4 className="px-2 text-[11px] font-black text-slate-400 uppercase tracking-widest font-mono">Identity_Anniversaries</h4>
             <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-5 flex items-start gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600">
                   <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M11.7 2.02c-0.11-0.01-0.23-0.02-0.34-0.02-3.14 0-5.71 2.53-5.71 5.65 0 0.8 0.17 1.57 0.48 2.27H3.45c-1.1 0-2 0.9-2 2v2c0 1.1 0.9 2 2 2v5c0 1.1 0.9 2 2 2h13c1.1 0 2-0.9 2-2v-5c1.1 0 2-0.9 2-2v-2c0-1.1-0.9-2-2-2h-2.68c0.31-0.7 0.48-1.47 0.48-2.27 0-3.12-2.57-5.65-5.71-5.65-0.12 0-0.23 0.01-0.34 0.02zM12 4.02c1.86 0 3.37 1.48 3.37 3.31 0 0.28-0.04 0.54-0.12 0.8-0.33 1.05-1.12 1.88-2.13 2.26L12 10.74l-1.12-0.35c-1.01-0.38-1.8-1.21-2.13-2.26-0.08-0.26-0.12-0.52-0.12-0.8 0-1.83 1.51-3.31 3.37-3.31z"/></svg>
                </div>
                <div className="flex-1">
                   <p className="text-xs font-bold text-slate-900 leading-tight">
                    {anniversaries[0].displayName} 
                    {anniversaries.length > 1 ? ` and ${anniversaries.length - 1} others` : ''} celebrating identity milestones today.
                   </p>
                   <button className="mt-3 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Transmit Congratulations</button>
                </div>
             </div>
          </div>
        )}

        {/* SECTION: Active Grid Nodes (Contacts) */}
        <div className="space-y-4">
           <div className="flex items-center justify-between px-2">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest font-mono">Active_Grid_Nodes</h4>
              <div className="flex items-center gap-2">
                 <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><ICONS.Search /></button>
                 <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><ICONS.Settings /></button>
              </div>
           </div>

           <div className="space-y-1">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                    <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                  </div>
                ))
              ) : activeContacts.map(node => (
                <button 
                  key={node.id}
                  className="w-full flex items-center justify-between p-3 hover:bg-white hover:shadow-sm hover:border-precision border border-transparent rounded-2xl transition-all group active:scale-95"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <img src={node.avatarUrl} className="w-10 h-10 rounded-xl object-cover bg-slate-50 border border-slate-100" alt="" />
                      <div className="absolute -bottom-1 -right-1">
                         <PresenceDot status={node.presenceStatus} />
                      </div>
                    </div>
                    <div className="text-left overflow-hidden">
                       <p className="text-sm font-extrabold text-slate-900 truncate tracking-tight">{node.displayName}</p>
                       {node.statusMessage && (
                         <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{node.statusEmoji} {node.statusMessage}</p>
                       )}
                    </div>
                  </div>
                  
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                     <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center scale-90">
                        <ICONS.Messages />
                     </div>
                  </div>
                </button>
              ))}
           </div>
        </div>

        {/* FOOTER: System Info */}
        <div className="pt-8 pb-4 border-t border-slate-100">
           <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">
             <a href="#" className="hover:text-indigo-600">Privacy</a>
             <a href="#" className="hover:text-indigo-600">Terms</a>
             <a href="#" className="hover:text-indigo-600">Cookies</a>
             <a href="#" className="hover:text-indigo-600">Policy</a>
           </div>
           <p className="px-2 text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] font-mono">VibeStream Node 2.6.GB • © 2026</p>
        </div>

      </div>
    </aside>
  );
};
