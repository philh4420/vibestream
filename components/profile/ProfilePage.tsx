
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
import { Input } from '../ui/Input';

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
        const q = query(
          collection(db, 'posts'), 
          where('authorId', '==', userData.id),
          orderBy('timestamp', 'desc')
        );
        const snap = await getDocs(q);
        const posts = snap.docs.map(d => ({ id: d.id, ...d.data() } as Post));
        setUserPosts(posts);
      } catch (e) {
        console.error("Profile feed error:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserPosts();
  }, [userData.id]);

  const handleSaveProfile = async () => {
    if (!db) return;
    try {
      const userRef = doc(db, 'users', userData.id);
      await updateDoc(userRef, editForm);
      onUpdateProfile(editForm);
      setIsEditModalOpen(false);
      addToast('Identity Updated', 'success');
    } catch (e) {
      addToast('Sync Failed', 'error');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Cover & Avatar Header */}
      <div className="relative group">
        <div className="h-64 md:h-80 w-full rounded-[3rem] overflow-hidden relative shadow-2xl">
          <img src={userData.coverUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
        </div>
        
        <div className="absolute -bottom-16 left-8 md:left-12 flex items-end gap-6">
          <div className="relative">
            <div className="absolute -inset-1.5 bg-white rounded-[2.5rem] shadow-xl"></div>
            <img 
              src={userData.avatarUrl} 
              className="relative w-32 h-32 md:w-40 md:h-40 rounded-[2.2rem] object-cover border-4 border-white shadow-2xl" 
              alt="Avatar" 
            />
            {userData.role === 'admin' && (
              <div className="absolute -top-2 -right-2 bg-rose-500 text-white p-2 rounded-xl shadow-lg ring-4 ring-white">
                <ICONS.Admin />
              </div>
            )}
          </div>
          <div className="mb-4 pb-2">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter drop-shadow-md">
                {userData.displayName}
              </h1>
              {(userData.verifiedHuman || userData.role === 'verified') && <ICONS.Verified />}
            </div>
            <p className="text-white/80 font-bold text-sm tracking-widest uppercase">@{userData.username}</p>
          </div>
        </div>

        <button 
          onClick={() => setIsEditModalOpen(true)}
          className="absolute -bottom-12 right-8 bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-50 transition-all active:scale-95 border border-slate-100"
        >
          Calibrate Identity
        </button>
      </div>

      {/* Profile Info & Stats */}
      <div className="mt-20 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Identity Matrix</h3>
            <p className="text-slate-700 font-medium leading-relaxed mb-6 whitespace-pre-wrap">{userData.bio}</p>
            
            <div className="space-y-4 pt-6 border-t border-slate-50">
              <div className="flex items-center gap-3 text-slate-500">
                <ICONS.Globe />
                <span className="text-sm font-bold">{userData.location}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                <span className="text-sm font-bold">Joined {new Date(userData.joinedAt).toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {userData.badges?.map(badge => (
                <span key={badge} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100/50">
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-200/20 text-white">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Resonance</p>
                <p className="text-2xl font-black">{userData.followers.toLocaleString(locale)}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Signals</p>
                <p className="text-2xl font-black">{userData.following.toLocaleString(locale)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Broadcast History</h2>
            <div className="flex gap-2">
              <button className="p-3 bg-white rounded-xl shadow-sm text-indigo-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"></path></svg>
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border border-slate-100">
              <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing Archives...</p>
            </div>
          ) : userPosts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
               <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-300">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
               </div>
               <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">No transmissions yet</h3>
            </div>
          ) : (
            <div className="space-y-6">
              {userPosts.map(post => (
                <PostCard key={post.id} post={post} onLike={() => {}} locale={locale} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Identity Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-end md:items-center justify-center p-0 md:p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl" onClick={() => setIsEditModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-xl rounded-t-[2.5rem] md:rounded-[3rem] shadow-2xl p-8 md:p-12 animate-in slide-in-from-bottom-12 duration-500">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-8 uppercase">Calibrate Identity</h2>
            
            <div className="space-y-6">
              <Input 
                label="Display Name" 
                value={editForm.displayName} 
                onChange={e => setEditForm(prev => ({ ...prev, displayName: e.target.value }))} 
                className="!text-slate-900 !bg-slate-50 !border-slate-200"
              />
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Bio Signature</label>
                <textarea 
                  value={editForm.bio}
                  onChange={e => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full h-32 p-6 bg-slate-50 rounded-[1.5rem] border border-slate-200 focus:ring-2 focus:ring-indigo-100 text-slate-900 font-semibold resize-none"
                />
              </div>
              <Input 
                label="Location Node" 
                value={editForm.location} 
                onChange={e => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                className="!text-slate-900 !bg-slate-50 !border-slate-200"
              />
            </div>

            <div className="mt-10 flex gap-4">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 py-5 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-xs"
              >
                Abort
              </button>
              <button 
                onClick={handleSaveProfile}
                className="flex-1 py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs"
              >
                Sync Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
