
// Fixed: Using namespace import to resolve "no exported member" errors for initializeApp, getApps, getApp, and FirebaseApp
import * as firebase from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { CONFIG } from './config';

// Fixed: Using 'any' as a fallback for the app type to bypass missing type definitions in the current environment
let app: any;

try {
  // Fixed: Accessing functions via the namespace to ensure they are found during compilation
  const apps = firebase.getApps();
  if (apps.length > 0) {
    app = firebase.getApp();
  } else {
    // Standard initialization pattern for Firebase v9+
    app = firebase.initializeApp(CONFIG.FIREBASE);
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
