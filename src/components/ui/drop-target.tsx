'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import Sortable from 'sortablejs';

interface DropTargetProps {
  /** Identificador del destino. Se publica en `data-drop-target`. */
  location: string;
  /** Nombres de grupo de SortableJS que este destino admite. */
  accepts: readonly string[];
  className?: string;
  children: ReactNode;
}

/**
 * Zona sobre la que se puede soltar algo arrastrable.
 *
 * SortableJS sólo sabe mover cosas entre listas, así que cada destino es una
 * lista más, vacía y no ordenable. El identificador viaja en
 * `data-drop-target`: la lista de origen lo lee al soltar, y así la lógica del
 * arrastre vive en un único sitio en lugar de repartirse entre destinos.
 *
 * No sabe qué se le suelta: quien lo usa declara los grupos que admite. Por
 * eso vive aquí y no dentro de una feature, y puede usarse desde cualquiera
 * sin crear dependencias entre ellas.
 */
export default function DropTarget({ location, accepts, className, children }: DropTargetProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const sortable = new Sortable(element, {
      group: { name: `drop:${location}`, pull: false, put: [...accepts] },
      sort: false,
      // Lo que ya vive aquí (botones, iconos) no se puede arrastrar: sólo
      // cuentan como arrastrables los elementos con `data-id`.
      draggable: '[data-id]',
      // Margen de gracia: no hace falta apuntar con precisión de cirujano.
      emptyInsertThreshold: 20,
    });

    return () => sortable.destroy();
    // `accepts` es una constante del módulo que lo usa; no cambia en vida.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  return (
    <div ref={ref} data-drop-target={location} className={className}>
      {children}
    </div>
  );
}
