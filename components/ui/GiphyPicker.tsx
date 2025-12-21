
import React, { useState, useEffect, useRef } from 'react';
import { fetchTrendingGifs, searchGifs, GiphyGif } from '../../services/giphy';

interface GiphyPickerProps {
  onSelect: (gif: GiphyGif) => void;
  onClose: () => void;
}

export const GiphyPicker: React.FC<GiphyPickerProps> = ({ onSelect, onClose }) => {
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState<GiphyGif[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const loadTrending = async () => {
      try {
        const data = await fetchTrendingGifs();
        setGifs(data);
      } catch (e) {
        console.error("Giphy Sync Failed");
      } finally {
        setLoading(false);
      }
    };
    loadTrending();
  }, []);

  useEffect(() => {
    if (!query.trim()) return;
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await searchGifs(query);
        setGifs(data);
      } catch (e) {
        console.error("Giphy Search Failed");
      } finally {
        setIsSearching(false);
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="flex flex-col w-[min(95vw,360px)] sm:w-[480px] h-[550px] bg-white/95 backdrop-blur-3xl border border-slate-200/60 rounded-[2.5rem] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 z-[2100] font-sans border-precision">
      
      {/* 2026 System Header */}
      <div className="px-8 py-6 bg-white/50 border-b border-slate-100/50 flex items-center justify-between shrink-0">
        <div className="flex flex-col">
          <h4 className="text-[11px] font-black text-slate-950 uppercase tracking-[0.4em] font-mono leading-none">Visual_Giphy_Sync</h4>
          <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest font-mono mt-2 flex items-center gap-2">
            <span className="w-1 h-1 bg-indigo-600 rounded-full animate-pulse" /> GRID_NOMINAL
          </p>
        </div>
        <button 
          onClick={onClose}
          className="p-3 bg-white border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all active:scale-90 shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Search Ingress */}
      <div className="p-6 bg-slate-50/50 border-b border-slate-100">
         <div className="relative">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Global GIFs..."
              className="w-full bg-white border border-slate-200 rounded-[1.4rem] px-12 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-300 shadow-inner"
              autoFocus
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
              {isSearching ? (
                <div className="w-4 h-4 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" strokeWidth="2.5" /></svg>
              )}
            </div>
         </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 scroll-container bg-white/40">
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="aspect-video bg-slate-100 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {gifs.map(gif => (
              <button 
                key={gif.id}
                onClick={() => onSelect(gif)}
                className="group relative aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 transition-all hover:scale-[1.03] active:scale-95 hover:shadow-xl hover:border-indigo-200"
              >
                <img src={gif.images.fixed_height.url} className="w-full h-full object-cover" alt={gif.title} loading="lazy" />
                <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-colors" />
              </button>
            ))}
          </div>
        )}
        
        {!loading && gifs.length === 0 && (
          <div className="py-20 text-center opacity-30">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] font-mono italic">No fragments found in local buffer.</p>
          </div>
        )}
      </div>

      {/* Status Footer */}
      <div className="px-8 py-5 bg-slate-50/80 backdrop-blur-md border-t border-slate-100 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
           <div className="flex gap-1.5">
             <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse" />
             <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full opacity-40" />
           </div>
           <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono">GIPHY_STREAM_ACTIVE</span>
        </div>
        <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest font-mono">POWERED BY GIPHY</span>
      </div>
    </div>
  );
};
