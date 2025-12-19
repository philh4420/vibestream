
// Fixed: Using named imports for firebase/app to ensure reliable symbol resolution in 2026+ environments
import { initializeApp } from 'firebase/app';
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

// Fixed: Utilizing named initializeApp for reliable instance creation, resolving "no exported member" errors
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;