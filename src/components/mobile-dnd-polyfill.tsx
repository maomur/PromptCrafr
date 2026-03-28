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
        });

        // ESTRATEGIA DEFINITIVA: Interceptación táctil NO PASIVA
        // Esto bloquea el scroll del navegador en el instante del toque si es sobre un mango
        const handleTouchStart = (e: TouchEvent) => {
          const target = e.target as HTMLElement;
          if (target.closest('.drag-handle')) {
            // Detenemos el inicio del scroll preventivamente
            if (e.cancelable) {
              e.preventDefault();
            }
          }
        };

        // Debe ser { passive: false } para que e.preventDefault() funcione
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