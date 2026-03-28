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
          holdToDrag: 0,
        });

        // Bloqueo estricto de scroll para el manejador de arrastre
        const blockNativeScroll = (e: TouchEvent) => {
          const target = e.target as HTMLElement;
          // Si el toque ocurre en el manejador, cancelamos el scroll nativo
          if (target.closest('.drag-handle')) {
            if (e.cancelable) {
              e.preventDefault();
            }
          }
        };

        // Añadimos listeners globales no pasivos
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