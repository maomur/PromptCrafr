'use client';

import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

export default function SubmitButton({ isEditMode, isPending }: { isEditMode: boolean, isPending: boolean }) {

  return (
    <Button type="submit" disabled={isPending}>
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isPending ? (isEditMode ? 'Guardando...' : 'Creando...') : (isEditMode ? 'Guardar Cambios' : 'Crear Prompt')}
    </Button>
  );
}
