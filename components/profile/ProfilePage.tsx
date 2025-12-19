
import React, { useState, useEffect, useMemo } from 'react';
import { User, Post, Region } from '../../types';
import { PostCard } from '../feed/PostCard';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, orderBy, updateDoc, doc } from 'firebase/firestore';
import { ICONS } from '../../constants';
import { BentoTile } from './tiles/BentoTile';
import { IdentityTile } from './tiles/IdentityTile';
import { CalibrationOverlay } from './CalibrationOverlay';

interface ProfilePageProps {
  userData: User;
  onUpdateProfile: (newData: Partial<User>) => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  locale: Region;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ userData, onUpdateProfile, addToast, locale }) => {
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!db || !userData.id) return;
      try {
        const q = query(collection(db, 'posts'), where('authorId', '==', userData.id), orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        setUserPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Post)));
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };
    fetchUserPosts();
  }, [userData.id]);

  const handleUpdateIdentity = async (processedData: any) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'users', userData.id), processedData);
      onUpdateProfile(processedData);
      setIsEditModalOpen(false);
      addToast('Identity Synchronised', 'success');
    } catch (e) { addToast('Sync Error: Connection Refused', 'error'); }
  };

  const metrics = useMemo(() => ({
    trustScore: userData.verifiedHuman ? 98.4 : 65.2,
    signalQuality: Math.min(99, (userData.followers / 10) + (userPosts.length * 2)).toFixed(1),
    identityHash: `VIBE-ID-${userData.id.substring(0, 8).toUpperCase()}`,
    formattedDob: userData.dob ? new Date(userData.dob).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) : 'Unknown Date'
  }), [userData, userPosts.length, locale]);

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 auto-rows-fr">
        
        <IdentityTile 
          userData={userData} 
          identityHash={metrics.identityHash} 
          onEdit={() => setIsEditModalOpen(true)} 
        />

        <BentoTile title="Identity_Data">
           <div className="flex flex-col justify-center h-full gap-4">
              <div className="space-y-1">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Origins</p>
                 <p className="text-sm font-bold text-slate-800">{metrics.formattedDob}</p>
              </div>
              <div className="space-y-1">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Pronouns</p>
                 <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest">{userData.pronouns || 'N/A'}</p>
              </div>
           </div>
        </BentoTile>

        <BentoTile title="Neural_Links" onClick={() => userData.website && window.open(userData.website, '_blank')}>
          <div className="flex flex-col justify-center h-full">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600"><ICONS.Globe /></div>
                <div className="overflow-hidden">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono truncate">External Node</p>
                   <p className="text-xs font-bold text-slate-900 truncate">{userData.website ? userData.website.replace('https://', '') : 'No links established'}</p>
                </div>
             </div>
             <div className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] font-mono group-hover:translate-x-1 transition-transform">Open_Connection →</div>
          </div>
        </BentoTile>

        <BentoTile title="Resonance_Vector">
          <div className="flex flex-col justify-center h-full gap-1">
             <div className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{userData.followers.toLocaleString(locale)}</div>
             <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" /></svg>+2.4% Net Growth
             </div>
          </div>
        </BentoTile>

        <BentoTile title="Interest_Mesh">
          <div className="flex flex-wrap gap-2 content-center h-full">
             {userData.tags && userData.tags.length > 0 ? userData.tags.map(tag => (
               <span key={tag} className="px-2 py-1 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-md border border-white/10">{tag}</span>
             )) : <p className="text-[10px] text-slate-400 font-medium italic">Mesh undefined...</p>}
          </div>
        </BentoTile>

        <BentoTile title="Signal_Quality">
          <div className="flex flex-col justify-center h-full">
             <div className="relative w-full h-1 bg-slate-100 rounded-full overflow-hidden mb-4">
                <div className="absolute left-0 top-0 bottom-0 bg-indigo-600 rounded-full transition-all duration-1000" style={{ width: `${metrics.signalQuality}%` }} />
             </div>
             <div className="flex justify-between items-end">
                <div className="text-3xl font-black text-slate-900 tracking-tighter">{metrics.signalQuality}%</div>
                <div className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1.5 font-mono">Optimised</div>
             </div>
          </div>
        </BentoTile>

        <BentoTile title="Humanity_Index">
           <div className="flex flex-col justify-center h-full">
              <div className="flex items-center gap-4 mb-3">
                 <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                 </div>
                 <div>
                    <div className="text-xl font-black text-slate-900 leading-none mb-1">{metrics.trustScore}%</div>
                    <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest font-mono">Verified_Human</div>
                 </div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Tier: {userData.trustTier || 'Alpha'}-Class</p>
           </div>
        </BentoTile>

      </div>

      <div className="space-y-6 pt-10">
        <div className="flex items-center justify-between px-2">
           <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></span>Broadcasting_Archive
           </h2>
        </div>
        
        {isLoading ? (
          <div className="py-24 flex justify-center items-center flex-col gap-4">
            <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Retrieving Neural Log...</p>
          </div>
        ) : userPosts.length === 0 ? (
          <div className="glass-panel rounded-[3rem] py-32 text-center border-dashed border-2 border-slate-200">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Null Transmission Detected</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {userPosts.map(post => <PostCard key={post.id} post={post} onLike={() => {}} locale={locale} />)}
          </div>
        )}
      </div>

      {isEditModalOpen && (
        <CalibrationOverlay 
          userData={userData} 
          onClose={() => setIsEditModalOpen(false)} 
          onSave={handleUpdateIdentity} 
        />
      )}
    </div>
  );
};
