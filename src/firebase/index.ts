'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Robust Firebase initialization for Cloudflare and SSR environments.
 * Ensures initializeApp is always called with the explicit config.
 */
export function initializeFirebase(): { firebaseApp: FirebaseApp; auth: Auth; firestore: Firestore } {
  let firebaseApp: FirebaseApp;

  const apps = getApps();
  if (apps.length > 0) {
    firebaseApp = apps[0];
  } else {
    // We catch potential initialization errors during edge cases
    try {
      firebaseApp = initializeApp(firebaseConfig);
    } catch (e) {
      // If initialization still fails, we attempt to retrieve the existing app
      firebaseApp = getApp();
    }
  }

  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
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
