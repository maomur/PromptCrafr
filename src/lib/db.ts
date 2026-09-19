import { openDB, type IDBPDatabase } from 'idb';

/**
 * Cliente de la base de datos local.
 *
 * Toda la biblioteca vive en IndexedDB, en el navegador: no hay servidor ni
 * cuentas. Este módulo sólo sabe abrir la base y aplicar operaciones sobre
 * registros con `id`; el significado de cada almacén lo ponen las features.
 */

const DB_NAME = 'promptcraft';
const DB_VERSION = 1;

export const STORES = ['projects', 'folders', 'prompts', 'links'] as const;

export type StoreName = (typeof STORES)[number];

/** Lo mínimo que la base necesita saber de un registro. */
export type StoredRecord = { id: string };

/**
 * Cambio a aplicar. Un conjunto de operaciones se escribe en una sola
 * transacción, que es lo que sustituye a los lotes atómicos de antes: mover
 * una carpeta con su contenido no puede quedarse a medias.
 */
export type DbOperation =
  | { type: 'put'; store: StoreName; value: StoredRecord }
  | { type: 'delete'; store: StoreName; id: string };

let connection: Promise<IDBPDatabase> | null = null;

/** Abre la base una sola vez y reutiliza la conexión. */
export function openLibraryDb(): Promise<IDBPDatabase> {
  if (!connection) {
    connection = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        for (const store of STORES) {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: 'id' });
          }
        }
      },
    });
  }
  return connection;
}

/** Lee un almacén entero. La biblioteca cabe de sobra en memoria. */
export async function readAll<T>(store: StoreName): Promise<T[]> {
  const db = await openLibraryDb();
  return db.getAll(store) as Promise<T[]>;
}

/** Lee los cuatro almacenes de una vez. */
export async function readEverything(): Promise<Record<StoreName, unknown[]>> {
  const db = await openLibraryDb();
  const tx = db.transaction(STORES, 'readonly');
  const entries = await Promise.all(
    STORES.map(async (store) => [store, await tx.objectStore(store).getAll()] as const)
  );
  await tx.done;
  return Object.fromEntries(entries) as Record<StoreName, unknown[]>;
}

/** Aplica un conjunto de operaciones en una única transacción. */
export async function applyOperations(operations: DbOperation[]): Promise<void> {
  if (operations.length === 0) return;

  const db = await openLibraryDb();
  // Sólo abrimos los almacenes que se tocan, para no bloquear los demás.
  const stores = [...new Set(operations.map((operation) => operation.store))];
  const tx = db.transaction(stores, 'readwrite');

  for (const operation of operations) {
    const store = tx.objectStore(operation.store);
    if (operation.type === 'put') store.put(operation.value);
    else store.delete(operation.id);
  }

  await tx.done;
}

/** Vacía la biblioteca. Lo usa la importación al reemplazar los datos. */
export async function clearEverything(): Promise<void> {
  const db = await openLibraryDb();
  const tx = db.transaction(STORES, 'readwrite');
  for (const store of STORES) tx.objectStore(store).clear();
  await tx.done;
}
