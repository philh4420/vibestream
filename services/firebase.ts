
import * as FirebaseApp from 'firebase/app';
const { initializeApp, getApps, getApp } = FirebaseApp as any;
import * as FirebaseAppCheck from 'firebase/app-check';
const { initializeAppCheck, ReCaptchaV3Provider } = FirebaseAppCheck as any;
// Using namespace imports to resolve modular SDK export issues
import * as Firestore from 'firebase/firestore';
const { initializeFirestore } = Firestore as any;
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

/**
 * VIBESTREAM CONNECTIVITY FIX:
 * We use initializeFirestore with experimentalForceLongPolling to prevent 
 * 'Access Control Checks' errors in restricted browser environments.
 */
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export const auth = getAuth(app);
export default app;
