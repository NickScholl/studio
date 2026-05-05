'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { getFirebaseApp, getFirebaseAuth, getFirebaseDb } from './init';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseContextType {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const firebaseInstances = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      const appInstance = getFirebaseApp();
      const authInstance = getFirebaseAuth(appInstance);
      const dbInstance = getFirebaseDb(appInstance);
      return { app: appInstance, auth: authInstance, db: dbInstance };
    } catch (error) {
      console.error('Firebase Init Error:', error);
      return null;
    }
  }, []);

  if (!isMounted) return null;

  if (!firebaseInstances) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-sm font-medium">Connecting to ShuttleScore Cloud...</p>
        </div>
      </div>
    );
  }

  return (
    <FirebaseContext.Provider value={firebaseInstances}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within FirebaseProvider');
  }
  return context;
}

export const useFirebaseApp = () => useFirebase().app;
export const useAuth = () => useFirebase().auth;
export const useFirestore = () => useFirebase().db;
