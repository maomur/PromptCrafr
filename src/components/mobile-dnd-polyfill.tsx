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
          holdToDrag: 0, // Respuesta instantánea ya que manejamos el bloqueo nosotros
          tryEnterPassive: false
        });

        // INTERCEPTOR DE BAJO NIVEL: Bloqueamos el scroll del navegador en el instante del toque
        const handleTouchStart = (e: TouchEvent) => {
          const target = e.target as HTMLElement;
          const handle = target.closest('.drag-handle');
          
          if (handle) {
            // Si el toque es en el manejador, cancelamos el scroll nativo inmediatamente
            if (e.cancelable) {
              e.preventDefault();
              document.body.classList.add('dragging-active');
            }
          }
        };

        const handleTouchEnd = () => {
          document.body.classList.remove('dragging-active');
        };

        // El listener DEBE ser { passive: false } para poder ejecutar preventDefault()
        window.addEventListener('touchstart', handleTouchStart, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);
        window.addEventListener('dragend', handleTouchEnd);

        return () => {
          window.removeEventListener('touchstart', handleTouchStart);
          window.removeEventListener('touchend', handleTouchEnd);
          window.removeEventListener('dragend', handleTouchEnd);
        };
      } catch (error) {
        console.error('Error initializing DND polyfill:', error);
      }
    };

    initPolyfill();
  }, []);

  return null;
}
