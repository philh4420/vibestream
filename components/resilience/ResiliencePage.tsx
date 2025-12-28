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
  const [activeTab, setActiveTab] = useState<'usage' | 'focus' | 'sync'>(() => {
    const saved = localStorage.getItem('vibe_resilience_tab');
    return (saved as any) || 'usage';
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

  // Calculate Vitality Score Logic (Web-Native Metrics)
  const calculateVitality = () => {
    let score = 75;
    // Positive Reinforcements
    if (userData.verifiedHuman) score += 5;
    if (userData.resonance && userData.resonance > 1000) score += 5;
    if (isFocusShieldActive) score += 5;
    
    // Balanced Interaction Check
    const following = userData.following || 1;
    const followers = userData.followers || 1;
    const ratio = followers / following;
    if (ratio > 0.5) score += 10; // Healthy social ratio
    
    return Math.min(100, score);
  };

  useEffect(() => {
    setVitalityScore(calculateVitality());
  }, [userData, isFocusShieldActive]);

  // Shield Toggle Handler (In-Platform Focus)
  const toggleFocusShield = async () => {
    if (!db || !userData.id) return;
    const newStatus: PresenceStatus = isFocusShieldActive ? 'Online' : 'Deep Work';
    const newMsg = isFocusShieldActive ? 'Systems nominal.' : 'In-Platform Focus Active. Direct Messages Muted.';
    
    try {
      await updateDoc(doc(db, 'users', userData.id), {
        presenceStatus: newStatus,
        statusMessage: newMsg
      });
      setIsFocusShieldActive(!isFocusShieldActive);
      addToast(isFocusShieldActive ? "Focus Shield Disengaged" : "In-Platform Shield Active", "success");
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
        {activeTab === 'usage' && <ResilienceMonitor userData={userData} />}
        
        {activeTab === 'focus' && (
          <ResilienceShield 
            isFocusShieldActive={isFocusShieldActive} 
            toggleFocusShield={toggleFocusShield} 
          />
        )}
        
        {activeTab === 'sync' && <ResilienceBreathing />}
      </div>

    </div>
  );
};