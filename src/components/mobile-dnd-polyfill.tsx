
'use client';

import { useEffect } from 'react';

/**
 * Robust polyfill for HTML5 Drag and Drop on mobile devices.
 * Intercepts touch events on drag handles to prevent browser scroll
 * and initiate the drag process immediately.
 */
export default function MobileDndPolyfill() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initPolyfill = async () => {
      try {
        const { polyfill } = await import('mobile-drag-drop');
        const { scrollBehaviourDragImageTranslateOverride } = await import('mobile-drag-drop/scroll-behaviour');
        
        // Initialize the polyfill
        polyfill({
          dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride,
          holdToDrag: 0, // Instant drag on handles
          dragImageCenterOnPointer: true,
        });

        // CRITICAL: Non-passive touchstart listener to block scroll on handles
        const handleTouchStart = (e: TouchEvent) => {
          const target = e.target as HTMLElement;
          const handle = target.closest('.drag-handle');
          
          if (handle) {
            // Check if we can prevent default (essential for drag to start)
            if (e.cancelable) {
              // We don't preventDefault yet to let the polyfill detect it,
              // but we mark the body to help the global move listener
              document.body.classList.add('dnd-active');
            }
          }
        };

        const handleTouchMove = (e: TouchEvent) => {
          if (document.body.classList.contains('dragging-active') || document.body.classList.contains('dnd-active')) {
            // Prevent scrolling while dragging
            if (e.cancelable) {
              e.preventDefault();
            }
          }
        };

        const handleDragStart = () => {
          document.body.classList.add('dragging-active');
        };

        const handleDragEnd = () => {
          document.body.classList.remove('dragging-active');
          document.body.classList.remove('dnd-active');
        };

        // Add listeners directly to window with passive: false to allow preventDefault
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('dragstart', handleDragStart);
        window.addEventListener('dragend', handleDragEnd);
        window.addEventListener('touchend', () => document.body.classList.remove('dnd-active'));

        return () => {
          window.removeEventListener('touchstart', handleTouchStart);
          window.removeEventListener('touchmove', handleTouchMove);
          window.removeEventListener('dragstart', handleDragStart);
          window.removeEventListener('dragend', handleDragEnd);
        };
      } catch (error) {
        console.error('Error initializing DND polyfill:', error);
      }
    };

    initPolyfill();
  }, []);

  return null;
}
