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
          holdToDrag: 100, // Pequeño delay para diferenciar de un tap accidental
        });

        // Aseguramos que los eventos táctiles en el mango bloqueen el scroll nativo
        const handleTouchStart = (e: TouchEvent) => {
          const target = e.target as HTMLElement;
          if (target.closest('.drag-handle')) {
            // No prevenimos default aquí para no romper el inicio del drag del polyfill
            // Pero touch-action: none en CSS hará el trabajo pesado
          }
        };

        window.addEventListener('touchstart', handleTouchStart, { passive: true });

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