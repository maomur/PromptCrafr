'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

/** Initiate anonymous sign-in (non-blocking). Returns the promise for optional error handling. */
export function initiateAnonymousSignIn(authInstance: Auth): Promise<any> {
  // CRITICAL: Call signInAnonymously directly.
  return signInAnonymously(authInstance);
}

/** Initiate email/password sign-up (non-blocking). Returns the promise for optional error handling. */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): Promise<any> {
  // CRITICAL: Call createUserWithEmailAndPassword directly.
  return createUserWithEmailAndPassword(authInstance, email, password);
}

/** Initiate email/password sign-in (non-blocking). Returns the promise for optional error handling. */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): Promise<any> {
  // CRITICAL: Call signInWithEmailAndPassword directly.
  return signInWithEmailAndPassword(authInstance, email, password);
}
