




import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';
import { initializeApp, getApps } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const app =
  getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0];
/**
 * Safely initializes or retrieves the Firebase App instance.
 */
export function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) return getApp();
  return initializeApp(firebaseConfig);
}

/**
 * Retrieves the Firebase Auth instance for the given app.
 */
export function getFirebaseAuth(app: FirebaseApp): Auth {
  return getAuth(app);
}

/**
 * Retrieves the Firestore instance for the given app.
 */
export function getFirebaseDb(app: FirebaseApp): Firestore {
  return getFirestore(app);
}

// These are kept for legacy compatibility but should ideally be accessed via the Provider/Hooks
export const app = typeof window !== 'undefined' ? getFirebaseApp() : {} as FirebaseApp;
export const auth = typeof window !== 'undefined' ? getFirebaseAuth(app as FirebaseApp) : {} as Auth;
export const db = typeof window !== 'undefined' ? getFirebaseDb(app as FirebaseApp) : {} as Firestore;
