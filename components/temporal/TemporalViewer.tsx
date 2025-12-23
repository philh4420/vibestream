
import React, { useState, useEffect, useRef } from 'react';
import { Story, User } from '../../types';
import { ICONS } from '../../constants';

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
  
  const currentStory = stories[currentIndex];
  // Default duration for images is 5s. 
  // Archived streams (metadata logs) are treated as images for viewing duration.
  const DURATION = 5000; 
  const STEP = 50;

  useEffect(() => {
    setProgress(0);
  }, [currentIndex]);

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < stories.length - 1) {
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
  }, [currentIndex, isPaused, stories.length, onClose]);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < stories.length - 1) {
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

  const isVideo = currentStory.type === 'video' || (currentStory.coverUrl && currentStory.coverUrl.match(/\.(mp4|mov|webm)$/i));
  const isArchivedStream = currentStory.isArchivedStream;

  return (
    <div className="absolute inset-0 z-50 bg-black flex items-center justify-center animate-in zoom-in-95 duration-300">
      
      {/* Immersive Background Blur */}
      <div className="absolute inset-0 z-0 opacity-30 blur-3xl scale-110 pointer-events-none">
        {isVideo ? (
           <video src={currentStory.coverUrl} className="w-full h-full object-cover" muted loop />
        ) : (
           <img src={currentStory.coverUrl} className="w-full h-full object-cover" alt="" />
        )}
      </div>

      {/* Main Shard Container */}
      <div 
        className="relative w-full h-full md:w-[450px] md:h-[95%] bg-slate-900 md:rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Media Layer */}
        {isVideo ? (
           <video 
             src={currentStory.coverUrl} 
             className="absolute inset-0 w-full h-full object-cover" 
             autoPlay 
             playsInline 
             muted 
             loop 
           />
        ) : (
           <img src={currentStory.coverUrl} className="absolute inset-0 w-full h-full object-cover opacity-90" alt="" />
        )}
        
        {/* Scrim */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

        {/* ARCHIVED STREAM OVERLAY */}
        {isArchivedStream && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-8 text-center bg-black/40 backdrop-blur-[2px]">
             <div className="w-20 h-20 rounded-[2rem] bg-white/10 border border-white/20 flex items-center justify-center mb-6 shadow-2xl backdrop-blur-md">
                <div className="text-white scale-125"><ICONS.Streams /></div>
             </div>
             
             <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2 leading-none">
               {currentStory.streamTitle || 'Signal_Log'}
             </h2>
             
             <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg border border-white/10 mb-8">
                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                <span className="text-[8px] font-black text-white uppercase tracking-[0.3em] font-mono">SIGNAL_TERMINATED</span>
             </div>

             <div className="grid grid-cols-2 gap-4 w-full">
                <div className="bg-black/50 p-4 rounded-2xl border border-white/10">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1">Duration</p>
                   <p className="text-xl font-black text-white font-mono">{currentStory.streamStats?.duration || '00:00'}</p>
                </div>
                <div className="bg-black/50 p-4 rounded-2xl border border-white/10">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1">Peak_Nodes</p>
                   <p className="text-xl font-black text-white font-mono">{currentStory.streamStats?.viewers || 0}</p>
                </div>
             </div>
          </div>
        )}

        {/* HUD: Progress Bars */}
        <div className="absolute top-0 left-0 right-0 p-4 z-20 flex gap-1.5">
          {stories.map((_, idx) => (
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
              <p className="text-[9px] font-mono text-slate-300 uppercase tracking-widest">
                {currentStory.timestamp?.toDate ? new Date(currentStory.timestamp.toDate()).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'NOW'}
              </p>
            </div>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="w-10 h-10 flex items-center justify-center bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Touch Zones */}
        <div className="absolute inset-0 z-10 flex">
          <div className="w-1/3 h-full" onClick={handlePrev} />
          <div className="w-2/3 h-full" onClick={handleNext} />
        </div>

        {/* HUD: Footer Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-20 flex items-end justify-between pointer-events-none">
           {!isArchivedStream && (
             <div className="pointer-events-auto">
                <button className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 text-white active:scale-95 transition-all">
                   <div className="scale-75"><ICONS.Saved /></div>
                   <span className="text-[9px] font-black uppercase tracking-widest">Capture</span>
                </button>
             </div>
           )}
           
           <div className="pointer-events-auto ml-auto">
              <button className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-900/50 active:scale-90 transition-all border border-white/20">
                 ❤️
              </button>
           </div>
        </div>

      </div>
    </div>
  );
};
