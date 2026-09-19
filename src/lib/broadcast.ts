/**
 * Aviso entre pestañas.
 *
 * IndexedDB no notifica cambios, así que dos pestañas abiertas se quedarían
 * cada una con su copia desfasada. Cuando una escribe, avisa por este canal y
 * las demás vuelven a leer. Es lo que sustituye, dentro de un mismo navegador,
 * a la sincronización en vivo que daba el backend.
 */

const CHANNEL = 'promptcraft:library';

/** Avisa al resto de pestañas de que la biblioteca ha cambiado. */
export function announceChange(): void {
  if (typeof BroadcastChannel === 'undefined') return;

  const channel = new BroadcastChannel(CHANNEL);
  channel.postMessage('changed');
  channel.close();
}

/** Escucha los cambios de otras pestañas. Devuelve la función para dejar de oír. */
export function onExternalChange(handler: () => void): () => void {
  if (typeof BroadcastChannel === 'undefined') return () => {};

  const channel = new BroadcastChannel(CHANNEL);
  channel.onmessage = () => handler();
  return () => channel.close();
}
