
/**
 * Configuration Service
 * Handles environment variables with multi-environment support.
 */
const getEnv = (key: string): string => {
  // @ts-ignore
  const val = process.env[key] || import.meta.env?.[key] || '';
  return val.trim();
};

export const CONFIG = {
  FIREBASE: {
    apiKey: getEnv('VITE_FIREBASE_API_KEY'),
    authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: getEnv('VITE_FIREBASE_APP_ID'),
  },
  CLOUDINARY: {
    cloudName: getEnv('VITE_CLOUDINARY_CLOUD_NAME'),
    uploadPreset: getEnv('VITE_CLOUDINARY_UPLOAD_PRESET') || 'ml_default',
  }
};

// Validate critical config
if (!CONFIG.FIREBASE.apiKey) {
  console.error("CRITICAL: Firebase API Key is missing. Verification will fail.");
}
