
import { initializeApp, getApps, getApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { CONFIG } from './config';

let app: FirebaseApp;

try {
  const apps = getApps();
  if (apps.length > 0) {
    app = getApp();
  } else {
    // Standard initialization pattern for Firebase v9+
    app = initializeApp(CONFIG.FIREBASE);
  }
} catch (error) {
  console.error("Firebase Initialization Critical Error:", error);
  // Fallback for development environments without keys
  // @ts-ignore - Providing a minimal fallback object for type safety
  app = { name: '[DEFAULT]-fallback' } as FirebaseApp;
}

// Exporting with explicit types to ensure IDE stability
export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);
export default app;
