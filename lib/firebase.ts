
import * as FirebaseApp from 'firebase/app';
const { initializeApp, getApps, getApp } = FirebaseApp as any;
// Using namespace imports to resolve modular SDK export issues
import * as Firestore from 'firebase/firestore';
const { initializeFirestore } = Firestore as any;
import * as FirebaseAuth from 'firebase/auth';
const { getAuth } = FirebaseAuth as any;

const getEnv = (key: string) => {
  // @ts-ignore
  const processVal = typeof process !== 'undefined' ? process.env[key] : undefined;
  // @ts-ignore
  const viteVal = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env[key] : undefined;
  return (processVal || viteVal || '').trim();
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN') || 'aether-1-f0425.firebaseapp.com',
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID') || 'aether-1-f0425',
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET') || 'aether-1-f0425.firebasestorage.app',
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID')
};

let app;
try {
  const apps = getApps();
  app = apps.length > 0 ? getApp() : initializeApp(firebaseConfig);
} catch (e) {
  app = initializeApp(firebaseConfig, 'LIB_FALLBACK');
}

/**
 * VIBESTREAM CONNECTIVITY FIX:
 * Ensures the 'Listen' channel doesn't fail due to browser access control.
 */
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export const auth = getAuth(app);
export default app;
