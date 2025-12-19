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

export const ProfilePage: React.FC<ProfilePageProps> = ({ userData, onUpdateProfile, addToast, locale }) => {
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: userData.displayName,
    bio: userData.bio,
    location: userData.location
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
      await updateDoc(doc(db, 'users', userData.id), editForm);
      onUpdateProfile(editForm);
      setIsEditModalOpen(false);
      addToast('Identity Synchronised', 'success');
    } catch (e) { addToast('Sync Error: Connection Refused', 'error'); }
  };

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700 max-w-4xl mx-auto">
      {/* Identity Command Header */}
      <div className="bg-white border-precision rounded-2xl overflow-hidden shadow-sm">
        <div className="h-40 md:h-56 bg-slate-100 relative">
          <img src={userData.coverUrl} className="w-full h-full object-cover opacity-80" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
        </div>
        
        <div className="px-6 md:px-10 pb-8 -mt-16 md:-mt-20 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-end gap-5">
              <div className="relative">
                <img src={userData.avatarUrl} className="w-28 h-28 md:w-40 md:h-40 rounded-2xl object-cover border-4 border-white shadow-2xl ring-1 ring-slate-100" alt="" />
                <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-1.5 rounded-lg shadow-lg border-2 border-white">
                  <ICONS.Verified />
                </div>
              </div>
              <div className="mb-2">
                <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter">{userData.displayName}</h1>
                <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">UID: {userData.username}</p>
              </div>
            </div>
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all active:scale-95 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 12H13.5" /></svg>
              Calibrate
            </button>
          </div>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-precision">
            <div className="md:col-span-2 space-y-4">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono">System Bio</p>
              <p className="text-slate-700 text-sm md:text-base leading-relaxed font-medium">{userData.bio}</p>
              <div className="flex flex-wrap gap-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest font-mono">
                <span className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-md border-precision"><ICONS.Globe /> {userData.location}</span>
                <span className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-md border-precision"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> Active Since {new Date(userData.joinedAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
            
            <div className="flex justify-around md:flex-col md:justify-center md:gap-6 bg-slate-50 rounded-2xl p-6 border-precision">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1 font-mono">Resonance</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">{userData.followers.toLocaleString(locale)}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1 font-mono">Transmissions</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">{userPosts.length.toLocaleString(locale)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transmission Log */}
      <div className="space-y-4">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2 font-mono flex items-center gap-2">
           <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
           Signal Log
        </h2>
        {isLoading ? (
          <div className="py-20 flex justify-center"><div className="w-6 h-6 border-2 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin" /></div>
        ) : userPosts.length === 0 ? (
          <div className="bg-white border-precision rounded-2xl py-24 text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono opacity-50">Empty Archive: Node hasn't broadcasted yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {userPosts.map(post => <PostCard key={post.id} post={post} onLike={() => {}} locale={locale} />)}
          </div>
        )}
      </div>

      {/* Identity Calibration Overlay */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setIsEditModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 border-precision animate-in slide-in-from-bottom-6 duration-300">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-8 flex items-center gap-3">
              <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
              Calibration Mode
            </h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 font-mono">Identity Label</label>
                <input type="text" value={editForm.displayName} onChange={e => setEditForm(prev => ({...prev, displayName: e.target.value}))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:ring-1 focus:ring-indigo-500 outline-none font-medium" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 font-mono">Neural Bio Signature</label>
                <textarea value={editForm.bio} onChange={e => setEditForm(prev => ({...prev, bio: e.target.value}))} className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:ring-1 focus:ring-indigo-500 outline-none resize-none font-medium leading-relaxed" />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3.5 bg-slate-100 text-slate-500 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Abort</button>
                <button onClick={handleSaveProfile} className="flex-1 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Synchronise</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};