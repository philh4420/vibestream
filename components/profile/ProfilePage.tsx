
import React, { useState, useEffect } from 'react';
import { User, Post, Region } from '../../types';
import { db, auth } from '../../services/firebase';
import { collection, query, where, getDocs, orderBy, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { ProfileHeader } from './ProfileHeader';
import { CalibrationOverlay } from './CalibrationOverlay';

// Modular Sections (Assumed Immutable)
import { ProfileBroadcastingSection } from './sections/ProfileBroadcastingSection';
import { ProfileAboutSection } from './sections/ProfileAboutSection';
import { ProfileVisualsSection } from './sections/ProfileVisualsSection';
import { ProfileResonanceSection } from './sections/ProfileResonanceSection';
import { ProfileChronologySection } from './sections/ProfileChronologySection';

interface ProfilePageProps {
  userData: User;
  onUpdateProfile: (newData: Partial<User>) => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  locale: Region;
  sessionStartTime: number;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ userData, onUpdateProfile, addToast, locale, sessionStartTime }) => {
  const [activeTab, setActiveTab] = useState<string>('broadcasting');
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profileData, setProfileData] = useState<User>(userData);

  useEffect(() => {
    if (!db || !userData.id) return;
    const unsub = onSnapshot(doc(db, 'users', userData.id), (doc) => {
      if (doc.exists()) {
        setProfileData({ id: doc.id, ...doc.data() } as User);
      }
    });
    return () => unsub();
  }, [userData.id]);

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
      addToast('Neural Identity Clusters Synchronised', 'success');
    } catch (e) { 
      addToast('Sync Error: Neural Handshake Refused', 'error'); 
    }
  };

  const isOwnProfile = auth.currentUser?.uid === userData.id;

  const renderTimelineLayout = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-5xl mx-auto items-start">
      {/* LEFT COLUMN: INTRO / ABOUT PREVIEWS (FB Style) */}
      <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-[var(--header-h)]">
        
        {/* Intro Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
           <h3 className="text-xl font-black text-slate-900 tracking-tight mb-4 italic">Intro</h3>
           <div className="space-y-4">
              {profileData.statusMessage && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <p className="text-sm font-bold text-slate-700 italic">"{profileData.statusMessage}"</p>
                </div>
              )}
              <p className="text-slate-700 text-center text-sm font-medium py-2 leading-relaxed">
                {profileData.bio || 'Establish your neural signature in calibration...'}
              </p>
              <div className="h-px bg-slate-100" />
              <div className="space-y-4 py-2">
                 {profileData.occupation && (
                    <div className="flex items-center gap-3 text-slate-600">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 opacity-40"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 .621-.504 1.125-1.125 1.125H4.875c-.621 0-1.125-.504-1.125-1.125v-4.25m16.5 0a2.25 2.25 0 0 0-1.883-2.212c-3.13-.51-6.947-.51-10.084 0A2.25 2.25 0 0 0 3.75 14.15m16.5 0V9.25c0-.621-.504-1.125-1.125-1.125H4.875c-.621 0-1.125.504-1.125 1.125v4.9m16.5 0a2.25 2.25 0 0 1-2.25 2.25H5.25a2.25 2.25 0 0 1-2.25-2.25m13.5-12.25h-3c-.621 0-1.125.504-1.125 1.125v.75c0 .621.504 1.125 1.125 1.125h3c.621 0 1.125-.504 1.125-1.125v-.75c0-.621-.504-1.125-1.125-1.125Z" /></svg>
                      <span className="text-sm">Works at <span className="font-bold text-slate-900">{profileData.occupation}</span></span>
                    </div>
                 )}
                 {profileData.location && (
                    <div className="flex items-center gap-3 text-slate-600">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 opacity-40"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                      <span className="text-sm">From <span className="font-bold text-slate-900">{profileData.location}</span></span>
                    </div>
                 )}
                 <div className="flex items-center gap-3 text-slate-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 opacity-40"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                    <span className="text-sm">Joined <span className="font-bold text-slate-900">{new Date(profileData.joinedAt).toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</span></span>
                 </div>
              </div>
              {isOwnProfile && (
                <button onClick={() => setIsEditModalOpen(true)} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">Edit Bio / Details</button>
              )}
           </div>
        </div>

        {/* Photos Preview Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-xl font-black text-slate-900 tracking-tight italic">Photos</h3>
             <button onClick={() => setActiveTab('visuals')} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline px-2 py-1">See All</button>
           </div>
           <div className="grid grid-cols-3 gap-1.5 rounded-xl overflow-hidden">
             {userPosts.filter(p => p.media?.length > 0).slice(0, 9).map((post, i) => (
               <img key={i} src={post.media[0].url} className="aspect-square object-cover w-full hover:opacity-90 cursor-pointer transition-opacity" alt="" />
             ))}
           </div>
        </div>

        {/* Resonance/Tags Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-xl font-black text-slate-900 tracking-tight italic">Resonance</h3>
             <button onClick={() => setActiveTab('resonance')} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline px-2 py-1">Mesh</button>
           </div>
           <div className="flex flex-wrap gap-2">
             {profileData.tags?.slice(0, 8).map(tag => (
               <span key={tag} className="px-3 py-1 bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-slate-100">#{tag}</span>
             ))}
           </div>
        </div>

      </div>

      {/* RIGHT COLUMN: POST FEED (The "Wall") */}
      <div className="lg:col-span-7 space-y-4">
        <ProfileBroadcastingSection 
          userData={profileData} 
          posts={userPosts} 
          sessionStartTime={sessionStartTime} 
          locale={locale} 
        />
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'identity':
        return <div className="max-w-5xl mx-auto"><ProfileAboutSection userData={profileData} locale={locale} /></div>;
      case 'visuals':
        return <div className="max-w-5xl mx-auto"><ProfileVisualsSection posts={userPosts} /></div>;
      case 'resonance':
        return <div className="max-w-5xl mx-auto"><ProfileResonanceSection userData={profileData} /></div>;
      case 'chronology':
        return <div className="max-w-5xl mx-auto"><ProfileChronologySection userData={profileData} locale={locale} /></div>;
      default:
        return renderTimelineLayout();
    }
  };

  return (
    <div className="animate-in fade-in duration-1000 bg-[#f0f2f5] min-h-screen pb-20 -mx-4 sm:-mx-6 md:-mx-10 lg:-mx-14 -mt-6">
      <ProfileHeader 
        userData={profileData} 
        onEdit={() => setIsEditModalOpen(true)} 
        postCount={userPosts.length} 
        addToast={addToast}
        isOwnProfile={isOwnProfile}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      <div className="mt-4 md:mt-8 px-4 sm:px-6 md:px-10 lg:px-14">
        {renderTabContent()}
      </div>

      {isEditModalOpen && (
        <CalibrationOverlay 
          userData={profileData} 
          onClose={() => setIsEditModalOpen(false)} 
          onSave={handleUpdateIdentity} 
        />
      )}
    </div>
  );
};
