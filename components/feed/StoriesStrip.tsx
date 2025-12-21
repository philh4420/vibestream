
import React from 'react';
import { User } from '../../types';

interface StoriesStripProps {
  userData: User | null;
}

export const StoriesStrip: React.FC<StoriesStripProps> = ({ userData }) => {
  // Mocking active fragments for UI structure (2026 style)
  const fragments = [
    { id: '1', name: 'Alex', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', cover: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80', active: true },
    { id: '2', name: 'Sarah', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', cover: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80', active: false },
    { id: '3', name: 'Jordan', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan', cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80', active: true },
    { id: '4', name: 'Mika', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mika', cover: 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?q=80', active: false },
    { id: '5', name: 'Leo', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo', cover: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80', active: false },
  ];

  return (
    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
      {/* Self Story Trigger */}
      <button className="flex-shrink-0 w-32 h-44 md:w-40 md:h-56 rounded-[2rem] bg-white border border-slate-100 overflow-hidden relative group shadow-sm transition-all hover:shadow-xl hover:border-indigo-100 touch-active">
        <img src={userData?.avatarUrl} className="w-full h-2/3 object-cover opacity-80 group-hover:scale-110 transition-transform duration-700" alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
        <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center">
          <div className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center mb-2 shadow-lg ring-4 ring-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4.5v15m7.5-7.5h-15" strokeWidth="2.5" strokeLinecap="round" /></svg>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-900 font-mono">Capture</span>
        </div>
      </button>

      {/* Peer Fragments */}
      {fragments.map(fragment => (
        <button key={fragment.id} className="flex-shrink-0 w-32 h-44 md:w-40 md:h-56 rounded-[2rem] bg-slate-900 overflow-hidden relative group shadow-sm transition-all hover:shadow-2xl active:scale-95 touch-active">
          <img src={fragment.cover} className="w-full h-full object-cover opacity-60 transition-transform duration-[3s] group-hover:scale-125" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          
          <div className="absolute top-4 left-4">
            <div className={`p-0.5 rounded-xl border-2 ${fragment.active ? 'border-indigo-500 animate-pulse' : 'border-white/40'}`}>
              <img src={fragment.avatar} className="w-8 h-8 rounded-lg object-cover" alt="" />
            </div>
          </div>
          
          <div className="absolute bottom-4 left-4 right-4">
             <p className="text-white text-[10px] font-black uppercase tracking-widest truncate">{fragment.name}</p>
             {fragment.active && (
               <div className="flex items-center gap-1 mt-1">
                 <div className="w-1 h-1 bg-indigo-400 rounded-full" />
                 <span className="text-[7px] font-black text-indigo-400 uppercase tracking-widest font-mono">Transmitting</span>
               </div>
             )}
          </div>
        </button>
      ))}
    </div>
  );
};
