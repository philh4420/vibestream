
// Fixed: Using namespaced import and destructuring to resolve "no exported member" errors in Firebase types
import * as FirebaseApp from 'firebase/app';
const { initializeApp } = FirebaseApp as any;
// Fixed: Using namespaced import for firebase/firestore to resolve "no exported member" errors
import * as Firestore from 'firebase/firestore';
const { getFirestore } = Firestore as any;
// Fixed: Using namespaced import for firebase/auth to resolve "no exported member" errors
import * as FirebaseAuth from 'firebase/auth';
const { getAuth } = FirebaseAuth as any;

const getEnv = (key: string) => {
  // Try both process.env and import.meta.env for maximum compatibility across bundlers
  // @ts-ignore
  return process.env[key] || import.meta.env?.[key] || '';
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID')
};

// Log warning if API Key is missing to help debugging (won't show key)
if (!firebaseConfig.apiKey) {
  console.warn("Firebase API Key is missing. Check your environment variables.");
}

// Fixed: Utilizing the initializeApp function extracted from the namespaced import
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
