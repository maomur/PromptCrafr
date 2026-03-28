
'use client';
    
import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  CollectionReference,
  DocumentReference,
} from 'firebase/firestore';
import type { SetOptions } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Utility to recursively remove undefined values from an object.
 * Firestore throws a synchronous error if it encounters undefined.
 */
function cleanData(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  const newObj: any = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      newObj[key] = cleanData(obj[key]);
    } else {
      newObj[key] = null; // Convert undefined to null for Firestore safety
    }
  }
  return newObj;
}

/**
 * Initiates a setDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options?: SetOptions) {
  const finalOptions = options || {};
  const safeData = cleanData(data);
  
  try {
    setDoc(docRef, safeData, finalOptions).catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'write',
          requestResourceData: safeData,
        })
      )
    });
  } catch (e) {
    console.warn('Sync error in setDoc (likely schema related):', e);
  }
}


/**
 * Initiates an addDoc operation for a collection reference.
 * Does NOT await the write operation internally.
 */
export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  const safeData = cleanData(data);
  
  try {
    addDoc(colRef, safeData)
      .catch(error => {
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: colRef.path,
            operation: 'create',
            requestResourceData: safeData,
          })
        )
      });
  } catch (e) {
    console.warn('Sync error in addDoc (likely schema related):', e);
  }
}


/**
 * Initiates an updateDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  const safeData = cleanData(data);
  
  try {
    updateDoc(docRef, safeData)
      .catch(error => {
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: safeData,
          })
        )
      });
  } catch (e) {
    console.warn('Sync error in updateDoc (likely schema related):', e);
  }
}


/**
 * Initiates a deleteDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  try {
    deleteDoc(docRef)
      .catch(error => {
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
          })
        )
      });
  } catch (e) {
    console.warn('Sync error in deleteDoc:', e);
  }
}
