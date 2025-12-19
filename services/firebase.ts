
// Fixed: Using namespace import for Firebase app core to ensure correct member resolution (initializeApp, getApps, getApp)
import * as firebase from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { CONFIG } from './config';

let app: any;
try {
  // Fixed: Calling modular functions from the firebase namespace to resolve build environment type errors
  const existingApps = firebase.getApps();
  if (!existingApps.length) {
    // Only initialize if we have at least an API key to prevent crashing the whole app
    if (CONFIG.FIREBASE.apiKey && CONFIG.FIREBASE.apiKey !== '') {
      // Fixed: Initializing through the namespace for improved reliability
      app = firebase.initializeApp(CONFIG.FIREBASE as any);
    } else {
      console.warn("Firebase: No API Key found. App running in offline/mock mode.");
      // Provide a dummy app object to prevent downstream reference errors
      app = { name: '[DEFAULT]-mock' } as any;
    }
  } else {
    // Fixed: Retrieving the existing app through the namespace
    app = firebase.getApp();
  }
} catch (error) {
  console.error("Firebase Initialization Error:", error);
  app = { name: '[DEFAULT]-error' } as any;
}

export const db = app.name === '[DEFAULT]-mock' || app.name === '[DEFAULT]-error' ? null : getFirestore(app);
export const auth = app.name === '[DEFAULT]-mock' || app.name === '[DEFAULT]-error' ? null : getAuth(app);
export default app;
