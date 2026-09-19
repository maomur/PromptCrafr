'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  Folder as FolderIcon,
  FolderInput,
  MoreVertical,
  Trash2,
} from 'lucide-react';
import { type Location } from '@/features/folders/types';
import { flatten, nodeLocation, type TreeNode } from '@/features/folders/services/tree';

interface ItemActionsProps {
  /** Nombre del recurso en singular, para las etiquetas accesibles. */
  label: string;
  tree: TreeNode[];
  /** Ubicación actual del recurso, para marcar el destino en el que ya está. */
  location: Location;
  onEdit: () => void;
  onDelete: () => void;
  /** Copia el contenido al portapapeles. Equivalente accesible al clic en la tarjeta. */
  onCopy: () => void;
  onMoveTo: (location: Location) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  /** Botones adicionales a la izquierda (por ejemplo, abrir un enlace). */
  children?: ReactNode;
}

/**
 * Barra de acciones al pie de una tarjeta.
 *
 * El menú es deliberadamente **no modal**. Un `DropdownMenu` modal de Radix
 * bloquea `pointer-events` en el <body> mientras está abierto y lo restaura al
 * cerrarse; si una de sus opciones abre un diálogo de confirmación, el menú se
 * desmonta sin llegar a restaurarlo y la aplicación entera queda congelada.
 * Ese era el origen del problema que antes se parcheaba limpiando estilos del
 * <body> a base de temporizadores.
 */
export default function ItemActions({
  label,
  tree,
  location,
  onEdit,
  onDelete,
  onCopy,
  onMoveTo,
  onMoveUp,
  onMoveDown,
  children,
}: ItemActionsProps) {
  return (
    <div className="flex items-center gap-0.5">
      {children}

      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onCopy}>
        <Copy className="h-4 w-4" />
        <span className="sr-only">Copiar {label}</span>
      </Button>

      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
        <Eye className="h-4 w-4" />
        <span className="sr-only">Ver y editar {label}</span>
      </Button>

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Más opciones de {label}</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Organizar</DropdownMenuLabel>

          {/* Alternativa accesible al arrastre, que no funciona con teclado. */}
          <DropdownMenuItem onSelect={onMoveUp} disabled={!onMoveUp}>
            <ChevronUp className="mr-2 h-4 w-4" />
            Subir posición
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onMoveDown} disabled={!onMoveDown}>
            <ChevronDown className="mr-2 h-4 w-4" />
            Bajar posición
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <FolderInput className="mr-2 h-4 w-4" />
              Mover a
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="max-h-80 overflow-y-auto">
              <DropdownMenuItem
                onSelect={() => onMoveTo({ projectId: null, folderId: null })}
                disabled={location.projectId === null}
              >
                Sin carpeta
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Toda la jerarquía sangrada, para poder archivar a cualquier
                  profundidad sin encadenar submenús. */}
              {flatten(tree).map((node) => {
                const target = nodeLocation(node);
                const isCurrent =
                  location.projectId === target.projectId && location.folderId === target.folderId;

                return (
                  <DropdownMenuItem
                    key={node.key}
                    disabled={isCurrent}
                    style={{ paddingLeft: `${(node.depth - 1) * 14 + 8}px` }}
                    onSelect={() => onMoveTo(target)}
                  >
                    <FolderIcon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
                    <span className="truncate">{node.name}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
            onSelect={onDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar {label}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
