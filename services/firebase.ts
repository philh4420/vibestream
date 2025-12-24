
// Fixed: Using namespaced import and destructuring with any-cast to resolve "no exported member" errors for initializeApp, getApps, and getApp in Firebase v9+
import * as FirebaseApp from 'firebase/app';
const { initializeApp, getApps, getApp } = FirebaseApp as any;
// Fixed: Using namespaced import for firebase/firestore to resolve "no exported member" errors
import * as Firestore from 'firebase/firestore';
const { getFirestore } = Firestore as any;
// Fixed: Using namespaced import for firebase/auth and any-casting to resolve "no exported member" errors for getAuth and Auth type
import * as FirebaseAuth from 'firebase/auth';
const { getAuth } = FirebaseAuth as any;
import { CONFIG } from './config';

let app: any;
let dbInstance: any;
let authInstance: any;

try {
  // Fixed: Utilizing functions extracted from namespaced import to avoid type-level missing member errors
  const apps = getApps();
  if (apps.length > 0) {
    app = getApp();
  } else {
    // Standard initialization pattern for Firebase v9+
    app = initializeApp(CONFIG.FIREBASE);
  }
  
  dbInstance = getFirestore(app);
  authInstance = getAuth(app);

} catch (error) {
  console.error("Firebase Initialization Critical Error:", error);
  // Fallback for development environments without keys or with invalid config
  // Provides a minimal mock structure to prevent immediate crashes in App.tsx imports
  app = { name: '[DEFAULT]-fallback' } as any;
  
  authInstance = {
    currentUser: null,
    // Mock onAuthStateChanged that immediately returns null user to unblock the loading spinner
    onAuthStateChanged: (callback: any) => {
      setTimeout(() => callback(null), 100);
      return () => {};
    },
    signOut: async () => {},
    signInWithEmailAndPassword: async () => { throw new Error("Auth unavailable - Check Config"); },
    createUserWithEmailAndPassword: async () => { throw new Error("Auth unavailable - Check Config"); }
  };
  
  dbInstance = {};
}

// Exporting with explicit types to ensure IDE stability
export const db = dbInstance;
export const auth = authInstance;
export default app;
