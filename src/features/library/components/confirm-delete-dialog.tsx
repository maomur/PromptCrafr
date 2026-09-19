'use client';

import { useMemo } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { TreeNode } from '@/features/folders/services/tree';
import type { Link, Prompt } from '@/features/library/types';

/** Lo que se está a punto de borrar, a la espera de confirmación. */
export type Deletion =
  | { kind: 'prompt'; item: Prompt }
  | { kind: 'link'; item: Link }
  | { kind: 'node'; item: TreeNode };

interface ConfirmDeleteDialogProps {
  deletion: Deletion | null;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Una sola confirmación para los cuatro tipos de borrado.
 *
 * Cada texto dice exactamente qué desaparece y qué no, porque «se eliminará
 * la carpeta» deja al usuario sin saber si se lleva su contenido por delante.
 */
export default function ConfirmDeleteDialog({
  deletion,
  onConfirm,
  onClose,
}: ConfirmDeleteDialogProps) {
  const copy = useMemo(() => {
    if (!deletion) return null;

    if (deletion.kind === 'prompt') {
      return {
        title: '¿Eliminar prompt?',
        body: `Se eliminará definitivamente «${deletion.item.title}». Esta acción no se puede deshacer.`,
        action: 'Eliminar',
      };
    }
    if (deletion.kind === 'link') {
      return {
        title: '¿Eliminar enlace?',
        body: `Se eliminará definitivamente «${deletion.item.title || deletion.item.url}». Esta acción no se puede deshacer.`,
        action: 'Eliminar',
      };
    }

    const node = deletion.item;
    return node.kind === 'project'
      ? {
          title: '¿Eliminar carpeta principal?',
          body: `Se eliminará «${node.name}» y todas sus subcarpetas. Los prompts y enlaces que contengan no se borran: pasarán a «Sin carpeta».`,
          action: 'Eliminar',
        }
      : {
          title: '¿Eliminar carpeta?',
          body: `Se eliminará «${node.name}» y sus subcarpetas. Lo que contengan no se borra: subirá al nivel de encima.`,
          action: 'Eliminar',
        };
  }, [deletion]);

  return (
    <AlertDialog open={!!deletion} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{copy?.title}</AlertDialogTitle>
          <AlertDialogDescription>{copy?.body}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
          >
            {copy?.action}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
