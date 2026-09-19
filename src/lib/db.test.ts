import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { applyOperations, clearEverything, readAll, readEverything } from '@/lib/db';

/**
 * Pruebas contra una IndexedDB simulada.
 *
 * Sin servidor, este módulo es lo único que separa la biblioteca de perderse,
 * así que conviene comprobar que lo que se escribe se vuelve a leer y que una
 * transacción fallida no deja las cosas a medias.
 */

beforeEach(async () => {
  await clearEverything();
});

describe('applyOperations', () => {
  it('guarda y recupera un registro', async () => {
    await applyOperations([
      { type: 'put', store: 'prompts', value: { id: 'a', title: 'Hola' } as never },
    ]);

    expect(await readAll('prompts')).toEqual([{ id: 'a', title: 'Hola' }]);
  });

  it('sobrescribe el registro con el mismo id en lugar de duplicarlo', async () => {
    await applyOperations([{ type: 'put', store: 'prompts', value: { id: 'a', n: 1 } as never }]);
    await applyOperations([{ type: 'put', store: 'prompts', value: { id: 'a', n: 2 } as never }]);

    expect(await readAll('prompts')).toEqual([{ id: 'a', n: 2 }]);
  });

  it('borra', async () => {
    await applyOperations([{ type: 'put', store: 'links', value: { id: 'l' } as never }]);
    await applyOperations([{ type: 'delete', store: 'links', id: 'l' }]);

    expect(await readAll('links')).toEqual([]);
  });

  it('escribe en varios almacenes en una sola transacción', async () => {
    await applyOperations([
      { type: 'put', store: 'projects', value: { id: 'p' } as never },
      { type: 'put', store: 'folders', value: { id: 'f', projectId: 'p' } as never },
      { type: 'put', store: 'prompts', value: { id: 'a', folderId: 'f' } as never },
    ]);

    const todo = await readEverything();
    expect(todo.projects).toHaveLength(1);
    expect(todo.folders).toHaveLength(1);
    expect(todo.prompts).toHaveLength(1);
  });

  it('no hace nada con una lista vacía', async () => {
    await expect(applyOperations([])).resolves.toBeUndefined();
  });
});

describe('readEverything', () => {
  it('devuelve los cuatro almacenes aunque estén vacíos', async () => {
    expect(await readEverything()).toEqual({ projects: [], folders: [], prompts: [], links: [] });
  });
});

describe('clearEverything', () => {
  it('vacía la biblioteca entera', async () => {
    await applyOperations([
      { type: 'put', store: 'prompts', value: { id: 'a' } as never },
      { type: 'put', store: 'projects', value: { id: 'p' } as never },
    ]);

    await clearEverything();

    expect(await readEverything()).toEqual({ projects: [], folders: [], prompts: [], links: [] });
  });
});
