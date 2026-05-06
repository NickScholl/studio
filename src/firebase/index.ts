'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Robust Firebase initialization for Cloudflare and SSR environments.
 * This pattern ensures we never attempt "automatic" initialization which fails on Cloudflare.
 */
let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

export function initializeFirebase(): { firebaseApp: FirebaseApp; auth: Auth; firestore: Firestore } {
  const apps = getApps();
  
  if (apps.length > 0) {
    firebaseApp = apps[0];
  } else {
    // Explicitly initialize with config to avoid "app/no-options" error on Cloudflare
    firebaseApp = initializeApp(firebaseConfig);
  }

  auth = getAuth(firebaseApp);
  firestore = getFirestore(firebaseApp);

  return {
    firebaseApp,
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
