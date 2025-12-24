
import React, { useState, useEffect } from 'react';
// Fixed: Using namespaced import for firebase/auth to resolve "no exported member" errors
import * as FirebaseAuth from 'firebase/auth';
const { onAuthStateChanged, signOut } = FirebaseAuth as any;
// Fixed: Using namespaced import for firebase/firestore to resolve "no exported member" errors
import * as Firestore from 'firebase/firestore';
const { 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  orderBy, 
  limit, 
  where, 
  writeBatch, 
  serverTimestamp, 
  arrayRemove, 
  arrayUnion, 
  getDoc,
  updateDoc,
  deleteDoc
} = Firestore as any;
import { auth, db } from './services/firebase';
import { 
  User, 
  AppRoute, 
  AppNotification, 
  Post, 
  Gathering, 
  ToastMessage, 
  WeatherInfo, 
  LiveStream, 
  CallSession,
  SystemSettings
} from './types';

// Components
import { LandingPage } from './components/landing/LandingPage';
import { Layout } from './components/layout/Layout';
import { FeedPage } from './components/feed/FeedPage';
import { ExplorePage } from './components/explore/ExplorePage';
import { MessagesPage } from './components/messages/MessagesPage';
import { NotificationsPage } from './components/notifications/NotificationsPage';
import { ProfilePage } from './components/profile/ProfilePage';
import { AdminPanel } from './components/admin/AdminPanel';
import { PrivacyPage } from './components/legal/PrivacyPage';
import { TermsPage } from './components/legal/TermsPage';
import { CookiesPage } from './components/legal/CookiesPage';
import { MeshPage } from './components/mesh/MeshPage';
import { ClustersPage } from './components/clusters/ClustersPage';
import { StreamGridPage } from './components/streams/StreamGridPage';
import { TemporalPage } from './components/temporal/TemporalPage';
import { DataVaultPage } from './components/vault/DataVaultPage';
import { VerifiedNodesPage } from './components/explore/VerifiedNodesPage';
import { GatheringsPage } from './components/gatherings/GatheringsPage';
import { SingleGatheringView } from './components/gatherings/SingleGatheringView';
import { SinglePostView } from './components/feed/SinglePostView';
import { Toast } from './components/ui/Toast';
import { LiveBroadcastOverlay } from './components/streams/LiveBroadcastOverlay';
import { LiveWatcherOverlay } from './components/streams/LiveWatcherOverlay';
import { NeuralLinkOverlay } from './components/messages/NeuralLinkOverlay';

// Services
import { fetchWeather } from './services/weather';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [activeRoute, setActiveRoute] = useState<AppRoute>(AppRoute.FEED);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    registrationDisabled: false,
    minTrustTier: 'Gamma',
    lastUpdatedBy: 'SYSTEM',
    updatedAt: new Date().toISOString(),
    featureFlags: {}
  });

  // Global Data
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [globalPosts, setGlobalPosts] = useState<Post[]>([]);
  
  // Selection States
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedGathering, setSelectedGathering] = useState<Gathering | null>(null);
  
  // Streaming & Calling
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null);
  const [watchingStream, setWatchingStream] = useState<LiveStream | null>(null);
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);

  // RSVP Processing Lock
  const [rsvpProcessing, setRsvpProcessing] = useState<Set<string>>(new Set());

  // --- AUTH & USER SYNC ---
  useEffect(() => {
    // Safety Timeout: Force stop loading if Auth listener hangs or network fails
    const safetyTimer = setTimeout(() => {
        setLoading((current) => {
            if (current) {
                console.warn("VibeStream Protocol: Auth handshake timed out. Forcing entry.");
                return false;
            }
            return current;
        });
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (authUser: any) => {
      clearTimeout(safetyTimer);
      
      if (authUser) {
        setUser(authUser);
        
        // Sync User Data & Check for Ghost Session
        const userRef = doc(db, 'users', authUser.uid);
        const unsubUser = onSnapshot(userRef, (docSnap: any) => {
          if (docSnap.exists()) {
            // Valid User Profile Found
            const data = docSnap.data() as User;
            setUserData({ ...data, id: docSnap.id });
            
            // Fetch Weather based on location
            if (data.location) {
              fetchWeather({ query: data.location })
                .then(setWeather)
                .catch(err => console.warn("Atmospheric sync deferred:", err));
            }
            setLoading(false); // Stop spinner
          } else {
            // GHOST SESSION DETECTED: Auth exists, but DB Doc is gone.
            console.warn("VibeStream: Neural Phantom Detected. Purging stale session.");
            signOut(auth).then(() => {
              setUser(null);
              setUserData(null);
              setLoading(false); // Stop spinner, show Landing Page
            }).catch(() => {
              // Force state reset even if network logout fails
              setUser(null);
              setLoading(false);
            });
          }
        }, (error: any) => {
           console.error("Grid Sync Interrupted:", error);
           // If we can't read the doc (permission denied?), assume we need to re-auth
           setLoading(false);
        });

        // Sync Notifications (Non-blocking)
        const notifQuery = query(
          collection(db, 'notifications'), 
          where('toUserId', '==', authUser.uid), 
          orderBy('timestamp', 'desc'), 
          limit(50)
        );
        const unsubNotif = onSnapshot(notifQuery, (snap: any) => {
          setNotifications(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as AppNotification)));
        }, (e: any) => console.debug("Notif bus silent"));

        // Sync Calls (Non-blocking)
        const callQuery = query(
          collection(db, 'calls'),
          where('receiverId', '==', authUser.uid),
          where('status', '==', 'ringing'),
          limit(1)
        );
        const unsubCalls = onSnapshot(callQuery, (snap: any) => {
          if (!snap.empty) {
            setActiveCall({ id: snap.docs[0].id, ...snap.docs[0].data() } as CallSession);
          }
        }, (e: any) => console.debug("Call bus silent"));

        return () => {
          unsubUser();
          unsubNotif();
          unsubCalls();
        };
      } else {
        // No Auth User
        setUser(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
        clearTimeout(safetyTimer);
        unsubscribe();
    }
  }, []);

  // --- GLOBAL DATA SYNC ---
  useEffect(() => {
    if (!user) return;

    // Sync Settings
    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (doc: any) => {
      if (doc.exists()) setSystemSettings(doc.data() as SystemSettings);
    });

    // Sync All Users (Lightweight)
    const unsubUsers = onSnapshot(query(collection(db, 'users'), limit(100)), (snap: any) => {
      setAllUsers(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as User)));
    });

    // Sync Feed Posts
    const unsubPosts = onSnapshot(query(collection(db, 'posts'), orderBy('timestamp', 'desc'), limit(50)), (snap: any) => {
      setGlobalPosts(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Post)));
    });

    return () => {
      unsubSettings();
      unsubUsers();
      unsubPosts();
    };
  }, [user]);

  // --- ACTIONS ---

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleLogout = async () => {
    try {
      if (userData?.id) {
        await updateDoc(doc(db, 'users', userData.id), { presenceStatus: 'Offline' });
      }
      await signOut(auth);
      setUser(null);
      setUserData(null);
      setActiveRoute(AppRoute.FEED);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreatePost = (initialFiles?: File[]) => {
    // Logic handled in FeedPage mostly, but triggered via layout
    addToast("Signal Composer Active", "info");
  };

  // --- RSVP LOGIC ---
  const handleRSVP = async (gatheringId: string, isAttendingOrWaitlisted: boolean) => {
    if (!db || !userData || rsvpProcessing.has(gatheringId)) return;
    
    // Lock this gathering
    setRsvpProcessing(prev => new Set(prev).add(gatheringId));

    try {
      const gatheringRef = doc(db, 'gatherings', gatheringId);
      const freshSnap = await getDoc(gatheringRef);
      if (!freshSnap.exists()) return;
      
      const currentData = freshSnap.data() as Gathering;
      const userId = userData.id;
      const isCurrentlyAttending = currentData.attendees.includes(userId);
      const isCurrentlyWaitlisted = currentData.waitlist?.includes(userId);
      const max = currentData.maxAttendees || 0;
      const currentCount = currentData.attendees.length;

      const batch = writeBatch(db);
      let successMessage = "";
      let successType: 'success' | 'info' = 'info';

      if (isAttendingOrWaitlisted) {
        // Withdrawing
        if (isCurrentlyAttending) {
            batch.update(gatheringRef, { attendees: arrayRemove(userId) });
            
            // Auto-promote
            if (currentData.waitlist && currentData.waitlist.length > 0) {
                const nextUserId = currentData.waitlist[0];
                batch.update(gatheringRef, { 
                    waitlist: arrayRemove(nextUserId),
                    attendees: arrayUnion(nextUserId) 
                });

                const notifRef = doc(collection(db, 'notifications'));
                batch.set(notifRef, {
                    type: 'gathering_promote',
                    fromUserId: 'SYSTEM',
                    fromUserName: 'VibeStream Protocol',
                    fromUserAvatar: '',
                    toUserId: nextUserId,
                    targetId: gatheringId,
                    text: `You have been promoted from the waitlist for "${currentData.title}"`,
                    isRead: false,
                    timestamp: serverTimestamp(),
                    pulseFrequency: 'velocity'
                });
            }

            if (currentData.linkedChatId) {
                batch.update(doc(db, 'chats', currentData.linkedChatId), {
                    participants: arrayRemove(userId)
                });
            }
            successMessage = "Withdrawn from Gathering";
            successType = "info";

        } else if (isCurrentlyWaitlisted) {
            batch.update(gatheringRef, { waitlist: arrayRemove(userId) });
            successMessage = "Removed from Waitlist";
            successType = "info";
        }

      } else {
        // Joining
        if (max > 0 && currentCount >= max) {
            batch.update(gatheringRef, { waitlist: arrayUnion(userId) });
            successMessage = "Joined Waitlist";
            successType = "info";
        } else {
            batch.update(gatheringRef, { attendees: arrayUnion(userId) });
            
            if (currentData.linkedChatId) {
                const chatRef = doc(db, 'chats', currentData.linkedChatId);
                const participantUpdate: any = {};
                participantUpdate[`participantData.${userId}`] = { 
                    displayName: userData.displayName, 
                    avatarUrl: userData.avatarUrl 
                };
                batch.update(chatRef, { 
                    participants: arrayUnion(userId),
                    ...participantUpdate
                });
            }
            successMessage = "RSVP Confirmed";
            successType = "success";
        }
      }

      await batch.commit();
      if (successMessage) addToast(successMessage, successType);

    } catch (e) {
      console.error(e);
      addToast("RSVP Protocol Failed", "error");
    } finally {
      // Release lock
      setRsvpProcessing(prev => { const n = new Set(prev); n.delete(gatheringId); return n; });
    }
  };

  // --- RENDER ---

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] font-mono animate-pulse">Initializing_Grid...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage onEnter={() => {}} systemSettings={systemSettings} />;
  }

  return (
    <>
      <Layout
        activeRoute={activeRoute}
        onNavigate={setActiveRoute}
        onOpenCreate={() => handleCreatePost()}
        onLogout={handleLogout}
        userRole={userData?.role}
        userData={userData}
        notifications={notifications}
        onMarkRead={() => {
          const batch = writeBatch(db);
          notifications.filter(n => !n.isRead).forEach(n => {
            batch.update(doc(db, 'notifications', n.id), { isRead: true });
          });
          batch.commit();
        }}
        onDeleteNotification={(id) => deleteDoc(doc(db, 'notifications', id))}
        currentRegion="en-GB"
        onRegionChange={() => {}}
        onSearch={() => {}}
        weather={weather}
      >
        {activeRoute === AppRoute.FEED && (
          <FeedPage 
            posts={globalPosts} 
            userData={userData}
            locale="en-GB"
            onLike={() => {}}
            onBookmark={() => {}}
            onViewPost={(post) => { setSelectedPost(post); setActiveRoute(AppRoute.SINGLE_POST); }}
            onOpenCreate={() => handleCreatePost()}
            onTransmitStory={() => {}}
            onGoLive={() => {
               // Logic to start live stream (simplified)
               setActiveStreamId(`stream_${user.uid}`);
            }}
            onJoinStream={(stream) => setWatchingStream(stream)}
          />
        )}

        {activeRoute === AppRoute.EXPLORE && (
          <ExplorePage 
            posts={globalPosts}
            users={allUsers}
            onLike={() => {}}
            onBookmark={() => {}}
            onViewPost={(post) => { setSelectedPost(post); setActiveRoute(AppRoute.SINGLE_POST); }}
            locale="en-GB"
          />
        )}

        {activeRoute === AppRoute.MESSAGES && userData && (
          <MessagesPage 
            currentUser={userData}
            locale="en-GB"
            addToast={addToast}
            weather={weather}
            allUsers={allUsers}
          />
        )}

        {activeRoute === AppRoute.NOTIFICATIONS && (
          <NotificationsPage 
            notifications={notifications}
            onDelete={(id) => deleteDoc(doc(db, 'notifications', id))}
            onMarkRead={() => {}}
            addToast={addToast}
            locale="en-GB"
            userData={userData}
          />
        )}

        {activeRoute === AppRoute.PROFILE && userData && (
          <ProfilePage 
            userData={userData}
            onUpdateProfile={() => {}}
            addToast={addToast}
            locale="en-GB"
            sessionStartTime={Date.now()}
            onViewPost={(post) => { setSelectedPost(post); setActiveRoute(AppRoute.SINGLE_POST); }}
          />
        )}

        {activeRoute === AppRoute.CLUSTERS && userData && (
          <ClustersPage 
            currentUser={userData}
            locale="en-GB"
            addToast={addToast}
            onOpenChat={() => {}}
            allUsers={allUsers}
            weather={weather}
          />
        )}

        {activeRoute === AppRoute.STREAM_GRID && (
          <StreamGridPage 
            locale="en-GB"
            onJoinStream={(stream) => setWatchingStream(stream)}
            onGoLive={() => setActiveStreamId(`stream_${user.uid}`)}
            userData={userData}
            onTransmit={() => {}}
          />
        )}

        {activeRoute === AppRoute.GATHERINGS && userData && (
          <GatheringsPage 
            currentUser={userData}
            locale="en-GB"
            addToast={addToast}
            onViewGathering={(g) => { setSelectedGathering(g); setActiveRoute(AppRoute.SINGLE_GATHERING); }}
            onRSVP={handleRSVP}
            allUsers={allUsers}
            onOpenLobby={() => {}}
          />
        )}

        {activeRoute === AppRoute.SINGLE_GATHERING && selectedGathering && userData && (
          <SingleGatheringView 
            gathering={selectedGathering}
            currentUser={userData}
            allUsers={allUsers}
            locale="en-GB"
            onBack={() => { setSelectedGathering(null); setActiveRoute(AppRoute.GATHERINGS); }}
            onDelete={(id) => {
               deleteDoc(doc(db, 'gatherings', id));
               setActiveRoute(AppRoute.GATHERINGS);
            }}
            onRSVP={handleRSVP}
            onOpenLobby={() => {}}
          />
        )}

        {activeRoute === AppRoute.SINGLE_POST && selectedPost && (
          <SinglePostView 
            post={selectedPost}
            userData={userData}
            locale="en-GB"
            onClose={() => { setSelectedPost(null); setActiveRoute(AppRoute.FEED); }}
            onLike={() => {}}
            onBookmark={() => {}}
            addToast={addToast}
          />
        )}

        {/* Other Pages */}
        {activeRoute === AppRoute.MESH && userData && <MeshPage currentUser={userData} locale="en-GB" addToast={addToast} onViewProfile={() => {}} />}
        {activeRoute === AppRoute.TEMPORAL && <TemporalPage currentUser={userData} locale="en-GB" addToast={addToast} />}
        {activeRoute === AppRoute.SAVED && userData && <DataVaultPage currentUser={userData} locale="en-GB" addToast={addToast} onViewPost={() => {}} />}
        {activeRoute === AppRoute.VERIFIED_NODES && <VerifiedNodesPage users={allUsers} onViewProfile={() => {}} />}
        {activeRoute === AppRoute.ADMIN && <AdminPanel addToast={addToast} locale="en-GB" systemSettings={systemSettings} />}
        {activeRoute === AppRoute.PRIVACY && <PrivacyPage />}
        {activeRoute === AppRoute.TERMS && <TermsPage />}
        {activeRoute === AppRoute.COOKIES && <CookiesPage />}

        {/* Placeholders for routes without explicit components in list */}
        {(activeRoute === AppRoute.SIMULATIONS || activeRoute === AppRoute.RESILIENCE) && (
           <div className="flex items-center justify-center h-full text-slate-400 font-mono text-sm uppercase tracking-widest">
             Module Under Construction
           </div>
        )}

      </Layout>

      {/* OVERLAYS */}
      {toasts.map(t => (
        <div key={t.id} className="fixed top-24 right-6 z-[3000]">
          <Toast toast={t} onClose={removeToast} />
        </div>
      ))}

      {activeStreamId && userData && (
        <LiveBroadcastOverlay 
          userData={userData} 
          onStart={() => {}} 
          onEnd={() => setActiveStreamId(null)} 
          activeStreamId={activeStreamId} 
        />
      )}

      {watchingStream && (
        <LiveWatcherOverlay 
          stream={watchingStream} 
          onLeave={() => setWatchingStream(null)} 
        />
      )}

      {activeCall && userData && (
        <NeuralLinkOverlay 
          session={activeCall} 
          userData={userData} 
          onEnd={() => setActiveCall(null)} 
        />
      )}
    </>
  );
}
