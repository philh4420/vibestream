
import * as FirebaseApp from 'firebase/app';
const { initializeApp, getApps, getApp } = FirebaseApp as any;
import * as FirebaseAppCheck from 'firebase/app-check';
const { initializeAppCheck, ReCaptchaV3Provider } = FirebaseAppCheck as any;
import * as Firestore from 'firebase/firestore';
const { initializeFirestore, getFirestore } = Firestore as any;
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
  app = initializeApp(CONFIG.FIREBASE, 'FALLBACK');
}

// App Check Implementation
if (isBrowser && CONFIG.APP_CHECK.reCaptchaSiteKey) {
  try {
    const siteKey = CONFIG.APP_CHECK.reCaptchaSiteKey;
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true
    });
    console.debug("VibeStream Protocol: App Check Signal Active.");
  } catch (err) {
    console.warn("VibeStream Protocol: App Check Handshake Failed.", err);
  }
}

/**
 * VIBESTREAM CONNECTIVITY FIX v2.0:
 * We use a more aggressive set of flags to bypass browser 'Access Control' check failures.
 * 1. experimentalForceLongPolling: Forces XHR instead of persistent fetch streams.
 * 2. useFetchStreams: false: Specifically tells the SDK NOT to use the modern Fetch API for 
 *    the long-lived 'Listen' channel, which often triggers the CORS 'access control' error 
 *    in proxied or sandboxed environments.
 */
let dbInstance;
try {
  dbInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    useFetchStreams: false,
  });
} catch (e) {
  // If already initialized, get current instance
  dbInstance = getFirestore(app);
}

export const db = dbInstance;
export const auth = getAuth(app);
export default app;
