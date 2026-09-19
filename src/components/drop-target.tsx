'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import Sortable from 'sortablejs';

/** Nombres de grupo de SortableJS que pueden soltarse en un destino. */
export const DRAGGABLE_GROUPS = ['prompts', 'links'];

interface DropTargetProps {
  /** Ubicación de destino, codificada con `encodeLocation`. */
  location: string;
  className?: string;
  children: ReactNode;
}

/**
 * Zona sobre la que se puede soltar un prompt o un enlace para archivarlo ahí.
 *
 * SortableJS sólo sabe mover cosas entre listas, así que cada destino es una
 * lista más, vacía y no ordenable. La ubicación viaja en `data-drop-target`:
 * la rejilla de origen la lee al soltar, y así toda la lógica del arrastre
 * vive en un único sitio en lugar de repartirse entre callbacks de cada
 * destino.
 */
export default function DropTarget({ location, className, children }: DropTargetProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const sortable = new Sortable(element, {
      group: { name: 'drop', pull: false, put: DRAGGABLE_GROUPS },
      sort: false,
      // Lo que ya vive aquí (botones, iconos) no se puede arrastrar: sólo
      // cuentan como arrastrables las tarjetas, que llevan `data-id`.
      draggable: '[data-id]',
      // Margen de gracia: no hace falta apuntar con precisión de cirujano.
      emptyInsertThreshold: 20,
    });

    return () => sortable.destroy();
  }, []);

  return (
    <div ref={ref} data-drop-target={location} className={className}>
      {children}
    </div>
  );
}
