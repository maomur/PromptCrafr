import { beforeEach, describe, expect, it } from 'vitest';
import { buildTree, findNode } from '@/features/folders/services/tree';
import type { Folder, Project } from '@/features/folders/types';
import type { LibraryState, Link, Prompt } from '@/features/library/types';
import {
  createNode,
  deleteFolder,
  deleteItem,
  deleteProject,
  emptyLibrary,
  moveTo,
  reorder,
  savePrompt,
  updateNode,
} from '@/features/library/services/mutations';

/**
 * Biblioteca de referencia:
 *
 *   Trabajo            p1
 *   ├── Nómina         f1   · prompt A
 *   │   └── Recibos    f2   · prompt B, enlace L
 *   Personal           p2
 */
const projects: Project[] = [
  { id: 'p1', name: 'Trabajo', createdAt: '' },
  { id: 'p2', name: 'Personal', createdAt: '' },
];
const folders: Folder[] = [
  { id: 'f1', name: 'Nómina', projectId: 'p1', parentId: null, createdAt: '' },
  { id: 'f2', name: 'Recibos', projectId: 'p1', parentId: 'f1', createdAt: '' },
];
const prompt = (id: string, projectId: string | null, folderId: string | null): Prompt => ({
  id, title: id, description: '', content: 'x', category: null,
  createdAt: '', updatedAt: '', projectId, folderId, order: 1,
});
const link: Link = {
  id: 'L', url: 'https://ejemplo.com', projectId: 'p1', folderId: 'f2',
  createdAt: '', order: 1,
};

let state: LibraryState;
let tree: ReturnType<typeof buildTree>;

beforeEach(() => {
  state = {
    projects: [...projects],
    folders: [...folders],
    prompts: [prompt('A', 'p1', 'f1'), prompt('B', 'p1', 'f2')],
    links: [{ ...link }],
  };
  tree = buildTree(state.projects, state.folders);
});

const node = (key: string) => findNode(tree, key)!;

describe('createNode', () => {
  it('sin padre crea una carpeta principal', () => {
    const { state: next, operations } = createNode(
      state, { name: 'Nueva', description: null, parent: 'none' }, tree
    );

    expect(next.projects).toHaveLength(3);
    expect(next.folders).toHaveLength(2);
    expect(operations).toHaveLength(1);
    expect(operations[0]).toMatchObject({ type: 'put', store: 'projects' });
  });

  it('con padre crea una subcarpeta que hereda la raíz', () => {
    const { state: next } = createNode(
      state, { name: 'Nueva', description: null, parent: 'folder:f1' }, tree
    );
    const creada = next.folders.find((f) => f.name === 'Nueva');

    expect(creada).toMatchObject({ projectId: 'p1', parentId: 'f1' });
  });

  it('no hace nada con un nombre vacío', () => {
    expect(createNode(state, { name: '   ', description: null, parent: 'none' }, tree).operations)
      .toEqual([]);
  });
});

describe('updateNode', () => {
  it('renombra una carpeta principal sin tocar nada más', () => {
    const { state: next, operations } = updateNode(
      state, node('project:p1'), { name: 'Curro', description: 'Nueva', parent: 'none' }, tree
    );

    expect(next.projects.find((p) => p.id === 'p1')).toMatchObject({
      name: 'Curro', description: 'Nueva',
    });
    expect(operations).toHaveLength(1);
  });

  it('al mudar una carpeta de proyecto arrastra subcarpetas y recursos', () => {
    const { state: next } = updateNode(
      state, node('folder:f1'), { name: 'Nómina', description: null, parent: 'project:p2' }, tree
    );

    // La carpeta, su hija y los dos recursos de dentro cambian de raíz.
    expect(next.folders.find((f) => f.id === 'f1')).toMatchObject({ projectId: 'p2', parentId: null });
    expect(next.folders.find((f) => f.id === 'f2')?.projectId).toBe('p2');
    expect(next.prompts.every((p) => p.projectId === 'p2')).toBe(true);
    expect(next.links[0].projectId).toBe('p2');
  });

  it('renombrar sin mover no reescribe la descendencia', () => {
    const { operations } = updateNode(
      state, node('folder:f1'), { name: 'Otra', description: null, parent: 'project:p1' }, tree
    );

    expect(operations).toHaveLength(1);
  });
});

describe('deleteProject', () => {
  it('borra su árbol y deja los recursos sueltos, sin borrarlos', () => {
    const { state: next, operations } = deleteProject(state, 'p1');

    expect(next.projects.map((p) => p.id)).toEqual(['p2']);
    expect(next.folders).toEqual([]);
    expect(next.prompts).toHaveLength(2);
    expect(next.prompts.every((p) => p.projectId === null && p.folderId === null)).toBe(true);
    expect(next.links[0]).toMatchObject({ projectId: null, folderId: null });

    // 1 proyecto + 2 carpetas borradas, 2 prompts + 1 enlace reubicados.
    expect(operations.filter((o) => o.type === 'delete')).toHaveLength(3);
    expect(operations.filter((o) => o.type === 'put')).toHaveLength(3);
  });
});

describe('deleteFolder', () => {
  it('sube el contenido al nivel de encima', () => {
    const { state: next } = deleteFolder(state, node('folder:f2'));

    expect(next.folders.map((f) => f.id)).toEqual(['f1']);
    // Lo que había en Recibos pasa a Nómina, que es su padre.
    expect(next.prompts.find((p) => p.id === 'B')).toMatchObject({ projectId: 'p1', folderId: 'f1' });
    expect(next.links[0]).toMatchObject({ folderId: 'f1' });
  });

  it('borrar una carpeta de primer nivel deja el contenido suelto en el proyecto', () => {
    const { state: next } = deleteFolder(state, node('folder:f1'));

    expect(next.folders).toEqual([]);
    expect(next.prompts.every((p) => p.projectId === 'p1' && p.folderId === null)).toBe(true);
  });
});

describe('savePrompt', () => {
  it('coloca el nuevo en lo alto de la lista', () => {
    const { state: next } = savePrompt(state, {
      title: 'Nuevo', description: '', content: 'x', category: null, projectId: null, folderId: null,
    });

    expect(next.prompts).toHaveLength(3);
    expect(next.prompts.at(-1)?.order).toBe(2);
  });

  it('al editar conserva la fecha de creación y cambia la de modificación', () => {
    const original = state.prompts[0];
    const { state: next } = savePrompt(state, { ...original, title: 'Cambiado' }, 'A');
    const editado = next.prompts.find((p) => p.id === 'A')!;

    expect(editado.title).toBe('Cambiado');
    expect(editado.createdAt).toBe(original.createdAt);
    expect(editado.updatedAt).not.toBe(original.updatedAt);
  });

  it('editar algo que ya no existe no escribe nada', () => {
    expect(savePrompt(state, state.prompts[0], 'fantasma').operations).toEqual([]);
  });
});

describe('moveTo y deleteItem', () => {
  it('mover cambia la ubicación y escribe un solo registro', () => {
    const { state: next, operations } = moveTo(state, 'prompt', 'A', {
      projectId: 'p2', folderId: null,
    });

    expect(next.prompts.find((p) => p.id === 'A')).toMatchObject({ projectId: 'p2', folderId: null });
    expect(operations).toEqual([expect.objectContaining({ type: 'put', store: 'prompts' })]);
  });

  it('borrar quita el recurso y sólo ese', () => {
    const { state: next, operations } = deleteItem(state, 'link', 'L');

    expect(next.links).toEqual([]);
    expect(next.prompts).toHaveLength(2);
    expect(operations).toEqual([{ type: 'delete', store: 'links', id: 'L' }]);
  });
});

describe('reorder', () => {
  it('reparte las posiciones y sólo escribe lo que cambia', () => {
    const conOrden: LibraryState = {
      ...state,
      prompts: [
        { ...prompt('A', null, null), order: 3 },
        { ...prompt('B', null, null), order: 2 },
        { ...prompt('C', null, null), order: 1 },
      ],
    };

    const { state: next, operations } = reorder(conOrden, 'prompt', conOrden.prompts, 2, 0);
    const porId = Object.fromEntries(next.prompts.map((p) => [p.id, p.order]));

    expect(porId).toEqual({ C: 3, A: 2, B: 1 });
    expect(operations).toHaveLength(3);
  });

  it('soltar en el mismo sitio no escribe nada', () => {
    expect(reorder(state, 'prompt', state.prompts, 1, 1).operations).toEqual([]);
  });
});

describe('estado vacío', () => {
  it('arranca sin nada', () => {
    expect(emptyLibrary).toEqual({ projects: [], folders: [], prompts: [], links: [] });
  });
});
