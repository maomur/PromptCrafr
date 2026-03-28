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
          // holdToDrag: 0 asegura respuesta inmediata al toque
          holdToDrag: 0,
          dragImageTranslateOverride: (event, element, offset) => {
            return {
              x: offset.x,
              y: offset.y
            };
          }
        });

        // Este listener global es CRÍTICO: bloquea el scroll de la página 
        // únicamente cuando el usuario interactúa con un .drag-handle.
        // Debe ser { passive: false } para poder ejecutar preventDefault().
        const handleGlobalTouchMove = (e: TouchEvent) => {
          const target = e.target as HTMLElement;
          if (target.closest('.drag-handle')) {
            if (e.cancelable) {
              e.preventDefault();
            }
          }
        };

        window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
        
        // También bloqueamos el menú contextual en el manejador para evitar interrupciones
        const handleContextMenu = (e: MouseEvent | TouchEvent) => {
          if ((e.target as HTMLElement).closest('.drag-handle')) {
            e.preventDefault();
          }
        };
        window.addEventListener('contextmenu', handleContextMenu as any);

        return () => {
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