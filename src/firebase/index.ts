'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Initializes Firebase services for both Client and Server (SSR/Edge) contexts.
 * This function is designed to be robust on Cloudflare Workers by explicitly
 * providing the configuration object, avoiding the 'app/no-options' error.
 */
export function initializeFirebase(): { firebaseApp: FirebaseApp; auth: Auth; firestore: Firestore } {
  const apps = getApps();
  
  // Use existing app if available, otherwise initialize with explicit config.
  // We NEVER call initializeApp() without arguments on non-Firebase-Hosting platforms.
  const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);

  const auth = getAuth(app);
  const firestore = getFirestore(app);

  return {
    firebaseApp: app,
    auth,
    firestore
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
