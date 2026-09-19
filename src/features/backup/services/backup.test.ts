import { describe, expect, it } from 'vitest';
import { createBackup, ImportError, parseBackup } from '@/features/backup/services/backup';
import type { LibraryState } from '@/features/library/types';

/** Volcado como el que sale de un backend: con campos de sobra y sin orden. */
const volcado = {
  projects: [{ id: 'p1', name: 'Trabajo', ownerId: 'antiguo', createdAt: '2026-01-01T00:00:00.000Z' }],
  folders: [
    { id: 'f1', name: 'Nómina', projectId: 'p1', parentId: null, ownerId: 'antiguo', createdAt: '2026-01-02T00:00:00.000Z' },
  ],
  prompts: [
    {
      id: 'a1', title: 'Resumir acta', description: 'Para reuniones',
      content: 'Resume el acta siguiente...', category: 'Textos',
      projectId: 'p1', folderId: 'f1', order: 5,
      ownerId: 'antiguo', createdAt: '2026-02-01T00:00:00.000Z', updatedAt: '2026-02-02T00:00:00.000Z',
    },
  ],
  links: [{ id: 'l1', url: 'https://ejemplo.com', projectId: 'p1', order: 2, createdAt: '2026-03-01T00:00:00.000Z' }],
};

describe('parseBackup', () => {
  it('lee un volcado completo e ignora los campos que sobran', () => {
    const state = parseBackup(volcado);

    expect(state.projects).toEqual([
      { id: 'p1', name: 'Trabajo', description: null, createdAt: '2026-01-01T00:00:00.000Z' },
    ]);
    expect(state.prompts[0]).toMatchObject({
      id: 'a1', title: 'Resumir acta', category: 'Textos', projectId: 'p1', folderId: 'f1', order: 5,
    });
    expect(state.prompts[0]).not.toHaveProperty('ownerId');
  });

  it('descarta lo que no tiene identificador o contenido', () => {
    const state = parseBackup({
      projects: [{ name: 'Sin id' }, { id: 'p1', name: 'Válido' }],
      prompts: [{ id: 'x', title: 'Sin contenido' }, { id: 'y', content: 'Sin título' }],
    });

    expect(state.projects.map((p) => p.id)).toEqual(['p1']);
    expect(state.prompts).toEqual([]);
  });

  it('suelta los recursos que apuntan a una carpeta que no viene en el archivo', () => {
    const state = parseBackup({
      projects: [{ id: 'p1', name: 'Trabajo' }],
      prompts: [
        { id: 'a', title: 'A', content: 'x', projectId: 'p1', folderId: 'no-existe' },
        { id: 'b', title: 'B', content: 'x', projectId: 'tampoco-existe' },
      ],
    });

    expect(state.prompts[0]).toMatchObject({ projectId: 'p1', folderId: null });
    expect(state.prompts[1]).toMatchObject({ projectId: null, folderId: null });
  });

  it('descarta las carpetas cuyo proyecto no viene en el archivo', () => {
    const state = parseBackup({
      projects: [{ id: 'p1', name: 'Trabajo' }],
      folders: [
        { id: 'f1', name: 'Válida', projectId: 'p1' },
        { id: 'f2', name: 'Huérfana', projectId: 'desaparecido' },
      ],
    });

    expect(state.folders.map((f) => f.id)).toEqual(['f1']);
  });

  it('ignora una categoría que no conoce', () => {
    const state = parseBackup({
      prompts: [{ id: 'a', title: 'A', content: 'x', category: 'Inventada' }],
    });

    expect(state.prompts[0].category).toBeNull();
  });

  it('pone fecha y posición cuando faltan, en lugar de dejarlas inválidas', () => {
    const state = parseBackup({ prompts: [{ id: 'a', title: 'A', content: 'x' }] });

    expect(Number.isNaN(Date.parse(state.prompts[0].createdAt))).toBe(false);
    expect(state.prompts[0].order).toBe(1);
  });

  it('acepta los nombres de colección en español', () => {
    const state = parseBackup({ carpetas: [], enlaces: [{ id: 'l', url: 'https://x.com' }] });

    expect(state.links).toHaveLength(1);
  });

  it('rechaza lo que no es un objeto', () => {
    expect(() => parseBackup('texto')).toThrow(ImportError);
    expect(() => parseBackup(null)).toThrow(ImportError);
  });

  it('rechaza un archivo del que no sale nada', () => {
    expect(() => parseBackup({ projects: [], prompts: [] })).toThrow(ImportError);
  });
});

describe('ida y vuelta', () => {
  it('lo exportado se vuelve a importar igual', () => {
    const original: LibraryState = parseBackup(volcado);
    const recuperado = parseBackup(createBackup(original));

    expect(recuperado).toEqual(original);
  });
});
