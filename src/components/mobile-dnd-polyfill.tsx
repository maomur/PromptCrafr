'use client';

import { useEffect } from 'react';

export default function MobileDndPolyfill() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initPolyfill = async () => {
      try {
        const { polyfill } = await import('mobile-drag-drop');
        
        polyfill({
          dragImageTranslateOverride: (event, element, offset) => {
            return {
              x: offset.x,
              y: offset.y
            };
          }
        });

        // Aseguramos que los eventos táctiles en el handle inicien el drag
        window.addEventListener('touchmove', function() {}, { passive: false });
      } catch (error) {
        // Fallback silencioso
      }
    };

    initPolyfill();
  }, []);

  return null;
}