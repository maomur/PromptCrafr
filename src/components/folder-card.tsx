'use client';

import { Folder as FolderIcon, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DropTarget from '@/components/drop-target';
import type { Folder } from '@/lib/definitions';

interface FolderCardProps {
  folder: Folder;
  /** Recursos que contiene, para no tener que entrar a comprobarlo. */
  count: number;
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
}

/**
 * Carpeta mostrada como tarjeta dentro de la vista de un proyecto.
 *
 * Es a la vez un enlace para entrar y una zona donde soltar prompts: mover
 * algo a una carpeta que ya tienes delante no debería obligar a apuntar a la
 * barra lateral.
 */
export default function FolderCard({ folder, count, onOpen, onRename, onDelete }: FolderCardProps) {
  return (
    <DropTarget location={`folder:${folder.id}`} className="h-full">
      <Card
        onClick={(event) => {
          if ((event.target as HTMLElement).closest('button, [role="menuitem"], [role="menu"]')) {
            return;
          }
          onOpen();
        }}
        className="group flex h-full cursor-pointer items-center gap-3 rounded-xl border-border/20 p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
      >
        <div className="rounded-lg bg-primary/10 p-2">
          <FolderIcon className="h-5 w-5 text-primary" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{folder.name}</p>
          <p className="text-xs text-muted-foreground">
            {count === 1 ? '1 recurso' : `${count} recursos`}
          </p>
        </div>

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Opciones de la carpeta {folder.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onSelect={onRename}>
              <Pencil className="mr-2 h-4 w-4" />
              Renombrar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
              onSelect={onDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar carpeta
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Card>
    </DropTarget>
  );
}
