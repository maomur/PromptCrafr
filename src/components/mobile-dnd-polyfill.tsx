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
          holdToDrag: 150, // 150ms: El estándar para diferenciar toque de arrastre
          tryEnterPassive: false // Permite bloquear el scroll de forma activa
        });

        // BLOQUEO PREVENTIVO DE SCROLL EN MANEJADORES
        const handleTouchStart = (e: TouchEvent) => {
          const target = e.target as HTMLElement;
          if (target.closest('.drag-handle')) {
            // Si el toque es en el mango, prevenimos el inicio de cualquier gesto del sistema
            if (e.cancelable) {
              e.stopPropagation();
            }
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