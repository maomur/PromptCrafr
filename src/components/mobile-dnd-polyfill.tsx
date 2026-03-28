'use client';

import { useEffect } from 'react';

export default function MobileDndPolyfill() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initPolyfill = async () => {
      try {
        const { polyfill } = await import('mobile-drag-drop');
        
        // Inicialización robusta del polyfill
        polyfill({
          holdToDrag: 0,
        });

        // Bloqueo preventivo de scroll solo en el mango
        const handleTouchStart = (e: TouchEvent) => {
          const target = e.target as HTMLElement;
          if (target.closest('.drag-handle')) {
            // No hacemos preventDefault aquí para permitir que PointerDown se dispare primero
            // El touch-action: none en CSS hará el resto.
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
