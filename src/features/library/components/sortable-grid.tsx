'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import Sortable from 'sortablejs';
import { cn } from '@/lib/utils';

interface SortableGridProps<T extends { id: string }> {
  items: T[];
  /** Nombre del grupo de SortableJS; debe estar en el `put` de los destinos. */
  group: string;
  /** Se llama con los índices dentro de `items` tras reordenar. */
  onReorder: (from: number, to: number) => void;
  /** Se llama al soltar una tarjeta sobre una zona de destino. */
  onDropOnTarget: (itemId: string, location: string) => void;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
}

/**
 * Rejilla de tarjetas que se pueden reordenar entre sí y arrastrar a una
 * carpeta, a un proyecto o a la barra lateral.
 *
 * SortableJS manipula el DOM directamente, algo que choca de frente con React.
 * La convivencia se apoya en tres detalles:
 *
 *  1. Al soltar devolvemos el nodo a su posición original, pase lo que pase.
 *     La lista real la vuelve a pintar React con el nuevo orden, así que
 *     cambio, así que nunca hay dos fuentes de verdad sobre el DOM.
 *  2. Si el destino es otra lista, miramos su `data-drop-target` en lugar de
 *     hacer caso a los índices, que se refieren a un contenedor que no es el
 *     nuestro.
 *  3. La instancia de Sortable se crea una sola vez y los callbacks viven en
 *     refs. Si los capturásemos en el efecto, cada arrastre llamaría a la
 *     versión del primer render con datos ya caducados.
 */
export default function SortableGrid<T extends { id: string }>({
  items,
  group,
  onReorder,
  onDropOnTarget,
  renderItem,
  className,
}: SortableGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onReorderRef = useRef(onReorder);
  const onDropOnTargetRef = useRef(onDropOnTarget);

  useEffect(() => {
    onReorderRef.current = onReorder;
    onDropOnTargetRef.current = onDropOnTarget;
  }, [onReorder, onDropOnTarget]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    let nextSibling: Node | null = null;

    const sortable = new Sortable(element, {
      animation: 150,
      draggable: '[data-id]',
      // La tarjeta entera se arrastra. Antes sólo valía el asa: 44×44 px en
      // una esquina, el 4 % de su superficie y al 50 % de opacidad, así que
      // agarrar la tarjeta por el título no hacía nada.
      //
      // Lo que no debe arrastrar: los controles de dentro.
      filter: 'button, a, [role="menuitem"], [role="menu"], input, textarea',
      preventOnFilter: false,
      // Un clic en la tarjeta copia su contenido. Sin este margen, el temblor
      // de la mano al pulsar convertiría cada copia en un arrastre.
      fallbackTolerance: 8,
      // En táctil hace falta mantener pulsado; si no, deslizar para leer la
      // lista arrastraría la tarjeta en lugar de desplazar la página.
      delay: 180,
      delayOnTouchOnly: true,
      touchStartThreshold: 5,
      ghostClass: 'sortable-ghost',
      dragClass: 'sortable-drag',
      // El arrastre nativo de HTML5 no funciona de forma fiable en táctil.
      forceFallback: true,
      // El clon que sigue al cursor va al <body>. Por omisión SortableJS lo
      // inserta justo detrás del elemento arrastrado, y entonces pasa a ser su
      // «hermano siguiente»: la referencia que guardamos para devolverlo a su
      // sitio apuntaba a un nodo que desaparece al soltar, la reinserción
      // fallaba en silencio y la tarjeta se quedaba huérfana en el destino.
      fallbackOnBody: true,
      group: { name: group, pull: true, put: false },
      onStart: (event) => {
        nextSibling = event.item.nextSibling;
        // Cinturón: si aun así la referencia fuese el clon, no sirve.
        if (nextSibling instanceof HTMLElement && nextSibling.classList.contains('sortable-fallback')) {
          nextSibling = nextSibling.nextSibling;
        }
        // Permite que el CSS insinúe los destinos válidos mientras se arrastra.
        document.documentElement.dataset.dragging = 'true';
      },
      onEnd: (event) => {
        delete document.documentElement.dataset.dragging;

        const { oldIndex, newIndex, item, from, to } = event;

        if (from && item) {
          // Sin una referencia válida, `insertBefore(item, null)` lo añade al
          // final: la posición exacta da igual porque React repinta la lista
          // enseguida, pero dejarlo en el destino sí importaría.
          const referencia = nextSibling?.parentNode === from ? nextSibling : null;
          try {
            from.insertBefore(item, referencia);
          } catch {
            // React ya se ha llevado el nodo; no hay nada que revertir.
          }
        }

        const location = to instanceof HTMLElement ? to.dataset.dropTarget : undefined;
        if (location && to !== from) {
          onDropOnTargetRef.current(item.dataset.id ?? '', location);
          return;
        }

        if (to === from && oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex) {
          onReorderRef.current(oldIndex, newIndex);
        }
      },
    });

    return () => sortable.destroy();
  }, [group]);

  return (
    <div
      ref={containerRef}
      className={cn('grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', className)}
    >
      {items.map((item, index) => (
        <div key={item.id} data-id={item.id} className="h-full">
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}
