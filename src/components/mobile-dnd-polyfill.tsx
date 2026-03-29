
'use client';

import { useEffect } from 'react';

/**
 * Advanced Pointer-to-Drag Orchestrator.
 * This method manually intercepts pointer events to steal control from the 
 * browser's native scroll manager before it can cancel the drag gesture.
 */
export default function MobileDndPolyfill() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setupPolyfill = async () => {
      try {
        const { polyfill } = await import('mobile-drag-drop');
        const { scrollBehaviourDragImageTranslateOverride } = await import('mobile-drag-drop/scroll-behaviour');
        
        // 1. Initialize the polyfill with hardware-accelerated scroll handling
        polyfill({
          dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride,
          holdToDrag: 0, // Immediate initiation on the designated handle
          dragImageCenterOnPointer: true,
        });

        // 2. CRITICAL: Manual Event Interception
        // We use pointerdown (standardized across iOS/Android) to detect intent.
        const handlePointerDown = (e: PointerEvent) => {
          const target = e.target as HTMLElement;
          const handle = target.closest('.drag-handle');
          
          if (handle) {
            // We tell the browser: "I've got this". Prevent system gestures.
            document.body.classList.add('dragging-active');
            
            // Forcefully prevent default touch actions (like scrolling) for this interaction
            const preventScroll = (touchEvent: TouchEvent) => {
              if (touchEvent.cancelable) {
                touchEvent.preventDefault();
              }
            };

            // Non-passive listener to override the browser's scroll priority
            window.addEventListener('touchmove', preventScroll, { passive: false });

            // Cleanup when interaction ends
            const cleanup = () => {
              document.body.classList.remove('dragging-active');
              window.removeEventListener('touchmove', preventScroll);
              window.removeEventListener('touchend', cleanup);
              window.removeEventListener('touchcancel', cleanup);
            };

            window.addEventListener('touchend', cleanup, { once: true });
            window.addEventListener('touchcancel', cleanup, { once: true });
          }
        };

        // Attach the global interceptor in the capture phase
        window.addEventListener('pointerdown', handlePointerDown, { capture: true });

        return () => {
          window.removeEventListener('pointerdown', handlePointerDown);
        };
      } catch (err) {
        console.error('Mobile DND Polyfill error:', err);
      }
    };

    setupPolyfill();
  }, []);

  return null;
}
