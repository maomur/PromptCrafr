import { describe, expect, it } from 'vitest';
import { CSV_HEADERS, csvFileName, promptsToCsv, toCsv } from '@/features/library/services/csv';
import { type Folder, type Project } from '@/features/folders/types';
import { type Prompt } from '@/features/library/types';
import { buildTree } from '@/features/folders/tree';

const tree = buildTree(
  [{ id: 'trabajo', name: 'Trabajo', createdAt: '' }] as Project[],
  [
    { id: 'nomina', name: 'Nómina', projectId: 'trabajo', parentId: null, createdAt: '' },
    { id: 'recibos', name: 'Recibos', projectId: 'trabajo', parentId: 'nomina', createdAt: '' },
  ] as Folder[]
);

const prompt = (extra: Partial<Prompt>): Prompt => ({
  id: 'p1',
  title: 'Título',
  description: 'Descripción',
  content: 'Contenido',
  category: null,
  createdAt: '2026-09-19T10:30:00.000Z',
  updatedAt: '2026-09-19T10:30:00.000Z',
  projectId: null,
  folderId: null,
  order: 1,
  ...extra,
});

describe('toCsv', () => {
  it('deja en paz los campos que no necesitan nada', () => {
    expect(toCsv([['a', 'b']])).toBe('a,b');
  });

  it('entrecomilla lo que lleva una coma', () => {
    expect(toCsv([['uno, dos', 'tres']])).toBe('"uno, dos",tres');
  });

  it('dobla las comillas de dentro', () => {
    expect(toCsv([['dijo "hola"']])).toBe('"dijo ""hola"""');
  });

  it('entrecomilla los saltos de línea en lugar de partir la fila', () => {
    expect(toCsv([['línea 1\nlínea 2']])).toBe('"línea 1\nlínea 2"');
  });

  it('separa las filas con CRLF, como manda el RFC', () => {
    expect(toCsv([['a'], ['b']])).toBe('a\r\nb');
  });

  it('no confunde un campo vacío con uno ausente', () => {
    expect(toCsv([['', 'b', '']])).toBe(',b,');
  });
});

describe('promptsToCsv', () => {
  it('abre con la cabecera', () => {
    expect(promptsToCsv([], tree).split('\r\n')[0]).toBe(CSV_HEADERS.join(','));
  });

  it('escribe la ruta completa de la carpeta', () => {
    const csv = promptsToCsv([prompt({ projectId: 'trabajo', folderId: 'recibos' })], tree);

    expect(csv).toContain('Trabajo / Nómina / Recibos');
  });

  it('deja la carpeta vacía si el prompt está suelto', () => {
    const fila = promptsToCsv([prompt({})], tree).split('\r\n')[1];

    expect(fila.split(',')[4]).toBe('');
  });

  it('formatea las fechas de forma ordenable', () => {
    const csv = promptsToCsv([prompt({})], tree);

    expect(csv).toMatch(/2026-09-19 \d{2}:\d{2}/);
  });

  it('aguanta un prompt sin fecha en lugar de reventar', () => {
    const csv = promptsToCsv([prompt({ createdAt: '', updatedAt: 'no-es-una-fecha' })], tree);

    expect(csv.split('\r\n')[1]).toMatch(/,,$/);
  });

  it('no rompe la fila aunque el contenido tenga saltos y comillas', () => {
    const csv = promptsToCsv([prompt({ content: 'Actúa como "experto".\nResponde en español.' })], tree);

    // Dos líneas de cabecera y datos, más la que parte el propio contenido.
    expect(csv.split('\r\n')).toHaveLength(2);
    expect(csv).toContain('"Actúa como ""experto"".\nResponde en español."');
  });
});

describe('csvFileName', () => {
  it('lleva la fecha para no pisar exportaciones anteriores', () => {
    expect(csvFileName(new Date('2026-09-19T12:00:00'))).toBe('promptcraft-prompts-2026-09-19.csv');
  });
});
