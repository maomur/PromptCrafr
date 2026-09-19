'use client';

import { useEffect } from 'react';

/**
 * Registra el service worker que hace instalable la aplicación.
 *
 * Va en un componente y no en un <script> dentro del layout para que el layout
 * siga siendo un Server Component limpio y esto quede donde se entiende: en la
 * feature de PWA.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Sin service worker la aplicación funciona igual; sólo deja de ser
        // instalable y de responder sin conexión.
      });
    };

    // Esperamos a que cargue todo para no competir por el ancho de banda.
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });

    return () => window.removeEventListener('load', register);
  }, []);

  return null;
}
