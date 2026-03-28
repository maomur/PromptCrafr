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
          },
          // Forzamos que el polyfill escuche incluso si no hay draggable="true" inicialmente
          holdToDrag: 100 
        });

        // Necesario para evitar el scroll mientras se arrastra en iOS/Android
        window.addEventListener('touchmove', function() {}, { passive: false });
      } catch (error) {
        console.error('Error initializing DND polyfill:', error);
      }
    };

    initPolyfill();
  }, []);

  return null;
}