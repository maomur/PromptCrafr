'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import Sortable from 'sortablejs';
import { cn } from '@/lib/utils';

interface SortableGridProps<T extends { id: string }> {
  items: T[];
  /** Se llama con los índices dentro de `items` tras soltar un elemento. */
  onReorder: (from: number, to: number) => void;
  renderItem: (item: T) => ReactNode;
  className?: string;
}

/**
 * Rejilla de tarjetas reordenables mediante arrastre.
 *
 * SortableJS manipula el DOM directamente, algo que choca de frente con React.
 * La convivencia se apoya en dos detalles:
 *
 *  1. Al soltar devolvemos el nodo a su posición original antes de avisar. La
 *     lista real la vuelve a pintar React cuando Firestore confirma el nuevo
 *     orden, así que nunca hay dos fuentes de verdad sobre el DOM.
 *  2. La instancia de Sortable se crea una sola vez y el callback vive en una
 *     ref. Si lo capturásemos en el efecto, cada arrastre llamaría a la versión
 *     del primer render con datos ya caducados.
 */
export default function SortableGrid<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
  className,
}: SortableGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onReorderRef = useRef(onReorder);

  useEffect(() => {
    onReorderRef.current = onReorder;
  }, [onReorder]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    let nextSibling: Node | null = null;

    const sortable = new Sortable(element, {
      animation: 150,
      handle: '.drag-handle',
      ghostClass: 'sortable-ghost',
      dragClass: 'sortable-drag',
      // El arrastre nativo de HTML5 no funciona de forma fiable en táctil.
      forceFallback: true,
      onStart: (event) => {
        nextSibling = event.item.nextSibling;
      },
      onEnd: (event) => {
        const { oldIndex, newIndex, item, from } = event;

        if (from && item) {
          try {
            from.insertBefore(item, nextSibling);
          } catch {
            // React ya se ha llevado el nodo; no hay nada que revertir.
          }
        }

        if (oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex) {
          onReorderRef.current(oldIndex, newIndex);
        }
      },
    });

    return () => sortable.destroy();
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', className)}
    >
      {items.map((item) => (
        <div key={item.id} data-id={item.id} className="h-full">
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}
