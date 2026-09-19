export const promptCategories = ['Video', 'Imagen', 'Textos', 'Otros'] as const;

export type PromptCategory = (typeof promptCategories)[number];

/** Valor especial usado en los <Select> para representar "sin asignar". */
export const NO_SELECTION = 'none';

export type Project = {
  id: string;
  name: string;
  description?: string | null;
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
  description?: string | null;
  /**
   * Proyecto raíz del que cuelga, sea directamente o a través de otra carpeta.
   *
   * Está desnormalizado a propósito: repetir aquí la raíz permite filtrar y
   * contar un proyecto entero sin recorrer el árbol, a cambio de mantener la
   * invariante de que siempre coincide con la del padre. De eso se encarga
   * `updateFolder`, que es el único sitio donde una carpeta cambia de sitio.
   */
  projectId: string;
  /** Carpeta contenedora, o null si cuelga directamente del proyecto. */
  parentId?: string | null;
  createdAt: string;
  ownerId: string;
};

/**
 * Profundidad máxima de la jerarquía, contando la carpeta principal.
 *
 * 3 significa: proyecto › subcarpeta › subcarpeta. Toda la lógica de creación,
 * movimiento y pintado se deriva de esta constante, así que subir o bajar el
 * límite es cambiar este número.
 */
export const MAX_DEPTH = 3;

/**
 * Datos comunes a un proyecto y a una carpeta.
 *
 * Los dos niveles se crean y se editan con el mismo formulario: `parentId` a
 * null significa «carpeta principal», es decir, un proyecto.
 */
export type FolderInput = {
  name: string;
  description: string | null;
  /**
   * Contenedor, codificado como una ubicación: `none` para una carpeta
   * principal, `project:<id>` o `folder:<id>` para anidarla.
   */
  parent: string;
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

/**
 * Decide si un recurso entra en la vista actual.
 *
 * `folderScope` son las carpetas que cuentan para un filtro de carpeta: la
 * propia y sus descendientes, de modo que entrar en una carpeta muestre
 * también lo que hay en sus subcarpetas. Sin él sólo cuenta la carpeta exacta.
 */
export function matchesFilter(
  item: Location,
  filter: LibraryFilter,
  folderScope?: ReadonlySet<string>
): boolean {
  switch (filter.type) {
    case 'all':
      return true;
    // Los valores antiguos usaban la cadena "none" en lugar de null.
    case 'unassigned':
      return !item.projectId || item.projectId === NO_SELECTION;
    case 'project':
      return item.projectId === filter.projectId;
    case 'folder':
      if (!item.folderId) return false;
      return folderScope ? folderScope.has(item.folderId) : item.folderId === filter.folderId;
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


/** Colecciones de Firestore bajo `users/{uid}`. */
export const collections = {
  projects: 'projects',
  folders: 'folders',
  prompts: 'prompts',
  links: 'links',
} as const;

export type CollectionName = (typeof collections)[keyof typeof collections];
