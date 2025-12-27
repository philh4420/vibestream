
import * as FirebaseApp from 'firebase/app';
const { initializeApp, getApps, getApp } = FirebaseApp as any;
import * as Firestore from 'firebase/firestore';
const { getFirestore } = Firestore as any;
import * as FirebaseAuth from 'firebase/auth';
const { getAuth } = FirebaseAuth as any;
import * as AppCheck from 'firebase/app-check';
const { initializeAppCheck, ReCaptchaV3Provider } = AppCheck as any;

import { CONFIG } from './config';

let app;

// Safety check for navigator presence before Firebase internal logic triggers
const isBrowser = typeof window !== 'undefined' && typeof window.navigator !== 'undefined';

try {
  const apps = getApps();
  if (apps.length > 0) {
    app = getApp();
  } else {
    app = initializeApp(CONFIG.FIREBASE);
  }
} catch (error) {
  console.error("VibeStream Protocol: Firebase Initialization Critical Error:", error);
  app = initializeApp(CONFIG.FIREBASE, 'FALLBACK');
}

// Initialize App Check with reCAPTCHA v3
if (isBrowser) {
  // Use a slight delay to ensure the environment/navigator is fully ready
  setTimeout(() => {
    try {
      if (app && window.navigator) {
        initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider('6LcV_pMqAAAAANmY2pE6_jDq1Zf-E3p6mX_9L8uN'),
          isTokenAutoRefreshEnabled: true
        });
      }
    } catch (err) {
      console.debug("VibeStream Alert: App Check initialization deferred or bypassed:", err);
    }
  }, 100);
}

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
