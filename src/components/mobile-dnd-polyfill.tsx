'use client';

import { useEffect } from 'react';

/**
 * Componente que inicializa el polyfill de Drag and Drop para dispositivos móviles.
 * Se utiliza una importación dinámica dentro de useEffect para asegurar que el
 * código solo se ejecute en el cliente y que el bundler maneje la dependencia.
 */
export default function MobileDndPolyfill() {
  useEffect(() => {
    // Solo ejecutar en el navegador
    if (typeof window === 'undefined') return;

    // Importación dinámica del polyfill
    const initPolyfill = async () => {
      try {
        const { polyfill } = await import('mobile-drag-drop');
        
        polyfill({
          // Configuración para mejorar la precisión del arrastre en móviles
          dragImageTranslateOverride: (event, element, offset) => {
            return {
              x: offset.x,
              y: offset.y
            };
          }
        });

        // Opcional: escuchar eventos globales si fuera necesario para depuración
        // window.addEventListener('touchmove', function() {}, { passive: false });
      } catch (error) {
        // Fallback silencioso si el polyfill falla al cargar
      }
    };

    initPolyfill();
  }, []);

  return null;
}
