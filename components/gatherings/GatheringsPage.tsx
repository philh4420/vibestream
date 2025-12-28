
import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  doc,
  writeBatch,
  getDocs
} = Firestore as any;
import { User, Gathering, Region } from '../../types';
import { ICONS } from '../../constants';
import { CreateGatheringModal } from './CreateGatheringModal';

interface GatheringsPageProps {
  currentUser: User;
  locale: Region;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  allUsers: User[];
  /* Fixed: onOpenLobby now expects a Gathering object to match the signature in App.tsx */
  onOpenLobby: (gathering: Gathering) => void;
  onViewGathering: (gathering: Gathering) => void;
  onRSVP: (gatheringId: string, isAttendingOrWaitlisted: boolean) => void;
}

export const GatheringsPage: React.FC<GatheringsPageProps> = ({ 
  currentUser, 
  locale, 
  addToast, 
  allUsers, 
  onOpenLobby,
  onViewGathering,
  onRSVP
}) => {
  const [gatherings, setGatherings] = useState<Gathering[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Social' | 'Tech' | 'Gaming' | 'Nightlife' | 'Workshop'>('All');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    if (!db) return;
    
    // CRITICAL FIX: We use a naked query with only an order. 
    // This removes the need for composite indexes in Firebase which often causes the 'QUIC' and 'Failed to load' errors.
    const q = query(
      collection(db, 'gatherings'),
      orderBy('date', 'asc')
    );

    const unsub = onSnapshot(q, (snap: any) => {
      const allFetched = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Gathering));
      
      // CLIENT-SIDE FILTERING:
      // This is foolproof. We check if the event date is greater than 24 hours ago.
      // This ensures 2026, 2027, etc., always show up correctly.
      const now = new Date();
      const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000); 

      const relevant = allFetched.filter(g => {
        if (!g.date) return false;
        const gDate = new Date(g.date);
        return gDate >= cutoff;
      });

      setGatherings(relevant);
      setIsLoading(false);
    }, (err: any) => {
      console.error("Gathering Sync Failure:", err);
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  const handleCreate = async (data: any) => {
    if (!db || !currentUser) return;
    try {
      const batch = writeBatch(db);
      
      const recurrence = data.recurrence || 'none';
      let iterations = 1;
      let recurrenceId = '';

      if (recurrence === 'weekly') {
        iterations = 4;
        recurrenceId = `series_${Math.random().toString(36).substring(2, 9)}`;
      } else if (recurrence === 'monthly') {
        iterations = 3;
        recurrenceId = `series_${Math.random().toString(36).substring(2, 9)}`;
      }

      const baseDate = new Date(data.date);
      const notificationsToSend: any[] = [];

      for (let i = 0; i < iterations; i++) {
        const newGatheringRef = doc(collection(db, 'gatherings'));
        const newChatRef = doc(collection(db, 'chats'));
        
        const instanceDate = new Date(baseDate);
        if (recurrence === 'weekly') {
            instanceDate.setDate(baseDate.getDate() + (7 * i));
        } else if (recurrence === 'monthly') {
            instanceDate.setMonth(baseDate.getMonth() + i);
        }

        const gatheringPayload: any = {
            ...data,
            date: instanceDate.toISOString(),
            organizerId: currentUser.id,
            organizerName: currentUser.displayName,
            organizerAvatar: currentUser.avatarUrl,
            attendees: [currentUser.id],
            waitlist: [],
            createdAt: serverTimestamp(),
            linkedChatId: newChatRef.id
        };

        if (recurrence !== 'none') {
            gatheringPayload.recurrence = recurrence;
            gatheringPayload.recurrenceId = recurrenceId;
            gatheringPayload.seriesIndex = i + 1;
            gatheringPayload.title = `${data.title} (Session ${i + 1})`;
        }

        batch.set(newGatheringRef, gatheringPayload);

        // Lobby Initialization
        batch.set(newChatRef, {
            participants: [currentUser.id],
            participantData: {
                [currentUser.id]: { displayName: currentUser.displayName, avatarUrl: currentUser.avatarUrl }
            },
            lastMessage: 'Neural Lobby initialized.',
            lastMessageTimestamp: serverTimestamp(),
            isCluster: true,
            isEventLobby: true, // Required for public access via rules
            clusterName: `LOBBY: ${gatheringPayload.title}`,
            clusterAvatar: data.coverUrl,
            clusterAdmin: currentUser.id
        });

        if (i === 0) {
            notificationsToSend.push({
                targetId: newGatheringRef.id,
                title: gatheringPayload.title
            });
        }
      }

      const followersRef = collection(db, 'users', currentUser.id, 'followers');
      const followersSnap = await getDocs(followersRef);

      if (!followersSnap.empty && notificationsToSend.length > 0) {
        const firstEvent = notificationsToSend[0];
        followersSnap.docs.forEach((followerDoc: any) => {
          const followerId = followerDoc.id; 
          const notifRef = doc(collection(db, 'notifications'));
          batch.set(notifRef, {
            type: 'gathering_create',
            fromUserId: currentUser.id,
            fromUserName: currentUser.displayName,
            fromUserAvatar: currentUser.avatarUrl,
            toUserId: followerId,
            targetId: firstEvent.targetId,
            text: `initialized a new gathering: "${firstEvent.title}"`,
            isRead: false,
            timestamp: serverTimestamp(),
            pulseFrequency: 'intensity'
          });
        });
      }

      await batch.commit();
      addToast(recurrence !== 'none' ? "Recurring Protocol Initialized" : "Gathering & Lobby Initialized", "success");
      setIsCreateOpen(false);
    } catch (e) {
      console.error(e);
      addToast("Failed to Initialize Gathering", "error");
    }
  };

  const filteredGatherings = activeFilter === 'All' 
    ? gatherings 
    : gatherings.filter(g => g.category === activeFilter);

  return (
    <div className="w-full max-w-[2400px] mx-auto space-y-8 pb-24 animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="relative rounded-[3rem] bg-slate-950 p-10 md:p-14 text-white shadow-2xl border border-white/10 overflow-hidden group">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/20 blur-[120px] rounded-full translate-x-1/4 -translate-y-1/4 transition-colors duration-1000" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />

         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div className="space-y-4 max-w-xl">
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                  <ICONS.Gatherings />
                  <span className="text-[9px] font-black text-white uppercase tracking-[0.3em] font-mono">Gather_Protocol_v4.3</span>
               </div>
               <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none text-white">
                 Gatherings
               </h1>
               <p className="text-xs font-medium text-slate-300 leading-relaxed">
                 Coordinate physical and neural meetups. Synchronise with local nodes or establish global virtual assemblies.
               </p>
            </div>

            <div className="flex gap-4 w-full md:w-auto">
               <div className="px-8 py-5 bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] flex flex-col items-center justify-center min-w-[120px]">
                  <span className="text-3xl font-black text-white leading-none tracking-tighter">{isLoading ? '..' : gatherings.length}</span>
                  <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest mt-1.5">Scheduled</span>
               </div>
               <button 
                 onClick={() => setIsCreateOpen(true)}
                 className="px-8 py-5 bg-white text-slate-950 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:shadow-[0_0_50px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group/btn"
               >
                 <ICONS.Create />
                 INITIATE_GATHERING
               </button>
            </div>
         </div>
      </div>

      {/* Filter Bar */}
      <div className="relative z-30 mb-8 px-2 md:px-0">
         <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/60 dark:border-white/10 p-2 rounded-[2.5rem] shadow-sm overflow-x-auto no-scrollbar">
            <div className="flex gap-2 min-w-max">
               {(['All', 'Social', 'Tech', 'Gaming', 'Nightlife', 'Workshop'] as const).map(cat => (
                 <button
                   key={cat}
                   onClick={() => setActiveFilter(cat)}
                   className={`px-6 py-3 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === cat ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                 >
                   {cat}
                 </button>
               ))}
            </div>
         </div>
      </div>

      {/* Grid */}
      <div className="min-h-[400px]">
         {isLoading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
             {[1,2,3,4,5,6].map(i => (
               <div key={i} className="h-[420px] bg-slate-50 dark:bg-slate-800 rounded-[3rem] animate-pulse border border-slate-100 dark:border-slate-700" />
             ))}
           </div>
         ) : filteredGatherings.length > 0 ? (
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
             {filteredGatherings.map((gathering, idx) => {
               const dateObj = new Date(gathering.date);
               const isAttending = gathering.attendees.includes(currentUser.id);
               const isWaitlisted = gathering.waitlist?.includes(currentUser.id);
               const isOrganizer = gathering.organizerId === currentUser.id;
               const isVideoCover = gathering.coverUrl?.match(/\.(mp4|webm|mov)$/i) || gathering.coverUrl?.includes('/video/upload/');

               return (
                 <div 
                   key={gathering.id} 
                   onClick={() => onViewGathering(gathering)}
                   className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-4 hover:shadow-xl hover:border-purple-200 dark:hover:border-purple-900 transition-all duration-500 relative flex flex-col h-full cursor-pointer"
                 >
                    <div className="relative aspect-video rounded-[2.5rem] overflow-hidden bg-slate-100 dark:bg-slate-800 mb-6">
                       {isVideoCover ? (
                          <video src={gathering.coverUrl} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                       ) : (
                          <img src={gathering.coverUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="" />
                       )}
                       
                       <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md rounded-2xl px-3 py-2 text-center min-w-[60px] shadow-lg">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">{dateObj.toLocaleDateString(locale, { month: 'short' })}</p>
                          <p className="text-xl font-black text-slate-900 leading-none">{dateObj.getDate()}</p>
                       </div>

                       <div className="absolute top-4 right-4 flex gap-1">
                          <span className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest text-white shadow-sm border border-white/20 backdrop-blur-md ${gathering.type === 'virtual' ? 'bg-purple-600/80' : 'bg-emerald-600/80'}`}>
                             {gathering.type === 'virtual' ? 'NEURAL' : 'GEO'}
                          </span>
                       </div>
                    </div>

                    <div className="px-2 flex-1 flex flex-col">
                       <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-tight line-clamp-2 mb-2">
                            {gathering.title}
                       </h3>
                       
                       <div className="flex items-center gap-2 mb-4 text-slate-500 dark:text-slate-400">
                          <ICONS.Globe />
                          <p className="text-[10px] font-bold font-mono uppercase tracking-wide truncate">{gathering.location}</p>
                       </div>

                       <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-2 mb-6">
                         {gathering.description}
                       </p>

                       <div className="mt-auto pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                          <div className="flex -space-x-2">
                             {gathering.attendees.slice(0, 4).map((attId, i) => (
                                <img key={i} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${attId}`} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 object-cover shadow-sm" alt="" />
                             ))}
                             {gathering.attendees.length > 4 && (
                               <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-[8px] font-black z-10">
                                 +{gathering.attendees.length - 4}
                               </div>
                             )}
                          </div>

                          <div className="flex items-center gap-2">
                              {isAttending && gathering.linkedChatId && (
                                  /* Fixed: Now passing the gathering object to onOpenLobby */
                                  <button onClick={(e) => { e.stopPropagation(); onOpenLobby(gathering); }} className="px-4 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">LOBBY</button>
                              )}
                              {!isOrganizer ? (
                                <button onClick={(e) => { e.stopPropagation(); onRSVP(gathering.id, isAttending || isWaitlisted); }} className={`px-5 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg ${isAttending ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'}`}>{isAttending ? 'WITHDRAW' : 'RSVP'}</button>
                              ) : (
                                <span className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg">ORGANIZER</span>
                              )}
                          </div>
                       </div>
                    </div>
                 </div>
               );
             })}
           </div>
         ) : (
           <div className="py-40 flex flex-col items-center justify-center text-center opacity-50 bg-slate-50/50 dark:bg-slate-800/50 rounded-[4rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
              <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center mb-8 text-slate-300 shadow-sm border border-slate-100 dark:border-slate-800">
                 <ICONS.Gatherings />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-widest italic text-slate-900 dark:text-white">No_Signals</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] font-mono mt-3 text-slate-400">Initialize one to start the sync.</p>
           </div>
         )}
      </div>

      {isCreateOpen && (
        <CreateGatheringModal currentUser={currentUser} onClose={() => setIsCreateOpen(false)} onConfirm={handleCreate} />
      )}
    </div>
  );
};
