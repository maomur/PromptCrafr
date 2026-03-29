
'use client';

import { useEffect } from 'react';

/**
 * Mobile Drag-Drop Polyfill.
 * Uses 'drag-drop-touch' to seamlessly convert touch events into HTML5 drag events.
 */
export default function MobileDndPolyfill() {
  useEffect(() => {
    // Only run in the browser
    if (typeof window === 'undefined') return;

    // Importing the package automatically initializes the polyfill on the window object
    const initPolyfill = async () => {
      try {
        await import('drag-drop-touch');
        console.log('DragDropTouch polyfill initialized');
      } catch (err) {
        console.error('Failed to load DragDropTouch polyfill:', err);
      }
    };

    initPolyfill();
    
    // Global prevention of scrolling only when a drag handle is pressed.
    // This is a safety measure to ensure the browser doesn't steal the gesture.
    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.drag-handle')) {
        // Prevent default only for the start of the drag interaction on the handle
        // No e.preventDefault() here as it might break clicks, 
        // the polyfill handles the conversion.
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  return null;
}
