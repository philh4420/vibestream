
import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { 
  collection, 
  query, 
  setDoc,
  doc, 
  orderBy, 
  limit, 
  onSnapshot,
  addDoc,
  serverTimestamp
} = Firestore as any;
import { Post, User, SystemSettings, AppRoute, Region } from '../../types';

// Components
import { AdminOverview } from './AdminOverview';
import { AdminUsers } from './AdminUsers';
import { AdminContent } from './AdminContent';
import { AdminProtocols } from './AdminProtocols';
import { AdminKernel } from './AdminKernel';
import { AdminHeader } from './AdminHeader';
import { AdminSupport } from './AdminSupport';
import { AdminPushTerminal } from './AdminPushTerminal';

interface AdminPanelProps {
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  locale: Region;
  systemSettings: SystemSettings;
  userData: User | null;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ addToast, locale, systemSettings, userData }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'content' | 'features' | 'support' | 'system' | 'push'>('overview');
  const [nodes, setNodes] = useState<User[]>([]);
  const [signals, setSignals] = useState<Post[]>([]);
  const [metrics, setMetrics] = useState({ users: 0, posts: 0, uptime: '99.99%' });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!db) return;

    // REAL DATA: Tracking Global Inhabitants (Users)
    const unsubNodes = onSnapshot(collection(db, 'users'), (snap: any) => {
      setNodes(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as User)));
      setMetrics(prev => ({ ...prev, users: snap.size }));
    });

    // REAL DATA: Tracking Signal Throughput (Posts)
    const unsubSignals = onSnapshot(query(collection(db, 'posts'), orderBy('timestamp', 'desc'), limit(100)), (snap: any) => {
      setSignals(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Post)));
      setMetrics(prev => ({ ...prev, posts: snap.size }));
    });

    return () => {
      unsubNodes();
      unsubSignals();
    };
  }, []);

  const handleToggleFeature = async (route: AppRoute, val: boolean) => {
    const updatedFlags = { ...(systemSettings.featureFlags || {}), [route]: val };
    try {
      // Use setDoc with merge: true to handle case where document doesn't exist yet
      await setDoc(doc(db, 'settings', 'global'), { featureFlags: updatedFlags }, { merge: true });
      addToast(`${route.toUpperCase()} Protocol modified`, 'success');
    } catch (e) { 
      console.error(e);
      addToast('Uplink failed: Buffer locked', 'error'); 
    }
  };

  const handleManageUser = async (userId: string, updates: Partial<User>) => {
    try {
      await setDoc(doc(db, 'users', userId), updates, { merge: true });
      addToast(`Node ${userId.slice(0, 5)} updated`, 'success');

      // Send System Notification
      let notifText = '';
      if (updates.verifiedHuman !== undefined) {
          notifText = updates.verifiedHuman 
            ? 'Your neural node has been officially verified by Citadel Command.' 
            : 'Verification badge has been revoked from your node.';
      } else if (updates.role) {
          notifText = `Your security clearance has been updated to: ${updates.role.toUpperCase()}`;
      } else if (updates.isSuspended !== undefined) {
          notifText = updates.isSuspended
            ? 'Your node has been suspended for protocol violation.'
            : 'Suspension lifted. Grid access restored.';
      }

      if (notifText) {
          await addDoc(collection(db, 'notifications'), {
              type: 'system',
              fromUserId: 'SYSTEM',
              fromUserName: 'Citadel Admin',
              fromUserAvatar: '', 
              toUserId: userId,
              text: notifText,
              isRead: false,
              timestamp: serverTimestamp(),
              pulseFrequency: 'resilience'
          });
      }

    } catch (e) {
      addToast('Update failed: Node authority clash', 'error');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverview metrics={metrics} />;
      case 'users':
        return <AdminUsers nodes={nodes} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onManage={handleManageUser} />;
      case 'content':
        return <AdminContent signals={signals} addToast={addToast} />;
      case 'features':
        return <AdminProtocols systemSettings={systemSettings} handleToggleFeature={handleToggleFeature} />;
      case 'support':
        return <AdminSupport addToast={addToast} />;
      case 'system':
        return <AdminKernel systemSettings={systemSettings} addToast={addToast} />;
      case 'push':
        return <AdminPushTerminal addToast={addToast} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col w-full max-w-[2400px] mx-auto min-h-full pb-24 text-slate-900 dark:text-white">
      {/* Sticky Navigation Dock */}
      <div className="sticky top-0 z-40 pt-2 pb-6 bg-gradient-to-b from-slate-50 via-slate-50/95 to-transparent dark:from-[#020617] dark:via-[#020617]/95 backdrop-blur-sm -mx-4 px-4 md:mx-0 md:px-0">
        <AdminHeader 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          locale={locale} 
          userData={userData}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {renderContent()}
      </div>
    </div>
  );
};
