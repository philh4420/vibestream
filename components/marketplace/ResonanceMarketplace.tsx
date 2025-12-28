
import React, { useState } from 'react';
import { User } from '../../types';
import { ICONS } from '../../constants';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { doc, updateDoc, increment, arrayUnion } = Firestore as any;

interface ResonanceMarketplaceProps {
  userData: User;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

interface CosmeticItem {
  id: string;
  type: 'border' | 'trail' | 'filter';
  name: string;
  description: string;
  price: number;
  previewClass: string; 
  icon: any;
}

const COSMETICS: CosmeticItem[] = [
  { id: 'border_neon', type: 'border', name: 'Neon Pulse', description: 'Rotating cybernetic frame.', price: 500, previewClass: 'cosmetic-border-border_neon', icon: ICONS.Profile },
  { id: 'border_gold', type: 'border', name: 'Midas Touch', description: 'Pulsing golden halo.', price: 1200, previewClass: 'cosmetic-border-border_gold', icon: ICONS.Verified },
  { id: 'border_glitch', type: 'border', name: 'System Error', description: 'Unstable chromatic aberration.', price: 800, previewClass: 'cosmetic-border-border_glitch', icon: ICONS.Create },
  
  { id: 'trail_cyber', type: 'trail', name: 'Cyber Dust', description: 'Cyan particle wake.', price: 1500, previewClass: 'trail-trail_cyber', icon: ICONS.Streams },
  { id: 'trail_matrix', type: 'trail', name: 'Source Code', description: 'Green digital rain.', price: 2000, previewClass: 'trail-trail_matrix', icon: ICONS.Admin },
  { id: 'trail_fire', type: 'trail', name: 'Inferno', description: 'Blazing ember trail.', price: 1800, previewClass: 'trail-trail_fire', icon: ICONS.Resilience },

  { id: 'filter_crt', type: 'filter', name: 'CRT Monitor', description: 'Scanlines and phosphor glow.', price: 2500, previewClass: 'filter-filter_crt', icon: ICONS.Temporal },
  { id: 'filter_vapor', type: 'filter', name: 'Vaporwave', description: 'Pink/Cyan aesthetic shift.', price: 2200, previewClass: 'filter-filter_vapor', icon: ICONS.Explore },
  { id: 'filter_noir', type: 'filter', name: 'Noir Detective', description: 'High contrast monochrome.', price: 1000, previewClass: 'filter-filter_noir', icon: ICONS.Search },
];

export const ResonanceMarketplace: React.FC<ResonanceMarketplaceProps> = ({ userData, addToast }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'border' | 'trail' | 'filter'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const currentPoints = userData.resonance ?? 0; 
  const unlockedItems = userData.cosmetics?.unlockedItems || [];
  const activeBorder = userData.cosmetics?.activeBorder;
  const activeTrail = userData.cosmetics?.activeTrail;
  const activeFilter = userData.cosmetics?.activeFilter;

  const handlePurchase = async (item: CosmeticItem) => {
    if (!db || !userData.id || processingId) return;
    const isAdmin = userData.role === 'admin';
    if (!isAdmin && currentPoints < item.price) {
      addToast("Insufficient Resonance Points", "error");
      return;
    }
    setProcessingId(item.id);
    try {
      const updatePayload: any = { 'cosmetics.unlockedItems': arrayUnion(item.id) };
      if (!isAdmin) updatePayload.resonance = increment(-item.price);
      await updateDoc(doc(db, 'users', userData.id), updatePayload);
      addToast(isAdmin ? `System Override: ${item.name} Unlocked` : `Acquired: ${item.name}`, "success");
      if (window.navigator?.vibrate) window.navigator.vibrate(50);
    } catch (e) {
      addToast("Transaction Failed", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleEquip = async (item: CosmeticItem) => {
    if (!db || !userData.id || processingId) return;
    setProcessingId(item.id);
    const fieldMap = { 'border': 'cosmetics.activeBorder', 'trail': 'cosmetics.activeTrail', 'filter': 'cosmetics.activeFilter' };
    try {
      const isEquipped = (item.type === 'border' && activeBorder === item.id) ||
                         (item.type === 'trail' && activeTrail === item.id) ||
                         (item.type === 'filter' && activeFilter === item.id);
      await updateDoc(doc(db, 'users', userData.id), { [fieldMap[item.type]]: isEquipped ? null : item.id });
      addToast(isEquipped ? `Unequipped ${item.name}` : `Equipped ${item.name}`, "info");
    } catch (e) {
      addToast("Equip Failed", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredItems = activeTab === 'all' ? COSMETICS : COSMETICS.filter(c => c.type === activeTab);

  return (
    <div className="w-full max-w-[2400px] mx-auto pb-32 animate-in fade-in duration-700 px-4 md:px-8 space-y-8">
      <div className="relative rounded-[3.5rem] bg-slate-950 p-10 md:p-14 text-white shadow-2xl border border-white/10 overflow-hidden group">
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-600/20 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/3" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
            <div className="space-y-4 max-w-xl">
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                  <ICONS.Marketplace />
                  <span className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.3em] font-mono">Cyber_Bazaar_v1.0</span>
               </div>
               <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none text-white">Resonance<br/><span className="text-cyan-500">Market</span></h1>
               <p className="text-xs md:text-sm font-medium text-slate-400 leading-relaxed max-w-sm">Exchange earned Resonance for exclusive neural cosmetics. Customize your digital signature.</p>
            </div>
            <div className="flex items-center gap-6">
                <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono mb-1">Current Balance</p>
                    <p className="text-4xl font-black text-cyan-400 font-mono tracking-tighter">{currentPoints.toLocaleString()}</p>
                </div>
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 backdrop-blur-md">
                    <div className="w-8 h-8 bg-cyan-500 rounded-full shadow-[0_0_15px_#06b6d4] animate-pulse" />
                </div>
            </div>
         </div>
      </div>

      <div className="flex overflow-x-auto no-scrollbar bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[2rem] w-full md:w-fit mx-auto border border-slate-200 dark:border-slate-700">
         {(['all', 'border', 'trail', 'filter'] as const).map(tab => (
           <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-3 rounded-[1.6rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{tab === 'all' ? 'Inventory' : `${tab}s`}</button>
         ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-[400px]">
         {filteredItems.map((item, idx) => {
            const isUnlocked = unlockedItems.includes(item.id);
            const isEquipped = (item.type === 'border' && activeBorder === item.id) ||
                               (item.type === 'trail' && activeTrail === item.id) ||
                               (item.type === 'filter' && activeFilter === item.id);
            return (
                <div key={item.id} className={`group bg-white dark:bg-slate-900 border ${isEquipped ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-100 dark:border-slate-800'} rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col relative overflow-hidden`} style={{ animationDelay: `${idx * 50}ms` }}>
                   <div className={`aspect-[4/3] rounded-[2rem] mb-6 flex items-center justify-center relative overflow-hidden border border-slate-100 dark:border-slate-800 ${item.type === 'filter' ? item.previewClass : 'bg-slate-50 dark:bg-slate-800'}`}>
                      {item.type === 'border' && (
                          <div className={`w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center relative ${item.previewClass}`}>
                              <img src={userData.avatarUrl} className="w-full h-full object-cover rounded-full z-10" alt="" />
                          </div>
                      )}
                      {item.type === 'trail' && (
                          <div className="relative w-full h-full flex items-center justify-center">
                              <div className={`w-4 h-4 rounded-full ${item.id === 'trail_matrix' ? 'rounded-none' : ''} ${item.previewClass.split(' ')[0]} animate-ping shadow-[0_0_10px_currentColor]`} />
                              <p className="absolute bottom-4 text-[7px] font-black uppercase tracking-widest text-slate-400">Movement_Burst</p>
                          </div>
                      )}
                      {item.type === 'filter' && <div className="absolute inset-0 flex items-center justify-center bg-black/10"><span className="text-white font-black text-xs uppercase tracking-widest drop-shadow-md">Filter_FX</span></div>}
                   </div>
                   <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                         <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tight">{item.name}</h3>
                         <div className="text-indigo-500 scale-90"><item.icon /></div>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed h-8 mb-4">{item.description}</p>
                   </div>
                   <div className="mt-auto">
                      {isUnlocked ? (
                          <button onClick={() => handleEquip(item)} className={`w-full py-4 rounded-[1.5rem] font-black text-[9px] uppercase tracking-[0.2em] transition-all active:scale-95 ${isEquipped ? 'bg-slate-100 dark:bg-slate-800 text-rose-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>{isEquipped ? 'UNEQUIP' : 'EQUIP_MOD'}</button>
                      ) : (
                          <button onClick={() => handlePurchase(item)} className={`w-full py-4 rounded-[1.5rem] font-black text-[9px] uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-2 ${currentPoints >= item.price || userData.role === 'admin' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-cyan-600 hover:text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                             {userData.role === 'admin' ? 'ADMIN_UNLOCK' : `${item.price} PTS`}
                          </button>
                      )}
                   </div>
                </div>
            );
         })}
      </div>
    </div>
  );
};
