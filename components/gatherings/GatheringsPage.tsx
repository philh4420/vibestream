
import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
  where
} = Firestore as any;
import { User, Gathering, Region } from '../../types';
import { ICONS } from '../../constants';
import { CreateGatheringModal } from './CreateGatheringModal';

interface GatheringsPageProps {
  currentUser: User;
  locale: Region;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  allUsers: User[];
}

export const GatheringsPage: React.FC<GatheringsPageProps> = ({ currentUser, locale, addToast, allUsers }) => {
  const [gatherings, setGatherings] = useState<Gathering[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Social' | 'Tech' | 'Gaming' | 'Nightlife' | 'Workshop'>('All');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    if (!db) return;
    
    const now = new Date().toISOString();
    // Fetch upcoming gatherings
    const q = query(
      collection(db, 'gatherings'),
      where('date', '>=', now),
      orderBy('date', 'asc')
    );

    const unsub = onSnapshot(q, (snap: any) => {
      setGatherings(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Gathering)));
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  const handleCreate = async (data: any) => {
    if (!db || !currentUser) return;
    try {
      await addDoc(collection(db, 'gatherings'), {
        ...data,
        organizerId: currentUser.id,
        organizerName: currentUser.displayName,
        organizerAvatar: currentUser.avatarUrl,
        attendees: [currentUser.id],
        createdAt: serverTimestamp()
      });
      addToast("Gathering Initialized Successfully", "success");
      setIsCreateOpen(false);
    } catch (e) {
      addToast("Failed to Initialize Gathering", "error");
    }
  };

  const handleRSVP = async (gatheringId: string, isAttending: boolean) => {
    if (!db || !currentUser) return;
    const gathering = gatherings.find(g => g.id === gatheringId);
    if (!gathering) return;

    try {
      const ref = doc(db, 'gatherings', gatheringId);
      await updateDoc(ref, {
        attendees: isAttending ? arrayRemove(currentUser.id) : arrayUnion(currentUser.id)
      });

      // NOTIFICATION LOGIC: Notify Organizer if joining and not self
      if (!isAttending && gathering.organizerId !== currentUser.id) {
        await addDoc(collection(db, 'notifications'), {
          type: 'gathering_rsvp',
          fromUserId: currentUser.id,
          fromUserName: currentUser.displayName,
          fromUserAvatar: currentUser.avatarUrl,
          toUserId: gathering.organizerId,
          targetId: gatheringId,
          text: `is attending your gathering: "${gathering.title}"`,
          isRead: false,
          timestamp: serverTimestamp(),
          pulseFrequency: 'intensity'
        });
      }

      addToast(isAttending ? "Withdrawn from Gathering" : "RSVP Confirmed", "success");
    } catch (e) {
      addToast("RSVP Protocol Failed", "error");
    }
  };

  const filteredGatherings = activeFilter === 'All' 
    ? gatherings 
    : gatherings.filter(g => g.category === activeFilter);

  return (
    <div className="w-full max-w-[2400px] mx-auto space-y-8 pb-24 animate-in fade-in duration-700">
      
      {/* 1. Command Header */}
      <div className="relative rounded-[3rem] bg-slate-950 p-10 md:p-14 text-white shadow-2xl border border-white/10 overflow-hidden group">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/20 blur-[120px] rounded-full translate-x-1/4 -translate-y-1/4 group-hover:bg-purple-500/30 transition-colors duration-1000" />
         <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />

         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div className="space-y-4 max-w-xl">
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                  <ICONS.Gatherings />
                  <span className="text-[9px] font-black text-white uppercase tracking-[0.3em] font-mono">Gather_Protocol_v4</span>
               </div>
               <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none text-white">
                 Gatherings
               </h1>
               <p className="text-xs font-medium text-slate-300 leading-relaxed">
                 Coordinate physical and neural meetups. Synchronise with local nodes or establish global virtual assemblies.
               </p>
            </div>

            <div className="flex gap-4 w-full md:w-auto">
               <div className="px-8 py-5 bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] flex flex-col items-center justify-center min-w-[120px] hover:bg-white/10 transition-colors">
                  <span className="text-3xl font-black text-white leading-none tracking-tighter">{gatherings.length}</span>
                  <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest mt-1.5">Upcoming</span>
               </div>
               <button 
                 onClick={() => setIsCreateOpen(true)}
                 className="px-8 py-5 bg-white text-slate-950 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_50px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group/btn"
               >
                 <div className="group-hover/btn:rotate-90 transition-transform"><ICONS.Create /></div>
                 INITIATE_GATHERING
               </button>
            </div>
         </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="sticky top-[calc(var(--header-h)+1rem)] z-30 mb-8 px-2 md:px-0">
         <div className="bg-white/90 backdrop-blur-xl border border-white/60 p-2 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-x-auto no-scrollbar">
            <div className="flex gap-2 min-w-max">
               {(['All', 'Social', 'Tech', 'Gaming', 'Nightlife', 'Workshop'] as const).map(cat => (
                 <button
                   key={cat}
                   onClick={() => setActiveFilter(cat)}
                   className={`px-6 py-3 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === cat ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'}`}
                 >
                   {cat}
                 </button>
               ))}
            </div>
         </div>
      </div>

      {/* 3. Event Grid */}
      <div className="min-h-[400px]">
         {isLoading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
             {[1,2,3,4,5,6].map(i => (
               <div key={i} className="h-[420px] bg-slate-50 rounded-[3rem] animate-pulse border border-slate-100" />
             ))}
           </div>
         ) : filteredGatherings.length > 0 ? (
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
             {filteredGatherings.map((gathering, idx) => {
               const dateObj = new Date(gathering.date);
               const isAttending = gathering.attendees.includes(currentUser.id);
               const isOrganizer = gathering.organizerId === currentUser.id;

               return (
                 <div 
                   key={gathering.id} 
                   className="group bg-white border border-slate-100 rounded-[3rem] p-4 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] hover:border-purple-200 transition-all duration-500 relative flex flex-col h-full hover:-translate-y-1"
                   style={{ animationDelay: `${idx * 50}ms` }}
                 >
                    {/* Image Layer */}
                    <div className="relative aspect-video rounded-[2.5rem] overflow-hidden bg-slate-100 mb-6">
                       <img src={gathering.coverUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                       
                       <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md rounded-2xl px-3 py-2 text-center min-w-[60px] shadow-lg">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">{dateObj.toLocaleDateString(locale, { month: 'short' })}</p>
                          <p className="text-xl font-black text-slate-900 leading-none">{dateObj.getDate()}</p>
                       </div>

                       <div className="absolute top-4 right-4">
                          <span className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest text-white shadow-sm border border-white/20 backdrop-blur-md ${gathering.type === 'virtual' ? 'bg-purple-600/80' : 'bg-emerald-600/80'}`}>
                             {gathering.type === 'virtual' ? 'NEURAL_LINK' : 'GEOSPATIAL'}
                          </span>
                       </div>
                    </div>

                    {/* Content */}
                    <div className="px-2 flex-1 flex flex-col">
                       <div className="flex justify-between items-start mb-3">
                          <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter leading-tight line-clamp-2 group-hover:text-purple-600 transition-colors">
                            {gathering.title}
                          </h3>
                       </div>
                       
                       <div className="flex items-center gap-2 mb-4 text-slate-500">
                          <ICONS.Globe />
                          <p className="text-[10px] font-bold font-mono uppercase tracking-wide truncate">{gathering.location}</p>
                       </div>

                       <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2 mb-6">
                         {gathering.description}
                       </p>

                       {/* Attendees Pile */}
                       <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                          <div className="flex -space-x-2 pl-2">
                             {gathering.attendees.slice(0, 4).map((attId, i) => {
                               const attendee = allUsers.find(u => u.id === attId);
                               return (
                                 <img 
                                   key={i} 
                                   src={attendee?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${attId}`} 
                                   className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 object-cover shadow-sm" 
                                   alt="" 
                                 />
                               );
                             })}
                             {gathering.attendees.length > 4 && (
                               <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-900 text-white flex items-center justify-center text-[8px] font-black shadow-sm">
                                 +{gathering.attendees.length - 4}
                               </div>
                             )}
                          </div>

                          {!isOrganizer && (
                            <button 
                              onClick={() => handleRSVP(gathering.id, isAttending)}
                              className={`px-5 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all active:scale-95 ${isAttending ? 'bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500' : 'bg-slate-900 text-white hover:bg-purple-600 shadow-lg'}`}
                            >
                              {isAttending ? 'WITHDRAW' : 'RSVP_CONFIRM'}
                            </button>
                          )}
                          {isOrganizer && (
                             <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg">ORGANIZER</span>
                          )}
                       </div>
                    </div>
                 </div>
               );
             })}
           </div>
         ) : (
           <div className="py-40 flex flex-col items-center justify-center text-center opacity-50 bg-slate-50/50 rounded-[4rem] border-2 border-dashed border-slate-200">
              <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mb-8 text-slate-300 shadow-sm border border-slate-100">
                 <ICONS.Gatherings />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-widest italic text-slate-900">No_Signals</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] font-mono mt-3 text-slate-400 max-w-xs leading-relaxed">
                No gatherings detected in this frequency band. Initialize one to start the sync.
              </p>
           </div>
         )}
      </div>

      {isCreateOpen && (
        <CreateGatheringModal 
          currentUser={currentUser} 
          onClose={() => setIsCreateOpen(false)} 
          onConfirm={handleCreate} 
        />
      )}
    </div>
  );
};
