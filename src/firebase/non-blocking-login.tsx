
'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

/**
 * These utilities are "non-blocking" because they don't use 'await'.
 * The UI updates automatically when the auth state changes.
 */

export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance);
}

export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  createUserWithEmailAndPassword(authInstance, email, password);
}

export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  signInWithEmailAndPassword(authInstance, email, password);
}
