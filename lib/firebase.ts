
import * as FirebaseApp from 'firebase/app';
const { initializeApp, getApps, getApp } = FirebaseApp as any;
import * as Firestore from 'firebase/firestore';
const { initializeFirestore, getFirestore } = Firestore as any;
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
 * VIBESTREAM CONNECTIVITY FIX v2.0:
 * Disabling fetch streams ensures the browser doesn't block the long-lived
 * Firestore 'Listen' channel via strict CORS/Access-Control checks.
 */
let dbInstance;
try {
  dbInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    useFetchStreams: false,
  });
} catch (e) {
  dbInstance = getFirestore(app);
}

export const db = dbInstance;
export const auth = getAuth(app);
export default app;
