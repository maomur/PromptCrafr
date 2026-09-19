/**
 * Aviso entre pestañas.
 *
 * IndexedDB no notifica cambios, así que dos pestañas abiertas se quedarían
 * cada una con su copia desfasada. Cuando una escribe, avisa por este canal y
 * las demás vuelven a leer.
 *
 * Hay **un solo canal por pestaña**, compartido entre emisor y oyente, y eso
 * es deliberado: la especificación excluye del reparto al objeto que publica,
 * pero no a los demás objetos de la misma pestaña. Con un canal para emitir y
 * otro para escuchar, cada escritura se avisaba a sí misma y provocaba una
 * relectura completa de la biblioteca, además de poder pisar una mutación aún
 * sin confirmar.
 */

const CHANNEL = 'promptcraft:library';

let channel: BroadcastChannel | null = null;
const listeners = new Set<() => void>();

function ensureChannel(): BroadcastChannel | null {
  if (channel) return channel;
  if (typeof BroadcastChannel === 'undefined') return null;

  channel = new BroadcastChannel(CHANNEL);
  channel.onmessage = () => {
    for (const listener of listeners) listener();
  };
  return channel;
}

/** Avisa al resto de pestañas de que la biblioteca ha cambiado. */
export function announceChange(): void {
  ensureChannel()?.postMessage('changed');
}

/** Escucha los cambios de otras pestañas. Devuelve la función para dejar de oír. */
export function onExternalChange(handler: () => void): () => void {
  ensureChannel();
  listeners.add(handler);
  return () => {
    listeners.delete(handler);
  };
}
