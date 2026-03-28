'use client';

import { useEffect } from 'react';

/**
 * Polyfill robusto para Drag and Drop en móviles.
 * Utiliza interceptación de eventos no pasivos para garantizar que el arrastre
 * tenga prioridad sobre el scroll cuando se usa el mango de agarre.
 */
export default function MobileDndPolyfill() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initPolyfill = async () => {
      try {
        const { polyfill } = await import('mobile-drag-drop');
        const { scrollBehaviourDragImageTranslateOverride } = await import('mobile-drag-drop/scroll-behaviour');
        
        // Inicializamos el polyfill
        polyfill({
          dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride,
          // Con touch-action: none en el mango, holdToDrag: 0 da respuesta inmediata
          holdToDrag: 0,
          dragImageCenterOnPointer: true,
        });

        // Interceptación crítica: Detener el scroll si el toque es en el mango
        // Debe ser un listener NO PASIVO para poder llamar a preventDefault()
        const handleTouchStart = (e: TouchEvent) => {
          const target = e.target as HTMLElement;
          if (target.closest('.drag-handle')) {
            // Detenemos el inicio del scroll para que el polyfill pueda actuar
            // Sin esto, el navegador suele ganar la carrera y empieza a hacer scroll
            if (e.cancelable) {
              // No llamamos preventDefault aquí siempre para dejar que el polyfill haga su magia,
              // pero marcamos el body para el listener de touchmove
              document.body.setAttribute('data-dnd-active', 'true');
            }
          }
        };

        const handleTouchMove = (e: TouchEvent) => {
          if (document.body.getAttribute('data-dnd-active') === 'true' || document.body.classList.contains('dragging-active')) {
            if (e.cancelable) {
              e.preventDefault();
            }
          }
        };

        const handleDragEnd = () => {
          document.body.classList.remove('dragging-active');
          document.body.removeAttribute('data-dnd-active');
        };

        const handleDragStart = () => {
          document.body.classList.add('dragging-active');
        };

        // Eventos globales con configuración específica para móviles
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('dragstart', handleDragStart);
        window.addEventListener('dragend', handleDragEnd);
        window.addEventListener('touchend', () => document.body.removeAttribute('data-dnd-active'));

        return () => {
          window.removeEventListener('touchstart', handleTouchStart);
          window.removeEventListener('touchmove', handleTouchMove);
          window.removeEventListener('dragstart', handleDragStart);
          window.removeEventListener('dragend', handleDragEnd);
        };
      } catch (error) {
        console.error('Error initializing DND polyfill:', error);
      }
    };

    initPolyfill();
  }, []);

  return null;
}
