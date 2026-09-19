'use client';

import { useCallback, useMemo } from 'react';
import { collection, doc, writeBatch } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import {
  commitBatchNonBlocking,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking,
  updateDocumentNonBlocking,
  useCollection,
  useFirestore,
  useMemoFirebase,
} from '@/firebase';
import {
  collections,
  type Folder,
  type Link,
  type LinkInput,
  type Location,
  type Project,
  type Prompt,
  type PromptInput,
} from '@/lib/definitions';

/** Los dos tipos de recurso que guarda la biblioteca. */
export type ItemKind = 'prompt' | 'link';

/** Un recurso ordenable dentro de una lista. */
type Sortable = { id: string; order: number };

/**
 * Reparte las posiciones existentes entre los elementos ya reordenados.
 *
 * Reutilizamos los valores de `order` que ya tenían estos elementos en lugar de
 * renumerar desde cero: así los recursos que no están visibles por el filtro
 * activo conservan su posición relativa respecto al resto de la biblioteca.
 */
function assignOrders<T extends Sortable>(reordered: T[]): Map<string, number> {
  const slots = reordered.map((item) => item.order ?? 0).sort((a, b) => b - a);

  // Si los valores venían duplicados o a cero (datos antiguos), renumeramos.
  const isUsable = new Set(slots).size === slots.length;
  const finalSlots = isUsable ? slots : reordered.map((_, index) => reordered.length - index);

  const changes = new Map<string, number>();
  reordered.forEach((item, index) => {
    if (item.order !== finalSlots[index]) changes.set(item.id, finalSlots[index]);
  });
  return changes;
}

/** Mueve un elemento de una posición a otra devolviendo un array nuevo. */
function moveItem<T>(items: T[], from: number, to: number): T[] {
  const next = items.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** Posición para un elemento nuevo: siempre en lo alto de la lista. */
function nextOrder(items: Sortable[]): number {
  return items.reduce((max, item) => Math.max(max, item.order ?? 0), 0) + 1;
}

/**
 * Punto único de acceso a la biblioteca del usuario en Firestore.
 *
 * Expone los datos en tiempo real y todas las mutaciones, de forma que los
 * componentes sólo se ocupen de la interfaz.
 */
export function useLibrary(user: User) {
  const firestore = useFirestore();
  const uid = user.uid;

  const projectsRef = useMemoFirebase(
    () => collection(firestore, 'users', uid, collections.projects),
    [firestore, uid]
  );
  const foldersRef = useMemoFirebase(
    () => collection(firestore, 'users', uid, collections.folders),
    [firestore, uid]
  );
  const promptsRef = useMemoFirebase(
    () => collection(firestore, 'users', uid, collections.prompts),
    [firestore, uid]
  );
  const linksRef = useMemoFirebase(
    () => collection(firestore, 'users', uid, collections.links),
    [firestore, uid]
  );

  const projectsQuery = useCollection<Project>(projectsRef);
  const foldersQuery = useCollection<Folder>(foldersRef);
  const promptsQuery = useCollection<Prompt>(promptsRef);
  const linksQuery = useCollection<Link>(linksRef);

  const projects = useMemo(
    () =>
      (projectsQuery.data ?? [])
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })),
    [projectsQuery.data]
  );

  const folders = useMemo(
    () =>
      (foldersQuery.data ?? [])
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })),
    [foldersQuery.data]
  );

  // Mayor `order` primero: lo último que se crea aparece arriba.
  const prompts = useMemo(
    () => (promptsQuery.data ?? []).slice().sort((a, b) => (b.order ?? 0) - (a.order ?? 0)),
    [promptsQuery.data]
  );
  const links = useMemo(
    () => (linksQuery.data ?? []).slice().sort((a, b) => (b.order ?? 0) - (a.order ?? 0)),
    [linksQuery.data]
  );

  const isLoading =
    projectsQuery.isLoading ||
    foldersQuery.isLoading ||
    promptsQuery.isLoading ||
    linksQuery.isLoading;
  const error =
    projectsQuery.error ?? foldersQuery.error ?? promptsQuery.error ?? linksQuery.error;

  const docRef = useCallback(
    (name: string, id: string) => doc(firestore, 'users', uid, name, id),
    [firestore, uid]
  );
  const collectionFor = useCallback(
    (kind: ItemKind) => (kind === 'prompt' ? collections.prompts : collections.links),
    []
  );

  const createProject = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;

      const newDoc = doc(collection(firestore, 'users', uid, collections.projects));
      setDocumentNonBlocking(newDoc, {
        id: newDoc.id,
        name: trimmed,
        ownerId: uid,
        createdAt: new Date().toISOString(),
      });
    },
    [firestore, uid]
  );

  const renameProject = useCallback(
    (projectId: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      updateDocumentNonBlocking(docRef(collections.projects, projectId), { name: trimmed });
    },
    [docRef]
  );

  /**
   * Borra un proyecto y desvincula su contenido en la misma operación atómica.
   *
   * Arrastra también sus carpetas. Sin esto, prompts y enlaces conservarían un
   * `projectId` o un `folderId` que ya no existe y desaparecerían de todos los
   * filtros salvo el de "Todos".
   */
  const deleteProject = useCallback(
    (projectId: string) => {
      const batch = writeBatch(firestore);
      const orphaned: Location = { projectId: null, folderId: null };

      for (const prompt of prompts) {
        if (prompt.projectId === projectId) {
          batch.update(docRef(collections.prompts, prompt.id), orphaned);
        }
      }
      for (const link of links) {
        if (link.projectId === projectId) {
          batch.update(docRef(collections.links, link.id), orphaned);
        }
      }
      for (const folder of folders) {
        if (folder.projectId === projectId) {
          batch.delete(docRef(collections.folders, folder.id));
        }
      }
      batch.delete(docRef(collections.projects, projectId));

      commitBatchNonBlocking(batch, `users/${uid}/${collections.projects}/${projectId}`);
    },
    [firestore, uid, prompts, links, folders, docRef]
  );

  const createFolder = useCallback(
    (projectId: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;

      const newDoc = doc(collection(firestore, 'users', uid, collections.folders));
      setDocumentNonBlocking(newDoc, {
        id: newDoc.id,
        name: trimmed,
        projectId,
        ownerId: uid,
        createdAt: new Date().toISOString(),
      });
    },
    [firestore, uid]
  );

  const renameFolder = useCallback(
    (folderId: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      updateDocumentNonBlocking(docRef(collections.folders, folderId), { name: trimmed });
    },
    [docRef]
  );

  /**
   * Borra una carpeta y saca su contenido al proyecto que la contenía.
   *
   * Nunca borra recursos: una carpeta es una forma de ordenar, no un
   * contenedor cuya desaparición deba llevarse nada por delante.
   */
  const deleteFolder = useCallback(
    (folderId: string) => {
      const batch = writeBatch(firestore);

      for (const prompt of prompts) {
        if (prompt.folderId === folderId) {
          batch.update(docRef(collections.prompts, prompt.id), { folderId: null });
        }
      }
      for (const link of links) {
        if (link.folderId === folderId) {
          batch.update(docRef(collections.links, link.id), { folderId: null });
        }
      }
      batch.delete(docRef(collections.folders, folderId));

      commitBatchNonBlocking(batch, `users/${uid}/${collections.folders}/${folderId}`);
    },
    [firestore, uid, prompts, links, docRef]
  );

  const savePrompt = useCallback(
    (input: PromptInput, id?: string) => {
      const now = new Date().toISOString();

      if (id) {
        updateDocumentNonBlocking(docRef(collections.prompts, id), { ...input, updatedAt: now });
        return;
      }

      const newDoc = doc(collection(firestore, 'users', uid, collections.prompts));
      setDocumentNonBlocking(newDoc, {
        ...input,
        id: newDoc.id,
        ownerId: uid,
        createdAt: now,
        updatedAt: now,
        order: nextOrder(prompts),
      });
    },
    [firestore, uid, prompts, docRef]
  );

  const saveLink = useCallback(
    (input: LinkInput, id?: string) => {
      const now = new Date().toISOString();

      if (id) {
        updateDocumentNonBlocking(docRef(collections.links, id), { ...input, updatedAt: now });
        return;
      }

      const newDoc = doc(collection(firestore, 'users', uid, collections.links));
      setDocumentNonBlocking(newDoc, {
        ...input,
        id: newDoc.id,
        ownerId: uid,
        createdAt: now,
        updatedAt: now,
        order: nextOrder(links),
      });
    },
    [firestore, uid, links, docRef]
  );

  const deleteItem = useCallback(
    (kind: ItemKind, id: string) => {
      deleteDocumentNonBlocking(docRef(collectionFor(kind), id));
    },
    [docRef, collectionFor]
  );

  /** Archiva un recurso en un proyecto, dentro de una carpeta o suelto. */
  const moveTo = useCallback(
    (kind: ItemKind, id: string, location: Location) => {
      updateDocumentNonBlocking(docRef(collectionFor(kind), id), {
        projectId: location.projectId,
        folderId: location.folderId,
      });
    },
    [docRef, collectionFor]
  );

  /**
   * Persiste el resultado de arrastrar un elemento dentro de la lista visible.
   *
   * `visible` es la lista tal y como la ve el usuario (ya filtrada), porque los
   * índices que da SortableJS se refieren a ella y no a la colección completa.
   */
  const reorder = useCallback(
    (kind: ItemKind, visible: Sortable[], from: number, to: number) => {
      if (from === to || !visible[from]) return;

      const changes = assignOrders(moveItem(visible, from, to));
      if (changes.size === 0) return;

      const name = collectionFor(kind);
      const batch = writeBatch(firestore);
      for (const [id, order] of changes) {
        batch.update(docRef(name, id), { order });
      }
      commitBatchNonBlocking(batch, `users/${uid}/${name}`);
    },
    [firestore, uid, docRef, collectionFor]
  );

  return {
    projects,
    folders,
    prompts,
    links,
    isLoading,
    error,
    createProject,
    renameProject,
    deleteProject,
    createFolder,
    renameFolder,
    deleteFolder,
    savePrompt,
    saveLink,
    deleteItem,
    moveTo,
    reorder,
  };
}
