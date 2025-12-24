
import * as FirebaseApp from 'firebase/app';
const { initializeApp, getApps, getApp } = FirebaseApp as any;
import * as Firestore from 'firebase/firestore';
const { getFirestore } = Firestore as any;
import * as FirebaseAuth from 'firebase/auth';
const { getAuth } = FirebaseAuth as any;
import * as FirebaseAppCheck from 'firebase/app-check';
const { initializeAppCheck, ReCaptchaEnterpriseProvider } = FirebaseAppCheck as any;

import { CONFIG } from './config';

let app;

try {
  const apps = getApps();
  if (apps.length > 0) {
    app = getApp();
  } else {
    app = initializeApp(CONFIG.FIREBASE);
  }
} catch (error) {
  console.error("Firebase Initialization Critical Error:", error);
  // Fallback for development/testing
  app = initializeApp(CONFIG.FIREBASE, 'FALLBACK');
}

// Initialize App Check (ReCAPTCHA Enterprise)
if (typeof window !== 'undefined' && app) {
  try {
    const siteKey = '6LcKoTUsAAAAANZFWpqjBcaKUCMCMJv8YF7YhyS6';
    
    // Initialize with the provided key
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true
    });
    
    console.debug('VibeStream Security: App Check Shield Active');
  } catch (e) {
    // This usually happens in local dev environments if debug tokens aren't set, 
    // or if the window object isn't fully available yet.
    console.warn('App Check initialization bypassed:', e);
  }
}

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
