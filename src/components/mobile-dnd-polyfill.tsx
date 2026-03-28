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
          holdToDrag: 0, // Respuesta instantánea ya que bloqueamos el scroll manualmente
          tryEnterPassive: false
        });

        // BLOQUEO CRÍTICO DE BAJO NIVEL: Interceptamos el toque antes que el navegador inicie el scroll
        const handleTouchStart = (e: TouchEvent) => {
          const target = e.target as HTMLElement;
          // Si el toque ocurre en el mango de arrastre, bloqueamos el scroll nativo de inmediato
          if (target.closest('.drag-handle')) {
            if (e.cancelable) {
              e.preventDefault(); // Detiene el scroll del sistema
            }
          }
        };

        // El listener DEBE ser passive: false para poder llamar a preventDefault()
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
