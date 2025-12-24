
import React, { useState } from 'react';
import { Gathering, User, Region } from '../../types';
import { ICONS } from '../../constants';
import { DeleteConfirmationModal } from '../ui/DeleteConfirmationModal';
import { GeospatialMap } from './GeospatialMap';
import { ProximityRadar } from './ProximityRadar';

interface SingleGatheringViewProps {
  gathering: Gathering;
  currentUser: User;
  allUsers: User[];
  locale: Region;
  onBack: () => void;
  onDelete: (id: string) => void;
  onRSVP: (id: string, isAttending: boolean) => void;
  onOpenLobby: (clusterId: string) => void;
}

export const SingleGatheringView: React.FC<SingleGatheringViewProps> = ({ 
  gathering, 
  currentUser, 
  allUsers, 
  locale, 
  onBack, 
  onDelete, 
  onRSVP, 
  onOpenLobby 
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const dateObj = new Date(gathering.date);
  const isOrganizer = gathering.organizerId === currentUser.id;
  const isAttending = gathering.attendees.includes(currentUser.id);
  const attendeesList = gathering.attendees
    .map(id => allUsers.find(u => u.id === id))
    .filter(Boolean) as User[];

  // Format Date and Time
  const dateStr = dateObj.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      
      {/* 1. NAVIGATION HEADER */}
      <div className="flex items-center justify-between sticky top-0 z-30 py-2 -mt-2 mb-2 bg-[#fcfcfd]/90 backdrop-blur-md">
        <button 
          onClick={onBack}
          className="flex items-center gap-3 px-5 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-2xl transition-all active:scale-95 shadow-sm group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M15 19l-7-7 7-7" /></svg>
          <span className="text-[10px] font-black uppercase tracking-widest font-mono">Back_To_Grid</span>
        </button>
        
        {isOrganizer && (
          <button 
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 rounded-xl border border-rose-100 transition-all active:scale-95"
          >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
             <span className="text-[9px] font-black uppercase tracking-widest font-mono">Cancel_Event</span>
          </button>
        )}
      </div>

      {/* 2. HERO SECTION */}
      <div className="relative h-[300px] md:h-[400px] rounded-[3rem] overflow-hidden group shadow-2xl border border-white/20">
         <img src={gathering.coverUrl} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105" alt={gathering.title} />
         <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent" />
         
         <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
            <div className="flex flex-wrap items-center gap-3 mb-4">
               <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-white backdrop-blur-md border border-white/20 ${gathering.type === 'virtual' ? 'bg-purple-600/80' : 'bg-emerald-600/80'}`}>
                  {gathering.type === 'virtual' ? 'NEURAL_LINK' : 'GEOSPATIAL'}
               </span>
               <span className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-white bg-white/10 backdrop-blur-md border border-white/20">
                  {gathering.category}
               </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-tight drop-shadow-lg mb-2">
               {gathering.title}
            </h1>
            <p className="text-white/80 font-mono text-xs uppercase tracking-widest flex items-center gap-2">
               <ICONS.Temporal /> {dateStr} @ {timeStr}
            </p>
         </div>
      </div>

      {/* 3. DETAILS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* LEFT COL: Context & Map */}
         <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-sm">
               <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tight mb-4">Protocol_Manifest</h3>
               <p className="text-slate-600 leading-relaxed font-medium text-sm md:text-base whitespace-pre-wrap">
                  {gathering.description}
               </p>
            </div>

            {/* GEOSPATIAL PROJECTION (Only for Physical) */}
            {gathering.type === 'physical' ? (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"/>
                        <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest font-mono">Geospatial_Projection</span>
                    </div>
                    <GeospatialMap gathering={gathering} organizerAvatar={gathering.organizerAvatar} />
                </div>
            ) : (
                <div className="bg-purple-50/50 rounded-[2.5rem] p-8 border border-purple-100 flex items-center justify-center min-h-[200px]">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-purple-500 shadow-sm">
                            <ICONS.Globe />
                        </div>
                        <h3 className="text-lg font-black text-purple-900 uppercase tracking-widest italic">VIRTUAL_NODE</h3>
                        <p className="text-[10px] font-mono text-purple-400 uppercase mt-2">Location: Neural Cloud</p>
                    </div>
                </div>
            )}

            {/* Host Card */}
            <div className="bg-white rounded-[2.5rem] p-6 flex items-center gap-5 border border-slate-100 shadow-sm hover:shadow-md transition-all">
               <div className="relative">
                  <img src={gathering.organizerAvatar} className="w-16 h-16 rounded-[1.5rem] object-cover border-2 border-white shadow-md bg-slate-50" alt="" />
                  <div className="absolute -bottom-1 -right-1 bg-amber-400 p-1 rounded-lg border-2 border-white shadow-sm text-white scale-75">
                     <ICONS.Verified />
                  </div>
               </div>
               <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1">Event_Organizer</p>
                  <h4 className="text-lg font-black text-slate-900 uppercase italic tracking-tight">{gathering.organizerName}</h4>
               </div>
            </div>
         </div>

         {/* RIGHT COL: Action Console */}
         <div className="space-y-6">
            
            {/* PROXIMITY PING (Only for Physical) */}
            {gathering.type === 'physical' && (
                <ProximityRadar attendees={attendeesList} />
            )}

            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-black text-slate-900 uppercase italic tracking-tight">Confirmed_Nodes</h3>
                  <span className="text-[9px] font-black text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded-lg">{gathering.attendees.length}</span>
               </div>
               
               {attendeesList.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2 mb-6">
                     {attendeesList.slice(0, 11).map((user, i) => (
                        <div key={user.id || i} className="aspect-square rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 relative group cursor-pointer" title={user.displayName}>
                           <img src={user.avatarUrl} className="w-full h-full object-cover" alt="" />
                        </div>
                     ))}
                     {attendeesList.length > 11 && (
                        <div className="aspect-square rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200 text-[10px] font-black text-slate-400">
                           +{attendeesList.length - 11}
                        </div>
                     )}
                  </div>
               ) : (
                  <p className="text-xs text-slate-400 italic text-center py-4 mb-4">No signals registered yet.</p>
               )}

                <div className="flex flex-col gap-2">
                    {!isOrganizer && (
                    <button 
                        onClick={() => onRSVP(gathering.id, isAttending)}
                        className={`w-full py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg ${isAttending ? 'bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
                    >
                        {isAttending ? 'WITHDRAW_SIGNAL' : 'RSVP_CONFIRM'}
                    </button>
                    )}
                    {isAttending && gathering.linkedChatId && (
                    <button 
                        onClick={() => onOpenLobby(gathering.linkedChatId!)}
                        className="w-full py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 bg-purple-600 text-white hover:bg-purple-500 shadow-lg border border-purple-400/30"
                    >
                        ENTER_NEURAL_LOBBY
                    </button>
                    )}
                </div>
            </div>
         </div>
      </div>

      <DeleteConfirmationModal 
         isOpen={showDeleteModal}
         title="ABORT_PROTOCOL"
         description="Permanently cancel this gathering? All linked data and invitations will be purged."
         onConfirm={() => onDelete(gathering.id)}
         onCancel={() => setShowDeleteModal(false)}
         confirmText="CONFIRM_CANCEL"
      />
    </div>
  );
};
