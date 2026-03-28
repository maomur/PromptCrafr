'use client';

import { useEffect } from 'react';

export default function MobileDndPolyfill() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initPolyfill = async () => {
      try {
        const { polyfill } = await import('mobile-drag-drop');
        const { scrollBehaviourDragImageTranslateOverride } = await import('mobile-drag-drop/scroll-behaviour');
        
        polyfill({
          dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride,
          holdToDrag: 0, // Respuesta inmediata
          tryEnterPassive: false
        });

        // INTERCEPTOR CRÍTICO: Bloqueamos el scroll del navegador solo cuando se toca el manejador
        const handleTouchStart = (e: TouchEvent) => {
          const target = e.target as HTMLElement;
          if (target.closest('.drag-handle')) {
            // Si el toque es en el manejador, cancelamos el scroll nativo
            if (e.cancelable) {
              e.preventDefault();
            }
          }
        };

        // El listener DEBE ser { passive: false } para poder ejecutar preventDefault()
        window.addEventListener('touchstart', handleTouchStart, { passive: false });

        return () => {
          window.removeEventListener('touchstart', handleTouchStart);
        };
      } catch (error) {
        console.error('Error initializing DND polyfill:', error);
      }
    };

    initPolyfill();
  }, []);

  return null;
}
