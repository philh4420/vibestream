
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ICONS } from '../../constants';
import { uploadToCloudinary } from '../../services/cloudinary';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { collection, addDoc, serverTimestamp } = Firestore as any;
import { User, AudioFilterType } from '../../types';
import { createAudioContext, applyAudioFilter, analyzeAudio } from '../../services/audioEffects';

interface EchoRecorderModalProps {
  userData: User;
  onClose: () => void;
}

const FILTERS: { id: AudioFilterType, label: string, color: string }[] = [
  { id: 'raw', label: 'Raw_Signal', color: 'bg-slate-500' },
  { id: 'cyber', label: 'Cyber_Tunnel', color: 'bg-indigo-500' },
  { id: 'lofi', label: 'LoFi_Radio', color: 'bg-amber-600' },
  { id: 'deep', label: 'Deep_Void', color: 'bg-slate-900' },
];

export const EchoRecorderModal: React.FC<EchoRecorderModalProps> = ({ userData, onClose }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [activeFilter, setActiveFilter] = useState<AudioFilterType>('raw');
  const [isUploading, setIsUploading] = useState(false);
  const [waveform, setWaveform] = useState<number[]>(new Array(20).fill(10));
  const [duration, setDuration] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Helper to strictly kill all media tracks immediately
  const stopMediaTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      streamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(console.error);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  // Initialize Audio Context on Mount
  useEffect(() => {
    audioCtxRef.current = createAudioContext();
    return () => {
      stopMediaTracks();
    };
  }, []);

  const handleClose = () => {
    stopMediaTracks();
    onClose();
  };

  const startRecording = async () => {
    if (!audioCtxRef.current) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const source = audioCtxRef.current.createMediaStreamSource(stream);
      const analyser = analyzeAudio(audioCtxRef.current, source);
      analyserRef.current = analyser;

      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      startTimeRef.current = Date.now();
      
      updateWaveform();

    } catch (e) {
      console.error("Mic access denied", e);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setDuration((Date.now() - startTimeRef.current) / 1000);
      
      // Stop the mic hardware immediately after recording finishes (UX: light off)
      // We don't need it for preview unless we were doing live monitoring
      if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
      }
    }
  };

  const updateWaveform = () => {
    if (!analyserRef.current || !isRecording) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Downsample to 20 bars
    const step = Math.floor(bufferLength / 20);
    const newWave = [];
    for (let i = 0; i < 20; i++) {
        const val = dataArray[i * step];
        newWave.push(Math.max(10, val / 2)); // Normalize height
    }
    setWaveform(newWave);

    animationFrameRef.current = requestAnimationFrame(updateWaveform);
  };

  const handlePublish = async () => {
    if (!audioBlob) return;
    
    // CRITICAL: Stop hardware access immediately before upload starts
    stopMediaTracks();
    
    setIsUploading(true);

    try {
      const file = new File([audioBlob], "echo.webm", { type: 'audio/webm' });
      const url = await uploadToCloudinary(file);

      // Generate a static waveform representation
      const staticWaveform = waveform.map(v => Math.round((v / 128) * 100) / 100);

      await addDoc(collection(db, 'echoes'), {
        authorId: userData.id,
        authorName: userData.displayName,
        authorAvatar: userData.avatarUrl,
        audioUrl: url,
        waveform: staticWaveform,
        filter: activeFilter,
        duration: duration,
        timestamp: serverTimestamp(),
        listens: 0
      });

      onClose();
      window.dispatchEvent(new CustomEvent('vibe-toast', { detail: { msg: "Sonic Echo Transmitted", type: 'success' } }));

    } catch (e) {
      console.error(e);
      setIsUploading(false);
    }
  };

  const reset = () => {
    setAudioBlob(null);
    setWaveform(new Array(20).fill(10));
    // Re-initialize audio context if user discarded and wants to record again
    // But since we stopped tracks on stopRecording, we need to ensure startRecording gets new stream
    // startRecording logic already handles getUserMedia, so we are good.
  };

  return createPortal(
    <div className="fixed inset-0 z-[5000] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-300 touch-none">
      <button onClick={handleClose} className="absolute top-6 right-6 p-4 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg></button>

      <div className="w-full max-w-md flex flex-col items-center gap-10">
        
        {/* Header */}
        <div className="text-center">
           <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2">Sonic_Echo</h2>
           <p className="text-[10px] font-mono text-slate-400 uppercase tracking-[0.3em]">Record Voice Status</p>
        </div>

        {/* Visualizer */}
        <div className="h-32 flex items-center justify-center gap-1.5 w-full">
           {waveform.map((h, i) => (
             <div 
               key={i} 
               className={`w-2 md:w-3 rounded-full transition-all duration-75 ${isRecording ? 'bg-indigo-500 shadow-[0_0_10px_#6366f1]' : 'bg-slate-700'}`}
               style={{ height: `${h}%` }}
             />
           ))}
        </div>

        {/* Controls */}
        {!audioBlob ? (
           <div className="flex flex-col items-center gap-6">
              <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center transition-all duration-200 active:scale-90 ${isRecording ? 'bg-rose-600 shadow-[0_0_40px_#e11d48] scale-110' : 'bg-white shadow-xl'}`}
              >
                 <div className={`text-3xl ${isRecording ? 'text-white' : 'text-slate-900'}`}>
                    {isRecording ? <div className="w-8 h-8 bg-white rounded-lg animate-pulse" /> : <ICONS.Create />}
                 </div>
              </button>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Hold to Record</p>
           </div>
        ) : (
           <div className="w-full space-y-8 animate-in slide-in-from-bottom-8">
              {/* Filter Selection */}
              <div>
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center mb-4">Select Atmosphere</p>
                 <div className="flex justify-center gap-3">
                    {FILTERS.map(f => (
                       <button
                         key={f.id}
                         onClick={() => setActiveFilter(f.id)}
                         className={`px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${activeFilter === f.id ? `text-white ${f.color} shadow-lg scale-105` : 'bg-slate-800 text-slate-400'}`}
                       >
                          {f.label}
                       </button>
                    ))}
                 </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                 <button onClick={reset} className="flex-1 py-4 bg-slate-800 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-700 transition-colors">Discard</button>
                 <button 
                   onClick={handlePublish} 
                   disabled={isUploading}
                   className="flex-[2] py-4 bg-white text-slate-900 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"
                 >
                    {isUploading ? 'UPLOADING...' : 'BROADCAST_ECHO'}
                 </button>
              </div>
           </div>
        )}

      </div>
    </div>,
    document.body
  );
};
