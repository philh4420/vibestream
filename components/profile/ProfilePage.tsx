
import React, { useState, useEffect, useMemo } from 'react';
import { User, Post, Region } from '../../types';
import { PostCard } from '../feed/PostCard';
import { db, auth } from '../../services/firebase';
import { collection, query, where, getDocs, orderBy, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { ProfileHeader } from './ProfileHeader';
import { ProfileAboutSection } from './sections/ProfileAboutSection';
import { ProfileMedia } from './ProfileMedia';
import { CalibrationOverlay } from './CalibrationOverlay';
import { BentoTile } from './tiles/BentoTile';
import { ProfileTabs, ProfileTab } from './ProfileTabs';

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
  const [expandedTile, setExpandedTile] = useState<string | null>(null);
  const [currentUptime, setCurrentUptime] = useState<string>('0h 0m');
  const [profileData, setProfileData] = useState<User>(userData);

  // Sync profile data in real-time for presence updates
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

  useEffect(() => {
    const updateUptime = () => {
      const diffMs = Date.now() - sessionStartTime;
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setCurrentUptime(`${diffHrs}h ${diffMins}m`);
    };
    updateUptime();
    const interval = setInterval(updateUptime, 60000);
    return () => clearInterval(interval);
  }, [sessionStartTime]);

  const handleUpdateIdentity = async (processedData: any) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'users', userData.id), processedData);
      onUpdateProfile(processedData);
      setIsEditModalOpen(false);
      addToast('Neural Identity Clusters Synchronised', 'success');
    } catch (e) { 
      console.error(e);
      addToast('Sync Error: Neural Handshake Refused', 'error'); 
    }
  };

  const isOwnProfile = auth.currentUser?.uid === userData.id;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'identity':
        return <ProfileAboutSection userData={profileData} locale={locale} />;
      case 'visuals':
        return <ProfileMedia posts={userPosts} />;
      default:
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 auto-rows-min gap-4 md:gap-6">
              <BentoTile title="Signal_Quality" className="bg-slate-950 text-white">
                <div className="text-4xl font-black tracking-tighter mb-2">99.4%</div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 w-[99.4%]" />
                </div>
              </BentoTile>
              <BentoTile title="Uptime">
                <div className="text-3xl font-black text-slate-900 tracking-tighter">{currentUptime}</div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 font-mono">Active Link</p>
              </BentoTile>
              <BentoTile title="Trust_Tier">
                <div className="text-2xl font-black text-indigo-600 tracking-tighter uppercase italic">{profileData.trustTier || 'Alpha'}</div>
              </BentoTile>
              <BentoTile title="Latency">
                <div className="text-3xl font-black text-slate-900 tracking-tighter">12ms</div>
                <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-1">GB_NODE_STABLE</p>
              </BentoTile>
            </div>
            <div className="grid grid-cols-1 gap-6 pt-6">
              {userPosts.map(post => <PostCard key={post.id} post={post} onLike={() => {}} locale={locale} />)}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="animate-in fade-in duration-1000 pb-20">
      <ProfileHeader 
        userData={profileData} 
        onEdit={() => setIsEditModalOpen(true)} 
        postCount={userPosts.length} 
        addToast={addToast}
        isOwnProfile={isOwnProfile}
      />
      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="mt-8 px-4 md:px-0">{renderTabContent()}</div>
      {isEditModalOpen && (
        <CalibrationOverlay userData={profileData} onClose={() => setIsEditModalOpen(false)} onSave={handleUpdateIdentity} />
      )}
    </div>
  );
};
