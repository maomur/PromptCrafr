'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { announceChange, onExternalChange } from '@/lib/broadcast';
import { applyOperations, readEverything, replaceEverything } from '@/lib/db';
import { buildTree, countTree } from '@/features/folders/services/tree';
import type { Folder, FolderInput, Location, Project } from '@/features/folders/types';
import * as mutations from '@/features/library/services/mutations';
import type { ItemKind } from '@/features/library/services/mutations';
import type { Sortable } from '@/features/library/services/ordering';
import type {
  Link,
  LinkInput,
  LibraryState,
  Mutation,
  Prompt,
  PromptInput,
} from '@/features/library/types';

export type { ItemKind };

/**
 * Punto único de acceso a la biblioteca.
 *
 * La biblioteca entera vive en memoria y se persiste en IndexedDB. Cabe de
 * sobra: son cientos de registros, no millones, y tenerla completa evita
 * consultar la base cada vez que cambia un filtro.
 *
 * El hook no decide nada: carga, aplica lo que deciden las funciones de
 * `services/mutations` y avisa a las demás pestañas. Toda la lógica de negocio
 * está allí, en funciones puras que se prueban sin abrir una base de datos.
 */
export function useLibrary() {
  const [state, setState] = useState<LibraryState>(mutations.emptyLibrary);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Las mutaciones necesitan el estado del momento en que se disparan, no el
  // del render en que se creó el callback.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const load = useCallback(async () => {
    try {
      const stored = await readEverything();
      setState({
        projects: stored.projects as Project[],
        folders: stored.folders as Folder[],
        prompts: stored.prompts as Prompt[],
        links: stored.links as Link[],
      });
      setError(null);
    } catch (cause) {
      // Navegación privada o almacenamiento bloqueado: la aplicación sigue en
      // pie, pero sin poder guardar nada.
      setError(cause instanceof Error ? cause : new Error('No se pudo abrir la base local'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    return onExternalChange(() => void load());
  }, [load]);

  /**
   * Aplica una mutación: primero en pantalla, después en disco.
   *
   * La interfaz no espera a la escritura. Un fallo al guardar se refleja en
   * `error` y quien lo consuma puede avisar; los datos en pantalla siguen
   * siendo los correctos hasta que se recargue.
   */
  const apply = useCallback((mutate: (current: LibraryState) => Mutation) => {
    const { state: next, operations } = mutate(stateRef.current);
    if (operations.length === 0) return;

    stateRef.current = next;
    setState(next);

    applyOperations(operations)
      .then(announceChange)
      .catch((cause) => setError(cause instanceof Error ? cause : new Error('No se pudo guardar')));
  }, []);

  const projects = useMemo(
    () => state.projects.slice().sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })),
    [state.projects]
  );
  const folders = useMemo(
    () => state.folders.slice().sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })),
    [state.folders]
  );

  // Mayor `order` primero: lo último que se crea aparece arriba.
  const prompts = useMemo(
    () => state.prompts.slice().sort((a, b) => (b.order ?? 0) - (a.order ?? 0)),
    [state.prompts]
  );
  const links = useMemo(
    () => state.links.slice().sort((a, b) => (b.order ?? 0) - (a.order ?? 0)),
    [state.links]
  );

  const tree = useMemo(() => buildTree(projects, folders), [projects, folders]);
  const counts = useMemo(() => countTree(tree, [...prompts, ...links]), [tree, prompts, links]);

  const createNode = useCallback(
    (input: FolderInput) => apply((current) => mutations.createNode(current, input, tree)),
    [apply, tree]
  );
  const updateNode = useCallback(
    (node: Parameters<typeof mutations.updateNode>[1], input: FolderInput) =>
      apply((current) => mutations.updateNode(current, node, input, tree)),
    [apply, tree]
  );
  const deleteProject = useCallback(
    (projectId: string) => apply((current) => mutations.deleteProject(current, projectId)),
    [apply]
  );
  const deleteFolder = useCallback(
    (node: Parameters<typeof mutations.deleteFolder>[1]) =>
      apply((current) => mutations.deleteFolder(current, node)),
    [apply]
  );
  const savePrompt = useCallback(
    (input: PromptInput, id?: string) => apply((current) => mutations.savePrompt(current, input, id)),
    [apply]
  );
  const saveLink = useCallback(
    (input: LinkInput, id?: string) => apply((current) => mutations.saveLink(current, input, id)),
    [apply]
  );
  const deleteItem = useCallback(
    (kind: ItemKind, id: string) => apply((current) => mutations.deleteItem(current, kind, id)),
    [apply]
  );
  const moveTo = useCallback(
    (kind: ItemKind, id: string, location: Location) =>
      apply((current) => mutations.moveTo(current, kind, id, location)),
    [apply]
  );
  const reorder = useCallback(
    (kind: ItemKind, visible: Sortable[], from: number, to: number) =>
      apply((current) => mutations.reorder(current, kind, visible, from, to)),
    [apply]
  );

  /**
   * Sustituye la biblioteca entera por la de una copia importada.
   *
   * No pasa por `apply` a propósito: aquí la escritura tiene que confirmarse
   * antes de dar la importación por buena, y si falla hay que decirlo en vez
   * de dejar la pantalla mostrando datos que ya no están en disco.
   */
  const replaceAll = useCallback(async (next: LibraryState) => {
    const { operations } = mutations.replaceAll(next);

    await replaceEverything(operations);

    stateRef.current = next;
    setState(next);
    setError(null);
    announceChange();
  }, []);

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
    replaceAll,
  };
}
