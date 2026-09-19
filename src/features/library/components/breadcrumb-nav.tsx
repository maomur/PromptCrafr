'use client';

import { ChevronRight, Folders } from 'lucide-react';
import { type LibraryFilter } from '@/features/folders/types';
import type { TreeNode } from '@/features/folders/services/tree';
import { cn } from '@/lib/utils';

interface BreadcrumbNavProps {
  /** Camino desde la carpeta principal hasta la actual. */
  path: TreeNode[];
  onSelect: (filter: LibraryFilter) => void;
}

/**
 * Camino hasta la carpeta abierta.
 *
 * Con tres niveles, el árbol de la izquierda deja de bastar para saber dónde
 * estás: la carpeta activa puede quedar fuera de la vista al desplazarse, y
 * dos subcarpetas con el mismo nombre en proyectos distintos son
 * indistinguibles sin el contexto de su rama.
 */
export default function BreadcrumbNav({ path, onSelect }: BreadcrumbNavProps) {
  return (
    <nav aria-label="Ubicación actual" className="mb-4 flex flex-wrap items-center gap-1 text-sm">
      <button
        type="button"
        onClick={() => onSelect({ type: 'all' })}
        className="flex items-center gap-1.5 rounded px-1.5 py-1 text-muted-foreground transition-colors hover:text-foreground"
      >
        <Folders className="h-4 w-4" />
        Todos
      </button>

      {path.map((node, index) => {
        const isLast = index === path.length - 1;
        return (
          <span key={node.key} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" aria-hidden="true" />
            <button
              type="button"
              onClick={() =>
                onSelect(
                  node.kind === 'project'
                    ? { type: 'project', projectId: node.id }
                    : { type: 'folder', projectId: node.projectId, folderId: node.id }
                )
              }
              aria-current={isLast ? 'page' : undefined}
              className={cn(
                'max-w-[200px] truncate rounded px-1.5 py-1 transition-colors',
                isLast
                  ? 'font-semibold text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {node.name}
            </button>
          </span>
        );
      })}
    </nav>
  );
}
