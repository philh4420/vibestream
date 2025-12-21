import React, { useState, useRef, useEffect } from 'react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_DATA = [
  {
    id: 'smileys',
    label: 'Smileys & Emotion',
    icon: '😊',
    emojis: ['😊', '😂', '🤣', '❤️', '😍', '😒', '😭', '😘', '😩', '😔', '🙄', '🤤', '😎', '🤩', '😏', '🤔', '🤨', '😤', '😱', '🤫', '🫠', '👽', '🤖', '💀', '🤡', '👺', '💩', '🥳', '🥺', '🤯', '🫠', '🫣', '🫡', '🫢', '🫤', '🫥', '🥨', '🫨', '🩷', '🩵', '🩶', '🫎', '🪿', '🪽', '🪻', '🫛', '🫚', '🫨', '🥹', '🫡', '🫣', '🫤', '🫥']
  },
  {
    id: 'people',
    label: 'Identity & Biometrics',
    icon: '👋',
    emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦵', '🦿', '🦶', '👣', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '🫦', '🧟', '🧛', '🧙', '🧚', '🧜', '🧝', '🧞']
  },
  {
    id: 'nature',
    label: 'Biosphere & Atmos',
    icon: '🌿',
    emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞', '🪰', '🪲', '🪳', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🦣', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🐓', '🦃', '🦤', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦫', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔', '🐾', '🐉', '🐲', '🌵', '🎄', '🌲', '🌳', '🌴', '🪵', '🌱', '🌿', '☘️', '🍀', '🎍', '🪴', '🎋', '🍃', '🍂', '🍁', '🍄', '🐚', '🪸', '🌾', '💐', '🌷', '🌹', '🥀', '🌺', '🌸', '🌼', '🌻', '☀️', '🌤️', '🌥️', '☁️', '⛈️', '🌩️', '❄️', '🌈', '🌪️', '🌊']
  },
  {
    id: 'food',
    label: 'Nutrition & Buffer',
    icon: '🍕',
    emojis: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', 'バター', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', 'ブリトー', '🫔', '🥗', '🥘', '🍲', '🥣', '🥗', '🍿', '🧈', '🧂', '🥫', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍠', '🍢', '🍣', '🍤', '🍥', '🥮', '🍡', '🥟', '🥠', '🥡', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯', '🍼', '🥛', '☕️', '🫖', '🍵', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂', '🥃', '🥤', '🧋', '🧃', '🧉', '🧊', '🥢', '🍽️', '🍴', '🥄']
  },
  {
    id: 'activity',
    label: 'Kinetic & Play',
    icon: '⚽',
    emojis: ['⚽️', '🏀', '🏈', '⚾️', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳️', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '⛸', '🎿', '🛷', '🥌', '🏂', '🛼', '🏋️', '🤼', '🤸', '⛹️', '🤺', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖', '🏵', '🎫', '🎟', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🪘', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '♟', '🎯', '🎳', '🎮', '🎰', '🧩']
  },
  {
    id: 'objects',
    label: 'Hardware & Tools',
    icon: '🕶️',
    emojis: ['⌚️', '📱', '📲', '💻', '⌨️', '🖥', '🖨', '🖱', '🖲', '🕹', '🗜', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽', '🎞', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙', '🎚', '🎛', '🧭', '⏱', '⏲', '⏰', '🕰', '⏳', '⌛️', '📡', '🔋', '🔌', '💡', '🔦', '🕯', '🪔', '🧯', '🛢', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🪛', '🔧', '🔨', '⚒', '🛠', '⛏', '🪚', '🔩', '⚙️', '🪝', '🧱', '⛓', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡', '⚔️', '🛡', '🚬', '⚰️', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳', '🩹', '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡', '🧹', '🧺', '🧻', '🚽', '🚰', '🚿', '🛁', '🛀', '🧼', '🪥', '🪒', '🧽', '🪣', '🧴', '🛎', '🔑', '🗝', '🚪', '🪑', '🛋', '🛏', '🛌', '🧸', '🪆', '🖼', '🪞', '🪟', '🛍', '🛒', '🎁', '🎈', '🎏', '🎀', '🪄', '🎊', '🎉', '🎎', '🏮', '🎐', '🧧']
  }
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState(EMOJI_DATA[0].id);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<Record<string, HTMLDivElement | null>>({});

  const handleCategoryClick = (id: string) => {
    const el = categoriesRef.current[id];
    if (el && scrollContainerRef.current) {
      const top = el.offsetTop - scrollContainerRef.current.offsetTop;
      scrollContainerRef.current.scrollTo({ top, behavior: 'smooth' });
      setActiveCategory(id);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      let current = EMOJI_DATA[0].id;
      for (const cat of EMOJI_DATA) {
        const el = categoriesRef.current[cat.id];
        if (el && el.offsetTop - container.offsetTop <= container.scrollTop + 50) {
          current = cat.id;
        }
      }
      setActiveCategory(current);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="flex flex-col w-[min(95vw,340px)] sm:w-[460px] h-[520px] bg-white/95 backdrop-blur-3xl border border-slate-200/60 rounded-[2.5rem] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 z-[2100] border-precision font-sans relative">
      
      {/* 2026 High-Res Header Protocol */}
      <div className="px-8 py-5 flex items-center justify-between shrink-0 bg-white/50 border-b border-slate-100/50">
        <div className="flex flex-col">
          <h4 className="text-[11px] font-black text-slate-950 uppercase tracking-[0.4em] font-mono leading-none">Neural_Glyph_Bank</h4>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse" />
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full opacity-60" />
              <div className="w-1.5 h-1.5 bg-indigo-200 rounded-full opacity-30" />
            </div>
            <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest font-mono">Sync: OK</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-3 bg-white border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all active:scale-90 shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar (Direct Category Jumps) */}
        <nav className="w-16 md:w-20 border-r border-slate-100/50 flex flex-col items-center py-4 gap-3 bg-slate-50/20 overflow-y-auto no-scrollbar shrink-0">
          {EMOJI_DATA.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`w-11 h-11 md:w-14 md:h-14 flex items-center justify-center rounded-2xl transition-all duration-300 text-xl md:text-2xl relative group ${
                activeCategory === cat.id 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 scale-105' 
                  : 'bg-white border border-slate-100 text-slate-400 hover:bg-white hover:text-indigo-600 hover:border-indigo-100 shadow-sm'
              }`}
              title={cat.label}
            >
              {cat.icon}
              {activeCategory === cat.id && (
                <div className="absolute -right-2 w-1 h-6 bg-indigo-600 rounded-l-full" />
              )}
            </button>
          ))}
        </nav>

        {/* Professional Contained Scroll Matrix */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-6 md:p-8 scroll-container bg-white/40 selection:bg-indigo-100"
        >
          <div className="space-y-12">
            {EMOJI_DATA.map((cat) => (
              <div 
                key={cat.id} 
                ref={el => { categoriesRef.current[cat.id] = el; }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4 sticky top-0 bg-white/95 backdrop-blur-sm z-10 py-2">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono leading-none whitespace-nowrap">{cat.label}</span>
                   <div className="flex-1 h-px bg-slate-100" />
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-3">
                  {cat.emojis.map((emoji, i) => (
                    <button
                      key={`${cat.id}-${i}`}
                      onClick={() => {
                        onSelect(emoji);
                        if ('vibrate' in navigator) navigator.vibrate(10);
                        window.dispatchEvent(new CustomEvent('vibe-toast', { 
                          detail: { msg: `Glyph ${emoji} Synchronised`, type: 'success' } 
                        }));
                      }}
                      className="aspect-square flex items-center justify-center text-3xl sm:text-4xl hover:bg-indigo-50 hover:scale-115 rounded-2xl transition-all active:scale-90 touch-manipulation select-none group relative bg-slate-50/40 border border-transparent hover:border-indigo-100 shadow-sm"
                    >
                      <span className="relative z-10">{emoji}</span>
                      <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/* Buffer bottom padding */}
          <div className="h-20" />
        </div>
      </div>

      {/* Synchronisation Footer Buffer - Matching user image exactly */}
      <div className="px-8 py-5 bg-slate-50/80 backdrop-blur-md border-t border-slate-100 flex justify-between items-center shrink-0">
        <div className="flex gap-2.5">
           <div className="w-2 h-2 rounded-full bg-indigo-600/40" />
           <div className="w-2 h-2 rounded-full bg-indigo-600/20" />
           <div className="w-2 h-2 rounded-full bg-indigo-600/10" />
        </div>
        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono italic">PACKET_INTEGRITY: VERIFIED</span>
      </div>
    </div>
  );
};