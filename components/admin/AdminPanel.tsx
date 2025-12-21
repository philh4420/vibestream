
import React, { useState, useEffect } from 'react';
import { db, auth } from '../../services/firebase';
import { 
  collection, 
  query, 
  updateDoc, 
  doc, 
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import { Post, User, SystemSettings, AppRoute, Region } from '../../types';
import { ICONS } from '../../constants';

// Refactored Sub-Components
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
    const unsubNodes = onSnapshot(collection(db, 'users'), (snap) => {
      setNodes(snap.docs.map(d => ({ id: d.id, ...d.data() } as User)));
      setMetrics(prev => ({ ...prev, users: snap.size }));
    });

    // REAL DATA: Tracking Signal Throughput (Posts)
    const unsubSignals = onSnapshot(query(collection(db, 'posts'), orderBy('timestamp', 'desc'), limit(100)), (snap) => {
      setSignals(snap.docs.map(d => ({ id: d.id, ...d.data() } as Post)));
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
      await updateDoc(doc(db, 'settings', 'global'), { featureFlags: updatedFlags });
      addToast(`${route.toUpperCase()} Protocol modified`, 'success');
    } catch (e) { addToast('Uplink failed: Buffer locked', 'error'); }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverview metrics={metrics} />;
      case 'users':
        return <AdminUsers nodes={nodes} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />;
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
    <div className="min-h-screen bg-[#f8fafc] flex flex-col pb-12 overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      
      {/* 1. MASTER COMMAND HEADER */}
      <AdminHeader 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        locale={locale} 
      />

      {/* 2. OPERATIONAL DATA VIEWPORT */}
      <div className="flex-1 overflow-y-auto no-scrollbar scroll-container px-4 md:px-8">
        <div className="max-w-[1440px] mx-auto w-full">
          {renderContent()}
        </div>
      </div>

    </div>
  );
};
