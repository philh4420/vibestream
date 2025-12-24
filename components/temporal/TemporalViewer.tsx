
import React, { useState, useEffect } from 'react';
import { Story, User } from '../../types';
import { ICONS } from '../../constants';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { deleteDoc, doc } = Firestore as any;
import { DeleteConfirmationModal } from '../ui/DeleteConfirmationModal';

interface TemporalViewerProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
  currentUser: User;
}

export const TemporalViewer: React.FC<TemporalViewerProps> = ({ stories, initialIndex, onClose, currentUser }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [localStories, setLocalStories] = useState(stories);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Settings check
  const shouldAutoPlay = currentUser?.settings?.appearance?.autoPlayVideo !== false;

  useEffect(() => {
    setLocalStories(stories);
  }, [stories]);

  const currentStory = localStories[currentIndex];
  const DURATION = 5000; 
  const STEP = 50;

  useEffect(() => {
    setProgress(0);
  }, [currentIndex]);

  useEffect(() => {
    if (isPaused || !currentStory || showDeleteModal) return;

    // Pause timer if video and not auto-playing? No, standard story behavior is auto-advance.
    // If autoPlay is off, maybe we should pause initially? 
    // For VibeStream 2026 UX, 'AutoPlay Video' mostly applies to feed. Stories are explicit intent.
    // However, respecting the setting means videos shouldn't auto-play sound or motion.
    
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < localStories.length - 1) {
            setCurrentIndex(c => c + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + (STEP / DURATION) * 100;
      });
    }, STEP);

    return () => clearInterval(timer);
  }, [currentIndex, isPaused, localStories.length, onClose, currentStory, showDeleteModal]);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < localStories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPaused(true);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!currentStory) return;
    
    try {
        await deleteDoc(doc(db, 'stories', currentStory.id));
        const updatedStories = localStories.filter(s => s.id !== currentStory.id);
        
        if (updatedStories.length === 0) {
            onClose();
        } else {
            setLocalStories(updatedStories);
            if (currentIndex >= updatedStories.length) {
                setCurrentIndex(updatedStories.length - 1);
            }
            setIsPaused(false);
        }
        window.dispatchEvent(new CustomEvent('vibe-toast', { detail: { msg: "Fragment Purged", type: 'success' } }));
    } catch (err) {
        window.dispatchEvent(new CustomEvent('vibe-toast', { detail: { msg: "Deletion Failed", type: 'error' } }));
        setIsPaused(false);
    }
    setShowDeleteModal(false);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setIsPaused(false);
  };

  if (!currentStory) return null;

  const isVideo = currentStory.type === 'video' || (currentStory.coverUrl && currentStory.coverUrl.match(/\.(mp4|mov|webm)$/i));
  const isArchivedStream = currentStory.isArchivedStream;
  const isOwner = currentStory.authorId === currentUser.id;

  return (
    <div className="absolute inset-0 z-50 bg-black flex items-center justify-center animate-in zoom-in-95 duration-300">
      
      {/* Immersive Background Blur */}
      <div className="absolute inset-0 z-0 opacity-30 blur-3xl scale-110 pointer-events-none">
        {isVideo ? (
           <video src={currentStory.coverUrl} className="w-full h-full object-cover" muted loop autoPlay={shouldAutoPlay} />
        ) : (
           <img src={currentStory.coverUrl} className="w-full h-full object-cover" alt="" />
        )}
      </div>

      {/* Main Shard Container */}
      <div 
        className="relative w-full h-full md:w-[450px] md:h-[95%] bg-slate-900 md:rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10"
        onMouseDown={() => !showDeleteModal && setIsPaused(true)}
        onMouseUp={() => !showDeleteModal && setIsPaused(false)}
        onTouchStart={() => !showDeleteModal && setIsPaused(true)}
        onTouchEnd={() => !showDeleteModal && setIsPaused(false)}
      >
        {/* Media Layer */}
        {isVideo ? (
           <video 
             src={currentStory.coverUrl} 
             className="absolute inset-0 w-full h-full object-cover" 
             autoPlay={shouldAutoPlay}
             playsInline 
             muted={!isArchivedStream || !shouldAutoPlay} // Mute if archived or autoplay disabled
             loop 
           />
        ) : (
           <img src={currentStory.coverUrl} className="absolute inset-0 w-full h-full object-cover opacity-90" alt="" />
        )}
        
        {/* Scrim */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

        {/* ARCHIVED STREAM OVERLAY (Metadata Only) */}
        {isArchivedStream && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-8 text-center bg-black/20 pointer-events-none">
             <div className="absolute top-20 right-4 bg-rose-600 text-white px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest">
                ARCHIVED_SIGNAL
             </div>
          </div>
        )}

        {/* HUD: Progress Bars */}
        <div className="absolute top-0 left-0 right-0 p-4 z-20 flex gap-1.5">
          {localStories.map((_, idx) => (
            <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-linear"
                style={{ 
                  width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%',
                  transitionDuration: idx === currentIndex ? '50ms' : '0ms'
                }} 
              />
            </div>
          ))}
        </div>

        {/* HUD: Header */}
        <div className="absolute top-8 left-0 right-0 px-4 z-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={currentStory.authorAvatar} className="w-10 h-10 rounded-full border-2 border-white/20 shadow-md" alt="" />
            <div>
              <p className="text-sm font-black text-white uppercase tracking-tight shadow-black drop-shadow-md">{currentStory.authorName}</p>
              <div className="flex items-center gap-2">
                <p className="text-[9px] font-mono text-slate-300 uppercase tracking-widest">
                    {currentStory.timestamp?.toDate ? new Date(currentStory.timestamp.toDate()).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'NOW'}
                </p>
                {isArchivedStream && (
                    <span className="text-[8px] bg-white/20 px-1.5 rounded text-white font-mono">
                        DUR: {currentStory.streamStats?.duration}
                    </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             {isOwner && (
                 <button 
                    onClick={handleDeleteClick}
                    className="w-10 h-10 flex items-center justify-center bg-black/20 hover:bg-rose-600/80 backdrop-blur-md rounded-full text-white transition-all"
                 >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                 </button>
             )}
             <button 
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="w-10 h-10 flex items-center justify-center bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-all"
             >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
          </div>
        </div>

        {/* Touch Zones */}
        <div className="absolute inset-0 z-10 flex">
          <div className="w-1/3 h-full" onClick={handlePrev} />
          <div className="w-2/3 h-full" onClick={handleNext} />
        </div>

        {/* HUD: Footer Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-20 flex items-end justify-between pointer-events-none">
           <div className="pointer-events-auto">
              {!isArchivedStream && (
                <button className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 text-white active:scale-95 transition-all">
                   <div className="scale-75"><ICONS.Saved /></div>
                   <span className="text-[9px] font-black uppercase tracking-widest">Capture</span>
                </button>
              )}
           </div>
           
           <div className="pointer-events-auto ml-auto">
              <button className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-900/50 active:scale-90 transition-all border border-white/20">
                 ❤️
              </button>
           </div>
        </div>

        {/* DELETE CONFIRMATION MODAL */}
        <DeleteConfirmationModal 
            isOpen={showDeleteModal}
            title="PURGE_FRAGMENT"
            description="Permanently delete this temporal record? This action cannot be undone."
            onConfirm={confirmDelete}
            onCancel={cancelDelete}
            confirmText="CONFIRM_DELETE"
        />

      </div>
    </div>
  );
};
