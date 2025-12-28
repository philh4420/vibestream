
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

  // UI Limiters State
  const [grayscaleMode, setGrayscaleMode] = useState(false);
  const [mediaFog, setMediaFog] = useState(false);
  const [reducedKinetic, setReducedKinetic] = useState(false);

  useEffect(() => {
    localStorage.setItem('vibe_resilience_tab', activeTab);
  }, [activeTab]);

  // Apply Global UI Filters
  useEffect(() => {
    const root = document.documentElement;
    if (grayscaleMode) root.style.filter = 'grayscale(100%)';
    else root.style.filter = 'none';

    if (mediaFog) document.body.classList.add('vibe-media-fog');
    else document.body.classList.remove('vibe-media-fog');

    if (reducedKinetic) root.classList.add('reduced-motion');
    else root.classList.remove('reduced-motion');

    return () => {
      root.style.filter = 'none';
      document.body.classList.remove('vibe-media-fog');
      root.classList.remove('reduced-motion');
    };
  }, [grayscaleMode, mediaFog, reducedKinetic]);

  const [vitalityScore, setVitalityScore] = useState(85);
  const [isFocusShieldActive, setIsFocusShieldActive] = useState(false);

  useEffect(() => {
    setIsFocusShieldActive(['Deep Work', 'Focus', 'Invisible'].includes(userData.presenceStatus || ''));
  }, [userData.presenceStatus]);

  const calculateVitality = () => {
    let score = 70;
    if (userData.verifiedHuman) score += 10;
    if (userData.resonance && userData.resonance > 1000) score += 5;
    if (isFocusShieldActive) score += 10;
    if (grayscaleMode || mediaFog) score += 5;
    return Math.min(100, score);
  };

  useEffect(() => {
    setVitalityScore(calculateVitality());
  }, [userData, isFocusShieldActive, grayscaleMode, mediaFog]);

  const toggleFocusShield = async () => {
    if (!db || !userData.id) return;
    const isActivating = !isFocusShieldActive;
    const newStatus: PresenceStatus = isActivating ? 'Deep Work' : 'Online';
    const newMsg = isActivating ? 'In-Platform Focus Active. Signals Muted.' : 'Systems nominal.';
    
    try {
      await updateDoc(doc(db, 'users', userData.id), {
        presenceStatus: newStatus,
        statusMessage: newMsg
      });
      setIsFocusShieldActive(isActivating);
      
      // Auto-enable limiters if activating shield
      if (isActivating) {
        setMediaFog(true);
        setReducedKinetic(true);
      } else {
        setMediaFog(false);
        setReducedKinetic(false);
        setGrayscaleMode(false);
      }

      addToast(isActivating ? "Focus Shield Engaged: Media Suppressed" : "Focus Shield Disengaged", "success");
    } catch (e) {
      addToast("Shield Protocol Failed", "error");
    }
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto pb-24 animate-in fade-in duration-700 space-y-8 px-4 md:px-8">
      
      <ResilienceHero vitalityScore={vitalityScore} />

      <ResilienceNav activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="min-h-[500px]">
        {activeTab === 'usage' && <ResilienceMonitor userData={userData} />}
        
        {activeTab === 'focus' && (
          <ResilienceShield 
            isFocusShieldActive={isFocusShieldActive} 
            toggleFocusShield={toggleFocusShield} 
            limiters={{
                grayscale: grayscaleMode,
                fog: mediaFog,
                kinetic: reducedKinetic
            }}
            onToggleLimiter={(type) => {
                if (type === 'grayscale') setGrayscaleMode(!grayscaleMode);
                if (type === 'fog') setMediaFog(!mediaFog);
                if (type === 'kinetic') setReducedKinetic(!reducedKinetic);
                addToast("Limiter Protocol Synchronized", "info");
            }}
          />
        )}
        
        {activeTab === 'sync' && <ResilienceBreathing />}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .vibe-media-fog img, .vibe-media-fog video {
          filter: blur(20px) grayscale(50%);
          opacity: 0.3;
          transition: all 0.5s ease;
        }
        .vibe-media-fog img:hover, .vibe-media-fog video:hover {
          filter: blur(0px) grayscale(0%);
          opacity: 1;
        }
      `}} />
    </div>
  );
};
