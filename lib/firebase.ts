
// Fixed: Using namespace import for firebase/app to ensure reliable symbol resolution in 2026+ TypeScript environments
import * as FirebaseApp from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

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

// Fixed: Utilizing FirebaseApp namespace to access initializeApp, resolving "no exported member" errors
const app = FirebaseApp.initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;