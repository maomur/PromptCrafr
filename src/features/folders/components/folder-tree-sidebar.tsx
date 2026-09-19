'use client';

import {
  ChevronRight,
  Folder as FolderIcon,
  FolderOpen,
  FolderPlus,
  Folders,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DropTarget from '@/components/ui/drop-target';
import { DRAGGABLE_GROUPS } from '@/lib/constants';
import { type LibraryFilter, filterKey } from '@/features/folders/types';
import { NO_SELECTION } from '@/lib/constants';
import { useExpandedNodes } from '@/features/folders/hooks/use-expanded-nodes';
import { canHaveChildren, type TreeNode } from '@/features/folders/services/tree';
import { cn } from '@/lib/utils';

interface ProjectSidebarProps {
  tree: TreeNode[];
  /** Número de recursos por nodo, indexado por su clave. */
  counts: Record<string, number>;
  activeFilter: LibraryFilter;
  onSelect: (filter: LibraryFilter) => void;
  onCreateRoot: () => void;
  onCreateChild: (parent: TreeNode) => void;
  onEdit: (node: TreeNode) => void;
  onDelete: (node: TreeNode) => void;
}

/**
 * Anchos de las columnas laterales de cada fila.
 *
 * Todas las filas de un mismo nivel reservan el mismo hueco para la flecha y
 * para el menú, tengan o no. Es lo que las mantiene alineadas en la misma
 * vertical en lugar de ir escalonándose según tengan hijos o no.
 */
const CHEVRON_SLOT = 'w-8 shrink-0 md:w-6';
const MENU_SLOT = 'w-9 shrink-0 md:w-7';

const rowClass = (isActive: boolean, depth: number) =>
  cn(
    'flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg px-3 text-left font-medium transition-all',
    depth > 1 ? 'py-1.5 text-[13px]' : 'py-2 text-sm',
    isActive ? 'bg-primary text-primary-foreground shadow-md' : 'hover:bg-accent/50'
  );

function Count({ value }: { value: number }) {
  return <span className="shrink-0 font-mono text-sm font-medium opacity-70">({value})</span>;
}

/** Filtro al que corresponde un nodo del árbol. */
function filterFor(node: TreeNode): LibraryFilter {
  return node.kind === 'project'
    ? { type: 'project', projectId: node.id }
    : { type: 'folder', projectId: node.projectId, folderId: node.id };
}

export default function ProjectSidebar({
  tree,
  counts,
  activeFilter,
  onSelect,
  onCreateRoot,
  onCreateChild,
  onEdit,
  onDelete,
}: ProjectSidebarProps) {
  const activeKey = filterKey(activeFilter);
  const { isExpanded, setExpanded } = useExpandedNodes(activeKey);

  const renderNode = (node: TreeNode) => {
    const isActive = activeKey === node.key;
    const hasChildren = node.children.length > 0;
    const open = isExpanded(node);
    const label = node.kind === 'project' ? 'proyecto' : 'carpeta';

    return (
      <Collapsible
        key={node.key}
        open={open && hasChildren}
        onOpenChange={(value) => setExpanded(node.key, value)}
      >
        <DropTarget accepts={DRAGGABLE_GROUPS} location={node.key} className="group/row flex items-center gap-0.5">
          {hasChildren ? (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className={cn(CHEVRON_SLOT, 'h-11 hover:bg-accent md:h-8')}>
                <ChevronRight className={cn('h-4 w-4 transition-transform', open && 'rotate-90')} />
                <span className="sr-only">
                  {open ? 'Contraer' : 'Desplegar'} {node.name}
                </span>
              </Button>
            </CollapsibleTrigger>
          ) : (
            <div className={CHEVRON_SLOT} />
          )}

          <button
            type="button"
            onClick={() => onSelect(filterFor(node))}
            className={rowClass(isActive, node.depth)}
            aria-current={isActive ? 'true' : undefined}
          >
            <span className="flex min-w-0 items-center">
              {open && hasChildren ? (
                <FolderOpen className="mr-2 h-4 w-4 shrink-0" />
              ) : (
                <FolderIcon
                  className={cn('mr-2 shrink-0', node.depth > 1 ? 'h-3.5 w-3.5 opacity-70' : 'h-4 w-4')}
                />
              )}
              <span className="truncate" title={node.name}>
                {node.name}
              </span>
            </span>
            <Count value={counts[node.key] ?? 0} />
          </button>

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  MENU_SLOT,
                  'h-11 opacity-100 md:h-8 md:opacity-0 transition-opacity focus-visible:opacity-100 group-hover/row:opacity-100 data-[state=open]:opacity-100'
                )}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Opciones de {node.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onSelect={() => onEdit(node)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar {label}
              </DropdownMenuItem>
              {/* Sin sitio por debajo, crear dentro dejaría de tener sentido. */}
              {canHaveChildren(node) && (
                <DropdownMenuItem onSelect={() => onCreateChild(node)}>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Nueva subcarpeta
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                onSelect={() => onDelete(node)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar {label}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </DropTarget>

        {/* Los hijos cuelgan de una guía vertical: sólo con sangrarlos, la
            jerarquía no se distinguía de una lista plana. */}
        <CollapsibleContent className="pt-1">
          <div className="ml-[22px] space-y-1 border-l border-border pl-2">
            {node.children.map(renderNode)}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <aside className="w-full shrink-0 space-y-2 md:w-72">
      <div className="flex items-center justify-between border-b border-border/40 px-2 pb-2">
        <h2 className="flex items-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Folders className="mr-2 h-4 w-4" /> Carpetas
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 md:h-6 md:w-6"
          onClick={onCreateRoot}
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">Nueva carpeta principal</span>
        </Button>
      </div>

      <nav className="space-y-1">
        {/* «Todos» no es una ubicación, así que no admite que le suelten nada. */}
        <div className="flex items-center gap-0.5">
          <div className={CHEVRON_SLOT} />
          <button
            type="button"
            onClick={() => onSelect({ type: 'all' })}
            className={rowClass(activeKey === 'all', 1)}
            aria-current={activeKey === 'all' ? 'true' : undefined}
          >
            <span className="flex items-center">
              <Folders className="mr-2 h-4 w-4" />
              Todos
            </span>
            <Count value={counts.all ?? 0} />
          </button>
          <div className={MENU_SLOT} />
        </div>

        <DropTarget accepts={DRAGGABLE_GROUPS} location={NO_SELECTION} className="flex items-center gap-0.5">
          <div className={CHEVRON_SLOT} />
          <button
            type="button"
            onClick={() => onSelect({ type: 'unassigned' })}
            className={rowClass(activeKey === 'unassigned', 1)}
            aria-current={activeKey === 'unassigned' ? 'true' : undefined}
          >
            <span className="flex items-center">
              <FolderIcon className="mr-2 h-4 w-4" />
              Sin carpeta
            </span>
            <Count value={counts.unassigned ?? 0} />
          </button>
          <div className={MENU_SLOT} />
        </DropTarget>

        {tree.map(renderNode)}
      </nav>
    </aside>
  );
}
