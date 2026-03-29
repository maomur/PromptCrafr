
'use client';

import { useEffect } from 'react';

/**
 * Mobile Drag-Drop Polyfill - Definitive Implementation.
 * Uses the holdToDrag pattern (200ms) to distinguish between scroll and drag.
 * This is the official recommended setup for mobile HTML5 DnD.
 */
export default function MobileDndPolyfill() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initPolyfill = async () => {
      try {
        const { polyfill } = await import('mobile-drag-drop');

        // Initialize with holdToDrag to ensure touch scrolling still works
        // This is the standard behavior for mobile organization (long press to move)
        polyfill({
          holdToDrag: 200, 
        });

        console.log('Mobile DnD Polyfill initialized with Hold-to-Drag (200ms)');
      } catch (err) {
        console.error('Failed to initialize Mobile DnD Polyfill:', err);
      }
    };

    initPolyfill();

    // Block native scroll ONLY on drag handles to let the polyfill work
    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.drag-handle')) {
        // We don't preventDefault here yet because holdToDrag needs the sequence.
        // The touch-action: none CSS will handle the immediate scroll block.
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { capture: true, passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart, { capture: true });
    };
  }, []);

  return null;
}
