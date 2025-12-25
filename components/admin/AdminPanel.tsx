
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
  onSnapshot 
} = Firestore as any;
import { Post, User, SystemSettings, AppRoute, Region } from '../../types';

// Components
import { AdminOverview } from './AdminOverview';
import { AdminUsers } from './AdminUsers';
import { AdminContent } from './AdminContent';
import { AdminProtocols } from './AdminProtocols';
import { AdminKernel } from './AdminKernel';
import { AdminHeader } from './AdminHeader';

interface AdminPanelProps {
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  locale: Region;
  systemSettings: SystemSettings;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ addToast, locale, systemSettings }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'content' | 'features' | 'system'>('overview');
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
      case 'system':
        return <AdminKernel systemSettings={systemSettings} addToast={addToast} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col w-full max-w-[2400px] mx-auto min-h-full pb-24 text-slate-900 dark:text-white">
      {/* Sticky Navigation Dock */}
      <div className="sticky top-0 z-40 pt-2 pb-6 bg-gradient-to-b from-[#fcfcfd] via-[#fcfcfd]/95 to-transparent dark:from-slate-900 dark:via-slate-900/95 backdrop-blur-sm -mx-4 px-4 md:mx-0 md:px-0">
        <AdminHeader 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          locale={locale} 
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {renderContent()}
      </div>
    </div>
  );
};
