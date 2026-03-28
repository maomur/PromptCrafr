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
  
  if (obj instanceof Date) return obj.toISOString();
  
  const newObj: any = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      // Importante: No dejar campos como undefined. Convertir a null o ignorar.
      if (value !== undefined) {
        newObj[key] = cleanData(value);
      } else {
        newObj[key] = null;
      }
    }
  }
  return newObj;
}

/**
 * Initiates a setDoc operation for a document reference.
 */
export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options?: SetOptions) {
  try {
    const finalOptions = options || {};
    const safeData = cleanData(data);
    
    setDoc(docRef, safeData, finalOptions)
      .catch(error => {
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: docRef.path,
            operation: 'write',
            requestResourceData: safeData,
          })
        );
      });
  } catch (syncError: any) {
    console.error("Firestore Sync Error (setDoc):", syncError);
  }
}

/**
 * Initiates an addDoc operation for a collection reference.
 */
export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  try {
    const safeData = cleanData(data);
    
    addDoc(colRef, safeData)
      .catch(error => {
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: colRef.path,
            operation: 'create',
            requestResourceData: safeData,
          })
        );
      });
  } catch (syncError: any) {
    console.error("Firestore Sync Error (addDoc):", syncError);
  }
}

/**
 * Initiates an updateDoc operation for a document reference.
 */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  try {
    const safeData = cleanData(data);
    
    updateDoc(docRef, safeData)
      .catch(error => {
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: safeData,
          })
        );
      });
  } catch (syncError: any) {
    console.error("Firestore Sync Error (updateDoc):", syncError);
  }
}

/**
 * Initiates a deleteDoc operation for a document reference.
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
        );
      });
  } catch (syncError: any) {
    console.error("Firestore Sync Error (deleteDoc):", syncError);
  }
}
