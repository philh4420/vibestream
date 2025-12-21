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
    emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞', 'アント', '🪰', '🪲', '🪳', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🦣', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🐓', '🦃', '🦤', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦫', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔', '🐾', '🐉', '🐲', '🌵', '🎄', '🌲', '🌳', '🌴', '🪵', '🌱', '🌿', '☘️', '🍀', '🎍', '🪴', '🎋', '🍃', '🍂', '🍁', '🍄', '🐚', '🪸', '🌾', '💐', '🌷', '🌹', '🥀', '🌺', '🌸', '🌼', '🌻', '☀️', '🌤️', '🌥️', '☁️', '⛈️', '🌩️', '❄️', '🌈', '🌪️', '🌊']
  },
  {
    id: 'food',
    label: 'Nutrition & Buffer',
    icon: '🍕',
    emojis: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', 'ベーコン', 'ステーキ', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', 'サンドイッチ', '🥙', '🧆', 'タコス', 'ブリトー', '🫔', 'サラダ', 'パエリア', '🫕', 'ボウル', '🥗', 'ポップコーン', '🧈', '塩', '缶詰', '弁当', '煎餅', 'おにぎり', 'ご飯', 'カレー', 'ラーメン', 'パスタ', '🍠', 'おでん', '寿司', '天ぷら', 'なると', '月餅', '団子', '餃子', 'フォーチュンクッキー', 'テイクアウト', 'ソフトクリーム', 'かき氷', 'アイス', 'ドーナツ', 'クッキー', 'ケーキ', 'ショートケーキ', 'カップケーキ', 'パイ', 'チョコ', '飴', 'ロリポップ', 'プリン', '蜂蜜', '哺乳瓶', 'ミルク', 'コーヒー', 'ティーポット', 'お茶', '酒', 'シャンパン', 'ワイン', 'カクテル', 'トロピカルドリンク', 'ビール', 'ジョッキ', '乾杯', 'ウィスキー', 'コーラ', 'タピオカ', 'ジュース', 'マテ茶', '氷', '箸', '皿', 'フォーク', 'スプーン']
  },
  {
    id: 'activity',
    label: 'Kinetic & Play',
    icon: '⚽',
    emojis: ['⚽️', '🏀', '🏈', '⚾️', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', 'バドミントン', 'ホッケー', 'フィールドホッケー', 'ラクロス', 'クリケット', 'ブーメラン', 'ゴール', 'ゴルフ', '凧', '弓矢', '釣り', '潜水', 'ボクシング', '柔道', 'スケート', 'スキー', 'ソリ', 'カーリング', 'スノボ', 'ローラースケート', '重量挙げ', 'レスリング', '体操', 'バスケ', 'フェンシング', 'ハンドボール', 'ゴルフ', '乗馬', 'ヨガ', 'サーフィン', '水泳', '水球', 'ボート', '登山', 'マウンテンバイク', 'サイクリング', 'トロフィー', '金メダル', '銀メダル', '銅メダル', 'メダル', '勲章', 'ロゼット', 'チケット', '入場券', '演劇', 'バレエ', '絵画', 'カチンコ', 'マイク', 'ヘッドホン', '楽譜', 'ピアノ', '太鼓', '🪘', 'サックス', 'トランペット', 'ギター', 'バンジョー', 'バイオリン', 'サイコロ', 'チェス', '的', 'ボーリング', 'ゲーム', 'スロット', 'パズル']
  },
  {
    id: 'objects',
    label: 'Hardware & Tools',
    icon: '🕶️',
    emojis: ['腕時計', 'スマホ', '📲', 'パソコン', 'キーボード', 'デスクトップ', 'プリンタ', 'マウス', '🖲️', 'ジョイスティック', '万力', '💽', 'フロッピー', 'CD', 'DVD', 'ビデオ', 'カメラ', '📸', 'ビデオカメラ', '映画', '映写機', 'フィルム', '受話器', '電話', 'ポケベル', 'FAX', 'テレビ', 'ラジオ', 'スタジオマイク', 'スライダー', 'ノブ', 'コンパス', 'ストップウォッチ', 'タイマー', '時計', '置時計', '砂時計', '⌛️', 'パラボラ', '電池', 'プラグ', '電球', '懐中電灯', '蝋燭', 'ランプ', '消火器', 'ドラム缶', 'お札', 'ドル', '円', 'ユーロ', 'ポンド', 'コイン', '袋', 'カード', '宝石', '天秤', '梯子', '工具箱', 'ドライバー', 'レンチ', '金槌', '⚒️', '🛠️', 'つるはし', 'ノコギリ', 'ボルト', '歯車', 'フック', '煉瓦', '鎖', '磁石', 'ピストル', '爆弾', '爆竹', '斧', '包丁', '短剣', '⚔️', '盾', '煙草', '棺桶', '墓石', '骨壷', '壺', '水晶', '数珠', 'ナザール', '理髪店', 'アレンビック', '望遠鏡', '顕微鏡', '穴', '絆創膏', '聴診器', 'カプセル', '注射器', '血液', 'DNA', '微生物', 'シャーレ', '試験管', '温度計', 'ほうき', 'ラバーカップ', '籠', 'ロール', '便器', '水道', 'シャワー', '浴槽', '🛀', '石鹸', '歯ブラシ', '剃刀', 'スポンジ', 'バケツ', 'ローション', '呼び鈴', '鍵', '🗝️', 'ドア', '椅子', 'ソファ', 'ベッド', '🛌', 'クマ', 'マトリョーシカ', '額縁', '鏡', '窓', '買い物袋', 'カート', 'プレゼント', '風船', '鯉のぼり', 'リボン', '魔法の杖', 'くす玉', 'パーティー', '雛人形', '提灯', '風鈴', '🧧']
  },
  {
    id: 'symbols',
    label: 'Protocols & Nodes',
    icon: '♾️',
    emojis: ['💘', '💝', '💖', '💗', '💓', '💞', '💕', '💌', '❣️', '💔', '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '😾', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '🆔', '⚛️', '🉑', '☢️', 'バイオハザード', '📴', '📳', '🈶', '🈚️', '🈸', '🈺', '🈷️', '✴️', 'VS', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', 'A', 'B', 'O', 'SOS', '❌', '⭕️', '🛑', '⛔️', '📛', '🚫', '100', '💢', '温泉', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗️', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '三叉槍', 'フルールドリス', '初心運転者', 'リサイクル', '✅', '🈯️', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'M', '🌀', '💤', 'ATM', '🚾', '車椅子', 'P', '🈳', '🈂️', 'パスポート', '税関', 'バゲージクレーム', '手荷物', '🚹', '🚺', '🚼', 'ジェンダー', 'トイレ', '🚮', '映画', 'アンテナ', 'ここ', '記号', 'i', 'ABC', 'abc', 'ABC', 'NG', 'OK', 'UP', 'COOL', 'NEW', 'FREE', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '123', '#', '*', 'Eject', 'Play', 'Pause', 'Play/Pause', 'Stop', 'Record', 'Next', 'Prev', 'Fast Forward', 'Rewind', 'Up', 'Down', 'Left', 'Up', 'Down', 'Right', 'Left', 'Up', 'Down', 'NE', 'SE', 'SW', 'NW', 'Vertical', 'Horizontal', 'Return', 'Back', 'Top', 'Bottom', 'Soon', 'Wave', 'Loop', 'Infinite', 'Check', 'Box', 'Radio', 'Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple', 'Brown', 'Black', 'White', 'Red Square', 'Orange Square', 'Yellow Square', 'Green Square', 'Blue Square', 'Purple Square', 'Brown Square', 'Black Square', 'White Square', 'Medium Square', 'Small Square', 'Smaller Square', 'Smallest Square', 'Bullet', 'Small Bullet', 'Large Orange', 'Large Blue', 'Small Orange', 'Small Blue', 'Red Triangle', 'Down Triangle', 'Diamond', 'Radio', 'Black Button', 'White Button']
  },
  {
    id: 'flags',
    label: 'Domain Identifiers',
    icon: '🇬🇧',
    emojis: ['🇬🇧', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', '🏴󠁧󠁢󠁷󠁬󠁳󠁿', '🇮🇪', '🇪🇺', '🇺🇸', '🇨🇦', '🇦🇺', '🇳🇿', '🇫🇷', '🇩🇪', '🇮🇹', '🇪🇸', '🇯🇵', '🇰🇷', '🇨🇳', '🇮🇳', '🇧🇷', '🇲🇽', '🇿🇦', '🇦🇪', '🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️']
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

  // Synchronise Active Tab on Scroll
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
    <div className="flex flex-col w-[320px] sm:w-[440px] h-[520px] bg-white border border-slate-200 rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-6 duration-500 z-[2000] border-precision font-sans">
      
      {/* 2026 High-Res Header Protocol */}
      <div className="px-8 py-6 flex items-center justify-between shrink-0 bg-slate-50/50 border-b border-slate-100">
        <div className="flex flex-col">
          <h4 className="text-[11px] font-black text-slate-950 uppercase tracking-[0.4em] font-mono leading-none">Neural_Glyph_Bank</h4>
          <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest font-mono mt-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Locale_Sync: EN_GB_v2.6
          </p>
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
        <nav className="w-16 md:w-20 border-r border-slate-100 flex flex-col items-center py-4 gap-3 bg-slate-50/30 overflow-y-auto no-scrollbar shrink-0">
          {EMOJI_DATA.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`w-11 h-11 md:w-14 md:h-14 flex items-center justify-center rounded-2xl transition-all duration-300 text-xl md:text-2xl relative group ${
                activeCategory === cat.id 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 scale-105' 
                  : 'bg-white border border-slate-100 text-slate-400 hover:bg-slate-50'
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
          className="flex-1 overflow-y-auto p-6 md:p-8 scroll-container bg-white selection:bg-indigo-100"
        >
          <div className="space-y-12">
            {EMOJI_DATA.map((cat) => (
              <div 
                key={cat.id} 
                /* Fix: Explicitly wrapping assignment in braces to ensure the arrow function returns void */
                ref={el => { categoriesRef.current[cat.id] = el; }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4 sticky top-0 bg-white/95 backdrop-blur-sm z-10 py-1">
                   <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] font-mono leading-none whitespace-nowrap">{cat.label}</span>
                   <div className="flex-1 h-px bg-slate-50" />
                </div>
                <div className="grid grid-cols-5 md:grid-cols-6 gap-2 sm:gap-3">
                  {cat.emojis.map((emoji, i) => (
                    <button
                      key={`${cat.id}-${i}`}
                      onClick={() => {
                        onSelect(emoji);
                        if ('vibrate' in navigator) navigator.vibrate(10);
                        // Dispatches global toast via event if picker is integrated in App.tsx
                        window.dispatchEvent(new CustomEvent('vibe-toast', { 
                          detail: { msg: `Glyph ${emoji} Synchronised`, type: 'success' } 
                        }));
                      }}
                      className="aspect-square flex items-center justify-center text-3xl md:text-4xl hover:bg-indigo-50 hover:scale-115 rounded-2xl transition-all active:scale-90 touch-manipulation select-none group relative bg-slate-50/20 border border-transparent hover:border-indigo-100"
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

      {/* Synchronisation Footer Buffer */}
      <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
        <div className="flex gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
           <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 opacity-60" />
           <div className="w-1.5 h-1.5 rounded-full bg-indigo-200 opacity-30" />
        </div>
        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest font-mono italic">Packet_Integrity: VERIFIED</span>
      </div>
    </div>
  );
};