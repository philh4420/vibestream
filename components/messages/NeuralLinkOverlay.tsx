import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { User } from '../../types';

interface NeuralLinkOverlayProps {
  userData: User;
  onClose: () => void;
}

// Audio Decoding Utils as per coding guidelines
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createPCM16Blob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export const NeuralLinkOverlay: React.FC<NeuralLinkOverlayProps> = ({ userData, onClose }) => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'active' | 'error'>('idle');
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');

  const aiRef = useRef<any>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef(0);
  const audioContextsRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);

  const cleanup = () => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
    }
    sourcesRef.current.forEach(s => {
        try { s.stop(); } catch(e) {}
    });
    sourcesRef.current.clear();
    
    if (audioContextsRef.current) {
        if (audioContextsRef.current.input.state !== 'closed') audioContextsRef.current.input.close();
        if (audioContextsRef.current.output.state !== 'closed') audioContextsRef.current.output.close();
    }
  };

  const initSession = async () => {
    setStatus('connecting');
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("API_KEY_REQUIRED");

      // Use constructor from instructions: Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
      const ai = new GoogleGenAI({ apiKey });
      aiRef.current = ai;
      
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      const outputCtx = new AudioContextClass({ sampleRate: 24000 });
      audioContextsRef.current = { input: inputCtx, output: outputCtx };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setStatus('active');
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPCM16Blob(inputData);
              // CRITICAL: Solely rely on sessionPromise resolves and then call session.sendRealtimeInput
              sessionPromise.then((session: any) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Audio Output Handling
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              const outCtx = audioContextsRef.current!.output;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(base64Audio), outCtx, 24000, 1);
              const source = outCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outCtx.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            // Transcription Handling
            if (message.serverContent?.outputTranscription) {
                setAiResponse(prev => prev + message.serverContent!.outputTranscription!.text);
            } else if (message.serverContent?.inputTranscription) {
                setTranscript(prev => prev + message.serverContent!.inputTranscription!.text);
            }

            if (message.serverContent?.turnComplete) {
                setTranscript('');
                setAiResponse('');
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e: any) => {
            console.error("Session Error", e);
            setStatus('error');
          },
          onclose: () => {
            setStatus('idle');
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `You are the VibeStream 2026 Core Neural Intelligence. You are speaking with node ${userData.displayName} (@${userData.username}). Your tone is futuristic, efficient, and helpful. You analyze signals and help manage grid connections. Speak concisely.`,
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        }
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  useEffect(() => {
    initSession();
    return () => cleanup();
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[9000] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl" onClick={onClose} />
      
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[4rem] p-12 shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
        
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay pointer-events-none" />
        
        <div className="relative z-10 mb-12">
            <div className="w-40 h-40 md:w-48 md:h-48 relative flex items-center justify-center">
                <div className={`absolute inset-0 bg-indigo-600/20 rounded-full blur-3xl animate-pulse transition-all duration-1000 ${status === 'active' ? 'scale-150' : 'scale-50 opacity-0'}`} />
                <div className={`w-32 h-32 md:w-40 md:h-40 bg-gradient-to-tr from-indigo-600 via-purple-600 to-rose-500 rounded-[3rem] shadow-heavy flex items-center justify-center relative z-10 transition-all duration-700 ${status === 'active' ? 'scale-110 rotate-[15deg]' : 'grayscale'}`}>
                    <div className="text-white text-5xl animate-bounce">🧠</div>
                    {status === 'connecting' && (
                        <div className="absolute inset-0 border-4 border-white/30 border-t-white rounded-[3rem] animate-spin" />
                    )}
                </div>
                {status === 'active' && (
                    <div className="absolute -inset-4 border-2 border-indigo-500/20 rounded-full animate-ping" />
                )}
            </div>
        </div>

        <div className="relative z-10 space-y-6 w-full">
            <div>
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-full border border-indigo-100 dark:border-indigo-800 mb-4">
                  <div className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]' : 'bg-slate-400'}`} />
                  <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.3em] font-mono">Neural_Uplink: {status.toUpperCase()}</span>
               </div>
               <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">Core_Link</h2>
            </div>

            <div className="min-h-[120px] flex flex-col justify-center gap-4 px-6 py-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                {status === 'connecting' && <p className="text-xs font-mono text-slate-400 animate-pulse">ESTABLISHING_HANDSHAKE...</p>}
                {status === 'error' && <p className="text-xs font-mono text-rose-500 uppercase tracking-widest">Sync_Error: Transmission_Interrupted</p>}
                {status === 'active' && (
                    <>
                        <div className="space-y-1 text-left">
                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 font-mono">Input_Capture:</p>
                            <p className="text-sm font-bold text-slate-600 dark:text-slate-300 italic truncate">"{transcript || 'Listening...'}"</p>
                        </div>
                        <div className="h-px bg-slate-100 dark:bg-slate-700" />
                        <div className="space-y-1 text-left">
                            <p className="text-[8px] font-black uppercase tracking-widest text-indigo-500 font-mono">Core_Response:</p>
                            <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">"{aiResponse || 'Awaiting burst...'}"</p>
                        </div>
                    </>
                )}
            </div>

            <div className="flex gap-4 pt-4">
                <button 
                  onClick={onClose}
                  className="flex-1 py-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                >
                  Terminate_Sync
                </button>
                {status === 'error' && (
                    <button 
                        onClick={initSession}
                        className="flex-[2] py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-indigo-700 transition-all active:scale-95"
                    >
                        Restore_Uplink
                    </button>
                )}
            </div>
        </div>

        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-8 opacity-20 pointer-events-none">
            <span className="text-[8px] font-mono text-slate-400 font-black">ENCRYPTION: AES-256</span>
            <span className="text-[8px] font-mono text-slate-400 font-black">BITRATE: 48KBPS</span>
            <span className="text-[8px] font-mono text-slate-400 font-black">LATENCY: 42MS</span>
        </div>
      </div>
    </div>,
    document.body
  );
};