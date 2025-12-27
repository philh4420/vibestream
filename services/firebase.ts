
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

try {
  const apps = getApps();
  if (apps.length > 0) {
    app = getApp();
  } else {
    app = initializeApp(CONFIG.FIREBASE);
  }
} catch (error) {
  console.error("Firebase Initialization Critical Error:", error);
  app = initializeApp(CONFIG.FIREBASE, 'FALLBACK');
}

// Initialize App Check with reCAPTCHA v3
if (typeof window !== 'undefined') {
  try {
    // Ensure the site key is correctly set for reCAPTCHA v3
    // Note: 401 errors for 'pat' indicate the domain is not whitelisted in the reCAPTCHA/Firebase console
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider('6LcV_pMqAAAAANmY2pE6_jDq1Zf-E3p6mX_9L8uN'),
      isTokenAutoRefreshEnabled: true
    });
  } catch (err) {
    console.warn("App Check initialization failed:", err);
  }
}

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
