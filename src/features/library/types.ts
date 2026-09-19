import type { DbOperation } from '@/lib/db';
import type { Folder, Project } from '@/features/folders/types';

/**
 * Recursos que guarda la biblioteca: prompts y enlaces.
 *
 * Ambos se archivan en el árbol de carpetas, así que llevan una `Location`
 * (`projectId` + `folderId`) definida en la feature de carpetas.
 */

export const promptCategories = ['Video', 'Imagen', 'Textos', 'Otros'] as const;

export type PromptCategory = (typeof promptCategories)[number];

/** Valor especial usado en los <Select> para representar "sin asignar". */

export type Prompt = {
  id: string;
  title: string;
  description: string;
  content: string;
  category: PromptCategory | null;
  createdAt: string;
  updatedAt: string;
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
  /** Posición en la lista. Mayor = más arriba. */
  order: number;
};

/** Campos que rellena el usuario al crear o editar un prompt. */

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


/**
 * Qué parte de la biblioteca se está mirando.
 *
 * Es una unión discriminada y no una cadena con prefijos porque el filtro de
 * carpeta necesita arrastrar también su proyecto, para poder dejar el árbol
 * desplegado por donde toca.
 */

/** Todo lo que contiene la biblioteca, tal y como vive en memoria. */
export type LibraryState = {
  projects: Project[];
  folders: Folder[];
  prompts: Prompt[];
  links: Link[];
};

/**
 * Resultado de una operación: el estado que queda y lo que hay que escribir.
 *
 * Separar el «qué cambia» del «cómo se guarda» permite probar toda la lógica
 * de negocio sin abrir una base de datos, y deja el hook reducido a aplicar
 * lo que estas funciones deciden.
 */
export type Mutation = {
  state: LibraryState;
  operations: DbOperation[];
};
