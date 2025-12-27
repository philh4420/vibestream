
import * as FirebaseApp from 'firebase/app';
const { initializeApp, getApps, getApp } = FirebaseApp as any;
import * as Firestore from 'firebase/firestore';
const { getFirestore } = Firestore as any;
import * as FirebaseAuth from 'firebase/auth';
const { getAuth } = FirebaseAuth as any;

import { CONFIG } from './config';

let app;

try {
  const apps = getApps();
  if (apps.length > 0) {
    app = getApp();
  } else {
    app = initializeApp(CONFIG.FIREBASE);
  }
} catch (error) {
  console.error("Firebase Initialization Critical Error:", error);
  app = initializeApp(CONFIG.FIREBASE, 'FALLBACK');
}

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
