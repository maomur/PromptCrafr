'use client';

import { Folder as FolderIcon, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Card, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DropTarget from '@/components/drop-target';
import type { TreeNode } from '@/lib/tree';

interface FolderCardProps {
  node: TreeNode;
  /** Recursos que contiene, para no tener que entrar a comprobarlo. */
  count: number;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Carpeta mostrada como tarjeta dentro de la vista de un proyecto.
 *
 * Tiene el mismo tamaño que las tarjetas de prompt para que la rejilla no se
 * vea desigual, y es a la vez un enlace para entrar y una zona donde soltar
 * recursos: mover algo a una carpeta que ya tienes delante no debería obligar
 * a apuntar a la barra lateral.
 */
export default function FolderCard({ node, count, onOpen, onEdit, onDelete }: FolderCardProps) {
  return (
    <DropTarget location={node.key} className="h-full">
      <Card
        onClick={(event) => {
          if ((event.target as HTMLElement).closest('button, [role="menuitem"], [role="menu"]')) {
            return;
          }
          onOpen();
        }}
        className="group flex h-full cursor-pointer flex-col rounded-xl border-border/20 bg-card shadow-md transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
      >
        <CardHeader className="space-y-3 pt-6">
          <div className="flex items-start justify-between gap-2">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <FolderIcon className="h-6 w-6 text-primary" />
            </div>

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="-mr-2 -mt-1 h-8 w-8 shrink-0 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:opacity-100"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Opciones de la carpeta {node.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onSelect={onEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar carpeta
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
          </div>

          <div className="space-y-1.5">
            <h3 className="truncate text-base font-bold tracking-tight" title={node.name}>
              {node.name}
            </h3>
            {node.description ? (
              <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                {node.description}
              </p>
            ) : (
              <p className="text-[11px] italic leading-relaxed text-muted-foreground/60">
                Sin descripción
              </p>
            )}
          </div>
        </CardHeader>

        <div className="flex-grow" />

        <CardFooter className="pb-4 pt-0 text-[10px] text-muted-foreground">
          <span className="opacity-70">{count === 1 ? '1 recurso' : `${count} recursos`}</span>
        </CardFooter>
      </Card>
    </DropTarget>
  );
}
