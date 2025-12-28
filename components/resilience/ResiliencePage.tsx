
import React, { useState, useEffect } from 'react';
import { User, PresenceStatus } from '../../types';
import { db } from '../../services/firebase';
import * as Firestore from 'firebase/firestore';
const { doc, updateDoc } = Firestore as any;

// Modular Components
import { ResilienceHero } from './ResilienceHero';
import { ResilienceNav } from './ResilienceNav';
import { ResilienceMonitor } from './ResilienceMonitor';
import { ResilienceShield } from './ResilienceShield';
import { ResilienceBreathing } from './ResilienceBreathing';

interface ResiliencePageProps {
  userData: User;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ResiliencePage: React.FC<ResiliencePageProps> = ({ userData, addToast }) => {
  const [activeTab, setActiveTab] = useState<'monitor' | 'shield' | 'breath'>(() => {
    const saved = localStorage.getItem('vibe_resilience_tab');
    return (saved as any) || 'monitor';
  });

  useEffect(() => {
    localStorage.setItem('vibe_resilience_tab', activeTab);
  }, [activeTab]);

  const [vitalityScore, setVitalityScore] = useState(85);
  const [isFocusShieldActive, setIsFocusShieldActive] = useState(false);

  // Sync Focus Status from User Data
  useEffect(() => {
    setIsFocusShieldActive(['Deep Work', 'Focus', 'Invisible'].includes(userData.presenceStatus || ''));
  }, [userData.presenceStatus]);

  // Calculate Vitality Score Logic
  const calculateVitality = () => {
    let score = 80;
    if (userData.verifiedHuman) score += 5;
    if (userData.followers > 10) score += 5;
    if (userData.following < 500) score += 5;
    if (isFocusShieldActive) score += 5;
    return Math.min(100, score);
  };

  useEffect(() => {
    setVitalityScore(calculateVitality());
  }, [userData, isFocusShieldActive]);

  // Shield Toggle Handler
  const toggleFocusShield = async () => {
    if (!db || !userData.id) return;
    const newStatus: PresenceStatus = isFocusShieldActive ? 'Online' : 'Deep Work';
    const newMsg = isFocusShieldActive ? 'Systems nominal.' : 'Neural Shield Active. Notifications Muted.';
    
    try {
      await updateDoc(doc(db, 'users', userData.id), {
        presenceStatus: newStatus,
        statusMessage: newMsg
      });
      setIsFocusShieldActive(!isFocusShieldActive);
      addToast(isFocusShieldActive ? "Focus Shield Disengaged" : "Focus Shield Active", "success");
    } catch (e) {
      addToast("Shield Protocol Failed", "error");
    }
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto pb-24 animate-in fade-in duration-700 space-y-8 px-4 md:px-8">
      
      {/* 1. Vitality Engine Header */}
      <ResilienceHero vitalityScore={vitalityScore} />

      {/* 2. Navigation Pill */}
      <ResilienceNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 3. Module Content Swapper */}
      <div className="min-h-[500px]">
        {activeTab === 'monitor' && <ResilienceMonitor userData={userData} />}
        
        {activeTab === 'shield' && (
          <ResilienceShield 
            isFocusShieldActive={isFocusShieldActive} 
            toggleFocusShield={toggleFocusShield} 
          />
        )}
        
        {activeTab === 'breath' && <ResilienceBreathing />}
      </div>

    </div>
  );
};
