
import * as FirebaseApp from 'firebase/app';
const { initializeApp, getApps, getApp } = FirebaseApp as any;
import * as Firestore from 'firebase/firestore';
const { getFirestore } = Firestore as any;
import * as FirebaseAuth from 'firebase/auth';
const { getAuth } = FirebaseAuth as any;
import * as FirebaseAppCheck from 'firebase/app-check';
const { initializeAppCheck, ReCaptchaV3Provider } = FirebaseAppCheck as any;

import { CONFIG } from './config';

// Enable local debug token for App Check to prevent 400 errors during development
// Check if window exists to support SSR/build environments
if (typeof window !== 'undefined') {
  // Use a more robust check for localhost including IPv6
  const isLocalhost = Boolean(
    window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
  );

  if (isLocalhost) {
    // @ts-ignore
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    console.debug('VibeStream Security: App Check Debug Token Enabled for Localhost');
  }
}

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

// Initialize App Check (ReCAPTCHA v3)
if (typeof window !== 'undefined' && app) {
  try {
    const siteKey = '6LcKoTUsAAAAANZFWpqjBcaKUCMCMJv8YF7YhyS6';
    
    // Initialize with the provided key using ReCaptchaV3Provider
    // Note: ReCAPTCHA v3 keys created in the standard admin console must use ReCaptchaV3Provider.
    // Enterprise keys use ReCaptchaEnterpriseProvider.
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true
    });
    
    console.debug('VibeStream Security: App Check Shield Active (v3)');
  } catch (e) {
    // This usually happens in local dev environments if debug tokens aren't set, 
    // or if the window object isn't fully available yet.
    console.warn('App Check initialization bypassed:', e);
  }
}

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
