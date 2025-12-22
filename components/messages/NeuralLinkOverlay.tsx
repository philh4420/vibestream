import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { CallSession, User } from '../../types';

interface NeuralLinkOverlayProps {
  session: CallSession;
  userData: User;
  onEnd: () => void;
}

export const NeuralLinkOverlay: React.FC<NeuralLinkOverlayProps> = ({ session, userData, onEnd }) => {
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(session.type === 'voice');
  const [callStatus, setCallStatus] = useState(session.status);

  useEffect(() => {
    let timer: number;
    if (callStatus === 'connected') {
      timer = window.setInterval(() => setDuration(prev => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [callStatus]);

  const handleAccept = async () => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'calls', session.id), {
        status: 'connected',
        connectedAt: serverTimestamp()
      });
      setCallStatus('connected');
    } catch (e) { onEnd(); }
  };

  const handleDecline = async () => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'calls', session.id), { status: 'rejected' });
    } finally { onEnd(); }
  };

  const handleTerminate = async () => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'calls', session.id), { status: 'ended' });
    } finally { onEnd(); }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isIncoming = session.receiverId === userData.id && callStatus === 'ringing';

  return (
    <div className="fixed inset-0 z-[3500] bg-slate-950 flex flex-col items-center justify-center p-6 selection:bg-indigo-500 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay" />
      </div>

      <div className="relative z-10 w-full max-w-4xl h-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-700">
        <div className="relative w-full aspect-video rounded-[4rem] bg-white/5 border border-white/10 overflow-hidden shadow-2xl mb-12 flex items-center justify-center">
           {!isVideoOff ? (
             <div className="w-full h-full bg-slate-900 animate-pulse flex flex-col items-center justify-center gap-6">
                <img src={isIncoming ? session.callerAvatar : session.callerAvatar} className="w-40 h-40 rounded-[3rem] object-cover border-4 border-indigo-500/30 shadow-2xl" alt="" />
                <div className="text-center">
                  <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">{isIncoming ? session.callerName : "SYNCHRONISING..."}</h2>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.6em] font-mono">NEURAL_OPTICS_LAYER_INIT</p>
                </div>
             </div>
           ) : (
             <div className="flex flex-col items-center gap-10">
               <div className="relative">
                 <div className="absolute inset-0 bg-indigo-600/20 blur-3xl animate-pulse" />
                 <img src={session.callerAvatar} className="relative w-56 h-56 rounded-full object-cover border-8 border-white/5 shadow-2xl" alt="" />
               </div>
               <div className="text-center">
                 <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase mb-4">{session.callerName}</h2>
                 <p className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.8em] font-mono animate-pulse">
                   {callStatus === 'ringing' ? 'INCOMING_SIGNAL...' : formatTime(duration)}
                 </p>
               </div>
             </div>
           )}
           <div className="absolute bottom-8 right-8 w-32 md:w-48 aspect-[4/3] rounded-3xl bg-slate-950/80 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden hidden sm:block">
              <img src={userData.avatarUrl} className="w-full h-full object-cover opacity-60" alt="" />
              <div className="absolute top-3 left-3 flex gap-1">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                 <span className="text-[7px] font-black text-white/40 uppercase font-mono">LOCAL</span>
              </div>
           </div>
        </div>

        <div className="flex items-center gap-8 md:gap-14 bg-white/5 backdrop-blur-3xl border border-white/10 p-8 rounded-[3rem] shadow-2xl">
           {isIncoming ? (
             <>
               <button onClick={handleDecline} className="w-20 h-20 md:w-24 md:h-24 bg-rose-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-rose-900/40 hover:bg-rose-500 transition-all active:scale-90"><svg className="w-8 h-8 md:w-10 md:h-10 rotate-[135deg]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg></button>
               <button onClick={handleAccept} className="w-24 h-24 md:w-32 md:h-32 bg-emerald-600 text-white rounded-[2.5rem] flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.4)] hover:bg-emerald-500 transition-all active:scale-95 animate-bounce"><svg className="w-10 h-10 md:w-14 md:h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg></button>
             </>
           ) : (
             <>
               <button onClick={() => setIsMuted(!isMuted)} className={`w-16 h-16 md:w-20 md:h-20 rounded-3xl flex items-center justify-center transition-all active:scale-90 border-2 ${isMuted ? 'bg-white text-slate-950 border-white' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}><svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg></button>
               <button onClick={handleTerminate} className="w-20 h-20 md:w-28 md:h-28 bg-rose-600 text-white rounded-[2.2rem] flex items-center justify-center shadow-2xl hover:bg-rose-500 transition-all active:scale-95 group"><svg className="w-8 h-8 md:w-12 md:h-12 rotate-[135deg] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3.5"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg></button>
               <button onClick={() => setIsVideoOff(!isVideoOff)} className={`w-16 h-16 md:w-20 md:h-20 rounded-3xl flex items-center justify-center transition-all active:scale-90 border-2 ${isVideoOff ? 'bg-white text-slate-950 border-white' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}><svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg></button>
             </>
           )}
        </div>
        <div className="mt-12 text-center opacity-30">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] font-mono italic">VIBESTREAM_SECURE_LINK_ENCRYPTED</p>
        </div>
      </div>
    </div>
  );
};