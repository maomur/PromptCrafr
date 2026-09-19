import type { DbOperation } from '@/lib/db';
import { newId } from '@/lib/id';
import {
  createFolder,
  createProject,
  editFolder,
  editProject,
  planFolderRemoval,
  planProjectRemoval,
} from '@/features/folders/services/folders';
import { decodeParent, type TreeNode } from '@/features/folders/services/tree';
import type { FolderInput, Location } from '@/features/folders/types';
import { assignOrders, moveItem, nextOrder, type Sortable } from '@/features/library/services/ordering';
import type {
  Link,
  LinkInput,
  LibraryState,
  Mutation,
  Prompt,
  PromptInput,
} from '@/features/library/types';

/**
 * Todas las operaciones de la biblioteca, como funciones puras.
 *
 * Cada una recibe el estado actual y devuelve el estado siguiente junto con lo
 * que hay que escribir en la base. No abren la base ni tocan React, así que se
 * pueden probar de una en una; el hook se limita a aplicar lo que deciden.
 *
 * Las operaciones de un mismo cambio se escriben en una única transacción, así
 * que mover una carpeta con su contenido no puede quedarse a medias.
 */

/** Los dos tipos de recurso que guarda la biblioteca. */
export type ItemKind = 'prompt' | 'link';

function storeFor(kind: ItemKind): 'prompts' | 'links' {
  return kind === 'prompt' ? 'prompts' : 'links';
}

/** Devuelve el estado sin cambios y sin nada que escribir. */
function unchanged(state: LibraryState): Mutation {
  return { state, operations: [] };
}

// ---------------------------------------------------------------- carpetas

/** Crea una carpeta principal o una subcarpeta, según la ubicación elegida. */
export function createNode(state: LibraryState, input: FolderInput, tree: TreeNode[]): Mutation {
  if (!input.name.trim()) return unchanged(state);

  const parent = decodeParent(input.parent, tree);

  if (parent.level === 'root') {
    const project = createProject(input);
    return {
      state: { ...state, projects: [...state.projects, project] },
      operations: [{ type: 'put', store: 'projects', value: project }],
    };
  }

  const folder = createFolder(input, parent);
  return {
    state: { ...state, folders: [...state.folders, folder] },
    operations: [{ type: 'put', store: 'folders', value: folder }],
  };
}

/**
 * Edita un nodo y, si es una carpeta que cambia de sitio, muda con ella todo
 * lo que cuelga.
 *
 * `projectId` está repetido en cada descendiente para poder filtrar y contar
 * un proyecto sin recorrer el árbol, así que una mudanza tiene que
 * reescribirlo en todos ellos.
 */
export function updateNode(
  state: LibraryState,
  node: TreeNode,
  input: FolderInput,
  tree: TreeNode[]
): Mutation {
  if (!input.name.trim()) return unchanged(state);

  if (node.kind === 'project') {
    const current = state.projects.find((project) => project.id === node.id);
    if (!current) return unchanged(state);

    const updated = editProject(current, input);
    return {
      state: {
        ...state,
        projects: state.projects.map((project) => (project.id === node.id ? updated : project)),
      },
      operations: [{ type: 'put', store: 'projects', value: updated }],
    };
  }

  const current = state.folders.find((folder) => folder.id === node.id);
  if (!current) return unchanged(state);

  const parent = decodeParent(input.parent, tree);
  const destination =
    parent.level === 'root'
      ? { projectId: current.projectId, parentId: null }
      : { projectId: parent.projectId, parentId: parent.parentId };

  const updated = editFolder(current, input, destination);
  const operations: DbOperation[] = [{ type: 'put', store: 'folders', value: updated }];

  let { folders, prompts, links } = state;
  folders = folders.map((folder) => (folder.id === node.id ? updated : folder));

  if (destination.projectId !== current.projectId) {
    const moved = new Set(
      [node, ...descendants(node)].filter((item) => item.kind === 'folder').map((item) => item.id)
    );

    folders = folders.map((folder) => {
      if (folder.id === node.id || !moved.has(folder.id)) return folder;
      const next = { ...folder, projectId: destination.projectId };
      operations.push({ type: 'put', store: 'folders', value: next });
      return next;
    });

    prompts = prompts.map((prompt) => {
      if (!prompt.folderId || !moved.has(prompt.folderId)) return prompt;
      const next = { ...prompt, projectId: destination.projectId };
      operations.push({ type: 'put', store: 'prompts', value: next });
      return next;
    });

    links = links.map((link) => {
      if (!link.folderId || !moved.has(link.folderId)) return link;
      const next = { ...link, projectId: destination.projectId };
      operations.push({ type: 'put', store: 'links', value: next });
      return next;
    });
  }

  return { state: { ...state, folders, prompts, links }, operations };
}

/** Todos los nodos que cuelgan de uno, él excluido. */
function descendants(node: TreeNode): TreeNode[] {
  return node.children.flatMap((child) => [child, ...descendants(child)]);
}

/** Borra una carpeta principal con su árbol; los recursos quedan sueltos. */
export function deleteProject(state: LibraryState, projectId: string): Mutation {
  const removedFolders = planProjectRemoval(projectId, state.folders);
  const operations: DbOperation[] = [{ type: 'delete', store: 'projects', id: projectId }];

  for (const id of removedFolders) {
    operations.push({ type: 'delete', store: 'folders', id });
  }

  const orphan = { projectId: null, folderId: null };
  const prompts = state.prompts.map((prompt) => {
    if (prompt.projectId !== projectId) return prompt;
    const next = { ...prompt, ...orphan };
    operations.push({ type: 'put', store: 'prompts', value: next });
    return next;
  });
  const links = state.links.map((link) => {
    if (link.projectId !== projectId) return link;
    const next = { ...link, ...orphan };
    operations.push({ type: 'put', store: 'links', value: next });
    return next;
  });

  return {
    state: {
      projects: state.projects.filter((project) => project.id !== projectId),
      folders: state.folders.filter((folder) => !removedFolders.has(folder.id)),
      prompts,
      links,
    },
    operations,
  };
}

/** Borra una carpeta con sus subcarpetas; el contenido sube un nivel. */
export function deleteFolder(state: LibraryState, node: TreeNode): Mutation {
  const { removed, destination } = planFolderRemoval(node, state.folders);
  if (destination.projectId === null) return unchanged(state);

  const operations: DbOperation[] = [];
  for (const id of removed) operations.push({ type: 'delete', store: 'folders', id });

  const relocate = <T extends { folderId?: string | null }>(items: T[], store: 'prompts' | 'links') =>
    items.map((item) => {
      if (!item.folderId || !removed.has(item.folderId)) return item;
      const next = { ...item, ...destination };
      operations.push({ type: 'put', store, value: next as unknown as { id: string } });
      return next;
    });

  return {
    state: {
      ...state,
      folders: state.folders.filter((folder) => !removed.has(folder.id)),
      prompts: relocate(state.prompts, 'prompts'),
      links: relocate(state.links, 'links'),
    },
    operations,
  };
}

// ---------------------------------------------------------------- recursos

/** Crea o actualiza un prompt. */
export function savePrompt(state: LibraryState, input: PromptInput, id?: string): Mutation {
  const now = new Date().toISOString();

  if (id) {
    const current = state.prompts.find((prompt) => prompt.id === id);
    if (!current) return unchanged(state);

    const updated: Prompt = { ...current, ...input, updatedAt: now };
    return {
      state: { ...state, prompts: state.prompts.map((p) => (p.id === id ? updated : p)) },
      operations: [{ type: 'put', store: 'prompts', value: updated }],
    };
  }

  const created: Prompt = {
    ...input,
    id: newId(),
    createdAt: now,
    updatedAt: now,
    order: nextOrder(state.prompts),
  };
  return {
    state: { ...state, prompts: [...state.prompts, created] },
    operations: [{ type: 'put', store: 'prompts', value: created }],
  };
}

/** Crea o actualiza un enlace. */
export function saveLink(state: LibraryState, input: LinkInput, id?: string): Mutation {
  const now = new Date().toISOString();

  if (id) {
    const current = state.links.find((link) => link.id === id);
    if (!current) return unchanged(state);

    const updated: Link = { ...current, ...input, updatedAt: now };
    return {
      state: { ...state, links: state.links.map((l) => (l.id === id ? updated : l)) },
      operations: [{ type: 'put', store: 'links', value: updated }],
    };
  }

  const created: Link = {
    ...input,
    id: newId(),
    createdAt: now,
    updatedAt: now,
    order: nextOrder(state.links),
  };
  return {
    state: { ...state, links: [...state.links, created] },
    operations: [{ type: 'put', store: 'links', value: created }],
  };
}

/** Borra un prompt o un enlace. */
export function deleteItem(state: LibraryState, kind: ItemKind, id: string): Mutation {
  const store = storeFor(kind);
  return {
    state: {
      ...state,
      [kind === 'prompt' ? 'prompts' : 'links']: (kind === 'prompt' ? state.prompts : state.links)
        .filter((item) => item.id !== id),
    } as LibraryState,
    operations: [{ type: 'delete', store, id }],
  };
}

/** Archiva un recurso en otra carpeta. */
export function moveTo(
  state: LibraryState,
  kind: ItemKind,
  id: string,
  location: Location
): Mutation {
  const store = storeFor(kind);
  const items = kind === 'prompt' ? state.prompts : state.links;
  const current = items.find((item) => item.id === id);
  if (!current) return unchanged(state);

  const updated = { ...current, ...location };
  return {
    state: {
      ...state,
      [store]: items.map((item) => (item.id === id ? updated : item)),
    } as LibraryState,
    operations: [{ type: 'put', store, value: updated }],
  };
}

/**
 * Persiste el resultado de arrastrar un elemento dentro de la lista visible.
 *
 * `visible` es la lista tal y como la ve el usuario, ya filtrada, porque los
 * índices se refieren a ella y no a la colección completa.
 */
export function reorder(
  state: LibraryState,
  kind: ItemKind,
  visible: Sortable[],
  from: number,
  to: number
): Mutation {
  if (from === to || !visible[from]) return unchanged(state);

  const changes = assignOrders(moveItem(visible, from, to));
  if (changes.size === 0) return unchanged(state);

  const store = storeFor(kind);
  const operations: DbOperation[] = [];
  const items = (kind === 'prompt' ? state.prompts : state.links).map((item) => {
    const order = changes.get(item.id);
    if (order === undefined) return item;

    const next = { ...item, order };
    operations.push({ type: 'put', store, value: next });
    return next;
  });

  return { state: { ...state, [store]: items } as LibraryState, operations };
}

/** Reemplaza la biblioteca entera. Lo usa la importación de una copia. */
export function replaceAll(next: LibraryState): Mutation {
  const operations: DbOperation[] = [
    ...next.projects.map((value) => ({ type: 'put', store: 'projects', value }) as const),
    ...next.folders.map((value) => ({ type: 'put', store: 'folders', value }) as const),
    ...next.prompts.map((value) => ({ type: 'put', store: 'prompts', value }) as const),
    ...next.links.map((value) => ({ type: 'put', store: 'links', value }) as const),
  ];

  return { state: next, operations };
}

/** Estado vacío, para arrancar antes de leer la base. */
export const emptyLibrary: LibraryState = { projects: [], folders: [], prompts: [], links: [] };
