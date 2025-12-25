
import React, { useState, useEffect } from 'react';
import { User, Post, Region } from '../../types';
import { db, auth } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  updateDoc, 
  doc, 
  onSnapshot,
  writeBatch,
  serverTimestamp,
  increment,
  getDoc,
  deleteDoc
} = Firestore as any;
import { ProfileHeader } from './ProfileHeader';
import { ProfileTabs } from './ProfileTabs';
import { CalibrationOverlay } from './CalibrationOverlay';
import { DeleteConfirmationModal } from '../ui/DeleteConfirmationModal';
import { ProfileBroadcastingSection } from './sections/ProfileBroadcastingSection';
import { ProfileAboutSection } from './sections/ProfileAboutSection';
import { ProfileVisualsSection } from './sections/ProfileVisualsSection';
import { ProfileResonanceSection } from './sections/ProfileResonanceSection';
import { ProfileChronologySection } from './sections/ProfileChronologySection';
import { ProfileConnectionsSection } from './sections/ProfileConnectionsSection';

interface ProfilePageProps {
  userData: User;
  onUpdateProfile: (newData: Partial<User>) => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  locale: Region;
  sessionStartTime: number;
  onViewPost: (post: Post) => void;
  onViewProfile: (user: User) => void;
  onOpenSettings?: () => void;
  onLike?: (id: string, freq?: string) => void;
  onBookmark?: (id: string) => void;
  isBlocked?: boolean;
  onBlock?: () => void;
  onUnblock?: () => void;
  blockedIds?: Set<string>;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ 
  userData, 
  onUpdateProfile, 
  addToast, 
  locale, 
  onViewPost, 
  onViewProfile,
  onOpenSettings, 
  onLike, 
  onBookmark,
  isBlocked,
  onBlock,
  onUnblock,
  blockedIds
}) => {
  const [activeTab, setActiveTab] = useState<string>('broadcasting');
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [profileData, setProfileData] = useState<User>(userData);
  const [isFollowing, setIsFollowing] = useState(false);

  const currentUser = auth.currentUser;
  const isOwnProfile = currentUser?.uid === userData.id;

  useEffect(() => {
    if (!db || !userData.id) return;
    setProfileData(userData);
    const unsub = onSnapshot(doc(db, 'users', userData.id), (doc: any) => {
      if (doc.exists()) setProfileData({ id: doc.id, ...doc.data() } as User);
    });
    return () => unsub();
  }, [userData.id]);

  useEffect(() => {
    const checkFollow = async () => {
      if (!db || !currentUser || isOwnProfile) return;
      const docRef = doc(db, 'users', currentUser.uid, 'following', userData.id);
      const snap = await getDoc(docRef);
      setIsFollowing(snap.exists());
    };
    checkFollow();
  }, [userData.id, currentUser]);

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!db || !userData.id || isBlocked) return;
      const q = query(collection(db, 'posts'), where('authorId', '==', userData.id), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      setUserPosts(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Post)));
    };
    fetchUserPosts();
  }, [userData.id, isBlocked]);

  const handleUpdate = async (data: any) => {
    await updateDoc(doc(db, 'users', userData.id), data);
    onUpdateProfile(data);
    setIsEditModalOpen(false);
  };

  const handleFollowToggle = async () => {
    if (!currentUser || isOwnProfile) return;
    const batch = writeBatch(db);
    const myRef = doc(db, 'users', currentUser.uid, 'following', userData.id);
    const theirRef = doc(db, 'users', userData.id, 'followers', currentUser.uid);
    
    if (isFollowing) {
        batch.delete(myRef);
        batch.delete(theirRef);
        batch.update(doc(db, 'users', currentUser.uid), { following: increment(-1) });
        batch.update(doc(db, 'users', userData.id), { followers: increment(-1) });
        setIsFollowing(false);
    } else {
        batch.set(myRef, { linkedAt: serverTimestamp() });
        batch.set(theirRef, { linkedAt: serverTimestamp() });
        batch.update(doc(db, 'users', currentUser.uid), { following: increment(1) });
        batch.update(doc(db, 'users', userData.id), { followers: increment(1) });
        
        // Notification
        const notifRef = doc(collection(db, 'notifications'));
        batch.set(notifRef, {
          type: 'follow',
          fromUserId: currentUser.uid,
          fromUserName: currentUser.displayName || 'Unknown Node',
          fromUserAvatar: currentUser.photoURL || '',
          toUserId: userData.id,
          text: 'established a neural link with you',
          isRead: false,
          timestamp: serverTimestamp(),
          pulseFrequency: 'cognition'
        });

        setIsFollowing(true);
    }
    await batch.commit();
  };

  if (isBlocked) {
    return (
      <div className="animate-in fade-in duration-1000 bg-[#f0f2f5] dark:bg-[#020617] min-h-screen flex items-center justify-center p-6 -mx-4 sm:-mx-6 md:-mx-10 lg:-mx-14 -mt-6">
         <div className="text-center max-w-md bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-xl border border-slate-100 dark:border-slate-800">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 dark:text-slate-600">
               <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-4">Signal_Severed</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8">
              Connection to this node has been blocked.
            </p>
            {onUnblock && (
               <button onClick={onUnblock} className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] hover:opacity-90 transition-opacity">
                  Restore_Link
               </button>
            )}
         </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-1000 bg-[#f0f2f5] dark:bg-[#020617] min-h-screen pb-20 -mx-4 sm:-mx-6 md:-mx-10 lg:-mx-14 -mt-6">
      <ProfileHeader 
        userData={profileData} 
        onEdit={() => setIsEditModalOpen(true)} 
        addToast={addToast}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        onFollowToggle={handleFollowToggle}
        onOpenSettings={onOpenSettings}
        onBlock={() => setShowBlockModal(true)}
      />
      
      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="mt-8 px-4 sm:px-6 md:px-10 lg:px-14">
        {activeTab === 'broadcasting' && <ProfileBroadcastingSection posts={userPosts} locale={locale} userData={profileData} addToast={addToast} onViewPost={onViewPost} onLike={onLike} onBookmark={onBookmark} />}
        {activeTab === 'identity' && <ProfileAboutSection userData={profileData} locale={locale} />}
        {activeTab === 'visuals' && <ProfileVisualsSection posts={userPosts} onViewPost={onViewPost} />}
        {activeTab === 'resonance' && <ProfileResonanceSection userData={profileData} />}
        {activeTab === 'chronology' && <ProfileChronologySection userData={profileData} locale={locale} />}
        {activeTab === 'connections' && <ProfileConnectionsSection userData={profileData} currentUser={userData} onViewProfile={onViewProfile} addToast={addToast} />}
      </div>

      {isEditModalOpen && <CalibrationOverlay userData={profileData} onClose={() => setIsEditModalOpen(false)} onSave={handleUpdate} />}
      
      <DeleteConfirmationModal
        isOpen={showBlockModal}
        title="BLOCK_NODE"
        description={`Block ${profileData.displayName}? This will hide their signals and sever all connections.`}
        onConfirm={() => { onBlock?.(); setShowBlockModal(false); }}
        onCancel={() => setShowBlockModal(false)}
        confirmText="CONFIRM_BLOCK"
      />
    </div>
  );
};
