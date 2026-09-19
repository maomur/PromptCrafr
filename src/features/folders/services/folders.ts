import { newId } from '@/lib/id';
import type { Folder, FolderInput, Location, Project } from '@/features/folders/types';
import { subtreeFolderIds, type ParentRef, type TreeNode } from '@/features/folders/tree';

/**
 * Construcción y borrado de los registros de la jerarquía.
 *
 * Son funciones puras: no tocan prompts ni enlaces ni la base de datos. De
 * arrastrar el contenido al mover o borrar una carpeta se encarga la feature
 * de biblioteca, que es la que conoce los recursos; así la dependencia va en
 * un solo sentido y no hay ciclos entre features.
 */

type NameAndDescription = Pick<FolderInput, 'name' | 'description'>;

/** Normaliza lo que llega del formulario. */
function fields({ name, description }: NameAndDescription) {
  return { name: name.trim(), description: description || null };
}

export function createProject(input: NameAndDescription): Project {
  return { id: newId(), ...fields(input), createdAt: new Date().toISOString() };
}

export function createFolder(
  input: NameAndDescription,
  parent: Extract<ParentRef, { level: 'nested' }>
): Folder {
  return {
    id: newId(),
    ...fields(input),
    projectId: parent.projectId,
    parentId: parent.parentId,
    createdAt: new Date().toISOString(),
  };
}

export function editProject(project: Project, input: NameAndDescription): Project {
  return { ...project, ...fields(input) };
}

export function editFolder(
  folder: Folder,
  input: NameAndDescription,
  destination: { projectId: string; parentId: string | null }
): Folder {
  return { ...folder, ...fields(input), ...destination };
}

/**
 * Qué desaparece al borrar una carpeta y dónde acaba su contenido.
 *
 * Nunca se borran recursos: lo que hubiera dentro sube al nivel de encima.
 */
export function planFolderRemoval(node: TreeNode, folders: Folder[]) {
  const folder = folders.find((candidate) => candidate.id === node.id);
  const removed = subtreeFolderIds(node);
  const destination: Location = {
    projectId: folder?.projectId ?? null,
    folderId: folder?.parentId ?? null,
  };

  return { removed, destination };
}

/** Qué carpetas se lleva por delante el borrado de una carpeta principal. */
export function planProjectRemoval(projectId: string, folders: Folder[]): Set<string> {
  // Todas repiten la raíz, así que basta con filtrarlas por ella.
  return new Set(
    folders.filter((folder) => folder.projectId === projectId).map((folder) => folder.id)
  );
}
