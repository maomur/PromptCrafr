'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { TreeNode } from '@/features/folders/services/tree';
import LinkForm from '@/features/library/components/link-form';
import PromptForm from '@/features/library/components/prompt-form';
import type { Link, LinkInput, Prompt, PromptInput } from '@/features/library/types';

interface ItemDialogsProps {
  tree: TreeNode[];
  creating: 'prompt' | 'link' | null;
  editingPrompt: Prompt | null;
  editingLink: Link | null;
  onSavePrompt: (input: PromptInput, id?: string) => void;
  onSaveLink: (input: LinkInput, id?: string) => void;
  onClose: () => void;
}

/**
 * Los cuatro diálogos de prompts y enlaces: crear y editar, de cada uno.
 *
 * El contenido se desmonta al cerrarse, así que el formulario siempre arranca
 * con los datos del recurso seleccionado y no con los del anterior.
 */
export default function ItemDialogs({
  tree,
  creating,
  editingPrompt,
  editingLink,
  onSavePrompt,
  onSaveLink,
  onClose,
}: ItemDialogsProps) {
  return (
    <>
      <Dialog open={creating === 'link'} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Nuevo enlace</DialogTitle>
            <DialogDescription>Guarda una dirección web en tu biblioteca.</DialogDescription>
          </DialogHeader>
          <LinkForm tree={tree} onSave={onSaveLink} onClose={onClose} />
        </DialogContent>
      </Dialog>

      <Dialog open={creating === 'prompt'} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Nuevo prompt</DialogTitle>
            <DialogDescription>Añade un prompt reutilizable a tu biblioteca.</DialogDescription>
          </DialogHeader>
          <PromptForm tree={tree} onSave={onSavePrompt} onClose={onClose} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingPrompt} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Editar prompt</DialogTitle>
            <DialogDescription>Modifica los datos y guarda los cambios.</DialogDescription>
          </DialogHeader>
          {editingPrompt && (
            <PromptForm
              prompt={editingPrompt}
              tree={tree}
              onSave={onSavePrompt}
              onClose={onClose}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingLink} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Editar enlace</DialogTitle>
            <DialogDescription>Modifica los datos y guarda los cambios.</DialogDescription>
          </DialogHeader>
          {editingLink && (
            <LinkForm link={editingLink} tree={tree} onSave={onSaveLink} onClose={onClose} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
