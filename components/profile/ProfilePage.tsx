
import React, { useState, useEffect } from 'react';
import { User, Post, Region } from '../../types';
import { PostCard } from '../feed/PostCard';
import { db } from '../../services/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  updateDoc, 
  doc 
} from 'firebase/firestore';
import { ICONS } from '../../constants';

interface ProfilePageProps {
  userData: User;
  onUpdateProfile: (newData: Partial<User>) => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  locale: Region;
}

const BentoTile: React.FC<{ 
  title: string; 
  children: React.ReactNode; 
  className?: string; 
  onClick?: () => void;
}> = ({ title, children, className = "", onClick }) => (
  <div 
    onClick={onClick}
    className={`glass-panel rounded-[2rem] p-6 flex flex-col justify-between transition-all duration-500 hover:shadow-2xl hover:border-indigo-500/30 group cursor-pointer ${className}`}
  >
    <div className="flex justify-between items-start mb-4">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono group-hover:text-indigo-400 transition-colors">
        {title}
      </span>
      <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-indigo-500 animate-pulse" />
    </div>
    <div className="flex-1">
      {children}
    </div>
  </div>
);

export const ProfilePage: React.FC<ProfilePageProps> = ({ userData, onUpdateProfile, addToast, locale }) => {
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [editForm, setEditForm] = useState({
    displayName: userData.displayName,
    bio: userData.bio,
    location: userData.location,
    dob: userData.dob || '2000-01-01',
    pronouns: userData.pronouns || '',
    website: userData.website || '',
    tags: userData.tags?.join(', ') || ''
  });

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

  const handleSaveProfile = async () => {
    if (!db) return;
    try {
      const updatedData = {
        ...editForm,
        tags: editForm.tags.split(',').map(t => t.trim()).filter(t => t !== '')
      };
      await updateDoc(doc(db, 'users', userData.id), updatedData);
      onUpdateProfile(updatedData);
      setIsEditModalOpen(false);
      addToast('Identity Synchronised', 'success');
    } catch (e) { addToast('Sync Error: Connection Refused', 'error'); }
  };

  // 2026 Metric Calculations
  const trustScore = userData.verifiedHuman ? 98.4 : 65.2;
  const signalQuality = Math.min(99, (userData.followers / 10) + (userPosts.length * 2)).toFixed(1);
  const identityHash = `VIBE-ID-${userData.id.substring(0, 8).toUpperCase()}`;

  // DOB Formatter
  const formattedDob = userData.dob 
    ? new Date(userData.dob).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Unknown Date';

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      
      {/* 2026 BENTO DASHBOARD SYSTEM */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 auto-rows-fr">
        
        {/* Main Identity Tile (Spans 2x2) */}
        <div className="md:col-span-2 md:row-span-2 glass-panel rounded-[2.5rem] overflow-hidden flex flex-col relative group">
          <div className="h-32 md:h-48 bg-slate-100 relative overflow-hidden">
             <img src={userData.coverUrl} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" alt="" />
             <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent" />
          </div>
          <div className="px-6 md:px-10 pb-8 -mt-12 relative z-10 flex flex-col h-full">
            <div className="flex items-end gap-6 mb-6">
              <div className="relative shrink-0">
                <img src={userData.avatarUrl} className="w-24 h-24 md:w-32 md:h-32 rounded-3xl object-cover border-4 border-white shadow-2xl ring-1 ring-slate-100" alt="" />
                {userData.verifiedHuman && (
                  <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-1.5 rounded-xl shadow-xl border-2 border-white scale-110">
                    <ICONS.Verified />
                  </div>
                )}
              </div>
              <div className="pb-2">
                <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter leading-none mb-2">{userData.displayName}</h1>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">@{userData.username}</span>
                   <span className="w-1 h-1 bg-slate-300 rounded-full" />
                   <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-[0.2em] font-mono">{userData.role}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-4">
               <p className="text-slate-600 text-sm md:text-base leading-relaxed font-medium line-clamp-3">
                 {userData.bio}
               </p>
               <div className="flex flex-wrap gap-3">
                 <span className="px-3 py-1.5 bg-slate-100/50 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono flex items-center gap-2">
                    <ICONS.Globe /> {userData.location}
                 </span>
                 <span className="px-3 py-1.5 bg-indigo-50 rounded-lg text-[9px] font-black text-indigo-600 uppercase tracking-widest font-mono flex items-center gap-2">
                    <ICONS.Verified /> Identity Hash: {identityHash}
                 </span>
               </div>
            </div>

            <div className="mt-8 flex gap-3">
               <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex-1 py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3"
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 12H13.5" /></svg>
                 Calibrate_Core
               </button>
            </div>
          </div>
        </div>

        {/* Bio-Vault Tile (DOB & Pronouns) */}
        <BentoTile title="Identity_Data">
           <div className="flex flex-col justify-center h-full gap-4">
              <div className="space-y-1">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Origins</p>
                 <p className="text-sm font-bold text-slate-800">{formattedDob}</p>
              </div>
              <div className="space-y-1">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Pronouns</p>
                 <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest">{userData.pronouns || 'N/A'}</p>
              </div>
           </div>
        </BentoTile>

        {/* Link-Node Tile */}
        <BentoTile title="Neural_Links" onClick={() => userData.website && window.open(userData.website, '_blank')}>
          <div className="flex flex-col justify-center h-full">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                   <ICONS.Globe />
                </div>
                <div className="overflow-hidden">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono truncate">External Node</p>
                   <p className="text-xs font-bold text-slate-900 truncate">{userData.website ? userData.website.replace('https://', '') : 'No links established'}</p>
                </div>
             </div>
             <div className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] font-mono group-hover:translate-x-1 transition-transform">
                Open_Connection →
             </div>
          </div>
        </BentoTile>

        {/* Resonance Tile */}
        <BentoTile title="Resonance_Vector" onClick={() => addToast('Network Mapping...', 'info')}>
          <div className="flex flex-col justify-center h-full gap-1">
             <div className="text-4xl font-black text-slate-900 tracking-tighter leading-none">
               {userData.followers.toLocaleString(locale)}
             </div>
             <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" /></svg>
                +2.4% Net Growth
             </div>
             <p className="mt-4 text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">Active Connections</p>
          </div>
        </BentoTile>

        {/* Interest-Mesh Tile */}
        <BentoTile title="Interest_Mesh">
          <div className="flex flex-wrap gap-2 content-center h-full">
             {userData.tags && userData.tags.length > 0 ? userData.tags.map(tag => (
               <span key={tag} className="px-2 py-1 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-md border border-white/10">
                  {tag}
               </span>
             )) : (
               <p className="text-[10px] text-slate-400 font-medium italic">Mesh undefined...</p>
             )}
          </div>
        </BentoTile>

        {/* Signal Quality Tile */}
        <BentoTile title="Signal_Quality" onClick={() => addToast('Signal Optimisation active.', 'success')}>
          <div className="flex flex-col justify-center h-full">
             <div className="relative w-full h-1 bg-slate-100 rounded-full overflow-hidden mb-4">
                <div className="absolute left-0 top-0 bottom-0 bg-indigo-600 rounded-full transition-all duration-1000" style={{ width: `${signalQuality}%` }} />
             </div>
             <div className="flex justify-between items-end">
                <div className="text-3xl font-black text-slate-900 tracking-tighter">{signalQuality}%</div>
                <div className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1.5 font-mono">Optimised</div>
             </div>
          </div>
        </BentoTile>

        {/* Trust Score Tile */}
        <BentoTile title="Humanity_Index">
           <div className="flex flex-col justify-center h-full">
              <div className="flex items-center gap-4 mb-3">
                 <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                 </div>
                 <div>
                    <div className="text-xl font-black text-slate-900 leading-none mb-1">{trustScore}%</div>
                    <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest font-mono">Verified_Human</div>
                 </div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Biometric link secured: {userData.trustTier || 'Alpha'}-Class</p>
           </div>
        </BentoTile>

      </div>

      {/* 2026 TRANSMISSION FEED ARCHIVE */}
      <div className="space-y-6 pt-10">
        <div className="flex items-center justify-between px-2">
           <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></span>
              Broadcasting_Archive
           </h2>
           <div className="flex gap-2">
              <button className="p-2 bg-white border-precision rounded-lg text-slate-400 hover:text-indigo-600 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16m-7 6h7" /></svg></button>
              <button className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg></button>
           </div>
        </div>
        
        {isLoading ? (
          <div className="py-24 flex justify-center items-center flex-col gap-4">
            <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Retrieving Neural Log...</p>
          </div>
        ) : userPosts.length === 0 ? (
          <div className="glass-panel rounded-[3rem] py-32 text-center border-dashed border-2 border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Null Transmission Detected</p>
            <p className="text-[10px] text-slate-300 uppercase tracking-widest mt-2">Node is currently silent.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {userPosts.map(post => <PostCard key={post.id} post={post} onLike={() => {}} locale={locale} />)}
          </div>
        )}
      </div>

      {/* Identity Calibration Overlay - EXTENDED 2026 EDITION */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xl" onClick={() => setIsEditModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-precision animate-in slide-in-from-bottom-12 duration-500">
            
            {/* Modal Header */}
            <div className="shrink-0 p-8 md:p-12 pb-0 flex justify-between items-start">
               <div>
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Node_Calibration</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Synchronise personal identity clusters</p>
               </div>
               <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>
            
            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-10 scroll-container">
              
              {/* Profile Section */}
              <div className="space-y-6">
                 <h3 className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em] font-mono border-b border-slate-100 pb-2">Surface_Metadata</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono ml-1">Label</label>
                       <input 
                          type="text" 
                          value={editForm.displayName} 
                          onChange={e => setEditForm(prev => ({...prev, displayName: e.target.value}))} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold transition-all" 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono ml-1">Geo Node</label>
                       <input 
                          type="text" 
                          value={editForm.location} 
                          onChange={e => setEditForm(prev => ({...prev, location: e.target.value}))} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold transition-all" 
                       />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono ml-1">Neural Bio Signature</label>
                    <textarea 
                       value={editForm.bio} 
                       onChange={e => setEditForm(prev => ({...prev, bio: e.target.value}))} 
                       className="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none font-medium leading-relaxed transition-all" 
                    />
                 </div>
              </div>

              {/* Bio-Vault Section */}
              <div className="space-y-6">
                 <h3 className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em] font-mono border-b border-slate-100 pb-2">Identity_Clusters</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono ml-1">Origins (DOB)</label>
                       <input 
                          type="date" 
                          value={editForm.dob} 
                          onChange={e => setEditForm(prev => ({...prev, dob: e.target.value}))} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold transition-all" 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono ml-1">Pronouns</label>
                       <input 
                          type="text" 
                          placeholder="e.g. they/them"
                          value={editForm.pronouns} 
                          onChange={e => setEditForm(prev => ({...prev, pronouns: e.target.value}))} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold transition-all" 
                       />
                    </div>
                 </div>
              </div>

              {/* Network Linkage Section */}
              <div className="space-y-6">
                 <h3 className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em] font-mono border-b border-slate-100 pb-2">Network_Connectivity</h3>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono ml-1">Hyperlink Node (Website)</label>
                    <input 
                       type="url" 
                       placeholder="https://your-node.com"
                       value={editForm.website} 
                       onChange={e => setEditForm(prev => ({...prev, website: e.target.value}))} 
                       className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold transition-all" 
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono ml-1">Interest Mesh (Comma separated)</label>
                    <input 
                       type="text" 
                       placeholder="Web3, Design, AI, London"
                       value={editForm.tags} 
                       onChange={e => setEditForm(prev => ({...prev, tags: e.target.value}))} 
                       className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold transition-all" 
                    />
                 </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="shrink-0 p-8 md:p-12 pt-0 flex gap-4">
              <button 
                 onClick={() => setIsEditModalOpen(false)} 
                 className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-200 transition-all"
              >
                Abort
              </button>
              <button 
                 onClick={handleSaveProfile} 
                 className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
              >
                Synchronise
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
