import { describe, expect, it } from 'vitest';
import { type Folder, type LibraryFilter, type Location, MAX_DEPTH, type Project, matchesFilter } from '@/features/folders/types';
import {
  buildTree,
  countTree,
  decodeLocation,
  decodeParent,
  findNode,
  flatten,
  height,
  parentOptions,
  pathTo,
  subtreeFolderIds,
} from '@/features/folders/services/tree';

const project = (id: string, name: string): Project => ({
  id,
  name,
  createdAt: '',
});

const folder = (id: string, name: string, projectId: string, parentId: string | null = null): Folder => ({
  id,
  name,
  projectId,
  parentId,
  createdAt: '',
});

/**
 * Árbol de referencia, con las tres profundidades ocupadas:
 *
 *   Personal
 *   Trabajo
 *   ├── Gastos
 *   └── Nómina
 *       └── Recibos 2026
 */
const projects = [project('trabajo', 'Trabajo'), project('personal', 'Personal')];
const folders = [
  folder('nomina', 'Nómina', 'trabajo'),
  folder('gastos', 'Gastos', 'trabajo'),
  folder('recibos', 'Recibos 2026', 'trabajo', 'nomina'),
];
const tree = buildTree(projects, folders);

const node = (key: string) => {
  const found = findNode(tree, key);
  if (!found) throw new Error(`No existe el nodo ${key}`);
  return found;
};

describe('buildTree', () => {
  it('ordena alfabéticamente en cada nivel', () => {
    expect(tree.map((item) => item.name)).toEqual(['Personal', 'Trabajo']);
    expect(node('project:trabajo').children.map((item) => item.name)).toEqual(['Gastos', 'Nómina']);
  });

  it('asigna la profundidad de cada nivel', () => {
    expect(node('project:trabajo').depth).toBe(1);
    expect(node('folder:nomina').depth).toBe(2);
    expect(node('folder:recibos').depth).toBe(3);
  });

  it('repite la raíz en los descendientes', () => {
    expect(node('folder:recibos').projectId).toBe('trabajo');
  });

  it('recorre el árbol en el orden en que se pinta', () => {
    expect(flatten(tree).map((item) => item.name)).toEqual([
      'Personal',
      'Trabajo',
      'Gastos',
      'Nómina',
      'Recibos 2026',
    ]);
  });

  it('recoloca bajo su proyecto una carpeta cuyo padre ya no existe', () => {
    const roto = buildTree(projects, [...folders, folder('perdida', 'Perdida', 'trabajo', 'fantasma')]);

    expect(findNode(roto, 'project:trabajo')?.children.map((item) => item.name)).toEqual([
      'Gastos',
      'Nómina',
      'Perdida',
    ]);
  });

  it('ignora un cuarto nivel que llegue en los datos', () => {
    const profundo = buildTree(projects, [...folders, folder('cuarto', 'Cuarto', 'trabajo', 'recibos')]);

    expect(findNode(profundo, 'folder:recibos')?.children).toEqual([]);
  });
});

describe('subtreeFolderIds', () => {
  it('incluye la propia carpeta y sus descendientes', () => {
    expect([...subtreeFolderIds(node('folder:nomina'))].sort()).toEqual(['nomina', 'recibos']);
  });

  it('deja fuera los proyectos, que no son carpetas archivables', () => {
    expect([...subtreeFolderIds(node('project:trabajo'))].sort()).toEqual([
      'gastos',
      'nomina',
      'recibos',
    ]);
  });
});

describe('matchesFilter', () => {
  const enRecibos: Location = { projectId: 'trabajo', folderId: 'recibos' };
  const enNomina: Location = { projectId: 'trabajo', folderId: 'nomina' };
  const enGastos: Location = { projectId: 'trabajo', folderId: 'gastos' };
  const sueltoEnTrabajo: Location = { projectId: 'trabajo', folderId: null };
  const sinCarpeta: Location = { projectId: null, folderId: null };

  const filtroNomina: LibraryFilter = { type: 'folder', projectId: 'trabajo', folderId: 'nomina' };
  const alcance = subtreeFolderIds(node('folder:nomina'));

  it('una carpeta muestra también lo de sus subcarpetas', () => {
    expect(matchesFilter(enRecibos, filtroNomina, alcance)).toBe(true);
    expect(matchesFilter(enNomina, filtroNomina, alcance)).toBe(true);
  });

  it('una carpeta no muestra lo de sus hermanas ni lo suelto del proyecto', () => {
    expect(matchesFilter(enGastos, filtroNomina, alcance)).toBe(false);
    expect(matchesFilter(sueltoEnTrabajo, filtroNomina, alcance)).toBe(false);
  });

  it('un proyecto muestra su contenido a cualquier profundidad', () => {
    const filtro: LibraryFilter = { type: 'project', projectId: 'trabajo' };

    expect(matchesFilter(enRecibos, filtro)).toBe(true);
    expect(matchesFilter(sueltoEnTrabajo, filtro)).toBe(true);
    expect(matchesFilter(sinCarpeta, filtro)).toBe(false);
  });

  it('«Sin carpeta» recoge lo que no tiene raíz', () => {
    expect(matchesFilter(sinCarpeta, { type: 'unassigned' })).toBe(true);
    expect(matchesFilter(enRecibos, { type: 'unassigned' })).toBe(false);
  });

  it('tolera el valor antiguo «none» en lugar de null', () => {
    expect(matchesFilter({ projectId: 'none', folderId: null }, { type: 'unassigned' })).toBe(true);
  });

  it('«Todos» no filtra nada', () => {
    expect(matchesFilter(sinCarpeta, { type: 'all' })).toBe(true);
    expect(matchesFilter(enRecibos, { type: 'all' })).toBe(true);
  });
});

describe('countTree', () => {
  const items = [
    { projectId: 'trabajo', folderId: 'recibos' },
    { projectId: 'trabajo', folderId: 'recibos' },
    { projectId: 'trabajo', folderId: 'nomina' },
    { projectId: 'trabajo', folderId: 'gastos' },
    { projectId: 'trabajo', folderId: null },
    { projectId: null, folderId: null },
  ];
  const counts = countTree(tree, items);

  it('cuenta el total y lo que no está archivado', () => {
    expect(counts.all).toBe(6);
    expect(counts.unassigned).toBe(1);
  });

  it('acumula de abajo arriba', () => {
    expect(counts['folder:recibos']).toBe(2);
    expect(counts['folder:nomina']).toBe(3);
    expect(counts['folder:gastos']).toBe(1);
  });

  it('un proyecto suma todo lo suyo, a cualquier profundidad', () => {
    expect(counts['project:trabajo']).toBe(5);
  });

  it('un proyecto vacío cuenta cero en lugar de quedar sin contador', () => {
    expect(counts['project:personal']).toBe(0);
  });
});

describe('pathTo', () => {
  it('devuelve el camino desde la carpeta principal', () => {
    expect(pathTo(tree, 'folder:recibos').map((item) => item.name)).toEqual([
      'Trabajo',
      'Nómina',
      'Recibos 2026',
    ]);
  });

  it('devuelve un solo paso para una carpeta principal', () => {
    expect(pathTo(tree, 'project:trabajo').map((item) => item.name)).toEqual(['Trabajo']);
  });

  it('devuelve vacío si el nodo no existe', () => {
    expect(pathTo(tree, 'folder:fantasma')).toEqual([]);
  });
});

describe('parentOptions', () => {
  const disponibles = (moving?: Parameters<typeof parentOptions>[1]) =>
    Object.fromEntries(parentOptions(tree, moving).map((o) => [o.key, o.disabled]));

  it('al crear, deja elegir cualquier nivel salvo el último', () => {
    const opciones = disponibles();

    expect(opciones['project:trabajo']).toBe(false);
    expect(opciones['folder:nomina']).toBe(false);
    expect(opciones['folder:recibos']).toBe(true);
  });

  it('no deja mover una carpeta dentro de sí misma ni de su descendencia', () => {
    const opciones = disponibles(node('folder:nomina'));

    expect(opciones['folder:nomina']).toBe(true);
    expect(opciones['folder:recibos']).toBe(true);
  });

  it('no deja mover una carpeta donde sus hijas se saldrían del límite', () => {
    expect(height(node('folder:nomina'))).toBe(2);
    // Dentro de «Gastos» (nivel 2), «Recibos» quedaría en un cuarto nivel.
    expect(disponibles(node('folder:nomina'))['folder:gastos']).toBe(true);
  });

  it('sí deja mover una hoja a un segundo nivel', () => {
    const opciones = disponibles(node('folder:gastos'));

    expect(height(node('folder:gastos'))).toBe(1);
    expect(opciones['folder:nomina']).toBe(false);
    expect(opciones['folder:recibos']).toBe(true);
  });

  it('deja mover una carpeta a otra carpeta principal', () => {
    expect(disponibles(node('folder:nomina'))['project:personal']).toBe(false);
  });

  it('explica por qué una opción está desactivada', () => {
    const recibos = parentOptions(tree).find((o) => o.key === 'folder:recibos');

    expect(recibos?.reason).toContain(String(MAX_DEPTH));
  });
});

describe('decodeLocation', () => {
  it('traduce un proyecto', () => {
    expect(decodeLocation('project:trabajo', tree)).toEqual({
      projectId: 'trabajo',
      folderId: null,
    });
  });

  it('traduce una carpeta del último nivel conservando su raíz', () => {
    expect(decodeLocation('folder:recibos', tree)).toEqual({
      projectId: 'trabajo',
      folderId: 'recibos',
    });
  });

  it('deja el recurso suelto si el destino ya no existe', () => {
    expect(decodeLocation('folder:fantasma', tree)).toEqual({ projectId: null, folderId: null });
  });
});

describe('decodeParent', () => {
  it('sin padre crea una carpeta principal', () => {
    expect(decodeParent('none', tree)).toEqual({ level: 'root' });
  });

  it('dentro de un proyecto, la carpeta cuelga de él sin padre intermedio', () => {
    expect(decodeParent('project:trabajo', tree)).toEqual({
      level: 'nested',
      projectId: 'trabajo',
      parentId: null,
    });
  });

  it('dentro de una carpeta, hereda la raíz del padre', () => {
    expect(decodeParent('folder:nomina', tree)).toEqual({
      level: 'nested',
      projectId: 'trabajo',
      parentId: 'nomina',
    });
  });
});
