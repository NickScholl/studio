
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

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
