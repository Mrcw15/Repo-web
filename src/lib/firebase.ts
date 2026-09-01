/// <reference types="vite/client" />
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeFirestore, 
  getFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  memoryLocalCache
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import defaultConfig from '../../firebase-applet-config.json';

// Support both JSON config and environment variables for external hosting like Vercel
const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env || {};

const getFirebaseConfigValue = (envKey: string, defaultVal: string) => {
  const val = metaEnv[envKey];
  // Abaikan jika user tidak sengaja mem-paste WA API Key ke environment Firebase
  if (val && !val.startsWith('jere_')) {
    return val;
  }
  return defaultVal;
};

const firebaseConfig = {
  apiKey: getFirebaseConfigValue('VITE_FIREBASE_API_KEY', defaultConfig.apiKey),
  authDomain: getFirebaseConfigValue('VITE_FIREBASE_AUTH_DOMAIN', defaultConfig.authDomain),
  projectId: getFirebaseConfigValue('VITE_FIREBASE_PROJECT_ID', defaultConfig.projectId),
  storageBucket: getFirebaseConfigValue('VITE_FIREBASE_STORAGE_BUCKET', defaultConfig.storageBucket),
  messagingSenderId: getFirebaseConfigValue('VITE_FIREBASE_MESSAGING_SENDER_ID', defaultConfig.messagingSenderId),
  appId: getFirebaseConfigValue('VITE_FIREBASE_APP_ID', defaultConfig.appId),
  firestoreDatabaseId: getFirebaseConfigValue('VITE_FIREBASE_DATABASE_ID', defaultConfig.firestoreDatabaseId),
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with ultra-fast persistent local cache & auto long-polling detection
let dbInstance;
try {
  const databaseId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId
    : undefined;

  const cacheConfig = typeof window !== 'undefined'
    ? persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    : memoryLocalCache();

  dbInstance = initializeFirestore(app, {
    localCache: cacheConfig,
    experimentalAutoDetectLongPolling: true,
  }, databaseId);
} catch {
  dbInstance = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
}

export const db = dbInstance;
export const auth = getAuth(app);

export { app, firebaseConfig };

