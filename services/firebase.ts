
// Fixed: Switching to namespace import for 'firebase/app' to resolve persistent "no exported member" compiler errors
import * as FirebaseApp from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { CONFIG } from './config';

let app: any;
try {
  // Fixed: Safely accessing getApps() and getApp() from the FirebaseApp namespace to check for existing instances
  const existingApps = FirebaseApp.getApps();
  if (!existingApps.length) {
    // Only initialize if we have at least an API key to prevent crashing the whole app
    if (CONFIG.FIREBASE.apiKey && CONFIG.FIREBASE.apiKey !== '') {
      // Fixed: Accessing initializeApp via namespace to bypass module resolution conflicts in the modular SDK
      app = FirebaseApp.initializeApp(CONFIG.FIREBASE as any);
    } else {
      console.warn("Firebase: No API Key found. App running in offline/mock mode.");
      // Provide a dummy app object to prevent downstream reference errors
      app = { name: '[DEFAULT]-mock' } as any;
    }
  } else {
    // Fixed: Accessing getApp via namespace for consistent symbol lookup in multi-instance environments
    app = FirebaseApp.getApp();
  }
} catch (error) {
  console.error("Firebase Initialization Error:", error);
  app = { name: '[DEFAULT]-error' } as any;
}

export const db = app.name === '[DEFAULT]-mock' || app.name === '[DEFAULT]-error' ? null : getFirestore(app);
export const auth = app.name === '[DEFAULT]-mock' || app.name === '[DEFAULT]-error' ? null : getAuth(app);
export default app;