import React, { useState } from 'react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_DATA = [
  {
    category: 'NEURAL_FACES',
    emojis: ['😊', '😎', '🤩', '😏', '🤔', '🤨', '🙄', '😤', '😱', '🤫', '🫠', '👽', '🤖', '💀', '🤡', '👺']
  },
  {
    category: 'PULSE_HEARTS',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖']
  },
  {
    category: 'GRID_MOTIONS',
    emojis: ['🔥', '✨', '⚡', '🚀', '🌈', '🛸', '🛰️', '📡', '🔋', '💻', '🧠', '💡', '🛡️', '🎯', '⌛', '💎']
  },
  {
    category: 'VIBE_SYMBOLS',
    emojis: ['✅', '❌', '⚠️', '🔔', '➕', '➖', '♾️', '💠', '🌀', '🌊', '☀️', '🌙', '⭐', '📍', '💬', '📢']
  }
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <div className="flex flex-col w-72 sm:w-80 h-96 bg-white/90 backdrop-blur-3xl border border-slate-200 rounded-[2.5rem] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 z-[1000]">
      <div className="px-6 pt-6 pb-4 border-b border-slate-50 flex items-center justify-between shrink-0">
        <div>
          <h4 className="text-[10px] font-black text-slate-950 uppercase tracking-[0.3em] font-mono leading-none">Neural_Glyphs</h4>
          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest font-mono mt-1 italic">Layer: UTF-8.V26</p>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-slate-100 rounded-xl transition-all active:scale-90"
        >
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-5">
        <div className="space-y-6">
          {EMOJI_DATA.map((cat, idx) => (
            <div key={cat.category} id={`cat-${idx}`} className="space-y-3">
              <h5 className="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em] font-mono ml-1">{cat.category}</h5>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {cat.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onSelect(emoji);
                      // Vibrate for haptic if supported
                      if ('vibrate' in navigator) navigator.vibrate(5);
                    }}
                    className="aspect-square flex items-center justify-center text-2xl hover:bg-indigo-50 hover:scale-125 rounded-2xl transition-all active:scale-90 touch-none select-none"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
        <div className="flex gap-1">
          {EMOJI_DATA.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                const el = document.getElementById(`cat-${idx}`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setActiveCategory(idx);
              }}
              className={`w-2 h-2 rounded-full transition-all ${activeCategory === idx ? 'bg-indigo-600 w-6' : 'bg-slate-200'}`}
            />
          ))}
        </div>
        <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest font-mono">End_Of_Bank</span>
      </div>
    </div>
  );
};