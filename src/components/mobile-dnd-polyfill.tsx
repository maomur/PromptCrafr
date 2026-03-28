'use client';

import { useEffect } from 'react';

export default function MobileDndPolyfill() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initPolyfill = async () => {
      try {
        const { polyfill } = await import('mobile-drag-drop');
        
        // Inicialización robusta del polyfill
        polyfill({
          holdToDrag: 0, // Respuesta inmediata
        });

        // Forzamos un evento táctil no pasivo en los manejadores para asegurar el bloqueo del scroll
        const handleTouchStart = (e: TouchEvent) => {
          const target = e.target as HTMLElement;
          if (target.closest('.drag-handle')) {
            // El touch-action: none en CSS debería bastar, pero esto es un seguro extra
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