'use client';

import { useEffect } from 'react';

/**
 * Polyfill para habilitar el Drag and Drop nativo en dispositivos móviles.
 * Implementa una interceptación agresiva de eventos táctiles para evitar que el scroll
 * del sistema interfiera con el gesto de arrastre.
 */
export default function MobileDndPolyfill() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initPolyfill = async () => {
      try {
        const { polyfill } = await import('mobile-drag-drop');
        const { scrollBehaviourDragImageTranslateOverride } = await import('mobile-drag-drop/scroll-behaviour');
        
        // Inicializamos el polyfill con sensibilidad inmediata
        polyfill({
          dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride,
          holdToDrag: 0, 
        });

        // Interceptamos el toque inicial de forma NO PASIVA para poder llamar a preventDefault()
        // Esto es crucial para "robarle" el evento al scroll del navegador.
        const handleTouchStart = (e: TouchEvent) => {
          const target = e.target as HTMLElement;
          const handle = target.closest('.drag-handle');
          
          if (handle) {
            // Si el toque es en el manejador, activamos el modo arrastre
            document.body.classList.add('dragging-active');
            // Bloqueamos el inicio del scroll nativo
            if (e.cancelable) {
              // No prevenimos el default aquí para que el polyfill reciba el evento,
              // pero marcamos que estamos en proceso de arrastre.
            }
          }
        };

        const handleTouchMove = (e: TouchEvent) => {
          // Si estamos arrastrando, bloqueamos CUALQUIER intento de scroll
          if (document.body.classList.contains('dragging-active')) {
            if (e.cancelable) {
              e.preventDefault();
            }
          }
        };

        const handleTouchEnd = () => {
          document.body.classList.remove('dragging-active');
        };

        // Eventos globales para gestionar el bloqueo de scroll
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);
        window.addEventListener('dragend', handleTouchEnd);

        // Prevenimos el menú contextual en el manejador para que no rompa el arrastre en iOS
        const handleContextMenu = (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          if (target.closest('.drag-handle')) {
            e.preventDefault();
          }
        };
        window.addEventListener('contextmenu', handleContextMenu);

        return () => {
          window.removeEventListener('touchstart', handleTouchStart);
          window.removeEventListener('touchmove', handleTouchMove);
          window.removeEventListener('touchend', handleTouchEnd);
          window.removeEventListener('dragend', handleTouchEnd);
          window.removeEventListener('contextmenu', handleContextMenu);
        };
      } catch (error) {
        console.error('Error initializing DND polyfill:', error);
      }
    };

    initPolyfill();
  }, []);

  return null;
}
