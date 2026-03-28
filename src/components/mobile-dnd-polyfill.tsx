'use client';

import { useEffect } from 'react';

export default function MobileDndPolyfill() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initPolyfill = async () => {
      try {
        const { polyfill } = await import('mobile-drag-drop');
        
        polyfill({
          dragImageTranslateOverride: (event, element, offset) => {
            return {
              x: offset.x,
              y: offset.y
            };
          },
          // Trigger dragging immediately on touch for elements with draggable="true"
          holdToDrag: 0 
        });

        // Necesario para evitar el scroll mientras se arrastra en iOS/Android
        // Solo prevenimos si el objetivo es un elemento de arrastre o el manejador
        const handleTouchMove = (e: TouchEvent) => {
          if ((e.target as HTMLElement).closest('.drag-handle')) {
            if (e.cancelable) e.preventDefault();
          }
        };

        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        return () => window.removeEventListener('touchmove', handleTouchMove);
      } catch (error) {
        console.error('Error initializing DND polyfill:', error);
      }
    };

    initPolyfill();
  }, []);

  return null;
}