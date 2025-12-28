
/**
 * Configuration Service
 * Handles environment variables safely across different runtime environments.
 */
const getEnv = (key: string): string => {
  try {
    // Safely check for process or import.meta.env to prevent ReferenceErrors in browser
    // @ts-ignore
    const processVal = typeof process !== 'undefined' ? process.env[key] : undefined;
    // @ts-ignore
    const viteVal = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env[key] : undefined;
    
    return (processVal || viteVal || '').trim();
  } catch (e) {
    return '';
  }
};

export const CONFIG = {
  FIREBASE: {
    apiKey: getEnv('VITE_FIREBASE_API_KEY'),
    authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN') || 'aether-1-f0425.firebaseapp.com',
    projectId: getEnv('VITE_FIREBASE_PROJECT_ID') || 'aether-1-f0425',
    storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET') || 'aether-1-f0425.firebasestorage.app',
    messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: getEnv('VITE_FIREBASE_APP_ID'),
  },
  APP_CHECK: {
    // Strictly use environment variable; no hardcoded fallback.
    reCaptchaSiteKey: getEnv('VITE_RECAPTCHA_SITE_KEY'),
  },
  CLOUDINARY: {
    cloudName: getEnv('VITE_CLOUDINARY_CLOUD_NAME'),
    uploadPreset: getEnv('VITE_CLOUDINARY_UPLOAD_PRESET') || 'ml_default',
  },
  GIPHY: {
    apiKey: getEnv('VITE_GIPHY_API_KEY'),
  },
  WEATHER: {
    apiKey: getEnv('VITE_OPENWEATHER_API_KEY') || '31895ab433268844337dd3ce24bf423c',
  },
  REGION: 'en-GB'
};

// Internal validation
if (!CONFIG.FIREBASE.apiKey && typeof window !== 'undefined') {
  console.warn("VibeStream Alert: Authentication environment variables not detected.");
}
