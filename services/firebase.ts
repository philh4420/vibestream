
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { CONFIG } from './config';

const app = initializeApp(CONFIG.FIREBASE);

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
