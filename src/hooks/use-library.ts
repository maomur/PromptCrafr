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
import { assignOrders, moveItem, nextOrder, type Sortable } from '@/lib/ordering';
import {
  buildTree,
  countTree,
  decodeParent,
  subtreeFolderIds,
  type TreeNode,
} from '@/lib/tree';
import {
  collections,
  type Folder,
  type FolderInput,
  type Link,
  type LinkInput,
  type Location,
  type Project,
  type Prompt,
  type PromptInput,
} from '@/lib/definitions';

/** Los dos tipos de recurso que guarda la biblioteca. */
export type ItemKind = 'prompt' | 'link';


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

  /**
   * Árbol único de carpetas, con los proyectos como primer nivel.
   *
   * Se calcula aquí para que todos los componentes miren la misma estructura
   * en lugar de recomponerla cada uno por su cuenta.
   */
  const tree = useMemo(() => buildTree(projects, folders), [projects, folders]);

  const counts = useMemo(() => countTree(tree, [...prompts, ...links]), [tree, prompts, links]);

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
    (input: Omit<FolderInput, 'parent'>) => {
      const name = input.name.trim();
      if (!name) return;

      const newDoc = doc(collection(firestore, 'users', uid, collections.projects));
      setDocumentNonBlocking(newDoc, {
        id: newDoc.id,
        name,
        description: input.description || null,
        ownerId: uid,
        createdAt: new Date().toISOString(),
      });
    },
    [firestore, uid]
  );

  /**
   * Crea una carpeta en el nivel que indique `parent`.
   *
   * Sin padre es una carpeta principal, que en Firestore sigue siendo un
   * documento de `projects`. Esa correspondencia vive aquí y en ningún otro
   * sitio: de puertas afuera todo son nodos del árbol.
   */
  const createNode = useCallback(
    (input: FolderInput) => {
      const name = input.name.trim();
      if (!name) return;

      const parent = decodeParent(input.parent, tree);
      if (parent.level === 'root') {
        createProject(input);
        return;
      }

      const newDoc = doc(collection(firestore, 'users', uid, collections.folders));
      setDocumentNonBlocking(newDoc, {
        id: newDoc.id,
        name,
        description: input.description || null,
        projectId: parent.projectId,
        parentId: parent.parentId,
        ownerId: uid,
        createdAt: new Date().toISOString(),
      });
    },
    [firestore, uid, tree, createProject]
  );

  /**
   * Edita un nodo y, si es una carpeta que cambia de sitio, muda con ella todo
   * lo que cuelga: subcarpetas y recursos.
   *
   * `projectId` está repetido en cada descendiente para poder filtrar un
   * proyecto sin recorrer el árbol, así que una mudanza tiene que reescribirlo
   * en todos ellos. Va en un lote atómico porque dejarlo a medias partiría la
   * jerarquía en dos.
   */
  const updateNode = useCallback(
    (node: TreeNode, input: FolderInput) => {
      const name = input.name.trim();
      if (!name) return;

      const fields = { name, description: input.description || null };

      if (node.kind === 'project') {
        updateDocumentNonBlocking(docRef(collections.projects, node.id), fields);
        return;
      }

      const parent = decodeParent(input.parent, tree);
      // Convertir una subcarpeta en principal implicaría cambiarla de
      // colección; el formulario no lo ofrece, pero por si acaso.
      const destination =
        parent.level === 'root'
          ? { projectId: node.projectId, parentId: null }
          : { projectId: parent.projectId, parentId: parent.parentId };

      const batch = writeBatch(firestore);
      batch.update(docRef(collections.folders, node.id), { ...fields, ...destination });

      if (destination.projectId !== node.projectId) {
        const moved = subtreeFolderIds(node);

        for (const descendant of folders) {
          if (descendant.id !== node.id && moved.has(descendant.id)) {
            batch.update(docRef(collections.folders, descendant.id), {
              projectId: destination.projectId,
            });
          }
        }
        for (const prompt of prompts) {
          if (prompt.folderId && moved.has(prompt.folderId)) {
            batch.update(docRef(collections.prompts, prompt.id), {
              projectId: destination.projectId,
            });
          }
        }
        for (const link of links) {
          if (link.folderId && moved.has(link.folderId)) {
            batch.update(docRef(collections.links, link.id), {
              projectId: destination.projectId,
            });
          }
        }
      }

      commitBatchNonBlocking(batch, `users/${uid}/${collections.folders}/${node.id}`);
    },
    [firestore, uid, tree, folders, prompts, links, docRef]
  );

  /**
   * Borra un proyecto entero y suelta su contenido.
   *
   * Arrastra sus carpetas a cualquier profundidad: todas repiten el
   * `projectId`, así que basta con filtrarlas por él.
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

  /**
   * Borra una carpeta y todas sus subcarpetas, subiendo el contenido un nivel.
   *
   * Nunca se lleva recursos por delante: una carpeta es una forma de ordenar,
   * no un contenedor cuya desaparición deba borrar nada. Lo que hubiera dentro
   * pasa a donde estaba la carpeta borrada.
   */
  const deleteFolder = useCallback(
    (node: TreeNode) => {
      const folder = folders.find((candidate) => candidate.id === node.id);
      if (!folder) return;

      const removed = subtreeFolderIds(node);
      const destination: Location = {
        projectId: folder.projectId,
        folderId: folder.parentId ?? null,
      };

      const batch = writeBatch(firestore);
      for (const prompt of prompts) {
        if (prompt.folderId && removed.has(prompt.folderId)) {
          batch.update(docRef(collections.prompts, prompt.id), destination);
        }
      }
      for (const link of links) {
        if (link.folderId && removed.has(link.folderId)) {
          batch.update(docRef(collections.links, link.id), destination);
        }
      }
      for (const id of removed) {
        batch.delete(docRef(collections.folders, id));
      }

      commitBatchNonBlocking(batch, `users/${uid}/${collections.folders}/${node.id}`);
    },
    [firestore, uid, folders, prompts, links, docRef]
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
    tree,
    counts,
    prompts,
    links,
    isLoading,
    error,
    createNode,
    updateNode,
    deleteProject,
    deleteFolder,
    savePrompt,
    saveLink,
    deleteItem,
    moveTo,
    reorder,
  };
}
