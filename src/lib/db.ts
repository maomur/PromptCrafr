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

/**
 * Ejecuta el cuerpo de una transacción, cancelándola si algo revienta.
 *
 * `put` puede fallar de forma síncrona —por ejemplo, con un valor que el
 * clonado estructurado no sabe copiar— y entonces no queda ninguna petición
 * en error que impida confirmar. Sin este `abort`, la transacción se
 * confirmaba con las operaciones que sí habían pasado: media escritura, que
 * es justo lo que una transacción debería evitar.
 */
/**
 * Lanza una petición sin esperar su resultado.
 *
 * `idb` envuelve cada petición en una promesa. Si la transacción se cancela y
 * nadie las mira, quedan rechazos sin manejar: en el navegador aparecen como
 * «Uncaught (in promise)» y en Node tumban el proceso. El resultado de cada
 * petición no interesa —lo que importa es si la transacción entera confirma—,
 * pero el rechazo hay que recogerlo.
 */
function issue(request: unknown): void {
  const promise = request as Promise<unknown> | undefined;
  if (promise && typeof promise.catch === 'function') promise.catch(() => undefined);
}

function run(tx: { abort: () => void; done: Promise<unknown> }, body: () => void): void {
  try {
    body();
  } catch (cause) {
    tx.abort();
    // El abort rechaza `tx.done`; lo silenciamos para que no quede una
    // promesa sin manejar y propagamos el error de verdad.
    tx.done.catch(() => undefined);
    throw cause;
  }
}

/** Aplica un conjunto de operaciones en una única transacción. */
export async function applyOperations(operations: DbOperation[]): Promise<void> {
  if (operations.length === 0) return;

  const db = await openLibraryDb();
  // Sólo abrimos los almacenes que se tocan, para no bloquear los demás.
  const stores = [...new Set(operations.map((operation) => operation.store))];
  const tx = db.transaction(stores, 'readwrite');

  run(tx, () => {
    for (const operation of operations) {
      const store = tx.objectStore(operation.store);
      issue(operation.type === 'put' ? store.put(operation.value) : store.delete(operation.id));
    }
  });

  await tx.done;
}

/**
 * Reemplaza la biblioteca entera en una sola transacción.
 *
 * Vaciar y volver a escribir por separado abría una ventana fatal: si la
 * segunda operación fallaba —por cuota, por ejemplo— el usuario se quedaba sin
 * los datos viejos y sin los nuevos. Aquí, o entra todo o no se toca nada.
 */
export async function replaceEverything(operations: DbOperation[]): Promise<void> {
  const db = await openLibraryDb();
  const tx = db.transaction(STORES, 'readwrite');

  run(tx, () => {
    for (const store of STORES) issue(tx.objectStore(store).clear());
    for (const operation of operations) {
      if (operation.type === 'put') issue(tx.objectStore(operation.store).put(operation.value));
    }
  });

  await tx.done;
}
