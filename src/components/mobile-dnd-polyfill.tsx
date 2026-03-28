'use client';

import { useEffect } from 'react';

export default function MobileDndPolyfill() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initPolyfill = async () => {
      try {
        const { polyfill } = await import('mobile-drag-drop');
        
        // Inicialización robusta para respuesta instantánea
        polyfill({
          holdToDrag: 0, 
        });

        // Este listener no pasivo es CRÍTICO para permitir que e.preventDefault() funcione en móviles
        // y bloquee el scroll cuando el usuario toca el manejador de arrastre.
        const handleTouchMove = (e: TouchEvent) => {
          const target = e.target as HTMLElement;
          if (target.closest('.drag-handle')) {
            // El scroll se bloquea solo si estamos en el mango
            if (e.cancelable) e.preventDefault();
          }
        };

        window.addEventListener('touchmove', handleTouchMove, { passive: false });

        return () => {
          window.removeEventListener('touchmove', handleTouchMove);
        };
      } catch (error) {
        console.error('Error initializing DND polyfill:', error);
      }
    };

    initPolyfill();
  }, []);

  return null;
}