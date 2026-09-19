'use client';

import { useCallback, useState } from 'react';
import type { TreeNode } from '@/features/folders/services/tree';

/**
 * Qué ramas del árbol están desplegadas.
 *
 * La regla no es sólo «lo que el usuario ha abierto»: mientras nadie haya
 * tocado la flecha de una rama, ésta se abre sola si dentro está lo que se
 * está mirando. Eso evita que al entrar en una subcarpeta desde el contenido
 * la barra lateral se quede cerrada y sin mostrar dónde estás.
 */
export function useExpandedNodes(activeKey: string) {
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  /** ¿Está el nodo activo en esta rama? */
  const containsActive = useCallback(
    (node: TreeNode): boolean =>
      node.key === activeKey || node.children.some(containsActive),
    [activeKey]
  );

  const isExpanded = useCallback(
    (node: TreeNode) => overrides[node.key] ?? containsActive(node),
    [overrides, containsActive]
  );

  const setExpanded = useCallback((key: string, value: boolean) => {
    setOverrides((previous) => ({ ...previous, [key]: value }));
  }, []);

  return { isExpanded, setExpanded };
}
