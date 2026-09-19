'use client';

import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { filterKey, matchesFilter, type LibraryFilter, type Location } from '@/features/folders/types';
import { findNode, pathTo, subtreeFolderIds, type TreeNode } from '@/features/folders/services/tree';
import { buildHaystack, matchesHaystack, parseQuery } from '@/features/library/services/search';
import type { Link, Prompt, PromptCategory } from '@/features/library/types';

export const ALL_CATEGORIES = 'Todos';

/** Cuántos recursos enseña la vista de «más usados». */
export const MOST_USED_LIMIT = 10;

/**
 * Ordena por uso, y entre los que se han usado igual, por lo más reciente.
 *
 * El desempate importa: una biblioteca recién estrenada tiene todo a cero, y
 * sin él la vista mostraría diez prompts al azar.
 */
function porUso(a: { useCount?: number; order: number }, b: { useCount?: number; order: number }) {
  return (b.useCount ?? 0) - (a.useCount ?? 0) || (b.order ?? 0) - (a.order ?? 0);
}

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
  // La aplicación abre por los más usados, no por la biblioteca entera.
  const [filter, setFilter] = useState<LibraryFilter>({ type: 'most-used' });
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

  /**
   * Texto buscable de cada recurso, normalizado una sola vez.
   *
   * Sólo se recalcula cuando cambian los recursos, no con cada tecla: es la
   * diferencia entre una búsqueda instantánea y media palabra de retraso en
   * una biblioteca grande.
   */
  const promptHaystacks = useMemo(
    () => new Map(prompts.map((p) => [p.id, buildHaystack([p.title, p.description, p.content])])),
    [prompts]
  );
  const linkHaystacks = useMemo(
    () => new Map(links.map((l) => [l.id, buildHaystack([l.title, l.description, l.url])])),
    [links]
  );

  const matches = useCallback(
    (
      item: { id: string; projectId: string | null; folderId?: string | null; category?: PromptCategory | null },
      haystacks: Map<string, string>
    ) =>
      matchesFilter(locationOf(item), filter, folderScope) &&
      (category === ALL_CATEGORIES || item.category === category) &&
      (terms.length === 0 || matchesHaystack(haystacks.get(item.id) ?? '', terms)),
    [filter, folderScope, category, terms]
  );

  const esMasUsados = filter.type === 'most-used';

  const visiblePrompts = useMemo(() => {
    const encajan = prompts.filter((p) => matches(p, promptHaystacks));
    // En «más usados» el orden lo manda el uso, y sólo entran los primeros.
    return esMasUsados ? encajan.slice().sort(porUso).slice(0, MOST_USED_LIMIT) : encajan;
  }, [prompts, matches, promptHaystacks, esMasUsados]);

  // Esa vista es de prompts: los enlaces no son algo que se «use» así.
  const visibleLinks = useMemo(
    () => (esMasUsados ? [] : links.filter((l) => matches(l, linkHaystacks))),
    [links, matches, linkHaystacks, esMasUsados]
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
    isMostUsed: esMasUsados,
    isEmpty: visiblePrompts.length === 0 && visibleLinks.length === 0 && visibleFolders.length === 0,
  };
}
