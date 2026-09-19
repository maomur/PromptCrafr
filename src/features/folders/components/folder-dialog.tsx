'use client';

import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import FolderForm from '@/features/folders/components/folder-form';
import { pathTo, type TreeNode } from '@/features/folders/services/tree';
import type { FolderInput } from '@/features/folders/types';
import { NO_SELECTION } from '@/lib/constants';

/** Qué está pidiendo el diálogo: crear en un sitio, o editar un nodo. */
export type FolderRequest =
  | { mode: 'create'; parent: string }
  | { mode: 'edit'; node: TreeNode };

interface FolderDialogProps {
  request: FolderRequest | null;
  tree: TreeNode[];
  onSave: (input: FolderInput) => void;
  onClose: () => void;
}

/**
 * Diálogo de crear y editar carpetas, en cualquiera de los dos niveles.
 *
 * Los textos y los valores de partida se derivan aquí de la petición, para que
 * la pantalla que lo abre sólo tenga que decir qué quiere.
 */
export default function FolderDialog({ request, tree, onSave, onClose }: FolderDialogProps) {
  const copy = useMemo(() => {
    if (!request) return null;

    if (request.mode === 'edit') {
      const { node } = request;
      const isRoot = node.kind === 'project';
      // El padre de una carpeta es el penúltimo paso de su camino.
      const parent = isRoot ? NO_SELECTION : (pathTo(tree, node.key).at(-2)?.key ?? NO_SELECTION);

      return {
        title: isRoot ? 'Editar carpeta principal' : 'Editar carpeta',
        body: isRoot
          ? 'Una carpeta principal no puede moverse dentro de otra.'
          : 'Si la cambias de sitio, se muda con todo lo que contiene.',
        submitLabel: 'Guardar',
        lockParent: isRoot,
        moving: isRoot ? undefined : node,
        initial: { name: node.name, description: node.description, parent },
      };
    }

    return {
      title: request.parent === NO_SELECTION ? 'Nueva carpeta principal' : 'Nueva subcarpeta',
      body: 'Déjala como principal o elige dentro de qué carpeta va.',
      submitLabel: 'Crear',
      lockParent: false,
      moving: undefined,
      initial: { name: '', description: null, parent: request.parent },
    };
  }, [request, tree]);

  return (
    <Dialog open={!!request} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{copy?.title}</DialogTitle>
          <DialogDescription>{copy?.body}</DialogDescription>
        </DialogHeader>
        {copy && (
          <FolderForm
            tree={tree}
            moving={copy.moving}
            initial={copy.initial}
            lockParent={copy.lockParent}
            submitLabel={copy.submitLabel}
            onSave={onSave}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
