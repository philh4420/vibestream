
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { db, auth } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { 
  collection, 
  doc, 
  onSnapshot, 
  updateDoc, 
  setDoc,
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  limit,
  increment,
  getDocs
} = Firestore as any;
import { User } from '../../types';
import { ICONS } from '../../constants';
import { uploadToCloudinary } from '../../services/cloudinary';

interface LiveBroadcastOverlayProps {
  userData: User;
  onStart: (title: string) => void;
  onEnd: () => void;
  activeStreamId: string | null;
}

interface StreamMessage {
  id: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: any;
}

const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const LiveBroadcastOverlay: React.FC<LiveBroadcastOverlayProps> = ({ 
  userData, 
  onStart, 
  onEnd, 
  activeStreamId 
}) => {
  const [streamTitle, setStreamTitle] = useState('');
  const [timer, setTimer] = useState(0);
  const [viewerCount, setViewerCount] = useState(0);
  const [hwStatus, setHwStatus] = useState<'checking' | 'ready' | 'failed'>('checking');
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [showChat, setShowChat] = useState(true);
  const [chatInput, setChatInput] = useState(''); 
  const [isLive, setIsLive] = useState(false); // Internal state to manage Pre-flight vs Live
  const [isStarting, setIsStarting] = useState(false);
  
  // Archive Modal State
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveProgress, setArchiveProgress] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const pcInstances = useRef<Record<string, RTCPeerConnection>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Hardware Init
  useEffect(() => {
    const initHardware = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user', 
            width: { ideal: 1280 }, 
            height: { ideal: 720 },
            frameRate: { ideal: 30 } 
          }, 
          audio: { echoCancellation: true, noiseSuppression: true } 
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setHwStatus('ready');
      } catch (err) { 
        setHwStatus('failed');
      }
    };
    initHardware();

    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      Object.values(pcInstances.current).forEach(pc => pc.close());
    };
  }, []);

  // START STREAM LOGIC
  const handleStartStream = async () => {
    if (!streamTitle.trim() || !activeStreamId || !db) return;
    setIsStarting(true);

    try {
        // 1. Create Stream Document
        await setDoc(doc(db, 'streams', activeStreamId), {
            authorId: userData.id,
            authorName: userData.displayName,
            authorAvatar: userData.avatarUrl,
            title: streamTitle,
            viewerCount: 0,
            startedAt: serverTimestamp(),
            status: 'live',
            thumbnailUrl: userData.avatarUrl // Placeholder until actual thumb capture
        });

        // 2. Notify Followers
        const followersRef = collection(db, 'users', userData.id, 'followers');
        const followersSnap = await getDocs(followersRef);
        
        if (!followersSnap.empty) {
            const batch = Firestore.writeBatch(db);
            followersSnap.docs.forEach((followerDoc: any) => {
                const notifRef = doc(collection(db, 'notifications'));
                batch.set(notifRef, {
                    type: 'broadcast',
                    fromUserId: userData.id,
                    fromUserName: userData.displayName,
                    fromUserAvatar: userData.avatarUrl,
                    toUserId: followerDoc.id,
                    targetId: activeStreamId,
                    text: `is broadcasting live: "${streamTitle}"`,
                    isRead: false,
                    timestamp: serverTimestamp(),
                    pulseFrequency: 'velocity'
                });
            });
            await batch.commit();
        }

        setIsLive(true);
        onStart(streamTitle);
    } catch (e) {
        console.error("Stream Start Failed", e);
        window.dispatchEvent(new CustomEvent('vibe-toast', { detail: { msg: "Broadcast Init Failed", type: 'error' } }));
    } finally {
        setIsStarting(false);
    }
  };

  // Live Logic & Recording
  useEffect(() => {
    if (isLive && activeStreamId && db) {
      const timerInt = window.setInterval(() => setTimer(prev => prev + 1), 1000);
      
      // Start Recording
      if (streamRef.current && MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        chunksRef.current = [];
        const recorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm;codecs=vp9' });
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        
        recorder.start(1000); 
        mediaRecorderRef.current = recorder;
      }

      // WebRTC Connection Handling
      const connectionsRef = collection(db, 'streams', activeStreamId, 'connections');
      const unsubConns = onSnapshot(connectionsRef, (snapshot: any) => {
        snapshot.docChanges().forEach(async (change: any) => {
          if (change.type === 'added') {
            const connectionId = change.doc.id;
            const data = change.doc.data();
            if (data.offer && !pcInstances.current[connectionId]) {
              await setupPeer(connectionId, data.offer, activeStreamId);
            }
          }
        });
      });

      // Meta & Chat
      const unsubMeta = onSnapshot(doc(db, 'streams', activeStreamId), (snap: any) => {
        if (snap.exists()) setViewerCount(snap.data().viewerCount || 0);
      });

      const chatQuery = query(collection(db, 'streams', activeStreamId, 'messages'), orderBy('timestamp', 'asc'), limit(50));
      const unsubChat = onSnapshot(chatQuery, (snap: any) => {
        setMessages(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as StreamMessage)));
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      });

      return () => { 
        clearInterval(timerInt);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
        
        // Cleanup Stream Doc
        updateDoc(doc(db, 'streams', activeStreamId), { status: 'ended' }).catch(() => {});
        
        unsubConns(); unsubMeta(); unsubChat();
      };
    }
  }, [isLive, activeStreamId]);

  const setupPeer = async (id: string, offer: any, streamId: string) => {
    if (!streamRef.current) return;
    const pc = new RTCPeerConnection(rtcConfig);
    pcInstances.current[id] = pc;
    streamRef.current.getTracks().forEach(track => pc.addTrack(track, streamRef.current!));
    
    pc.onicecandidate = (e) => {
      if (e.candidate) addDoc(collection(db, 'streams', streamId, 'connections', id, 'hostCandidates'), e.candidate.toJSON());
    };

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await updateDoc(doc(db, 'streams', streamId, 'connections', id), { 
        answer: { type: answer.type, sdp: answer.sdp },
        respondedAt: serverTimestamp()
      });
    } catch (e) { pc.close(); delete pcInstances.current[id]; }
  };

  const handleBroadcastMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeStreamId || !db) return;
    const text = chatInput.trim();
    setChatInput('');
    await addDoc(collection(db, 'streams', activeStreamId, 'messages'), {
      senderId: userData.id,
      senderName: userData.displayName,
      senderAvatar: userData.avatarUrl,
      text,
      timestamp: serverTimestamp()
    });
  };

  const handleArchive = async (shouldArchive: boolean) => {
    if (!shouldArchive) {
      setShowEndDialog(false);
      onEnd();
      return;
    }

    setIsArchiving(true);
    setArchiveProgress('Processing video data...');

    if (activeStreamId && chunksRef.current.length > 0) {
      try {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const file = new File([blob], `broadcast_${activeStreamId}.webm`, { type: 'video/webm' });
        
        setArchiveProgress('Uploading to Neural Cloud...');
        const videoUrl = await uploadToCloudinary(file);
        
        const durationStr = `${Math.floor(timer/60)}:${(timer%60).toString().padStart(2, '0')}`;
        await addDoc(collection(db, 'stories'), {
          authorId: userData.id,
          authorName: userData.displayName,
          authorAvatar: userData.avatarUrl,
          coverUrl: videoUrl,
          timestamp: serverTimestamp(),
          type: 'video',
          isArchivedStream: true,
          streamTitle: streamTitle || 'Untitled Signal',
          streamStats: {
            viewers: viewerCount,
            duration: durationStr
          }
        });
        
        window.dispatchEvent(new CustomEvent('vibe-toast', { detail: { msg: "Stream Archived to Temporal", type: 'success' } }));
      } catch (e) {
        console.error(e);
        window.dispatchEvent(new CustomEvent('vibe-toast', { detail: { msg: "Archive Failed: Upload Error", type: 'error' } }));
      }
    } else {
        window.dispatchEvent(new CustomEvent('vibe-toast', { detail: { msg: "Archive Failed: No Data", type: 'error' } }));
    }
    
    setShowEndDialog(false);
    setIsArchiving(false);
    setArchiveProgress('');
    onEnd(); 
  };

  // Render to Body (Portal)
  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black text-white font-sans overflow-hidden flex flex-col h-[100dvh]">
      
      {/* VIDEO LAYER */}
      <video 
        ref={videoRef} 
        autoPlay playsInline muted 
        className="absolute inset-0 w-full h-full object-cover mirror" 
      />
      
      {/* OVERLAY - GRADIENTS FOR READABILITY */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/70 via-transparent to-black/80" />

      {/* --- PRE-FLIGHT (SETUP) MODE --- */}
      {!isLive && (
        <div className="relative z-10 flex flex-col h-full items-center justify-center p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
           <button onClick={onEnd} className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center transition-all border border-white/10 z-50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} /></svg>
           </button>

           <div className="w-full max-w-md bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-8 shadow-2xl animate-in zoom-in-95 duration-500">
              <div className="text-center mb-8">
                 <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                    {hwStatus === 'ready' ? (
                       <div className="text-emerald-400 animate-pulse"><ICONS.Verified /></div>
                    ) : (
                       <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                 </div>
                 <h2 className="text-2xl font-black uppercase italic tracking-tighter">Broadcast_Prep</h2>
                 <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mt-2">Check Lighting & Audio</p>
              </div>

              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest ml-3 text-slate-300">Signal_Title</label>
                    <input 
                      type="text" 
                      value={streamTitle}
                      onChange={(e) => setStreamTitle(e.target.value)}
                      placeholder="Enter transmission title..."
                      className="w-full bg-white/10 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold placeholder:text-white/30 focus:bg-white/20 outline-none transition-all text-sm"
                    />
                 </div>
                 
                 <button 
                   disabled={!streamTitle.trim() || hwStatus !== 'ready' || isStarting}
                   onClick={handleStartStream}
                   className="w-full py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-rose-500 hover:text-white hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                 >
                   {isStarting ? (
                     <>
                        <div className="w-4 h-4 border-2 border-slate-300 border-t-black rounded-full animate-spin" />
                        INITIALIZING...
                     </>
                   ) : 'GO_LIVE'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* --- LIVE COCKPIT MODE --- */}
      {isLive && (
        <div className="relative z-10 flex flex-col h-full pointer-events-none">
           
           {/* TOP HUD */}
           <div className="flex items-start justify-between p-4 md:p-6 pointer-events-auto pt-[max(1rem,env(safe-area-inset-top))]">
              <div className="flex flex-wrap gap-2">
                 <div className="px-3 py-1.5 bg-rose-600/90 backdrop-blur-md rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg border border-white/10">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                 </div>
                 <div className="px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-lg text-[10px] font-black font-mono border border-white/10">
                    {Math.floor(timer/60)}:{(timer%60).toString().padStart(2, '0')}
                 </div>
                 <div className="px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-lg text-[10px] font-black font-mono border border-white/10 flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-rose-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    {viewerCount}
                 </div>
              </div>

              <div className="flex gap-2">
                 <button onClick={() => setShowChat(!showChat)} className={`p-2.5 rounded-xl border backdrop-blur-md transition-all ${showChat ? 'bg-white text-black border-white' : 'bg-black/40 text-white border-white/10'}`}>
                    <ICONS.Messages />
                 </button>
                 <button 
                   onClick={() => setShowEndDialog(true)} 
                   className="px-5 py-2.5 bg-white/10 hover:bg-rose-600 border border-white/10 backdrop-blur-md rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                 >
                    END_SIGNAL
                 </button>
              </div>
           </div>

           {/* CHAT OVERLAY */}
           <div className="flex-1 flex flex-col justify-end px-4 md:px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] overflow-hidden">
              {showChat && (
                <div className="w-full max-w-sm pointer-events-auto flex flex-col gap-2">
                   {/* Messages Container */}
                   <div className="h-[250px] overflow-y-auto no-scrollbar flex flex-col justify-end space-y-2 pb-2 mask-gradient-b">
                      {messages.map((msg) => (
                        <div key={msg.id} className="flex items-start gap-2 animate-in slide-in-from-left-4 duration-300">
                           <div className="bg-black/40 backdrop-blur-md px-3 py-2 rounded-xl rounded-tl-none border border-white/5 shadow-sm max-w-[90%]">
                              <span className="text-[9px] font-black text-rose-300 uppercase tracking-wide mr-2">{msg.senderName}:</span>
                              <span className="text-xs font-medium text-white/90">{msg.text}</span>
                           </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                   </div>

                   {/* Broadcaster Input */}
                   <form onSubmit={handleBroadcastMessage} className="relative">
                      <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Reply to chat..."
                        className="w-full bg-white/10 border border-white/20 rounded-full px-4 py-2.5 text-xs font-bold text-white placeholder:text-white/40 focus:bg-black/60 outline-none backdrop-blur-md transition-all shadow-lg"
                      />
                      <button type="submit" disabled={!chatInput.trim()} className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-white text-black rounded-full disabled:opacity-0 transition-opacity">
                         <svg className="w-3 h-3 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                      </button>
                   </form>
                </div>
              )}
           </div>
        </div>
      )}

      {/* ARCHIVE CONFIRMATION DIALOG */}
      {showEndDialog && (
        <div className="absolute inset-0 z-[10000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl border border-white/10 text-slate-900 animate-in zoom-in-95 duration-300">
              <div className="text-center mb-6">
                 <div className="w-16 h-16 bg-slate-950 text-white rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 text-2xl shadow-lg">
                    <ICONS.Saved />
                 </div>
                 <h3 className="text-2xl font-black uppercase italic tracking-tighter">Terminate_Signal</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono mt-1">
                   Duration: {Math.floor(timer/60)}:{(timer%60).toString().padStart(2, '0')}
                 </p>
              </div>
              
              <div className="space-y-3">
                 <button 
                   onClick={() => handleArchive(true)}
                   disabled={isArchiving}
                   className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                 >
                   {isArchiving ? archiveProgress : 'Archive_To_Temporal'}
                 </button>
                 <button 
                   onClick={() => handleArchive(false)}
                   disabled={isArchiving}
                   className="w-full py-4 bg-slate-100 text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95 disabled:opacity-50"
                 >
                   Discard_Signal
                 </button>
                 <button 
                   onClick={() => setShowEndDialog(false)}
                   disabled={isArchiving}
                   className="w-full py-3 text-slate-400 font-bold text-[9px] uppercase tracking-widest hover:text-slate-600 transition-all disabled:opacity-50"
                 >
                   Cancel
                 </button>
              </div>
           </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .mirror { transform: scaleX(-1); }
        .mask-gradient-b { 
          -webkit-mask-image: linear-gradient(to top, black 80%, transparent 100%);
          mask-image: linear-gradient(to top, black 80%, transparent 100%);
        }
      `}} />
    </div>,
    document.body
  );
};
