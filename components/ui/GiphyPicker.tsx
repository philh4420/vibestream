
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
    <div className="flex flex-col w-[min(95vw,420px)] h-[580px] bg-white/95 backdrop-blur-3xl border border-slate-200/40 rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 z-[2500] font-sans border-precision group/picker">
      
      {/* Search Ingress Node */}
      <div className="p-8 pb-4 shrink-0">
         <div className="relative">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Global GIFs..."
              className="w-full bg-slate-50/50 border border-slate-200/60 rounded-[1.8rem] px-14 py-4.5 text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-300 text-slate-900 shadow-inner"
              autoFocus
            />
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300">
              {isSearching ? (
                <div className="w-4 h-4 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/></svg>
              )}
            </div>
         </div>
      </div>

      {/* High-Bandwidth Grid */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-8 pb-4 scroll-container">
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="aspect-video bg-slate-100/50 animate-pulse rounded-[1.5rem]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {gifs.map(gif => (
              <button 
                key={gif.id}
                onClick={() => onSelect(gif)}
                className="group/gif relative aspect-video rounded-[1.5rem] overflow-hidden bg-slate-50 border border-slate-100/50 transition-all hover:scale-[1.04] active:scale-95 hover:shadow-2xl hover:border-indigo-400/50"
              >
                <img src={gif.images.fixed_height.url} className="w-full h-full object-cover transition-opacity duration-500 group-hover/gif:opacity-90" alt={gif.title} loading="lazy" />
                <div className="absolute inset-0 bg-indigo-600/0 group-hover/gif:bg-indigo-600/5 transition-colors" />
              </button>
            ))}
          </div>
        )}
        
        {!loading && gifs.length === 0 && (
          <div className="py-24 text-center opacity-30">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] font-mono italic">No fragments found in local buffer.</p>
          </div>
        )}
      </div>

      {/* Protocol Status Bar */}
      <div className="px-10 py-6 bg-slate-50/80 border-t border-slate-100 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
           <div className="flex gap-1.5">
             <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
             <div className="w-1.5 h-1.5 bg-indigo-600/30 rounded-full" />
           </div>
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono leading-none">GIPHY_STREAM_ACTIVE</span>
        </div>
        <span className="text-[9px] font-black text-indigo-500/60 uppercase tracking-widest font-mono leading-none">POWERED BY GIPHY</span>
      </div>
    </div>
  );
};
