import { type Folder, type Location, MAX_DEPTH, type Project } from '@/features/folders/types';

/**
 * Jerarquía de carpetas.
 *
 * En la base conviven dos almacenes —`projects` para el primer nivel y
 * `folders` para los de abajo—, pero la interfaz no debería tener que saberlo:
 * para el usuario todo son carpetas, unas principales y otras anidadas. Este
 * módulo construye un árbol único a partir de ambas y concentra el filtrado,
 * los contadores y las reglas de profundidad, de modo que los componentes
 * trabajen siempre contra la misma estructura.
 */

export type NodeKind = 'project' | 'folder';

export type TreeNode = {
  /** Clave del filtro y del contador: `project:<id>` o `folder:<id>`. */
  key: string;
  id: string;
  kind: NodeKind;
  name: string;
  description: string | null;
  /** 1 para las carpetas principales; 2 y 3 para las anidadas. */
  depth: number;
  /** Proyecto raíz al que pertenece; él mismo, si es un proyecto. */
  projectId: string;
  children: TreeNode[];
};

const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });

function toNode(folder: Folder, depth: number): TreeNode {
  return {
    key: `folder:${folder.id}`,
    id: folder.id,
    kind: 'folder',
    name: folder.name,
    description: folder.description ?? null,
    depth,
    projectId: folder.projectId,
    children: [],
  };
}

/**
 * Monta el árbol completo a partir de las dos colecciones.
 *
 * Las carpetas cuyo padre ya no existe no se pierden: se recolocan colgando de
 * su proyecto. Es la red de seguridad para datos antiguos y para carreras
 * entre dos pestañas que borran y crean a la vez.
 */
export function buildTree(projects: Project[], folders: Folder[]): TreeNode[] {
  const childrenOf = new Map<string, Folder[]>();
  const folderIds = new Set(folders.map((folder) => folder.id));

  for (const folder of folders) {
    // Un padre desaparecido, o de otro proyecto, equivale a no tener padre.
    const parent = folder.parentId;
    const hasValidParent = !!parent && folderIds.has(parent);
    const bucket = hasValidParent ? `folder:${parent}` : `project:${folder.projectId}`;

    const list = childrenOf.get(bucket);
    if (list) list.push(folder);
    else childrenOf.set(bucket, [folder]);
  }

  const expand = (node: TreeNode): TreeNode => {
    if (node.depth >= MAX_DEPTH) return node;

    node.children = (childrenOf.get(node.key) ?? [])
      .slice()
      .sort(byName)
      .map((folder) => expand(toNode(folder, node.depth + 1)));

    return node;
  };

  return projects
    .slice()
    .sort(byName)
    .map((project) =>
      expand({
        key: `project:${project.id}`,
        id: project.id,
        kind: 'project',
        name: project.name,
        description: project.description ?? null,
        depth: 1,
        projectId: project.id,
        children: [],
      })
    );
}

/** Recorre el árbol entero en el orden en que se pinta. */
export function flatten(nodes: TreeNode[]): TreeNode[] {
  return nodes.flatMap((node) => [node, ...flatten(node.children)]);
}

/** Busca un nodo por su clave de filtro. */
export function findNode(nodes: TreeNode[], key: string): TreeNode | undefined {
  return flatten(nodes).find((node) => node.key === key);
}

/**
 * Ids de carpeta que cuelgan de un nodo, él incluido.
 *
 * Es lo que hace que entrar en una carpeta muestre también lo que hay en sus
 * subcarpetas, igual que entrar en un proyecto muestra todo lo suyo.
 */
export function subtreeFolderIds(node: TreeNode): Set<string> {
  return new Set(
    flatten([node])
      .filter((item) => item.kind === 'folder')
      .map((item) => item.id)
  );
}

/** Altura de un subárbol: 1 si es una hoja. */
export function height(node: TreeNode): number {
  return node.children.length === 0 ? 1 : 1 + Math.max(...node.children.map(height));
}

/** Un nodo admite hijos mientras quede sitio por debajo. */
export function canHaveChildren(node: TreeNode): boolean {
  return node.depth < MAX_DEPTH;
}

/** Destino de una carpeta al crearla o moverla. */
export type ParentRef =
  | { level: 'root' }
  | { level: 'nested'; projectId: string; parentId: string | null };

/** Traduce el valor del selector a un destino concreto. */
export function decodeParent(value: string, nodes: TreeNode[]): ParentRef {
  const node = findNode(nodes, value);
  if (!node) return { level: 'root' };

  return node.kind === 'project'
    ? { level: 'nested', projectId: node.id, parentId: null }
    : { level: 'nested', projectId: node.projectId, parentId: node.id };
}

/**
 * Deshace `encodeLocation`: de la clave de un nodo a la ubicación que guarda
 * un recurso. Una clave desconocida —una carpeta borrada mientras el
 * formulario estaba abierto— deja el recurso suelto en lugar de apuntar a algo
 * inexistente.
 */
export function decodeLocation(key: string, nodes: TreeNode[]): Location {
  const node = findNode(nodes, key);
  return node ? nodeLocation(node) : { projectId: null, folderId: null };
}

/** Ubicación en la que queda un recurso soltado sobre un nodo. */
export function nodeLocation(node: TreeNode): Location {
  return node.kind === 'project'
    ? { projectId: node.id, folderId: null }
    : { projectId: node.projectId, folderId: node.id };
}

export type ParentOption = {
  key: string;
  name: string;
  depth: number;
  disabled: boolean;
  /** Por qué no se puede elegir, para poder explicarlo en la interfaz. */
  reason?: string;
};

/**
 * Opciones del selector de ubicación, ya ordenadas como el árbol.
 *
 * Al mover una carpeta hay dos cosas que no se pueden hacer y que aquí quedan
 * desactivadas en lugar de fallar al guardar: meterla dentro de sí misma, y
 * colgarla de un sitio donde sus propias subcarpetas se saldrían del límite.
 */
export function parentOptions(nodes: TreeNode[], moving?: TreeNode): ParentOption[] {
  const movingHeight = moving ? height(moving) : 1;
  const forbidden = moving ? subtreeFolderIds(moving) : new Set<string>();

  return flatten(nodes).map((node) => {
    let disabled = false;
    let reason: string | undefined;

    if (moving && (node.key === moving.key || (node.kind === 'folder' && forbidden.has(node.id)))) {
      disabled = true;
      reason = 'No puede moverse dentro de sí misma';
    } else if (node.depth + movingHeight > MAX_DEPTH) {
      disabled = true;
      reason =
        movingHeight > 1
          ? 'Sus subcarpetas se saldrían del límite de niveles'
          : `El límite es de ${MAX_DEPTH} niveles`;
    }

    return { key: node.key, name: node.name, depth: node.depth, disabled, reason };
  });
}

/**
 * Cuenta los recursos de cada nodo, incluyendo los de sus descendientes.
 *
 * El contador de un proyecto sale directo de `projectId`, que está
 * desnormalizado justamente para eso; el de una carpeta se acumula de abajo
 * arriba en un solo recorrido.
 */
export function countTree(
  nodes: TreeNode[],
  items: { projectId: string | null; folderId?: string | null }[]
): Record<string, number> {
  const counts: Record<string, number> = { all: items.length, unassigned: 0 };
  const ownByFolder = new Map<string, number>();
  const byProject = new Map<string, number>();

  for (const item of items) {
    if (!item.projectId) {
      counts.unassigned += 1;
      continue;
    }
    byProject.set(item.projectId, (byProject.get(item.projectId) ?? 0) + 1);
    if (item.folderId) ownByFolder.set(item.folderId, (ownByFolder.get(item.folderId) ?? 0) + 1);
  }

  const rollUp = (node: TreeNode): number => {
    const fromChildren = node.children.reduce((total, child) => total + rollUp(child), 0);
    const total =
      node.kind === 'project'
        ? (byProject.get(node.id) ?? 0)
        : (ownByFolder.get(node.id) ?? 0) + fromChildren;

    counts[node.key] = total;
    return total;
  };

  nodes.forEach(rollUp);
  return counts;
}

/** Camino desde la carpeta principal hasta el nodo indicado, él incluido. */
export function pathTo(nodes: TreeNode[], key: string): TreeNode[] {
  for (const node of nodes) {
    if (node.key === key) return [node];

    const rest = pathTo(node.children, key);
    if (rest.length > 0) return [node, ...rest];
  }
  return [];
}
