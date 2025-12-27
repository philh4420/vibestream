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
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-500" 
        onClick={onClose} 
      />
      
      {/* Drawer Content */}
      <div className="relative w-full max-w-md bg-[#020617] border-l border-white/5 shadow-[-20px_0_80px_-15px_rgba(0,0,0,0.5)] flex flex-col h-full animate-in slide-in-from-right duration-500 ease-out">
        
        <div className="p-8 md:p-10 flex flex-col h-full overflow-y-auto no-scrollbar">
          {/* Header */}
          <div className="flex justify-between items-start mb-14 shrink-0">
             <div>
                <div className="flex items-center gap-3 mb-3">
                   <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full shadow-[0_0_12px_#22d3ee]" />
                   <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] font-mono">Neural_Scan_Active</span>
                </div>
                <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">Insight_Log</h2>
             </div>
             <button 
               onClick={onClose} 
               className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all border border-white/10 active:scale-90"
             >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
          </div>

          <div className="flex-1 space-y-12">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 text-center space-y-8">
                 <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-4 border-cyan-500/10 rounded-full" />
                    <div className="absolute inset-0 border-4 border-t-cyan-500 rounded-full animate-spin shadow-[0_0_20px_rgba(34,211,238,0.4)]" />
                 </div>
                 <p className="text-[10px] font-black text-cyan-500/60 uppercase tracking-[0.4em] font-mono animate-pulse">Scanning_Frequency...</p>
              </div>
            ) : insight && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
                 {/* Signal Frequency */}
                 <section className="animate-in slide-in-from-right-4 duration-500 delay-100">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono mb-4">Signal_Frequency</p>
                    <div className="px-7 py-6 bg-cyan-950/20 border border-cyan-500/20 rounded-[2rem] flex items-center justify-between group transition-all">
                       <span className="text-3xl font-black text-cyan-400 uppercase italic tracking-tighter">{insight.vibe}</span>
                       <div className="text-cyan-400/60 scale-125"><ICONS.Resilience /></div>
                    </div>
                 </section>

                 {/* Compressed Manifest */}
                 <section className="animate-in slide-in-from-right-4 duration-500 delay-200">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono mb-4">Compressed_Manifest</p>
                    <div className="relative pl-8 border-l-2 border-slate-800">
                       <p className="text-xl md:text-2xl font-black text-slate-100 leading-tight italic">
                          "{insight.summary}"
                       </p>
                    </div>
                 </section>

                 {/* Neural Keywords */}
                 <section className="animate-in slide-in-from-right-4 duration-500 delay-300">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono mb-4">Neural_Keywords</p>
                    <div className="flex flex-wrap gap-2.5">
                       {insight.keywords.map(kw => (
                         <span key={kw} className="px-4 py-2 bg-indigo-500/5 border border-indigo-500/20 rounded-xl text-[10px] font-mono font-black text-indigo-400 hover:text-white transition-all cursor-default">
                           #{kw.toUpperCase()}
                         </span>
                       ))}
                    </div>
                 </section>

                 {/* Grid Impact Projection */}
                 <section className="animate-in slide-in-from-right-4 duration-500 delay-400">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono mb-8">Grid_Impact_Projection</p>
                    <div className="flex items-end gap-3 h-14">
                       {['low', 'moderate', 'high', 'critical'].map(lvl => (
                         <div 
                           key={lvl} 
                           className={`flex-1 rounded-t-xl transition-all duration-1000 relative ${
                             insight.impact === lvl 
                               ? (lvl === 'critical' ? 'bg-rose-500 shadow-[0_0_30px_#f43f5e]' : 'bg-cyan-400 shadow-[0_0_25px_#22d3ee]') 
                               : 'bg-white/5'
                           }`}
                           style={{ 
                             height: lvl === 'low' ? '30%' : lvl === 'moderate' ? '50%' : lvl === 'high' ? '75%' : '100%' 
                           }}
                         >
                           {insight.impact === lvl && (
                             <div className={`absolute inset-0 rounded-t-xl animate-pulse blur-sm ${lvl === 'critical' ? 'bg-rose-500/50' : 'bg-cyan-400/50'}`} />
                           )}
                         </div>
                       ))}
                    </div>
                    <div className="flex justify-between mt-5">
                       <span className="text-[9px] font-black text-slate-600 uppercase font-mono tracking-widest">Baseline</span>
                       <span className={`text-[9px] font-black uppercase font-mono tracking-widest ${insight.impact === 'critical' ? 'text-rose-500 animate-pulse' : 'text-slate-600'}`}>Critical_Mass</span>
                    </div>
                 </section>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-auto pt-10 opacity-30 shrink-0">
             <p className="text-[9px] font-mono text-center uppercase tracking-[0.4em] font-black text-slate-400">
               VIBE_OS_CORE • LAYER_7_ANALYSIS • HASH: {post.id.slice(0, 12).toUpperCase()}
             </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};