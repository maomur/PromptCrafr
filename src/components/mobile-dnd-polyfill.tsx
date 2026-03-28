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
          holdToDrag: 0, // Inicia el arrastre instantáneamente
        });

        // Interceptación de gestos táctiles para bloquear el scroll solo en los manejadores
        const blockNativeScroll = (e: TouchEvent) => {
          const target = e.target as HTMLElement;
          if (target.closest('.drag-handle')) {
            // Si el toque se inicia en un manejador, bloqueamos el comportamiento por defecto (scroll)
            if (e.cancelable) {
              e.preventDefault();
            }
          }
        };

        // Añadimos listeners de bajo nivel con { passive: false } para permitir preventDefault
        window.addEventListener('touchstart', blockNativeScroll, { passive: false });
        window.addEventListener('touchmove', blockNativeScroll, { passive: false });

        return () => {
          window.removeEventListener('touchstart', blockNativeScroll);
          window.removeEventListener('touchmove', blockNativeScroll);
        };
      } catch (error) {
        console.error('Error initializing DND polyfill:', error);
      }
    };

    initPolyfill();
  }, []);

  return null;
}
