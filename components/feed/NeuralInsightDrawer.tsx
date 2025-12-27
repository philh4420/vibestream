
import React, { useState, useEffect } from 'react';
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

  return (
    <div className="fixed inset-0 z-[4000] flex justify-end">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-500" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-[#020617]/95 border-l border-cyan-500/20 shadow-[-20px_0_60px_-15px_rgba(6,182,212,0.15)] flex flex-col h-full animate-in slide-in-from-right duration-500">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-500 via-indigo-500 to-purple-500 opacity-60" />
        
        <div className="p-8 md:p-10 flex flex-col h-full">
          <div className="flex justify-between items-start mb-12">
             <div>
                <div className="flex items-center gap-3 mb-2">
                   <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_#22d3ee]" />
                   <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] font-mono">Neural_Scan_Active</span>
                </div>
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Insight_Log</h2>
             </div>
             <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
             </button>
          </div>

          <div className="flex-1 space-y-10">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                 <div className="w-20 h-20 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin shadow-[0_0_20px_rgba(34,211,238,0.2)]" />
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] font-mono animate-pulse">Decrypting_Neural_Patterns...</p>
              </div>
            ) : insight && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                 <section>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono mb-4">Signal_Frequency</p>
                    <div className="px-6 py-4 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-between">
                       <span className="text-xl font-black text-cyan-400 uppercase italic">{insight.vibe}</span>
                       <div className="text-cyan-400 scale-125"><ICONS.Resilience /></div>
                    </div>
                 </section>

                 <section>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono mb-4">Compressed_Manifest</p>
                    <p className="text-lg font-bold text-slate-200 leading-relaxed italic border-l-2 border-slate-800 pl-6">
                       "{insight.summary}"
                    </p>
                 </section>

                 <section>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono mb-4">Neural_Keywords</p>
                    <div className="flex flex-wrap gap-2">
                       {insight.keywords.map(kw => (
                         <span key={kw} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-mono font-bold text-indigo-400">
                           #{kw.toUpperCase()}
                         </span>
                       ))}
                    </div>
                 </section>

                 <section>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono mb-4">Grid_Impact_Projection</p>
                    <div className="flex items-end gap-3 h-12">
                       {['low', 'moderate', 'high', 'critical'].map(lvl => (
                         <div 
                           key={lvl} 
                           className={`flex-1 rounded-t-lg transition-all duration-1000 ${
                             insight.impact === lvl ? 'bg-cyan-500 shadow-[0_0_20px_#06b6d4]' : 'bg-slate-800 opacity-20'
                           }`}
                           style={{ 
                             height: lvl === 'low' ? '30%' : lvl === 'moderate' ? '50%' : lvl === 'high' ? '75%' : '100%' 
                           }}
                         />
                       ))}
                    </div>
                    <div className="flex justify-between mt-3">
                       <span className="text-[8px] font-black text-slate-600 uppercase font-mono">Baseline</span>
                       <span className={`text-[8px] font-black uppercase font-mono ${insight.impact === 'critical' ? 'text-rose-500 animate-pulse' : 'text-slate-600'}`}>Critical_Mass</span>
                    </div>
                 </section>
              </div>
            )}
          </div>

          <div className="mt-auto pt-10 border-t border-white/5 opacity-40">
             <p className="text-[8px] font-mono text-center uppercase tracking-widest">
               VIBE_OS_GEN_3 • LAYER_7_ANALYSIS • HASH: {post.id.slice(0, 12)}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
