'use client';
import {
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type Auth,
  type UserCredential,
} from 'firebase/auth';

/** Initiate anonymous sign-in (non-blocking). Returns the promise for optional error handling. */
export function initiateAnonymousSignIn(authInstance: Auth): Promise<UserCredential> {
  // CRITICAL: Call signInAnonymously directly.
  return signInAnonymously(authInstance);
}

/** Initiate email/password sign-up (non-blocking). Returns the promise for optional error handling. */
export function initiateEmailSignUp(
  authInstance: Auth,
  email: string,
  password: string
): Promise<UserCredential> {
  // CRITICAL: Call createUserWithEmailAndPassword directly.
  return createUserWithEmailAndPassword(authInstance, email, password);
}

/** Initiate email/password sign-in (non-blocking). Returns the promise for optional error handling. */
export function initiateEmailSignIn(
  authInstance: Auth,
  email: string,
  password: string
): Promise<UserCredential> {
  // CRITICAL: Call signInWithEmailAndPassword directly.
  return signInWithEmailAndPassword(authInstance, email, password);
}
