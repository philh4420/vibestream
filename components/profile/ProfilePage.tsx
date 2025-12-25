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
  getDoc
} = Firestore as any;
import { ProfileHeader } from './ProfileHeader';
import { ProfileTabs } from './ProfileTabs';
import { CalibrationOverlay } from './CalibrationOverlay';
import { ICONS } from '../../constants';

// Modular Sections
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
  onOpenSettings?: () => void;
  onLike?: (id: string, freq?: string) => void;
  onBookmark?: (id: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ userData, onUpdateProfile, addToast, locale, sessionStartTime, onViewPost, onOpenSettings, onLike, onBookmark }) => {
  const [activeTab, setActiveTab] = useState<string>('broadcasting');
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profileData, setProfileData] = useState<User>(userData);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isProcessingFollow, setIsProcessingFollow] = useState(false);

  const currentUser = auth.currentUser;
  const isOwnProfile = currentUser?.uid === userData.id;

  // Real-time Profile Data Sync
  useEffect(() => {
    if (!db || !userData.id) return;
    const unsub = onSnapshot(doc(db, 'users', userData.id), (doc: any) => {
      if (doc.exists()) {
        setProfileData({ id: doc.id, ...doc.data() } as User);
      }
    });
    return () => unsub();
  }, [userData.id]);

  // Check Relationship Status
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!db || !currentUser || isOwnProfile) return;
      try {
        const docRef = doc(db, 'users', currentUser.uid, 'following', userData.id);
        const docSnap = await getDoc(docRef);
        setIsFollowing(docSnap.exists());
      } catch (e) {
        console.error("Relation Check Failed", e);
      }
    };
    checkFollowStatus();
  }, [userData.id, currentUser, isOwnProfile]);

  // Fetch Posts
  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!db || !userData.id) return;
      try {
        const q = query(collection(db, 'posts'), where('authorId', '==', userData.id), orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        setUserPosts(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Post)));
      } catch (e) { console.error(e); }
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

  const handleFollowToggle = async () => {
    if (!db || !currentUser || isOwnProfile || isProcessingFollow) return;
    setIsProcessingFollow(true);
    
    // Optimistic UI
    const nextState = !isFollowing;
    setIsFollowing(nextState);

    const batch = writeBatch(db);
    const myFollowingRef = doc(db, 'users', currentUser.uid, 'following', userData.id);
    const theirFollowersRef = doc(db, 'users', userData.id, 'followers', currentUser.uid);
    const myRef = doc(db, 'users', currentUser.uid);
    const theirRef = doc(db, 'users', userData.id);

    try {
      if (nextState) {
        // Follow
        batch.set(myFollowingRef, { linkedAt: serverTimestamp() });
        batch.set(theirFollowersRef, { linkedAt: serverTimestamp() });
        batch.update(myRef, { following: increment(1) });
        batch.update(theirRef, { followers: increment(1) });
        
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

        addToast(`Link established with ${userData.displayName}`, 'success');
      } else {
        // Unfollow
        batch.delete(myFollowingRef);
        batch.delete(theirFollowersRef);
        batch.update(myRef, { following: increment(-1) });
        batch.update(theirRef, { followers: increment(-1) });
        addToast(`Link severed with ${userData.displayName}`, 'info');
      }
      
      await batch.commit();
    } catch (e) {
      setIsFollowing(!nextState); // Revert logic on error
      addToast("Connection Protocol Failed", 'error');
    } finally {
      setIsProcessingFollow(false);
    }
  };

  const handleBlock = async () => {
    if (!db || !currentUser || isOwnProfile) return;
    const confirmed = window.confirm(`Block ${profileData.displayName}? This will hide their signals and sever connections.`);
    if (!confirmed) return;

    try {
      const batch = writeBatch(db);
      
      // Add to blocked collection
      const blockedRef = doc(db, 'users', currentUser.uid, 'blocked', userData.id);
      batch.set(blockedRef, { blockedAt: serverTimestamp(), blockedBy: currentUser.uid });

      // Unfollow Logic
      const myFollowingRef = doc(db, 'users', currentUser.uid, 'following', userData.id);
      const theirFollowersRef = doc(db, 'users', userData.id, 'followers', currentUser.uid);
      
      batch.delete(myFollowingRef);
      batch.delete(theirFollowersRef);
      // We don't decrement counts here to simplify rules, or we assume cloud functions handle it.
      // But for client-side cleanliness, we can try if rules allow.
      // Let's stick to just the blocking for now, unfollow logic in App.tsx handles the full cleanup generally.
      
      await batch.commit();
      addToast("Node Blocked. Redirecting...", "success");
      // Could redirect to feed here
    } catch (e) {
      addToast("Block Protocol Failed", "error");
    }
  };

  // Privacy Check Logic
  const isPrivate = profileData.settings?.privacy?.profileVisibility === 'private';
  const canView = isOwnProfile || !isPrivate || (isPrivate && isFollowing);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'identity':
        return <div className="max-w-[2560px] mx-auto"><ProfileAboutSection userData={profileData} locale={locale} /></div>;
      case 'visuals':
        return <div className="max-w-[2560px] mx-auto"><ProfileVisualsSection posts={userPosts} onViewPost={onViewPost} /></div>;
      case 'resonance':
        return <div className="max-w-[2560px] mx-auto"><ProfileResonanceSection userData={profileData} /></div>;
      case 'chronology':
        return <div className="max-w-[2560px] mx-auto"><ProfileChronologySection userData={profileData} locale={locale} /></div>;
      case 'connections':
        return <div className="max-w-[2560px] mx-auto"><ProfileConnectionsSection userData={profileData} currentUser={userData} onViewProfile={(u) => console.log('View', u)} /></div>; 
      default:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[2560px] mx-auto items-start">
            <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-[calc(var(--header-h)+6rem)]">
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800">
                 <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-4 italic">Intro</h3>
                 <div className="space-y-4">
                    {profileData.statusMessage && profileData.settings?.privacy?.activityStatus !== false && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 italic">"{profileData.statusMessage}"</p>
                      </div>
                    )}
                    <p className="text-slate-700 dark:text-slate-300 text-center text-sm font-medium py-2 leading-relaxed">
                      {profileData.bio || 'Establish your neural signature in calibration...'}
                    </p>
                    <div className="h-px bg-slate-100 dark:bg-slate-800" />
                    <div className="space-y-4 py-2">
                       {profileData.occupation && (
                          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">ROLE:</span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase">{profileData.occupation}</span>
                          </div>
                       )}
                       {profileData.location && profileData.settings?.privacy?.showLocation !== false && (
                          <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">NODE:</span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase">{profileData.location}</span>
                          </div>
                       )}
                    </div>
                 </div>
              </div>
            </div>
            <div className="lg:col-span-7 space-y-4">
              <ProfileBroadcastingSection 
                posts={userPosts} 
                locale={locale} 
                userData={profileData}
                addToast={addToast}
                onViewPost={onViewPost}
                onLike={onLike}
                onBookmark={onBookmark}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="animate-in fade-in duration-1000 bg-[#f0f2f5] dark:bg-[#020617] min-h-screen pb-20 -mx-4 sm:-mx-6 md:-mx-10 lg:-mx-14 -mt-6">
      
      {/* 1. Header Profile Identity */}
      <ProfileHeader 
        userData={profileData} 
        onEdit={() => setIsEditModalOpen(true)} 
        addToast={addToast}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        onFollowToggle={handleFollowToggle}
        onOpenSettings={onOpenSettings}
        onBlock={handleBlock}
      />
      
      {/* 2. Privacy Check */}
      {!canView ? (
        <div className="mt-8 px-4 sm:px-6 md:px-10 lg:px-14 flex flex-col items-center justify-center py-20 text-center">
           <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 text-slate-400 shadow-inner">
              <div className="scale-150"><ICONS.Verified /></div>
           </div>
           <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2">Private_Node</h3>
           <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed mb-8">
             This profile is shielded. Establish a verified link to access neural data and signal history.
           </p>
           {!isOwnProfile && (
             <button 
                onClick={handleFollowToggle}
                className="px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-indigo-600 dark:hover:bg-indigo-400 transition-all shadow-xl active:scale-95"
             >
                {isFollowing ? 'REQUEST_SENT' : 'REQUEST_ACCESS'}
             </button>
           )}
        </div>
      ) : (
        <>
          {/* 3. Sticky Tab Navigation */}
          <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {/* 4. Content Area */}
          <div className="mt-8 px-4 sm:px-6 md:px-10 lg:px-14">
            {renderTabContent()}
          </div>
        </>
      )}

      {/* Edit Modal */}
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