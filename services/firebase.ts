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
 * VIBESTREAM CONNECTIVITY FIX v2.1:
 * Enforcing XHR Long Polling to bypass strict CORS environments.
 * This explicitly disables the modern Fetch API streams for the Listen channel.
 */
let dbInstance;
try {
  dbInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true, // Forces XHR over Fetch Streams
    useFetchStreams: false,             // Explicitly disable fetch streams
    ignoreUndefinedProperties: true     // Prevents crashes on undefined data
  });
  console.log("VibeStream Protocol: Firestore initialized with Long-Polling strategy.");
} catch (e) {
  // Fallback if already initialized (e.g. via HMR or shared lib)
  dbInstance = getFirestore(app);
  console.warn("VibeStream Protocol: Using existing Firestore instance.");
}

export const db = dbInstance;
export const auth = getAuth(app);
export default app;