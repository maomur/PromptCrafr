'use client';

import { useEffect } from 'react';

/**
 * Este componente inicializa el polyfill de drag and drop para móviles
 * y gestiona el bloqueo de scroll cuando se inicia un arrastre desde el manejador.
 */
export default function MobileDndPolyfill() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initPolyfill = async () => {
      try {
        const { polyfill } = await import('mobile-drag-drop');
        
        polyfill({
          holdToDrag: 0,
          dragImageTranslateOverride: (event, element, offset) => {
            return {
              x: offset.x,
              y: offset.y
            };
          }
        });

        // Este listener captura el inicio del toque de forma NO PASIVA.
        // Es la única forma garantizada de bloquear el scroll antes de que empiece.
        const handleGlobalTouchStart = (e: TouchEvent) => {
          const target = e.target as HTMLElement;
          if (target.closest('.drag-handle')) {
            // Detenemos cualquier comportamiento del sistema (scroll, zoom, etc)
            // para que el polyfill pueda tomar el control total del gesto.
            if (e.cancelable) {
              e.preventDefault();
            }
          }
        };

        // Bloqueo preventivo de scroll durante el movimiento
        const handleGlobalTouchMove = (e: TouchEvent) => {
          const target = e.target as HTMLElement;
          if (target.closest('.drag-handle')) {
            if (e.cancelable) {
              e.preventDefault();
            }
          }
        };

        window.addEventListener('touchstart', handleGlobalTouchStart, { passive: false });
        window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
        
        const handleContextMenu = (e: MouseEvent | TouchEvent) => {
          if ((e.target as HTMLElement).closest('.drag-handle')) {
            e.preventDefault();
          }
        };
        window.addEventListener('contextmenu', handleContextMenu as any);

        return () => {
          window.removeEventListener('touchstart', handleGlobalTouchStart);
          window.removeEventListener('touchmove', handleGlobalTouchMove);
          window.removeEventListener('contextmenu', handleContextMenu as any);
        };
      } catch (error) {
        console.error('Error initializing DND polyfill:', error);
      }
    };

    initPolyfill();
  }, []);

  return null;
}