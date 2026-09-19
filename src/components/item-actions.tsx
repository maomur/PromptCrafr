'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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
import type { Folder, Location, Project } from '@/lib/definitions';

interface ItemActionsProps {
  /** Nombre del recurso en singular, para las etiquetas accesibles. */
  label: string;
  projects: Project[];
  folders: Folder[];
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
  projects,
  folders,
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
                Sin proyecto (General)
              </DropdownMenuItem>

              {projects.map((project) => {
                const projectFolders = folders.filter((f) => f.projectId === project.id);
                return (
                  <DropdownMenuGroup key={project.id}>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => onMoveTo({ projectId: project.id, folderId: null })}
                      disabled={location.projectId === project.id && !location.folderId}
                    >
                      <FolderIcon className="mr-2 h-4 w-4" />
                      <span className="truncate">{project.name}</span>
                    </DropdownMenuItem>

                    {/* Las carpetas van sangradas bajo su proyecto. */}
                    {projectFolders.map((folder) => (
                      <DropdownMenuItem
                        key={folder.id}
                        className="pl-8"
                        onSelect={() => onMoveTo({ projectId: project.id, folderId: folder.id })}
                        disabled={location.folderId === folder.id}
                      >
                        <span className="truncate">{folder.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
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
