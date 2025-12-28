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
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const [visualData, setVisualData] = useState<Uint8Array | null>(null);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'echoes'), orderBy('timestamp', 'desc'), limit(15));
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
    
    stopPlayback();
    setPlayingId(echo.id);

    try {
        if (!audioCtxRef.current) audioCtxRef.current = createAudioContext();
        const ctx = audioCtxRef.current;

        const response = await fetch(echo.audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;

        const gainNode = ctx.createGain();
        gainNode.gain.value = 1.0;

        applyAudioFilter(ctx, source, gainNode, echo.filter);
        const analyser = analyzeAudio(ctx, gainNode);
        analyserRef.current = analyser;

        gainNode.connect(ctx.destination);
        source.start(0);
        sourceNodeRef.current = source;

        updateDoc(doc(db, 'echoes', echo.id), { listens: increment(1) });

        source.onended = () => {
            setPlayingId(null);
            setVisualData(null);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };

        const animate = () => {
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(dataArray);
            setVisualData(dataArray);
            animationRef.current = requestAnimationFrame(animate);
        };
        animate();

    } catch (e) {
        setPlayingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!db || !deleteId) return;
    try {
        await deleteDoc(doc(db, 'echoes', deleteId));
        if (playingId === deleteId) stopPlayback();
        window.dispatchEvent(new CustomEvent('vibe-toast', { detail: { msg: "Echo Signal Purged", type: 'success' } }));
    } catch (e) {
        window.dispatchEvent(new CustomEvent('vibe-toast', { detail: { msg: "Purge Failed", type: 'error' } }));
    } finally {
        setDeleteId(null);
    }
  };

  return (
    <div className="pl-4 md:pl-0">
       <div className="flex items-center gap-3 mb-4 px-1">
          <div className="w-1 h-3 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
          <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] font-mono">Sonic_Resonance</h3>
       </div>

       <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 pr-6 snap-x">
          
          {/* Create Node */}
          {userData && (
            <button 
                onClick={() => setIsRecorderOpen(true)}
                className="shrink-0 h-16 w-16 rounded-[1.5rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-xl active:scale-90 transition-all group border border-slate-800 dark:border-slate-100 snap-start"
            >
                <div className="scale-125 group-hover:rotate-12 transition-transform duration-300"><ICONS.Create /></div>
            </button>
          )}

          {/* Active Echoes */}
          {echoes.map(echo => {
             const isPlaying = playingId === echo.id;
             const isAuthor = userData?.id === echo.authorId;

             return (
               <div key={echo.id} className="relative group/echo snap-start">
                   <button 
                     onClick={() => playEcho(echo)}
                     className={`shrink-0 h-16 px-5 rounded-[1.5rem] flex items-center gap-4 transition-all duration-500 border relative overflow-hidden group ${
                        isPlaying 
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_20px_40px_-10px_rgba(99,102,241,0.5)] w-56' 
                            : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 w-40 hover:w-44 hover:border-indigo-400 dark:hover:border-indigo-900 hover:shadow-lg'
                     }`}
                   >
                      {/* Avatar Node */}
                      <div className="relative shrink-0">
                        <img src={echo.authorAvatar} className={`w-9 h-9 rounded-xl object-cover border-2 ${isPlaying ? 'border-white/30' : 'border-slate-50 dark:border-slate-800'}`} alt="" />
                        {isPlaying && <div className="absolute inset-0 rounded-xl border-2 border-white animate-ping opacity-20" />}
                      </div>
                      
                      {/* Kinetic Visualization */}
                      <div className="flex-1 flex items-center justify-center gap-[3px] h-full">
                         {isPlaying && visualData ? (
                            Array.from({length: 15}).map((_, i) => {
                                const val = visualData[i * 2] || 0;
                                const h = Math.max(12, (val / 255) * 100);
                                return (
                                    <div 
                                        key={i} 
                                        className="w-1 bg-white rounded-full transition-all duration-75"
                                        style={{ height: `${h}%` }}
                                    />
                                );
                            })
                         ) : (
                            echo.waveform?.slice(0, 15).map((val, i) => (
                                <div 
                                    key={i} 
                                    className={`w-1 rounded-full transition-all duration-500 ${isPlaying ? 'bg-white' : 'bg-slate-200 dark:bg-slate-700'}`}
                                    style={{ height: `${val * 100}%` }}
                                />
                            ))
                         )}
                      </div>

                      {/* Detail Hud */}
                      {isPlaying && (
                        <div className="absolute right-3 top-2 flex flex-col items-end opacity-60">
                           <span className="text-[6px] font-black uppercase tracking-widest font-mono">{echo.filter}</span>
                        </div>
                      )}
                   </button>

                   {/* Admin Override: Delete */}
                   {isAuthor && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); setDeleteId(echo.id); }}
                            className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-rose-600 text-white rounded-lg flex items-center justify-center shadow-2xl z-10 hover:bg-rose-700 active:scale-90 transition-all opacity-0 group-hover/echo:opacity-100 border border-white/20"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
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
         title="PURGE_SONIC_ECHO"
         description="Are you sure you want to dissolve this frequency fragment from the neural grid?"
         onConfirm={confirmDelete}
         onCancel={() => setDeleteId(null)}
         confirmText="CONFIRM_PURGE"
       />
    </div>
  );
};