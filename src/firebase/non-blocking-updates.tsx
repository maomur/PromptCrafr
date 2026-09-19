'use client';

import {
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  type CollectionReference,
  type DocumentReference,
  type DocumentData,
  type SetOptions,
  type UpdateData,
  type WriteBatch,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Prepara un objeto para Firestore, que rechaza `undefined` con un error síncrono.
 *
 * Las claves con valor `undefined` se descartan en lugar de convertirse en `null`:
 * en un `updateDoc` escribir `null` borraría el campo, que casi nunca es lo que
 * se quiere decir cuando simplemente no se ha informado un valor. Para borrar un
 * campo a propósito, pasa `null` de forma explícita.
 */
function cleanData<T>(value: T, depth = 0): T {
  // Cinturón de seguridad frente a estructuras cíclicas.
  if (depth > 10) return value;
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date) return value.toISOString() as unknown as T;

  // Tipos propios de Firestore (Timestamp, GeoPoint, FieldValue...) van tal cual.
  const ctor = (value as object).constructor;
  if (ctor && ctor !== Object && ctor !== Array) return value;

  if (Array.isArray(value)) {
    return value.map((item) => cleanData(item, depth + 1)) as unknown as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (item !== undefined) result[key] = cleanData(item, depth + 1);
  }
  return result as T;
}

type Operation = 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';

/**
 * Enruta el fallo de una escritura.
 *
 * Sólo los rechazos de las reglas de seguridad se propagan como
 * `FirestorePermissionError`; un fallo de red o de cuota no es un problema de
 * permisos y etiquetarlo como tal despista al depurar.
 */
function reportWriteError(
  error: unknown,
  context: { path: string; operation: Operation; requestResourceData?: unknown }
) {
  const code = (error as { code?: string } | null)?.code;

  if (code === 'permission-denied' || code === 'unauthenticated') {
    errorEmitter.emit('permission-error', new FirestorePermissionError(context));
    return;
  }

  // Firestore reintenta por su cuenta cuando no hay red, así que esto es
  // informativo: la escritura se aplicará en cuanto vuelva la conexión.
  console.warn(
    `[firestore] ${context.operation} sobre "${context.path}" no se ha confirmado todavía:`,
    error
  );
}

/** Crea o reemplaza un documento sin bloquear la interfaz. */
export function setDocumentNonBlocking(
  docRef: DocumentReference,
  data: unknown,
  options?: SetOptions
) {
  const safeData = cleanData(data) as Record<string, unknown>;
  const promise = options
    ? setDoc(docRef, safeData, options)
    : setDoc(docRef, safeData);

  promise.catch((error) =>
    reportWriteError(error, {
      path: docRef.path,
      operation: 'write',
      requestResourceData: safeData,
    })
  );
}

/** Añade un documento con id automático sin bloquear la interfaz. */
export function addDocumentNonBlocking(colRef: CollectionReference, data: unknown) {
  const safeData = cleanData(data) as Record<string, unknown>;

  addDoc(colRef, safeData).catch((error) =>
    reportWriteError(error, {
      path: colRef.path,
      operation: 'create',
      requestResourceData: safeData,
    })
  );
}

/** Actualiza campos concretos de un documento sin bloquear la interfaz. */
export function updateDocumentNonBlocking(docRef: DocumentReference, data: unknown) {
  const safeData = cleanData(data) as Record<string, unknown>;

  // `UpdateData` describe rutas con punto ("a.b"), algo que no podemos
  // expresar tras limpiar el objeto de forma genérica.
  updateDoc(docRef, safeData as UpdateData<DocumentData>).catch((error) =>
    reportWriteError(error, {
      path: docRef.path,
      operation: 'update',
      requestResourceData: safeData,
    })
  );
}

/** Borra un documento sin bloquear la interfaz. */
export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  deleteDoc(docRef).catch((error) =>
    reportWriteError(error, { path: docRef.path, operation: 'delete' })
  );
}

/**
 * Confirma un lote de escrituras sin bloquear la interfaz.
 *
 * Un lote es atómico: o se aplican todas las operaciones o ninguna. Es lo que
 * usamos para reordenar listas y para desvincular recursos de un proyecto que
 * se borra, donde dejar el trabajo a medias corrompería el estado.
 */
export function commitBatchNonBlocking(batch: WriteBatch, path: string) {
  batch.commit().catch((error) => reportWriteError(error, { path, operation: 'write' }));
}
