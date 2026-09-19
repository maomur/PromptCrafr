import { describe, expect, it } from 'vitest';
import { looksLikeCsv, parseCsvBackup, parseCsvRows } from '@/features/backup/services/csv-import';
import { CSV_HEADERS, promptsToCsv } from '@/features/library/services/csv';
import { buildTree, findNode } from '@/features/folders/services/tree';
import type { Prompt } from '@/features/library/types';

describe('parseCsvRows', () => {
  it('respeta los saltos de línea dentro de un campo entrecomillado', () => {
    const filas = parseCsvRows('a,b\r\n"línea 1\nlínea 2",c');

    expect(filas).toHaveLength(2);
    expect(filas[1][0]).toBe('línea 1\nlínea 2');
  });

  it('entiende las comillas dobladas', () => {
    expect(parseCsvRows('"dijo ""hola"""')[0][0]).toBe('dijo "hola"');
  });

  it('acepta comas dentro de un campo', () => {
    expect(parseCsvRows('"uno, dos",tres')[0]).toEqual(['uno, dos', 'tres']);
  });

  it('se traga el BOM que antepone Excel', () => {
    expect(parseCsvRows('﻿a,b')[0]).toEqual(['a', 'b']);
  });

  it('ignora las líneas en blanco del final', () => {
    expect(parseCsvRows('a,b\r\nc,d\r\n\r\n')).toHaveLength(2);
  });
});

describe('looksLikeCsv', () => {
  it('reconoce el CSV que exporta la aplicación', () => {
    expect(looksLikeCsv(CSV_HEADERS.join(',') + '\r\nUno,,Contenido,,,,')).toBe(true);
  });

  it('no confunde un JSON con un CSV', () => {
    expect(looksLikeCsv('{"prompts":[]}')).toBe(false);
  });
});

describe('ida y vuelta: exportar a CSV y volver a importarlo', () => {
  const prompt = (extra: Partial<Prompt>): Prompt => ({
    id: 'x', title: 'T', description: 'D', content: 'C', category: null,
    createdAt: '2026-09-19T10:30:00.000Z', updatedAt: '2026-09-19T10:30:00.000Z',
    projectId: null, folderId: null, order: 1, ...extra,
  });

  const tree = buildTree(
    [{ id: 'p1', name: 'Trabajo', createdAt: '' }],
    [
      { id: 'f1', name: 'Nómina', projectId: 'p1', parentId: null, createdAt: '' },
      { id: 'f2', name: 'Recibos', projectId: 'p1', parentId: 'f1', createdAt: '' },
    ]
  );

  const originales: Prompt[] = [
    prompt({ id: 'a', title: 'Con "comillas" y, comas',
      content: 'Actúa como experto.\nResponde en español.',
      category: 'Textos', projectId: 'p1', folderId: 'f2' }),
    prompt({ id: 'b', title: 'Ñandú suelto', description: '', content: 'x' }),
  ];

  const csv = promptsToCsv(originales, tree);
  const { state } = parseCsvBackup(csv);

  it('recupera todos los prompts', () => {
    expect(state.prompts).toHaveLength(2);
  });

  it('conserva el texto con comillas, comas y saltos de línea', () => {
    const a = state.prompts.find((p) => p.title.includes('comillas'))!;

    expect(a.title).toBe('Con "comillas" y, comas');
    expect(a.content).toBe('Actúa como experto.\nResponde en español.');
    expect(a.category).toBe('Textos');
  });

  it('reconstruye la jerarquía desde la columna de ruta', () => {
    const arbol = buildTree(state.projects, state.folders);

    expect(state.projects.map((p) => p.name)).toEqual(['Trabajo']);
    expect(state.folders.map((f) => f.name).sort()).toEqual(['Nómina', 'Recibos']);
    expect(findNode(arbol, `folder:${state.folders.find((f) => f.name === 'Recibos')!.id}`)?.depth).toBe(3);
  });

  it('deja suelto lo que no tenía carpeta', () => {
    const b = state.prompts.find((p) => p.title === 'Ñandú suelto')!;

    expect(b.projectId).toBeNull();
    expect(b.folderId).toBeNull();
  });

  it('no duplica una carpeta compartida por varias filas', () => {
    const muchos = Array.from({ length: 5 }, (_, i) =>
      prompt({ id: `p${i}`, title: `T${i}`, projectId: 'p1', folderId: 'f1' })
    );
    const { state: repetido } = parseCsvBackup(promptsToCsv(muchos, tree));

    expect(repetido.projects).toHaveLength(1);
    expect(repetido.folders).toHaveLength(1);
  });

  it('respeta el orden en que venían', () => {
    expect(state.prompts[0].order).toBeGreaterThan(state.prompts[1].order);
  });

  it('descarta las filas sin título o sin contenido, y las cuenta', () => {
    const { state: parcial, discarded } = parseCsvBackup(
      CSV_HEADERS.join(',') + '\r\nSin contenido,,,,,,\r\n,,Sin título,,,,\r\nBueno,,Contenido,,,,'
    );

    expect(parcial.prompts.map((p) => p.title)).toEqual(['Bueno']);
    expect(discarded).toBe(2);
  });
});
