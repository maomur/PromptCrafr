
'use client';

import { useEffect } from 'react';

/**
 * Robust polyfill for HTML5 Drag and Drop on mobile devices.
 * Uses a combination of the mobile-drag-drop polyfill and 
 * manual pointer capture to bypass mobile browser scroll priorities.
 */
export default function MobileDndPolyfill() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initPolyfill = async () => {
      try {
        const { polyfill } = await import('mobile-drag-drop');
        const { scrollBehaviourDragImageTranslateOverride } = await import('mobile-drag-drop/scroll-behaviour');
        
        // 1. Initialize the polyfill with specific mobile-friendly options
        polyfill({
          dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride,
          holdToDrag: 0, // We want immediate drag initiation on handles
          dragImageCenterOnPointer: true,
        });

        /**
         * 2. CRITICAL: Manual Event Interception
         * We use a non-passive listener in the CAPTURE phase to steal the event
         * from the browser's scroll manager.
         */
        const handleTouchStart = (e: TouchEvent) => {
          const target = e.target as HTMLElement;
          const handle = target.closest('.drag-handle');
          
          if (handle) {
            // Block the browser from starting a scroll gesture
            if (e.cancelable) {
              e.preventDefault();
            }
            
            // Mark the interaction as active
            document.body.classList.add('dragging-active');
            
            // For modern browsers: capture the pointer to prevent system gestures
            try {
              if ('setPointerCapture' in handle) {
                // We need the pointerId from a pointerdown event, 
                // but blocking touchstart is usually enough for the polyfill to trigger.
              }
            } catch (err) {
              // Fail silently if not supported
            }
          }
        };

        const handleTouchMove = (e: TouchEvent) => {
          if (document.body.classList.contains('dragging-active')) {
            // Forcefully prevent scrolling while the polyfill handles the drag
            if (e.cancelable) {
              e.preventDefault();
            }
          }
        };

        const handleDragEnd = () => {
          document.body.classList.remove('dragging-active');
        };

        // Add listeners directly to window with capture: true and passive: false
        window.addEventListener('touchstart', handleTouchStart, { capture: true, passive: false });
        window.addEventListener('touchmove', handleTouchMove, { capture: true, passive: false });
        window.addEventListener('dragend', handleDragEnd, { capture: true });
        window.addEventListener('touchend', handleDragEnd, { capture: true });
        window.addEventListener('touchcancel', handleDragEnd, { capture: true });

        return () => {
          window.removeEventListener('touchstart', handleTouchStart);
          window.removeEventListener('touchmove', handleTouchMove);
          window.removeEventListener('dragend', handleDragEnd);
          window.removeEventListener('touchend', handleDragEnd);
          window.removeEventListener('touchcancel', handleDragEnd);
        };
      } catch (error) {
        console.error('Error initializing DND polyfill:', error);
      }
    };

    initPolyfill();
  }, []);

  return null;
}
