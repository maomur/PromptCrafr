'use client';

import { Trash2 } from 'lucide-react';
import DropTarget from '@/components/ui/drop-target';
import { DRAGGABLE_GROUPS } from '@/lib/constants';

/**
 * Identificador del destino «papelera».
 *
 * No es una ubicación del árbol, así que quien recibe el soltado lo distingue
 * por este valor antes de intentar interpretarlo como carpeta.
 */
export const TRASH_TARGET = 'trash';

/**
 * Papelera a la que arrastrar un prompt o un enlace para borrarlo.
 *
 * Es una zona de soltar, no un botón: pulsarla no hace nada, y por eso no se
 * anuncia como control. Borrar con el teclado sigue estando en el menú de
 * cada tarjeta, que es la vía accesible.
 *
 * Soltar aquí **no borra de inmediato**: abre la misma confirmación que el
 * menú. No hay deshacer, y un arrastre puede soltarse sin querer.
 */
export default function DeleteDropZone() {
  return (
    <DropTarget
      accepts={DRAGGABLE_GROUPS}
      location={TRASH_TARGET}
      className="fixed bottom-8 left-8 z-40 rounded-full"
    >
      <div
        aria-hidden="true"
        title="Arrastra aquí un prompt o un enlace para eliminarlo"
        className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive shadow-2xl transition-transform duration-200 [html[data-dragging='true']_&]:scale-110"
      >
        <Trash2 className="h-8 w-8 text-white" />
      </div>
    </DropTarget>
  );
}
