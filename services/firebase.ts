// Fixed: Using namespace import for firebase/app to resolve missing named export errors and ensure compatibility with modern modular SDK bundles
import * as firebase from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { CONFIG } from './config';

let app;
try {
  // Fixed: Using namespace call for getApps() to resolve "no exported member" errors
  if (!firebase.getApps().length) {
    // Only initialize if we have at least an API key to prevent crashing the whole app
    if (CONFIG.FIREBASE.apiKey && CONFIG.FIREBASE.apiKey !== '') {
      // Fixed: Using namespace call for initializeApp() to correctly instantiate the Firebase instance
      app = firebase.initializeApp(CONFIG.FIREBASE as any);
    } else {
      console.warn("Firebase: No API Key found. App running in offline/mock mode.");
      // Provide a dummy app object to prevent downstream reference errors
      app = { name: '[DEFAULT]-mock' } as any;
    }
  } else {
    // Fixed: Using namespace call for getApp() to retrieve existing instance safely
    app = firebase.getApp();
  }
} catch (error) {
  console.error("Firebase Initialization Error:", error);
  app = { name: '[DEFAULT]-error' } as any;
}

export const db = app.name === '[DEFAULT]-mock' || app.name === '[DEFAULT]-error' ? null : getFirestore(app);
export const auth = app.name === '[DEFAULT]-mock' || app.name === '[DEFAULT]-error' ? null : getAuth(app);
export default app;