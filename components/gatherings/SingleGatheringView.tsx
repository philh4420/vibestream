import React, { useState, useEffect } from 'react';
import { Gathering, User, Region } from '../../types';
import { ICONS } from '../../constants';
import { DeleteConfirmationModal } from '../ui/DeleteConfirmationModal';
import { GeospatialMap } from './GeospatialMap';
import { ProximityRadar } from './ProximityRadar';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { 
  doc, 
  updateDoc, 
  onSnapshot, 
  writeBatch, 
  collection, 
  serverTimestamp,
  getDocs,
  query,
  where,
  deleteDoc
} = Firestore as any;
import { CreateGatheringModal } from './CreateGatheringModal';
import { GatheringMemoryBank } from './GatheringMemoryBank';

interface SingleGatheringViewProps {
  gathering: Gathering;
  currentUser: User;
  allUsers: User[];
  locale: Region;
  onBack: () => void;
  onDelete: (id: string) => void;
  onRSVP: (id: string, isAttending: boolean) => void;
  onOpenLobby: (gathering: Gathering) => void;
}

export const SingleGatheringView: React.FC<SingleGatheringViewProps> = ({ 
  gathering: initialGathering, 
  currentUser, 
  allUsers, 
  locale, 
  onBack, 
  onDelete, 
  onRSVP, 
  onOpenLobby 
}) => {
  const [liveGathering, setLiveGathering] = useState<Gathering>(initialGathering);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showRecurringDeleteOptions, setShowRecurringDeleteOptions] = useState(false);
  const [myFollowing, setMyFollowing] = useState<Set<string>>(new Set());
  
  // Status Broadcasting State
  const [statusInput, setStatusInput] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Sync with Firestore for real-time updates
  useEffect(() => {
    if (!db || !initialGathering.id) return;
    const unsub = onSnapshot(doc(db, 'gatherings', initialGathering.id), (snap: any) => {
        if (snap.exists()) {
            setLiveGathering({ id: snap.id, ...snap.data() } as Gathering);
        } else {
            // Handle external deletion
            onBack();
        }
    });
    return () => unsub();
  }, [initialGathering.id]);

  // Fetch Social Graph (Following)
  useEffect(() => {
    const fetchSocialGraph = async () => {
        if (!db || !currentUser.id) return;
        try {
            const q = collection(db, 'users', currentUser.id, 'following');
            const snap = await getDocs(q);
            const ids = new Set<string>(snap.docs.map((d: any) => d.id));
            setMyFollowing(ids);
        } catch (e) {
            console.error("Social Graph Sync Error", e);
        }
    };
    fetchSocialGraph();
  }, [currentUser.id]);

  const dateObj = new Date(liveGathering.date);
  const endDateObj = liveGathering.endDate ? new Date(liveGathering.endDate) : null;
  
  const isOrganizer = liveGathering.organizerId === currentUser.id;
  const isAttending = liveGathering.attendees.includes(currentUser.id);
  const isWaitlisted = liveGathering.waitlist?.includes(currentUser.id);
  
  const capacity = liveGathering.maxAttendees || 0;
  const currentCount = liveGathering.attendees.length;
  const isFull = capacity > 0 && currentCount >= capacity;

  // Split Attendees into Mutuals (Network) and Globals
  const attendeesList = liveGathering.attendees
    .map(id => allUsers.find(u => u.id === id))
    .filter(Boolean) as User[];

  // Format Date and Time
  const dateStr = dateObj.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  const endTimeStr = endDateObj ? endDateObj.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : null;

  const handleUpdate = async (data: any, updateSeries = false) => {
    if (!db) return;
    try {
        const batch = writeBatch(db);
        const attendeesToNotify = liveGathering.attendees.filter(id => id !== currentUser.id);

        if (updateSeries && liveGathering.recurrenceId) {
            // Recurrence Update Logic: Fetch all related gatherings
            const q = query(collection(db, 'gatherings'), where('recurrenceId', '==', liveGathering.recurrenceId));
            const snap = await getDocs(q);
            
            // Calculate time shift delta
            const originalDate = new Date(liveGathering.date).getTime();
            const newDate = new Date(data.date).getTime();
            const timeDelta = newDate - originalDate;

            snap.docs.forEach((d: any) => {
                const g = d.data() as Gathering;
                
                // Calculate new date for this specific instance based on the delta
                const currentInstanceDate = new Date(g.date).getTime();
                const shiftedDate = new Date(currentInstanceDate + timeDelta).toISOString();
                
                // Shift end date if it exists
                let shiftedEndDate = null;
                if (g.endDate) {
                    const currentInstanceEndDate = new Date(g.endDate).getTime();
                    shiftedEndDate = new Date(currentInstanceEndDate + timeDelta).toISOString();
                } else if (data.endDate) {
                    // If no existing end date but updating to have one, use the duration from the update payload
                    const updateDuration = new Date(data.endDate).getTime() - new Date(data.date).getTime();
                    shiftedEndDate = new Date(new Date(shiftedDate).getTime() + updateDuration).toISOString();
                }

                // Smart Title Update: Preserve session numbering if present
                let newTitle = data.title;
                if (g.seriesIndex) {
                    // Strip any existing (Session X) from the input title to avoid doubling up
                    const baseTitle = data.title.replace(/\s*\(Session\s+\d+\)$/i, '').trim();
                    newTitle = `${baseTitle} (Session ${g.seriesIndex})`;
                }

                batch.update(doc(db, 'gatherings', d.id), {
                    title: newTitle,
                    description: data.description,
                    location: data.location,
                    address: data.address,
                    linkUrl: data.linkUrl,
                    coverUrl: data.coverUrl,
                    category: data.category,
                    type: data.type,
                    maxAttendees: data.maxAttendees, // Sync capacity
                    date: shiftedDate, // Apply time shift
                    endDate: shiftedEndDate
                });
            });
            
            await batch.commit();
            window.dispatchEvent(new CustomEvent('vibe-toast', { detail: { msg: `Series Updated (${snap.size} Nodes)`, type: 'success' } }));

        } else {
            // Single Update
            await updateDoc(doc(db, 'gatherings', liveGathering.id), data);
            
            // Notify attendees of single update
            if (attendeesToNotify.length > 0) {
               const notifBatch = writeBatch(db);
               attendeesToNotify.forEach(uid => {
                  notifBatch.set(doc(collection(db, 'notifications')), {
                     type: 'system',
                     fromUserId: currentUser.id,
                     fromUserName: currentUser.displayName,
                     fromUserAvatar: currentUser.avatarUrl,
                     toUserId: uid,
                     targetId: liveGathering.id,
                     text: `Protocol Updated: "${liveGathering.title}" details changed.`,
                     isRead: false,
                     timestamp: serverTimestamp(),
                     pulseFrequency: 'intensity'
                  });
               });
               await notifBatch.commit();
            }

            window.dispatchEvent(new CustomEvent('vibe-toast', { detail: { msg: "Protocol Updated", type: 'success' } }));
        }
        
        setIsEditOpen(false);
    } catch (e) {
        console.error(e);
        window.dispatchEvent(new CustomEvent('vibe-toast', { detail: { msg: "Update Failed", type: 'error' } }));
    }
  };

  const handleDelete = async (deleteSeries = false) => {
    if (!db) return;
    try {
        const attendeesToNotify = liveGathering.attendees.filter(id => id !== currentUser.id);
        const batch = writeBatch(db);

        if (deleteSeries && liveGathering.recurrenceId) {
            const q = query(collection(db, 'gatherings'), where('recurrenceId', '==', liveGathering.recurrenceId));
            const snap = await getDocs(q);
            snap.docs.forEach((d: any) => batch.delete(d.ref));
            
            attendeesToNotify.forEach(uid => {
                batch.set(doc(collection(db, 'notifications')), {
                    type: 'system',
                    fromUserId: currentUser.id,
                    fromUserName: currentUser.displayName,
                    fromUserAvatar: currentUser.avatarUrl,
                    toUserId: uid,
                    text: `Series Cancelled: "${liveGathering.title}" loop terminated.`,
                    isRead: false,
                    timestamp: serverTimestamp(),
                    pulseFrequency: 'resilience'
                });
            });

            await batch.commit();
            window.dispatchEvent(new CustomEvent('vibe-toast', { detail: { msg: `Series Purged (${snap.size} Events)`, type: 'success' } }));
        } else {
            await deleteDoc(doc(db, 'gatherings', liveGathering.id));
            
            if (attendeesToNotify.length > 0) {
               const notifBatch = writeBatch(db);
               attendeesToNotify.forEach(uid => {
                  notifBatch.set(doc(collection(db, 'notifications')), {
                     type: 'system',
                     fromUserId: currentUser.id,
                     fromUserName: currentUser.displayName,
                     fromUserAvatar: currentUser.avatarUrl,
                     toUserId: uid,
                     text: `Event Cancelled: "${liveGathering.title}" protocol terminated.`,
                     isRead: false,
                     timestamp: serverTimestamp(),
                     pulseFrequency: 'resilience'
                  });
               });
               await notifBatch.commit();
            }

            window.dispatchEvent(new CustomEvent('vibe-toast', { detail: { msg: "Event Cancelled", type: 'success' } }));
        }
        onBack();
    } catch (e) {
        console.error(e);
        window.dispatchEvent(new CustomEvent('vibe-toast', { detail: { msg: "Delete Failed", type: 'error' } }));
    }
  };

  const handleBroadcastStatus = async () => {
    if (!statusInput.trim() || !db) return;
    setIsBroadcasting(true);
    try {
        const batch = writeBatch(db);
        const gatheringRef = doc(db, 'gatherings', liveGathering.id);
        batch.update(gatheringRef, {
            latestStatus: {
                message: statusInput.trim(),
                timestamp: serverTimestamp()
            }
        });

        const recipients = liveGathering.attendees.filter(id => id !== currentUser.id);
        recipients.forEach(userId => {
            const notifRef = doc(collection(db, 'notifications'));
            batch.set(notifRef, {
                type: 'broadcast',
                fromUserId: currentUser.id,
                fromUserName: liveGathering.title, 
                fromUserAvatar: liveGathering.coverUrl, 
                toUserId: userId,
                targetId: liveGathering.id,
                text: `Status Update: "${statusInput.trim()}"`,
                isRead: false,
                timestamp: serverTimestamp(),
                pulseFrequency: 'intensity'
            });
        });

        await batch.commit();
        setStatusInput('');
        window.dispatchEvent(new CustomEvent('vibe-toast', { detail: { msg: "Status Broadcasted", type: 'success' } }));
    } catch (e) {
        console.error(e);
    } finally {
        setIsBroadcasting(false);
    }
  };

  const handleSyncToCalendar = (type: 'google' | 'ics') => {
    const startDate = new Date(liveGathering.date);
    const endDate = liveGathering.endDate 
        ? new Date(liveGathering.endDate) 
        : new Date(startDate.getTime() + 2 * 60 * 60 * 1000); 
        
    const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const title = liveGathering.title;
    const desc = `${liveGathering.description}\n\nProtocol ID: ${liveGathering.id}`;
    const loc = liveGathering.type === 'physical' ? (liveGathering.address || liveGathering.location) : (liveGathering.linkUrl || liveGathering.location);

    if (type === 'google') {
        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${encodeURIComponent(desc)}&location=${encodeURIComponent(loc || '')}`;
        window.open(url, '_blank');
    } else {
        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
URL:${window.location.href}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${title}
DESCRIPTION:${desc}
LOCATION:${loc}
END:VEVENT
END:VCALENDAR`;
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', `${title.replace(/\s+/g, '_')}_signal.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    window.dispatchEvent(new CustomEvent('vibe-toast', { detail: { msg: "Temporal Coordinates Exported", type: 'success' } }));
  };

  const isVideoCover = liveGathering.coverUrl?.match(/\.(mp4|webm|mov)$/i) || liveGathering.coverUrl?.includes('/video/upload/');

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      
      {/* 1. NAVIGATION HEADER */}
      <div className="flex items-center justify-between relative z-30 py-2 -mt-2 mb-2 bg-[#fcfcfd]/90 dark:bg-slate-900/90 backdrop-blur-md">
        <button 
          onClick={onBack}
          className="flex items-center gap-3 px-5 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl transition-all active:scale-95 shadow-sm group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M15 19l-7-7 7-7" /></svg>
          <span className="text-[10px] font-black uppercase tracking-widest font-mono">Back_To_Grid</span>
        </button>
        
        {isOrganizer && (
          <div className="flex items-center gap-2">
            <button 
                onClick={() => setIsEditOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-all active:scale-95"
            >
                <ICONS.Create />
                <span className="text-[9px] font-black uppercase tracking-widest font-mono">Edit_Protocol</span>
            </button>
            <button 
                onClick={() => {
                    if (liveGathering.recurrenceId) {
                        setShowRecurringDeleteOptions(true);
                    } else {
                        setShowDeleteModal(true);
                    }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-900/30 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/50 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl border border-rose-100 dark:border-rose-900 transition-all active:scale-95"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                <span className="text-[9px] font-black uppercase tracking-widest font-mono">Cancel</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. HERO SECTION */}
      <div className="relative h-[300px] md:h-[400px] rounded-[3rem] overflow-hidden group shadow-2xl border border-white/20">
         {isVideoCover ? (
            <video 
              src={liveGathering.coverUrl} 
              className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105" 
              muted loop autoPlay playsInline 
            />
         ) : (
            <img src={liveGathering.coverUrl} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105" alt={liveGathering.title} />
         )}
         <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent" />
         
         <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
            <div className="flex flex-wrap items-center gap-3 mb-4">
               {isWaitlisted && (
                   <span className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-white backdrop-blur-md border border-white/20 bg-amber-500/80">
                       WAITLISTED
                   </span>
               )}
               {isFull && !isAttending && !isWaitlisted && (
                   <span className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-white backdrop-blur-md border border-white/20 bg-rose-500/80">
                       CAPACITY_FULL
                   </span>
               )}
               <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-white backdrop-blur-md border border-white/20 ${liveGathering.type === 'virtual' ? 'bg-purple-600/80' : 'bg-emerald-600/80'}`}>
                  {liveGathering.type === 'virtual' ? 'NEURAL_LINK' : 'GEOSPATIAL'}
               </span>
               <span className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-white bg-white/10 backdrop-blur-md border border-white/20">
                  {liveGathering.category}
               </span>
               {liveGathering.recurrenceId && (
                   <span className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-indigo-200 bg-indigo-900/50 backdrop-blur-md border border-indigo-500/30">
                       SERIES: {liveGathering.recurrence?.toUpperCase()}
                   </span>
               )}
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-tight drop-shadow-lg mb-2">
               {liveGathering.title}
            </h1>
            <p className="text-white/80 font-mono text-xs uppercase tracking-widest flex items-center gap-2">
               <ICONS.Temporal /> {dateStr} @ {timeStr} {endTimeStr ? `- ${endTimeStr}` : ''}
            </p>
         </div>
      </div>

      {/* 3. DETAILS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* LEFT COL: Context & Map */}
         <div className="lg:col-span-2 space-y-6">
            
            {/* LIVE STATUS BANNER (Public) */}
            {liveGathering.latestStatus && (
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-[2rem] p-6 shadow-lg shadow-orange-200/50 text-white animate-in slide-in-from-top-4 duration-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] font-mono">Live_Status_Update</span>
                            </div>
                            <span className="text-[9px] font-mono font-bold opacity-80">
                                {liveGathering.latestStatus.timestamp?.toDate ? new Date(liveGathering.latestStatus.timestamp.toDate()).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : 'NOW'}
                            </span>
                        </div>
                        <p className="text-lg md:text-xl font-black italic tracking-tight uppercase leading-snug">
                            "{liveGathering.latestStatus.message}"
                        </p>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 border border-slate-100 dark:border-slate-800 shadow-sm">
               <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-4">Protocol_Manifest</h3>
               <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium text-sm md:text-base whitespace-pre-wrap">
                  {liveGathering.description}
               </p>
            </div>

            {/* LOCATION / ACCESS MODULE */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"/>
                    <span className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest font-mono">
                        {liveGathering.type === 'physical' ? 'Geospatial_Projection' : 'Virtual_Uplink'}
                    </span>
                </div>

                {liveGathering.type === 'physical' ? (
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Target_Venue</p>
                                <p className="text-lg font-black text-slate-900 dark:text-white">{liveGathering.location}</p>
                                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">{liveGathering.address || 'Address Restricted'}</p>
                            </div>
                        </div>
                        <GeospatialMap gathering={liveGathering} organizerAvatar={liveGathering.organizerAvatar} />
                    </div>
                ) : (
                    <div className="bg-purple-50/50 dark:bg-purple-900/20 rounded-[2.5rem] p-8 border border-purple-100 dark:border-purple-800 flex flex-col items-center justify-center min-h-[240px] text-center space-y-6">
                        <div>
                            <div className="w-16 h-16 bg-white dark:bg-purple-900 rounded-2xl flex items-center justify-center mx-auto mb-4 text-purple-500 dark:text-purple-300 shadow-sm">
                                <ICONS.Globe />
                            </div>
                            <h3 className="text-lg font-black text-purple-900 dark:text-purple-300 uppercase tracking-widest italic">{liveGathering.location || 'VIRTUAL NODE'}</h3>
                            <p className="text-[10px] font-mono text-purple-400 dark:text-purple-500 uppercase mt-2">Remote Access Protocol</p>
                        </div>
                        
                        {liveGathering.linkUrl && isAttending && (
                            <a 
                                href={liveGathering.linkUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="px-8 py-4 bg-purple-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-purple-700 transition-all shadow-xl active:scale-95 flex items-center gap-3"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                LAUNCH_UPLINK
                            </a>
                        )}
                        {liveGathering.type === 'virtual' && !isAttending && (
                            <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest bg-purple-100 dark:bg-purple-900/50 px-4 py-2 rounded-xl">
                                RSVP to Access Meeting Link
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Host Card */}
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 flex items-center gap-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
               <div className="relative">
                  <img src={liveGathering.organizerAvatar} className="w-16 h-16 rounded-[1.5rem] object-cover border-2 border-white dark:border-slate-800 shadow-md bg-slate-50 dark:bg-slate-800" alt="" />
                  <div className="absolute -bottom-1 -right-1 bg-amber-400 p-1 rounded-lg border-2 border-white dark:border-slate-900 shadow-sm text-white scale-75">
                     <ICONS.Verified />
                  </div>
               </div>
               <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1">Event_Organizer</p>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tight">{liveGathering.organizerName}</h4>
               </div>
            </div>
         </div>

         {/* RIGHT COL: Action Console */}
         <div className="space-y-6">
            
            {/* PROXIMITY PING (Only for Physical) */}
            {liveGathering.type === 'physical' && (
                <ProximityRadar attendees={attendeesList} />
            )}

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm space-y-6">
               
               {/* ORGANIZER COMMAND LINK (Broadcaster) */}
               {isOrganizer && (
                   <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl p-5 text-white border border-slate-800 dark:border-slate-700 shadow-lg">
                       <div className="flex items-center gap-2 mb-3">
                           <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                           <span className="text-[9px] font-black uppercase tracking-[0.3em] font-mono text-emerald-400">Live_Command_Link</span>
                       </div>
                       <div className="space-y-3">
                           <input 
                               type="text" 
                               value={statusInput}
                               onChange={(e) => setStatusInput(e.target.value)}
                               placeholder="Broadcast status update..."
                               maxLength={80}
                               className="w-full bg-slate-800 dark:bg-slate-700 border border-slate-700 dark:border-slate-600 rounded-xl px-4 py-3 text-xs font-bold text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                           />
                           <button 
                               onClick={handleBroadcastStatus}
                               disabled={!statusInput.trim() || isBroadcasting}
                               className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                           >
                               {isBroadcasting ? 'TRANSMITTING...' : 'BROADCAST_UPDATE'}
                           </button>
                       </div>
                   </div>
               )}

               {/* TEMPORAL EXPORT MODULE */}
               <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-indigo-500 shadow-sm">
                          <ICONS.Temporal />
                      </div>
                      <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Temporal_Sync</p>
                          <p className="text-xs font-black text-slate-900 dark:text-white">Export Timeline</p>
                      </div>
                  </div>
                  <div className="flex gap-2">
                      <button 
                        onClick={() => handleSyncToCalendar('google')}
                        className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 text-slate-500 dark:text-slate-400"
                        title="Google Calendar"
                      >
                        GL
                      </button>
                      <button 
                        onClick={() => handleSyncToCalendar('ics')}
                        className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 text-slate-500 dark:text-slate-400"
                        title="Universal (.ics)"
                      >
                        ICS
                      </button>
                  </div>
               </div>

               <div>
                   <div className="flex justify-between items-center mb-6">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Confirmed_Nodes</h3>
                      <span className="text-[9px] font-black text-slate-400 font-mono bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">{currentCount}</span>
                   </div>

                   {/* Capacity Bar */}
                   {capacity > 0 && (
                       <div className="mb-6">
                           <div className="flex justify-between items-end mb-2">
                               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono">Signal_Capacity</span>
                               <span className={`text-[9px] font-black font-mono ${isFull ? 'text-rose-500' : 'text-slate-600 dark:text-slate-400'}`}>
                                   {currentCount} / {capacity}
                               </span>
                           </div>
                           <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-50 dark:border-slate-700">
                               <div 
                                    className={`h-full rounded-full transition-all duration-1000 ${isFull ? 'bg-rose-500' : 'bg-purple-600'}`} 
                                    style={{ width: `${Math.min((currentCount / capacity) * 100, 100)}%` }} 
                               />
                           </div>
                           {liveGathering.waitlist && liveGathering.waitlist.length > 0 && (
                                <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest font-mono mt-2 text-right">
                                    Queue: {liveGathering.waitlist.length} Nodes
                                </p>
                           )}
                       </div>
                   )}

                   {/* Attendees List (Mini) */}
                   <div className="flex flex-col gap-3">
                      {attendeesList.slice(0, 5).map(user => (
                        <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all">
                           <img src={user.avatarUrl} className="w-8 h-8 rounded-lg object-cover" alt="" />
                           <div className="min-w-0">
                             <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase truncate">{user.displayName}</p>
                             <p className="text-[8px] font-mono text-slate-400">@{user.username}</p>
                           </div>
                        </div>
                      ))}
                      {currentCount > 5 && (
                          <div className="text-center pt-2">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                                  + {currentCount - 5} More Signals
                              </span>
                          </div>
                      )}
                   </div>
               </div>
            
               <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col gap-3">
                     
                     {/* NEURAL LOBBY BUTTON */}
                     {isAttending && liveGathering.linkedChatId && (
                         <button 
                           /* Ensure full gathering object is passed to satisfy robust join logic */
                           onClick={() => onOpenLobby(liveGathering)}
                           className="w-full py-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all border border-indigo-200 dark:border-indigo-800 flex items-center justify-center gap-2"
                         >
                            <ICONS.Messages /> ACCESS_NEURAL_LOBBY
                         </button>
                     )}

                     {!isOrganizer && (
                         <button 
                           onClick={() => onRSVP(liveGathering.id, isAttending || isWaitlisted || false)}
                           className={`w-full py-5 rounded-[1.8rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl transition-all active:scale-95 ${
                               isAttending 
                               ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-500' 
                               : isWaitlisted 
                               ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-rose-50 hover:text-rose-500'
                               : isFull
                               ? 'bg-amber-500 text-white hover:bg-amber-600'
                               : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-indigo-600 dark:hover:bg-indigo-400'
                           }`}
                         >
                           {isAttending ? 'WITHDRAW_SIGNAL' : isWaitlisted ? 'LEAVE_QUEUE' : isFull ? 'JOIN_WAITLIST' : 'CONFIRM_PRESENCE'}
                         </button>
                     )}
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* 4. MEMORY BANK (Shared Media) */}
      <GatheringMemoryBank 
        gathering={liveGathering} 
        currentUser={currentUser} 
        isAttendee={isAttending} 
        isOrganizer={isOrganizer}
        addToast={window.dispatchEvent.bind(window, new CustomEvent('vibe-toast', { detail: { msg: '', type: 'info' } })) as any} 
      />

      {/* MODALS */}
      <DeleteConfirmationModal 
        isOpen={showDeleteModal}
        title="CANCEL_GATHERING"
        description="Are you sure you want to cancel this gathering? All attendees will be notified."
        onConfirm={() => handleDelete(false)}
        onCancel={() => setShowDeleteModal(false)}
        confirmText="CONFIRM_CANCELLATION"
      />

      {/* Custom Modal for Recurring Delete */}
      {showRecurringDeleteOptions && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowRecurringDeleteOptions(false)}></div>
           <div className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] p-10 shadow-2xl border border-white/20">
               <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-4 text-center">Recurrence_Detected</h3>
               <div className="space-y-3">
                   <button onClick={() => { setShowRecurringDeleteOptions(false); handleDelete(false); }} className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700">
                       Cancel Only This Event
                   </button>
                   <button onClick={() => { setShowRecurringDeleteOptions(false); handleDelete(true); }} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-rose-700 shadow-lg">
                       Cancel Entire Series
                   </button>
               </div>
           </div>
        </div>
      )}

      {isEditOpen && (
        <CreateGatheringModal 
          currentUser={currentUser}
          initialData={liveGathering}
          onClose={() => setIsEditOpen(false)}
          onConfirm={handleUpdate}
        />
      )}

    </div>
  );
};