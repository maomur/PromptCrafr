'use client';

import { useEffect } from 'react';

export default function MobileDndPolyfill() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initPolyfill = async () => {
      try {
        const { polyfill } = await import('mobile-drag-drop');
        
        polyfill({
          // holdToDrag: 0 asegura respuesta inmediata al toque en móviles
          holdToDrag: 0,
          dragImageTranslateOverride: (event, element, offset) => {
            return {
              x: offset.x,
              y: offset.y
            };
          }
        });

        // Este listener global ayuda a prevenir scrolls accidentales cuando se inicia un arrastre
        const handleGlobalTouchMove = (e: TouchEvent) => {
          if ((e.target as HTMLElement).closest('.drag-handle')) {
            if (e.cancelable) e.preventDefault();
          }
        };

        window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
        return () => window.removeEventListener('touchmove', handleGlobalTouchMove);
      } catch (error) {
        console.error('Error initializing DND polyfill:', error);
      }
    };

    initPolyfill();
  }, []);

  return null;
}