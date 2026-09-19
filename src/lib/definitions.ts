export const promptCategories = ['Video', 'Imagen', 'Textos', 'Otros'] as const;

export type PromptCategory = (typeof promptCategories)[number];

/** Valor especial usado en los <Select> para representar "sin asignar". */
export const NO_SELECTION = 'none';

export type Project = {
  id: string;
  name: string;
  createdAt: string;
  ownerId: string;
};

/**
 * Subdivisión dentro de un proyecto.
 *
 * Es una colección aparte y no un `parentId` en `Project` porque la jerarquía
 * tiene exactamente dos niveles: un recurso vive suelto en un proyecto o
 * dentro de una de sus carpetas, nunca más hondo.
 */
export type Folder = {
  id: string;
  name: string;
  /** Proyecto al que pertenece. Una carpeta nunca existe fuera de un proyecto. */
  projectId: string;
  createdAt: string;
  ownerId: string;
};

export type Prompt = {
  id: string;
  title: string;
  description: string;
  content: string;
  category: PromptCategory | null;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  projectId: string | null;
  /** Carpeta dentro del proyecto, o null si está suelto en él. */
  folderId?: string | null;
  /** Posición en la lista. Mayor = más arriba. */
  order: number;
};

export type Link = {
  id: string;
  url: string;
  projectId: string | null;
  /** Carpeta dentro del proyecto, o null si está suelto en él. */
  folderId?: string | null;
  title?: string | null;
  description?: string | null;
  category?: PromptCategory | null;
  createdAt: string;
  updatedAt?: string;
  ownerId: string;
  /** Posición en la lista. Mayor = más arriba. */
  order: number;
};

/** Campos que rellena el usuario al crear o editar un prompt. */
export type PromptInput = Pick<
  Prompt,
  'title' | 'description' | 'content' | 'category' | 'projectId' | 'folderId'
>;

/** Campos que rellena el usuario al crear o editar un enlace. */
export type LinkInput = Pick<
  Link,
  'url' | 'title' | 'description' | 'category' | 'projectId' | 'folderId'
>;

/** Cualquier recurso de la biblioteca que se pueda ordenar y archivar en un proyecto. */
export type LibraryItem = Prompt | Link;

/**
 * Qué parte de la biblioteca se está mirando.
 *
 * Es una unión discriminada y no una cadena con prefijos porque el filtro de
 * carpeta necesita arrastrar también su proyecto, para poder dejar el árbol
 * desplegado por donde toca.
 */
export type LibraryFilter =
  | { type: 'all' }
  | { type: 'unassigned' }
  | { type: 'project'; projectId: string }
  | { type: 'folder'; projectId: string; folderId: string };

/** Identificador estable de un filtro, para comparar cuál está activo. */
export function filterKey(filter: LibraryFilter): string {
  switch (filter.type) {
    case 'project':
      return `project:${filter.projectId}`;
    case 'folder':
      return `folder:${filter.folderId}`;
    default:
      return filter.type;
  }
}

/** Decide si un recurso entra en la vista actual. */
export function matchesFilter(item: Location, filter: LibraryFilter): boolean {
  switch (filter.type) {
    case 'all':
      return true;
    // Los valores antiguos usaban la cadena "none" en lugar de null.
    case 'unassigned':
      return !item.projectId || item.projectId === NO_SELECTION;
    case 'project':
      return item.projectId === filter.projectId;
    case 'folder':
      return item.folderId === filter.folderId;
  }
}

/** Dónde está archivado un recurso. */
export type Location = {
  projectId: string | null;
  folderId: string | null;
};

/**
 * Codifica una ubicación como un único valor de <Select>.
 *
 * Los desplegables sólo manejan cadenas, y el prefijo evita tener que adivinar
 * si un id es de proyecto o de carpeta.
 */
export function encodeLocation(location: Location): string {
  if (location.folderId) return `folder:${location.folderId}`;
  if (location.projectId) return `project:${location.projectId}`;
  return NO_SELECTION;
}

/** Deshace `encodeLocation`, resolviendo a qué proyecto pertenece la carpeta. */
export function decodeLocation(value: string, folders: Folder[]): Location {
  if (value.startsWith('folder:')) {
    const folderId = value.slice('folder:'.length);
    const folder = folders.find((item) => item.id === folderId);
    // Si la carpeta ha desaparecido mientras el formulario estaba abierto,
    // dejamos el recurso suelto en lugar de apuntar a algo inexistente.
    return folder ? { projectId: folder.projectId, folderId } : { projectId: null, folderId: null };
  }
  if (value.startsWith('project:')) {
    return { projectId: value.slice('project:'.length), folderId: null };
  }
  return { projectId: null, folderId: null };
}

/** Colecciones de Firestore bajo `users/{uid}`. */
export const collections = {
  projects: 'projects',
  folders: 'folders',
  prompts: 'prompts',
  links: 'links',
} as const;

export type CollectionName = (typeof collections)[keyof typeof collections];
