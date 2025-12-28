
import * as FirebaseApp from 'firebase/app';
const { initializeApp, getApps, getApp } = FirebaseApp as any;
import * as FirebaseAppCheck from 'firebase/app-check';
const { initializeAppCheck, ReCaptchaV3Provider } = FirebaseAppCheck as any;
// Using namespace imports to resolve modular SDK export issues
import * as Firestore from 'firebase/firestore';
const { getFirestore } = Firestore as any;
import * as FirebaseAuth from 'firebase/auth';
const { getAuth } = FirebaseAuth as any;

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

// App Check Implementation - Standard Production Protocol
// NOTE: A 400 error here usually means the Key Type is wrong (Must be v3, not v2) or Domain Mismatch.
if (isBrowser && CONFIG.APP_CHECK.reCaptchaSiteKey) {
  try {
    const siteKey = CONFIG.APP_CHECK.reCaptchaSiteKey;
    
    // Initialize App Check with the ReCaptchaV3Provider
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true
    });
    
    console.debug("VibeStream Protocol: App Check Signal Active.");
  } catch (err) {
    console.warn("VibeStream Protocol: App Check Handshake Failed.", err);
  }
} else if (isBrowser) {
  console.debug("VibeStream Protocol: App Check bypassed (No Site Key detected in Config).");
}

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
