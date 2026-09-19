import { BACKUP_VERSION, type Backup, type ImportResult } from '@/features/backup/types';
import { MAX_DEPTH } from '@/features/folders/types';
import type { Folder, Project } from '@/features/folders/types';
import { promptCategories, type LibraryState, type Link, type Prompt, type PromptCategory } from '@/features/library/types';

/**
 * Copias de seguridad en JSON.
 *
 * Sin servidor, el fichero exportado es la única forma de mover la biblioteca
 * entre navegadores o de recuperarla si se borran los datos del sitio, así
 * que la importación es deliberadamente tolerante: acepta tanto lo que exporta
 * esta aplicación como un volcado plano de las colecciones, e ignora los
 * campos que sobren en lugar de rechazar el fichero entero.
 */

export function createBackup(state: LibraryState, date = new Date()): Backup {
  return {
    version: BACKUP_VERSION,
    exportedAt: date.toISOString(),
    projects: state.projects,
    folders: state.folders,
    prompts: state.prompts,
    links: state.links,
  };
}

export function backupFileName(date = new Date()): string {
  return `promptcraft-copia-${date.toISOString().slice(0, 10)}.json`;
}

// ------------------------------------------------------------- importación

/** Error con un mensaje pensado para enseñárselo al usuario. */
export class ImportError extends Error {}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function asCategory(value: unknown): PromptCategory | null {
  return promptCategories.includes(value as PromptCategory) ? (value as PromptCategory) : null;
}

function asOrder(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asDate(value: unknown): string {
  const text = asString(value);
  return text && !Number.isNaN(Date.parse(text)) ? text : new Date().toISOString();
}

/** Localiza una colección, acepte el fichero el nombre que acepte. */
function collectionOf(source: Record<string, unknown>, ...names: string[]): unknown[] {
  for (const name of names) {
    const value = source[name];
    if (Array.isArray(value)) return value;
  }
  return [];
}

type Raw = Record<string, unknown>;

const records = (items: unknown[]): Raw[] =>
  items.filter((item): item is Raw => typeof item === 'object' && item !== null);

/**
 * Descarta los registros que repiten identificador, quedándose con el primero.
 *
 * La base indexa por `id`: dos registros con el mismo se pisan al guardar y el
 * usuario pierde uno sin enterarse. Además React protestaría por las claves
 * repetidas. Mejor descartarlos aquí y poder contarlos.
 */
function dedupe<T extends { id: string }>(items: T[]): { unique: T[]; dropped: number } {
  const vistos = new Set<string>();
  const unique = items.filter((item) => {
    if (vistos.has(item.id)) return false;
    vistos.add(item.id);
    return true;
  });
  return { unique, dropped: items.length - unique.length };
}

/**
 * Sube de nivel las carpetas que se salen del límite de profundidad.
 *
 * Un archivo puede traer una jerarquía más honda de la que la aplicación
 * admite. Si se importa tal cual, el árbol se queda con lo que cabe y el resto
 * desaparece de la vista con su contenido dentro. Aquí se reengancha cada
 * carpeta demasiado honda al ancestro que sí cabe, de modo que nada se pierda
 * aunque la forma cambie.
 */
function clampDepth(folders: Folder[]): { folders: Folder[]; flattened: number } {
  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  let flattened = 0;

  const result = folders.map((folder) => {
    // Profundidad 1 es la carpeta principal, así que una sin padre es la 2.
    let parentId = folder.parentId ?? null;
    let depth = 2;
    let cursor = parentId ? byId.get(parentId) : undefined;

    while (cursor) {
      depth += 1;
      cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
    }

    if (depth <= MAX_DEPTH) return folder;

    // Sube tantos escalones como sobren.
    flattened += 1;
    while (depth > MAX_DEPTH && parentId) {
      parentId = byId.get(parentId)?.parentId ?? null;
      depth -= 1;
    }
    return { ...folder, parentId };
  });

  return { folders: result, flattened };
}

/**
 * Convierte un fichero cualquiera en una biblioteca válida.
 *
 * Descarta lo que no tenga id o nombre, y recoloca lo que apunte a una carpeta
 * inexistente en lugar de dejar referencias rotas.
 */
export function parseBackup(raw: unknown): ImportResult {
  if (typeof raw !== 'object' || raw === null) {
    throw new ImportError('El archivo no contiene un objeto JSON.');
  }

  const source = raw as Raw;

  let discarded = 0;

  const rawProjects: Project[] = records(collectionOf(source, 'projects', 'proyectos')).flatMap(
    (item) => {
      const id = asString(item.id);
      const name = asString(item.name) ?? asString(item.nombre);
      if (!id || !name) return [];
      return [{ id, name, description: asString(item.description), createdAt: asDate(item.createdAt) }];
    }
  );

  const deduped = dedupe(rawProjects);
  const projects = deduped.unique;
  discarded += deduped.dropped;

  const projectIds = new Set(projects.map((project) => project.id));

  const rawFolders: Folder[] = records(collectionOf(source, 'folders', 'carpetas')).flatMap((item) => {
    const id = asString(item.id);
    const name = asString(item.name) ?? asString(item.nombre);
    const projectId = asString(item.projectId);
    // Una carpeta sin proyecto existente no tiene dónde vivir.
    if (!id || !name || !projectId || !projectIds.has(projectId)) return [];

    return [
      {
        id,
        name,
        description: asString(item.description),
        projectId,
        parentId: asString(item.parentId),
        createdAt: asDate(item.createdAt),
      },
    ];
  });

  const dedupedFolders = dedupe(rawFolders);
  discarded += dedupedFolders.dropped;

  const clamped = clampDepth(dedupedFolders.unique);
  const folders = clamped.folders;

  const folderIds = new Set(folders.map((folder) => folder.id));

  /** Deja la ubicación en algo que exista de verdad. */
  const location = (item: Raw) => {
    const projectId = asString(item.projectId);
    const folderId = asString(item.folderId);
    if (!projectId || !projectIds.has(projectId)) return { projectId: null, folderId: null };
    return { projectId, folderId: folderId && folderIds.has(folderId) ? folderId : null };
  };

  const rawPrompts: Prompt[] = records(collectionOf(source, 'prompts')).flatMap((item, index) => {
    const id = asString(item.id);
    const title = asString(item.title) ?? asString(item.titulo);
    const content = asString(item.content) ?? asString(item.contenido);
    if (!id || !title || !content) return [];

    return [
      {
        id,
        title,
        description: asString(item.description) ?? '',
        content,
        category: asCategory(item.category),
        createdAt: asDate(item.createdAt),
        updatedAt: asDate(item.updatedAt ?? item.createdAt),
        order: asOrder(item.order, index + 1),
        ...location(item),
      },
    ];
  });

  const dedupedPrompts = dedupe(rawPrompts);
  const prompts = dedupedPrompts.unique;
  discarded += dedupedPrompts.dropped;

  const rawLinks: Link[] = records(collectionOf(source, 'links', 'enlaces')).flatMap((item, index) => {
    const id = asString(item.id);
    const url = asString(item.url);
    if (!id || !url) return [];

    return [
      {
        id,
        url,
        title: asString(item.title),
        description: asString(item.description),
        category: asCategory(item.category),
        createdAt: asDate(item.createdAt),
        updatedAt: asDate(item.updatedAt ?? item.createdAt),
        order: asOrder(item.order, index + 1),
        ...location(item),
      },
    ];
  });

  const dedupedLinks = dedupe(rawLinks);
  const links = dedupedLinks.unique;
  discarded += dedupedLinks.dropped;

  if (projects.length + folders.length + prompts.length + links.length === 0) {
    throw new ImportError('No se ha encontrado ningún prompt, enlace o carpeta en el archivo.');
  }

  return {
    state: { projects, folders, prompts, links },
    discarded,
    flattened: clamped.flattened,
  };
}

/** Lee y valida un fichero elegido por el usuario. */
export async function readBackupFile(file: File): Promise<ImportResult> {
  let raw: unknown;
  try {
    raw = JSON.parse(await file.text());
  } catch {
    throw new ImportError('El archivo no es un JSON válido.');
  }
  return parseBackup(raw);
}

/** Descarga un objeto como fichero JSON. */
export function downloadJson(fileName: string, value: unknown): void {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
