
import React, { useState, useEffect, useMemo } from 'react';
import { User, Post, Region } from '../../types';
import { PostCard } from '../feed/PostCard';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, orderBy, updateDoc, doc } from 'firebase/firestore';
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

  // Real-time Uptime Tracker
  useEffect(() => {
    const updateUptime = () => {
      const diffMs = Date.now() - sessionStartTime;
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setCurrentUptime(`${diffHrs}h ${diffMins}m`);
    };

    updateUptime();
    const interval = setInterval(updateUptime, 60000); // Update every minute
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

  const signalQuality = useMemo(() => {
    const base = ((userData.followers || 0) / 10) + (userPosts.length * 2);
    const eventCount = (userData.lifeEvents?.length || 0) + 1;
    return Math.min(99.9, base + (eventCount * 5)).toFixed(1);
  }, [userData.followers, userPosts.length, userData.lifeEvents]);

  const chronologyLogs = useMemo(() => {
    const logs = [...(userData.lifeEvents || [])];
    if (userData.joinedAt) {
      logs.push({
        id: 'origin-node',
        title: 'Neural Node Established',
        date: userData.joinedAt,
        icon: '🚀'
      });
    }
    return logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [userData.lifeEvents, userData.joinedAt]);

  const renderBentoTile = (id: string, title: string, content: React.ReactNode, extra: React.ReactNode, bgColor: string = "bg-white") => {
    const isExpanded = expandedTile === id;
    return (
      <BentoTile 
        title={title} 
        onClick={() => {
          setExpandedTile(isExpanded ? null : id);
          if (!isExpanded) addToast(`Expanding ${title} Analytics`, 'info');
        }}
        className={`${bgColor} ${isExpanded ? 'md:col-span-2 md:row-span-2' : ''} transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden h-full relative`}
      >
        <div className="flex flex-col justify-between h-full">
          <div className="flex-1 flex flex-col justify-center">
            {content}
          </div>
          {isExpanded && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-6 pt-6 border-t border-slate-100/20">
              {extra}
            </div>
          )}
        </div>
      </BentoTile>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'identity':
        return <ProfileAboutSection userData={userData} locale={locale} />;
      case 'visuals':
        return <ProfileMedia posts={userPosts} />;
      case 'chronology':
        return (
          <div className="max-w-2xl mx-auto space-y-0 relative animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
            <div className="absolute left-[31px] top-8 bottom-8 w-px bg-slate-100 z-0" />
            {chronologyLogs.map((event) => (
              <div key={event.id} className="relative flex items-start gap-8 group mb-12 last:mb-0">
                <div className="relative z-10 shrink-0">
                  <div className="w-16 h-16 rounded-[1.4rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center justify-center text-3xl transition-transform group-hover:scale-110 duration-500">
                    {event.icon}
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.2em] font-mono mb-2">
                    {new Date(event.date).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                  <h4 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter leading-tight">{event.title}</h4>
                </div>
              </div>
            ))}
          </div>
        );
      case 'resonance':
        return (
          <div className="glass-panel rounded-[2.5rem] p-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-4">Neural_Resonance_Mesh</h3>
            <div className="flex justify-center -space-x-4">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="w-16 h-16 rounded-2xl bg-slate-100 border-4 border-white shadow-xl overflow-hidden ring-1 ring-slate-100 transition-transform hover:-translate-y-2">
                   <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=peer-${i}`} className="w-full h-full object-cover" alt="" />
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 auto-rows-min gap-4 md:gap-6">
              {renderBentoTile(
                'sig',
                'Signal_Quality',
                <>
                  <div className="text-4xl font-black tracking-tighter mb-2">{signalQuality}%</div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${signalQuality}%` }} />
                  </div>
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-4 font-mono">Optimised Node</p>
                </>,
                <div className="space-y-4">
                   <p className="text-xs text-slate-400 font-medium">Weekly engagement metrics show a <span className="text-emerald-500 font-bold">+12%</span> surge in organic resonance.</p>
                   <div className="flex gap-1 items-end h-16">
                      {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                        <div key={i} className="flex-1 bg-indigo-500/40 rounded-t-md hover:bg-indigo-500 transition-colors" style={{ height: `${h}%` }} />
                      ))}
                   </div>
                </div>,
                "bg-slate-950 text-white"
              )}
              
              {renderBentoTile(
                'res',
                'Resonance',
                <>
                  <div className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{(userData.followers || 0).toLocaleString(locale)}</div>
                  <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-2">+12.4% Net Rise</p>
                </>,
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 uppercase">
                    <span>Peak Reached</span>
                    <span className="text-slate-900 font-black">12:04 GMT</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[9px] font-bold text-slate-500 leading-relaxed uppercase">Top Node Cluster: London_Central</p>
                  </div>
                </div>
              )}

              {renderBentoTile(
                'up',
                'Uptime',
                <>
                  <div className="text-3xl font-black text-slate-900 tracking-tighter">{currentUptime}</div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 font-mono">Active Connection</p>
                </>,
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <p className="text-[8px] font-black text-indigo-400 uppercase">Latency</p>
                      <p className="text-xs font-bold text-indigo-600">12ms</p>
                    </div>
                    <div className="p-2 bg-emerald-50 rounded-lg">
                      <p className="text-[8px] font-black text-emerald-400 uppercase">Success</p>
                      <p className="text-xs font-bold text-emerald-600">99%</p>
                    </div>
                  </div>
                </div>
              )}

              {renderBentoTile(
                'trust',
                'Trust_Tier',
                <>
                  <div className="text-2xl font-black text-indigo-600 tracking-tighter uppercase italic">{userData.trustTier || 'Alpha'}</div>
                  <p className="text-[9px] text-slate-400 font-medium leading-tight">Priority Neural Routing Enabled</p>
                </>,
                <div className="space-y-2">
                   <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Permissions Unlocked:</p>
                   <ul className="text-[9px] space-y-1">
                      <li className="flex items-center gap-2 text-indigo-600 font-black">✓ HD_BROADCAST</li>
                      <li className="flex items-center gap-2 text-indigo-600 font-black">✓ UNLIMITED_STORAGE</li>
                   </ul>
                </div>
              )}
            </div>

            <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center justify-between px-4">
                <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] font-mono flex items-center gap-3">
                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></span> Broadcasting_Archive
                </h2>
              </div>
              {userPosts.length === 0 ? (
                <div className="glass-panel rounded-[3rem] py-32 text-center border-dashed border-2 border-slate-200">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Null Transmission Detected</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {userPosts.map(post => <PostCard key={post.id} post={post} onLike={() => {}} locale={locale} />)}
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="animate-in fade-in duration-1000 pb-20">
      <ProfileHeader userData={userData} onEdit={() => setIsEditModalOpen(true)} postCount={userPosts.length} />
      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="mt-8 px-4 md:px-0">{renderTabContent()}</div>
      {isEditModalOpen && (
        <CalibrationOverlay userData={userData} onClose={() => setIsEditModalOpen(false)} onSave={handleUpdateIdentity} />
      )}
    </div>
  );
};
