'use client';

import { FolderPlus, Link as LinkIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CreateButtonsProps {
  onCreateFolder: () => void;
  onCreateLink: () => void;
  onCreatePrompt: () => void;
}

/** Botones flotantes de creación. Un color por tipo de recurso. */
export default function CreateButtons({
  onCreateFolder,
  onCreateLink,
  onCreatePrompt,
}: CreateButtonsProps) {
  return (
    <div className="fixed bottom-8 right-8 z-40 flex items-center gap-3">
      <Button
        size="icon"
        className="h-16 w-16 rounded-full bg-violet-600 shadow-2xl hover:bg-violet-700"
        onClick={onCreateFolder}
      >
        <FolderPlus className="h-8 w-8 text-white" />
        <span className="sr-only">Crear una carpeta</span>
      </Button>

      <Button
        size="icon"
        className="h-16 w-16 rounded-full bg-orange-500 shadow-2xl hover:bg-orange-600"
        onClick={onCreateLink}
      >
        <LinkIcon className="h-8 w-8 text-white" />
        <span className="sr-only">Guardar un enlace</span>
      </Button>

      <Button size="icon" className="h-16 w-16 rounded-full shadow-2xl" onClick={onCreatePrompt}>
        <Plus className="h-8 w-8" />
        <span className="sr-only">Crear un prompt</span>
      </Button>
    </div>
  );
}
