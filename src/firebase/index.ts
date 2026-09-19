
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, signOut, type Auth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    let firebaseApp;
    try {
      firebaseApp = initializeApp();
    } catch (e) {
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      firebaseApp = initializeApp(firebaseConfig);
    }

    return getSdks(firebaseApp);
  }

  return getSdks(getApp());
}

/**
 * Abre Firestore con caché persistente en IndexedDB.
 *
 * Es lo que hace que la aplicación siga siendo utilizable sin conexión: las
 * lecturas se sirven desde el disco y las escrituras quedan en cola hasta que
 * vuelve la red. `persistentMultipleTabManager` coordina varias pestañas, que
 * de otro modo se pelearían por el mismo almacén.
 */
function openFirestore(firebaseApp: FirebaseApp): Firestore {
  try {
    return initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    // Ya estaba inicializado (recarga en caliente) o el navegador no soporta
    // IndexedDB: seguimos con la instancia en memoria.
    return getFirestore(firebaseApp);
  }
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: openFirestore(firebaseApp),
  };
}

/** Cierra la sesión actual. El listener de `onAuthStateChanged` hace el resto. */
export const logOut = (auth: Auth) => signOut(auth);

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
