
// Fixed: Switching to modular imports for 'firebase/app' to resolve persistent symbol resolution errors and property access issues
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { CONFIG } from './config';

let app: any;
try {
  // Fixed: Safely accessing modular getApps() function to check for existing instances
  const existingApps = getApps();
  if (!existingApps.length) {
    // Only initialize if we have at least an API key to prevent crashing the whole app
    if (CONFIG.FIREBASE.apiKey && CONFIG.FIREBASE.apiKey !== '') {
      // Fixed: Accessing modular initializeApp for consistent symbol lookup in the modular SDK
      app = initializeApp(CONFIG.FIREBASE as any);
    } else {
      console.warn("Firebase: No API Key found. App running in offline/mock mode.");
      // Provide a dummy app object to prevent downstream reference errors
      app = { name: '[DEFAULT]-mock' } as any;
    }
  } else {
    // Fixed: Accessing modular getApp function for consistent symbol lookup in multi-instance environments
    app = getApp();
  }
} catch (error) {
  console.error("Firebase Initialization Error:", error);
  app = { name: '[DEFAULT]-error' } as any;
}

export const db = app.name === '[DEFAULT]-mock' || app.name === '[DEFAULT]-error' ? null : getFirestore(app);
export const auth = app.name === '[DEFAULT]-mock' || app.name === '[DEFAULT]-error' ? null : getAuth(app);
export default app;
