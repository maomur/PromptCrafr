'use client';

import { useEffect } from 'react';

/**
 * Polyfill definitivo para Drag and Drop en móviles.
 * Utiliza el método 'Hold-to-Drag' (300ms) para distinguir entre scroll y arrastre.
 */
export default function MobileDndPolyfill() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initPolyfill = async () => {
      try {
        const { polyfill } = await import('mobile-drag-drop');
        const { scrollBehaviourDragImageTranslateOverride } = await import('mobile-drag-drop/scroll-behaviour');
        
        polyfill({
          dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride,
          // 300ms es el estándar para 'Hold-to-Drag' en móviles
          holdToDrag: 300, 
          // Centra la imagen de arrastre bajo el dedo para mejor feedback
          dragImageCenterOnPointer: true,
        });

        // Interceptamos el inicio del toque de forma NO PASIVA
        const handleTouchStart = (e: TouchEvent) => {
          const target = e.target as HTMLElement;
          const handle = target.closest('.drag-handle');
          
          if (handle) {
            // Marcamos el inicio de una posible operación de arrastre
            // No prevenimos el default aquí para permitir que el temporizador de 'holdToDrag' corra
            document.body.setAttribute('data-dnd-pending', 'true');
          }
        };

        const handleTouchMove = (e: TouchEvent) => {
          // Si el arrastre ya es activo, bloqueamos el scroll del navegador agresivamente
          if (document.body.classList.contains('dragging-active')) {
            if (e.cancelable) {
              e.preventDefault();
            }
          }
        };

        const handleDragStart = () => {
          document.body.classList.add('dragging-active');
          document.body.removeAttribute('data-dnd-pending');
        };

        const handleDragEnd = () => {
          document.body.classList.remove('dragging-active');
          document.body.removeAttribute('data-dnd-pending');
        };

        // Listeners globales para coordinar el estado
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('dragstart', handleDragStart);
        window.addEventListener('dragend', handleDragEnd);
        window.addEventListener('touchend', () => document.body.removeAttribute('data-dnd-pending'));

        // Evitamos menús contextuales en el manejador que rompen el gesto en iOS
        const handleContextMenu = (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          if (target.closest('.drag-handle')) {
            e.preventDefault();
            e.stopPropagation();
          }
        };
        window.addEventListener('contextmenu', handleContextMenu, true);

        return () => {
          window.removeEventListener('touchstart', handleTouchStart);
          window.removeEventListener('touchmove', handleTouchMove);
          window.removeEventListener('dragstart', handleDragStart);
          window.removeEventListener('dragend', handleDragEnd);
          window.removeEventListener('contextmenu', handleContextMenu, true);
        };
      } catch (error) {
        console.error('Error initializing DND polyfill:', error);
      }
    };

    initPolyfill();
  }, []);

  return null;
}
