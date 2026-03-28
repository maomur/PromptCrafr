'use client';

import { useEffect } from 'react';

export default function MobileDndPolyfill() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initPolyfill = async () => {
      try {
        const { polyfill } = await import('mobile-drag-drop');
        
        // Inicializar polyfill con configuración optimizada para respuesta rápida
        polyfill({
          dragImageTranslateOverride: (event, element, offset) => {
            return {
              x: offset.x,
              y: offset.y
            };
          },
          holdToDrag: 0 // Respuesta inmediata al toque en elementos con draggable=true
        });

        // Prevención global de scroll SOLO cuando se toca un manejador de arrastre
        const handleGlobalTouchStart = (e: TouchEvent) => {
          if ((e.target as HTMLElement).closest('.drag-handle')) {
            // No prevenimos aquí el touchstart para permitir que el polyfill lo capture
          }
        };

        window.addEventListener('touchstart', handleGlobalTouchStart, { passive: true });
        return () => window.removeEventListener('touchstart', handleGlobalTouchStart);
      } catch (error) {
        console.error('Error initializing DND polyfill:', error);
      }
    };

    initPolyfill();
  }, []);

  return null;
}