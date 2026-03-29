
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
          holdToDrag: 0, // No delay when using drag-handle with touch-action: none
          dragImageCenterOnPointer: true,
        });

        // Global interceptor for touchstart to prevent default scroll when touching a drag handle
        const handleTouchStart = (e: TouchEvent) => {
          const target = e.target as HTMLElement;
          if (target.closest('.drag-handle')) {
            // Check if the touch is cancelable before preventing default
            if (e.cancelable) {
              // We don't preventDefault here to let the polyfill work, 
              // but we signal the UI to stay ready
              document.body.classList.add('dnd-active');
            }
          }
        };

        const handleTouchMove = (e: TouchEvent) => {
          if (document.body.classList.contains('dnd-active') || document.body.classList.contains('dragging-active')) {
            if (e.cancelable) {
              e.preventDefault();
            }
          }
        };

        const handleDragEnd = () => {
          document.body.classList.remove('dragging-active');
          document.body.classList.remove('dnd-active');
        };

        const handleDragStart = () => {
          document.body.classList.add('dragging-active');
        };

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
