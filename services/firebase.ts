

import * as FirebaseApp from 'firebase/app';
const { initializeApp, getApps, getApp } = FirebaseApp as any;
// Using namespace imports to resolve modular SDK export issues
import * as Firestore from 'firebase/firestore';
const { getFirestore } = Firestore as any;
import * as FirebaseAuth from 'firebase/auth';
const { getAuth } = FirebaseAuth as any;
import * as FirebaseAppCheck from 'firebase/app-check';
const { initializeAppCheck, ReCaptchaV3Provider } = FirebaseAppCheck as any;

import { CONFIG } from './config';

// Safety check for browser environment
const isBrowser = typeof window !== 'undefined' && typeof window.navigator !== 'undefined';

let app;

try {
  const apps = getApps();
  if (apps.length > 0) {
    app = getApp();
  } else {
    app = initializeApp(CONFIG.FIREBASE);
  }
} catch (error) {
  console.error("VibeStream Protocol: Firebase Initialization Critical Error:", error);
  // Fallback to a secondary initialization if necessary
  app = initializeApp(CONFIG.FIREBASE, 'FALLBACK');
}

// Initialize App Check with reCAPTCHA v3
if (isBrowser) {
  // Use a slight delay to ensure the browser environment is fully ready for background tasks
  setTimeout(() => {
    try {
      if (app && window.navigator) {
        initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider('6LcV_pMqAAAAANmY2pE6_jDq1Zf-E3p6mX_9L8uN'),
          isTokenAutoRefreshEnabled: true
        });
      }
    } catch (err) {
      console.debug("VibeStream Alert: App Check initialization deferred:", err);
    }
  }, 200);
}

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;