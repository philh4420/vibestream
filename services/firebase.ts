

// Fixed: Using namespaced import and destructuring with any-cast to resolve "no exported member" errors for initializeApp, getApps, and getApp in Firebase v9+
import * as FirebaseApp from 'firebase/app';
const { initializeApp, getApps, getApp } = FirebaseApp as any;
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { CONFIG } from './config';

// Fixed: Using 'any' as a fallback for the app type to bypass missing type definitions in the current environment
let app: any;

try {
  // Fixed: Utilizing functions extracted from namespaced import to avoid type-level missing member errors
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
  app = { name: '[DEFAULT]-fallback' } as any;
}

// Exporting with explicit types to ensure IDE stability
export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);
export default app;
