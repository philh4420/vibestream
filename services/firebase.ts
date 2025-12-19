

// Fixed: Using a namespace import for 'firebase/app' to resolve persistent symbol resolution errors in this environment
import * as FirebaseApp from 'firebase/app';
const { initializeApp, getApps, getApp } = FirebaseApp;
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { CONFIG } from './config';

let app: any;
try {
  // Fixed: Calling modular getApps() via the destructured namespace export to ensure reliability
  const existingApps = getApps();
  if (!existingApps.length) {
    // Only initialize if we have at least an API key to prevent crashing the whole app
    if (CONFIG.FIREBASE.apiKey && CONFIG.FIREBASE.apiKey !== '') {
      // Fixed: Calling initializeApp via the destructured namespace export
      app = initializeApp(CONFIG.FIREBASE as any);
    } else {
      console.warn("Firebase: No API Key found. App running in offline/mock mode.");
      // Provide a dummy app object to prevent downstream reference errors
      app = { name: '[DEFAULT]-mock' } as any;
    }
  } else {
    // Fixed: Calling getApp via the destructured namespace export
    app = getApp();
  }
} catch (error) {
  console.error("Firebase Initialization Error:", error);
  app = { name: '[DEFAULT]-error' } as any;
}

export const db = app.name === '[DEFAULT]-mock' || app.name === '[DEFAULT]-error' ? null : getFirestore(app);
export const auth = app.name === '[DEFAULT]-mock' || app.name === '[DEFAULT]-error' ? null : getAuth(app);
export default app;
