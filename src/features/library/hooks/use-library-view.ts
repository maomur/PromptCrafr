'use client';

import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { filterKey, matchesFilter, type LibraryFilter, type Location } from '@/features/folders/types';
import { findNode, pathTo, subtreeFolderIds, type TreeNode } from '@/features/folders/services/tree';
import { matchesQuery, parseQuery } from '@/features/library/services/search';
import type { Link, Prompt, PromptCategory } from '@/features/library/types';

export const ALL_CATEGORIES = 'Todos';

export type CategoryFilter = PromptCategory | typeof ALL_CATEGORIES;

/** Ubicación de un recurso, tolerando documentos antiguos sin `folderId`. */
export function locationOf(item: { projectId: string | null; folderId?: string | null }): Location {
  return { projectId: item.projectId ?? null, folderId: item.folderId ?? null };
}

/**
 * Qué parte de la biblioteca se está mirando.
 *
 * Reúne los tres filtros —carpeta, categoría y búsqueda— y lo que se deriva de
 * ellos. Separarlo de la pantalla permite razonar sobre «qué se ve» sin
 * mezclarlo con diálogos y menús, que son otro asunto.
 */
export function useLibraryView(tree: TreeNode[], prompts: Prompt[], links: Link[]) {
  const [filter, setFilter] = useState<LibraryFilter>({ type: 'all' });
  const [category, setCategory] = useState<CategoryFilter>(ALL_CATEGORIES);
  const [query, setQuery] = useState('');

  // El campo de texto responde al instante y el filtrado de la lista puede ir
  // un fotograma por detrás si la biblioteca es grande.
  const deferredQuery = useDeferredValue(query);
  const terms = useMemo(() => parseQuery(deferredQuery), [deferredQuery]);

  /** Nodo abierto ahora mismo, si el filtro apunta a uno. */
  const activeNode = useMemo(
    () =>
      filter.type === 'all' || filter.type === 'unassigned'
        ? undefined
        : findNode(tree, filterKey(filter)),
    [tree, filter]
  );

  /**
   * Carpetas que cuentan para el filtro actual: la propia y sus
   * descendientes, de modo que entrar en una muestre también lo de dentro.
   */
  const folderScope = useMemo(
    () => (activeNode?.kind === 'folder' ? subtreeFolderIds(activeNode) : undefined),
    [activeNode]
  );

  const matches = useCallback(
    (item: { projectId: string | null; folderId?: string | null; category?: PromptCategory | null },
     haystack: (string | null | undefined)[]) =>
      matchesFilter(locationOf(item), filter, folderScope) &&
      (category === ALL_CATEGORIES || item.category === category) &&
      matchesQuery(haystack, terms),
    [filter, folderScope, category, terms]
  );

  const visiblePrompts = useMemo(
    () => prompts.filter((p) => matches(p, [p.title, p.description, p.content])),
    [prompts, matches]
  );
  const visibleLinks = useMemo(
    () => links.filter((l) => matches(l, [l.title, l.description, l.url])),
    [links, matches]
  );

  /** Subcarpetas directas del nodo abierto, que se muestran como tarjetas. */
  const visibleFolders = activeNode?.children ?? [];

  /** Camino hasta la carpeta abierta, para las migas de pan. */
  const breadcrumb = useMemo(
    () => (activeNode ? pathTo(tree, activeNode.key) : []),
    [tree, activeNode]
  );

  const clearFilters = useCallback(() => {
    setFilter({ type: 'all' });
    setCategory(ALL_CATEGORIES);
    setQuery('');
  }, []);

  return {
    filter,
    setFilter,
    category,
    setCategory,
    query,
    setQuery,
    activeNode,
    visiblePrompts,
    visibleLinks,
    visibleFolders,
    breadcrumb,
    clearFilters,
    isEmpty: visiblePrompts.length === 0 && visibleLinks.length === 0 && visibleFolders.length === 0,
  };
}
