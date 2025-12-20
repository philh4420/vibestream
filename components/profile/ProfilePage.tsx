
import React, { useState, useEffect } from 'react';
import { User, Post, Region } from '../../types';
import { db, auth } from '../../services/firebase';
import { collection, query, where, getDocs, orderBy, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { ProfileHeader } from './ProfileHeader';
import { CalibrationOverlay } from './CalibrationOverlay';

// Modular Sections
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
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 max-w-[120rem] mx-auto">
      {/* LEFT COLUMN: INTRO / ABOUT PREVIEWS */}
      <div className="xl:col-span-5 space-y-8">
        
        {/* Intro Block */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
           <h3 className="text-xl font-black text-slate-900 tracking-tighter mb-8 italic">Intro</h3>
           <p className="text-slate-500 text-center font-medium italic mb-10 leading-relaxed">
             "{profileData.bio || 'Establishing primary neural uplink...'}"
           </p>
           <div className="space-y-6">
              {profileData.location && (
                <div className="flex items-center gap-4 text-slate-600">
                  <div className="scale-110 opacity-40"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg></div>
                  <span className="font-bold text-sm">Lives in <span className="text-slate-900">{profileData.location}</span></span>
                </div>
              )}
              {profileData.website && (
                <div className="flex items-center gap-4 text-slate-600">
                  <div className="scale-110 opacity-40"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3" /></svg></div>
                  <a href={profileData.website} target="_blank" className="font-bold text-sm text-indigo-600 hover:underline">{profileData.website.replace(/^https?:\/\//, '')}</a>
                </div>
              )}
              <div className="flex items-center gap-4 text-slate-600">
                <div className="scale-110 opacity-40"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg></div>
                <span className="font-bold text-sm">Joined <span className="text-slate-900">{new Date(profileData.joinedAt).toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</span></span>
              </div>
           </div>
           {isOwnProfile && (
             <button onClick={() => setIsEditModalOpen(true)} className="w-full py-4 mt-8 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">Edit Details</button>
           )}
        </div>

        {/* Photos Preview */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
           <div className="flex justify-between items-center mb-8">
             <h3 className="text-xl font-black text-slate-900 tracking-tighter italic">Photos</h3>
             <button onClick={() => setActiveTab('visuals')} className="text-sm font-bold text-indigo-600 hover:underline">See All</button>
           </div>
           <div className="grid grid-cols-3 gap-2 rounded-2xl overflow-hidden">
             {userPosts.filter(p => p.media?.length > 0).slice(0, 9).map((post, i) => (
               <img key={i} src={post.media[0].url} className="aspect-square object-cover w-full hover:opacity-90 cursor-pointer transition-opacity" alt="" />
             ))}
           </div>
        </div>

        {/* Resonance Preview (Skills/Tags) */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
           <div className="flex justify-between items-center mb-8">
             <h3 className="text-xl font-black text-slate-900 tracking-tighter italic">Resonance</h3>
             <button onClick={() => setActiveTab('resonance')} className="text-sm font-bold text-indigo-600 hover:underline">Full Mesh</button>
           </div>
           <div className="flex flex-wrap gap-2">
             {profileData.tags?.slice(0, 8).map(tag => (
               <span key={tag} className="px-4 py-2 bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-100">#{tag}</span>
             ))}
           </div>
        </div>

      </div>

      {/* RIGHT COLUMN: POST FEED */}
      <div className="xl:col-span-7">
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
        return <div className="max-w-[120rem] mx-auto"><ProfileAboutSection userData={profileData} locale={locale} /></div>;
      case 'visuals':
        return <div className="max-w-[120rem] mx-auto"><ProfileVisualsSection posts={userPosts} /></div>;
      case 'resonance':
        return <div className="max-w-[120rem] mx-auto"><ProfileResonanceSection userData={profileData} /></div>;
      case 'chronology':
        return <div className="max-w-[120rem] mx-auto"><ProfileChronologySection userData={profileData} locale={locale} /></div>;
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
      
      <div className="mt-8 px-4 sm:px-6 md:px-10 lg:px-14">
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
