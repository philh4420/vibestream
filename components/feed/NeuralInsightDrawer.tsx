import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Post, NeuralInsight } from '../../types';
import { generateNeuralInsight } from '../../services/ai';
import { ICONS } from '../../constants';

interface NeuralInsightDrawerProps {
  post: Post;
  onClose: () => void;
}

export const NeuralInsightDrawer: React.FC<NeuralInsightDrawerProps> = ({ post, onClose }) => {
  const [insight, setInsight] = useState<NeuralInsight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsight = async () => {
      setLoading(true);
      const result = await generateNeuralInsight(post.content);
      setInsight(result);
      setLoading(false);
    };
    fetchInsight();
  }, [post.id]);

  return createPortal(
    <div className="fixed inset-0 z-[8000] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-500" 
        onClick={onClose} 
      />
      
      {/* Drawer Content */}
      <div className="relative w-full max-w-md bg-[#020617] border-l border-cyan-500/20 shadow-[-20px_0_80px_-15px_rgba(6,182,212,0.3)] flex flex-col h-full animate-in slide-in-from-right duration-500 ease-out">
        {/* Kinetic Accent Line */}
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-500 via-indigo-500 to-purple-500 opacity-80" />
        
        <div className="p-8 md:p-10 flex flex-col h-full overflow-y-auto no-scrollbar">
          <div className="flex justify-between items-start mb-12 shrink-0">
             <div>
                <div className="flex items-center gap-3 mb-2">
                   <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_15px_#22d3ee]" />
                   <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] font-mono">Neural_Scan_Active</span>
                </div>
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Insight_Log</h2>
             </div>
             <button 
               onClick={onClose} 
               className="p-3 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-white rounded-2xl transition-all border border-white/10 active:scale-90"
             >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
          </div>

          <div className="flex-1 space-y-10">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 text-center space-y-8">
                 <div className="relative w-24 h-24">
                    <div className="absolute inset-0 border-4 border-cyan-500/10 rounded-full" />
                    <div className="absolute inset-0 border-4 border-t-cyan-500 rounded-full animate-spin shadow-[0_0_20px_rgba(34,211,238,0.4)]" />
                 </div>
                 <p className="text-[11px] font-black text-cyan-500/60 uppercase tracking-[0.5em] font-mono animate-pulse">Decrypting_Neural_Patterns...</p>
              </div>
            ) : insight && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
                 <section className="animate-in slide-in-from-right-4 duration-500 delay-100">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono mb-4">Signal_Frequency</p>
                    <div className="px-6 py-5 bg-cyan-500/10 border border-cyan-500/20 rounded-3xl flex items-center justify-between group hover:bg-cyan-500/20 transition-all">
                       <span className="text-2xl font-black text-cyan-400 uppercase italic tracking-tight">{insight.vibe}</span>
                       <div className="text-cyan-400 scale-150 animate-pulse"><ICONS.Resilience /></div>
                    </div>
                 </section>

                 <section className="animate-in slide-in-from-right-4 duration-500 delay-200">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono mb-4">Compressed_Manifest</p>
                    <div className="relative">
                       <div className="absolute top-0 left-0 w-1 h-full bg-slate-800 rounded-full" />
                       <p className="text-lg md:text-xl font-bold text-slate-100 leading-relaxed italic pl-8">
                          "{insight.summary}"
                       </p>
                    </div>
                 </section>

                 <section className="animate-in slide-in-from-right-4 duration-500 delay-300">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono mb-4">Neural_Keywords</p>
                    <div className="flex flex-wrap gap-2.5">
                       {insight.keywords.map(kw => (
                         <span key={kw} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[11px] font-mono font-bold text-indigo-400 hover:text-white hover:border-indigo-500/50 transition-all cursor-default">
                           #{kw.toUpperCase()}
                         </span>
                       ))}
                    </div>
                 </section>

                 <section className="animate-in slide-in-from-right-4 duration-500 delay-400">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono mb-6">Grid_Impact_Projection</p>
                    <div className="flex items-end gap-3.5 h-16">
                       {['low', 'moderate', 'high', 'critical'].map(lvl => (
                         <div 
                           key={lvl} 
                           className={`flex-1 rounded-t-xl transition-all duration-1000 ${
                             insight.impact === lvl 
                               ? (lvl === 'critical' ? 'bg-rose-500 shadow-[0_0_30px_#f43f5e]' : 'bg-cyan-500 shadow-[0_0_20px_#06b6d4]') 
                               : 'bg-slate-800 opacity-20'
                           }`}
                           style={{ 
                             height: lvl === 'low' ? '30%' : lvl === 'moderate' ? '50%' : lvl === 'high' ? '75%' : '100%' 
                           }}
                         />
                       ))}
                    </div>
                    <div className="flex justify-between mt-4">
                       <span className="text-[9px] font-black text-slate-600 uppercase font-mono tracking-widest">Baseline</span>
                       <span className={`text-[9px] font-black uppercase font-mono tracking-widest ${insight.impact === 'critical' ? 'text-rose-500 animate-pulse' : 'text-slate-600'}`}>Critical_Mass</span>
                    </div>
                 </section>
              </div>
            )}
          </div>

          <div className="mt-auto pt-10 border-t border-white/5 opacity-40 shrink-0">
             <p className="text-[9px] font-mono text-center uppercase tracking-[0.3em] font-bold">
               VIBE_OS_CORE • LAYER_7_ANALYSIS • HASH: {post.id.slice(0, 12).toUpperCase()}
             </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};