
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, increment, deleteDoc } = Firestore as any;
import { SonicEcho, User } from '../../types';
import { EchoRecorderModal } from './EchoRecorderModal';
import { ICONS } from '../../constants';
import { createAudioContext, applyAudioFilter, analyzeAudio } from '../../services/audioEffects';
import { DeleteConfirmationModal } from '../ui/DeleteConfirmationModal';

interface SonicEchoStripProps {
  userData: User | null;
}

export const SonicEchoStrip: React.FC<SonicEchoStripProps> = ({ userData }) => {
  const [echoes, setEchoes] = useState<SonicEcho[]>([]);
  const [isRecorderOpen, setIsRecorderOpen] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Audio Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  
  // Visual Refs
  const [visualData, setVisualData] = useState<Uint8Array | null>(null);

  useEffect(() => {
    if (!db) return;
    // Last 24h logic same as stories, keeping simple for demo
    const q = query(collection(db, 'echoes'), orderBy('timestamp', 'desc'), limit(10));
    const unsub = onSnapshot(q, (snap: any) => {
      setEchoes(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as SonicEcho)));
    });
    return () => unsub();
  }, []);

  const stopPlayback = () => {
    if (sourceNodeRef.current) {
        try { sourceNodeRef.current.stop(); } catch(e) {}
    }
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setPlayingId(null);
    setVisualData(null);
  };

  const playEcho = async (echo: SonicEcho) => {
    if (playingId === echo.id) {
        stopPlayback();
        return;
    }
    
    stopPlayback(); // Stop any current
    setPlayingId(echo.id);

    try {
        if (!audioCtxRef.current) audioCtxRef.current = createAudioContext();
        const ctx = audioCtxRef.current;

        // Fetch & Decode
        const response = await fetch(echo.audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;

        const gainNode = ctx.createGain();
        gainNode.gain.value = 1.0;

        // Apply Filter
        applyAudioFilter(ctx, source, gainNode, echo.filter);

        // Analyzer for Visuals
        const analyser = analyzeAudio(ctx, gainNode);
        analyserRef.current = analyser;

        gainNode.connect(ctx.destination);
        source.start(0);
        sourceNodeRef.current = source;

        // Update Listen Count
        updateDoc(doc(db, 'echoes', echo.id), { listens: increment(1) });

        source.onended = () => {
            setPlayingId(null);
            setVisualData(null);
            cancelAnimationFrame(animationRef.current!);
        };

        // Animation Loop
        const animate = () => {
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(dataArray);
            setVisualData(dataArray);
            animationRef.current = requestAnimationFrame(animate);
        };
        animate();

    } catch (e) {
        console.error("Playback error", e);
        setPlayingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!db || !deleteId) return;
    try {
        await deleteDoc(doc(db, 'echoes', deleteId));
        if (playingId === deleteId) stopPlayback();
        window.dispatchEvent(new CustomEvent('vibe-toast', { detail: { msg: "Echo Dissolved", type: 'success' } }));
    } catch (e) {
        window.dispatchEvent(new CustomEvent('vibe-toast', { detail: { msg: "Dissolution Failed", type: 'error' } }));
    } finally {
        setDeleteId(null);
    }
  };

  return (
    <div className="mb-6 pl-4">
       <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_8px_#6366f1] animate-pulse" />
          <h3 className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] font-mono">Sonic_Echoes</h3>
       </div>

       <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 pr-4">
          
          {/* Create Button */}
          {userData && (
            <button 
                onClick={() => setIsRecorderOpen(true)}
                className="shrink-0 h-14 w-14 rounded-[1.2rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-lg active:scale-95 transition-all group border border-slate-700 dark:border-slate-200"
            >
                <div className="scale-110 group-hover:rotate-90 transition-transform"><ICONS.Create /></div>
            </button>
          )}

          {/* Echo Pills */}
          {echoes.map(echo => {
             const isPlaying = playingId === echo.id;
             const isAuthor = userData?.id === echo.authorId;

             return (
               <div key={echo.id} className="relative group/echo">
                   <button 
                     onClick={() => playEcho(echo)}
                     className={`shrink-0 h-14 px-4 rounded-[1.2rem] flex items-center gap-3 transition-all border relative overflow-hidden group ${
                        isPlaying 
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] w-48' 
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 w-36 hover:w-40 hover:border-indigo-300 dark:hover:border-slate-600'
                     }`}
                   >
                      {/* Avatar */}
                      <img src={echo.authorAvatar} className={`w-8 h-8 rounded-lg object-cover bg-slate-100 border ${isPlaying ? 'border-white/30' : 'border-slate-100 dark:border-slate-600'}`} alt="" />
                      
                      {/* Waveform Visualization */}
                      <div className="flex-1 flex items-center justify-center gap-[2px] h-full">
                         {isPlaying && visualData ? (
                            // Live Visuals
                            Array.from({length: 12}).map((_, i) => {
                                const val = visualData[i * 2] || 0;
                                const h = Math.max(10, (val / 255) * 100);
                                return (
                                    <div 
                                        key={i} 
                                        className="w-1 bg-white rounded-full transition-all duration-75"
                                        style={{ height: `${h}%` }}
                                    />
                                );
                            })
                         ) : (
                            // Static Waveform (Mock based on duration/id hash if needed, or simple lines)
                            echo.waveform?.slice(0, 12).map((val, i) => (
                                <div 
                                    key={i} 
                                    className={`w-1 rounded-full ${isPlaying ? 'bg-white' : 'bg-slate-300 dark:bg-slate-600'}`}
                                    style={{ height: `${val * 100}%` }}
                                />
                            ))
                         )}
                      </div>

                      {/* Filter Indicator */}
                      {echo.filter !== 'raw' && !isPlaying && (
                          <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                      )}
                   </button>

                   {/* Delete Button */}
                   {isAuthor && (
                        <button 
                            onClick={(e) => setDeleteId(echo.id)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md z-10 hover:bg-rose-600 active:scale-90 transition-transform"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                        </button>
                   )}
               </div>
             );
          })}
       </div>

       {isRecorderOpen && userData && (
         <EchoRecorderModal userData={userData} onClose={() => setIsRecorderOpen(false)} />
       )}

       <DeleteConfirmationModal
         isOpen={!!deleteId}
         title="DISSOLVE_ECHO"
         description="Permanently purge this sonic fragment? This action cannot be reversed."
         onConfirm={confirmDelete}
         onCancel={() => setDeleteId(null)}
         confirmText="CONFIRM_DISSOLVE"
       />
    </div>
  );
};
