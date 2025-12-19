
import React, { useState, useEffect } from 'react';
import { User, Post, Region } from '../../types';
import { db, auth } from '../../services/firebase';
import { collection, query, where, getDocs, orderBy, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { ProfileHeader } from './ProfileHeader';
import { ProfileTabs, ProfileTab } from './ProfileTabs';
import { CalibrationOverlay } from './CalibrationOverlay';

// Modular Tab Components
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
  const [activeTab, setActiveTab] = useState<ProfileTab>('broadcasting');
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'identity':
        return <ProfileAboutSection userData={profileData} locale={locale} />;
      case 'visuals':
        return <ProfileVisualsSection posts={userPosts} />;
      case 'resonance':
        return <ProfileResonanceSection userData={profileData} />;
      case 'chronology':
        return <ProfileChronologySection userData={profileData} locale={locale} />;
      default:
        return (
          <ProfileBroadcastingSection 
            userData={profileData} 
            posts={userPosts} 
            sessionStartTime={sessionStartTime} 
            locale={locale} 
          />
        );
    }
  };

  return (
    <div className="animate-in fade-in duration-1000 pb-20 max-w-[2560px] mx-auto">
      <ProfileHeader 
        userData={profileData} 
        onEdit={() => setIsEditModalOpen(true)} 
        postCount={userPosts.length} 
        addToast={addToast}
        isOwnProfile={isOwnProfile}
      />
      
      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="mt-8 px-4 md:px-0">
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
