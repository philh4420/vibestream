
import React, { useState } from 'react';
import { db } from '../../services/firebase';
import * as Firestore from 'firestore';
const { doc, setDoc, serverTimestamp } = Firestore as any;
import { ICONS } from '../../constants';
import { GoogleGenAI } from '@google/genai';

interface AdminPushTerminalProps {
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdminPushTerminal: React.FC<AdminPushTerminalProps> = ({ addToast }) => {
  const [text, setText] = useState('');
  const [severity, setSeverity] = useState<'info' | 'warning' | 'critical'>('info');
  const [type, setType] = useState<'persistent' | 'transient'>('transient');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const enhanceSignal = async () => {
    if (!text.trim()) return;
    setIsEnhancing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Rewrite the following social media broadcast to sound extremely futuristic, technical, and cyberpunk. Keep it short (under 100 chars). Input: "${text}"`,
      });
      if (response.text) {
        setText(response.text.replace(/["']/g, '').trim());
        addToast("Signal Refined by Citadel AI", "success");
      }
    } catch (e) {
      addToast("AI Handshake Failed", "error");
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleBroadcast = async () => {
    if (!text.trim() || !db) return;
    setIsBroadcasting(true);
    try {
      await setDoc(doc(db, 'settings', 'global_signal'), {
        text: text.trim(),
        severity,
        type,
        active: true,
        timestamp: serverTimestamp()
      });
      addToast("CITADEL_OVERRIDE_ACTIVE: Signal Broadcasted", "success");
      setText('');
    } catch (e) {
      addToast("Broadcast Interrupted: Unauthorized", "error");
    } finally {
      setIsBroadcasting(false);
    }
  };

  const clearSignal = async () => {
    if (!db) return;
    try {
      await setDoc(doc(db, 'settings', 'global_signal'), { active: false }, { merge: true });
      addToast("Signal Quenched", "info");
    } catch (e) {
      addToast("Purge Error", "error");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-slate-950 rounded-[3rem] p-10 md:p-14 text-white shadow-2xl relative overflow-hidden border border-white/5">
         <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/10 blur-[120px] rounded-full" />
         
         <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-900/50">
                    <ICONS.Admin />
                </div>
                <div>
                   <h2 className="text-3xl font-black uppercase italic tracking-tighter">Citadel_Push</h2>
                   <p className="text-[10px] font-mono text-rose-400 uppercase tracking-widest mt-1">High-Priority Signal Override</p>
                </div>
            </div>

            <div className="space-y-8">
               <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-mono ml-2">Message_Manifest</label>
                  <div className="relative">
                    <textarea 
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Type high-priority system signal..."
                        className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-8 text-xl font-black italic text-white placeholder:text-white/10 focus:bg-white/10 focus:border-rose-500/50 transition-all outline-none resize-none h-48"
                    />
                    <button 
                        onClick={enhanceSignal}
                        disabled={isEnhancing || !text.trim()}
                        className="absolute bottom-4 right-4 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg disabled:opacity-30"
                    >
                        {isEnhancing ? 'SCANNING...' : 'AI_ENHANCE'} <ICONS.Resilience />
                    </button>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-mono ml-2">Severity_Tier</p>
                     <div className="grid grid-cols-3 gap-2">
                        {(['info', 'warning', 'critical'] as const).map(s => (
                           <button 
                             key={s} onClick={() => setSeverity(s)}
                             className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all ${severity === s ? 'bg-white text-slate-900 shadow-xl scale-105' : 'bg-white/5 text-slate-500 border border-white/5'}`}
                           >
                             {s}
                           </button>
                        ))}
                     </div>
                  </div>
                  <div className="space-y-4">
                     <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-mono ml-2">Broadcast_Type</p>
                     <div className="flex gap-2">
                        {(['transient', 'persistent'] as const).map(t => (
                           <button 
                             key={t} onClick={() => setType(t)}
                             className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${type === t ? 'bg-indigo-600 text-white shadow-xl' : 'bg-white/5 text-slate-500 border border-white/5'}`}
                           >
                             {t}
                           </button>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={handleBroadcast}
                    disabled={isBroadcasting || !text.trim()}
                    className="flex-[2] py-5 bg-white text-slate-950 rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:bg-rose-500 hover:text-white transition-all active:scale-95 disabled:opacity-20"
                  >
                    INITIATE_CITADEL_PUSH
                  </button>
                  <button 
                    onClick={clearSignal}
                    className="flex-1 py-5 bg-rose-950/30 text-rose-500 border border-rose-500/20 rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] hover:bg-rose-600 hover:text-white transition-all active:scale-95"
                  >
                    QUENCH_ACTIVE
                  </button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
