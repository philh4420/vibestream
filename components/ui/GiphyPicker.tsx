
import React, { useState, useEffect } from 'react';
import { fetchTrendingGifs, searchGifs, GiphyGif } from '../../services/giphy';

interface GiphyPickerProps {
  onSelect: (gif: GiphyGif) => void;
  onClose: () => void;
}

const CATEGORIES = ['Trending', 'Reactions', 'Memes', 'Gaming', 'Anime', 'Music', 'Sports'];

export const GiphyPicker: React.FC<GiphyPickerProps> = ({ onSelect, onClose }) => {
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState<GiphyGif[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Trending');

  const loadData = async (searchTerm?: string) => {
    setLoading(true);
    try {
      const data = searchTerm ? await searchGifs(searchTerm) : await fetchTrendingGifs();
      setGifs(data);
    } catch (e) {
      console.error("Giphy Sync Failure");
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);
    setQuery('');
    if (cat === 'Trending') {
      loadData();
    } else {
      loadData(cat);
    }
  };

  useEffect(() => {
    if (!query.trim()) return;
    const delayDebounceFn = setTimeout(() => {
      setIsSearching(true);
      loadData(query);
    }, 600);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="flex flex-col w-full max-w-lg h-[620px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border border-slate-200 dark:border-white/10 rounded-[3.5rem] shadow-[0_60px_150px_-30px_rgba(0,0,0,0.15)] dark:shadow-[0_60px_150px_-30px_rgba(0,0,0,0.6)] overflow-hidden animate-in zoom-in-95 duration-500 z-[3000]">
      
      {/* Search Ingress Node */}
      <div className="p-8 pb-4 relative">
        <div className="relative group">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Global Signals..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.8rem] px-14 py-5 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:bg-white dark:focus:bg-slate-800 transition-all outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-inner italic"
            autoFocus
          />
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors">
            {isSearching ? (
              <div className="w-5 h-5 border-2 border-indigo-100 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin" />
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/></svg>
            )}
          </div>
        </div>
      </div>

      {/* Resonance Category Hub */}
      <div className="px-8 pb-6 overflow-x-auto no-scrollbar flex gap-3 shrink-0">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => handleCategoryClick(cat)}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border italic ${
              activeCategory === cat 
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg scale-105' 
                : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 hover:text-indigo-600 dark:hover:text-indigo-400'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Masonry Signal Grid */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-8 pb-8 scroll-container">
        {loading ? (
          <div className="columns-2 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="mb-5 break-inside-avoid bg-slate-100 dark:bg-slate-800 animate-pulse rounded-[2rem] border border-slate-200 dark:border-slate-700" style={{ height: `${140 + Math.random() * 120}px` }} />
            ))}
          </div>
        ) : (
          <div className="columns-2 gap-5">
            {gifs.map(gif => (
              <button 
                key={gif.id}
                onClick={() => onSelect(gif)}
                className="group relative w-full mb-5 break-inside-avoid rounded-[2rem] overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all hover:scale-[1.04] active:scale-95 hover:shadow-2xl hover:border-indigo-400/30"
              >
                <img src={gif.images.fixed_height.url} className="w-full h-auto object-cover transition-opacity duration-700 group-hover:opacity-90" alt={gif.title} loading="lazy" />
                <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 transition-colors" />
                <div className="absolute bottom-3 left-3 right-3 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                  <p className="text-[8px] font-black text-white uppercase tracking-widest truncate italic">{gif.title || 'Fragment'}</p>
                </div>
              </button>
            ))}
          </div>
        )}
        
        {!loading && gifs.length === 0 && (
          <div className="py-24 text-center opacity-30 flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-400 dark:text-slate-600"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" strokeWidth={3}/></svg></div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] font-mono italic px-10 text-slate-500 dark:text-slate-400">Neural buffer cleared. No fragments detected.</p>
          </div>
        )}
      </div>

      {/* Protocol Telemetry Footer */}
      <div className="px-10 py-6 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex gap-1">
             <div className="w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
             <div className="w-1.5 h-1.5 bg-indigo-400 dark:bg-indigo-700 rounded-full opacity-50" />
          </div>
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] font-mono leading-none">GRID_UPLINK: ACTIVE</span>
        </div>
        <button 
          onClick={onClose}
          className="text-[9px] font-black text-rose-500 uppercase tracking-widest font-mono hover:text-rose-600 transition-colors"
        >
          Close_Buffer
        </button>
      </div>
    </div>
  );
};
