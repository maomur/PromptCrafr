'use client';

import { useEffect } from 'react';

/**
 * Mobile Drag-Drop Polyfill - Enhanced Implementation.
 * This version uses a non-passive capture phase listener to prevent
 * the browser from stealing touch events for scrolling.
 */
export default function MobileDndPolyfill() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Initialize the polyfill
    const initPolyfill = async () => {
      try {
        await import('drag-drop-touch');
        console.log('DragDropTouch polyfill loaded');
      } catch (err) {
        console.error('Failed to load DragDropTouch polyfill:', err);
      }
    };

    initPolyfill();

    // 2. Critical: Intercept touchstart to prevent scrolling on handles
    // We use { passive: false } to allow e.preventDefault()
    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.drag-handle')) {
        // If we touch a handle, we MUST prevent the browser from starting a scroll
        // This gives the polyfill the chance to start a drag event instead.
        e.stopPropagation();
        // We don't preventDefault here because the polyfill needs the sequence
        // but we ensure the container doesn't scroll via touch-action: none in CSS.
      }
    };

    // 3. Block system-level scrolling while a drag is active
    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.drag-handle') || document.body.classList.contains('dragging-active')) {
        // If we are touching the handle or dragging, strictly forbid scrolling
        if (e.cancelable) e.preventDefault();
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { capture: true, passive: true });
    window.addEventListener('touchmove', handleTouchMove, { capture: true, passive: false });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart, { capture: true });
      window.removeEventListener('touchmove', handleTouchMove, { capture: true });
    };
  }, []);

  return null;
}
