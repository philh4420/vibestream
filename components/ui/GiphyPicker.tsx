
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
    <div className="flex flex-col w-full h-[620px] bg-white/90 backdrop-blur-3xl border border-white/40 rounded-[3rem] shadow-[0_60px_120px_-30px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 duration-500 z-[3000] border-precision">
      
      {/* Universal Search Interface */}
      <div className="p-8 pb-4">
        <div className="relative group">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Global Signals..."
            className="w-full bg-slate-100/50 border border-slate-200/50 rounded-2xl px-14 py-4.5 text-sm font-black focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all outline-none placeholder:text-slate-300 shadow-inner"
            autoFocus
          />
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
            {isSearching ? (
              <div className="w-5 h-5 border-2 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/></svg>
            )}
          </div>
          <button 
            onClick={onClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-200 rounded-xl transition-all opacity-40 hover:opacity-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      {/* Resonance Category Hub */}
      <div className="px-8 pb-6 overflow-x-auto no-scrollbar flex gap-2 shrink-0">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => handleCategoryClick(cat)}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${activeCategory === cat ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Masonry-Style Signal Grid */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-8 pb-8 scroll-container">
        {loading ? (
          <div className="columns-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="mb-4 break-inside-avoid bg-slate-100 animate-pulse rounded-2xl" style={{ height: `${120 + Math.random() * 100}px` }} />
            ))}
          </div>
        ) : (
          <div className="columns-2 gap-4">
            {gifs.map(gif => (
              <button 
                key={gif.id}
                onClick={() => onSelect(gif)}
                className="group relative w-full mb-4 break-inside-avoid rounded-2xl overflow-hidden bg-slate-50 border border-slate-100/50 transition-all hover:scale-[1.03] active:scale-95 hover:shadow-2xl"
              >
                <img src={gif.images.fixed_height.url} className="w-full h-auto object-cover" alt={gif.title} loading="lazy" />
                <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-colors" />
                <div className="absolute bottom-2 left-2 right-2 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[7px] font-black text-white uppercase tracking-widest truncate">{gif.title || 'Artifact'}</p>
                </div>
              </button>
            ))}
          </div>
        )}
        
        {!loading && gifs.length === 0 && (
          <div className="py-24 text-center opacity-30">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" strokeWidth={3}/></svg>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] font-mono italic px-10">Neural buffer cleared. No visual fragments detected.</p>
          </div>
        )}
      </div>

      {/* Protocol Telemetry */}
      <div className="px-10 py-5 bg-slate-50/80 border-t border-slate-100 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono">ENCRYPTED_UPLINK_STABLE</span>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest font-mono">POWERED BY GIPHY</span>
        </div>
      </div>
    </div>
  );
};
