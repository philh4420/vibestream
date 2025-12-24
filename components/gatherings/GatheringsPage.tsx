
import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  limit 
} from 'firebase/firestore';
import { Gathering, User, Region } from '../../types';
import { ICONS } from '../../constants';
import { CreateGatheringModal } from './CreateGatheringModal';

interface GatheringsPageProps {
  currentUser: User;
  locale: Region;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onViewGathering: (gathering: Gathering) => void;
  onRSVP: (id: string, isAttendingOrWaitlisted: boolean) => Promise<void>; // Updated to Promise for async handling
}

export const GatheringsPage: React.FC<GatheringsPageProps> = ({ 
  currentUser, 
  locale, 
  addToast, 
  onViewGathering, 
  onRSVP 
}) => {
  const [gatherings, setGatherings] = useState<Gathering[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'attending' | 'hosting'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!db) return;
    
    const q = query(
      collection(db, 'gatherings'),
      orderBy('date', 'asc'),
      limit(50)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Gathering));
      setGatherings(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleCreate = async (data: any) => {
    try {
      await addDoc(collection(db, 'gatherings'), {
        ...data,
        organizerId: currentUser.id,
        organizerName: currentUser.displayName,
        organizerAvatar: currentUser.avatarUrl,
        attendees: [currentUser.id], // Organizer auto-attends
        waitlist: [],
        createdAt: serverTimestamp()
      });
      addToast("Gathering Protocol Initiated", "success");
      setIsCreateModalOpen(false);
    } catch (e) {
      addToast("Protocol Failed", "error");
    }
  };

  const filteredGatherings = gatherings.filter(g => {
    if (filter === 'attending') return g.attendees.includes(currentUser.id);
    if (filter === 'hosting') return g.organizerId === currentUser.id;
    return true;
  });

  return (
    <div className="w-full max-w-[2400px] mx-auto space-y-8 pb-24 animate-in fade-in duration-700">
      
      {/* 1. Header */}
      <div className="relative rounded-[3rem] bg-slate-950 p-10 md:p-12 text-white shadow-2xl border border-white/10 overflow-hidden group">
         <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/20 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3 group-hover:bg-purple-500/30 transition-colors duration-1000" />
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -translate-x-1/3 translate-y-1/3" />
         
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 text-purple-300">
                     <ICONS.Gatherings />
                  </div>
                  <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.4em] font-mono">Social_Protocol_v4.0</span>
               </div>
               <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase leading-none">
                 Gatherings
               </h1>
               <p className="text-xs md:text-sm font-medium text-slate-400 max-w-lg leading-relaxed">
                 Coordinate physical and virtual convergence points. Establish new social nodes within the grid.
               </p>
            </div>

            <div className="flex gap-4 w-full md:w-auto">
               <button 
                 onClick={() => setIsCreateModalOpen(true)}
                 className="flex-1 md:flex-none px-8 py-4 bg-white text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group/btn"
               >
                 <div className="group-hover/btn:rotate-90 transition-transform duration-500"><ICONS.Create /></div>
                 INITIATE_EVENT
               </button>
            </div>
         </div>
      </div>

      {/* 2. Filters */}
      <div className="sticky top-[calc(var(--header-h)+1rem)] z-30 mb-8 px-2 md:px-0">
         <div className="bg-white/80 backdrop-blur-xl border border-white/60 p-2 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] inline-flex gap-2">
            {[
              { id: 'all', label: 'All Events' },
              { id: 'attending', label: 'My Calendar' },
              { id: 'hosting', label: 'Hosting' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-6 py-3 rounded-[1.8rem] text-[9px] font-black uppercase tracking-widest transition-all ${filter === tab.id ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
              >
                {tab.label}
              </button>
            ))}
         </div>
      </div>

      {/* 3. Grid */}
      <div className="min-h-[400px]">
         {loading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
             {[1,2,3,4,5,6].map(i => (
               <div key={i} className="h-[400px] bg-slate-50 rounded-[3rem] animate-pulse border border-slate-100" />
             ))}
           </div>
         ) : filteredGatherings.length > 0 ? (
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
             {filteredGatherings.map(g => {
               const isAttending = g.attendees.includes(currentUser.id);
               const isWaitlisted = g.waitlist?.includes(currentUser.id);
               const isHosting = g.organizerId === currentUser.id;
               const dateObj = new Date(g.date);
               const isProcessing = processingId === g.id;

               return (
                 <div 
                   key={g.id}
                   onClick={() => onViewGathering(g)}
                   className="group bg-white rounded-[3rem] overflow-hidden border border-slate-100 hover:shadow-2xl hover:border-purple-200 transition-all duration-500 cursor-pointer flex flex-col hover:-translate-y-1"
                 >
                    <div className="h-48 overflow-hidden relative">
                       <img src={g.coverUrl} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" alt="" />
                       <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                       <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border border-white/50">
                          {g.category}
                       </div>
                       <div className="absolute bottom-4 left-6 text-white">
                          <p className="text-[8px] font-black uppercase tracking-widest mb-1 opacity-80">{dateObj.toLocaleDateString(locale)}</p>
                          <h3 className="text-xl font-black italic tracking-tight uppercase leading-none">{g.title}</h3>
                       </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                       <p className="text-[10px] text-slate-500 font-medium leading-relaxed line-clamp-3 mb-6">
                         {g.description}
                       </p>

                       <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <img src={g.organizerAvatar} className="w-8 h-8 rounded-xl object-cover border border-slate-100" alt="" />
                             <div className="flex flex-col">
                                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Host</span>
                                <span className="text-[9px] font-bold text-slate-900 truncate max-w-[80px]">{g.organizerName}</span>
                             </div>
                          </div>

                          {!isHosting && (
                            <button 
                              onClick={async (e) => { 
                                e.stopPropagation(); 
                                if (isProcessing) return;
                                setProcessingId(g.id);
                                await onRSVP(g.id, isAttending || !!isWaitlisted);
                                setProcessingId(null);
                              }}
                              disabled={isProcessing}
                              className={`px-5 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] transition-all shadow-sm ${
                                isProcessing 
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                  : isAttending 
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                    : isWaitlisted 
                                      ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                                      : 'bg-slate-900 text-white hover:bg-purple-600'
                              }`}
                            >
                              {isProcessing ? 'SYNC...' : isAttending ? 'GOING' : isWaitlisted ? 'WAITLIST' : 'RSVP'}
                            </button>
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
              <h3 className="text-2xl font-black uppercase tracking-widest italic text-slate-900">Agenda_Clear</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] font-mono mt-3 text-slate-400 max-w-xs leading-relaxed">
                No active gatherings detected in your sector.
              </p>
           </div>
         )}
      </div>

      {isCreateModalOpen && (
        <CreateGatheringModal 
          currentUser={currentUser}
          onClose={() => setIsCreateModalOpen(false)}
          onConfirm={handleCreate}
        />
      )}
    </div>
  );
};
